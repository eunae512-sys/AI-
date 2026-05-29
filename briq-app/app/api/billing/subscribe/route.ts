// POST /api/billing/subscribe
//
// 사용자 흐름:
//  1) 카드 등록 완료 (billing_keys 에 활성 행 있음)
//  2) 플랜·사이클 선택 → 이 라우트 호출
//  3) trialing 구독 INSERT, trial_ends_at = +14일, current_period_end = +14일
//
// 14일 trial 동안은 결제 호출 없음. trial 종료일에 cron 이 첫 청구를 수행.
//
// 이미 trialing/active/past_due 구독이 있으면 409.
//
// Body: { planId: "pro"|"studio"|"agency", cycle: "monthly"|"annual" }

import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { adminDb } from "@/lib/db/admin";
import {
  billingKeys,
  profiles,
  subscriptions,
} from "@/lib/db/schema";
import { getAuthedUser } from "@/lib/billing/auth-helper";
import {
  calcChargeAmount,
  calcTrialEnd,
  type BillingCycle,
} from "@/lib/billing/billing-domain";

export const runtime = "nodejs";

const BodySchema = z.object({
  planId: z.enum(["pro", "studio", "agency"]),
  cycle: z.enum(["monthly", "annual"]),
});

export async function POST(req: NextRequest) {
  const auth = await getAuthedUser();
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // 활성 billingKey 필수
  const card = await adminDb
    .select()
    .from(billingKeys)
    .where(and(eq(billingKeys.userId, auth.user.id), isNull(billingKeys.deletedAt)))
    .limit(1);
  if (card.length === 0) {
    return NextResponse.json({ error: "billing_key_missing" }, { status: 412 });
  }

  // 중복 구독 차단
  const existing = await adminDb
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, auth.user.id),
        inArray(subscriptions.status, ["trialing", "active", "past_due"]),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "subscription_already_active" }, { status: 409 });
  }

  const now = new Date();
  const trialEnd = calcTrialEnd(now);
  const amount = calcChargeAmount(body.planId, body.cycle as BillingCycle);

  const [created] = await adminDb
    .insert(subscriptions)
    .values({
      userId: auth.user.id,
      planId: body.planId,
      status: "trialing",
      billingCycle: body.cycle,
      billingKeyId: card[0].id,
      trialEndsAt: trialEnd,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      priceAmount: amount,
    })
    .returning();

  // profiles 캐시 갱신
  await adminDb
    .update(profiles)
    .set({
      planId: body.planId,
      currentPeriodEnd: trialEnd,
      trialEndsAt: trialEnd,
    })
    .where(eq(profiles.id, auth.user.id));

  return NextResponse.json({
    subscription: {
      id: created.id,
      planId: created.planId,
      status: created.status,
      trialEndsAt: created.trialEndsAt,
      currentPeriodEnd: created.currentPeriodEnd,
    },
  });
}
