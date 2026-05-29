"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";

import { PLANS } from "@/lib/billing/plans";

type SubscribeResult = { error?: string; subscription?: unknown };

export function BillingSuccessClient() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get("planId") as
    | "pro"
    | "studio"
    | "agency"
    | null;
  const cycle = params.get("cycle") as "monthly" | "annual" | null;

  const [state, setState] = React.useState<
    "idle" | "subscribing" | "done" | "error" | "no-plan"
  >(planId && cycle ? "idle" : "no-plan");
  const [errorMsg, setErrorMsg] = React.useState<string>("");

  React.useEffect(() => {
    if (!planId || !cycle) return;
    let cancelled = false;
    (async () => {
      setState("subscribing");
      try {
        const r = await fetch("/api/billing/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, cycle }),
        });
        const data = (await r.json()) as SubscribeResult;
        if (cancelled) return;
        if (!r.ok) {
          setErrorMsg(data.error ?? `HTTP ${r.status}`);
          setState("error");
          return;
        }
        setState("done");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : "unknown");
        setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [planId, cycle]);

  const plan = planId ? PLANS.find((p) => p.id === planId) : null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" strokeWidth={1.5} />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          결제수단이 등록되었습니다
        </h1>

        {state === "no-plan" && (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            카드가 안전하게 보관되었습니다. 정기결제는 플랜을 선택하실 때
            시작됩니다.
          </p>
        )}

        {state === "subscribing" && (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            {plan?.name ?? "선택한"} 플랜 구독을 시작하고 있습니다…
          </p>
        )}

        {state === "done" && (
          <>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              <b>{plan?.name}</b> 플랜 14일 무료체험이 시작되었습니다. 체험 종료
              전 언제든 해지하실 수 있습니다.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-50 transition hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
              >
                대시보드로 이동 <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <Link
                href="/settings/billing"
                className="text-[12px] text-zinc-500 hover:underline"
              >
                결제 정보 보기
              </Link>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <p className="mt-3 text-sm text-red-600">
              구독 시작 중 문제가 발생했습니다. 카드 등록은 완료되었으니 결제
              설정 페이지에서 다시 시도해 주세요.
            </p>
            {errorMsg && (
              <p className="mt-1 text-[11px] text-zinc-400">{errorMsg}</p>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/settings/billing"
                className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-50 transition hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
              >
                결제 설정으로
              </Link>
              <Link
                href="/pricing"
                className="text-[12px] text-zinc-500 hover:underline"
              >
                플랜 선택 화면으로
              </Link>
            </div>
          </>
        )}

        {state === "no-plan" && (
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/pricing"
              className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-50 transition hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
            >
              플랜 선택하기
            </Link>
            <Link
              href="/settings/billing"
              className="text-[12px] text-zinc-500 hover:underline"
            >
              결제 정보 보기
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
