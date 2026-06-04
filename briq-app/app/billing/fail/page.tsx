// /billing/fail
//
// Toss billingAuth 실패 또는 success 라우트에서 turn-around 실패 시 도달.

import { Suspense } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { INK, INK_SOFT, INK_MUTE, RULE, PAPER, SERIF_HANGUL } from "@/lib/landing/tokens";

export const metadata = {
  title: "결제수단 등록 실패",
  robots: { index: false, follow: false },
};

export default function BillingFailPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; message?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <FailContent searchParams={searchParams} />
    </Suspense>
  );
}

async function FailContent({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; message?: string }>;
}) {
  const { reason, message } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: PAPER }}>
      <div className="w-full max-w-md p-8 text-center" style={{ border: `0.5px solid ${RULE}`, background: "#FFFFFF" }}>
        <AlertCircle
          className="mx-auto h-12 w-12"
          strokeWidth={1.5}
          style={{ color: "#A1473D" }}
        />
        <h1 className="mt-4 text-[22px] tracking-tight" style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 600, wordBreak: "keep-all" }}>
          결제수단 등록을 완료하지 못했습니다
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed" style={{ fontFamily: SERIF_HANGUL, color: INK_SOFT, wordBreak: "keep-all" }}>
          {reasonToKorean(reason)}
        </p>
        {message && (
          <p className="mt-1 text-[11px]" style={{ color: INK_MUTE }}>{message}</p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/pricing"
            className="inline-flex w-full items-center justify-center px-4 py-2.5 text-[13.5px] font-medium tracking-[0.01em] transition hover:opacity-90"
            style={{ background: INK, color: PAPER }}
          >
            다시 시도
          </Link>
          <Link
            href="/dashboard"
            className="text-[12px] hover:underline"
            style={{ color: INK_MUTE }}
          >
            나중에 등록할게요
          </Link>
        </div>
      </div>
    </main>
  );
}

function reasonToKorean(reason: string | undefined): string {
  switch (reason) {
    case "PAY_PROCESS_CANCELED":
      return "결제창에서 취소하셨습니다.";
    case "missing_params":
      return "결제 정보가 부족합니다. 처음부터 다시 시도해 주세요.";
    case "REJECT_CARD_COMPANY":
    case "INVALID_CARD_NUMBER":
    case "INVALID_CARD_EXPIRATION":
      return "카드사에서 결제수단 등록을 거절했습니다. 다른 카드로 시도해 주세요.";
    case "NOT_FOUND_BILLING_KEY":
      return "결제 정보를 확인하지 못했습니다. 카드 정보를 다시 확인해 주세요.";
    default:
      return "결제 등록 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
}
