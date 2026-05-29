// POST /api/billing/cancel
//
// 정기결제 해지. 다음 결제일까지 plan 권한은 유지하고, 그 날에 cron 이 청구 대신 cancelled 로 전이.
// (사용자가 trial 중에 해지하면 trial_ends_at 까지 plan 권한 유지, 그 다음 cancelled.)
//
// Body 옵션: { reason?: string }
// 응답: { cancelledAt, currentPeriodEnd }

import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { adminDb } from "@/lib/db/admin";
import { subscriptions } from "@/lib/db/schema";
import { getAuthedUser } from "@/lib/billing/auth-helper";

export const runtime = "nodejs";

const BodySchema = z.object({ reason: z.string().max(500).optional() });

export async function POST(req: NextRequest) {
  const auth = await getAuthedUser();
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof BodySchema> = {};
  try {
    const text = await req.text();
    if (text) body = BodySchema.parse(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const [active] = await adminDb
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, auth.user.id),
        inArray(subscriptions.status, ["trialing", "active", "past_due"]),
      ),
    )
    .limit(1);

  if (!active) {
    return NextResponse.json(
      { error: "no_active_subscription" },
      { status: 404 },
    );
  }

  const now = new Date();
  const [updated] = await adminDb
    .update(subscriptions)
    .set({
      cancelAtPeriodEnd: true,
      cancelledAt: now,
      cancelReason: body.reason ?? null,
    })
    .where(eq(subscriptions.id, active.id))
    .returning();

  return NextResponse.json({
    cancelledAt: updated.cancelledAt,
    currentPeriodEnd: updated.currentPeriodEnd,
    message: "다음 결제일에 자동결제가 종료됩니다.",
  });
}
