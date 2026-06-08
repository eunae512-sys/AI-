"use client";

// 자동 카드뉴스 슬라이드 캐러셀.
//
// 디자인 시스템 (디자이너 작업물 톤):
//   · 폰트 = Pretendard Variable (text) + Cormorant Garamond Italic (큰 챕터 넘버럴 1개만 — 디자이너 액센트)
//   · 안전영역 = 좌우 10% · 상단 8% · 하단 20%
//   · 슬라이드당 핵심 메시지 1개 — 한 줄 ~ 두 줄
//   · 광고 느낌 차단 — 강조색 / 이모지 / 복잡 레이아웃 0
//
// 컴포지션 5종 (시드 따라 분배):
//   · masthead     — 표지 / 마감 (1번, 7번)
//   · pillar-left  — 좌측 얇은 세로선 + 큰 챕터 넘버럴
//   · paper-split  — 좌측 페이퍼 패널(텍스트) + 우측 이미지
//   · overlay-card — 풀블리드 이미지 + 페이퍼 카드 오버레이
//   · type-hero    — 페이퍼 톤 위 타이포가 비주얼 (PROOF 용)
//
// 페이퍼 톤 5종 — 디자이너 팔레트.

import * as React from "react";
import { motion } from "motion/react";
import type { CardnewsSlide, BrandMarkConfig } from "./types";
import { SlideImagePicker } from "./SlideImagePicker";
import { BrandMarkPicker } from "./BrandMarkPicker";
import { Watermark } from "@/components/billing/Watermark";
import { loadBrandMark, saveBrandMark, DEFAULT_MARK } from "@/lib/brand/brand-mark";
import {
  LAYOUT_PRESETS,
  loadLayoutPreset,
  saveLayoutPreset,
  getPreset,
  type LayoutPresetId,
} from "@/lib/brand/layout-preset";

type Props = {
  slides: CardnewsSlide[];
  industry?: string;
  brandId?: string;
  brandWordmark?: string;
  /** 인스타 캡션 — 모바일 미리보기에서 IG 피드 캡션 영역에 표시 */
  caption?: string;
  /** 인스타 핸들 — 모바일 미리보기 헤더 */
  handle?: string;
};

type ViewMode = "desktop" | "mobile";

// ─────────────────────────────────────────────────────────────────────────────
// 디자이너 팔레트 — 종이 톤
// ─────────────────────────────────────────────────────────────────────────────

const PAPER: Record<NonNullable<CardnewsSlide["paperTone"]>, { bg: string; ink: string; rule: string }> = {
  cream: { bg: "#F4EFE3", ink: "#2A2419", rule: "rgba(42,36,25,0.18)" },
  dust:  { bg: "#E8E2D2", ink: "#2D2820", rule: "rgba(45,40,32,0.18)" },
  sand:  { bg: "#D9C9A8", ink: "#3B2F1F", rule: "rgba(59,47,31,0.18)" },
  sage:  { bg: "#C8CAB9", ink: "#2A2E25", rule: "rgba(42,46,37,0.18)" },
  ink:   { bg: "#1F1B16", ink: "#F1E9D8", rule: "rgba(241,233,216,0.22)" },
};

const FONT_TEXT = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const FONT_NUMERAL = '"Cormorant Garamond", "Nanum Myeongjo", serif';

// ─────────────────────────────────────────────────────────────────────────────
// 인라인 편집 컨텍스트 — 5개 컴포지션이 공유.
// 각 컴포지션이 slide.caption / slide.subtext 를 렌더할 때 EditableText 로 감싼다.
// ─────────────────────────────────────────────────────────────────────────────

type EditField = "caption" | "subtext";
type EditState = { idx: number; field: EditField } | null;

type EditCtxValue = {
  editing: EditState;
  startEdit: (idx: number, field: EditField) => void;
  endEdit: () => void;
  updateField: (idx: number, field: EditField, value: string) => void;
};

const EditCtx = React.createContext<EditCtxValue | null>(null);

function useEditCtx() {
  return React.useContext(EditCtx);
}

// 인라인 편집 가능한 텍스트 — composition 안에서 slide.caption / slide.subtext 자리에 끼움.
// 디자인 원칙:
//   · 평소엔 일반 텍스트로 보임 (편집 가능 표시는 hover 시 옅은 ring 만)
//   · 클릭 시 textarea 로 변환 — 동일 스타일 그대로
//   · Enter (shift 없이) 또는 blur → 저장 / Escape → 취소
function EditableText({
  idx,
  field,
  value,
  className,
  style,
  multiline,
  placeholder,
  displayValue,
}: {
  idx: number;
  field: EditField;
  value: string;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  placeholder?: string;
  /** 평소엔 이것을 보여주고 편집할 땐 value 를 텍스트영역에 띄움.
   *  TypeHero 처럼 일부만 표시되는 경우 — value 는 전체 캡션, displayValue 는 추출 후 잔여. */
  displayValue?: string;
}) {
  const ctx = useEditCtx();
  // 컨텍스트가 없으면 (편집 비활성 환경) — 그냥 텍스트 렌더
  if (!ctx) {
    return (
      <p className={className} style={style}>
        {value}
      </p>
    );
  }

  const isEditing = ctx.editing?.idx === idx && ctx.editing?.field === field;
  const inkLight = (style?.color as string | undefined) ? false : true;

  if (isEditing) {
    return (
      <textarea
        autoFocus
        defaultValue={value}
        onFocus={(e) => {
          const t = e.currentTarget;
          // 커서를 끝에 두기
          t.setSelectionRange(t.value.length, t.value.length);
        }}
        onBlur={(e) => {
          ctx.updateField(idx, field, e.target.value);
          ctx.endEdit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            ctx.endEdit();
          }
          if (e.key === "Enter" && !e.shiftKey && !multiline) {
            e.preventDefault();
            (e.currentTarget as HTMLTextAreaElement).blur();
          }
        }}
        placeholder={placeholder}
        rows={Math.max(1, Math.min(6, Math.ceil((value || "").length / 24) + (multiline ? 1 : 0)))}
        className={`${className ?? ""} bg-transparent outline-none border-0 w-full block resize-none ring-1 ring-current/40 rounded-sm`}
        style={{
          ...style,
          // textarea 의 기본 폰트 무시 — 컴포지션 스타일 그대로
          caretColor: "currentColor",
        }}
      />
    );
  }

  const shownText = displayValue !== undefined ? displayValue : value;
  return (
    <p
      className={`${className ?? ""} cursor-text relative group/edit`}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        ctx.startEdit(idx, field);
      }}
      title="클릭해서 수정"
    >
      {shownText || (
        <span className="opacity-40" style={{ fontStyle: "italic" }}>
          {placeholder ?? "텍스트를 입력하세요"}
        </span>
      )}
      <span
        aria-hidden="true"
        className="absolute -inset-1 rounded-sm ring-1 ring-current/0 group-hover/edit:ring-current/25 transition-all pointer-events-none"
      />
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 캐러셀
// ─────────────────────────────────────────────────────────────────────────────

