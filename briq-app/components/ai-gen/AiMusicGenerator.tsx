"use client";

// 가사 → AI 음악 생성
// 가사 입력 + 무드 선택 + 길이 → /api/generate-music → 오디오 미리듣기 → BGM 적용

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Music,
  Sparkles,
  Loader2,
  Play,
  Pause,
  X,
  Info,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  MUSIC_PRESETS,
  buildMusicPrompt,
  getRecommendedPresets,
  type MusicMood,
  type MusicLength,
} from "@/lib/ai-gen/music-presets";
import { synthesizeDemoMusic } from "@/lib/ai-gen/music-demo";

type Props = {
  industry: string;
  brandName?: string;
  /** 외부에서 무드 시드 — 인기 릴스 적용 시 추천 무드로 자동 선택 */
  initialMood?: MusicMood;
  /** 외부에서 가사 시드 — 트렌드 제목/후크 기반 prefill */
  initialLyrics?: string;
  onGenerated: (result: {
    audioUrl: string;
    durationSec: number;
    mood: MusicMood;
    moodLabel: string;
    lyrics: string;
    isDemo: boolean;
    costKrw: number;
  }) => void;
  onClose?: () => void;
  compact?: boolean;
};

const LYRICS_EXAMPLES: Record<string, string> = {
  cafe: "햇살이 좋은 오늘 아침\n따뜻한 라떼 한 잔과 함께\n오늘도 우리 카페에서",
  restaurant: "정성으로 차린 한 상\n오랜만에 모인 우리 가족\n따뜻한 밥상이 기다려요",
  dessert: "달콤한 한 입에 미소\n오늘의 디저트가 기다려요\n작은 행복 챙겨가세요",
  beauty: "거울 앞 환한 미소\n나만의 무드 찾는 시간\n오늘은 더 빛나는 나",
  stay: "잠시 멈춰 쉬어가는 마음\n조용한 마루에 앉아서\n하늘과 차 한 잔",
  local: "오늘의 룩, 나만의 무드\n작은 매장의 큰 이야기\n동네에서 만나요",
};

