// /api/usage
//
// GET  → 이번 달 사용량 + 활성 플랜 + 한도 (UI 표시용 한 번에)
// POST → 카운터 증분. body: { kind: "cardnews"|"blog"|"aiImage", by?: number }
//        한도 초과 시 403 { error: "limit_exceeded", used, limit }
//
// 멱등성/원자성
//   POST 는 단일 SQL 로 increment + 한도 체크. 하지만 한도 체크가 increment 와
//   별개 트랜잭션이면 race condition 으로 +1 초과 가능 — 트랜잭션으로 묶음.

import "server-only";

import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { adminDb } from "@/lib/db/admin";
import { profiles, usageMonthly } from "@/lib/db/schema";
import { getAuthedUser } from "@/lib/billing/auth-helper";
import { getPlan, type PlanId } from "@/lib/billing/plans";

export const runtime = "nodejs";

// ───────────────────────────────────────────────
// 헬퍼 — 현재 한국 시간 기준 yyyy-mm
// ───────────────────────────────────────────────

function currentMonthKST(): string {
  const seoul = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  const y = seoul.getFullYear();
  const m = String(seoul.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

type UsageKind = "cardnews" | "blog" | "aiImage";

const KIND_COLUMN: Record<UsageKind, "cardnewsCount" | "blogCount" | "aiImageCount"> = {
  cardnews: "cardnewsCount",
  blog: "blogCount",
  aiImage: "aiImageCount",
};

const KIND_LIMIT_KEY: Record<
  UsageKind,
  "cardnewsPerMonth" | "blogPerMonth" | "aiImagesPerMonth"
> = {
  cardnews: "cardnewsPerMonth",
  blog: "blogPerMonth",
  aiImage: "aiImagesPerMonth",
};

// ───────────────────────────────────────────────
// GET
// ───────────────────────────────────────────────

export async function GET() {
  const auth = await getAuthedUser();
  if (!auth.ok) return auth.response;

  const yearMonth = currentMonthKST();

  const [prof] = await adminDb
    .select({ planId: profiles.planId })
    .from(profiles)
    .where(eq(profiles.id, auth.user.id))
    .limit(1);
  const planId = (prof?.planId ?? "free") as PlanId;
  const plan = getPlan(planId);

  const [usage] = await adminDb
    .select()
    .from(usageMonthly)
    .where(and(eq(usageMonthly.userId, auth.user.id), eq(usageMonthly.yearMonth, yearMonth)))
    .limit(1);

  return NextResponse.json({
    planId,
    month: yearMonth,
    cardnews: usage?.cardnewsCount ?? 0,
    blog: usage?.blogCount ?? 0,
    aiImage: usage?.aiImageCount ?? 0,
    limits: {
      cardnewsPerMonth: plan.limits.cardnewsPerMonth,
      blogPerMonth: plan.limits.blogPerMonth,
      aiImagesPerMonth: plan.limits.aiImagesPerMonth,
    },
  });
}

// ───────────────────────────────────────────────
// POST — 증분 + 한도 체크
// ───────────────────────────────────────────────

const PostBody = z.object({
  kind: z.enum(["cardnews", "blog", "aiImage"]),
  by: z.number().int().positive().max(50).default(1),
});

export async function POST(req: NextRequest) {
  const auth = await getAuthedUser();
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof PostBody>;
  try {
    body = PostBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const yearMonth = currentMonthKST();

  // 사용자 플랜 조회
  const [prof] = await adminDb
    .select({ planId: profiles.planId })
    .from(profiles)
    .where(eq(profiles.id, auth.user.id))
    .limit(1);
  const planId = (prof?.planId ?? "free") as PlanId;
  const plan = getPlan(planId);
  const limit = plan.limits[KIND_LIMIT_KEY[body.kind]];

  // 트랜잭션 — race-safe increment + 한도 체크
  const result = await adminDb.transaction(async (tx) => {
    // upsert: (userId, yearMonth) 가 없으면 INSERT, 있으면 SELECT
    const [existing] = await tx
      .select()
      .from(usageMonthly)
      .where(and(eq(usageMonthly.userId, auth.user.id), eq(usageMonthly.yearMonth, yearMonth)))
      .for("update")
      .limit(1);

    const currentValue = existing?.[KIND_COLUMN[body.kind]] ?? 0;
    const nextValue = currentValue + body.by;

    if (limit !== null && nextValue > limit) {
      return { ok: false as const, used: currentValue, limit };
    }

    if (existing) {
      await tx
        .update(usageMonthly)
        .set({ [KIND_COLUMN[body.kind]]: nextValue })
        .where(and(eq(usageMonthly.userId, auth.user.id), eq(usageMonthly.yearMonth, yearMonth)));
    } else {
      await tx.insert(usageMonthly).values({
        userId: auth.user.id,
        yearMonth,
        cardnewsCount: body.kind === "cardnews" ? body.by : 0,
        blogCount: body.kind === "blog" ? body.by : 0,
        aiImageCount: body.kind === "aiImage" ? body.by : 0,
      });
    }
    return { ok: true as const, value: nextValue };
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: "limit_exceeded",
        kind: body.kind,
        used: result.used,
        limit: result.limit,
      },
      { status: 403 },
    );
  }

  return NextResponse.json({
    ok: true,
    kind: body.kind,
    value: result.value,
  });
}