export function CardnewsCarousel({ slides: initialSlides, industry, brandId, brandWordmark, caption, handle }: Props) {
  const [i, setI] = React.useState(0);
  const total = initialSlides.length;
  const [mark, setMark] = React.useState<BrandMarkConfig>(DEFAULT_MARK);
  const [viewMode, setViewMode] = React.useState<ViewMode>("mobile");
  const [presetId, setPresetId] = React.useState<LayoutPresetId>("auto");

  // 인라인 편집 상태 — 5개 컴포지션이 공유
  const [editing, setEditing] = React.useState<EditState>(null);

  React.useEffect(() => {
    if (!brandId) return;
    setMark(loadBrandMark(brandId));
    setPresetId(loadLayoutPreset(brandId));
  }, [brandId]);

  // 프리셋 변경 시 슬라이드 컴포지션 시퀀스 덮어쓰기 — 카피·이미지는 유지, 레이아웃만 교체.
  // SSR 안전: localStorage 는 useEffect 안에서만 — useState 초기화는 initialSlides 그대로.
  const sequence = React.useMemo(() => getPreset(presetId).sequence, [presetId]);
  const [slides, setSlides] = React.useState<CardnewsSlide[]>(initialSlides);
  React.useEffect(() => {
    setSlides((prev) => {
      // 브랜드/토픽이 바뀌어 캡션이 달라졌으면 → initialSlides 로 완전 교체.
      // 캡션이 같으면 (preset 만 바뀐 경우) → prev 유지하며 composition 만 교체 (사용자가 픽한 이미지 보존).
      const sameContent =
        prev.length === initialSlides.length &&
        prev.every((s, i) => s.caption === initialSlides[i]?.caption);
      const base = sameContent ? prev : initialSlides;
      // auto: 생성기가 이미 업종·시드로 변주한 composition 을 그대로 존중 (덮어쓰지 않음).
      // 수동 프리셋: 프리셋 시퀀스로 composition 만 교체 (카피·이미지 유지).
      if (presetId === "auto") {
        return base.map((s) => ({ ...s }));
      }
      return base.map((s, idx) => ({
        ...s,
        composition: sequence[idx] ?? s.composition,
      }));
    });
  }, [sequence, initialSlides, presetId]);

  const updateMark = (next: BrandMarkConfig) => {
    setMark(next);
    if (brandId) saveBrandMark(brandId, next);
  };

  const updatePreset = (next: LayoutPresetId) => {
    setPresetId(next);
    if (brandId) saveLayoutPreset(brandId, next);
  };

  // 인라인 편집 컨텍스트 값 — Provider 로 모든 SlideFrame 에 흘려보냄
  const editCtxValue = React.useMemo<EditCtxValue>(
    () => ({
      editing,
      startEdit: (idx, field) => setEditing({ idx, field }),
      endEdit: () => setEditing(null),
      updateField: (idx, field, value) => {
        setSlides((prev) => prev.map((s, si) => (si === idx ? { ...s, [field]: value } : s)));
      },
    }),
    [editing],
  );

  // cover 없는 슬라이드 — Pexels 자동 로드.
  // 의존성: 슬라이드 캡션 키 + industry + brandId — 브랜드/토픽 바뀌면 새 쿼리로 다시 페치.
  const slideContentKey = React.useMemo(
    () => initialSlides.map((s) => `${s.n}:${s.imageQuery ?? s.caption}`).join("|"),
    [initialSlides],
  );
  React.useEffect(() => {
    let cancelled = false;
    // 슬라이드 간 사진 중복 제거 — 2-pass:
    //  1) 병렬: 각 슬라이드의 후보 풀(returnCandidates)을 모은다.
    //  2) 단일 동기 패스: used Set 으로 슬라이드 순서대로 distinct 배정.
    const run = async () => {
      // 1차: 슬라이드별 후보 url 풀 수집 (병렬)
      const pools: string[][] = await Promise.all(
        initialSlides.map(async (s) => {
          try {
            const q = s.imageQuery ?? buildEditorialQuery(s.caption, industry);
            const r = await fetch("/api/search-pexels", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: q,
                orientation: "portrait",
                perPage: 30,
                allowPeople: false,
                slideId: s.n,
                returnCandidates: true,
                candidateCount: 9,
              }),
            });
            const data = await r.json();
            if (!data?.ok) return [];
            const urls: string[] = Array.isArray(data.candidates)
              ? data.candidates.map((c: { url?: string }) => c?.url).filter(Boolean)
              : [];
            if (urls.length) return urls;
            return typeof data.image === "string" && data.image ? [data.image] : [];
          } catch {
            return [];
          }
        }),
      );
      if (cancelled) return;

      // 2차: distinct 배정 (단일 동기 패스)
      const allUrls = pools.flat();
      const used = new Set<string>();
      const assigned: (string | undefined)[] = pools.map((pool) => {
        // 자기 풀에서 used 에 없는 첫 url
        const own = pool.find((u) => !used.has(u));
        const pick = own ?? allUrls.find((u) => !used.has(u));
        if (pick) used.add(pick);
        return pick;
      });

      // state 반영 — race 방지 위해 한 번에 setSlides
      setSlides((prev) => {
        const next = [...prev];
        for (let idx = 0; idx < next.length; idx++) {
          const url = assigned[idx];
          if (!url) continue; // 빈 풀 / 배정 실패 — 기존 cover 유지
          const existing = next[idx];
          // 사용자가 SlideImagePicker 로 직접 픽한 이미지(data URL / upload)는 덮어쓰지 않음.
          if (existing?.cover && !existing.cover.startsWith("http")) continue;
          next[idx] = { ...existing, cover: url };
        }
        return next;
      });
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideContentKey, industry, brandId]);

  const go = (n: number) => setI(((n % total) + total) % total);

  const setCoverAt = (idx: number, cover: string) => {
    setSlides((cur) => {
      const out = [...cur];
      out[idx] = { ...out[idx], cover };
      return out;
    });
  };

  return (
    <EditCtx.Provider value={editCtxValue}>
    <div className="w-full">
      {brandId && brandWordmark && (
        <div className="border-y border-zinc-200 dark:border-zinc-800">
          <BrandMarkPicker config={mark} brandWordmark={brandWordmark} onChange={updateMark} />
          {/* 레이아웃 프리셋 — 브랜드별 컴포지션 시퀀스 한 번에 결정 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5 border-t border-zinc-200 dark:border-zinc-800">
            <span className="editorial-label">레이아웃</span>
            <div className="inline-flex border border-zinc-200 dark:border-zinc-800 flex-wrap">
              {LAYOUT_PRESETS.map((p) => {
                const active = presetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updatePreset(p.id)}
                    title={p.description}
                    className={`px-2.5 h-7 text-[10.5px] tracking-[0.06em] transition-colors ${
                      active
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <span className="text-[10.5px] text-zinc-500 leading-snug flex-1 min-w-0 truncate">
              {getPreset(presetId).description}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-baseline justify-between mt-3 mb-2">
        <div className="editorial-label">카드뉴스 · {total} 슬라이드</div>
        <div className="flex items-center gap-4">
          {/* 데스크탑 / 모바일 뷰 토글 */}
          <div className="inline-flex border border-zinc-200 dark:border-zinc-800">
            {(["desktop", "mobile"] as ViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setViewMode(v)}
                className={`px-2.5 h-6 text-[10px] tracking-[0.12em] uppercase transition-colors ${
                  viewMode === v
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {v === "desktop" ? "데스크탑" : "모바일"}
              </button>
            ))}
          </div>
          <div className="text-[10px] tabular-nums text-zinc-500">
            <span className="text-zinc-900 dark:text-zinc-100">{String(i + 1).padStart(2, "0")}</span>
            <span className="mx-1 text-zinc-300">/</span>
            {String(total).padStart(2, "0")}
          </div>
        </div>
      </div>

      {viewMode === "mobile" ? (
        <PhoneShell
          handle={handle}
          mark={mark}
          brandWordmark={brandWordmark}
          slideIndex={i}
          total={total}
          caption={caption}
          onPrev={() => go(i - 1)}
          onNext={() => go(i + 1)}
        >
          <SlideContainer>
            {slides.map((s, si) => (
              <SlideFrame
                key={si}
                slide={s}
                slideIdx={si}
                total={total}
                active={si === i}
                mark={mark}
                brandWordmark={brandWordmark}
              />
            ))}
            {slides[i] && (
              <SlideImagePicker
                key={`pick-${i}`}
                caption={slides[i].caption}
                imageQuery={slides[i].imageQuery}
                industry={industry}
                slideId={slides[i].n}
                onPick={(url) => setCoverAt(i, url)}
              />
            )}
          </SlideContainer>
        </PhoneShell>
      ) : (
      <div
        className="relative w-full aspect-[4/5] bg-[color:var(--bg-soft)] border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        style={{ containerType: "inline-size" }}
      >
        {slides.map((s, si) => (
          <SlideFrame
            key={si}
            slide={s}
            slideIdx={si}
            total={total}
            active={si === i}
            mark={mark}
            brandWordmark={brandWordmark}
          />
        ))}

        {slides[i] && (
          <SlideImagePicker
            key={`pick-${i}`}
            caption={slides[i].caption}
            imageQuery={slides[i].imageQuery}
            industry={industry}
            slideId={slides[i].n}
            onPick={(url) => setCoverAt(i, url)}
          />
        )}

        <button
          type="button"
          onClick={() => go(i - 1)}
          aria-label="이전 슬라이드"
          className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur text-zinc-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-900 transition-colors z-30"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => go(i + 1)}
          aria-label="다음 슬라이드"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur text-zinc-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-900 transition-colors z-30"
        >
          →
        </button>
      </div>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        {slides.map((_, si) => (
          <button
            key={si}
            type="button"
            onClick={() => go(si)}
            aria-label={`${si + 1} 번째 슬라이드`}
            className={`h-[3px] transition-all ${
              si === i
                ? "w-7 bg-zinc-900 dark:bg-zinc-100"
                : "w-3 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-500"
            }`}
          />
        ))}
      </div>

      {/* 편집 안내 — 슬라이드 텍스트 클릭하면 인라인 수정 가능 */}
      <p className="mt-3 text-[10.5px] text-zinc-400 leading-relaxed">
        ✎ 슬라이드의 큰 글씨/작은 글씨를 직접 클릭해서 수정할 수 있어요. <span className="text-zinc-500">Enter</span> 로 저장, <span className="text-zinc-500">Esc</span> 로 취소.
      </p>
    </div>
    </EditCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 모바일 미리보기 — iPhone 결 폰 셸 + 인스타 피드 UI
// ─────────────────────────────────────────────────────────────────────────────

function SlideContainer({ children }: { children: React.ReactNode }) {
  // 4:5 컨테이너 + container-type: inline-size — 슬라이드 안 cqw 가 이 컨테이너 너비 기준으로 계산됨
  return (
    <div
      className="relative w-full aspect-[4/5] bg-[color:var(--bg-soft)] overflow-hidden"
      style={{ containerType: "inline-size" }}
    >
      {children}
    </div>
  );
}

function PhoneShell({
  handle,
  mark,
  brandWordmark,
  slideIndex,
  total,
  caption,
  onPrev,
  onNext,
  children,
}: {
  handle?: string;
  mark: BrandMarkConfig;
  brandWordmark?: string;
  slideIndex: number;
  total: number;
  caption?: string;
  onPrev: () => void;
  onNext: () => void;
  children: React.ReactNode;
}) {
  const captionFirstLine = caption ? caption.split("\n").filter(Boolean)[0] : "";
  const igHandle = handle ?? (brandWordmark ? `@${brandWordmark.toLowerCase().replace(/\s/g, "_")}` : "@brand");

  return (
    <div className="flex justify-center py-4 bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800">
      {/* 폰 셸 — iPhone 15 비례 (393×852 → 미리보기 360×780) */}
      <div
        className="relative"
        style={{
          width: "360px",
          background: "#000",
          borderRadius: "44px",
          padding: "10px",
          boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)",
        }}
      >
        {/* 노치 */}
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 z-30"
          style={{ width: "108px", height: "26px", background: "#000", borderRadius: "0 0 14px 14px" }}
        />

        {/* 화면 */}
        <div
          className="relative bg-white dark:bg-zinc-950 overflow-hidden"
          style={{ borderRadius: "34px", width: "340px", height: "720px" }}
        >
          {/* 상단 상태바 */}
          <div
            className="flex items-center justify-between px-6 pt-2.5 pb-1"
            style={{ fontFamily: '"Pretendard Variable", sans-serif', fontWeight: 600, fontSize: "13px" }}
          >
            <span className="tabular-nums">9:41</span>
            <span className="opacity-0">·</span>
            <span className="flex items-center gap-1 text-[11px]">
              <span>5G</span>
              <span className="inline-block w-5 h-2.5 border border-current rounded-[2px] relative">
                <span className="absolute inset-y-0.5 left-0.5 right-1 bg-current" />
              </span>
            </span>
          </div>

          {/* IG 헤더 */}
          <div className="flex items-center gap-2 px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-900">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-200 via-rose-300 to-fuchsia-400 p-[1.5px]">
              <div className="h-full w-full rounded-full bg-white grid place-items-center text-[9px] font-semibold text-zinc-700 overflow-hidden">
                {mark.logoDataUrl ? (
                  <img src={mark.logoDataUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  (brandWordmark ?? "B").slice(0, 1)
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[12.5px] truncate"
                style={{ fontFamily: '"Pretendard Variable", sans-serif', fontWeight: 600 }}
              >
                {igHandle.replace(/^@/, "")}
              </div>
              <div className="text-[10px] text-zinc-500">Sponsored</div>
            </div>
            <button className="text-zinc-600 dark:text-zinc-400 text-[18px] leading-none" aria-label="more">⋯</button>
          </div>

          {/* 슬라이드 */}
          <div className="relative">
            {children}
            {/* Prev / Next 오버레이 — 폰 안에서도 작동 */}
            <button
              type="button"
              onClick={onPrev}
              aria-label="이전 슬라이드"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-full bg-white/85 backdrop-blur text-zinc-900 hover:bg-white transition-colors text-[12px] z-30"
            >
              ←
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="다음 슬라이드"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-full bg-white/85 backdrop-blur text-zinc-900 hover:bg-white transition-colors text-[12px] z-30"
            >
              →
            </button>
            {/* 슬라이드 인디케이터 — IG 처럼 우상 */}
            <div
              className="absolute top-2 right-3 rounded-full bg-black/55 text-white px-2 py-0.5"
              style={{ fontFamily: '"Pretendard Variable", sans-serif', fontWeight: 500, fontSize: "10px" }}
            >
              {slideIndex + 1}/{total}
            </div>
          </div>

          {/* IG 액션 행 */}
          <div className="px-3 pt-2.5 pb-1.5 flex items-center gap-3.5 text-zinc-900 dark:text-zinc-100">
            <IGIcon type="heart" />
            <IGIcon type="comment" />
            <IGIcon type="send" />
            <div className="ml-auto flex items-center gap-1.5">
              {Array.from({ length: total }).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 w-1.5 rounded-full ${idx === slideIndex ? "bg-sky-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
                />
              ))}
            </div>
            <div className="flex-1" />
            <IGIcon type="bookmark" />
          </div>

          {/* 좋아요 / 캡션 */}
          <div className="px-3.5 pb-2.5">
            <div className="text-[12px]" style={{ fontFamily: '"Pretendard Variable", sans-serif', fontWeight: 600 }}>
              좋아요 1,284개
            </div>
            {captionFirstLine && (
              <div className="mt-1 text-[12px] leading-snug" style={{ fontFamily: '"Pretendard Variable", sans-serif' }}>
                <span style={{ fontWeight: 600 }}>{igHandle.replace(/^@/, "")}</span>{" "}
                <span className="text-zinc-800 dark:text-zinc-200">{captionFirstLine}</span>
                <span className="text-zinc-400"> ... 더 보기</span>
              </div>
            )}
            <div className="mt-1.5 text-[10.5px] text-zinc-500 uppercase tracking-wider">
              5분 전 발행
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IGIcon({ type }: { type: "heart" | "comment" | "send" | "bookmark" }) {
  const common = "h-6 w-6";
  switch (type) {
    case "heart":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={common}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case "comment":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={common}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );
    case "send":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={common}>
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      );
    case "bookmark":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={common}>
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 슬라이드 한 장 — 컴포지션 분기
// ─────────────────────────────────────────────────────────────────────────────

function SlideFrame({
  slide,
  slideIdx,
  total,
  active,
  mark,
  brandWordmark,
}: {
  slide: CardnewsSlide;
  slideIdx: number;
  total: number;
  active: boolean;
  mark: BrandMarkConfig;
  brandWordmark?: string;
}) {
  const composition = slide.composition ?? (slide.display === "cover" ? "masthead" : "pillar-left");

  return (
    <motion.figure
      initial={false}
      animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.985 }}
      transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      className="absolute inset-0"
      style={{ pointerEvents: active ? "auto" : "none" }}
    >
      {composition === "masthead" && <CompMasthead slide={slide} slideIdx={slideIdx} total={total} mark={mark} brandWordmark={brandWordmark} />}
      {composition === "pillar-left" && <CompPillarLeft slide={slide} slideIdx={slideIdx} total={total} mark={mark} brandWordmark={brandWordmark} />}
      {composition === "paper-split" && <CompPaperSplit slide={slide} slideIdx={slideIdx} total={total} mark={mark} brandWordmark={brandWordmark} />}
      {composition === "overlay-card" && <CompOverlayCard slide={slide} slideIdx={slideIdx} total={total} mark={mark} brandWordmark={brandWordmark} />}
      {composition === "type-hero" && <CompTypeHero slide={slide} slideIdx={slideIdx} total={total} mark={mark} brandWordmark={brandWordmark} />}

      {/* Free 워터마크 — 사장님 플랜이 free 이면 자동 노출, Pro 이상 자동 숨김.
          좌하단 / Cormorant Italic / mix-blend-overlay 로 카드 톤에 맞게 녹임. */}
      <Watermark position="bottom-left" variant="auto" />
    </motion.figure>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 공통 — 배경 이미지 + 스크림
// ─────────────────────────────────────────────────────────────────────────────

function ImageBg({ src, vignette }: { src?: string; vignette?: boolean }) {
  return (
    <>
      {src ? (
        <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(120% 80% at 20% 10%, #efece4 0%, #e6e2d6 60%, #d8d3c4 100%)",
          }}
        />
      )}
      {vignette && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.32) 60%, rgba(0,0,0,0.55) 100%)",
          }}
        />
      )}
    </>
  );
}

// 페이지 인디케이터 — 모든 컴포지션 공용 (우상 안전영역)
function PageMark({ n, total, inkLight }: { n: number; total: number; inkLight: boolean }) {
  return (
    <div
      className="absolute top-[5%] right-[10%] tabular-nums pointer-events-none"
      style={{
        fontFamily: FONT_TEXT,
        fontWeight: 500,
        fontSize: "10px",
        letterSpacing: "0.22em",
        color: inkLight ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.45)",
      }}
    >
      {String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 컴포지션 1 — MASTHEAD (표지 / 마감)
// ─────────────────────────────────────────────────────────────────────────────

function CompMasthead({
  slide,
  slideIdx,
  total,
  mark,
  brandWordmark,
}: {
  slide: CardnewsSlide;
  slideIdx: number;
  total: number;
  mark: BrandMarkConfig;
  brandWordmark?: string;
}) {
  const inkLight = slide.ink !== "dark";
  const inkClass = inkLight ? "text-white" : "text-zinc-900";
  const rule = inkLight ? "bg-white/35" : "bg-zinc-900/30";

  return (
    <>
      <ImageBg src={slide.cover} vignette />
      <PageMark n={slide.n} total={total} inkLight={inkLight} />

      <div
        className={`absolute inset-0 ${inkClass}`}
        style={{
          paddingLeft: "10%",
          paddingRight: "10%",
          paddingTop: "8%",
          paddingBottom: "20%",
          fontFamily: FONT_TEXT,
        }}
      >
        <div className="h-full flex flex-col">
          {/* 마스트헤드 — 가로 헤어라인 사이에 워드마크/로고 */}
          <div className={`h-px w-full ${rule}`} />
          <div className={`py-3 flex items-center ${alignFor(mark.position)}`}>
            <BrandMark mark={mark} brandWordmark={brandWordmark} size="cover" inkLight={inkLight} />
          </div>
          <div className={`h-px w-full ${rule}`} />

          {/* 챕터 글리프 — 헤드라인의 ~1.3배 액센트 */}
          <div
            className="mt-5"
            style={{
              fontFamily: FONT_NUMERAL,
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(34px, 8cqw, 70px)",
              lineHeight: 0.9,
              letterSpacing: "-0.015em",
              opacity: 0.7,
            }}
          >
            {slide.role === "cta" ? "Fin." : `№ ${String(slide.n).padStart(2, "0")}`}
          </div>

          {/* 헤드라인 — 중간보다 살짝 아래 */}
          <div className="flex-1 flex flex-col justify-end pb-2">
            <EditableText
              idx={slideIdx}
              field="caption"
              value={slide.caption}
              multiline
              className="leading-[1.04] tracking-[-0.025em] whitespace-pre-line"
              style={{
                fontFamily: FONT_TEXT,
                fontWeight: 700,
                fontSize: "clamp(26px, 7cqw, 58px)",
              }}
            />
            <EditableText
              idx={slideIdx}
              field="subtext"
              value={slide.subtext ?? ""}
              placeholder="작은 글씨 (선택)"
              className="mt-4 opacity-80"
              style={{
                fontFamily: FONT_TEXT,
                fontWeight: 500,
                fontSize: "clamp(12px, 1.6cqw, 15px)",
                letterSpacing: "0.02em",
              }}
            />
          </div>

          {/* 호번 / 발행일 — 하단 헤어라인 위 */}
          {slide.footer && (
            <div>
              <div className={`h-px w-full ${rule} mb-2`} />
              <div
                className="text-center"
                style={{
                  fontFamily: FONT_TEXT,
                  fontWeight: 500,
                  fontSize: "10px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  opacity: 0.75,
                }}
              >
                {slide.footer}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 컴포지션 2 — PILLAR LEFT (좌측 세로선 + 큰 챕터 넘버럴)
// ─────────────────────────────────────────────────────────────────────────────

function CompPillarLeft({
  slide,
  slideIdx,
  total,
  mark,
  brandWordmark,
}: {
  slide: CardnewsSlide;
  slideIdx: number;
  total: number;
  mark: BrandMarkConfig;
  brandWordmark?: string;
}) {
  const inkLight = slide.ink !== "dark";
  const inkClass = inkLight ? "text-white" : "text-zinc-900";
  const rule = inkLight ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.35)";

  return (
    <>
      <ImageBg src={slide.cover} />
      {/* 하단/측면 스크림 — 텍스트 가독성 */}
      <div
        className="absolute inset-0"
        style={{
          background: inkLight
            ? "linear-gradient(105deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0) 100%)"
            : "linear-gradient(105deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0) 100%)",
        }}
      />
      <PageMark n={slide.n} total={total} inkLight={inkLight} />

      <div
        className={`absolute inset-0 ${inkClass}`}
        style={{
          paddingLeft: "10%",
          paddingRight: "10%",
          paddingTop: "8%",
          paddingBottom: "20%",
          fontFamily: FONT_TEXT,
        }}
      >
        <div className="relative h-full">
          {/* 좌측 얇은 세로선 */}
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: "0",
              width: "1px",
              background: rule,
            }}
          />

          {/* 브랜드 마크 — 인너 노출 토글 따라 */}
          {mark.showOnInner && (
            <div className={`flex ${alignFor(mark.position)}`}>
              <BrandMark mark={mark} brandWordmark={brandWordmark} size="inner" inkLight={inkLight} />
            </div>
          )}

          {/* 챕터 글리프 — 좌측 세로선 옆 보조 액센트 (헤드의 ~1.4배) */}
          <div
            className="absolute"
            style={{
              left: "14px",
              top: "26%",
              fontFamily: FONT_NUMERAL,
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(38px, 9.5cqw, 78px)",
              lineHeight: 0.88,
              letterSpacing: "-0.022em",
              opacity: 0.55,
            }}
          >
            {String(slide.n).padStart(2, "0")}
          </div>

          {/* 헤드라인 — 챕터 넘버럴 아래, 좌측 정렬 */}
          <div className="absolute" style={{ left: "12px", right: "0", bottom: "0" }}>
            <EditableText
              idx={slideIdx}
              field="caption"
              value={slide.caption}
              multiline
              className="whitespace-pre-line"
              style={{
                fontFamily: FONT_TEXT,
                fontWeight: 700,
                fontSize: "clamp(22px, 5.8cqw, 42px)",
                lineHeight: 1.12,
                letterSpacing: "-0.018em",
                maxWidth: "92%",
              }}
            />
            <EditableText
              idx={slideIdx}
              field="subtext"
              value={slide.subtext ?? ""}
              placeholder="작은 글씨 (선택)"
              className="mt-3 opacity-75"
              style={{
                fontFamily: FONT_TEXT,
                fontWeight: 400,
                fontSize: "clamp(12px, 1.6cqw, 14px)",
                letterSpacing: "0.02em",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 컴포지션 3 — PAPER SPLIT (좌측 페이퍼 패널 + 우측 이미지)
// ─────────────────────────────────────────────────────────────────────────────

function CompPaperSplit({
  slide,
  slideIdx,
  total,
  mark,
  brandWordmark,
}: {
  slide: CardnewsSlide;
  slideIdx: number;
  total: number;
  mark: BrandMarkConfig;
  brandWordmark?: string;
}) {
  const tone = PAPER[slide.paperTone ?? "cream"];

  return (
    <>
      <ImageBg src={slide.cover} />
      <PageMark n={slide.n} total={total} inkLight={false} />

      {/* 페이퍼 패널 — 좌측 58% */}
      <div
        className="absolute top-0 bottom-0 left-0"
        style={{
          width: "58%",
          background: tone.bg,
        }}
      >
        <div
          className="h-full"
          style={{
            paddingLeft: "16%",
            paddingRight: "12%",
            paddingTop: "12%",
            paddingBottom: "16%",
            fontFamily: FONT_TEXT,
            color: tone.ink,
          }}
        >
          <div className="relative h-full flex flex-col">
            {/* 브랜드 마크 */}
            {mark.showOnInner && (
              <div className={`flex ${alignFor(mark.position)} mb-4`}>
                <BrandMark mark={mark} brandWordmark={brandWordmark} size="inner" inkLight={false} />
              </div>
            )}

            {/* 챕터 글리프 — 페이퍼 패널 액센트 (헤드의 ~1.25배) */}
            <div
              style={{
                fontFamily: FONT_NUMERAL,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "clamp(28px, 6cqw, 50px)",
                lineHeight: 0.9,
                letterSpacing: "-0.015em",
                opacity: 0.42,
                color: tone.ink,
              }}
            >
              No. {String(slide.n).padStart(2, "0")}
            </div>

            {/* 헤어라인 */}
            <div className="my-5 h-px" style={{ background: tone.rule }} />

            {/* 헤드라인 */}
            <EditableText
              idx={slideIdx}
              field="caption"
              value={slide.caption}
              multiline
              className="whitespace-pre-line"
              style={{
                fontFamily: FONT_TEXT,
                fontWeight: 700,
                fontSize: "clamp(20px, 4.8cqw, 36px)",
                lineHeight: 1.15,
                letterSpacing: "-0.018em",
              }}
            />

            {/* 보조 한 줄 — 하단 정렬 */}
            <div className="flex-1" />
            <EditableText
              idx={slideIdx}
              field="subtext"
              value={slide.subtext ?? ""}
              placeholder="작은 글씨 (선택)"
              className="mt-4"
              style={{
                fontFamily: FONT_TEXT,
                fontWeight: 500,
                fontSize: "clamp(11px, 1.5cqw, 13px)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                opacity: 0.65,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 컴포지션 4 — OVERLAY CARD (이미지 위 페이퍼 카드)
// ─────────────────────────────────────────────────────────────────────────────

function CompOverlayCard({
  slide,
  slideIdx,
  total,
  mark,
  brandWordmark,
}: {
  slide: CardnewsSlide;
  slideIdx: number;
  total: number;
  mark: BrandMarkConfig;
  brandWordmark?: string;
}) {
  const tone = PAPER[slide.paperTone ?? "cream"];

  return (
    <>
      <ImageBg src={slide.cover} />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.18) 100%)",
        }}
      />
      <PageMark n={slide.n} total={total} inkLight={true} />

      {/* 페이퍼 카드 — 중앙에서 살짝 비대칭 (좌측 9%, 우측 14% — 디자이너 비대칭) */}
      <div
        className="absolute"
        style={{
          left: "9%",
          right: "14%",
          top: "22%",
          bottom: "26%",
          background: tone.bg,
          boxShadow: "0 18px 40px -16px rgba(0,0,0,0.35)",
        }}
      >
        <div
          className="h-full relative"
          style={{
            paddingLeft: "9%",
            paddingRight: "9%",
            paddingTop: "10%",
            paddingBottom: "10%",
            fontFamily: FONT_TEXT,
            color: tone.ink,
          }}
        >
          {/* 모서리 작은 마커 */}
          <div
            className="absolute top-4 left-4 h-2 w-2 rounded-full"
            style={{ background: tone.ink, opacity: 0.6 }}
          />
          {/* 우상 작은 라벨 */}
          <div
            className="absolute top-3 right-4"
            style={{
              fontFamily: FONT_TEXT,
              fontWeight: 500,
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.55,
            }}
          >
            Card · {String(slide.n).padStart(2, "0")}
          </div>

          <div className="h-full flex flex-col items-center justify-center text-center">
            {/* 챕터 글리프 — 카드 액센트 */}
            <div
              className="mb-3"
              style={{
                fontFamily: FONT_NUMERAL,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "clamp(22px, 5cqw, 40px)",
                lineHeight: 0.9,
                opacity: 0.4,
              }}
            >
              {String(slide.n).padStart(2, "0")}.
            </div>

            <EditableText
              idx={slideIdx}
              field="caption"
              value={slide.caption}
              multiline
              className="whitespace-pre-line"
              style={{
                fontFamily: FONT_TEXT,
                fontWeight: 700,
                fontSize: "clamp(20px, 5cqw, 36px)",
                lineHeight: 1.14,
                letterSpacing: "-0.015em",
              }}
            />
            <EditableText
              idx={slideIdx}
              field="subtext"
              value={slide.subtext ?? ""}
              placeholder="작은 글씨 (선택)"
              className="mt-4 opacity-65"
              style={{
                fontFamily: FONT_TEXT,
                fontWeight: 500,
                fontSize: "clamp(11px, 1.4cqw, 13px)",
                letterSpacing: "0.04em",
              }}
            />
          </div>

          {/* 우하 작은 브랜드 마크 */}
          <div className="absolute bottom-3 right-4">
            <BrandMark mark={mark} brandWordmark={brandWordmark} size="inner" inkLight={false} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 컴포지션 5 — TYPE HERO (페이퍼 톤 위 타이포 자체가 비주얼, PROOF 슬라이드용)
// ─────────────────────────────────────────────────────────────────────────────

function CompTypeHero({
  slide,
  slideIdx,
  total,
  mark,
  brandWordmark,
}: {
  slide: CardnewsSlide;
  slideIdx: number;
  total: number;
  mark: BrandMarkConfig;
  brandWordmark?: string;
}) {
  const tone = PAPER[slide.paperTone ?? "dust"];

  // 캡션에서 첫 숫자 + 단위 추출해서 거대 디스플레이로 강조
  // 예: "이번 달 저장 5.4%\n팔로워 8.2k 와 함께." → bigNum = "5.4%", restCaption = 나머지
  const numberMatch = slide.caption.match(/(\d+(?:\.\d+)?[%kK건명일주]?)/);
  const bigNum = numberMatch?.[0];
  const rest = bigNum ? slide.caption.replace(bigNum, "").trim() : slide.caption;

  return (
    <>
      {/* 풀블리드 페이퍼 톤 — 이미지 안 씀 */}
      <div className="absolute inset-0" style={{ background: tone.bg }} />

      {/* 작은 이미지 플레이트 — 우하 비대칭 액센트 */}
      {slide.cover && (
        <div
          className="absolute"
          style={{
            right: "12%",
            top: "14%",
            width: "32%",
            aspectRatio: "3 / 4",
            overflow: "hidden",
            boxShadow: "0 14px 36px -16px rgba(0,0,0,0.3)",
          }}
        >
          <img src={slide.cover} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <PageMark n={slide.n} total={total} inkLight={tone.bg === PAPER.ink.bg} />

      <div
        className="absolute inset-0"
        style={{
          paddingLeft: "10%",
          paddingRight: "10%",
          paddingTop: "8%",
          paddingBottom: "20%",
          fontFamily: FONT_TEXT,
          color: tone.ink,
        }}
      >
        <div className="relative h-full flex flex-col">
          {/* 상단 — 작은 라벨 + 브랜드 마크 */}
          {mark.showOnInner && (
            <div className={`flex ${alignFor(mark.position)} mb-3`}>
              <BrandMark mark={mark} brandWordmark={brandWordmark} size="inner" inkLight={tone.bg === PAPER.ink.bg} />
            </div>
          )}
          <div
            style={{
              fontFamily: FONT_TEXT,
              fontWeight: 500,
              fontSize: "11px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              opacity: 0.55,
            }}
          >
            — Proof
          </div>

          {/* PROOF 숫자 — 본문의 ~2배 액센트 (헤로지만 비율 안정화) */}
          {bigNum && (
            <div
              className="mt-5"
              style={{
                fontFamily: FONT_NUMERAL,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "clamp(48px, 11cqw, 96px)",
                lineHeight: 0.9,
                letterSpacing: "-0.028em",
                opacity: 0.92,
              }}
            >
              {bigNum}
            </div>
          )}

          {/* 나머지 카피 — 클릭 시 전체 캡션을 편집 (숫자 추출은 저장 후 자동 재계산) */}
          <EditableText
            idx={slideIdx}
            field="caption"
            value={slide.caption}
            displayValue={rest}
            multiline
            className="mt-5 whitespace-pre-line max-w-[62%]"
            style={{
              fontFamily: FONT_TEXT,
              fontWeight: 700,
              fontSize: "clamp(18px, 4.2cqw, 30px)",
              lineHeight: 1.18,
              letterSpacing: "-0.012em",
            }}
          />

          <div className="flex-1" />
          <EditableText
            idx={slideIdx}
            field="subtext"
            value={slide.subtext ?? ""}
            placeholder="작은 글씨 (선택)"
            style={{
              fontFamily: FONT_TEXT,
              fontWeight: 500,
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          />
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 브랜드 마크 — 로고 또는 워드마크
// ─────────────────────────────────────────────────────────────────────────────

function BrandMark({
  mark,
  brandWordmark,
  size,
  inkLight,
}: {
  mark: BrandMarkConfig;
  brandWordmark?: string;
  size: "cover" | "inner";
  inkLight: boolean;
}) {
  const tintFilter = inkLight ? "brightness(0) invert(1)" : "none";
  if (mark.logoDataUrl) {
    return (
      <img
        src={mark.logoDataUrl}
        alt=""
        style={{
          maxHeight: size === "cover" ? "min(48px, 5.2cqw)" : "min(24px, 3cqw)",
          width: "auto",
          objectFit: "contain",
          filter: tintFilter,
          opacity: size === "cover" ? 0.95 : 0.78,
        }}
      />
    );
  }
  if (!brandWordmark) return null;
  return (
    <span
      style={{
        fontFamily: FONT_TEXT,
        fontWeight: size === "cover" ? 700 : 600,
        fontSize: size === "cover" ? "clamp(12px, 1.5cqw, 15px)" : "clamp(10px, 1.1cqw, 11px)",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        opacity: size === "cover" ? 0.9 : 0.7,
      }}
    >
      {brandWordmark}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

function alignFor(pos: BrandMarkConfig["position"]): string {
  switch (pos) {
    case "top-left":
      return "justify-start";
    case "top-center":
      return "justify-center";
    case "top-right":
      return "justify-end";
  }
}

const KOREAN_TO_EN: Record<string, string> = {
  봄나물: "spring greens",
  두릅: "fatsia sprouts",
  곰취: "wild greens",
  산마늘: "wild garlic leaf",
  한정식: "korean fine dining",
  코스: "course meal",
  콜드브루: "cold brew coffee",
  원두: "specialty coffee beans",
  케이크: "cake slice",
  디저트: "korean dessert",
  봄: "spring",
  여름: "summer",
  가을: "autumn",
  겨울: "winter",
  어버이날: "family dinner",
  한옥: "hanok traditional house",
  자리: "restaurant interior empty",
  점심: "lunch table",
  저녁: "dinner table",
  창: "window light",
};

const INDUSTRY_SCENE: Record<string, string> = {
  restaurant: "korean fine dining table",
  cafe: "specialty cafe minimal interior",
  beauty: "korean skincare studio",
  fitness: "minimal gym studio",
  stay: "warm hanok stay",
  local: "small neighborhood shop",
  dessert: "korean dessert tablescape",
};

const EDITORIAL_TAIL =
  "editorial natural light, soft warm tone, shallow depth of field, candid, film aesthetic, no people";

function buildEditorialQuery(caption: string, industry?: string): string {
  const tokens = caption
    .replace(/\n/g, " ")
    .replace(/[·.,!?"'()]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const mapped: string[] = [];
  for (const t of tokens) {
    const stripped = t.replace(/[은는이가을를도에의로으로와과만]$/u, "");
    if (KOREAN_TO_EN[stripped]) mapped.push(KOREAN_TO_EN[stripped]);
    else if (KOREAN_TO_EN[t]) mapped.push(KOREAN_TO_EN[t]);
  }

  const scene = industry ? INDUSTRY_SCENE[industry] ?? "" : "";
  const subject =
    mapped.length > 0 ? Array.from(new Set(mapped)).slice(0, 3).join(" ") : scene;

  return [subject, scene && !subject.includes(scene) ? scene : "", EDITORIAL_TAIL]
    .filter(Boolean)
    .join(", ");
}
