"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Loader2, Play, Pause, Volume2, VolumeX, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";
import { getBrandDetail } from "@/lib/dummy/brand-detail";

// 업종별 트렌딩 릴스 스타일
const TRENDS_BY_INDUSTRY: Record<
  string,
  {
    radius: string;
    competitors: number;
    topStyles: { title: string; format: string; saveRate: string; delta: string; gradient: string; hooks: string[]; pexelsQuery: string }[];
    keywords: { word: string; volume: string; delta: string }[];
    competitorTable: { name: string; followers: string; freq: string; saveRate: string; format: string; strength: string; isUs?: boolean }[];
  }
> = {
  restaurant: {
    radius: "강남구 · 1km",
    competitors: 14,
    topStyles: [
      { title: "새벽 4시 시장", format: "시간순 다큐 · 6컷", saveRate: "8.1%", delta: "+312%", gradient: "from-amber-200 via-rose-300 to-amber-400", hooks: ["새벽", "시장", "정성"], pexelsQuery: "early morning market editorial moody natural light" },
      { title: "장 담그는 손", format: "ASMR · 8컷", saveRate: "6.4%", delta: "+182%", gradient: "from-amber-100 to-stone-500", hooks: ["7년", "장", "손맛"], pexelsQuery: "ceramic jar fermented sauce macro editorial korean" },
      { title: "사장님 인터뷰", format: "V-log · 5컷", saveRate: "4.7%", delta: "+124%", gradient: "from-stone-300 to-amber-700", hooks: ["사장님", "철학", "스토리"], pexelsQuery: "korean chef portrait warm natural light editorial" },
      { title: "코스 풀샷", format: "공간 무드 · 7컷", saveRate: "4.2%", delta: "+96%", gradient: "from-amber-100 via-stone-200 to-amber-300", hooks: ["코스", "한 상", "정식"], pexelsQuery: "korean banquet table flat lay editorial minimal" },
    ],
    keywords: [
      { word: "강남 한정식", volume: "8,420", delta: "+34%" },
      { word: "양평 시장", volume: "2,180", delta: "+78%" },
      { word: "어버이날 한정식", volume: "5,420", delta: "+148%" },
      { word: "5월 봄정식", volume: "3,140", delta: "+92%" },
    ],
    competitorTable: [
      { name: "미옥당 (우리)", followers: "12.4K", freq: "주 4.2회", saveRate: "5.4%", format: "시간순 다큐", strength: "★ 톤 일관성", isUs: true },
      { name: "○○당", followers: "38.2K", freq: "주 3.1회", saveRate: "3.8%", format: "셰프 인터뷰", strength: "팔로워" },
      { name: "○○골", followers: "22.8K", freq: "주 5.8회", saveRate: "4.1%", format: "정식 컷", strength: "발행 빈도" },
      { name: "○○가", followers: "8.4K", freq: "주 2.4회", saveRate: "2.9%", format: "V-log", strength: "친근감" },
    ],
  },
  cafe: {
    radius: "서촌 · 1km",
    competitors: 22,
    topStyles: [
      { title: "원두 도착", format: "오픈박스 · 5컷", saveRate: "7.2%", delta: "+248%", gradient: "from-amber-700 to-stone-900", hooks: ["원두", "도착", "오늘"], pexelsQuery: "coffee beans macro arrangement editorial warm" },
      { title: "콜드브루 6시간", format: "타임랩스 · 6컷", saveRate: "6.1%", delta: "+186%", gradient: "from-amber-100 to-amber-300", hooks: ["6시간", "추출", "콜드브루"], pexelsQuery: "cold brew coffee glass condensation macro editorial" },
      { title: "핸드드립 ASMR", format: "ASMR · 8컷", saveRate: "5.8%", delta: "+142%", gradient: "from-stone-800 to-amber-700", hooks: ["3분", "한 잔", "드립"], pexelsQuery: "pour over coffee hands aesthetic editorial close up" },
      { title: "바리스타의 하루", format: "V-log · 7컷", saveRate: "4.2%", delta: "+88%", gradient: "from-stone-600 to-amber-900", hooks: ["바리스타", "오픈", "마감"], pexelsQuery: "barista specialty cafe interior warm light editorial" },
    ],
    keywords: [
      { word: "서촌 카페", volume: "12,840", delta: "+42%" },
      { word: "스페셜티 원두", volume: "4,210", delta: "+38%" },
      { word: "콜드브루", volume: "8,420", delta: "+124%" },
      { word: "예가체프", volume: "1,840", delta: "+56%" },
    ],
    competitorTable: [
      { name: "로스터리 1985 (우리)", followers: "8.2K", freq: "주 5.4회", saveRate: "4.7%", format: "원두 다큐", strength: "★ 산지 스토리", isUs: true },
      { name: "○○ COFFEE", followers: "42.1K", freq: "주 6.2회", saveRate: "5.2%", format: "라떼아트", strength: "팔로워" },
      { name: "○○ROAST", followers: "18.4K", freq: "주 4.8회", saveRate: "4.4%", format: "원두 픽업", strength: "산지" },
      { name: "○○ Bean", followers: "6.2K", freq: "주 3.1회", saveRate: "3.1%", format: "메뉴 사진", strength: "—" },
    ],
  },
  dessert: {
    radius: "성수동 · 1km",
    competitors: 28,
    topStyles: [
      { title: "단면 ASMR", format: "ASMR · 6컷", saveRate: "9.2%", delta: "+342%", gradient: "from-pink-200 via-rose-300 to-amber-200", hooks: ["단면", "녹는", "한 입"], pexelsQuery: "cake slice cross section macro pastel editorial" },
      { title: "오븐에서 갓 나온", format: "타임랩스 · 7컷", saveRate: "7.1%", delta: "+218%", gradient: "from-amber-200 to-rose-300", hooks: ["갓 나온", "오븐", "방금"], pexelsQuery: "fresh baked pastry oven warm editorial bakery" },
      { title: "딸기 손질", format: "ASMR · 5컷", saveRate: "6.8%", delta: "+184%", gradient: "from-rose-300 to-orange-300", hooks: ["딸기", "신선", "방금"], pexelsQuery: "fresh strawberries flat lay editorial natural light" },
      { title: "팀 V-log", format: "V-log · 6컷", saveRate: "5.3%", delta: "+128%", gradient: "from-pink-100 to-amber-100", hooks: ["디저트", "팀", "5월"], pexelsQuery: "boutique patisserie interior pastel minimal editorial" },
    ],
    keywords: [
      { word: "성수 디저트", volume: "18,420", delta: "+68%" },
      { word: "수박 케이크", volume: "4,210", delta: "+412%" },
      { word: "마카롱 신상", volume: "6,140", delta: "+82%" },
      { word: "디저트 카페 성수", volume: "9,840", delta: "+54%" },
    ],
    competitorTable: [
      { name: "달콤한 디저트 (우리)", followers: "18.6K", freq: "주 6.4회", saveRate: "7.2%", format: "단면 ASMR", strength: "★ ASMR 컷", isUs: true },
      { name: "○○ SWEET", followers: "32.4K", freq: "주 5.8회", saveRate: "6.4%", format: "마카롱 컬러", strength: "비주얼" },
      { name: "○○Cake", followers: "14.2K", freq: "주 4.2회", saveRate: "5.8%", format: "케이크 단면", strength: "—" },
      { name: "○○patisserie", followers: "9.8K", freq: "주 3.4회", saveRate: "4.4%", format: "팝업", strength: "이벤트" },
    ],
  },
  stay: {
    radius: "북촌·서촌 · 2km",
    competitors: 12,
    topStyles: [
      { title: "한옥 새벽 빛", format: "공간 무드 · 7컷", saveRate: "7.8%", delta: "+267%", gradient: "from-amber-100 via-stone-200 to-amber-300", hooks: ["창호", "새벽", "빛"], pexelsQuery: "hanok korean traditional window morning light minimal" },
      { title: "마당의 시간", format: "타임랩스 · 6컷", saveRate: "6.4%", delta: "+184%", gradient: "from-stone-400 to-amber-300", hooks: ["마당", "5월", "꽃"], pexelsQuery: "korean traditional courtyard spring editorial aesthetic" },
      { title: "조반 한 상", format: "디테일 · 8컷", saveRate: "5.9%", delta: "+142%", gradient: "from-amber-100 to-orange-200", hooks: ["조반", "한 상", "정성"], pexelsQuery: "korean breakfast flat lay magazine editorial" },
      { title: "객실 투어", format: "공간 V-log · 8컷", saveRate: "4.8%", delta: "+96%", gradient: "from-rose-100 to-amber-200", hooks: ["객실", "온돌", "소반"], pexelsQuery: "ondol minimalist korean bedroom wabi sabi editorial" },
    ],
    keywords: [
      { word: "북촌 한옥스테이", volume: "6,420", delta: "+88%" },
      { word: "효도 패키지", volume: "3,840", delta: "+216%" },
      { word: "한옥 1박", volume: "5,140", delta: "+62%" },
      { word: "어버이날 숙소", volume: "8,420", delta: "+188%" },
    ],
    competitorTable: [
      { name: "서촌 한옥스테이 (우리)", followers: "5.8K", freq: "주 3.8회", saveRate: "6.1%", format: "공간 무드", strength: "★ 마당 컷", isUs: true },
      { name: "○○ HANOK", followers: "12.4K", freq: "주 3.1회", saveRate: "5.4%", format: "전통 다큐", strength: "팔로워" },
      { name: "○○스테이", followers: "8.2K", freq: "주 4.2회", saveRate: "4.8%", format: "체험 V-log", strength: "체험" },
      { name: "○○ guest", followers: "4.4K", freq: "주 2.1회", saveRate: "3.1%", format: "외관 사진", strength: "—" },
    ],
  },
  beauty: {
    radius: "강남구 · 1km",
    competitors: 34,
    topStyles: [
      { title: "결이 살아요 ASMR", format: "ASMR · 8컷", saveRate: "6.4%", delta: "+248%", gradient: "from-zinc-700 via-zinc-900 to-stone-800", hooks: ["결", "5초", "광택"], pexelsQuery: "glossy hair texture macro editorial soft light" },
      { title: "오늘의 컬러", format: "변신 컷 · 6컷", saveRate: "5.8%", delta: "+184%", gradient: "from-rose-200 to-zinc-300", hooks: ["컬러", "오늘", "추천"], pexelsQuery: "hair color swatch palette minimal aesthetic editorial" },
      { title: "수국 컬러 매칭", format: "ASMR · 7컷", saveRate: "7.2%", delta: "+312%", gradient: "from-fuchsia-200 to-violet-300", hooks: ["수국", "컬러", "5월"], pexelsQuery: "hydrangea pastel flower color minimal editorial" },
      { title: "고객 변신", format: "Before/After · 5컷", saveRate: "5.5%", delta: "+128%", gradient: "from-zinc-600 to-stone-800", hooks: ["변신", "고객", "단골"], pexelsQuery: "modern minimal hair salon styling chair editorial" },
    ],
    keywords: [
      { word: "강남 미용실", volume: "12,140", delta: "+18%" },
      { word: "5월 봄 컬러", volume: "8,420", delta: "+248%" },
      { word: "ASMR 시술", volume: "3,840", delta: "+412%" },
      { word: "수국축제 헤어", volume: "1,420", delta: "+340%" },
    ],
    competitorTable: [
      { name: "루나 헤어 (우리)", followers: "14.2K", freq: "주 4.8회", saveRate: "4.2%", format: "ASMR 시술", strength: "★ 결 케어", isUs: true },
      { name: "○○ Hair", followers: "28.4K", freq: "주 5.4회", saveRate: "5.1%", format: "변신 컷", strength: "팔로워" },
      { name: "○○살롱", followers: "18.2K", freq: "주 4.1회", saveRate: "4.4%", format: "디자이너 V-log", strength: "디자이너" },
      { name: "○○ Studio", followers: "8.6K", freq: "주 3.4회", saveRate: "3.6%", format: "스타일링", strength: "—" },
    ],
  },
  local: {
    radius: "한남동 · 1km",
    competitors: 18,
    topStyles: [
      { title: "S/S 26 LOOKBOOK", format: "에디토리얼 · 12컷", saveRate: "5.4%", delta: "+184%", gradient: "from-slate-700 to-zinc-900", hooks: ["lookbook", "S/S", "한 벌"], pexelsQuery: "minimal fashion editorial neutral linen lookbook" },
      { title: "ONE FABRIC", format: "디테일 · 8컷", saveRate: "6.8%", delta: "+218%", gradient: "from-stone-500 to-zinc-800", hooks: ["fabric", "two", "ways"], pexelsQuery: "linen fabric texture detail macro editorial neutral" },
      { title: "쇼룸 데일리", format: "V-log · 6컷", saveRate: "3.9%", delta: "+96%", gradient: "from-zinc-700 to-stone-900", hooks: ["쇼룸", "데일리", "픽"], pexelsQuery: "minimal boutique fashion showroom interior gallery editorial" },
      { title: "디자이너 인터뷰", format: "인터뷰 · 5컷", saveRate: "4.2%", delta: "+124%", gradient: "from-zinc-300 to-stone-600", hooks: ["디자이너", "철학", "원단"], pexelsQuery: "fashion designer atelier studio editorial neutral light" },
    ],
    keywords: [
      { word: "한남동 편집샵", volume: "8,140", delta: "+42%" },
      { word: "컨템포러리 패션", volume: "4,210", delta: "+68%" },
      { word: "S/S 26", volume: "12,840", delta: "+218%" },
      { word: "wool linen", volume: "1,420", delta: "+148%" },
    ],
    competitorTable: [
      { name: "FORUM (우리)", followers: "24.8K", freq: "주 3.8회", saveRate: "3.8%", format: "에디토리얼", strength: "★ 룩북 일관성", isUs: true },
      { name: "○○ studio", followers: "52.4K", freq: "주 4.2회", saveRate: "4.4%", format: "쇼 매거진", strength: "팔로워" },
      { name: "○○atelier", followers: "18.2K", freq: "주 5.4회", saveRate: "3.6%", format: "디테일 컷", strength: "원단" },
      { name: "○○ ROOM", followers: "12.4K", freq: "주 3.1회", saveRate: "3.2%", format: "스타일링", strength: "—" },
    ],
  },
};

