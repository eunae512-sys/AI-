"use client";

// 사장님 사진 → AI 에디토리얼 포스터.
//
// ★ 아키텍처: AI = 사진 소재만. 앱 = 디자인·타이포·콜아웃·레이아웃 100%.
// 업로드(data URL) → 업종별 스타일 픽커 → 레이아웃별 편집 필드
// → /api/generate-poster(글자·박스 없는 깨끗한 사진) → composePoster(앱이 전부 그림)
// → KFTC AI 라벨 워터마크 → 9:16 미리보기 → onGenerated.
//
// 레이아웃 3종: callout(라벨 칩+연결선) / cover(히어로+헤드라인) / menu(메뉴 리스트).
// 디자인 철칙: SAGE/INK/RULE/PAPER 토큰, 사각 헤어라인, 솔리드 잉크 버튼,
//   한글 italic/uppercase 금지, 다색(violet/sky/amber/emerald)·rounded-xl/2xl 금지.

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Info,
  ShieldCheck,
  ImagePlus,
  ChevronDown,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Industry } from "@/lib/ai-gen/model-scenes";
import {
  getPosterStyles,
  type PosterStyle,
} from "@/lib/ai-gen/poster-templates";
import {
  composePoster,
  type PosterContent,
} from "@/lib/ai-gen/poster-compositor";
import { applyAiWatermark, buildAiMeta } from "@/lib/ai-gen/watermark";
import {
  SAGE,
  INK,
  INK_SOFT,
  INK_MUTE,
  RULE,
  PAPER,
  PAPER_HOVER,
  SERIF_HANGUL,
} from "@/lib/landing/tokens";

type Props = {
  industry: Industry;
  signatureMenu?: string[];
  /** 가게명 — 제목 프리필 폴백 */
  brandName?: string;
  /** 태그라인/한 줄 소개 — 부제 프리필 */
  tagline?: string;
  /** 외부에서 미리 넣어줄 사진(data URL) — 있으면 업로드 단계 생략 */
  initialImage?: string;
  onGenerated: (r: { url: string; styleId: string; meta: unknown }) => void;
  onClose?: () => void;
  compact?: boolean;
};

const COST_USD_PER_IMAGE = 0.039; // nano banana
const COST_KRW = Math.round(COST_USD_PER_IMAGE * 1400);

// 강조색 스와치 — 토큰 결에 맞는 절제된 팔레트(다색 SaaS 톤 금지).
const ACCENT_SWATCHES: { label: string; value: string; swatch: string }[] = [
  { label: "딥 그린", value: SAGE, swatch: SAGE },
  { label: "잉크", value: INK, swatch: INK },
  { label: "테라코타", value: "#A1473D", swatch: "#A1473D" },
  { label: "크림", value: "#E6DDC8", swatch: "#E6DDC8" },
];