export function AiMusicGenerator({
  industry,
  brandName,
  initialMood,
  initialLyrics,
  onGenerated,
  onClose,
  compact = false,
}: Props) {
  const toast = useToast();
  const recommended = React.useMemo(() => getRecommendedPresets(industry), [industry]);

  const [lyrics, setLyrics] = React.useState(initialLyrics ?? "");
  const [mood, setMood] = React.useState<MusicMood>(
    initialMood ?? recommended[0]?.id ?? "warm-acoustic",
  );

  // 외부에서 prop 이 변하면 동기 (다른 인기 릴스 적용 등)
  React.useEffect(() => {
    if (initialMood) setMood(initialMood);
  }, [initialMood]);
  React.useEffect(() => {
    if (initialLyrics !== undefined) setLyrics(initialLyrics);
  }, [initialLyrics]);
  const [length, setLength] = React.useState<MusicLength>(15);
  const [generating, setGenerating] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [isDemo, setIsDemo] = React.useState(false);
  const [costKrw, setCostKrw] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const placeholder = LYRICS_EXAMPLES[industry] ?? LYRICS_EXAMPLES.cafe;
  const preset = MUSIC_PRESETS.find((p) => p.id === mood)!;

  // 미리듣기 끝나면 재생 버튼 상태 리셋
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnd = () => setPlaying(false);
    a.addEventListener("ended", onEnd);
    return () => a.removeEventListener("ended", onEnd);
  }, [audioUrl]);

  const generate = async () => {
    const text = lyrics.trim() || placeholder;
    if (!text) {
      toast.warn("가사를 입력해주세요");
      return;
    }
    setGenerating(true);
    setAudioUrl(null);
    setPlaying(false);
    try {
      const { instrumentalPrompt, lyricsText, estimatedDurationSec, bpm } = buildMusicPrompt({
        lyrics: text,
        mood,
        brandName,
        industry,
        instrumental: false, // 가사 보컬 곡 — 보컬 허용(어쿠스틱 가드레일은 유지)
      });
      const durationSec = Math.max(length, estimatedDurationSec);

      const res = await fetch("/api/generate-music", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          instrumentalPrompt,
          lyrics: lyricsText,
          durationSec,
          mood,
          bpm,
        }),
      });
      const data = await res.json();
      if (!data?.ok) {
        toast.warn(data?.error || "음악 생성 실패");
        return;
      }

      if (data.demoMode) {
        // Web Audio 로 클라이언트 합성
        const { blob, durationSec: actual } = await synthesizeDemoMusic({
          mood,
          durationSec: data.meta?.durationSec ?? durationSec,
          bpm: data.meta?.bpm ?? bpm,
        });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setIsDemo(true);
        setCostKrw(0);
        toast.success(
          `데모 음악 생성 완료 (${actual}초) · 실제 AI 음악은 REPLICATE_API_TOKEN 설정 시`,
        );
      } else if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
        setIsDemo(false);
        setCostKrw(data.meta?.costKrw ?? 0);
        toast.success(`AI 음악 생성 완료 · 약 ${data.meta?.costKrw ?? 0}원`);
      } else {
        toast.warn("음악 응답이 비어있음");
      }
    } catch (e) {
      toast.warn((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a || !audioUrl) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(() => setPlaying(true)).catch((e) => {
        toast.warn(e.message);
      });
    }
  };

  const useThis = () => {
    if (!audioUrl) return;
    onGenerated({
      audioUrl,
      durationSec: length,
      mood,
      moodLabel: preset.label,
      lyrics: lyrics.trim() || placeholder,
      isDemo,
      costKrw,
    });
    toast.success("BGM 적용됨 — 영상 합성 시 자동 믹스");
  };

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
            <Music className="h-3.5 w-3.5" /> AI 음악 만들기
          </div>
          <h3 className={cn("mt-1 font-semibold", compact ? "text-base" : "text-lg")}>
            가사를 적으면 그 분위기에 맞춰 음악을 만들어드려요
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            가사 + 무드 → 영상에 깔 BGM 자동 생성 · 상업용 사용 가능 (AI 생성물)
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

      {/* Lyrics input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">가사 (선택 — 비워두면 예시 사용)</div>
          <button
            onClick={() => setLyrics(placeholder)}
            className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-0.5"
          >
            <RefreshCw className="h-3 w-3" />
            예시 채우기
          </button>
        </div>
        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-violet-500 dark:focus:border-violet-500 resize-none"
        />
        <div className="text-[11px] text-zinc-500 mt-1">
          줄 단위로 적으면 분위기·길이 자동 추정 · 한국어 OK
        </div>
      </div>

      {/* Mood picker */}
      <div>
        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">무드 (추천 4종)</div>
        <div className="grid grid-cols-2 gap-2">
          {recommended.map((p) => {
            const active = mood === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setMood(p.id)}
                className={cn(
                  "rounded-xl border p-2.5 text-left transition-all",
                  active
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10 dark:border-violet-500/60"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400",
                )}
              >
                <div className="text-xl">{p.emoji}</div>
                <div className="mt-1 text-sm font-semibold leading-tight">{p.label}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{p.desc}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">{p.bpm} BPM</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Length */}
      <div>
        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">길이</div>
        <div className="flex gap-1.5">
          {([15, 30, 60] as MusicLength[]).map((l) => (
            <button
              key={l}
              onClick={() => setLength(l)}
              className={cn(
                "flex-1 px-3 py-2 rounded-md text-sm border transition-colors",
                length === l
                  ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300",
              )}
            >
              {l}초
            </button>
          ))}
        </div>
      </div>

      {/* Notice */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-500/5 px-3.5 py-2.5">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            AI 생성 음악 · <b>저작권 안전 · 상업적 사용 가능</b> · 영상에 합성 시 캡션 끝에 <b>#AI생성</b> 자동 추가
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={generate} disabled={generating} className="flex-1 h-11">
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              생성 중 (10–30초)
            </>
          ) : audioUrl ? (
            <>
              <RefreshCw className="h-4 w-4" />
              다시 만들기
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              음악 만들기
            </>
          )}
        </Button>
        {audioUrl && (
          <Button onClick={useThis} className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700">
            BGM에 적용
          </Button>
        )}
      </div>

      {/* Preview */}
      <AnimatePresence>
        {audioUrl && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="p-3.5">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className={cn(
                    "shrink-0 h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                    playing
                      ? "bg-violet-600 text-white"
                      : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-violet-600 hover:text-white",
                  )}
                  aria-label={playing ? "일시정지" : "재생"}
                >
                  {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    <Badge tone="violet">{preset.label}</Badge>
                    <Badge tone="sky">{length}초</Badge>
                    {isDemo && <Badge tone="amber">데모 합성</Badge>}
                    {!isDemo && costKrw > 0 && <Badge tone="emerald">약 {costKrw}원</Badge>}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {lyrics.trim() || placeholder}
                  </div>
                </div>
              </div>
              <audio ref={audioRef} src={audioUrl} preload="auto" className="hidden" />
              {/* 일반 audio 컨트롤도 노출 — 길이 슬라이더 등 */}
              <audio src={audioUrl} controls className="w-full mt-3" />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
