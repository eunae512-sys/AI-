"use client";

// 데모 모드 띠 — 사용자가 아직 온보딩을 마치지 않았을 때만 노출.
// 사장님이 보는 모든 숫자/캠페인이 실제 본인 가게 데이터가 아니라
// 데모 가게(미옥당 등) 의 시뮬레이션이라는 점을 첫눈에 알리는 목적.

import * as React from "react";
import Link from "next/link";
import { useBrand } from "@/components/brand/BrandProvider";

export function DemoModeBanner() {
  const { userBrand } = useBrand();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // SSR 단계에선 가짜로 띠를 항상 보이지 않도록 — 마운트 후 판단
  if (!mounted) return null;
  if (userBrand) return null;

  return (
    <div className="border-b border-amber-200/70 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/5">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px]">
        <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-medium">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
          데모 둘러보는 중
        </span>
        <span className="text-zinc-600 dark:text-zinc-400">
          지금 보이는 가게·숫자·캠페인은 모두 예시입니다. 가입하시면 사장님 가게 정보로 시작합니다.
        </span>
        <Link
          href="/onboarding"
          className="ml-auto inline-flex items-center text-amber-800 dark:text-amber-200 underline underline-offset-4 decoration-[0.5px] hover:no-underline"
        >
          3분 만에 시작 →
        </Link>
      </div>
    </div>
  );
}
