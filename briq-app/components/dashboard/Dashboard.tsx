"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Check, ChevronRight, ImagePlus, Upload, Loader2 } from "lucide-react";
import type { Brand } from "@/types";
import { useBrand } from "@/components/brand/BrandProvider";
import {
  getShopHand,
  TONE_DEFAULT,
  TONE_HINT,
  TONE_LABEL,
  TONE_LIST,
  type ShopHand,
  type VoiceTone,
} from "@/lib/dummy/today-shift";
import { cn } from "@/lib/utils";

const TONE_STORAGE_PREFIX = "briq:dashboard-tone:";

function readSavedTone(brandId: string, industry: VoiceTone | undefined): VoiceTone | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(TONE_STORAGE_PREFIX + brandId);
    if (v && (TONE_LIST as string[]).includes(v)) return v as VoiceTone;
  } catch {
    // 무시
  }
  return industry ?? null;
}

function saveTone(brandId: string, tone: VoiceTone) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TONE_STORAGE_PREFIX + brandId, tone);
  } catch {
    // 무시
  }
}

// ─────────────────────────────────────────────────────────────
// 표지 사진 — 직원이 미리 골라 둔 후보 + 사장님 직접 업로드
// ─────────────────────────────────────────────────────────────

const COVER_STORAGE_PREFIX = "briq:dashboard-cover:";

type CoverPick =
  | { kind: "auto" }                  // 직원이 고른 첫번째 후보 (기본)
  | { kind: "candidate"; index: number; url: string; photographer?: string }
  | { kind: "upload"; url: string };  // 데이터 URL

// (업종 × 톤) 별 Pexels 검색어 — 톤에 어울리는 키워드 조합
// 너무 generic 한 단어 (minimal, modern) 는 stock 사진을 끌고 옴 → 구체 명사/조명/질감 위주
const COVER_QUERY: Record<Brand["industry"], Record<VoiceTone, string>> = {
  restaurant: {
    editorial: "warm light overhead bowl natural ceramic",
    minimal: "ceramic plate linen flatlay",
    "warm-shop": "korean side dishes wooden table sunlight",
    witty: "noodles chopsticks candid",
    premium: "omakase chef counter dimly lit",
  },
  cafe: {
    editorial: "espresso ceramic morning light film",
    minimal: "white cup wood table flatlay",
    "warm-shop": "barista pour over latte art warm",
    witty: "iced latte hand sunlight",
    premium: "single origin coffee dark ceramic",
  },
  dessert: {
    editorial: "patisserie plate fork natural light",
    minimal: "white plate dessert overhead",
    "warm-shop": "homemade cake kitchen sunlight",
    witty: "ice cream melting candid summer",
    premium: "tasting menu dessert dark plate",
  },
  stay: {
    editorial: "wooden door warm light traditional interior",
    minimal: "white linen bed window light",
    "warm-shop": "tea pot wooden floor sunlight",
    witty: "slippers wooden floor cozy",
    premium: "hanok courtyard dusk lantern",
  },
  beauty: {
    editorial: "warm hairdresser scissors natural light",
    minimal: "marble counter scissors flatlay",
    "warm-shop": "hands styling hair natural light",
    witty: "long hair side profile sunlight",
    premium: "salon mirror dim warm light",
  },
  local: {
    editorial: "linen shirt wooden hanger warm light",
    minimal: "folded clothing white background",
    "warm-shop": "hands folding shirt shop",
    witty: "shoes laces colorful candid",
    premium: "tailor jacket dark room single light",
  },
};

function readSavedCover(brandId: string): CoverPick | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COVER_STORAGE_PREFIX + brandId);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (v && (v.kind === "candidate" || v.kind === "upload") && typeof v.url === "string") {
      return v as CoverPick;
    }
  } catch {
    // 무시
  }
  return null;
}

function saveCover(brandId: string, pick: CoverPick) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COVER_STORAGE_PREFIX + brandId, JSON.stringify(pick));
  } catch {
    // 무시
  }
}

type Candidate = { url: string; photographer?: string };

