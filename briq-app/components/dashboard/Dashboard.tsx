"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Sparkles, Plus, Plug, FileImage, Calendar, ArrowRight, Play, Loader2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAssistant } from "@/components/ai-assistant/AssistantProvider";
import { useBrand } from "@/components/brand/BrandProvider";
import {
  pickTrendingForBrand,
  type TrendingReelsStyle,
} from "@/lib/dummy/recommendations";
import { formatNumber } from "@/lib/utils";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.2, 0.8, 0.2, 1] as const },
});

export function DashboardScreen() {
  const { open } = useAssistant();
  const { brand, allBrands, userBrand } = useBrand();
  const isUserBrand = !!userBrand && brand.id === userBrand.id;
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  // 트렌드 추천 시드 — 페이지 마운트마다 새로움, "다시 추천" 으로 reroll
  // SSR 안전: 첫 렌더는 0, 마운트 후 갱신 (hydration mismatch 방지)
  const [trendSeed, setTrendSeed] = React.useState(0);
  React.useEffect(() => {
    setTrendSeed(Date.now());
  }, []);
  const trendPicks = React.useMemo(
    () => pickTrendingForBrand(brand.industry, trendSeed || 1, 4),
    [brand.industry, trendSeed],
  );
  const rerollTrends = () => setTrendSeed(Date.now());

  return (
    <div>
      {/* Hero strip */}
      <motion.section className="px-4 sm:px-6 pt-5 sm:pt-8 pb-3 sm:pb-4" {...fade()} key={brand.id}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
          <div className="min-w-0">
            <div className="text-xs font-medium text-zinc-500 mb-1.5">{today} · ☁️ 24°C 흐림</div>
            <h1 className="text-[26px] sm:text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1]">
              <span className="gradient-text">{brand.name}</span>,<br className="sm:hidden" /> 어서 오세요
            </h1>
            <p className="mt-2 sm:mt-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              {isUserBrand ? (
                <>
                  <span className="hidden sm:inline">
                    {brand.industryLabel} · {brand.city} · 온보딩 완료 · 추출 팔레트 {userBrand?.palette.length ?? 0}개 컬러 · 업로드 사진 {userBrand?.photos.length ?? 0}장.
                    오른쪽 카드에서 SNS 연결부터 시작해 주세요.
                  </span>
                  <span className="sm:hidden">
                    {brand.industryLabel} · {brand.city} · 온보딩 완료. 다음 단계를 진행해 주세요.
                  </span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">
                    {brand.industryLabel} · {brand.city} · 톤 v{brand.toneVersion} · 현재 캠페인 <b>{brand.campaign}</b>.
                    오늘 BRIQ가 6개 클라이언트를 대신 운영합니다 — 검토 대기 3 · 예약 12 · 톤 경고 2.
                  </span>
                  <span className="sm:hidden">
                    현재 캠페인 <b>{brand.campaign}</b> · 검토 3 · 예약 12 · 톤 경고 2
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 -mx-1 sm:mx-0 overflow-x-auto sm:overflow-visible">
            <Button variant="outline" size="sm" onClick={open} className="shrink-0">
              <Sparkles className="h-3.5 w-3.5" />AI 빠른 실행
            </Button>
            <Button asChild size="sm" className="shrink-0">
              <Link href={isUserBrand ? "/channels" : "/reels"}>
                <Plus className="h-3.5 w-3.5" />{isUserBrand ? "SNS 연결" : "새 콘텐츠"}
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* KPI strip — 더미 브랜드일 때만 (실데이터). 사용자 브랜드는 진행도/안내로 대체 */}
      {!isUserBrand && (
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
                      <div className="text-xs text-zinc-500 dark:text-zinc-500 font-medium truncate">
                        {k.label}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                        <div className="text-2xl sm:text-[26px] font-semibold tabular-nums tracking-tight">{k.value}</div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{k.delta}</div>
                      </div>
                      <div className="mt-1.5 text-xs text-zinc-500 leading-relaxed line-clamp-2">{k.note}</div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            );
          })()}
        </section>
      )}

      {/* 사용자 브랜드 — 시작 가이드 */}
      {isUserBrand && userBrand && (
        <section className="px-4 sm:px-6 pb-2">
          <Card className="p-5 sm:p-6 bg-gradient-to-br from-violet-50/60 via-white to-emerald-50/60 dark:from-violet-500/[0.06] dark:via-transparent dark:to-emerald-500/[0.06] border-violet-200/40 dark:border-violet-800/30">
            <div className="flex items-start gap-3 mb-4">
              <div
                className="h-12 w-12 rounded-xl grid place-items-center text-white text-base font-bold shrink-0"
                style={{ background: `linear-gradient(135deg, ${brand.brandColors.secondary}, ${brand.brandColors.primary})` }}
              >
                {brand.letter}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  온보딩 완료 · 다음 4단계
                </div>
                <h2 className="mt-1 text-lg sm:text-xl font-semibold tracking-tight">
                  3분 안에 첫 발행 준비를 끝낼 수 있어요
                </h2>
                <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                  순서대로 진행하시면 한 번의 클릭으로 모든 채널에 같은 톤·컬러로 발행됩니다.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                { n: 1, icon: Sparkles, title: "AI 자동 홍보", desc: "사진 1장 → 인스타·틱톡·쇼츠 한번에", href: "/shorts", chip: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
                { n: 2, icon: Plug, title: "SNS 채널 연결", desc: "Instagram · Threads · 블로그", href: "/channels", chip: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" },
                { n: 3, icon: FileImage, title: "카드뉴스 1편", desc: "추출 팔레트 자동 적용", href: "/cardnews", chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
                { n: 4, icon: Calendar, title: "발행 예약", desc: "최적 시간 자동 추천", href: "/schedule", chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div key={s.n} {...fade(i * 0.05)}>
                    <Link
                      href={s.href}
                      className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 hover:border-zinc-900 dark:hover:border-zinc-100 hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold tabular-nums ${s.chip}`}>
                          {s.n}
                        </span>
                        <Icon className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div className="mt-3 text-sm font-semibold tracking-tight">{s.title}</div>
                      <div className="mt-1 text-xs text-zinc-500 leading-relaxed line-clamp-2">{s.desc}</div>
                      <div className="mt-3 text-xs inline-flex items-center gap-1 text-zinc-900 dark:text-zinc-100 font-medium">
                        시작 <ArrowRight className="h-3 w-3" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </section>
      )}

      {/* 자주 쓰는 포맷 — 업종 전용 4개 (전체 너비) */}
      <section className="px-4 sm:px-6 pt-5 sm:pt-8 pb-8 sm:pb-12">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="min-w-0">
              <h3 className="text-base font-semibold">{brand.industryLabel} 자주 쓰는 포맷</h3>
              <p className="text-sm text-zinc-500 mt-0.5">
                카드 클릭 → 릴스 에디터에 그 스타일 자동 적용 · 사진만 올리면 완성
              </p>
            </div>
            <button
              type="button"
              onClick={rerollTrends}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shrink-0"
              aria-label="다른 포맷 추천"
            >
              <RefreshCw className="h-3.5 w-3.5" /> 다시 추천
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {trendPicks.map((t, i) => (
              <motion.div key={`${t.id}-${trendSeed}`} {...fade(i * 0.05)}>
                <TrendingReelCard style={t} seed={trendSeed} />
              </motion.div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

// 트렌딩 릴스 카드 — 실제 Pexels 영상 fetch 해서 미리보기 표시
// 클릭 시 briq:applied-trend sessionStorage 에 템플릿 저장 → /reels 로 이동
// ReelsScreen 이 sessionStorage 읽어서 자동으로 format/hooks 적용
function TrendingReelCard({ style, seed }: { style: TrendingReelsStyle; seed: number }) {
  const router = useRouter();
  const [video, setVideo] = React.useState<{ url: string; poster: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errored, setErrored] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const applyTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      sessionStorage.setItem(
        "briq:applied-trend",
        JSON.stringify({
          videoUrl: video?.url,
          posterUrl: video?.poster,
          title: style.title,
          format: style.format,        // parseTrendStyle 가 ASMR/타임랩스/공간/Before/V-log/에디토리얼 인식
          hooks: style.hooks,           // 컷별 자막 시드
          accentGradient: style.gradient,
          source: "trends" as const,
          appliedAt: Date.now(),
        }),
      );
    } catch {
      // 무시
    }
    router.push("/reels?source=dashboard");
  };

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrored(false);
    setVideo(null);
    // 시드 + style.id 해시로 pickIndex 결정 — 카드별로 다른 영상
    const hash = Math.abs(((seed || 1) ^ style.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0)) | 0);
    const pickIndex = hash % 25; // Pexels 결과 상위 25개 중 하나
    (async () => {
      try {
        const res = await fetch("/api/search-pexels-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: style.query,
            orientation: "portrait",
            perPage: 30,
            pickIndex,
          }),
        });
        const data = await res.json();
        if (!cancelled && data?.ok && data.video?.url) {
          setVideo({ url: data.video.url, poster: data.video.poster });
        } else if (!cancelled) {
          setErrored(true);
        }
      } catch {
        if (!cancelled) setErrored(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [style.query, style.id, seed]);

  // hover 시 재생, 떠나면 일시정지
  React.useEffect(() => {
    const el = videoRef.current;
    if (!el || !video) return;
    if (hovered) {
      el.play().catch(() => {
        // autoplay 거부 — 무시
      });
    } else {
      el.pause();
      try {
        el.currentTime = 0;
      } catch {
        // 무시
      }
    }
  }, [hovered, video]);

  return (
    <button
      type="button"
      onClick={applyTemplate}
      className="block w-full text-left rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 transition-all"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`${style.title} 템플릿 적용 — 릴스 에디터로 이동`}
    >
      <div className={`aspect-[9/16] relative overflow-hidden bg-gradient-to-br ${style.gradient}`}>
        {/* 영상 — 로드되면 노출 */}
        {video && (
          <video
            ref={videoRef}
            src={video.url}
            poster={video.poster}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* 로딩 */}
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-black/10">
            <Loader2 className="h-5 w-5 text-white/80 animate-spin" />
          </div>
        )}

        {/* 가독성 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-transparent to-black/65 pointer-events-none" />

        {/* 플레이 아이콘 (hover X 때만) */}
        {video && !hovered && (
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="h-9 w-9 rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur grid place-items-center shadow-lg">
              <Play className="h-4 w-4 text-zinc-900 dark:text-zinc-100 fill-current ml-0.5" strokeWidth={0} />
            </div>
          </div>
        )}

        {/* 제목 */}
        <div className="absolute bottom-2 left-2.5 right-2.5">
          <div className="text-white text-xs font-semibold drop-shadow leading-tight">{style.title}</div>
        </div>

        {/* 포맷 태그 배지 — 가짜 증가율 대신 정직한 분류 */}
        <div className="absolute top-2 right-2 bg-white/90 dark:bg-zinc-900/85 backdrop-blur text-zinc-900 dark:text-zinc-100 text-[10px] px-1.5 py-0.5 rounded font-semibold">
          {style.tag}
        </div>

        {/* 에러 fallback — 영상 없으면 그라디언트만 보여주고 작은 표시 */}
        {errored && !video && (
          <div className="absolute top-2 left-2 text-[9px] text-white/70 bg-black/40 px-1.5 py-0.5 rounded">
            샘플
          </div>
        )}
      </div>
      <div className="p-2.5">
        <div className="text-sm font-semibold truncate">{style.format}</div>
        <div className="text-xs text-zinc-500 mt-0.5 truncate">{style.industryLabel}</div>
        <div className="mt-1.5 text-[10px] text-violet-600 dark:text-violet-400 font-semibold inline-flex items-center gap-1">
          <Play className="h-2.5 w-2.5 fill-current" strokeWidth={0} /> 이 포맷으로 만들기
        </div>
      </div>
    </button>
  );
}
