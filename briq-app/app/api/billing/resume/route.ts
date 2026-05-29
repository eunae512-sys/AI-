// POST /api/billing/resume
//
// 해지 예약 취소. cancel_at_period_end=true 이고 아직 current_period_end 가 안 지난 경우만 가능.

import "server-only";

import { and, eq, gt, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { adminDb } from "@/lib/db/admin";
import { subscriptions } from "@/lib/db/schema";
import { getAuthedUser } from "@/lib/billing/auth-helper";

export const runtime = "nodejs";

export async function POST() {
  const auth = await getAuthedUser();
  if (!auth.ok) return auth.response;

  const now = new Date();

  const [active] = await adminDb
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, auth.user.id),
        eq(subscriptions.cancelAtPeriodEnd, true),
        inArray(subscriptions.status, ["trialing", "active", "past_due"]),
        gt(subscriptions.currentPeriodEnd, now),
      ),
    )
    .limit(1);

  if (!active) {
    return NextResponse.json(
      { error: "no_cancelable_subscription" },
      { status: 404 },
    );
  }

  const [updated] = await adminDb
    .update(subscriptions)
    .set({
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      cancelReason: null,
    })
    .where(eq(subscriptions.id, active.id))
    .returning();

  return NextResponse.json({
    subscriptionId: updated.id,
    currentPeriodEnd: updated.currentPeriodEnd,
    message: "정기결제가 다시 활성화되었습니다.",
  });
}
