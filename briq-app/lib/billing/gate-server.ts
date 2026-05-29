// 서버 사이드 플랜·한도 enforcement.
//
// 사용처: AI 생성 API 라우트 (`/api/generate-blog`, `/api/generate-image`,
// `/api/compose-cardnews` 등) 진입 시점에 호출.
//
// 기본 정책: 로그인 사용자만 enforcement 적용. 비로그인은 데모 모드로 통과.
//   (운영에서 비로그인 호출이 곤란하면 라우트별로 별도 가드 추가.)
//
// 반환:
//   { ok: true, planId } — 진행 가능
//   { ok: false, reason: "unauthorized" | "feature_locked" | "limit_exceeded", ... }

import "server-only";

import { and, eq } from "drizzle-orm";

import { adminDb } from "@/lib/db/admin";
import { profiles, usageMonthly } from "@/lib/db/schema";
import { getAuthedUser } from "@/lib/billing/auth-helper";
import { isFeatureAllowed, type FeatureKey } from "@/lib/billing/gate";
import { getPlan, type PlanId } from "@/lib/billing/plans";

type GateInput = {
  /** 기능 키 — 플랜 잠금 체크. 없으면 한도 체크만. */
  feature?: FeatureKey;
  /** 사용량 종류 — 지정 시 현재 월 한도 체크. */
  usage?: { kind: "cardnews" | "blog" | "aiImage" };
};

export type GateResult =
  | { ok: true; planId: PlanId; userId: string }
  | { ok: false; status: 401; reason: "unauthorized" }
  | { ok: false; status: 402; reason: "feature_locked"; feature: FeatureKey; planId: PlanId }
  | {
      ok: false;
      status: 403;
      reason: "limit_exceeded";
      kind: "cardnews" | "blog" | "aiImage";
      used: number;
      limit: number;
      planId: PlanId;
    };

function currentMonthKST(): string {
  const seoul = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  const y = seoul.getFullYear();
  const m = String(seoul.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * AI 생성 진입 가드.
 *
 * @example
 *   const gate = await ensurePlanAndQuota({
 *     feature: "blog:create",
 *     usage: { kind: "blog" },
 *   });
 *   if (!gate.ok) return NextResponse.json(gate, { status: gate.status });
 *   // ... 실제 처리 ...
 */
export async function ensurePlanAndQuota(input: GateInput): Promise<GateResult> {
  const auth = await getAuthedUser();
  if (!auth.ok) return { ok: false, status: 401, reason: "unauthorized" };

  const [prof] = await adminDb
    .select({ planId: profiles.planId })
    .from(profiles)
    .where(eq(profiles.id, auth.user.id))
    .limit(1);
  const planId = (prof?.planId ?? "free") as PlanId;

  // 1) 기능 잠금
  if (input.feature && !isFeatureAllowed(input.feature, planId)) {
    return {
      ok: false,
      status: 402, // Payment Required — 업그레이드 필요
      reason: "feature_locked",
      feature: input.feature,
      planId,
    };
  }

  // 2) 한도 체크
  if (input.usage) {
    const limitMap = {
      cardnews: getPlan(planId).limits.cardnewsPerMonth,
      blog: getPlan(planId).limits.blogPerMonth,
      aiImage: getPlan(planId).limits.aiImagesPerMonth,
    } as const;
    const limit = limitMap[input.usage.kind];
    if (limit !== null) {
      const yearMonth = currentMonthKST();
      const [row] = await adminDb
        .select()
        .from(usageMonthly)
        .where(
          and(
            eq(usageMonthly.userId, auth.user.id),
            eq(usageMonthly.yearMonth, yearMonth),
          ),
        )
        .limit(1);
      const used =
        input.usage.kind === "cardnews"
          ? row?.cardnewsCount ?? 0
          : input.usage.kind === "blog"
          ? row?.blogCount ?? 0
          : row?.aiImageCount ?? 0;
      if (used >= limit) {
        return {
          ok: false,
          status: 403,
          reason: "limit_exceeded",
          kind: input.usage.kind,
          used,
          limit,
          planId,
        };
      }
    }
  }

  return { ok: true, planId, userId: auth.user.id };
}

/**
 * 성공한 작업 후 사용량을 +1 한다. 한도 체크는 ensurePlanAndQuota 가 이미 했음.
 * (트랜잭션이 분리돼 있어 race 시 +1 초과 가능 — 실용상 허용 범위.)
 */
export async function bumpUsage(
  userId: string,
  kind: "cardnews" | "blog" | "aiImage",
  by = 1,
): Promise<void> {
  const yearMonth = currentMonthKST();
  const column =
    kind === "cardnews"
      ? "cardnewsCount"
      : kind === "blog"
      ? "blogCount"
      : "aiImageCount";

  await adminDb.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(usageMonthly)
      .where(and(eq(usageMonthly.userId, userId), eq(usageMonthly.yearMonth, yearMonth)))
      .for("update")
      .limit(1);

    if (existing) {
      const curr =
        column === "cardnewsCount"
          ? existing.cardnewsCount
          : column === "blogCount"
          ? existing.blogCount
          : existing.aiImageCount;
      await tx
        .update(usageMonthly)
        .set({ [column]: curr + by })
        .where(and(eq(usageMonthly.userId, userId), eq(usageMonthly.yearMonth, yearMonth)));
    } else {
      await tx.insert(usageMonthly).values({
        userId,
        yearMonth,
        cardnewsCount: kind === "cardnews" ? by : 0,
        blogCount: kind === "blog" ? by : 0,
        aiImageCount: kind === "aiImage" ? by : 0,
      });
    }
  });
}
