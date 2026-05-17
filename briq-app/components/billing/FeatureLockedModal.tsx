"use client";

// 기능 잠금 모달 — 한도 도달이 아니라 기능 자체가 현재 플랜에 없을 때.
//
// LimitReachedModal 과 분리한 이유:
//   · LimitReached — 같은 기능 한도 도달 (Free 카드뉴스 2편 다 씀)
//   · FeatureLocked — 기능 자체가 잠김 (Free 가 webhook 분배 시도)
// 사장님 이해도 측면에서 두 메시지 결이 다름.

import * as React from "react";
import Link from "next/link";
import { X, Lock } from "lucide-react";
import { gatePrompt, type FeatureKey } from "@/lib/billing/gate";
import { getPlan } from "@/lib/billing/plans";
import { getActivePlanId } from "@/lib/billing/usage";

type Props = {
  open: boolean;
  feature: FeatureKey;
  onClose: () => void;
};

export function FeatureLockedModal({ open, feature, onClose }: Props) {
  const planId = getActivePlanId();
  const { headline, body, requiredPlan } = gatePrompt(feature, planId);
  const targetPlan = getPlan(requiredPlan);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between px-6 pt-6 pb-3">
          <div className="flex-1">
            <div className="editorial-label flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              {targetPlan.name} 전용
            </div>
            <h2
              className="mt-2 text-[22px] tracking-tight leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
            >
              {headline}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="h-8 w-8 grid place-items-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 -mr-2 -mt-2"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="px-6 pb-5 text-[13.5px] leading-[1.65] text-zinc-600 dark:text-zinc-400">
          {body}
        </div>

        <div className="mx-6 mb-5 border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="editorial-label">{targetPlan.name}</div>
          <h3
            className="mt-1.5 text-[17px] tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 500 }}
          >
            {targetPlan.tagline}
          </h3>
          <div className="mt-3 text-[14px] tabular-nums">
            <span className="text-zinc-500 text-[11px]">월 </span>
            <span className="text-zinc-900 dark:text-zinc-100 text-[22px]">
              ₩{new Intl.NumberFormat("ko-KR").format(targetPlan.priceMonthly)}
            </span>
          </div>
          <ul className="mt-3 space-y-1 text-[11.5px] text-zinc-600 dark:text-zinc-400">
            {targetPlan.features
              .filter((f) => f.included)
              .slice(0, 4)
              .map((f, i) => (
                <li key={i} className="flex items-baseline gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  <span>
                    {f.label}
                    {f.detail ? <span className="text-zinc-400"> · {f.detail}</span> : null}
                  </span>
                </li>
              ))}
          </ul>
        </div>

        <footer className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-[11.5px] tracking-[0.08em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            나중에
          </button>
          <Link
            href={`/pricing#${requiredPlan}`}
            onClick={onClose}
            className="h-9 px-5 leading-9 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11.5px] tracking-[0.1em] uppercase font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            업그레이드 보기 →
          </Link>
        </footer>
      </div>
    </div>
  );
}
