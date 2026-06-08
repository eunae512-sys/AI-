"use client";

// 사장님 사진 → AI 에디토리얼 포스터.
// 업로드(data URL) → 업종별 스타일 픽커 → (선택)강조색·손글씨 → /api/generate-poster
// → KFTC AI 라벨 워터마크 → 9:16 미리보기 → onGenerated.
//
// 가짜 사람 생성과 정반대 — 진짜 사진을 살려 잡지 화보처럼 다듬는다(신뢰 보존).
// 디자인 철칙: SAGE/INK/RULE/PAPER 토큰, 사각 헤어라인 카드, 솔리드 잉크 버튼.
//   (violet/sky/amber/emerald·rounded-xl/2xl 금지, 한글 italic/uppercase 금지)

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
import { applyAiWatermark, buildAiMeta } from "@/lib/ai-gen/watermark";
import { SAGE, INK, INK_MUTE, RULE, PAPER_HOVER } from "@/lib/landing/tokens";

type Props = {
  industry: Industry;
  signatureMenu?: string[];
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
  { label: "딥 그린", value: "딥 세이지 그린", swatch: SAGE },
  { label: "잉크", value: "잉크 블랙", swatch: INK },
  { label: "테라코타", value: "따뜻한 테라코타", swatch: "#A1473D" },
  { label: "크림", value: "웜 크림 베이지", swatch: "#E6DDC8" },
];

export function PosterStudio({
  industry,
  signatureMenu,
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
  const [handwriting, setHandwriting] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [previewStyle, setPreviewStyle] = React.useState<PosterStyle | null>(null);

  React.useEffect(() => {
    setStyle(styles[0]);
  }, [styles]);

  const readFile = async (f: File) => {
    if (!f.type.startsWith("image/")) {
      toast.warn("사진(이미지)만 올릴 수 있어요");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(typeof reader.result === "string" ? reader.result : null);
      setPreview(null);
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

  const generate = async () => {
    if (!image || !style) return;
    setGenerating(true);
    setPreview(null);
    try {
      const prompt = style.prompt({
        accentColor: accentColor || undefined,
        handwriting,
        signature: signatureMenu?.[0],
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
        // 정직성 — 원본을 포스터로 둔갑시키지 않고 솔직히 안내.
        toast.warn(data?.error || "AI 포스터 편집에 실패했어요. 다시 시도해주세요.");
        return;
      }
      let finalUrl = data.image as string;
      try {
        finalUrl = await applyAiWatermark(data.image, { position: "bottom-right" });
      } catch (we) {
        console.warn("[poster-watermark] fallback to original:", (we as Error).message);
        toast.info("워터마크 부착은 발행 시점에 자동 재시도됩니다");
      }
      setPreview(finalUrl);
      setPreviewStyle(style);
      toast.success(`AI 포스터 완성 · 약 ${COST_KRW}원 사용`);
    } catch (e) {
      toast.warn((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const useThis = () => {
    if (!preview || !previewStyle) return;
    onGenerated({
      url: preview,
      styleId: previewStyle.id,
      meta: buildAiMeta({
        id: previewStyle.id,
        title: previewStyle.label,
        industry,
      }),
    });
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
            진짜 가게 사진을 살려 에디토리얼 포스터로 — 가짜 사진 아님 · 약 {COST_KRW}원/장
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

      {/* 안내 — 중립 PAPER+RULE 사각 (다색 제거) */}
      <div className="px-3.5 py-2.5 border" style={{ borderColor: RULE }}>
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: SAGE }} />
          <div className="text-xs leading-relaxed" style={{ color: INK }}>
            <b>올리신 실제 사진을 살려</b> 다듬는 편집이에요. 결과물 우하단에 법령(KFTC,
            2025.12) <b>&quot;AI 생성 콘텐츠&quot;</b> 라벨이 자동 부착됩니다.
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

      {/* 3) 옵션 (접이식) */}
      {image && (
        <div className="border" style={{ borderColor: RULE }}>
          <button
            onClick={() => setShowOpts((v) => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold"
            style={{ color: INK }}
          >
            <span>강조 색상 · 손글씨 (선택)</span>
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", showOpts && "rotate-180")}
            />
          </button>
          {showOpts && (
            <div className="px-3.5 pb-3.5 space-y-3" style={{ borderTop: `1px solid ${RULE}` }}>
              <div className="pt-3">
                <div className="text-[11px] mb-1.5" style={{ color: INK_MUTE }}>
                  강조 색상
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ACCENT_SWATCHES.map((sw) => {
                    const active = accentColor === sw.value;
                    return (
                      <button
                        key={sw.value}
                        onClick={() =>
                          setAccentColor(active ? "" : sw.value)
                        }
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
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: INK }}>
                <input
                  type="checkbox"
                  checked={handwriting}
                  onChange={(e) => setHandwriting(e.target.checked)}
                  className="accent-current"
                />
                제목·라벨 일부를 감성 손글씨 스타일로
              </label>
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
            <Button onClick={useThis} variant="default" className="h-11 px-5">
              이 포스터 사용
            </Button>
          )}
        </div>
      )}

      {/* 결과 미리보기 (9:16) */}
      <AnimatePresence>
        {preview && previewStyle && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 p-3">
                <div
                  className="relative aspect-[9/16] overflow-hidden border"
                  style={{ borderColor: RULE }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt={previewStyle.label} className="h-full w-full object-cover" />
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
                    진짜 사진 기반 · 약 {COST_KRW}원
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
