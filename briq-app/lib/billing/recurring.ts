// 정기결제 cron 의 핵심 로직.
//
// 호출 트리거: /api/cron/recurring-billing (매일 KST 09:00, UTC 00:00)
//
// 처리 대상 (모두 admin DB 권한)
//   1) 오늘까지 current_period_end 가 지난 trialing/active/past_due 구독
//   2) cancel_at_period_end=true 인 구독 → cancelled 전이 (청구 안 함)
//   3) 그 외 → Toss 청구 시도
//
// 재시도 정책
//   · 1차 실패: failure_count=1, last_failure_at=now, next attempt 1일 후 (period_end +1d)
//   · 2차 실패: failure_count=2, next 3일 후
//   · 3차 실패: failure_count=3, next 7일 후
//   · 4차 실패: status=cancelled, cancel_reason="payment_failed_max_retries"
//
// 멱등성: 한 구독에 대해 같은 날 두 번 호출돼도 안전해야 함 — orderId 가 (subscriptionId + period_end)
// 결정적으로 생성되어 payment_history 의 UNIQUE 제약이 두 번째 INSERT 를 막는다.

import "server-only";

import { and, eq, inArray, lte } from "drizzle-orm";
import { createHash } from "node:crypto";

import { adminDb } from "@/lib/db/admin";
import {
  billingKeys,
  paymentHistory,
  profiles,
  subscriptions,
} from "@/lib/db/schema";
import {
  calcNextPeriodEnd,
  orderNameFor,
  type BillingCycle,
} from "./billing-domain";
import {
  chargeBillingKey,
  isUserCardError,
  TossApiError,
} from "./toss-server";

const RETRY_DELAYS_DAYS = [1, 3, 7]; // 1차/2차/3차 실패 후 다음 시도까지의 일수
const MAX_FAILURES = 3;

type CronResult = {
  scannedAt: string;
  totalCandidates: number;
  cancelledAtPeriodEnd: number;
  paid: number;
  retryScheduled: number;
  hardCancelled: number;
  errors: { subscriptionId: string; reason: string }[];
};