// 검색창 안내 — 업종/톤에 따라 사장님이 떠올리기 쉬운 단어로
function customQueryPlaceholder(industry: Brand["industry"], tone: VoiceTone): string {
  const phrases: Record<Brand["industry"], Record<VoiceTone, string>> = {
    restaurant: {
      editorial: "warm bowl natural light",
      minimal: "ceramic plate flatlay",
      "warm-shop": "side dishes wooden table",
      witty: "noodles chopsticks candid",
      premium: "dim restaurant chef counter",
    },
    cafe: {
      editorial: "espresso ceramic morning",
      minimal: "cup white wood flatlay",
      "warm-shop": "barista latte art warm",
      witty: "iced latte sunlight hand",
      premium: "single origin dark",
    },
    dessert: {
      editorial: "patisserie plate fork",
      minimal: "white plate dessert top",
      "warm-shop": "homemade cake kitchen",
      witty: "ice cream summer",
      premium: "tasting dessert dark",
    },
    stay: {
      editorial: "wooden door warm interior",
      minimal: "white bed window",
      "warm-shop": "tea pot wooden floor",
      witty: "slippers cozy",
      premium: "courtyard dusk lantern",
    },
    beauty: {
      editorial: "scissors natural light",
      minimal: "marble counter scissors",
      "warm-shop": "styling hair warm",
      witty: "long hair side profile",
      premium: "salon mirror dim",
    },
    local: {
      editorial: "linen shirt wooden hanger",
      minimal: "folded clothing flatlay",
      "warm-shop": "hands folding shop",
      witty: "shoes laces candid",
      premium: "tailor jacket dark",
    },
  };
  return phrases[industry]?.[tone] ?? "natural light editorial";
}

// 직원 보고 톤 대시보드 — "AI 도구" 아니라 "오늘 일해놓은 직원의 노트".
// 원칙:
//   1. 첫 화면에서 사장님이 할 일은 "이대로 올리기" 한 클릭.
//   2. 설명·기능 카드 0. 결과만.
//   3. 숫자보다 문장. 광고보다 관찰.
//   4. 직접 만들고 싶을 때만 — 화면 맨 아래 작게.

