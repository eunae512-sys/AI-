// /billing/success
//
// Toss billingAuth 가 성공 → /api/billing/auth/success 가 billingKey 저장 → 여기로 redirect.
//
// 흐름:
//   · 카드 등록은 이미 끝났다.
//   · 쿼리스트링으로 planId/cycle 이 같이 넘어오면 자동으로 /api/billing/subscribe 를 호출해
//     trialing 구독을 만들고 대시보드로 보낸다.
//   · planId 가 없으면 단순 "카드 등록 완료" 안내만.

import { Suspense } from "react";
import { BillingSuccessClient } from "./client";

export const metadata = {
  title: "결제수단 등록 완료",
  robots: { index: false, follow: false },
};

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={null}>
      <BillingSuccessClient />
    </Suspense>
  );
}