export async function runRecurringBilling(): Promise<CronResult> {
  const now = new Date();
  const result: CronResult = {
    scannedAt: now.toISOString(),
    totalCandidates: 0,
    cancelledAtPeriodEnd: 0,
    paid: 0,
    retryScheduled: 0,
    hardCancelled: 0,
    errors: [],
  };

  // ── 1) 만료 후보 조회 ──
  const candidates = await adminDb
    .select()
    .from(subscriptions)
    .where(
      and(
        inArray(subscriptions.status, ["trialing", "active", "past_due"]),
        lte(subscriptions.currentPeriodEnd, now),
      ),
    );

  result.totalCandidates = candidates.length;

  for (const sub of candidates) {
    try {
      // ── 2) 해지 예약된 구독: 청구 없이 cancelled 전이 ──
      if (sub.cancelAtPeriodEnd) {
        await adminDb
          .update(subscriptions)
          .set({ status: "cancelled" })
          .where(eq(subscriptions.id, sub.id));
        await adminDb
          .update(profiles)
          .set({ planId: "free", currentPeriodEnd: null, trialEndsAt: null })
          .where(eq(profiles.id, sub.userId));
        result.cancelledAtPeriodEnd++;
        continue;
      }

      // ── 3) billingKey 조회 ──
      if (!sub.billingKeyId) {
        await markFailureFinal(sub.id, sub.userId, "billing_key_missing");
        result.hardCancelled++;
        continue;
      }
      const [card] = await adminDb
        .select()
        .from(billingKeys)
        .where(eq(billingKeys.id, sub.billingKeyId))
        .limit(1);
      if (!card || card.deletedAt) {
        await markFailureFinal(sub.id, sub.userId, "billing_key_deleted");
        result.hardCancelled++;
        continue;
      }

      // ── 4) 결정적 orderId ──
      const orderId = deterministicOrderId(sub.id, sub.currentPeriodEnd);

      // ── 5) 사용자 email (영수증용) ──
      const [profile] = await adminDb
        .select({ email: profiles.email })
        .from(profiles)
        .where(eq(profiles.id, sub.userId))
        .limit(1);

      // ── 6) payment_history pending row 선기록 ──
      // INSERT 가 두 번째 호출에서 UNIQUE 위반으로 막혀 멱등성 자동 보장.
      try {
        await adminDb.insert(paymentHistory).values({
          userId: sub.userId,
          subscriptionId: sub.id,
          orderId,
          amount: sub.priceAmount,
          status: "pending",
        });
      } catch (err) {
        // 이미 같은 orderId 가 처리됐다 — 같은 사이클 두 번 청구 방지
        console.warn(`[cron] orderId ${orderId} 이미 존재. skip`, err);
        continue;
      }

      // ── 7) Toss 자동결제 호출 ──
      try {
        const resp = await chargeBillingKey({
          billingKey: card.tossBillingKey,
          customerKey: card.customerKey,
          amount: sub.priceAmount,
          orderId,
          orderName: orderNameFor(sub.planId, sub.billingCycle as BillingCycle),
          customerEmail: profile?.email,
        });

        // 성공
        const newPeriodStart = sub.currentPeriodEnd;
        const newPeriodEnd = calcNextPeriodEnd(
          newPeriodStart,
          sub.billingCycle as BillingCycle,
        );

        await adminDb
          .update(paymentHistory)
          .set({
            status: "paid",
            tossPaymentKey: resp.paymentKey,
            method: resp.method,
            receiptUrl: resp.receipt?.url ?? null,
            paidAt: resp.approvedAt ? new Date(resp.approvedAt) : new Date(),
          })
          .where(eq(paymentHistory.orderId, orderId));

        await adminDb
          .update(subscriptions)
          .set({
            status: "active",
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd,
            failureCount: 0,
            lastFailureAt: null,
          })
          .where(eq(subscriptions.id, sub.id));

        await adminDb
          .update(profiles)
          .set({
            planId: sub.planId,
            currentPeriodEnd: newPeriodEnd,
            trialEndsAt: null,
          })
          .where(eq(profiles.id, sub.userId));

        result.paid++;
      } catch (err) {
        await handleChargeFailure(sub, orderId, err, result);
      }
    } catch (err) {
      console.error("[cron] subscription processing error", sub.id, err);
      result.errors.push({
        subscriptionId: sub.id,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}

// ───────────────────────────────────────────────
// 헬퍼
// ───────────────────────────────────────────────

function deterministicOrderId(subscriptionId: string, periodEnd: Date): string {
  const hash = createHash("sha256")
    .update(`${subscriptionId}|${periodEnd.toISOString()}`)
    .digest("hex")
    .slice(0, 24);
  return `briq_${hash}`;
}

async function handleChargeFailure(
  sub: typeof subscriptions.$inferSelect,
  orderId: string,
  err: unknown,
  result: CronResult,
) {
  const code = err instanceof TossApiError ? err.code : "unknown";
  const message = err instanceof Error ? err.message : String(err);

  await adminDb
    .update(paymentHistory)
    .set({
      status: "failed",
      failureCode: code,
      failureMessage: message.slice(0, 1000),
    })
    .where(eq(paymentHistory.orderId, orderId));

  const nextFailureCount = sub.failureCount + 1;

  if (nextFailureCount > MAX_FAILURES || !isUserCardError(err)) {
    // 시스템 에러는 즉시 끊지 말고 1회 추가 시도 — 그래도 max 초과면 hard cancel
    if (nextFailureCount > MAX_FAILURES) {
      await markFailureFinal(sub.id, sub.userId, `payment_failed_max_retries:${code}`);
      result.hardCancelled++;
      return;
    }
  }

  // retry 스케줄 — current_period_end 를 미래로 미뤄 다음 cron 사이클에 잡히게
  const delayDays =
    RETRY_DELAYS_DAYS[Math.min(nextFailureCount - 1, RETRY_DELAYS_DAYS.length - 1)];
  const nextAttempt = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000);

  await adminDb
    .update(subscriptions)
    .set({
      status: "past_due",
      failureCount: nextFailureCount,
      lastFailureAt: new Date(),
      currentPeriodEnd: nextAttempt,
    })
    .where(eq(subscriptions.id, sub.id));

  result.retryScheduled++;
}

async function markFailureFinal(
  subscriptionId: string,
  userId: string,
  reason: string,
) {
  await adminDb
    .update(subscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: reason,
    })
    .where(eq(subscriptions.id, subscriptionId));

  await adminDb
    .update(profiles)
    .set({ planId: "free", currentPeriodEnd: null, trialEndsAt: null })
    .where(eq(profiles.id, userId));
}
