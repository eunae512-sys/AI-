// Toss Payments — 브라우저 측 SDK 헬퍼.
//
// 책임:
//   · SDK lazy load (@tosspayments/payment-sdk)
//   · customer-key 발급 + requestBillingAuth() 호출 → Toss 결제창 띄움
//
// 호출 흐름:
//   1) 서버에서 customer-key 발급 (POST /api/billing/customer-key)
//   2) 그 키로 SDK.requestBillingAuth("카드", { customerKey, successUrl, failUrl, customerEmail })
//   3) 사용자가 카드 정보 입력 → Toss 가 successUrl 로 redirect
//   4) /api/billing/auth/success 가 authKey → billingKey 교환

"use client";

import { loadTossPayments } from "@tosspayments/payment-sdk";

export type StartBillingAuthArgs = {
  planId: "pro" | "studio" | "agency";
  cycle: "monthly" | "annual";
  customerEmail?: string;
  customerName?: string;
};

/** 결제수단 등록 흐름을 시작한다. 성공 시 Toss 결제창으로 리다이렉트됨 (이 함수는 반환 안 됨). */
export async function startBillingAuth(args: StartBillingAuthArgs): Promise<void> {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) {
    throw new BillingNotReadyError(
      "결제 시스템 준비 중입니다. 잠시 후 다시 시도해 주세요. (Toss Client Key 미발급)",
    );
  }

  // 1) customer key
  const res = await fetch("/api/billing/customer-key", { method: "POST" });
  if (!res.ok) {
    if (res.status === 401) {
      // 가입/로그인이 안 된 상태 — 결제를 시도하기 전에 로그인 단계로 분기.
      // 사용자가 보던 페이지로 정확히 돌아오도록 next 보존.
      const currentPath =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/";
      const loginUrl = `/login?next=${encodeURIComponent(currentPath)}`;
      if (typeof window !== "undefined") {
        window.location.assign(loginUrl);
      }
      // assign 후에도 return 까지 도달할 수 있어 throw 유지 (불필요한 SDK 호출 방지)
      throw new BillingAuthError("로그인이 필요합니다 — 로그인 화면으로 이동합니다.");
    }
    throw new BillingNotReadyError("결제수단 등록 준비에 실패했습니다.");
  }
  const { customerKey } = (await res.json()) as { customerKey: string };

  // 2) SDK 결제창
  const sdk = await loadTossPayments(clientKey);
  const appUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const successParams = new URLSearchParams({
    planId: args.planId,
    cycle: args.cycle,
  });

  await sdk.requestBillingAuth("카드", {
    customerKey,
    // Toss 는 이 URL 로 ?authKey=...&customerKey=... 를 붙여서 redirect
    successUrl: `${appUrl}/api/billing/auth/success?${successParams.toString()}`,
    failUrl: `${appUrl}/api/billing/auth/fail`,
    customerEmail: args.customerEmail,
    customerName: args.customerName,
  });
}

// ───────────────────────────────────────────────
// Error 타입 — UI 가 사용자에게 다른 메시지 보여주려 분기할 때 사용.
// ───────────────────────────────────────────────

export class BillingNotReadyError extends Error {
  readonly kind = "not_ready" as const;
}

export class BillingAuthError extends Error {
  readonly kind = "auth" as const;
}

export function isBillingConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
}
