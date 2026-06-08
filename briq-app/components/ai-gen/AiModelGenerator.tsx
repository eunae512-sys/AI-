"use client";

// 소상공인 촬영비 대체 — 얼굴 없는 AI 제품·매장·손길 컷 생성 컴포넌트.
// (구 "AI 출연자": 가짜 사람 얼굴 생성 → 신뢰 훼손이라 faceless 컷으로 전환)
// faceless 씬 픽커 + 프롬프트 미리보기 + 생성 + 워터마크 + 결과 출력

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  ChevronDown,
  Info,
  ShieldCheck,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  type Industry,
  type ModelScene,
  ROLE_LABELS,
  FRAME_LABELS,
  getRecommendedScenes,
  getScenesForIndustry,
  hashSeed,
} from "@/lib/ai-gen/model-scenes";
import { translateTopicToEN } from "@/lib/cardnews/video-query";
import { applyAiWatermark, buildAiMeta } from "@/lib/ai-gen/watermark";
import { SAGE } from "@/lib/landing/tokens";

type Props = {
  industry: Industry;
  signatureMenu?: string[];
  /** 캠페인 주제/테마 (예: "여름 수박 케이크") — 컷을 주제에 맞게 연출 */
  topic?: string;
  /** 추천 변주용 시드 — 보통 brand.id. 없으면 industry+signatureMenu+topic 로 합성 */
  seed?: string;
  /** 생성 완료 시 호출 — workflow 로 결과 전달 */
  onGenerated: (result: { url: string; scene: ModelScene; meta: ReturnType<typeof buildAiMeta>; costKrw: number }) => void;
  /** 외부에서 닫기 (탭 전환 등) */
  onClose?: () => void;
  /** 컴팩트 변형 — Reels/Shorts 내부 임베드 */
  compact?: boolean;
};

const COST_USD_PER_IMAGE = 0.04; // gpt-image-1 medium
const COST_KRW = Math.round(COST_USD_PER_IMAGE * 1400);

// 얼굴 없는 컷만 노출 — 음식·제품·매장·손길(closeup/overhead) 및 product 역할.
// portrait·lifestyle(정면 인물·일상 씬)은 제외해 가짜 사람 얼굴을 차단한다.
const FACELESS = (s: ModelScene) => s.frame === "closeup" || s.frame === "overhead" || s.role === "product";

