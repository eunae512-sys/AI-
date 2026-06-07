"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, EyeOff, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useBrand } from "@/components/brand/BrandProvider";
import { formatNumber } from "@/lib/utils";
import { NextStepCard } from "@/components/layout/RoadmapStrip";

const HIDE_DEMO_KEY = "briq:hide-demo-brands";

export function ClientsScreen() {
  const toast = useToast();
  const { setBrandId, allBrands, userBrand } = useBrand();
  const router = useRouter();
  const [hideDemo, setHideDemo] = React.useState(false);

  React.useEffect(() => {
    try {
      setHideDemo(localStorage.getItem(HIDE_DEMO_KEY) === "1");
    } catch {
      // 무시
    }
    const onChange = () => {
      try {
        setHideDemo(localStorage.getItem(HIDE_DEMO_KEY) === "1");
      } catch {
        // 무시
      }
    };
    window.addEventListener("storage", onChange);
    window.addEventListener("briq:hide-demo-updated", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("briq:hide-demo-updated", onChange);
    };
  }, []);

  const toggleHideDemo = () => {
    const next = !hideDemo;
    setHideDemo(next);
    try {
      if (next) localStorage.setItem(HIDE_DEMO_KEY, "1");
      else localStorage.removeItem(HIDE_DEMO_KEY);
      window.dispatchEvent(new Event("briq:hide-demo-updated"));
    } catch {
      // 무시
    }
    toast.info(next ? "데모 브랜드 숨김 · 사장님 브랜드만 표시" : "데모 브랜드 다시 표시");
  };

  const onAddBrand = () => {
    toast.info("새 브랜드 온보딩으로 이동합니다");
    router.push("/onboarding?add=1");
  };

  const onCardClick = (id: string, name: string) => {
    setBrandId(id);
    toast.success(`${name} 브랜드로 전환됨`);
  };

  const visible = hideDemo ? allBrands.filter((b) => !b.isDemo) : allBrands;
  const demoCount = allBrands.filter((b) => b.isDemo).length;
  const myCount = allBrands.length - demoCount;

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.15em] text-zinc-400 font-semibold">CLIENTS</div>
          <h1 className="mt-2 text-[22px] sm:text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15]">
            관리 중인 브랜드 · {visible.length}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            카드를 클릭하면 해당 브랜드로 전환됩니다. <span className="text-zinc-700 dark:text-zinc-300 font-medium">데모</span>는 BRIQ가 미리 만든 예시예요.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {demoCount > 0 && (
            <button
              onClick={toggleHideDemo}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              title="데모 브랜드 숨김"
            >
              {hideDemo ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {hideDemo ? `데모 보이기 (${demoCount})` : `데모 숨김`}
            </button>
          )}
          <Button size="sm" onClick={onAddBrand}>
            <Plus className="h-3.5 w-3.5" />새 브랜드 추가
          </Button>
        </div>
      </div>

      {/* 사장님 브랜드가 없으면 안내 */}
      {myCount === 0 && (
        <Card className="p-5 mb-4 border-violet-200 dark:border-violet-900/40 bg-violet-50/40 dark:bg-violet-500/5">
          <div className="text-sm font-semibold text-violet-900 dark:text-violet-100">
            아직 사장님 브랜드가 없어요
          </div>
          <p className="mt-1 text-xs text-violet-800/80 dark:text-violet-200/70">
            아래 6개는 사용 예시(데모)입니다. 사장님 가게로 온보딩을 시작하면 실제 카피·콘텐츠가 만들어져요.
          </p>
          <Button size="sm" className="mt-3" onClick={onAddBrand}>
            내 브랜드 시작하기 <Plus className="h-3.5 w-3.5" />
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((b) => {
          const isUser = !!userBrand && b.id === userBrand.id;
          const isDemo = !!b.isDemo;
          const href = isUser ? "/brand-kit" : `/clients/${b.id}`;
          return (
            <div key={b.id} className="relative">
              <Link
                href={href}
                onClick={() => onCardClick(b.id, b.name)}
                className="block"
              >
                <Card
                  className={`p-5 hover:border-zinc-900 dark:hover:border-zinc-100 hover:-translate-y-0.5 transition-all cursor-pointer ${
                    isDemo ? "bg-zinc-50/30 dark:bg-zinc-900/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${b.gradient} grid place-items-center text-white text-sm font-bold`}>
                      {b.letter}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {isUser && <Badge tone="emerald">MY BRAND</Badge>}
                      {isDemo && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                          데모
                        </span>
                      )}
                      {!isUser && !isDemo && <Badge tone="default">v{b.toneVersion}</Badge>}
                    </div>
                  </div>
                  <div className="mt-4 text-sm font-semibold">{b.name}</div>
                  <div className="text-[11px] text-zinc-500">
                    {b.industryLabel} · {b.city}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs font-semibold tabular-nums">
                        {isUser ? "—" : formatNumber(b.followers)}
                      </div>
                      <div className="text-[10px] text-zinc-500">팔로워</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold tabular-nums text-emerald-600">
                        {isUser ? "—" : `${b.saveRate}%`}
                      </div>
                      <div className="text-[10px] text-zinc-500">저장률</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold tabular-nums">
                        {isUser ? "—" : formatNumber(b.reachThisMonth)}
                      </div>
                      <div className="text-[10px] text-zinc-500">월 도달</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 truncate">
                    {isUser ? (
                      <>방금 등록 · <span className="text-zinc-700 dark:text-zinc-300 font-medium">{b.campaign}</span></>
                    ) : isDemo ? (
                      <>예시 캠페인 · <span className="text-zinc-700 dark:text-zinc-300 font-medium">{b.campaign}</span></>
                    ) : (
                      <>현재 캠페인 · <span className="text-zinc-700 dark:text-zinc-300 font-medium">{b.campaign}</span></>
                    )}
                  </div>
                </Card>
              </Link>
            </div>
          );
        })}
      </div>

      {/* 워크플로우 푸터 — 다음: SNS 연결 */}
      <div className="mt-6">
        <NextStepCard />
      </div>
    </div>
  );
}