type TrendVideo = {
  status: "loading" | "ready" | "error";
  url?: string;
  poster?: string;
  duration?: number;
  photographer?: string;
  pexelsUrl?: string;
};

export function TrendsScreen() {
  const { brand } = useBrand();
  const toast = useToast();
  const router = useRouter();
  const detail = getBrandDetail(brand.id);
  const trends = TRENDS_BY_INDUSTRY[brand.industry] ?? TRENDS_BY_INDUSTRY.restaurant;

  const [videos, setVideos] = React.useState<TrendVideo[]>(() =>
    trends.topStyles.map(() => ({ status: "loading" })),
  );
  const [muted, setMuted] = React.useState(true);
  const [playingIdx, setPlayingIdx] = React.useState<number | null>(0);
  const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([]);

  // 브랜드 전환 시 Pexels Video API 로 실제 인기 영상 fetch
  React.useEffect(() => {
    const styles = TRENDS_BY_INDUSTRY[brand.industry]?.topStyles ?? [];
    setVideos(styles.map(() => ({ status: "loading" })));
    let cancelled = false;

    // 순차 fetch + 누적 excludeIds → 중복 영상 방지
    (async () => {
      const usedIds: number[] = [];
      for (let i = 0; i < styles.length; i++) {
        if (cancelled) return;
        const s = styles[i];
        try {
          const res = await fetch("/api/search-pexels-video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: s.pexelsQuery,
              orientation: "portrait",
              size: "medium",
              perPage: 30,
              slideId: i + 1,
              excludeIds: usedIds,
            }),
          });
          const data = await res.json();
          if (!data.ok) {
            if (!cancelled) {
              setVideos((prev) => prev.map((p, idx) => (idx === i ? { status: "error" } : p)));
            }
            continue;
          }
          const videoId = data.meta?.videoId as number | undefined;
          if (typeof videoId === "number") usedIds.push(videoId);
          if (cancelled) return;
          setVideos((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? {
                    status: "ready",
                    url: data.video?.url as string,
                    poster: data.video?.poster as string,
                    duration: data.video?.duration as number,
                    photographer: data.meta?.photographer as string,
                    pexelsUrl: data.meta?.pexelsUrl as string,
                  }
                : p,
            ),
          );
        } catch {
          if (!cancelled) {
            setVideos((prev) => prev.map((p, idx) => (idx === i ? { status: "error" } : p)));
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [brand.industry, brand.id]);

  // 컷 클릭 → 그 영상 재생, 나머지 일시정지
  const playOne = (idx: number) => {
    setPlayingIdx(idx);
    videoRefs.current.forEach((el, i) => {
      if (!el) return;
      if (i === idx) {
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  };

  const togglePlayPause = (idx: number) => {
    const el = videoRefs.current[idx];
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      setPlayingIdx(idx);
    } else {
      el.pause();
      setPlayingIdx(null);
    }
  };

  // 바로 적용: sessionStorage 에 영상 저장 → /reels 로 이동
  const applyTrend = (idx: number) => {
    const style = trends.topStyles[idx];
    const v = videos[idx];
    if (v?.status !== "ready" || !v.url) {
      toast.warn("영상 로딩 후 적용해 주세요");
      return;
    }
    const payload = {
      videoUrl: v.url,
      posterUrl: v.poster,
      title: style.title,
      format: style.format,
      hooks: style.hooks,
      photographer: v.photographer,
      pexelsUrl: v.pexelsUrl,
      appliedAt: Date.now(),
      brandId: brand.id,
    };
    try {
      sessionStorage.setItem("briq:applied-trend", JSON.stringify(payload));
    } catch {
      // 무시
    }
    toast.success(`"${style.title}" 스타일 적용 → 릴스 스튜디오에서 내 사진에 입혀짐`);
    router.push("/reels?source=trend");
  };

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5 sm:mb-6">
        <div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-violet-600 dark:text-violet-400 font-semibold">
            REFERENCE LIBRARY · {brand.name}
          </div>
          <h1 className="mt-2 text-[22px] sm:text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15]">
            참고용 영상 라이브러리
          </h1>
          <p className="mt-1.5 text-[13px] sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            Pexels 의 {brand.industryLabel} 카테고리 인기 영상 · 사장님 콘텐츠 톤/포맷 참고용
          </p>
        </div>
      </div>

      {/* 정직성 안내 — 시장 분석 데이터 아니라 영상 참고 라이브러리임을 명시 */}
      <div className="mb-4 rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-500/[0.05] px-3 py-2.5 text-[11.5px] text-amber-800 dark:text-amber-300">
        <b>참고:</b> 실제 시장 분석 데이터가 아닙니다. 표시되는 영상·키워드·경쟁업체 수치는 BRIQ 가 미리 만든 데모 예시이며, 사장님 콘텐츠 만들 때 <b>톤·포맷 영감</b>으로만 활용하세요. 실데이터 연동은 Phase 2 (네이버 데이터랩 · 인스타 인사이트) 에 들어갑니다.
      </div>

      {/* Trending styles */}
      <Card className="p-4 sm:p-5 mb-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3 flex-wrap">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{brand.industryLabel} 릴스 포맷 4선</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Pexels 인기 영상에서 큐레이션 · 톤·구성 참고용 (시장 점유율 데이터 X)
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setMuted((m) => !m)}
              className="h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1.5"
              aria-label={muted ? "음소거 해제" : "음소거"}
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              {muted ? "음소거" : "소리 켜짐"}
            </button>
            <a
              href="https://www.pexels.com/license/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-500/15 transition-colors"
              title="Pexels License — 상업 사용 가능 · 출처 표기 의무 없음"
            >
              Pexels License · 상업 OK
            </a>
            <span className="text-[11px] text-zinc-500">5분 전 갱신</span>
          </div>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {trends.topStyles.map((s, i) => {
            const v = videos[i] ?? { status: "loading" };
            const isPlaying = playingIdx === i;
            return (
              <motion.div
                key={`${brand.id}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col"
              >
                <div className={`relative aspect-[9/16] bg-gradient-to-br ${s.gradient} overflow-hidden`}>
                  {v.status === "ready" && v.url && (
                    <video
                      ref={(el) => {
                        videoRefs.current[i] = el;
                      }}
                      src={v.url}
                      poster={v.poster}
                      autoPlay
                      muted={muted}
                      loop
                      playsInline
                      preload="metadata"
                      onPlay={() => setPlayingIdx(i)}
                      onPause={() => setPlayingIdx((p) => (p === i ? null : p))}
                      onClick={() => togglePlayPause(i)}
                      className="absolute inset-0 h-full w-full object-cover cursor-pointer"
                    />
                  )}
                  {v.status === "loading" && (
                    <div className="absolute inset-0 grid place-items-center bg-black/20">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}
                  {v.status === "error" && (
                    <div className="absolute inset-0 grid place-items-center bg-rose-900/30 text-[10px] text-white px-3 text-center">
                      영상을 불러오지 못했습니다
                    </div>
                  )}

                  {/* legibility overlays — pointer-events-none so video stays clickable */}
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />

                  {/* 가짜 변화율 라벨 제거 — 객관적 데이터 없음. 포맷 태그로 교체 */}
                  <div className="absolute top-2 left-2 text-[10px] font-semibold bg-white/85 text-zinc-900 px-1.5 py-0.5 rounded shadow-sm backdrop-blur">
                    {s.format.split("·")[0]?.trim() ?? "참고"}
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="text-[9px] bg-black/55 text-white px-1.5 py-0.5 rounded backdrop-blur">
                      9:16
                    </span>
                    {v.duration && (
                      <span className="text-[9px] bg-black/55 text-white px-1.5 py-0.5 rounded backdrop-blur tabular-nums">
                        {Math.round(v.duration)}s
                      </span>
                    )}
                  </div>

                  {/* play/pause toggle (centered, fades when playing) */}
                  {v.status === "ready" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlayPause(i);
                      }}
                      className={`absolute inset-0 grid place-items-center transition-opacity ${
                        isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
                      }`}
                      aria-label={isPlaying ? "일시정지" : "재생"}
                    >
                      <span className="h-12 w-12 rounded-full bg-white/25 backdrop-blur-md grid place-items-center border border-white/40 shadow-lg">
                        {isPlaying ? (
                          <Pause className="h-5 w-5 text-white fill-white" />
                        ) : (
                          <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                        )}
                      </span>
                    </button>
                  )}

                  {/* title bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-3 pointer-events-none">
                    <div className="text-white text-[13px] font-semibold drop-shadow leading-tight">
                      {s.title}
                    </div>
                    {v.photographer && (
                      <div className="text-[9px] text-white/75 mt-0.5 truncate">
                        Pexels · {v.photographer}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <div className="text-xs font-semibold">{s.format}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">톤·구성 참고용</div>
                  <div className="mt-2 flex items-center gap-1 flex-wrap">
                    {s.hooks.map((h, i) => (
                      <span
                        key={`${h}-${i}`}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto pt-3">
                    <Button
                      size="sm"
                      onClick={() => applyTrend(i)}
                      disabled={v.status !== "ready"}
                      className="w-full"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      {brand.name}에 적용
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold">{brand.industryLabel} 자주 쓰는 키워드</h3>
          <p className="text-[11px] text-zinc-500 mb-4">콘텐츠 카피 작성 시 참고용 · 예시 데이터</p>
          <ul className="space-y-2.5 text-xs">
            {trends.keywords.map((k) => (
              <li key={k.word} className="flex items-center gap-2">
                <span className="font-medium flex-1 truncate">{k.word}</span>
                <span className="text-zinc-500 tabular-nums">{k.volume}</span>
                <span className="ml-2 text-emerald-600 text-[11px]">{k.delta}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <h3 className="text-sm font-semibold">동일 업종 매장 예시</h3>
            <span className="text-[11px] text-zinc-500">
              데모 — 실시간 경쟁사 분석은 Phase 2
            </span>
          </div>
          <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
            <table className="w-full text-xs min-w-[480px]">
              <thead className="text-left text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-semibold border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="py-2 pr-3">업체</th>
                  <th className="py-2 pr-3">팔로워</th>
                  <th className="py-2 pr-3">발행</th>
                  <th className="py-2 pr-3">저장률</th>
                  <th className="py-2 pr-3">시그니처</th>
                  <th className="py-2 pr-3">강점</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {trends.competitorTable.map((c) => (
                  <tr key={c.name} className={c.isUs ? "bg-emerald-50/30 dark:bg-emerald-500/5" : ""}>
                    <td className="py-3 pr-3 font-medium">{c.name}</td>
                    <td className="py-3 pr-3 tabular-nums">{c.followers}</td>
                    <td className="py-3 pr-3">{c.freq}</td>
                    <td
                      className={`py-3 pr-3 tabular-nums font-medium ${
                        c.isUs ? "text-emerald-600" : ""
                      }`}
                    >
                      {c.saveRate}
                    </td>
                    <td className="py-3 pr-3">{c.format}</td>
                    <td className="py-3 pr-3 text-zinc-500">{c.strength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