export function DashboardScreen() {
  const { brand } = useBrand();

  // 브랜드 톤 — 사장님이 직접 고르거나, 업종 기본값.
  // 클라이언트 마운트 후에만 localStorage 읽어서 hydration 안전.
  const [tone, setTone] = React.useState<VoiceTone>(() => TONE_DEFAULT[brand.industry]);
  React.useEffect(() => {
    const saved = readSavedTone(brand.id, TONE_DEFAULT[brand.industry]);
    setTone(saved ?? TONE_DEFAULT[brand.industry]);
  }, [brand.id, brand.industry]);

  const changeTone = (next: VoiceTone) => {
    setTone(next);
    saveTone(brand.id, next);
  };

  // 직원이 정리해 둔 오늘 보고 — 브랜드·톤·날짜 기반 결정적
  const [shop, setShop] = React.useState<ShopHand | null>(null);
  React.useEffect(() => {
    setShop(getShopHand(brand, tone, new Date()));
  }, [brand, tone]);

  if (!shop) {
    return (
      <div className="px-5 sm:px-8 pt-8 sm:pt-12 pb-16">
        <div className="h-6 w-40 bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse" />
        <div className="mt-3 h-10 w-3/4 bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="px-5 sm:px-8 pt-7 sm:pt-10 pb-16 max-w-[1080px] mx-auto">
      <Hello shop={shop} tone={tone} onToneChange={changeTone} />
      <TodaysPost shop={shop} brand={brand} tone={tone} brandLetter={brand.letter} brandColor={brand.brandColors.primary} />
      <ThisWeek shop={shop} />
      <Reactions shop={shop} />
      <DirectMake />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 인사 — 시간 + 브랜드 톤 + 톤 선택기
// ─────────────────────────────────────────────────────────────

function Hello({
  shop,
  tone,
  onToneChange,
}: {
  shop: ShopHand;
  tone: VoiceTone;
  onToneChange: (t: VoiceTone) => void;
}) {
  const today = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });

  // 톤별로 안내 문구 결도 다르게 — 같은 화면에서 톤 차이가 즉시 보이도록
  const intro: Record<VoiceTone, string> = {
    editorial: `오늘 한 컷 정리해 뒀습니다. 보시고 결정해 주세요.`,
    minimal: `오늘 ${shop.today.channelLabel}. 한 장.`,
    "warm-shop": `오늘 ${shop.today.channelLabel} 게시물 한 장 준비해 뒀어요. 그대로 가셔도 좋고, 다른 분위기 보고 싶으면 알려 주세요.`,
    witty: `오늘 거 한 장 만들어 봤어요. 마음에 들면 그대로, 아니면 다른 거.`,
    premium: `Today’s post is ready. Please review when convenient.`,
  };

  return (
    <header className="pb-7 sm:pb-9">
      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-600 font-medium">
        {today}
      </div>
      <h1 className="mt-2 text-[22px] sm:text-[28px] font-semibold tracking-tight leading-[1.25]">
        {shop.greeting}
      </h1>
      <p className="mt-1.5 text-[14px] sm:text-[15px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[640px]">
        {intro[tone]}
      </p>

      {/* 톤 선택기 — 가게 컨셉이 다르면 어조도 다르게 */}
      <ToneSwitch tone={tone} onChange={onToneChange} />
    </header>
  );
}

function ToneSwitch({
  tone,
  onChange,
}: {
  tone: VoiceTone;
  onChange: (t: VoiceTone) => void;
}) {
  return (
    <div className="mt-5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-600 font-semibold mb-2">
        가게 톤
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TONE_LIST.map((t) => {
          const active = t === tone;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              title={TONE_HINT[t]}
              className={cn(
                "h-8 px-3 rounded-full text-[12px] font-medium transition-all border",
                active
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                  : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100",
              )}
            >
              {TONE_LABEL[t]}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-600">
        {TONE_HINT[tone]}
      </div>
    </div>
  );
}

// 타이틀 서체 — 톤 + 언어 감지
// 영문 위주(프리미엄)면 Cormorant italic, 한국어 명조계열은 Nanum Myeongjo,
// 미니멀/위트는 sans-serif 시스템 폰트.
function titleStyle(t: { titleFont?: "serif" | "sans"; slideTitle: string }): React.CSSProperties {
  if (t.titleFont === "sans") {
    return { fontFamily: "var(--font-sans)", fontStyle: "normal" };
  }
  const isMostlyEnglish = /^[A-Za-z0-9\s.,'’!?-]+$/.test(t.slideTitle);
  if (isMostlyEnglish) {
    return {
      fontFamily: "'Cormorant Garamond', serif",
      fontStyle: "italic",
      letterSpacing: "-0.01em",
    };
  }
  return { fontFamily: "'Nanum Myeongjo', serif", fontStyle: "normal" };
}

// ─────────────────────────────────────────────────────────────
// 오늘 게시물 — 미리보기 + 1클릭 승인
// ─────────────────────────────────────────────────────────────

function TodaysPost({
  shop,
  brand,
  tone,
  brandLetter,
  brandColor,
}: {
  shop: ShopHand;
  brand: Brand;
  tone: VoiceTone;
  brandLetter: string;
  brandColor: string;
}) {
  const [approved, setApproved] = React.useState(false);
  const [askedAlt, setAskedAlt] = React.useState(false);
  const t = shop.today;

  // 표지 사진 — 직원이 미리 골라 둔 후보 6장 + 사장님 픽 + 직접 검색
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [coverPick, setCoverPick] = React.useState<CoverPick>({ kind: "auto" });
  const [loadingCover, setLoadingCover] = React.useState(true);
  const [showPicker, setShowPicker] = React.useState(false);
  const [customQuery, setCustomQuery] = React.useState("");
  const [pageSeed, setPageSeed] = React.useState(1); // 다시 가져오기 — page 늘리면 새 결과
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // 사장님이 이전에 고른 게 있으면 그대로 유지
  React.useEffect(() => {
    const saved = readSavedCover(brand.id);
    if (saved) setCoverPick(saved);
    else setCoverPick({ kind: "auto" });
    setCustomQuery("");
    setPageSeed(1);
  }, [brand.id]);

  // 후보 6장 fetch — (업종 × 톤) 또는 사용자 검색어
  React.useEffect(() => {
    let cancelled = false;
    setLoadingCover(true);
    const effectiveQuery =
      customQuery.trim().length >= 2
        ? customQuery.trim()
        : COVER_QUERY[brand.industry]?.[tone] ?? "editorial natural light";
    (async () => {
      try {
        const res = await fetch("/api/search-pexels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: effectiveQuery,
            orientation: "portrait",
            perPage: 40,
            page: pageSeed,
            returnCandidates: true,
            candidateCount: 6,
            slideId: brand.id,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data?.ok && Array.isArray(data.candidates) && data.candidates.length > 0) {
          const cs: Candidate[] = data.candidates.map((c: { url: string; photographer?: string }) => ({
            url: c.url,
            photographer: c.photographer,
          }));
          setCandidates(cs);
        } else if (data?.ok && data.image) {
          setCandidates([{ url: data.image, photographer: data.meta?.photographer }]);
        } else {
          setCandidates([]);
        }
      } catch {
        if (!cancelled) setCandidates([]);
      } finally {
        if (!cancelled) setLoadingCover(false);
      }
    })();
    return () => { cancelled = true; };
  }, [brand.id, brand.industry, tone, customQuery, pageSeed]);

  // 표지 url 결정 — uploaded > candidate > auto(첫번째)
  const coverUrl: string | null = (() => {
    if (coverPick.kind === "upload") return coverPick.url;
    if (coverPick.kind === "candidate") return coverPick.url;
    if (candidates.length > 0) return candidates[0].url; // auto
    return null;
  })();

  const pickCandidate = (idx: number) => {
    const c = candidates[idx];
    if (!c) return;
    const pick: CoverPick = { kind: "candidate", index: idx, url: c.url, photographer: c.photographer };
    setCoverPick(pick);
    saveCover(brand.id, pick);
    setShowPicker(false);
  };

  const onUploadClick = () => fileInputRef.current?.click();

  const onFileChosen = async (file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result ?? "");
      if (!url) return;
      const pick: CoverPick = { kind: "upload", url };
      setCoverPick(pick);
      saveCover(brand.id, pick);
      setShowPicker(false);
    };
    reader.readAsDataURL(file);
  };

  // 사진이 있으면 텍스트 가독성을 위해 어두운 오버레이 — moody 컬러일 때는 그라디언트만으로 충분
  const hasPhoto = !!coverUrl;
  const isDarkCover = hasPhoto || t.cover.tone === "moody";

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className="mb-12 sm:mb-16"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileChosen(e.target.files?.[0])}
      />
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
        <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr]">
          {/* 좌 — 카드뉴스 미리보기 (사진 OR 브랜드 톤 그라디언트) */}
          <div
            className={cn(
              "relative aspect-[4/5] md:aspect-auto md:min-h-[420px] flex flex-col justify-end p-7 sm:p-9",
              isDarkCover ? "text-white" : "text-zinc-900",
            )}
            style={{
              background: hasPhoto
                ? undefined
                : `linear-gradient(155deg, ${t.cover.gradientFrom} 0%, ${t.cover.gradientTo} 100%)`,
            }}
          >
            {/* 표지 사진 */}
            {hasPhoto && coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={t.slideTitle}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {/* 가독성용 dual gradient — 위(헤더), 아래(타이틀) */}
            {hasPhoto && (
              <>
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/40 via-black/15 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 via-black/30 to-transparent pointer-events-none" />
              </>
            )}
            {/* 로딩 상태 */}
            {loadingCover && coverPick.kind === "auto" && !hasPhoto && (
              <div className="absolute inset-0 grid place-items-center bg-black/5 dark:bg-white/5 pointer-events-none">
                <Loader2 className="h-5 w-5 text-zinc-500 animate-spin" />
              </div>
            )}
            {/* 상단 — 브랜드 마크 + 매거진 라벨 */}
            <div className="absolute top-5 left-7 right-7 sm:top-6 sm:left-9 sm:right-9 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-5 w-5 rounded-full grid place-items-center text-[10px] font-bold text-white"
                  style={{ background: brandColor }}
                >
                  {brandLetter}
                </span>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-[0.18em] font-semibold",
                    isDarkCover ? "text-white/75" : "text-zinc-700/85",
                  )}
                >
                  {t.slideLabel}
                </span>
              </div>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-[0.18em] tabular-nums",
                  isDarkCover ? "text-white/55" : "text-zinc-700/55",
                )}
              >
                01 / 06
              </span>
            </div>

            {/* 메인 카피 — 톤에 따라 서체 다르게 */}
            <h2
              className="text-[24px] sm:text-[30px] font-semibold tracking-tight leading-[1.18]"
              style={titleStyle(t)}
            >
              {t.slideTitle}
            </h2>
            {t.slideHint && (
              <p
                className={cn(
                  "mt-2.5 text-[13px] sm:text-[13.5px] leading-relaxed max-w-[88%]",
                  isDarkCover ? "text-white/80" : "text-zinc-800/75",
                )}
              >
                {t.slideHint}
              </p>
            )}

            {/* 사진 바꾸기 — 우하단 (메인 카피 위 안 가리게) */}
            <div className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 z-10">
              <button
                type="button"
                onClick={() => setShowPicker((v) => !v)}
                className={cn(
                  "h-8 px-3 rounded-full text-[11.5px] font-medium backdrop-blur transition-all inline-flex items-center gap-1.5 border",
                  isDarkCover
                    ? "bg-white/15 hover:bg-white/25 text-white border-white/20"
                    : "bg-white/85 hover:bg-white text-zinc-900 border-zinc-900/10",
                )}
                aria-label="사진 바꾸기"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                사진
              </button>

              {showPicker && (
                <div className="absolute bottom-full right-0 mb-2 w-[340px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl p-3 z-20">
                  {/* 검색창 — 사장님이 원하는 분위기 직접 입력 */}
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <input
                      type="text"
                      value={customQuery}
                      onChange={(e) => { setCustomQuery(e.target.value); setPageSeed(1); }}
                      placeholder={`예: ${customQueryPlaceholder(brand.industry, tone)}`}
                      className="flex-1 h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[12.5px] focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setPageSeed((p) => p + 1)}
                      title="다른 결과 가져오기"
                      className="h-8 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-[11.5px] text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors inline-flex items-center gap-1"
                      disabled={loadingCover}
                    >
                      {loadingCover ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "다시"
                      )}
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-600 font-semibold">
                      {customQuery.trim().length >= 2 ? "검색 결과" : "직원이 골라 둔 사진"}
                    </div>
                    {customQuery.trim().length >= 2 && (
                      <button
                        type="button"
                        onClick={() => { setCustomQuery(""); setPageSeed(1); }}
                        className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        검색 초기화
                      </button>
                    )}
                  </div>

                  {candidates.length === 0 ? (
                    <div className="text-[12px] text-zinc-500 py-6 text-center">
                      {loadingCover ? "사진 불러오는 중…" : "결과가 없어요. 다른 단어로 검색해 보세요."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {candidates.map((c, i) => {
                        const isPickedCandidate =
                          coverPick.kind === "candidate" && coverPick.url === c.url;
                        const isAutoAndFirst =
                          coverPick.kind === "auto" && i === 0 && customQuery.trim().length < 2;
                        const active = isPickedCandidate || isAutoAndFirst;
                        return (
                          <button
                            key={`${c.url}-${i}`}
                            type="button"
                            onClick={() => pickCandidate(i)}
                            className={cn(
                              "relative aspect-[4/5] rounded-md overflow-hidden border-2 transition-all",
                              active
                                ? "border-zinc-900 dark:border-zinc-100"
                                : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-700",
                            )}
                            title={c.photographer ? `사진: ${c.photographer}` : "이 사진 선택"}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={c.url} alt={`후보 ${i + 1}`} className="h-full w-full object-cover" />
                            {active && (
                              <div className="absolute inset-0 bg-zinc-900/30 dark:bg-zinc-100/20 grid place-items-center">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={onUploadClick}
                    className="mt-2.5 w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    내 사진 올리기
                  </button>
                  {coverPick.kind !== "auto" && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPick({ kind: "auto" });
                        if (typeof window !== "undefined") {
                          try { localStorage.removeItem(COVER_STORAGE_PREFIX + brand.id); } catch { /* 무시 */ }
                        }
                        setCustomQuery("");
                        setPageSeed(1);
                        setShowPicker(false);
                      }}
                      className="mt-1.5 w-full h-8 rounded-md text-[11.5px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                      직원 추천으로 되돌리기
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 하단 가는 라인 — 브랜드 컬러 */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[3px]"
              style={{ background: brandColor, opacity: 0.5 }}
              aria-hidden
            />
          </div>

          {/* 우 — 캡션 + 액션 */}
          <div className="p-6 sm:p-7 flex flex-col">
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-600 font-semibold">
              오늘 {t.channelLabel} · {t.publishAt}
            </div>

            <p className="mt-3 text-[15px] leading-[1.65] text-zinc-800 dark:text-zinc-100 whitespace-pre-line">
              {t.caption}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1">
              {t.hashtags.slice(0, 5).map((h) => (
                <span key={h} className="text-[12px] text-zinc-500 dark:text-zinc-500">
                  {h}
                </span>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-900">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-500 italic leading-relaxed">
                {shop.today.reasoning}
              </div>
            </div>

            {/* 액션 — 핵심 1개, 보조 1개 */}
            <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setApproved((v) => !v)}
                className={cn(
                  "flex-1 h-11 rounded-lg text-[14px] font-medium transition-all inline-flex items-center justify-center gap-2",
                  approved
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200",
                )}
              >
                {approved ? (
                  <>
                    <Check className="h-4 w-4" />
                    {t.publishAt}에 올라갑니다
                  </>
                ) : (
                  "이대로 올리기"
                )}
              </button>
              <button
                type="button"
                onClick={() => setAskedAlt(true)}
                className="h-11 px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors text-[14px]"
              >
                {askedAlt ? "다른 분위기로 다시 준비할게요" : "다른 분위기"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────
// 이번주 운영 — 7일 도트
// ─────────────────────────────────────────────────────────────

function ThisWeek({ shop }: { shop: ShopHand }) {
  return (
    <section className="mb-12 sm:mb-16">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-600 font-semibold">
          이번주 운영
        </h3>
        <span className="text-[12px] text-zinc-400 dark:text-zinc-600">
          사장님이 따로 안 하셔도 됩니다
        </span>
      </div>
      <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-6 bg-white dark:bg-zinc-950">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
          {shop.week.map((d) => (
            <div key={`${d.date}-${d.weekday}`} className="text-center">
              <div
                className={cn(
                  "text-[10px] font-medium mb-2",
                  d.isToday ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-600",
                )}
              >
                {d.weekday}
              </div>
              <div
                className={cn(
                  "aspect-[3/4] rounded-md",
                  d.state === "today" && "bg-zinc-900 dark:bg-zinc-100",
                  d.state === "posted" && "bg-emerald-100 dark:bg-emerald-500/15",
                  d.state === "scheduled" && "bg-zinc-100 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700",
                  d.state === "rest" && "bg-transparent border border-zinc-100 dark:border-zinc-900",
                )}
                title={d.kind ?? "쉼"}
              />
              <div
                className={cn(
                  "mt-1.5 text-[10px] truncate",
                  d.isToday ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-400 dark:text-zinc-600",
                )}
              >
                {d.kind ?? "쉼"}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 text-[12px] text-zinc-500 dark:text-zinc-500">
          다음주 운영 계획은 이번주 반응 보고 직원이 미리 잡아둡니다.
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// 이번주 가게 반응 — 단어 위주
// ─────────────────────────────────────────────────────────────

function Reactions({ shop }: { shop: ShopHand }) {
  return (
    <section className="mb-12 sm:mb-16">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-[11px] uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-600 font-semibold">
          이번주 가게 반응
        </h3>
        <span className="text-[12px] text-zinc-400 dark:text-zinc-600">지난주 대비</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {shop.reactions.map((r, i) => (
          <motion.div
            key={`${r.metric}-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-5 sm:p-6 bg-white dark:bg-zinc-950"
          >
            <div className="text-[22px] sm:text-[26px] font-semibold tracking-tight tabular-nums leading-tight">
              {r.metric}
            </div>
            <div className="mt-1.5 text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {r.hint}
            </div>
            {r.quote && (
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-900 text-[12px] text-zinc-500 dark:text-zinc-500 italic">
                {r.quote}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// 직접 만들고 싶을 때 — 아주 작게
// ─────────────────────────────────────────────────────────────

function DirectMake() {
  const items = [
    { href: "/cardnews", label: "카드뉴스 직접 만들기" },
    { href: "/reels", label: "릴스 직접 만들기" },
    { href: "/blog", label: "블로그 글 직접 쓰기" },
    { href: "/calendar", label: "이번달 일정 보기" },
  ];
  return (
    <section className="pt-8 border-t border-zinc-100 dark:border-zinc-900">
      <h3 className="text-[11px] uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-600 font-semibold mb-3">
        직접 만들고 싶을 때
      </h3>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className="inline-flex items-center gap-1 text-[14px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              {it.label}
              <ChevronRight className="h-3 w-3 opacity-50" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
