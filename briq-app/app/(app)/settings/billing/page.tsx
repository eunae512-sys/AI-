// /(app)/settings/billing — 결제 / 구독 관리.
//
// 표시 내용
//   · 활성 카드 (마스킹된 카드번호, 카드사) — 없으면 "등록하기" CTA
//   · 구독 (플랜·상태·다음 결제일·해지 예약 여부)
//   · 결제 내역 5건
//
// 액션
//   · 카드 재등록 → SubscribeButton (planId 없이 단순 등록도 가능하도록 별도 simple-mode)
//   · 해지 / 해지 취소

import { Metadata } from "next";
import { BillingSettingsClient } from "./client";

export const metadata: Metadata = {
  title: "결제 · 구독",
  robots: { index: false, follow: false },
};

export default function BillingSettingsPage() {
  return <BillingSettingsClient />;
}
