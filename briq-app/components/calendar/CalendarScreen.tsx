"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Wand2,
  Calendar as CalendarIcon,
  Play,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";

type RecTone = "rose" | "amber" | "violet" | "emerald";
const KIND_TONE_CLASS: Record<RecTone, string> = {
  rose: "text-rose-600 dark:text-rose-400",
  amber: "text-amber-600 dark:text-amber-400",
  violet: "text-violet-600 dark:text-violet-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
};

// 추천 → /shorts 톤 매핑 (Auto Promote 화면이 그 톤으로 시작)
type ShortsTone = "emotional" | "info" | "event" | "discount" | "review";

type CalendarRec = {
  id: number;
  kind: string;            // "시즌 · 5/13~"
  emoji: string;
  title: string;
  desc: string;
  brand: string;
  brandId: string;
  tone: RecTone;           // 카드 색
  shortsTone: ShortsTone;  // /shorts 로 보낼 톤
  format: string;
  hooks: string[];         // 폴백용 (릴스에 직접 적용 시)
  gradient: string;
  whenLabel: string;       // "5월 13일 ~ 21일" 식 사용자용
  query: string;           // Pexels 영상 검색어 (실제 미리보기)
};

const RECS: CalendarRec[] = [
  {
    id: 1, kind: "시즌 · 5/13~", emoji: "🌧",
    title: "장마 감성 릴스", desc: "비 오는 날 메뉴 · 따뜻한 한 그릇",
    brand: "미옥당", brandId: "miokdang", tone: "rose", shortsTone: "emotional",
    format: "공간 무드 · 6컷",
    hooks: ["창문에 빗방울,", "솥에서 김이 오르고", "오늘의 한 그릇", "비 오는 날 단골 메뉴"],
    gradient: "from-stone-500 via-slate-600 to-stone-800",
    whenLabel: "5월 13일 ~ 6월 초",
    query: "rainy window cinematic moody warm food",
  },
  {
    id: 2, kind: "기념일 · 5/8~21", emoji: "💐",
    title: "가정의 달 효도 이벤트", desc: "부모님 패키지 · 어버이날",
    brand: "서촌스테이", brandId: "seochon-stay", tone: "amber", shortsTone: "event",
    format: "공간 V-log · 5컷",
    hooks: ["어버이날, 한옥의 빛", "조반 한 상", "마당에서의 시간", "오늘만의 환영"],
    gradient: "from-amber-200 via-rose-300 to-amber-400",
    whenLabel: "5월 8일 ~ 21일",
    query: "carnation flower bouquet soft light editorial",
  },
  {
    id: 3, kind: "지역 · 5/24~26", emoji: "🌸",
    title: "강남 수국축제 콘텐츠", desc: "봄 컬러 매칭 · 단골 컷",
    brand: "루나헤어", brandId: "luna-hair", tone: "violet", shortsTone: "event",
    format: "ASMR · 7컷",
    hooks: ["수국 컬러,", "5월의 결", "오늘의 톤 매칭", "광택 5초"],
    gradient: "from-fuchsia-300 via-violet-400 to-rose-300",
    whenLabel: "5월 24일 ~ 26일",
    query: "hydrangea flowers spring soft pink editorial",
  },
  {
    id: 4, kind: "트렌드 · 5/27~", emoji: "📚",
    title: "중간고사 D-7", desc: "학부모 V-log · 자녀 응원",
    brand: "베스트영어", brandId: "miokdang", tone: "emerald", shortsTone: "emotional",
    format: "V-log · 5컷",
    hooks: ["D-7,", "오늘의 한 페이지", "조용한 응원", "한 줄의 변화"],
    gradient: "from-emerald-200 via-emerald-400 to-teal-600",
    whenLabel: "5월 27일부터 일주일",
    query: "study desk notebook minimal soft natural light",
  },
  {
    id: 5, kind: "날씨 · 5/30~", emoji: "🔥",
    title: "폭염 콜드 메뉴", desc: "콜드브루 시즌 · 한 잔의 여유",
    brand: "로스터리 1985", brandId: "roastery-1985", tone: "amber", shortsTone: "info",
    format: "타임랩스 · 6컷",
    hooks: ["콜드브루 6시간,", "한 잔의 여유", "오늘의 시즌", "30도가 넘어도"],
    gradient: "from-amber-100 via-amber-300 to-stone-600",
    whenLabel: "5월 30일부터 한 달",
    query: "cold brew coffee ice pour cinematic editorial",
  },
  {
    id: 6, kind: "후기 · 상시", emoji: "⭐",
    title: "단골 변신 후기", desc: "이번 달 받은 좋은 후기 카드뉴스",
    brand: "루나헤어", brandId: "luna-hair", tone: "rose", shortsTone: "review",
    format: "Before/After · 5컷",
    hooks: ["단골이 먼저", "결의 변화", "3개월 케어 후", "오늘의 한 마디"],
    gradient: "from-rose-200 via-pink-300 to-amber-200",
    whenLabel: "이번 달 후기 모음",
    query: "hair transformation portrait editorial soft natural light",
  },
];

