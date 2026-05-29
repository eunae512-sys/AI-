// 결제 도메인 계산 — 가격, 다음 청구일, orderId 생성 등.
//
// 진실의 단일 출처:
//   · 가격: lib/billing/plans.ts 의 PLANS
//   · 사이클 길이: 여기 (월/연)
//   · KST 기준 시간 처리: 여기

import "server-only";

import { randomUUID } from "node:crypto";

import { PLANS, type PlanId } from "./plans";

export type BillingCycle = "monthly" | "annual";

// ───────────────────────────────────────────────
// 가격 계산
// ───────────────────────────────────────────────
//
// monthly: PLANS[].priceMonthly 그대로
// annual:  PLANS[].priceAnnualMonthly × 12 (연납 한 번에 청구)

export function calcChargeAmount(planId: PlanId, cycle: BillingCycle): number {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error(`unknown plan: ${planId}`);
  if (plan.priceMonthly === 0) return 0;
  return cycle === "monthly" ? plan.priceMonthly : plan.priceAnnualMonthly * 12;
}

// ───────────────────────────────────────────────
// 다음 청구일 계산
// ───────────────────────────────────────────────
//
// 월 사이클: +1개월, 같은 일자. 31일 → 다음달 말일로 clamp.
// 연 사이클: +1년.
// 모두 KST(Asia/Seoul) 자정 기준이 아니라, 단순히 정확히 +1m/+1y 적용.
// (사용자 체감 청구일이 시점 일자에 맞춰지길 원함.)

export function calcNextPeriodEnd(from: Date, cycle: BillingCycle): Date {
  const d = new Date(from.getTime());
  if (cycle === "monthly") {
    const targetMonth = d.getUTCMonth() + 1;
    const targetYear = d.getUTCFullYear() + Math.floor(targetMonth / 12);
    const monthInYear = targetMonth % 12;
    const originalDate = d.getUTCDate();
    d.setUTCFullYear(targetYear, monthInYear, 1);
    const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, monthInYear + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(originalDate, lastDayOfTargetMonth));
  } else {
    d.setUTCFullYear(d.getUTCFullYear() + 1);
  }
  return d;
}

// 무료체험 기간 (확정값)
export const TRIAL_DAYS = 14;

export function calcTrialEnd(from: Date, days = TRIAL_DAYS): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

// ───────────────────────────────────────────────
// orderId / customerKey
// ───────────────────────────────────────────────
//
// orderId: 우리가 만드는 멱등 키. Toss 규칙: 6-64자 영숫자/_/-.
//          중복 시 Toss 가 같은 결과를 돌려주므로 cron 재시도에 활용 가능.
// customerKey: 사용자별 1개, 영구. UUID v4 — Toss 보안 권고.

export function newOrderId(prefix = "briq"): string {
  // 32자 base32-ish — Toss 제한 64자 안.
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

export function newCustomerKey(): string {
  return randomUUID();
}

// ───────────────────────────────────────────────
// orderName — Toss 결제 영수증 / 카드사 메시지에 표시
// ───────────────────────────────────────────────

export function orderNameFor(planId: PlanId, cycle: BillingCycle): string {
  const plan = PLANS.find((p) => p.id === planId);
  const name = plan?.name ?? planId;
  return cycle === "monthly" ? `BRIQ ${name} 월 이용권` : `BRIQ ${name} 연 이용권`;
}
