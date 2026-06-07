"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Check, Upload, Loader2, ArrowRight, RefreshCw } from "lucide-react";
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
import { InstagramMobilePreview } from "@/components/dashboard/InstagramMobilePreview";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// 매거진 발행 톤 대시보드
// "오늘 사장님의 가게가 한 권의 매거진 호로 만들어진" 컨셉
// — 도구 칩·아이콘·그라디언트 0
// — 큰 여백·serif 헤드라인·hairline 보더만
// — 1 차 액션은 단 한 개: "이대로 발행"
// ─────────────────────────────────────────────────────────────

const TONE_STORAGE_PREFIX = "briq:dashboard-tone:";
const COVER_STORAGE_PREFIX = "briq:dashboard-cover:";

function readSavedTone(brandId: string, industryDefault: VoiceTone): VoiceTone {
  if (typeof window === "undefined") return industryDefault;
  try {
    const v = localStorage.getItem(TONE_STORAGE_PREFIX + brandId);
    if (v && (TONE_LIST as string[]).includes(v)) return v as VoiceTone;
  } catch { /* 무시 */ }
  return industryDefault;
}
function saveTone(brandId: string, tone: VoiceTone) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(TONE_STORAGE_PREFIX + brandId, tone); } catch { /* 무시 */ }
}

type CoverPick =
  | { kind: "auto" }
  | { kind: "candidate"; index: number; url: string; photographer?: string }
  | { kind: "upload"; url: string };

type Candidate = { url: string; photographer?: string };

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
    if (v && (v.kind === "candidate" || v.kind === "upload") && typeof v.url === "string") return v as CoverPick;
  } catch { /* 무시 */ }
  return null;
}
function saveCover(brandId: string, pick: CoverPick) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(COVER_STORAGE_PREFIX + brandId, JSON.stringify(pick)); } catch { /* 무시 */ }
}

// ─────────────────────────────────────────────────────────────
// 메인 — 매거진 한 호
// ─────────────────────────────────────────────────────────────