const DAYS_PRE = [26, 27, 28, 29, 30];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const DAYS_POST = [1, 2, 3, 4, 5, 6];
const TODAY = 11;

const HOLIDAYS: Record<number, string> = { 1: "근로자", 5: "어린이날", 8: "어버이", 15: "스승", 25: "부처님" };
const WEATHER: Record<number, string> = { 13: "🌧", 30: "🔥" };

// 각 날짜 도트 색만 (컴팩트 모드) — 라벨 텍스트는 제거
const EVENT_DOTS: Record<number, string[]> = {
  5: ["emerald"],
  6: ["rose"],
  8: ["sky"],
  11: ["rose", "fuchsia"],
  12: ["amber"],
  13: ["rose"],
  14: ["emerald"],
  15: ["emerald"],
  16: ["stone"],
  19: ["rose"],
  20: ["sky"],
  22: ["fuchsia"],
  26: ["fuchsia"],
  27: ["emerald"],
  29: ["rose"],
  30: ["amber"],
};

const DOT_COLOR: Record<string, string> = {
  rose: "bg-rose-400",
  emerald: "bg-emerald-400",
  sky: "bg-sky-400",
  amber: "bg-amber-400",
  fuchsia: "bg-fuchsia-400",
  stone: "bg-stone-400",
};

// 업종 → 추천 카드 가중치 (사용자 브랜드 활성 시 상단 우선 노출)
const INDUSTRY_PRIORITY: Record<string, number[]> = {
  restaurant: [1, 5, 4, 2, 3, 6],
  cafe:       [5, 1, 4, 2, 6, 3],
  dessert:    [5, 1, 4, 6, 3, 2],
  stay:       [2, 1, 5, 6, 4, 3],
  beauty:     [3, 6, 5, 4, 1, 2],
  local:      [6, 3, 4, 5, 1, 2],
};

