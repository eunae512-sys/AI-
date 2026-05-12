"use client";

import * as React from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // 개발 콘솔에만 — 실서비스는 Sentry 등으로 전송
    console.error("[briq] route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <div className="text-[11px] uppercase tracking-[0.2em] text-rose-500 font-semibold">UNEXPECTED ERROR</div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
          잠시 문제가 발생했어요
        </h1>
        <p className="mt-3 text-sm text-zinc-500 leading-relaxed">
          페이지를 불러오는 중 예상치 못한 오류가 났습니다. 다시 시도하시거나 대시보드로 이동해 주세요.
        </p>
        {error?.digest && (
          <p className="mt-3 text-[11px] text-zinc-400 tabular-nums">오류 ID: {error.digest}</p>
        )}
        <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => reset()}
            className="text-sm font-medium px-5 py-2.5 rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
          >
            다시 시도
          </button>
          <Link
            href="/dashboard"
            className="text-sm font-medium px-5 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100"
          >
            대시보드로 →
          </Link>
        </div>
      </div>
    </div>
  );
}