export function DashboardScreen() {
  const { brand } = useBrand();

  const [tone, setTone] = React.useState<VoiceTone>(() => TONE_DEFAULT[brand.industry]);
  React.useEffect(() => {
    setTone(readSavedTone(brand.id, TONE_DEFAULT[brand.industry]));
  }, [brand.id, brand.industry]);
  const changeTone = (next: VoiceTone) => {
    setTone(next);
    saveTone(brand.id, next);
  };

  const [shop, setShop] = React.useState<ShopHand | null>(null);
  React.useEffect(() => {
    setShop(getShopHand(brand, tone, new Date()));
  }, [brand, tone]);

  // 표지 url — CoverStory 가 통지, InstagramMobilePreview 와 공유
  const [coverUrl, setCoverUrl] = React.useState<string | null>(null);

  // 발행물 호수 — 브랜드 생성일 기반 결정적. 매일 +1 (지금은 더미: 일 단위)
  const issueNumber = React.useMemo(() => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 0);
    const today = new Date();
    const diff = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    // 브랜드별로 조금씩 다르게 — 매거진 호수 같은 절제된 숫자
    let h = 0;
    for (let i = 0; i < brand.id.length; i++) h = (h * 31 + brand.id.charCodeAt(i)) | 0;
    return Math.abs(h % 50) + diff;
  }, [brand.id]);

  if (!shop) {
    return (
      <div className="max-w-[1180px] mx-auto px-6 sm:px-12 pt-16 pb-24">
        <div className="h-3 w-32 bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse" />
        <div className="mt-6 h-16 w-3/4 bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-[color:var(--bg)] min-h-screen">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-10 md:px-14 pt-10 sm:pt-16 pb-24">
        <Masthead brand={brand} issueNumber={issueNumber} tone={tone} onToneChange={changeTone} />
        <AutomationStatus />
        <DivLine />
        <CoverStory shop={shop} brand={brand} tone={tone} onCoverChange={setCoverUrl} />
        <DivLine />
        <SuggestedMoves brand={brand} />
        <DivLine />
        <InstagramMobilePreview imageUrl={coverUrl} shop={shop} brand={brand} />
        <DivLine />
        <PublicationCalendar shop={shop} />
        <DivLine />
        <Readings shop={shop} />
        <DivLine />
        <ColophonLinks />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Automation status — "이미 자동으로 돌아가고 있다" 노출
// ─────────────────────────────────────────────────────────────

function AutomationStatus() {
  const { userBrand } = useBrand();
  // 실 사장님 신규 가입 직후엔 모든 카운터가 0 — 가짜 숫자 대신 첫 발걸음 안내
  const isFresh = !!userBrand;
  return (
    <section className="py-8 sm:py-10">
      <div className="flex items-baseline justify-between mb-4">
        <div className="editorial-label">Auto operations · live</div>
        <Link
          href="/automation"
          className="text-[11.5px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors underline underline-offset-4 decoration-[0.5px]"
        >
          모두 보기
        </Link>
      </div>
      {isFresh ? (
        <div className="border-y border-zinc-200 dark:border-zinc-800 py-7 grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-5">
          <div>
            <div className="editorial-label">아직 발행한 콘텐츠가 없어요</div>
            <p className="mt-2 text-[14px] text-zinc-700 dark:text-zinc-300">
              첫 캠페인을 만들면 카드뉴스 · 캡션 · 해시태그 · 발행 시간이 자동으로 정해집니다.
            </p>
          </div>
          <Link
            href="/campaigns"
            className="inline-flex items-center justify-center h-10 px-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[12.5px] tracking-[0.06em] font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors whitespace-nowrap"
          >
            첫 캠페인 시작 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-0 gap-y-6 border-y border-zinc-200 dark:border-zinc-800 py-7">
          <StatusBlock label="다음 발행 준비" value="완료" sub="오늘 오후 7:12" />
          <StatusBlock label="이번 주 예약" value="12" unit="건" sub="인스타 9 · 블로그 3" />
          <StatusBlock label="댓글 답변 제안" value="ON" sub="검수 후 발송" />
          <StatusBlock label="진행 중 캠페인" value="2" unit="개" sub="신메뉴 · 어버이날" />
        </div>
      )}
    </section>
  );
}

function StatusBlock({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string;
  unit?: string;
  sub: string;
}) {
  return (
    <div className="px-5 first:pl-0 sm:border-l sm:border-zinc-200 dark:sm:border-zinc-800 sm:first:border-l-0">
      <div className="editorial-label">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <div
          className="text-[28px] sm:text-[34px] tabular-nums leading-none tracking-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
        >
          {value}
        </div>
        {unit && <div className="text-[13px] text-zinc-500">{unit}</div>}
      </div>
      <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-500">{sub}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Suggested next moves — 시스템이 운영을 제안
// 사용자는 "만든다" 가 아니라 "고른다" 느낌
// ─────────────────────────────────────────────────────────────

function SuggestedMoves({ brand }: { brand: Brand }) {
  const moves = React.useMemo(() => suggestionsForIndustry(brand.industry, brand.name), [brand.industry, brand.name]);
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  const pickMove = (m: SuggestedMove) => {
    setPending(m.id);
    // /campaigns 가 ?topic= 을 받아 자동으로 카드뉴스 + 릴스 + 블로그 초안 한 건을 만든다.
    const params = new URLSearchParams({ topic: m.title, kind: m.kind ?? "신메뉴" });
    router.push(`/campaigns?${params.toString()}`);
  };

  return (
    <section className="py-12 sm:py-16">
      <div className="flex items-baseline justify-between mb-5">
        <div className="editorial-label">오늘 뭐 홍보할까요</div>
        <div className="text-[11px] text-zinc-500">하나 고르면 카드뉴스 · 릴스 · 캡션이 자동으로 만들어집니다</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-zinc-200 dark:border-zinc-800">
        {moves.map((m, i) => {
          const isPending = pending === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => pickMove(m)}
              disabled={pending !== null}
              className={cn(
                "group text-left p-6 border-b border-zinc-200 dark:border-zinc-800 transition-colors",
                i % 3 !== 2 && "lg:border-r lg:border-zinc-200 dark:lg:border-zinc-800",
                i % 2 !== 1 && "sm:border-r sm:border-zinc-200 dark:sm:border-zinc-800 sm:lg:border-r",
                "hover:bg-zinc-50 dark:hover:bg-zinc-900",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isPending && "bg-zinc-50 dark:bg-zinc-900",
              )}
            >
              <div className="editorial-label tabular-nums">{String(i + 1).padStart(2, "0")}</div>
              <h3
                className="mt-4 text-[19px] sm:text-[20px] tracking-tight leading-tight"
                style={{ fontFamily: "'Nanum Myeongjo', serif" }}
              >
                {m.title}
              </h3>
              <p className="mt-2.5 text-[13px] text-zinc-500 dark:text-zinc-500 leading-relaxed line-clamp-3">
                {m.desc}
              </p>
              <div className="mt-6 text-[11px] tracking-[0.15em] uppercase text-zinc-400 inline-flex items-center gap-1 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                {isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> 만드는 중…
                  </>
                ) : (
                  <>
                    초안 만들기 <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

type SuggestedMove = { id: string; title: string; desc: string; kind?: string };

function suggestionsForIndustry(industry: Brand["industry"], brandName: string): SuggestedMove[] {
  const name = brandName.replace(/\s.*$/, "");
  const generic: SuggestedMove[] = [
    {
      id: "new-menu",
      title: "신메뉴 / 신상품 홍보",
      kind: "신메뉴",
      desc: "이번 주 새로 들어온 메뉴/상품을 카드뉴스 + 릴스 + 캡션으로 자동 구성. 사진 1장만 있어도 됩니다.",
    },
    {
      id: "reservation",
      title: "예약·DM 유도",
      kind: "예약",
      desc: "이번 주 평일 빈 자리 안내. '이 시간 비어있어요' 톤의 인스타 한 컷 + 스토리 자동.",
    },
    {
      id: "review-repost",
      title: "최근 좋은 리뷰 리포스트",
      kind: "리뷰",
      desc: "네이버·인스타 최근 리뷰 중 톤 좋은 거 자동 큐레이션 → 스토리/카드뉴스 1장으로.",
    },
    {
      id: "trend",
      title: "동네 트렌드 콘텐츠",
      kind: "트렌드",
      desc: `${name} 위치 기반 검색 키워드 분석 → 그에 맞는 게시물 한 컷 자동.`,
    },
    {
      id: "event",
      title: "이번 시즌 이벤트",
      kind: "시즌",
      desc: "어버이날·여름 휴가·크리스마스 등 시즌별 자연스러운 이벤트 안내. 광고티 없이.",
    },
    {
      id: "revisit",
      title: "단골 재방문 유도",
      kind: "단골",
      desc: "최근 60일 동안 방문 없으신 분 대상으로 잔잔한 리마인드 게시물.",
    },
  ];
  return generic;
}

// ─────────────────────────────────────────────────────────────
// 1. Masthead — 매거진 표지 헤더
// ─────────────────────────────────────────────────────────────

function Masthead({
  brand,
  issueNumber,
  tone,
  onToneChange,
}: {
  brand: Brand;
  issueNumber: number;
  tone: VoiceTone;
  onToneChange: (t: VoiceTone) => void;
}) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const dateKo = today.toLocaleDateString("ko-KR", { weekday: "long" });

  return (
    <header className="pb-10 sm:pb-14">
      {/* 매거진 라인 — 가로 hairline + 발행 메타 */}
      <div className="flex items-baseline justify-between border-b border-zinc-300 dark:border-zinc-700 pb-3">
        <div className="editorial-label">{brand.name}</div>
        <div className="editorial-label tabular-nums">No. {issueNumber.toString().padStart(3, "0")}</div>
      </div>
      <div className="mt-2 flex items-baseline justify-between text-[11px] text-zinc-500 dark:text-zinc-500">
        <span className="tabular-nums">{dateStr} · {dateKo}</span>
        <span className="hidden sm:inline">A daily issue, edited by BRIQ.</span>
      </div>

      {/* 큰 헤드라인 — 매거진 cover line */}
      <h1
        className="mt-10 sm:mt-14 text-[44px] sm:text-[64px] md:text-[84px] leading-[0.95] tracking-[-0.025em] font-medium"
        style={{ fontFamily: "'Cormorant Garamond', 'Nanum Myeongjo', serif", fontWeight: 500 }}
      >
        오늘 한 컷.
      </h1>
      <p className="mt-5 sm:mt-7 max-w-[520px] text-[14px] sm:text-[15px] leading-[1.65] text-zinc-600 dark:text-zinc-400">
        {brand.name} 의 오늘 발행물이 준비되었습니다. 한 페이지를 넘기듯 천천히 읽으시고, 마음에 드시면 그대로 인스타에 올립니다.
      </p>

      {/* 톤 셀렉트 — 매거진 호의 "어조" 슬롯. 절제된 칩 */}
      <div className="mt-8 sm:mt-10 flex items-center gap-3 flex-wrap">
        <span className="editorial-label">Tone</span>
        <div className="flex items-center gap-0">
          {TONE_LIST.map((t, i) => {
            const active = t === tone;
            return (
              <React.Fragment key={t}>
                {i > 0 && <span className="text-zinc-300 dark:text-zinc-700 mx-2 text-[10px]">·</span>}
                <button
                  type="button"
                  onClick={() => onToneChange(t)}
                  title={TONE_HINT[t]}
                  className={cn(
                    "text-[12px] tracking-[0.02em] transition-colors py-1",
                    active
                      ? "text-zinc-900 dark:text-zinc-100 font-medium underline underline-offset-4 decoration-[0.5px]"
                      : "text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100",
                  )}
                >
                  {TONE_LABEL[t]}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. Cover Story — 잡지의 메인 피처 / 오늘 발행물
// ─────────────────────────────────────────────────────────────

function CoverStory({
  shop,
  brand,
  tone,
  onCoverChange,
}: {
  shop: ShopHand;
  brand: Brand;
  tone: VoiceTone;
  /** 부모(Dashboard)에게 현재 표지 url 통지 — 모바일 미리보기와 공유 */
  onCoverChange?: (url: string | null) => void;
}) {
  const t = shop.today;
  const [approved, setApproved] = React.useState(false);
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [coverPick, setCoverPick] = React.useState<CoverPick>({ kind: "auto" });
  const [loadingCover, setLoadingCover] = React.useState(true);
  const [pageSeed, setPageSeed] = React.useState(1);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // 사장님이 이미 본 사진 url 누적 — "다른 사진" 누를 때마다 다음 풀이 본 것 제외
  const seenUrlsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    const saved = readSavedCover(brand.id);
    setCoverPick(saved ?? { kind: "auto" });
    setPageSeed(1);
    seenUrlsRef.current = [];
  }, [brand.id]);

  // brand.id 해시 → page offset
  const brandPageOffset = React.useMemo(() => {
    let h = 0;
    for (let i = 0; i < brand.id.length; i++) h = (h * 31 + brand.id.charCodeAt(i)) | 0;
    return (Math.abs(h) % 4) + 1;
  }, [brand.id]);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingCover(true);
    const query = COVER_QUERY[brand.industry]?.[tone] ?? COVER_QUERY[brand.industry]?.editorial ?? "editorial natural light";
    const effectivePage = brandPageOffset + (pageSeed - 1);
    (async () => {
      try {
        const res = await fetch("/api/search-pexels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            orientation: "portrait",
            perPage: 40,
            page: effectivePage,
            returnCandidates: true,
            candidateCount: 6,
            slideId: brand.id,
            industry: brand.industry,
            // demo fallback 모드에서 이미 본 사진 제외
            excludeUrls: seenUrlsRef.current,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data?.ok && Array.isArray(data.candidates) && data.candidates.length > 0) {
          const list = data.candidates.map((c: { url: string; photographer?: string }) => ({ url: c.url, photographer: c.photographer }));
          setCandidates(list);
          // 본 사진 누적
          seenUrlsRef.current = [...seenUrlsRef.current, ...list.map((c: { url: string }) => c.url)];
        } else if (data?.ok && data.image) {
          setCandidates([{ url: data.image, photographer: data.meta?.photographer }]);
          seenUrlsRef.current = [...seenUrlsRef.current, data.image];
        }
      } catch { /* 무시 */ }
      finally { if (!cancelled) setLoadingCover(false); }
    })();
    return () => { cancelled = true; };
  }, [brand.id, brand.industry, tone, pageSeed, brandPageOffset]);

  const coverUrl: string | null =
    coverPick.kind === "upload" ? coverPick.url
      : coverPick.kind === "candidate" ? coverPick.url
        : candidates[0]?.url ?? null;
  const photographer =
    coverPick.kind === "upload" ? null
      : coverPick.kind === "candidate" ? coverPick.photographer
        : candidates[0]?.photographer;

  // 부모에게 coverUrl 통지
  React.useEffect(() => {
    onCoverChange?.(coverUrl);
  }, [coverUrl, onCoverChange]);

  const pickCandidate = (idx: number) => {
    const c = candidates[idx]; if (!c) return;
    const pick: CoverPick = { kind: "candidate", index: idx, url: c.url, photographer: c.photographer };
    setCoverPick(pick); saveCover(brand.id, pick);
  };

  const onFileChosen = (file: File | null | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result ?? ""); if (!url) return;
      const pick: CoverPick = { kind: "upload", url };
      setCoverPick(pick); saveCover(brand.id, pick);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="pb-14 sm:pb-20">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChosen(e.target.files?.[0])} />

      {/* 메인 cover + 본문 — 2 단 매거진 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 md:gap-x-14 gap-y-10">
        {/* 좌측 cover — 7 컬럼 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="md:col-span-7"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            {coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt={t.slideTitle} className="absolute inset-0 h-full w-full object-cover" />
            )}
            {loadingCover && !coverUrl && (
              <div className="absolute inset-0 grid place-items-center">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              </div>
            )}
            {/* 아주 절제된 라벨 — 매거진 caption 결 */}
            {photographer && (
              <div className="absolute bottom-3 right-3 text-[10px] tracking-[0.12em] uppercase text-white/85 mix-blend-difference">
                ph. {photographer}
              </div>
            )}
          </div>

          {/* 사진 큐레이션 — 매거진 contact sheet 결, 6장 작게 */}
          <div className="mt-4 flex items-center gap-3">
            <span className="editorial-label">Contact sheet</span>
            <div className="flex-1 grid grid-cols-6 gap-1.5">
              {candidates.slice(0, 6).map((c, i) => {
                const isPickedCandidate =
                  coverPick.kind === "candidate" && coverPick.url === c.url;
                const isAutoAndFirst = coverPick.kind === "auto" && i === 0;
                const active = isPickedCandidate || isAutoAndFirst;
                return (
                  <button
                    key={`${c.url}-${i}`}
                    type="button"
                    onClick={() => pickCandidate(i)}
                    className={cn(
                      "aspect-[4/5] overflow-hidden transition-opacity",
                      active ? "opacity-100 ring-1 ring-zinc-900 dark:ring-zinc-100" : "opacity-60 hover:opacity-100",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.url} alt="" className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPageSeed((p) => p + 1)}
              disabled={loadingCover}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[12px] tracking-[0.04em] font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingCover ? "animate-spin" : ""}`} />
              {loadingCover ? "찾는 중…" : "다른 사진 추천"}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[12px] tracking-[0.04em] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              직접 올리기
            </button>
            <span className="ml-auto text-[10.5px] text-zinc-400 tabular-nums">시트 {pageSeed}</span>
          </div>
        </motion.div>

        {/* 우측 본문 — 5 컬럼, 매거진 카피 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
          className="md:col-span-5 flex flex-col"
        >
          <div className="editorial-label">Feature</div>
          <h2
            className="mt-3 text-[24px] sm:text-[28px] md:text-[32px] leading-[1.15] tracking-[-0.01em] text-zinc-900 dark:text-zinc-100"
            style={titleStyle(t)}
          >
            {t.slideTitle}
          </h2>
          {t.slideHint && (
            <p className="mt-3 text-[13.5px] text-zinc-500 dark:text-zinc-500 leading-relaxed" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
              {t.slideHint}
            </p>
          )}
          <div className="mt-7 sm:mt-9 border-t border-zinc-200 dark:border-zinc-800 pt-7" />
          <p className="text-[15px] leading-[1.78] text-zinc-800 dark:text-zinc-200 whitespace-pre-line" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
            {t.caption}
          </p>
          <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-zinc-500 dark:text-zinc-500">
            {t.hashtags.slice(0, 5).map((h, i) => <span key={`${h}-${i}`} className="tracking-[0.01em]">{h}</span>)}
          </div>

          {/* 매거진 colophon 결 — 직원 메모 작게 */}
          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="editorial-label mb-2">Editor's Note</div>
            <div className="text-[12px] text-zinc-500 dark:text-zinc-500 leading-relaxed" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
              {shop.today.reasoning}
            </div>
          </div>

          {/* 액션 — 단 하나의 매거진-결 버튼 */}
          <div className="mt-8 sm:mt-10">
            <button
              type="button"
              onClick={() => setApproved((v) => !v)}
              className={cn(
                "group w-full h-12 inline-flex items-center justify-between px-5 transition-all",
                approved
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200",
              )}
            >
              <span className="text-[13px] tracking-[0.04em] uppercase font-medium">
                {approved ? `${t.publishAt} 발행 예정` : "이대로 발행"}
              </span>
              {approved ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
            </button>
            <div className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-600 tracking-[0.02em]">
              {t.channelLabel} · 오늘 {t.publishAt}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// 타이틀 서체 — 영문이면 Cormorant italic, 한국어면 Nanum Myeongjo
function titleStyle(t: { titleFont?: "serif" | "sans"; slideTitle: string }): React.CSSProperties {
  if (t.titleFont === "sans") return { fontFamily: "var(--font-sans)", fontStyle: "normal" };
  const isMostlyEnglish = /^[A-Za-z0-9\s.,'’!?-]+$/.test(t.slideTitle);
  if (isMostlyEnglish) return { fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", letterSpacing: "-0.01em" };
  return { fontFamily: "'Nanum Myeongjo', serif", fontStyle: "normal" };
}

// ─────────────────────────────────────────────────────────────
// 3. Publication Calendar — 이번 호 운영 메모, 잡지 목차 결
// ─────────────────────────────────────────────────────────────

function PublicationCalendar({ shop }: { shop: ShopHand }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 md:gap-x-14 gap-y-6">
        <div className="md:col-span-3">
          <div className="editorial-label">Publication Schedule</div>
          <h3 className="mt-3 text-[20px] sm:text-[22px] leading-[1.2] tracking-tight" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
            이번 주
          </h3>
          <p className="mt-3 text-[12.5px] text-zinc-500 dark:text-zinc-500 leading-relaxed">
            발행 일정은 사장님이 따로 잡지 않습니다. 매일 한 호씩, 자동으로.
          </p>
        </div>
        <div className="md:col-span-9">
          <ol className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
            {shop.week.map((d) => (
              <li key={`${d.date}-${d.weekday}`} className="grid grid-cols-12 items-baseline gap-3 py-3.5">
                <div className="col-span-2 sm:col-span-1 editorial-label tabular-nums">{d.weekday}</div>
                <div className="col-span-3 sm:col-span-2 text-[12px] text-zinc-400 dark:text-zinc-600 tabular-nums">{d.date}</div>
                <div className="col-span-5 sm:col-span-7 text-[14px] text-zinc-900 dark:text-zinc-100" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
                  {d.kind ?? "쉼"}
                </div>
                <div className="col-span-2 sm:col-span-2 text-right text-[11px] tracking-[0.12em] uppercase">
                  {d.state === "today" && <span className="text-zinc-900 dark:text-zinc-100">Today</span>}
                  {d.state === "posted" && <span className="text-zinc-400 dark:text-zinc-600">Issued</span>}
                  {d.state === "scheduled" && <span className="text-zinc-400 dark:text-zinc-600">Scheduled</span>}
                  {d.state === "rest" && <span className="text-zinc-300 dark:text-zinc-700">—</span>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. Readings — 이번 주 가게 반응 (잡지 reader letter 결)
// ─────────────────────────────────────────────────────────────

function Readings({ shop }: { shop: ShopHand }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 md:gap-x-14 gap-y-6">
        <div className="md:col-span-3">
          <div className="editorial-label">Readings</div>
          <h3 className="mt-3 text-[20px] sm:text-[22px] leading-[1.2] tracking-tight" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
            이번 주 반응
          </h3>
          <p className="mt-3 text-[12.5px] text-zinc-500 dark:text-zinc-500 leading-relaxed">
            지난 호들이 사장님 가게에 어떤 손님을 데려왔는지.
          </p>
        </div>
        <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-6">
          {shop.reactions.map((r, i) => (
            <div key={`${r.metric}-${i}`} className="border-l border-zinc-200 dark:border-zinc-800 pl-5">
              <div
                className="text-[28px] sm:text-[32px] leading-[1] tracking-tight tabular-nums"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
              >
                {r.metric}
              </div>
              <div className="mt-2 text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
                {r.hint}
              </div>
              {r.quote && (
                <div className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-600" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>{r.quote}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. Colophon — 매거진 발행처 / 직접 만들기 작은 링크
// ─────────────────────────────────────────────────────────────

function ColophonLinks() {
  const items = [
    { href: "/cardnews", label: "Cardnews" },
    { href: "/reels", label: "Reels" },
    { href: "/blog", label: "Blog" },
    { href: "/scheduler", label: "Scheduler" },
  ];
  return (
    <section className="pt-10 sm:pt-14">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 md:gap-x-14 gap-y-4">
        <div className="md:col-span-3">
          <div className="editorial-label">Colophon</div>
        </div>
        <div className="md:col-span-9">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className="text-[13px] tracking-[0.02em] text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                {it.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 text-[11px] text-zinc-400 dark:text-zinc-600">
            매일 한 호씩 발행됩니다. 직접 만들고 싶을 때는 위 메뉴에서.
          </div>
        </div>
      </div>
    </section>
  );
}

// 절제된 hairline divider — 섹션 사이
function DivLine() {
  return <div className="border-t border-zinc-200 dark:border-zinc-800" />;
}