export function AiModelGenerator({ industry, signatureMenu, topic, seed, onGenerated, onClose, compact = false }: Props) {
  const toast = useToast();
  // 추천 변주: seed(brand.id) 우선, 없으면 업종+메뉴+주제로 합성 → 결정론 해시.
  // 같은 브랜드/주제면 항상 같은 추천, 다르면 변형이 바뀜.
  const seedStr = (seed ?? `${industry}|${signatureMenu?.join(",") ?? ""}|${topic ?? ""}`).trim();
  const seedNum = React.useMemo(() => hashSeed(seedStr), [seedStr]);

  // faceless 전체 풀.
  const allScenes = React.useMemo(
    () => getScenesForIndustry(industry).filter(FACELESS),
    [industry],
  );

  // 추천: getRecommendedScenes 결과(얼굴 포함 가능)를 faceless 로 필터한 뒤,
  // 부족분을 faceless 전체 풀에서 중복 없이 backfill(최대 4컷). seed 변주 유지.
  const recommended = React.useMemo(() => {
    const picked: ModelScene[] = [];
    const seen = new Set<string>();
    for (const s of getRecommendedScenes(industry, seedNum)) {
      if (FACELESS(s) && !seen.has(s.id)) {
        seen.add(s.id);
        picked.push(s);
      }
    }
    if (picked.length < 4) {
      // seed 기반 회전 오프셋으로 backfill 시작점을 변주.
      const start = allScenes.length ? seedNum % allScenes.length : 0;
      for (let i = 0; i < allScenes.length && picked.length < 4; i++) {
        const s = allScenes[(start + i) % allScenes.length];
        if (!seen.has(s.id)) {
          seen.add(s.id);
          picked.push(s);
        }
      }
    }
    return picked.slice(0, 4);
  }, [industry, seedNum, allScenes]);

  const [scene, setScene] = React.useState<ModelScene>(recommended[0] ?? allScenes[0]);
  const [showAll, setShowAll] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [previewScene, setPreviewScene] = React.useState<ModelScene | null>(null);

  React.useEffect(() => {
    if (!scene && (recommended[0] || allScenes[0])) setScene(recommended[0] ?? allScenes[0]);
  }, [recommended, allScenes, scene]);

  const selectScene = (s: ModelScene) => setScene(s);

  // 주제 반영: 한국어 주제를 영문 소재로 변환(이미지 모델·Pexels 폴백 매칭률↑).
  // 변환 실패 시 원문 한국어로 폴백. 실제 시그니처 메뉴가 있으면 그걸 우선.
  const topicEN = topic?.trim() ? (translateTopicToEN(topic) || topic.trim()) : undefined;
  const themeSubject = signatureMenu?.[0] || topicEN || undefined;
  const promptEN = scene
    ? (() => {
        // faceless 컷이라 gender/age 는 전달하지 않음(옵셔널). 소재만 반영.
        const base = scene.promptEN({ signatureMenu: themeSubject });
        // 소재를 직접 안 쓰는 씬에도 주제가 화면에 드러나도록 컨텍스트 추가.
        return topicEN && !base.includes(topicEN) ? `${base} The scene is visually themed around ${topicEN}.` : base;
      })()
    : "";

  const generate = async () => {
    if (!scene) return;
    setGenerating(true);
    setPreview(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: promptEN,
          size: "1024x1536", // 9:16 vertical
          quality: "medium",
          slideId: scene.id,
          // 폴백(Pexels 검색) 정확도용 — 업종·씬 컨텍스트 전달.
          industry,
          personaSeed: scene.id,
          // 씬 인식 폴백 — Imagen 실패 시 씬·주제 맞는 Pexels 사진을 찾도록.
          fallbackQuery: scene.fallbackQuery,
          frame: scene.frame,
        }),
      });
      const data = await res.json();
      if (!data?.ok || !data?.image) {
        toast.warn(data?.error || "이미지 생성 실패");
        return;
      }
      // 워터마크 적용 — 외부 URL CORS 실패 시 원본으로 fallback (데모 모드용)
      let finalUrl = data.image as string;
      try {
        finalUrl = await applyAiWatermark(data.image, { position: "bottom-right" });
      } catch (we) {
        console.warn("[ai-watermark] fallback to original:", (we as Error).message);
        toast.info("워터마크 부착 생략 (데모 모드) — 발행 시점에 자동 재시도");
      }
      setPreview(finalUrl);
      setPreviewScene(scene);
      const demoNote = data.meta?.demoMode ? " (데모 — API 키 미설정)" : "";
      toast.success(`AI 컷 생성 완료${demoNote} · 약 ${COST_KRW}원 사용`);
    } catch (e) {
      toast.warn((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const useThis = () => {
    if (!preview || !previewScene) return;
    onGenerated({
      url: preview,
      scene: previewScene,
      meta: buildAiMeta({
        id: previewScene.id,
        title: previewScene.title,
        industry: previewScene.industry,
        role: previewScene.role,
      }),
      costKrw: COST_KRW,
    });
    toast.success("AI 컷 사진 적용됨 — 카피 생성 단계로");
  };

  const visibleScenes = showAll ? allScenes : recommended;

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: SAGE }}>
            <Sparkles className="h-3.5 w-3.5" /> AI 제품·매장 컷
          </div>
          <h3 className={cn("mt-1 font-semibold", compact ? "text-base" : "text-lg")}>
            사람 없이 — 음식·공간·손길 컷을 그려드려요
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            음식·제품·매장·손길 컷을 골라 한 장 생성 — 촬영·모델 비용 없음 · 약 {COST_KRW}원/장
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 안내 - 무엇이 생성되는지 투명하게 (중립 PAPER+RULE, 다색 제거) */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 px-3.5 py-2.5">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: SAGE }} />
          <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <b>사람 얼굴이 들어가지 않는 음식·공간·손길 컷</b>만 생성합니다. 결과물 우하단에
            법령(KFTC, 2025.12) <b>"AI 생성 콘텐츠"</b> 라벨이 자동 부착됩니다.
          </div>
        </div>
      </div>

      {/* 씬 픽커 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {showAll ? `모든 컷 (${allScenes.length})` : `추천 컷 (${recommended.length})`}
            {!showAll && (
              <span className="ml-1.5 font-normal text-[11px] text-zinc-400">
                {topic?.trim()
                  ? `· '${topic.trim()}' 맞춤`
                  : "· 업종별 추천 컷"}
              </span>
            )}
          </div>
          {allScenes.length > recommended.length && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs inline-flex items-center gap-0.5"
              style={{ color: SAGE }}
            >
              {showAll ? "추천만" : "전체 보기"}
              <ChevronDown className={cn("h-3 w-3 transition-transform", showAll && "rotate-180")} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {visibleScenes.map((s) => {
            const active = scene?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => selectScene(s)}
                className={cn(
                  "rounded-sm border p-3 text-left transition-all min-h-[88px]",
                  active
                    ? "shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600",
                )}
                style={
                  active
                    ? { borderColor: SAGE, backgroundColor: "rgba(79,95,75,0.06)" }
                    : undefined
                }
              >
                <div className="text-[10px] font-medium text-zinc-500 mb-1">
                  {ROLE_LABELS[s.role]} · {FRAME_LABELS[s.frame]}
                </div>
                <div className="text-sm font-semibold leading-snug">{s.title}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{s.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 액션 */}
      <div className="flex items-center gap-2">
        <Button
          onClick={generate}
          disabled={!scene || generating}
          className="flex-1 h-11"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              생성 중 (약 8–15초)
            </>
          ) : preview ? (
            <>
              <RefreshCw className="h-4 w-4" />
              다시 생성 (다른 컷)
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI 컷 만들기
            </>
          )}
        </Button>
        {preview && (
          <Button onClick={useThis} variant="default" className="h-11 px-5">
            이 사진 사용
          </Button>
        )}
      </div>

      {/* 결과 미리보기 */}
      <AnimatePresence>
        {preview && previewScene && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3 p-3">
                <div className="relative aspect-[9/16] rounded-sm overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt={previewScene.title} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="default">{ROLE_LABELS[previewScene.role]}</Badge>
                    <Badge tone="default">{FRAME_LABELS[previewScene.frame]}</Badge>
                    <Badge tone="default">AI 생성</Badge>
                  </div>
                  <div className="text-sm font-semibold">{previewScene.title}</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {previewScene.desc} · 우하단 AI 라벨 자동 부착됨 (KFTC 의무)
                  </div>
                  <div className="text-[11px] text-zinc-500 inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" style={{ color: SAGE }} />
                    사람 없음 · 촬영비 없음 · 약 {COST_KRW}원
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
