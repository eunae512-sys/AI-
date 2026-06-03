"use client";

// 소상공인 출연자 대체 — AI 모델 이미지 생성 컴포넌트
// 씬 픽커 + 성별/연령 조정 + 프롬프트 미리보기 + 생성 + 워터마크 + 결과 출력

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
  type ModelGender,
  type ModelAge,
  type SceneRole,
  ROLE_LABELS,
  FRAME_LABELS,
  GENDER_LABELS,
  AGE_LABELS,
  getRecommendedScenes,
  getScenesForIndustry,
} from "@/lib/ai-gen/model-scenes";
import { translateTopicToEN } from "@/lib/cardnews/video-query";
import { applyAiWatermark, buildAiMeta } from "@/lib/ai-gen/watermark";

type Props = {
  industry: Industry;
  signatureMenu?: string[];
  /** 캠페인 주제/테마 (예: "여름 수박 케이크") — 출연자 씬을 주제에 맞게 연출 */
  topic?: string;
  /** 생성 완료 시 호출 — workflow 로 결과 전달 */
  onGenerated: (result: { url: string; scene: ModelScene; meta: ReturnType<typeof buildAiMeta>; costKrw: number }) => void;
  /** 외부에서 닫기 (탭 전환 등) */
  onClose?: () => void;
  /** 컴팩트 변형 — Reels/Shorts 내부 임베드 */
  compact?: boolean;
};

const COST_USD_PER_IMAGE = 0.04; // gpt-image-1 medium
const COST_KRW = Math.round(COST_USD_PER_IMAGE * 1400);

export function AiModelGenerator({ industry, signatureMenu, topic, onGenerated, onClose, compact = false }: Props) {
  const toast = useToast();
  const recommended = React.useMemo(() => getRecommendedScenes(industry), [industry]);
  const allScenes = React.useMemo(() => getScenesForIndustry(industry), [industry]);

  const [scene, setScene] = React.useState<ModelScene>(recommended[0] ?? allScenes[0]);
  const [gender, setGender] = React.useState<ModelGender>(scene?.defaultGender ?? "any");
  const [age, setAge] = React.useState<ModelAge>(scene?.defaultAge ?? "any");
  const [showAll, setShowAll] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [previewScene, setPreviewScene] = React.useState<ModelScene | null>(null);

  React.useEffect(() => {
    if (!scene && recommended[0]) setScene(recommended[0]);
  }, [recommended, scene]);

  // 씬 변경 시 기본 성별·연령 동기화
  const selectScene = (s: ModelScene) => {
    setScene(s);
    setGender(s.defaultGender ?? "any");
    setAge(s.defaultAge ?? "any");
  };

  // 주제 반영: 한국어 주제를 영문 소재로 변환(이미지 모델·Pexels 폴백 매칭률↑).
  // 변환 실패 시 원문 한국어로 폴백. 실제 시그니처 메뉴가 있으면 그걸 우선.
  const topicEN = topic?.trim() ? (translateTopicToEN(topic) || topic.trim()) : undefined;
  const themeSubject = signatureMenu?.[0] || topicEN || undefined;
  const promptEN = scene
    ? (() => {
        const base = scene.promptEN({ gender, age, signatureMenu: themeSubject });
        // 사장님/손님 씬처럼 소재를 직접 안 쓰는 경우에도 주제가 화면에 드러나도록 컨텍스트 추가
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
          // 폴백(Pexels 인물 검색) 정확도용 — 업종·성별·씬 컨텍스트 전달.
          // 미전달 시 generic woman 으로 떨어져 씬과 무관한 인물이 나왔음.
          industry,
          gender: gender === "female" || gender === "male" ? gender : undefined,
          personaSeed: scene.id,
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
      toast.success(`AI 출연자 생성 완료${demoNote} · 약 ${COST_KRW}원 사용`);
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
    toast.success("AI 출연자 사진 적용됨 — 카피 생성 단계로");
  };

  const visibleScenes = showAll ? allScenes : recommended;

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
            <Sparkles className="h-3.5 w-3.5" /> AI 출연자 생성
          </div>
          <h3 className={cn("mt-1 font-semibold", compact ? "text-base" : "text-lg")}>
            직접 출연 대신 AI가 사람을 그려드려요
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            사장님·직원·손님 씬을 골라 한 장 생성 — 모델 섭외, 촬영 비용 없음 · 약 {COST_KRW}원/장
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

      {/* 안내 - 무엇이 자동/수동인지 투명하게 */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-500/5 px-3.5 py-2.5">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <b>모든 출연자는 AI 생성 인물</b>입니다. 실제 사람과 무관 · 모델료/초상권 이슈 없음 ·
            법령(KFTC, 2025.12)에 따라 결과물 우하단에 <b>"AI 생성 콘텐츠"</b> 라벨이 자동 표시됩니다.
          </div>
        </div>
      </div>

      {/* 씬 픽커 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {showAll ? `모든 씬 (${allScenes.length})` : `추천 씬 (${recommended.length})`}
          </div>
          {allScenes.length > recommended.length && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs text-violet-600 dark:text-violet-400 inline-flex items-center gap-0.5"
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
                  "rounded-xl border p-3 text-left transition-all min-h-[88px]",
                  active
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10 dark:border-violet-500/60 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600",
                )}
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

      {/* 인물 옵션 — 사람 없는 씬일 때는 비활성 */}
      {scene && scene.role !== "product" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">성별</div>
            <div className="flex flex-wrap gap-1.5">
              {(["any", "female", "male"] as ModelGender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs border transition-colors",
                    gender === g
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400",
                  )}
                >
                  {GENDER_LABELS[g]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">연령대</div>
            <div className="flex flex-wrap gap-1.5">
              {(["any", "20s", "30s", "40s", "50s"] as ModelAge[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setAge(a)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs border transition-colors",
                    age === a
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400",
                  )}
                >
                  {AGE_LABELS[a]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
              AI 출연자 만들기
            </>
          )}
        </Button>
        {preview && (
          <Button onClick={useThis} variant="default" className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700">
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
                <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt={previewScene.title} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="violet">{ROLE_LABELS[previewScene.role]}</Badge>
                    <Badge tone="sky">{FRAME_LABELS[previewScene.frame]}</Badge>
                    <Badge tone="amber">AI 생성</Badge>
                  </div>
                  <div className="text-sm font-semibold">{previewScene.title}</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {previewScene.desc} · 우하단 AI 라벨 자동 부착됨 (KFTC 의무)
                  </div>
                  <div className="text-[11px] text-zinc-500 inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    초상권 안전 · 모델료 없음 · 약 {COST_KRW}원 소요
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
