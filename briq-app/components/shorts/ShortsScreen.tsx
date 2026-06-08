"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  Upload,
  Sparkles,
  Wand2,
  Copy,
  Check,
  Loader2,
  Image as ImageIcon,
  Calendar,
  ArrowRight,
  RefreshCw,
  Hash,
  Play,
  X,
  UserCircle2,
  ImagePlus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";
import { NextStepCard } from "@/components/layout/RoadmapStrip";
import { AiModelGenerator } from "@/components/ai-gen/AiModelGenerator";
import { appendAiHashtag } from "@/lib/ai-gen/watermark";
import type { Industry } from "@/lib/ai-gen/model-scenes";
import {
  TONES,
  PLATFORMS,
  PUBLISH_TIME_HINT,
  generateAllPlatforms,
  inferMoodFromIndustry,
  type ToneId,
  type PlatformOutput,
} from "@/lib/dummy/shorts-presets";
import { cn } from "@/lib/utils";

type Uploaded = {
  url: string;
  name: string;
  size: number;
  type: "image" | "video";
  aiGenerated?: boolean;
  aiSceneTitle?: string;
};

type SourceMode = "upload" | "ai-model";

export function ShortsScreen() {
  const { brand, userBrand } = useBrand();
  // 사용자 브랜드가 활성화돼 있으면 입력한 가게 정보를 카피에 우선 적용
  const isActiveUserBrand = !!userBrand && brand.id === userBrand.id;
  const tagline = isActiveUserBrand ? userBrand?.tagline : undefined;
  const signatureMenu = isActiveUserBrand ? userBrand?.signatureMenu : undefined;
  const toast = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [file, setFile] = React.useState<Uploaded | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [tone, setTone] = React.useState<ToneId>("emotional");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [results, setResults] = React.useState<PlatformOutput[] | null>(null);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [sourceMode, setSourceMode] = React.useState<SourceMode>("upload");
  // 변형 횟수 — regenerate 클릭마다 증가, voice-bank pickFreshHookSeeded 에 전달돼 다른 hook 픽
  const [variationSeed, setVariationSeed] = React.useState(0);
  // 캘린더에서 보낸 테마 — 카피 생성에 직접 전달됨 (hooks + keyword + desc)
  type CalendarPreset = {
    themeTitle: string;
    themeKind: string;
    themeDesc: string;
    themeHooks?: string[];
    themeKeyword?: string;
    themeWhenLabel?: string;
  };
  const [preset, setPreset] = React.useState<CalendarPreset | null>(null);

  // 캘린더에서 보낸 preset 읽기 (briq:shorts-preset)
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("briq:shorts-preset");
      if (raw) {
        const p = JSON.parse(raw) as CalendarPreset & { tone?: ToneId };
        if (p.tone) setTone(p.tone);
        setPreset({
          themeTitle: p.themeTitle,
          themeKind: p.themeKind,
          themeDesc: p.themeDesc,
          themeHooks: p.themeHooks,
          themeKeyword: p.themeKeyword,
          themeWhenLabel: p.themeWhenLabel,
        });
        sessionStorage.removeItem("briq:shorts-preset");
        toast.info(`"${p.themeTitle}" 주제로 시작 — 사진만 올리면 그 테마로 카피 자동 작성`);
      }
    } catch {
      // 무시
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mood = file ? inferMoodFromIndustry(brand.industry) : null;

  const readFile = async (f: File) => {
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      toast.warn("사진 또는 영상만 업로드할 수 있어요");
      return;
    }
    const reader = new FileReader();
    const url = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("읽기 실패"));
      reader.readAsDataURL(f);
    });
    setFile({
      url,
      name: f.name,
      size: f.size,
      type: f.type.startsWith("video/") ? "video" : "image",
    });
    setResults(null);
    toast.success(`업로드 완료 · AI가 ${brand.industryLabel} 분위기를 분석 중`);
  };

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) await readFile(e.target.files[0]);
    if (e.target) e.target.value = "";
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.[0]) await readFile(e.dataTransfer.files[0]);
  };

  // AI 출연자로 생성된 경우 KFTC 의무 라벨 해시태그를 모든 플랫폼 카피에 추가
  const annotateForAi = React.useCallback(
    (outputs: PlatformOutput[]): PlatformOutput[] => {
      if (!file?.aiGenerated) return outputs;
      return outputs.map((o) => ({
        ...o,
        hashtags: o.hashtags.includes("AI생성") ? o.hashtags : [...o.hashtags, "AI생성"],
        caption: /#AI생성/.test(o.caption) ? o.caption : `${o.caption}\n\n#AI생성`,
      }));
    },
    [file?.aiGenerated],
  );

  const generate = async () => {
    if (!file) {
      // 기본 모드에 따라 동작 — upload 면 파일 선택, ai-model 이면 안내
      if (sourceMode === "ai-model") {
        toast.warn("위에서 씬을 골라 AI 출연자를 먼저 만들어주세요");
        return;
      }
      fileRef.current?.click();
      return;
    }
    setAnalyzing(true);
    try {
      // 800ms 인공 지연 — 실제 분석하는 느낌 (실서비스는 GPT 호출)
      await new Promise((r) => setTimeout(r, 800));
      const out = generateAllPlatforms({
        industry: brand.industry,
        tone,
        brandName: brand.name,
        city: brand.city,
        tagline,
        signatureMenu,
        themeTitle: preset?.themeTitle,
        themeDesc: preset?.themeDesc,
        themeHooks: preset?.themeHooks,
        themeKeyword: preset?.themeKeyword,
        variationSeed,
      });
      setResults(annotateForAi(out));
      toast.success(
        preset
          ? `"${preset.themeTitle}" 주제 4개 플랫폼 카피 완료`
          : `4개 플랫폼 콘텐츠 생성 완료 — 복사하거나 예약 발행하세요`,
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const regenerate = async (newTone?: ToneId) => {
    if (newTone) setTone(newTone);
    if (!file) {
      toast.warn("사진을 먼저 업로드해 주세요");
      return;
    }
    setAnalyzing(true);
    // 변형 호출 시마다 seed 증가 — 다른 hook 가 픽됨 (반복 방지)
    const nextSeed = variationSeed + 1;
    setVariationSeed(nextSeed);
    try {
      await new Promise((r) => setTimeout(r, 500));
      const out = generateAllPlatforms({
        industry: brand.industry,
        tone: newTone ?? tone,
        brandName: brand.name,
        city: brand.city,
        tagline,
        signatureMenu,
        themeTitle: preset?.themeTitle,
        themeDesc: preset?.themeDesc,
        themeHooks: preset?.themeHooks,
        themeKeyword: preset?.themeKeyword,
        variationSeed: nextSeed,
      });
      setResults(annotateForAi(out));
      toast.success(`#${nextSeed} 변형 — 최근 후크 회피, 다른 톤으로 다시 작성됨`);
    } finally {
      setAnalyzing(false);
    }
  };

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("복사됨");
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      toast.warn("복사 실패");
    }
  };

  const removeFile = () => {
    setFile(null);
    setResults(null);
  };

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-7">
      {/* Hero */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-violet-600 dark:text-violet-400">
          AI 자동 홍보 · {brand.name}
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-[1.15]">
          영상 하나로 SNS 홍보 끝
        </h1>
        <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          사진 한 장만 올리면 인스타 릴스·틱톡·유튜브 쇼츠·네이버 플레이스용 홍보글을 동시에 만들어요. 사장님은 복사·예약만.
        </p>
      </div>

      {/* 활성 브랜드 정보 — 카피에 어떤 정보가 들어가는지 투명하게 */}
      {isActiveUserBrand && (
        <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-500/5 px-4 py-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                내 가게 정보로 카피 생성
              </div>
              <div className="mt-1 text-sm text-emerald-900 dark:text-emerald-100">
                {brand.name}{tagline ? ` · "${tagline}"` : ""}
              </div>
              {signatureMenu && signatureMenu.length > 0 ? (
                <div className="mt-0.5 text-xs text-emerald-700/80 dark:text-emerald-300/70">
                  시그니처: {signatureMenu.join(" · ")}
                </div>
              ) : (
                <div className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                  ⚠ 시그니처 메뉴 미입력 — 일반 템플릿 사용 중. <Link href="/brand-kit" className="underline font-semibold">내 정보 보완</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar 에서 가져온 preset 안내 */}
      {preset && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-xl border border-violet-200 dark:border-violet-900/40 bg-violet-50/60 dark:bg-violet-500/10 px-4 py-3"
        >
          <div className="text-xs font-semibold text-violet-700 dark:text-violet-300">
            캘린더 추천 · {preset.themeKind}
          </div>
          <div className="mt-0.5 text-sm font-semibold text-violet-900 dark:text-violet-100">
            {preset.themeTitle}
          </div>
          <div className="text-xs text-violet-700/80 dark:text-violet-300/70 mt-0.5">
            {preset.themeDesc} · 톤이 자동 선택되었어요. 사진만 올리면 4개 플랫폼 완성.
          </div>
        </motion.div>
      )}

      {/* 3-step indicator */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto -mx-1 px-1 pb-1">
        <StepChip n={1} label="사진/영상 업로드" active={!file} done={!!file} />
        <StepConnector />
        <StepChip n={2} label="톤 선택" active={!!file && !results} done={!!results} />
        <StepConnector />
        <StepChip n={3} label="복사·예약 발행" active={!!results} done={false} />
      </div>

      {/* Step 1 — Source (Upload 또는 AI 출연자 생성) */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-violet-500" /> 1. 사진 한 장 — 직접 올리거나, AI가 그려드려요
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              사장님이 출연하기 어려우면 AI 출연자가 대신 — 모델·촬영 비용 없음
            </p>
          </div>
          {file && (
            <button
              onClick={removeFile}
              className="text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-rose-600 dark:hover:text-rose-400"
            >
              <X className="h-3.5 w-3.5" /> 다시 올리기
            </button>
          )}
        </div>

        {/* 소스 모드 탭 — 파일이 아직 없을 때만 노출 */}
        {!file && (
          <div className="flex gap-2 mb-4 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setSourceMode("upload")}
              className={cn(
                "flex-1 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-colors",
                sourceMode === "upload"
                  ? "bg-white dark:bg-zinc-950 shadow-sm text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
              )}
            >
              <ImagePlus className="h-4 w-4" />
              직접 업로드
            </button>
            <button
              onClick={() => setSourceMode("ai-model")}
              className={cn(
                "flex-1 px-3 py-2 rounded-md text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-colors",
                sourceMode === "ai-model"
                  ? "bg-white dark:bg-zinc-950 shadow-sm text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
              )}
            >
              <UserCircle2 className="h-4 w-4 text-violet-500" />
              AI 출연자 생성
              <Badge tone="violet" className="ml-1">신규</Badge>
            </button>
          </div>
        )}

        {!file && sourceMode === "upload" && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "w-full rounded-2xl border-2 border-dashed py-12 px-6 text-center transition-all",
              "min-h-[200px] flex flex-col items-center justify-center gap-2",
              dragOver
                ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 active:scale-[0.99]",
            )}
            style={{ minHeight: 200 }}
          >
            <div className="text-5xl mb-1">📷</div>
            <div className="text-base font-semibold">사진 또는 영상을 드롭하거나 클릭</div>
            <div className="text-sm text-zinc-500">사장님 가게의 한 컷 · 자동 분석</div>
          </button>
        )}

        {!file && sourceMode === "ai-model" && (
          <AiModelGenerator
            industry={brand.industry as Industry}
            signatureMenu={isActiveUserBrand ? userBrand?.signatureMenu : undefined}
            topic={preset?.themeTitle ?? brand.campaign}
            seed={brand.id}
            onGenerated={({ url, scene }) => {
              setFile({
                url,
                name: `${scene.title}.png`,
                size: 0,
                type: "image",
                aiGenerated: true,
                aiSceneTitle: scene.title,
              });
              setResults(null);
              toast.success(`AI 출연자 적용 — 톤을 골라 카피를 만들어보세요`);
            }}
          />
        )}

        {file && (
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 items-start">
            <div className="relative rounded-xl overflow-hidden aspect-square bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              {file.type === "video" ? (
                <video src={file.url} className="h-full w-full object-cover" controls muted playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
              )}
              {file.aiGenerated && (
                <div className="absolute top-2 left-2">
                  <Badge tone="violet" className="shadow">AI 출연자</Badge>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-zinc-500 font-medium">AI 분석 결과</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge tone="violet">{brand.industryLabel}</Badge>
                  {file.aiGenerated && file.aiSceneTitle && (
                    <Badge tone="amber">씬: {file.aiSceneTitle}</Badge>
                  )}
                  {mood && (
                    <>
                      <Badge tone="rose">{mood.mood}</Badge>
                      <Badge tone="sky">{mood.vibe}</Badge>
                    </>
                  )}
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {file.aiGenerated
                    ? `${file.aiSceneTitle ?? "AI 생성 출연자"} · KFTC 의무 라벨 자동 부착 · 카피 끝에 #AI생성 해시태그 자동 추가`
                    : `${file.name} · ${(file.size / 1024).toFixed(0)}KB · 업종과 분위기를 반영해 4개 플랫폼용 홍보글을 만듭니다.`}
                </p>
              </div>
            </div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={onChange}
        />
      </Card>

      {/* Step 2 — Tone */}
      <Card className={cn("p-5 mb-4 transition-opacity", !file && "opacity-60")}>
        <h2 className="text-base font-semibold mb-1 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-violet-500" /> 2. 어떤 느낌으로?
        </h2>
        <p className="text-sm text-zinc-500 mb-4">선택한 톤으로 4개 플랫폼 모두 같은 결로 작성합니다</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {TONES.map((t) => {
            const active = tone === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTone(t.id);
                  if (results) regenerate(t.id);
                }}
                disabled={!file}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all min-h-[88px] disabled:opacity-50",
                  active
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 active:scale-[0.98]",
                )}
              >
                <div className="text-2xl">{t.emoji}</div>
                <div className="mt-2 text-sm font-semibold">{t.label}</div>
                <div className="text-xs text-zinc-500 mt-0.5 leading-snug">{t.desc}</div>
              </button>
            );
          })}
        </div>

        <Button
          onClick={generate}
          disabled={!file || analyzing}
          className="w-full mt-5 h-12 text-base"
          size="lg"
        >
          {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
          {analyzing ? "AI 작성 중..." : results ? "다시 작성" : "오늘 홍보글 자동 생성"}
        </Button>
      </Card>

      {/* Step 3 — Results */}
      {results && (
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-emerald-500" /> 3. 플랫폼별 결과
              </h2>
              <p className="text-sm text-zinc-500 mt-1">각 카드 복사 · 예약 발행 가능</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => regenerate()} disabled={analyzing}>
                {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {analyzing ? "작성 중..." : "전체 다시 작성"}
              </Button>
              <Button asChild size="sm">
                <Link href="/scheduler">
                  <Calendar className="h-3.5 w-3.5" /> 예약 발행
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((r) => {
              const meta = PLATFORMS.find((p) => p.id === r.platform)!;
              return (
                <PlatformCard
                  key={r.platform}
                  result={r}
                  meta={meta}
                  filePreview={file}
                  onCopy={copyText}
                  copiedKey={copiedKey}
                  brandColor={brand.brandColors?.primary}
                />
              );
            })}
          </div>

          {/* 발행 1-2-3 가이드 */}
          <div className="mt-5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 p-4">
            <div className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-violet-500" /> 이렇게 발행하세요
            </div>
            <ol className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300 mb-4">
              <li className="flex gap-2.5">
                <span className="h-5 w-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 grid place-items-center text-[11px] font-bold tabular-nums shrink-0">1</span>
                <span>위 카드의 <b>제목·캡션·해시태그</b>를 플랫폼별로 복사</span>
              </li>
              <li className="flex gap-2.5">
                <span className="h-5 w-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 grid place-items-center text-[11px] font-bold tabular-nums shrink-0">2</span>
                <span>
                  영상이 필요하면 <Link href="/reels" className="font-semibold underline-offset-2 hover:underline">릴스 합성</Link>에서 사진 8장으로 30초 .mp4 생성 → 폰에 저장
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="h-5 w-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 grid place-items-center text-[11px] font-bold tabular-nums shrink-0">3</span>
                <span>인스타·틱톡·쇼츠·네이버에 업로드하고 복사한 카피 붙여넣기 (예약 발행도 가능)</span>
              </li>
            </ol>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900">
              <div className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-500" /> 추천 발행 시간
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLATFORMS.map((p) => (
                  <div key={p.id} className="rounded-lg bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 p-2.5">
                    <div className="text-xs text-zinc-500 font-medium">{p.label}</div>
                    <div className="text-sm font-semibold mt-0.5">{PUBLISH_TIME_HINT[p.id]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Empty state hint */}
      {!file && (
        <Card className="p-5 bg-gradient-to-br from-violet-50/40 to-rose-50/40 dark:from-violet-500/[0.04] dark:to-rose-500/[0.04] border-violet-200/40 dark:border-violet-800/30">
          <div className="text-base font-semibold mb-2">사진만 올리면 손님 오는 콘텐츠 완성</div>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 leading-relaxed">
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> 인스타 릴스 · 틱톡 · 쇼츠 · 네이버 동시 작성</li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> 플랫폼 문법에 맞게 자막 · 제목 · 해시태그 자동 최적화</li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> 5가지 톤 (감성/정보/이벤트/할인/후기) 원클릭 변경</li>
            <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> 추천 발행 시간 + 예약 큐 자동 연결</li>
          </ul>
        </Card>
      )}

      {/* 다음 단계 — 워크플로우 4단계 (발행 예약) 로 연결 */}
      <div className="mt-5">
        <NextStepCard />
      </div>
    </div>
  );
}

// ───────── Sub-components ─────────

function StepChip({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span
        className={cn(
          "h-7 w-7 rounded-full grid place-items-center text-sm font-bold tabular-nums shrink-0",
          done
            ? "bg-emerald-500 text-white"
            : active
              ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400",
        )}
      >
        {done ? "✓" : n}
      </span>
      <span className={cn("text-sm font-medium whitespace-nowrap", active ? "" : "text-zinc-500")}>
        {label}
      </span>
    </div>
  );
}

function StepConnector() {
  return <span className="h-px w-6 sm:w-8 bg-zinc-200 dark:bg-zinc-800 shrink-0" aria-hidden />;
}

function PlatformCard({
  result,
  meta,
  filePreview,
  onCopy,
  copiedKey,
  brandColor,
}: {
  result: PlatformOutput;
  meta: (typeof PLATFORMS)[number];
  filePreview: Uploaded | null;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
  brandColor?: string;
}) {
  const fullText = `${result.title}\n\n${result.caption}\n\n${result.hashtags.join(" ")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-900">
        <span className={cn("h-8 w-8 rounded-md grid place-items-center text-sm font-bold shrink-0", meta.badgeClass)}>
          {meta.label.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold tracking-tight">{meta.label}</div>
          <div className="text-xs text-zinc-500">{meta.spec}</div>
        </div>
        <span className="text-xs text-zinc-400 shrink-0">{meta.hint}</span>
      </div>

      {/* Phone preview — short vertical preview with overlay */}
      {meta.id !== "naver" && filePreview && (
        <div className="aspect-[9/16] max-h-[280px] mx-auto w-[160px] mt-4 mb-2 rounded-xl overflow-hidden bg-zinc-900 relative">
          {filePreview.type === "video" ? (
            <video src={filePreview.url} className="h-full w-full object-cover" muted autoPlay loop playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={filePreview.url} alt="" className="h-full w-full object-cover" />
          )}
          {/* 하단 스크림 — 어떤 사진에서도 자막이 읽히도록 */}
          <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
          {/* 번인 자막 — 썸네일형 임팩트(굵은 아웃라인·브랜드 액센트 바·중앙) */}
          <div className="absolute inset-x-0 bottom-0 px-2.5 pb-4 flex flex-col items-center pointer-events-none">
            <span
              className="mb-1.5 block h-[3px] w-8 rounded-full"
              style={{ background: brandColor ?? "#4F5F4B" }}
            />
            <p
              className="text-center text-white leading-[1.12]"
              style={{
                fontSize: "16px",
                fontWeight: 900,
                wordBreak: "keep-all",
                textWrap: "balance",
                letterSpacing: "-0.02em",
                textShadow: "0 2px 6px rgba(0,0,0,0.55), 0 0 1px rgba(0,0,0,0.95)",
                WebkitTextStroke: "0.7px rgba(0,0,0,0.5)",
                paintOrder: "stroke fill",
              }}
            >
              {result.subtitle}
            </p>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-4 space-y-3 flex-1">
        {/* Title */}
        <FieldBlock
          label={meta.id === "shorts" ? "SEO 제목" : meta.id === "tiktok" ? "훅 (첫 줄)" : "제목/표지 카피"}
          value={result.title}
          onCopy={() => onCopy(result.title, `${result.platform}-title`)}
          copied={copiedKey === `${result.platform}-title`}
        />
        {/* Caption */}
        <FieldBlock
          label={meta.id === "naver" ? "소식 본문" : "본문 캡션"}
          value={result.caption}
          multiline
          charCount={result.caption.length}
          maxLen={meta.captionMaxLen}
          onCopy={() => onCopy(result.caption, `${result.platform}-caption`)}
          copied={copiedKey === `${result.platform}-caption`}
        />
        {/* Hashtags */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs font-semibold text-zinc-500 inline-flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" /> 해시태그 {result.hashtags.length}개
            </div>
            <button
              onClick={() => onCopy(result.hashtags.join(" "), `${result.platform}-tags`)}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1"
            >
              {copiedKey === `${result.platform}-tags` ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              복사
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.hashtags.map((h, i) => (
              <span key={`${h}-${i}`} className="text-xs bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded">
                {h}
              </span>
            ))}
          </div>
        </div>
        {/* CTA */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/50 p-3">
          <div className="text-xs font-semibold text-zinc-500 mb-1">CTA</div>
          <div className="text-sm leading-relaxed">{result.cta}</div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-h-[44px]"
          onClick={() => onCopy(fullText, `${result.platform}-all`)}
        >
          {copiedKey === `${result.platform}-all` ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copiedKey === `${result.platform}-all` ? "복사됨" : "전체 복사"}
        </Button>
        <Button asChild size="sm" className="flex-1 min-h-[44px]">
          <Link href="/scheduler">
            예약 <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

function FieldBlock({
  label,
  value,
  multiline,
  charCount,
  maxLen,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  charCount?: number;
  maxLen?: number;
  onCopy: () => void;
  copied: boolean;
}) {
  const over = charCount !== undefined && maxLen !== undefined && charCount > maxLen;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <div className="text-xs font-semibold text-zinc-500">{label}</div>
        <div className="flex items-center gap-2">
          {charCount !== undefined && maxLen !== undefined && (
            <span className={cn("text-xs tabular-nums", over ? "text-rose-600 font-semibold" : "text-zinc-400")}>
              {charCount} / {maxLen}
            </span>
          )}
          <button
            onClick={onCopy}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>
      <div
        className={cn(
          "rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 px-3 py-2.5 text-sm leading-relaxed",
          multiline ? "whitespace-pre-wrap" : "truncate",
        )}
      >
        {value}
      </div>
    </div>
  );
}