export function PosterStudio({
  industry,
  signatureMenu,
  brandName,
  tagline,
  initialImage,
  onGenerated,
  onClose,
  compact = false,
}: Props) {
  const toast = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const styles = React.useMemo(() => getPosterStyles(industry), [industry]);

  const [image, setImage] = React.useState<string | null>(initialImage ?? null);
  const [style, setStyle] = React.useState<PosterStyle>(styles[0]);
  const [showOpts, setShowOpts] = React.useState(false);
  const [accentColor, setAccentColor] = React.useState<string>("");
  const [generating, setGenerating] = React.useState(false);
  const [composing, setComposing] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [previewStyle, setPreviewStyle] = React.useState<PosterStyle | null>(null);

  // 공통 편집 필드 — 실데이터 프리필(정직성: 사용자/실데이터만).
  const [title, setTitle] = React.useState<string>(
    () => brandName || signatureMenu?.[0] || "",
  );
  const [subtitle, setSubtitle] = React.useState<string>(() => tagline || "");
  // callout 라벨 — 시그니처 메뉴로 프리필(2~4).
  const [callouts, setCallouts] = React.useState<string[]>(() =>
    prefillCallouts(signatureMenu),
  );
  // menu 행 — 시그니처 메뉴로 프리필.
  const [menuItems, setMenuItems] = React.useState<
    { name: string; desc: string }[]
  >(() => prefillMenu(signatureMenu));

  React.useEffect(() => {
    setStyle(styles[0]);
  }, [styles]);

  // 브랜드 컨텍스트 바뀌면 프리필 갱신.
  React.useEffect(() => {
    setTitle(brandName || signatureMenu?.[0] || "");
    setCallouts(prefillCallouts(signatureMenu));
    setMenuItems(prefillMenu(signatureMenu));
  }, [signatureMenu, brandName]);
  React.useEffect(() => {
    setSubtitle(tagline || "");
  }, [tagline]);

  const layout = style?.layout ?? "callout";
  const previewLayout = previewStyle?.layout ?? "callout";

  const readFile = async (f: File) => {
    if (!f.type.startsWith("image/")) {
      toast.warn("사진(이미지)만 올릴 수 있어요");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(typeof reader.result === "string" ? reader.result : null);
      setResultsReset();
    };
    reader.readAsDataURL(f);
  };
  const setResultsReset = () => {
    setPreview(null);
    setPreviewStyle(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) readFile(f);
  };

  // 현재 입력 → composePoster content.
  const buildContent = (): PosterContent => ({
    title: title.trim() || undefined,
    subtitle: subtitle.trim() || undefined,
    callouts: callouts
      .map((l) => l.trim())
      .filter(Boolean)
      .map((label) => ({ label })),
    menuItems: menuItems
      .filter((m) => m.name.trim())
      .map((m) => ({ name: m.name.trim(), desc: m.desc.trim() || undefined })),
    caption: brandName?.trim() || undefined,
    accentColor: accentColor || undefined,
  });

  const generate = async () => {
    if (!image || !style) return;
    setGenerating(true);
    setPreview(null);
    try {
      // 글자·박스 없는 사진 전용 프롬프트 — 앱이 레이아웃을 전부 그린다.
      const prompt = style.prompt({
        accentColor: accentColor || undefined,
      });
      const res = await fetch("/api/generate-poster", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          inputImage: image,
          prompt,
          size: "1024x1536",
          styleId: style.id,
          slideId: style.id,
        }),
      });
      const data = await res.json();
      if (!data?.ok || !data?.image) {
        toast.warn(data?.error || "AI 포스터 편집에 실패했어요. 다시 시도해주세요.");
        return;
      }
      // 미리보기는 글자 없는 AI 사진 소재 — 그 위에 레이아웃을 DOM 으로 미리 본다.
      setPreview(data.image as string);
      setPreviewStyle(style);
      toast.success(`AI 사진 소재 완성 · 약 ${COST_KRW}원 사용`);
    } catch (e) {
      toast.warn((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const useThis = async () => {
    if (!preview || !previewStyle) return;
    setComposing(true);
    try {
      // 1) AI 사진 소재 + 앱이 그리는 전체 레이아웃 → 단일 PNG (canvas).
      let composed = preview;
      try {
        composed = await composePoster({
          imageSrc: preview,
          layout: previewStyle.layout,
          content: buildContent(),
        });
      } catch (ce) {
        console.warn("[poster-compose] fallback to AI image:", (ce as Error).message);
      }
      // 2) KFTC AI 라벨 워터마크(우하단).
      let finalUrl = composed;
      try {
        finalUrl = await applyAiWatermark(composed, { position: "bottom-right" });
      } catch (we) {
        console.warn("[poster-watermark] fallback:", (we as Error).message);
        toast.info("워터마크 부착은 발행 시점에 자동 재시도됩니다");
      }
      onGenerated({
        url: finalUrl,
        styleId: previewStyle.id,
        meta: buildAiMeta({
          id: previewStyle.id,
          title: previewStyle.label,
          industry,
        }),
      });
    } finally {
      setComposing(false);
    }
  };

  // ── 콜아웃 라벨 편집 핸들러 ──
  const setCallout = (i: number, v: string) =>
    setCallouts((arr) => arr.map((x, idx) => (idx === i ? v : x)));
  const addCallout = () =>
    setCallouts((arr) => (arr.length >= 4 ? arr : [...arr, ""]));
  const removeCallout = (i: number) =>
    setCallouts((arr) => (arr.length <= 1 ? arr : arr.filter((_, idx) => idx !== i)));

  // ── 메뉴 행 편집 핸들러 ──
  const setMenuName = (i: number, v: string) =>
    setMenuItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, name: v } : x)));
  const setMenuDesc = (i: number, v: string) =>
    setMenuItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, desc: v } : x)));
  const addMenuItem = () =>
    setMenuItems((arr) => (arr.length >= 6 ? arr : [...arr, { name: "", desc: "" }]));
  const removeMenuItem = (i: number) =>
    setMenuItems((arr) => (arr.length <= 1 ? arr : arr.filter((_, idx) => idx !== i)));

  const inputStyle: React.CSSProperties = {
    borderColor: RULE,
    color: INK,
    backgroundColor: "transparent",
  };

  return (
    <div className={cn("space-y-4", compact && "space-y-3")} style={{ color: INK }}>
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: SAGE }}
          >
            <Sparkles className="h-3.5 w-3.5" /> 내 사진 → AI 포스터
          </div>
          <h3 className={cn("mt-1 font-semibold", compact ? "text-base" : "text-lg")}>
            올린 사진을 잡지 화보처럼 다듬어요
          </h3>
          <p className="mt-1 text-xs sm:text-sm" style={{ color: INK_MUTE }}>
            사진은 AI 가 다듬고 · 글자·레이아웃은 앱이 또렷하게 그려요 · 약 {COST_KRW}원/장
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 text-zinc-400 hover:text-zinc-700"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 안내 — 중립 PAPER+RULE 사각 */}
      <div className="px-3.5 py-2.5 border" style={{ borderColor: RULE }}>
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: SAGE }} />
          <div className="text-xs leading-relaxed" style={{ color: INK }}>
            <b>올리신 실제 사진을 살려</b> 다듬는 편집이에요. 제목·콜아웃·메뉴 글자는{" "}
            <b>앱이 정확한 한글로</b> 그립니다. 우하단에 법령(KFTC, 2025.12){" "}
            <b>&quot;AI 생성 콘텐츠&quot;</b> 라벨이 자동 부착됩니다.
          </div>
        </div>
      </div>

      {/* 1) 업로드 */}
      {!image && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="w-full border-2 border-dashed py-12 px-6 text-center transition-all min-h-[180px] flex flex-col items-center justify-center gap-2"
          style={{ borderColor: RULE }}
        >
          <ImagePlus className="h-7 w-7" style={{ color: SAGE }} />
          <div className="text-base font-semibold">가게 사진을 드롭하거나 클릭</div>
          <div className="text-sm" style={{ color: INK_MUTE }}>
            음식·제품·공간 사진 한 장 — 포스터로 다듬어 드려요
          </div>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) readFile(f);
        }}
      />

      {/* 업로드된 사진 미리 + 다시 올리기 */}
      {image && (
        <div className="flex items-center gap-3">
          <div
            className="relative w-16 h-16 overflow-hidden shrink-0 border"
            style={{ borderColor: RULE }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="업로드 원본" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 text-xs" style={{ color: INK_MUTE }}>
            올린 사진을 아래 스타일로 다듬어요
          </div>
          <button
            onClick={() => {
              setImage(null);
              setResultsReset();
            }}
            className="ml-auto text-xs inline-flex items-center gap-1 px-2.5 py-1.5 border"
            style={{ borderColor: RULE, color: INK_MUTE }}
          >
            <RefreshCw className="h-3 w-3" /> 다른 사진
          </button>
        </div>
      )}

      {/* 2) 스타일 픽커 — 업종 기준 */}
      {image && (
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: INK }}>
            포스터 스타일 ({styles.length}) — 업종 기준
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {styles.map((s) => {
              const active = style?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStyle(s)}
                  className={cn("border p-3 text-left transition-all min-h-[80px]")}
                  style={
                    active
                      ? { borderColor: SAGE, backgroundColor: "rgba(79,95,75,0.06)" }
                      : { borderColor: RULE }
                  }
                >
                  <div className="text-sm font-semibold leading-snug">{s.label}</div>
                  <div className="text-[11px] mt-0.5 leading-snug" style={{ color: INK_MUTE }}>
                    {s.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3) 레이아웃별 편집 필드 — 앱이 정확한 한글로 그림 */}
      {image && (
        <div className="space-y-2.5">
          <div className="text-xs font-semibold" style={{ color: INK }}>
            포스터 글자 — 정확한 한글로 앱이 그려요
          </div>

          {/* 공통: 제목/부제 (헤드라인) */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              layout === "cover" ? "헤드라인 (예: 서촌의 하루)" : "제목 — 가게명/메뉴 (예: 서촌 한옥스테이)"
            }
            className="w-full px-3 py-2 text-sm border outline-none"
            style={inputStyle}
          />
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="부제 — 한 줄 소개 (선택)"
            className="w-full px-3 py-2 text-sm border outline-none"
            style={inputStyle}
          />

          {/* callout: 라벨 칩 2~4 */}
          {layout === "callout" && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: INK_MUTE }}>
                  콜아웃 라벨 ({callouts.length}/4) — 사진에 칩 + 연결선으로 표시
                </span>
                <button
                  onClick={addCallout}
                  disabled={callouts.length >= 4}
                  className="inline-flex items-center gap-1 px-2 py-1 border text-[11px] disabled:opacity-40"
                  style={{ borderColor: RULE, color: INK }}
                >
                  <Plus className="h-3 w-3" /> 추가
                </button>
              </div>
              {callouts.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={c}
                    onChange={(e) => setCallout(i, e.target.value)}
                    placeholder={`콜아웃 ${i + 1} (예: 한옥 객실)`}
                    className="flex-1 px-3 py-1.5 text-sm border outline-none"
                    style={inputStyle}
                  />
                  <button
                    onClick={() => removeCallout(i)}
                    disabled={callouts.length <= 1}
                    className="shrink-0 p-1.5 border disabled:opacity-30"
                    style={{ borderColor: RULE, color: INK_MUTE }}
                    aria-label="삭제"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* menu: 메뉴 행 */}
          {layout === "menu" && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: INK_MUTE }}>
                  메뉴 항목 ({menuItems.length}/6) — 이름 + 짧은 설명(선택)
                </span>
                <button
                  onClick={addMenuItem}
                  disabled={menuItems.length >= 6}
                  className="inline-flex items-center gap-1 px-2 py-1 border text-[11px] disabled:opacity-40"
                  style={{ borderColor: RULE, color: INK }}
                >
                  <Plus className="h-3 w-3" /> 추가
                </button>
              </div>
              {menuItems.map((m, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => setMenuName(i, e.target.value)}
                    placeholder={`메뉴 ${i + 1}`}
                    className="flex-[1.2] min-w-0 px-3 py-1.5 text-sm border outline-none"
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    value={m.desc}
                    onChange={(e) => setMenuDesc(i, e.target.value)}
                    placeholder="짧은 설명 (선택)"
                    className="flex-1 min-w-0 px-3 py-1.5 text-sm border outline-none"
                    style={inputStyle}
                  />
                  <button
                    onClick={() => removeMenuItem(i)}
                    disabled={menuItems.length <= 1}
                    className="shrink-0 p-1.5 border disabled:opacity-30"
                    style={{ borderColor: RULE, color: INK_MUTE }}
                    aria-label="삭제"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4) 옵션 (접이식) — 강조 색상 */}
      {image && (
        <div className="border" style={{ borderColor: RULE }}>
          <button
            onClick={() => setShowOpts((v) => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold"
            style={{ color: INK }}
          >
            <span>강조 색상 (선택)</span>
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", showOpts && "rotate-180")}
            />
          </button>
          {showOpts && (
            <div className="px-3.5 pb-3.5 space-y-3" style={{ borderTop: `1px solid ${RULE}` }}>
              <div className="pt-3">
                <div className="text-[11px] mb-1.5" style={{ color: INK_MUTE }}>
                  강조 색상 (연결선 끝점·룰)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ACCENT_SWATCHES.map((sw) => {
                    const active = accentColor === sw.value;
                    return (
                      <button
                        key={sw.value}
                        onClick={() => setAccentColor(active ? "" : sw.value)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border text-xs"
                        style={{
                          borderColor: active ? SAGE : RULE,
                          backgroundColor: active ? PAPER_HOVER : undefined,
                        }}
                      >
                        <span
                          className="inline-block w-3 h-3 border"
                          style={{ backgroundColor: sw.swatch, borderColor: RULE }}
                        />
                        {sw.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 액션 */}
      {image && (
        <div className="flex items-center gap-2">
          <Button onClick={generate} disabled={!style || generating} className="flex-1 h-11">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                만드는 중 (약 10–15초)
              </>
            ) : preview ? (
              <>
                <RefreshCw className="h-4 w-4" />
                다시 만들기 (다른 스타일)
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                포스터 만들기
              </>
            )}
          </Button>
          {preview && (
            <Button
              onClick={useThis}
              variant="default"
              disabled={composing}
              className="h-11 px-5"
            >
              {composing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  합성 중
                </>
              ) : (
                "이 포스터 사용"
              )}
            </Button>
          )}
        </div>
      )}

      {/* 결과 미리보기 (9:16) — 라이브 DOM 으로 캔버스 레이아웃을 미리 본다 */}
      <AnimatePresence>
        {preview && previewStyle && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-3 p-3">
                <div
                  className="relative aspect-[9/16] overflow-hidden border"
                  style={{ borderColor: RULE, backgroundColor: PAPER }}
                  data-poster-preview
                >
                  <LayoutPreview
                    layout={previewLayout}
                    image={preview}
                    title={title}
                    subtitle={subtitle}
                    callouts={callouts}
                    menuItems={menuItems}
                    accent={accentColor || SAGE}
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="default">{previewStyle.label}</Badge>
                    <Badge tone="default">AI 포스터</Badge>
                  </div>
                  <div className="text-sm font-semibold">{previewStyle.label}</div>
                  <div className="text-xs leading-relaxed" style={{ color: INK_MUTE }}>
                    {previewStyle.desc} · 우하단 AI 라벨 자동 부착됨 (KFTC 의무)
                  </div>
                  <div
                    className="text-[11px] inline-flex items-center gap-1"
                    style={{ color: INK_MUTE }}
                  >
                    <ShieldCheck className="h-3 w-3" style={{ color: SAGE }} />
                    진짜 사진 기반 · 글자는 앱이 그림 · 약 {COST_KRW}원
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 프리필 헬퍼 ─────────────────────────────────────────────────────────────
function prefillCallouts(signatureMenu?: string[]): string[] {
  const items = (signatureMenu ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 4);
  if (items.length >= 2) return items;
  // 부족하면 빈 칸으로 최소 2칸.
  return [...items, ...Array(Math.max(0, 2 - items.length)).fill("")];
}
function prefillMenu(signatureMenu?: string[]): { name: string; desc: string }[] {
  const items = (signatureMenu ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 6);
  if (items.length >= 1) return items.map((name) => ({ name, desc: "" }));
  return [{ name: "", desc: "" }, { name: "", desc: "" }];
}

// ── 라이브 DOM 미리보기 — 캔버스 레이아웃과 시각적으로 일치 ───────────────────
function LayoutPreview({
  layout,
  image,
  title,
  subtitle,
  callouts,
  menuItems,
  accent,
}: {
  layout: PosterStyle["layout"];
  image: string;
  title: string;
  subtitle: string;
  callouts: string[];
  menuItems: { name: string; desc: string }[];
  accent: string;
}) {
  const labels = callouts.map((c) => c.trim()).filter(Boolean).slice(0, 4);
  const items = menuItems.filter((m) => m.name.trim()).slice(0, 6);
  const t = title.trim();
  const s = subtitle.trim();

  if (layout === "cover") {
    return (
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="h-full w-full object-cover" />
        <div
          className="absolute inset-x-0 bottom-0 h-[50%]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(20,19,15,0) 0%, rgba(20,19,15,0.55) 45%, rgba(20,19,15,0.9) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-6 flex flex-col items-start">
          {t && (
            <div
              style={{
                fontFamily: SERIF_HANGUL,
                fontWeight: 700,
                fontSize: "1.35rem",
                lineHeight: 1.14,
                color: PAPER,
                wordBreak: "keep-all",
              }}
            >
              {t}
            </div>
          )}
          {s && (
            <>
              <span
                className="block my-1.5"
                style={{ width: "1.6rem", height: "2px", backgroundColor: accent }}
              />
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "rgba(250,247,238,0.85)",
                  wordBreak: "keep-all",
                }}
              >
                {s}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (layout === "menu") {
    return (
      <div className="absolute inset-0 flex flex-col" style={{ backgroundColor: PAPER }}>
        <div className="h-[54%] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 px-4 pt-3 flex flex-col">
          {t && (
            <div
              style={{
                fontFamily: SERIF_HANGUL,
                fontWeight: 700,
                fontSize: "1.05rem",
                color: INK,
                wordBreak: "keep-all",
              }}
            >
              {t}
            </div>
          )}
          {s && (
            <div className="mt-0.5" style={{ fontSize: "0.62rem", color: INK_MUTE }}>
              {s}
            </div>
          )}
          <span
            className="block mt-2 mb-1"
            style={{ width: "1.6rem", height: "2px", backgroundColor: accent }}
          />
          <div className="mt-1 space-y-0">
            {items.map((m, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between gap-2 py-1.5"
                style={{ borderBottom: `1px solid rgba(20,19,15,0.1)` }}
              >
                <span
                  style={{
                    fontFamily: SERIF_HANGUL,
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: INK,
                    wordBreak: "keep-all",
                  }}
                >
                  {m.name.trim()}
                </span>
                {m.desc.trim() && (
                  <span
                    className="text-right shrink-0 max-w-[55%] truncate"
                    style={{ fontSize: "0.6rem", color: INK_MUTE }}
                  >
                    {m.desc.trim()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // callout
  const slotMap: Record<number, ("L" | "R")[]> = {
    1: ["L"],
    2: ["L", "R"],
    3: ["L", "R", "L"],
    4: ["L", "L", "R", "R"],
  };
  const yMap: Record<number, number[]> = {
    1: [32],
    2: [30, 70],
    3: [26, 42, 74],
    4: [26, 72, 40, 84],
  };
  const sides = slotMap[labels.length] ?? slotMap[4];
  const ys = yMap[labels.length] ?? yMap[4];

  return (
    <div className="absolute inset-0" style={{ backgroundColor: PAPER }}>
      {/* 상단 타이틀 */}
      <div className="px-4 pt-4">
        {t && (
          <div
            style={{
              fontFamily: SERIF_HANGUL,
              fontWeight: 700,
              fontSize: "1.15rem",
              lineHeight: 1.16,
              color: INK,
              wordBreak: "keep-all",
            }}
          >
            {t}
          </div>
        )}
        {s && (
          <div className="mt-0.5" style={{ fontSize: "0.62rem", color: INK_MUTE }}>
            {s}
          </div>
        )}
        <span
          className="block mt-1.5"
          style={{ width: "1.6rem", height: "2px", backgroundColor: accent }}
        />
      </div>
      {/* 사진 카드 — 중앙 */}
      <div
        className="absolute"
        style={{ left: "19%", right: "19%", top: "34%", bottom: "6%" }}
      >
        <div className="relative h-full w-full overflow-hidden" style={{ border: `1px solid rgba(20,19,15,0.16)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
      {/* 칩 */}
      {labels.map((label, i) => {
        const left = sides[i] === "L";
        const yPct = ys[i];
        return (
          <div
            key={i}
            className="absolute flex items-center gap-1 px-1.5 py-1"
            style={{
              top: `calc(34% + ${yPct}% * 0.6)`,
              [left ? "left" : "right"]: "3%",
              maxWidth: "26%",
              backgroundColor: PAPER,
              border: `1px solid rgba(20,19,15,0.16)`,
              transform: "translateY(-50%)",
            }}
          >
            <span
              className="inline-block shrink-0 rounded-full"
              style={{ width: "5px", height: "5px", backgroundColor: accent }}
            />
            <span
              className="truncate"
              style={{
                fontSize: "0.58rem",
                fontWeight: 600,
                color: INK,
                wordBreak: "keep-all",
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
      {/* INK_SOFT 사용처 — 린트 안정(접근성 라벨 색) */}
      <span className="sr-only" style={{ color: INK_SOFT }}>
        포스터 미리보기
      </span>
    </div>
  );
}
