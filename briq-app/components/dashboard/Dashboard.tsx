"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Sparkles, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAssistant } from "@/components/ai-assistant/AssistantProvider";
import { useBrand } from "@/components/brand/BrandProvider";
import {
  todayRecommendations,
  recentActivity,
  trendingReelsStyles,
} from "@/lib/dummy/recommendations";
import { brands } from "@/lib/dummy/brands";
import { formatNumber } from "@/lib/utils";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.2, 0.8, 0.2, 1] as const },
});

// KPIs는 컴포넌트 내부에서 selected brand로 동적 생성됨

const TONE_RECS = [
  { tone: "rose", weather: "장마 시작 예보", brandTag: "미옥당" },
];

const ACTIVITY_TONE: Record<string, string> = {
  emerald: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  sky: "bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400",
  amber: "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  violet: "bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400",
  rose: "bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

const REC_TONE: Record<string, "rose" | "amber" | "violet" | "sky"> = {
  season: "rose",
  anniversary: "amber",
  trend: "violet",
  weather: "sky",
  local: "violet",
};

export function DashboardScreen() {
  const { open } = useAssistant();
  const { brand } = useBrand();
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div>
      {/* Hero strip */}
      <motion.section className="px-4 sm:px-6 pt-5 sm:pt-8 pb-3 sm:pb-4" {...fade()} key={brand.id}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-zinc-500 mb-1.5">{today} · ☁️ 24°C 흐림</div>
            <h1 className="text-[26px] sm:text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1]">
              <span className="gradient-text">{brand.name}</span>,<br className="sm:hidden" /> 어서 오세요
            </h1>
            <p className="mt-2 sm:mt-3 text-[13px] sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              <span className="hidden sm:inline">
                {brand.industryLabel} · {brand.city} · 톤 v{brand.toneVersion} · 현재 캠페인 <b>{brand.campaign}</b>.
                오늘 BRIQ가 6개 클라이언트를 대신 운영합니다 — 검토 대기 3 · 예약 12 · 톤 경고 2.
              </span>
              <span className="sm:hidden">
                현재 캠페인 <b>{brand.campaign}</b> · 검토 3 · 예약 12 · 톤 경고 2
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 -mx-1 sm:mx-0 overflow-x-auto sm:overflow-visible">
            <Button variant="outline" size="sm" onClick={open} className="shrink-0">
              <Sparkles className="h-3.5 w-3.5" />AI 빠른 실행
            </Button>
            <Button asChild size="sm" className="shrink-0">
              <Link href="/reels">
                <Plus className="h-3.5 w-3.5" />새 콘텐츠
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* KPI strip — 선택된 브랜드 기준 */}
      <section className="px-4 sm:px-6 pb-2">
        {(() => {
          const kpis = [
            { label: `${brand.name} 팔로워`, value: formatNumber(brand.followers), delta: "+8.4%", note: `${brand.industryLabel} 평균 5.2K 대비` },
            { label: "이번달 도달", value: formatNumber(brand.reachThisMonth), delta: "+47%", note: "인스타 + 블로그 + 릴스 합산" },
            { label: "평균 저장률", value: `${brand.saveRate}%`, delta: "↑ 1.1%p", note: "업종 평균 2.3% 대비 ★" },
            { label: "절감 시간", value: "42h", delta: "≈ ₩1.4M", note: "이번달 BRIQ 자동화 누적" },
          ];
          return (
            <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              {kpis.map((k, i) => (
                <motion.div key={k.label} {...fade(i * 0.04)}>
                  <Card className="p-3.5 sm:p-4 h-full">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500 font-semibold truncate">
                      {k.label}
                    </div>
                    <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                      <div className="text-xl sm:text-2xl font-semibold tabular-nums tracking-tight">{k.value}</div>
                      <div className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{k.delta}</div>
                    </div>
                    <div className="mt-1 text-[10px] sm:text-[11px] text-zinc-500 leading-snug line-clamp-2">{k.note}</div>
                  </Card>
                </motion.div>
              ))}
            </div>
          );
        })()}
      </section>

      {/* Today's recommendations */}
      <section className="px-4 sm:px-6 pt-5 sm:pt-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">오늘의 추천 콘텐츠</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              날씨 · 시즌 · 지역 트렌드 · 브랜드 톤 메모리 기반 자동 추천
            </p>
          </div>
          <Link href="/calendar" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            전체 보기 →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {todayRecommendations.map((rec, i) => {
            const brand = brands.find((b) => b.id === rec.brandId);
            return (
              <motion.div key={rec.id} {...fade(i * 0.06)}>
                <Link href={rec.cta.href}>
                  <Card className="p-5 hover:border-zinc-900 dark:hover:border-zinc-100 hover:-translate-y-0.5 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <Badge tone={REC_TONE[rec.kind]}>{rec.kind === "season" ? "시즌" : rec.kind === "anniversary" ? "기념일" : rec.kind === "trend" ? "지역 트렌드" : "추천"}</Badge>
                      <span className="text-[10px] text-zinc-400">방금 분석</span>
                    </div>
                    <div className="mt-3 text-sm font-semibold leading-snug">{rec.title}</div>
                    <div className="mt-1.5 text-xs text-zinc-500 leading-relaxed">{rec.reason}</div>
                    <div className="mt-4 flex items-center gap-2 text-[11px]">
                      {brand && <Badge tone="default">{brand.name.split(" ")[0]}</Badge>}
                      <span className="text-zinc-400">·</span>
                      {rec.expectedSaveRate && (
                        <span className="text-zinc-500">예상 저장률 {rec.expectedSaveRate}%</span>
                      )}
                      <span className="ml-auto text-zinc-900 dark:text-zinc-100 font-medium">시작 →</span>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Trending reels + activity */}
      <section className="px-4 sm:px-6 pt-5 sm:pt-8 pb-8 sm:pb-12 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">이번주 인기 릴스 스타일</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">강남구 · 외식/뷰티/숙소 1,247개 릴스 분석</p>
            </div>
            <Link href="/trends" className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
              전체 트렌드 →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {trendingReelsStyles.map((t, i) => (
              <motion.div key={t.id} {...fade(i * 0.05)}>
                <div className="rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800">
                  <div className={`aspect-[9/16] bg-gradient-to-br ${t.gradient} relative`}>
                    <div className="absolute inset-0 flex items-end p-2">
                      <div className="text-white text-[10px] font-medium drop-shadow">{t.title}</div>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded">
                      {t.delta}
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="text-[11px] font-medium">{t.format}</div>
                    <div className="text-[10px] text-zinc-500">{t.industry}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">최근 BRIQ 활동</h3>
            <span className="text-[10px] text-zinc-400 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />실시간
            </span>
          </div>
          <ul className="space-y-2.5">
            {recentActivity.map((a, i) => (
              <motion.li key={a.id} className="flex items-start gap-2.5" {...fade(i * 0.04)}>
                <div className={`h-6 w-6 rounded-md grid place-items-center text-[10px] font-bold shrink-0 ${ACTIVITY_TONE[a.iconColor]}`}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs leading-snug">{a.text}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{a.ago}</div>
                </div>
              </motion.li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
