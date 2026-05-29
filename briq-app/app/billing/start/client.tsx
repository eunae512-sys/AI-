"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ShieldCheck, Sparkles } from "lucide-react";

import { PLANS, formatKrw, type PlanId } from "@/lib/billing/plans";
import { SubscribeButton } from "@/components/billing/SubscribeButton";

type Props = {
  planId: PlanId;
  cycle: "monthly" | "annual";
  userEmail: string | null;
  userName: string | null;
};

export function BillingStartClient({ planId, cycle, userEmail, userName }: Props) {
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[1];
  const monthly = cycle === "annual" ? plan.priceAnnualMonthly : plan.priceMonthly;
  const totalAmount = cycle === "annual" ? plan.priceAnnualMonthly * 12 : plan.priceMonthly;

  // trial 종료 예정일 (오늘 +14일) — 사용자에게 정확한 첫 청구 예정일 표시
  const trialEnd = React.useMemo(() => {
    const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
        {/* 단계 표시 */}
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-zinc-400">
          <span className="text-emerald-600 dark:text-emerald-400">✓ 로그인</span>
          <span>—</span>
          <span className="text-zinc-900 dark:text-zinc-100">2단계 / 2 · 결제수단 등록</span>
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {plan.name} <span className="text-zinc-400">14일 무료체험 시작</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {userName ? `${userName} 사장님, ` : ""}오늘부터 14일간 모든 기능을 자유롭게
          이용하세요. <strong>{trialEnd} 까지</strong> 청구되지 않으며, 그 전에 언제든
          해지하실 수 있습니다.
        </p>

        {/* 플랜 요약 카드 */}
        <section className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-zinc-400">
                {plan.tagline}
              </div>
              <div className="mt-1.5 text-lg font-semibold">
                BRIQ {plan.name}
                <span className="ml-2 text-[11px] font-normal text-zinc-500">
                  {cycle === "monthly" ? "월간 결제" : "연간 결제"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold tabular-nums">
                ₩{formatKrw(monthly)}
                <span className="ml-1 text-[12px] font-normal text-zinc-500">/월</span>
              </div>
              {cycle === "annual" && (
                <div className="text-[11px] text-zinc-500">
                  연 ₩{formatKrw(totalAmount)} (한 번 청구)
                </div>
              )}
            </div>
          </div>

          <ul className="mt-5 space-y-2 border-t border-zinc-100 pt-5 text-sm dark:border-zinc-800">
            {plan.features
              .filter((f) => f.included)
              .slice(0, 5)
              .map((f, i) => (
                <li key={i} className="flex items-baseline gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 translate-y-[2px] text-emerald-500" />
                  <span>
                    {f.label}
                    {f.detail && (
                      <span className="ml-1 text-zinc-500">· {f.detail}</span>
                    )}
                  </span>
                </li>
              ))}
          </ul>
        </section>

        {/* 안내 + CTA */}
        <section className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-500" strokeWidth={1.8} />
            안전한 결제수단 등록
          </div>
          <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            <li>· 카드 정보는 토스페이먼츠가 안전하게 보관 (PCI-DSS 인증)</li>
            <li>· BRIQ 서버에는 카드 끝 4자리·카드사 이름만 저장</li>
            <li>· 첫 청구일은 <strong>{trialEnd}</strong>. 그 전에 해지 시 청구 없음</li>
            <li>· 해지는 ‘설정 → 결제·구독’ 에서 언제든 가능</li>
          </ul>

          <div className="mt-6">
            <SubscribeButton
              planId={planId as "pro" | "studio" | "agency"}
              cycle={cycle}
              customerEmail={userEmail ?? undefined}
              customerName={userName ?? undefined}
              className="w-full h-12 text-sm"
              notReadyLabel="결제 시스템 준비 중 — Toss Client Key 발급 대기"
            >
              <Sparkles className="mr-2 h-4 w-4" /> 결제수단 등록하고 14일 무료체험 시작
            </SubscribeButton>
          </div>

          <div className="mt-3 flex items-center justify-between text-[12px] text-zinc-500">
            <Link href="/dashboard" className="hover:underline">
              나중에 — 대시보드로
            </Link>
            <Link href="/pricing" className="hover:underline">
              다른 플랜 보기
            </Link>
          </div>
        </section>

        <p className="mt-6 text-center text-[11px] text-zinc-400">
          계속하시면 BRIQ{" "}
          <Link href="/terms" className="underline">이용약관</Link>{" "}와{" "}
          <Link href="/refund-policy" className="underline">환불 정책</Link>{" "}에 동의하신 것으로
          간주됩니다.
        </p>
      </div>
    </main>
  );
}