export function CalendarScreen() {
  const router = useRouter();
  const toast = useToast();
  const { setBrandId, userBrand, brand: activeBrand } = useBrand();
  const isUserBrand = !!userBrand && activeBrand.id === userBrand.id;

  // 영상 reroll 시드 — 30분 시간 버킷 + 사용자 reroll 가산
  // 같은 시간대 (30분 윈도우) 안에서는 같은 영상 = 캐싱 효율
  // 30분 지나면 자동 회전 + 사용자가 "다시 추천" 누르면 즉시 회전
  const [extraSeed, setExtraSeed] = React.useState(0);
  const [timeSeed, setTimeSeed] = React.useState(0);
  React.useEffect(() => {
    setTimeSeed(Math.floor(Date.now() / (30 * 60 * 1000)));
  }, []);
  const videoSeed = timeSeed + extraSeed;
  const rerollVideos = () => setExtraSeed((s) => s + 7);

  // 사용자 브랜드가 활성이면 그 브랜드 기준으로 추천 라벨 다시 그리기
  const displayedRecs = React.useMemo<CalendarRec[]>(() => {
    const base = isUserBrand
      ? RECS.map((r) => ({
          ...r,
          brand: activeBrand.name,
          brandId: activeBrand.id,
        }))
      : RECS;
    // 업종별 우선순위로 정렬
    if (isUserBrand && INDUSTRY_PRIORITY[activeBrand.industry]) {
      const order = INDUSTRY_PRIORITY[activeBrand.industry];
      return [...base].sort(
        (a, b) => order.indexOf(a.id) - order.indexOf(b.id),
      );
    }
    return base;
  }, [isUserBrand, activeBrand.id, activeBrand.name, activeBrand.industry]);

  // 추천 → /shorts (AI 자동 홍보) 로 즉시 이동
  // 사용자가 사진만 올리면 그 톤·주제로 자동 작성됨
  const startShorts = (rec: CalendarRec) => {
    const targetBrandId = userBrand && activeBrand.id === userBrand.id ? userBrand.id : rec.brandId;
    if (targetBrandId !== activeBrand.id) {
      setBrandId(targetBrandId);
    }
    try {
      // 테마 키워드 — title/desc 에서 핵심 명사 뽑아 카피에 박음
      // (장마 / 어버이날 / 수국 / 콜드브루 등)
      const themeKeyword = rec.title.replace(/(릴스|콘텐츠|이벤트|메뉴|카드뉴스)/g, "").trim();

      sessionStorage.setItem(
        "briq:shorts-preset",
        JSON.stringify({
          tone: rec.shortsTone,
          themeTitle: rec.title,
          themeKind: rec.kind,
          themeDesc: rec.desc,
          themeHooks: rec.hooks,        // ★ 컷별 후크 — 카피 hookLine 시드
          themeKeyword,                  // ★ 핵심 명사 — 해시태그/제목에 박음
          themeWhenLabel: rec.whenLabel, // "5월 13일 ~ 6월 초"
          accentGradient: rec.gradient,
          fromCalendar: true,
          appliedAt: Date.now(),
        }),
      );
    } catch {
      // 무시
    }
    toast.success(`"${rec.title}" 주제로 자동 홍보 화면 열기 — 사진만 올리면 완성`);
    router.push("/shorts?source=calendar");
  };

  // (선택) 릴스에 그대로 입히고 싶을 때 — 보조 동선
  const applyToReels = (rec: CalendarRec) => {
    const targetBrandId = userBrand && activeBrand.id === userBrand.id ? userBrand.id : rec.brandId;
    if (targetBrandId !== activeBrand.id) {
      setBrandId(targetBrandId);
    }
    const payload = {
      title: rec.title,
      format: rec.format,
      hooks: rec.hooks,
      accentGradient: rec.gradient,
      source: "calendar" as const,
      appliedAt: Date.now(),
    };
    try {
      sessionStorage.setItem("briq:applied-trend", JSON.stringify(payload));
    } catch {
      // 무시
    }
    router.push("/reels?source=calendar");
  };

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-7">
      {/* Hero */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            이달의 콘텐츠 플래너 · 2026년 5월
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-[1.15]">
            이달엔 어떤 콘텐츠가 좋을까?
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-500 max-w-2xl leading-relaxed">
            공휴일·시즌·날씨·지역 축제·트렌드를 미리 잡아 추천합니다. 카드 하나 골라서 "지금 만들기" 누르면 사진만 올려도 완성.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline">
            <Plus className="h-3.5 w-3.5" />직접 추가
          </Button>
          <Button asChild size="sm">
            <a href="/schedule">
              <CalendarIcon className="h-3.5 w-3.5" /> 예약 큐
            </a>
          </Button>
        </div>
      </div>

      {/* 미니 통계 */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-5">
        <Card className="p-4">
          <div className="text-xs text-zinc-500 font-medium">이달 추천</div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums">{RECS.length}<span className="text-base text-zinc-400">건</span></div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-zinc-500 font-medium">발행 예정</div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-violet-600 dark:text-violet-400">
            {Object.values(EVENT_DOTS).reduce((s, x) => s + x.length, 0)}
            <span className="text-base text-zinc-400">건</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-zinc-500 font-medium">남은 추천</div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {RECS.length}<span className="text-base text-zinc-400">건</span>
          </div>
        </Card>
      </div>

      {/* ★ 메인 — 이달의 추천 (3컬럼 그리드, 카드 크게) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">이달의 추천</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {isUserBrand
                ? `${activeBrand.name} (${activeBrand.industryLabel}) 기준으로 정렬됨`
                : "한 번에 하나씩, 사장님 가게에 맞는 시즌·이벤트 콘텐츠"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={rerollVideos}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              aria-label="다른 영상 추천"
            >
              <RefreshCw className="h-3.5 w-3.5" /> 영상 새로
            </button>
            <Badge tone="violet">{isUserBrand ? "내 가게 추천" : "BRIQ AI 추천"}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
          {displayedRecs.map((rec, i) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <CalendarRecCard
                rec={rec}
                seed={videoSeed}
                onStartShorts={() => startShorts(rec)}
                onApplyReels={() => applyToReels(rec)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* 컴팩트 월간 그리드 — 시각화·발행 예정 dot 중심 */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="이전 달">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-base sm:text-lg font-semibold">2026년 5월</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="다음 달">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <button className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">오늘로</button>
          </div>
          <a
            href="/schedule"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1"
          >
            발행 예약 큐 보기 <ArrowRight className="h-3 w-3" />
          </a>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
          <div className="px-2 text-rose-500">일</div><div className="px-2">월</div><div className="px-2">화</div><div className="px-2">수</div><div className="px-2">목</div><div className="px-2">금</div><div className="px-2">토</div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {DAYS_PRE.map((d) => (
            <div
              key={`pre-${d}`}
              className="aspect-square min-h-[44px] rounded-lg border border-zinc-100 dark:border-zinc-800 p-1.5 opacity-30 text-xs"
            >
              {d}
            </div>
          ))}
          {DAYS.map((d) => {
            const isToday = d === TODAY;
            const dots = EVENT_DOTS[d] || [];
            const holiday = HOLIDAYS[d];
            const weather = WEATHER[d];
            return (
              <button
                key={d}
                onClick={() => {
                  // 날짜 클릭 → /schedule 페이지로 그 날짜로 이동
                  const year = new Date().getFullYear();
                  const month = 5; // 데모: 2026-05 고정
                  const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  router.push(`/schedule?date=${iso}`);
                }}
                className={`aspect-square min-h-[44px] rounded-lg border p-1.5 text-left transition-colors ${
                  isToday
                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                    : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100"
                }`}
                title={`${d}일${holiday ? ` · ${holiday}` : ""}${dots.length ? ` · 발행 ${dots.length}건 — 클릭해서 예약 큐 보기` : " — 클릭해서 예약하기"}`}
              >
                <div className="text-sm font-semibold leading-none flex items-center justify-between">
                  <span>{isToday ? `${d}` : d}</span>
                  {weather && <span className="text-xs">{weather}</span>}
                </div>
                {holiday && !isToday && (
                  <div className="text-[10px] text-rose-500 font-medium mt-0.5 truncate">{holiday}</div>
                )}
                {dots.length > 0 && (
                  <div className="mt-auto pt-1 flex items-center gap-0.5 flex-wrap">
                    {dots.slice(0, 4).map((c, i) => (
                      <span
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full ${
                          isToday ? "bg-white/80" : DOT_COLOR[c] ?? "bg-zinc-400"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
          {DAYS_POST.map((d) => (
            <div
              key={`post-${d}`}
              className="aspect-square min-h-[44px] rounded-lg border border-zinc-100 dark:border-zinc-800 p-1.5 opacity-30 text-xs"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
          {isUserBrand ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />{activeBrand.name}
            </span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" />미옥당</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />로스터리</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-fuchsia-400" />루나</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400" />서촌스테이</span>
            </>
          )}
          <span className="ml-auto">날짜 클릭 → 그 날짜로 발행 예약 큐 열림</span>
        </div>
      </Card>
    </div>
  );
}

// 컴팩트 추천 카드 — 9:16 영상 썸네일 + 최소 텍스트
// hover 시 영상 자동 재생, 클릭 시 /shorts 로 톤 시드
function CalendarRecCard({
  rec,
  seed,
  onStartShorts,
  onApplyReels,
}: {
  rec: CalendarRec;
  seed: number;          // 외부 reroll 시드 — 변경되면 새 영상 fetch
  onStartShorts: () => void;
  onApplyReels: () => void;
}) {
  const [video, setVideo] = React.useState<{ url: string; poster: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hovered, setHovered] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setVideo(null);
    (async () => {
      try {
        // pickIndex = rec.id (분산) + seed/시간 버킷 (시간/reroll 시 변동)
        // → 같은 페이지 내 6개 카드는 서로 다른 영상 + 매번 새로 보이게
        const pickIndex = ((rec.id * 3) + Math.abs(seed | 0)) % 25;
        const res = await fetch("/api/search-pexels-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: rec.query,
            orientation: "portrait",
            perPage: 30,
            pickIndex,
          }),
        });
        const data = await res.json();
        if (!cancelled && data?.ok && data.video?.url) {
          setVideo({ url: data.video.url, poster: data.video.poster });
        }
      } catch {
        // 무시 — 그라디언트 fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rec.id, rec.query, seed]);

  React.useEffect(() => {
    const el = videoRef.current;
    if (!el || !video) return;
    if (hovered) {
      el.play().catch(() => {});
    } else {
      el.pause();
      try { el.currentTime = 0; } catch {}
    }
  }, [hovered, video]);

  return (
    <div
      className="group rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 transition-all bg-white dark:bg-zinc-950"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 9:16 영상 썸네일 — 클릭 시 /shorts 로 (메인 액션) */}
      <button
        type="button"
        onClick={onStartShorts}
        className="block w-full text-left"
        aria-label={`${rec.title} — 지금 만들기`}
      >
        <div className={`relative aspect-[9/12] overflow-hidden bg-gradient-to-br ${rec.gradient}`}>
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
          {loading && (
            <div className="absolute inset-0 grid place-items-center bg-black/10">
              <Loader2 className="h-4 w-4 text-white/80 animate-spin" />
            </div>
          )}
          {/* 가독성 그라디언트 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/70 pointer-events-none" />
          {/* kind 칩 — 상단 좌측 */}
          <div className="absolute top-1.5 left-1.5">
            <span className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-white/90 ${KIND_TONE_CLASS[rec.tone]}`}>
              {rec.kind.split(" · ")[0]}
            </span>
          </div>
          {/* 작은 이모지 — 상단 우측 */}
          <div className="absolute top-1.5 right-1.5 text-base drop-shadow">{rec.emoji}</div>
          {/* hover X 일 때 작은 play 아이콘 */}
          {video && !hovered && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="h-7 w-7 rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur grid place-items-center shadow-lg">
                <Play className="h-3 w-3 text-zinc-900 dark:text-zinc-100 fill-current ml-0.5" strokeWidth={0} />
              </div>
            </div>
          )}
          {/* 하단 제목 */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 text-white">
            <div className="text-xs font-semibold leading-tight line-clamp-2 drop-shadow">{rec.title}</div>
            <div className="mt-0.5 text-[10px] text-white/85 leading-tight truncate">{rec.whenLabel}</div>
          </div>
        </div>
      </button>

      {/* 하단 짧은 메타 + 한 줄 액션 */}
      <div className="p-2 flex items-center justify-between gap-1.5">
        <div className="min-w-0">
          <div className="text-[10.5px] text-zinc-700 dark:text-zinc-300 font-medium truncate">
            {rec.format}
          </div>
          <div className="text-[9.5px] text-zinc-500 truncate">{rec.desc}</div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onApplyReels();
          }}
          className="shrink-0 text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-1.5 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900"
          title="기존 사진에 스타일만 적용"
        >
          릴스
        </button>
      </div>
    </div>
  );
}
