"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  BillingNotReadyError,
  startBillingAuth,
  type StartBillingAuthArgs,
} from "@/lib/billing/toss-client";

type Props = {
  planId: "pro" | "studio" | "agency";
  cycle: "monthly" | "annual";
  customerEmail?: string;
  customerName?: string;
  /** Toss Client Key 미발급 시 노출 텍스트 (기본: "준비 중") */
  notReadyLabel?: string;
  className?: string;
  children?: React.ReactNode;
};

/**
 * 플랜 카드/온보딩에서 "결제수단 등록" 트리거.
 *
 * - 클릭 → POST /api/billing/customer-key → loadTossPayments → requestBillingAuth
 * - Toss 결제창이 뜨고, 등록 완료되면 /api/billing/auth/success 로 redirect (이 컴포넌트는 unmount)
 * - Toss Client Key 가 미설정이면 disabled 처리.
 */
export function SubscribeButton({
  planId,
  cycle,
  customerEmail,
  customerName,
  notReadyLabel = "준비 중 — 곧 시작합니다",
  className,
  children,
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // process.env.NEXT_PUBLIC_* 는 빌드 시점에 인라인되므로 컴포넌트 함수 안에서 안전하게 읽힘
  const ready = Boolean(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);

  const onClick = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const args: StartBillingAuthArgs = {
        planId,
        cycle,
        customerEmail,
        customerName,
      };
      await startBillingAuth(args);
      // 정상 흐름이면 이 줄에 도달하지 않음 (페이지 이탈)
    } catch (e) {
      if (e instanceof BillingNotReadyError) {
        setError(e.message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("결제 등록 중 문제가 발생했습니다.");
      }
      setLoading(false);
    }
  }, [planId, cycle, customerEmail, customerName]);

  if (!ready) {
    return (
      <button
        type="button"
        disabled
        title="Toss Client Key 발급 후 활성화"
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-zinc-200 text-zinc-500 px-4 py-2 text-sm cursor-not-allowed",
          className,
        )}
      >
        {notReadyLabel}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-zinc-900 text-zinc-50 px-4 py-2 text-sm font-medium transition hover:opacity-90 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900",
          className,
        )}
      >
        {loading ? "결제창을 여는 중…" : children ?? "결제수단 등록"}
      </button>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
