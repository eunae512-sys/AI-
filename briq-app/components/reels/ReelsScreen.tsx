"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Play, Heart, MessageCircle, Bookmark, Share2, Sparkles, RefreshCw, Music, Type, Pencil, X, Film, Download, Loader2, UserCircle2 } from "lucide-react";
import { compileReelsVideo, isCompileSupported, parseTrendStyle, describeTrendStyle } from "@/lib/reels/compile-video";
import { buildVideoQueryDetailed } from "@/lib/cardnews/video-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";
import { getBrandDetail } from "@/lib/dummy/brand-detail";
import { NextStepCard } from "@/components/layout/RoadmapStrip";
import { buildUserHookPool } from "@/lib/reels/hook-pool";
import { addToQueue as enqueuePublish } from "@/lib/queue/publish-queue";
import { AiModelGenerator } from "@/components/ai-gen/AiModelGenerator";
import { AiMusicGenerator } from "@/components/ai-gen/AiMusicGenerator";
import type { Industry, SceneRole } from "@/lib/ai-gen/model-scenes";
import { getRecommendedScenes, getScenesForIndustry } from "@/lib/ai-gen/model-scenes";
import type { MusicMood } from "@/lib/ai-gen/music-presets";
import { synthesizeDemoMusic } from "@/lib/ai-gen/music-demo";
import { HOOK_BANK, fillSlots, isClean } from "@/lib/viral/voice-bank";
import { pickFreshHookSeeded } from "@/lib/viral/recent-hooks";
import { cn } from "@/lib/utils";
import {
  INK,
  INK_SOFT,
  INK_MUTE,
  RULE,
  RULE_SOFT,
  PAPER,
  PAPER_HOVER,
  SAGE,
  HL,
  SERIF_LATIN,
  SERIF_HANGUL,
} from "@/lib/landing/tokens";

// 오류/경고 상태 전용 — 따뜻한 테라코타 (Conventions)
const TERRA = "#A1473D";

// ── 매거진 결 공통 부속 (랜딩 tokens 와 한 결) ───────────────────────────
/** 영문 eyebrow — small caps italic 라틴 (한글 이탤릭 금지) */
function Eyebrow({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className="text-[10px] tracking-[0.2em] uppercase italic"
      style={{ color: accent ? SAGE : INK_MUTE, fontFamily: SERIF_LATIN }}
    >
      {children}
    </div>
  );
}

/** 섹션 라벨 — 카드 머리. 아이콘 + 한글 라벨(정자, 좁은 자간) */
function SectionLabel({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] tracking-[0.02em] flex items-center gap-1.5"
      style={{ color: INK_MUTE, fontFamily: SERIF_HANGUL }}
    >
      {Icon ? <Icon className="h-3 w-3" strokeWidth={1.75} /> : null}
      {children}
    </div>
  );
}

// 헤어라인 사각 카드 — SaaS Card 대체. 큰 여백.
const cardStyle: React.CSSProperties = { border: `0.5px solid ${RULE}`, background: "#FFFFFF" };

const TEMPLATES = [
  { id: "morning", name: "새벽 시간순 다큐", desc: "한정식 · 카페 · 베이커리", saveDelta: "+312%", grad: "from-amber-200 via-rose-300 to-amber-400" },
  { id: "asmr", name: "ASMR 디테일 컷", desc: "디저트 · 미용 · 시술", saveDelta: "+248%", grad: "from-stone-700 to-stone-900" },
  { id: "info", name: "5분 정보형 카드", desc: "의료 · 학원 · 안내형", saveDelta: "+189%", grad: "from-sky-100 via-slate-200 to-blue-300" },
  { id: "stay", name: "공간 무드 V-log", desc: "숙소 · 펜션 · 한옥", saveDelta: "+167%", grad: "from-amber-100 via-stone-200 to-amber-300" },
];

// 업종별 기본 템플릿 매핑
const INDUSTRY_DEFAULT_TPL: Record<string, string> = {
  restaurant: "morning",
  cafe: "morning",
  dessert: "asmr",
  beauty: "asmr",
  stay: "stay",
  local: "info",
};

const BGM: { name: string; mood: string; synthMood: MusicMood; bpm: number }[] = [
  { name: "Lo-Fi Calm Morning", mood: "차분 · 새벽", synthMood: "lofi-chill", bpm: 75 },
  { name: "Acoustic Sunshine", mood: "밝음 · 오전", synthMood: "warm-acoustic", bpm: 95 },
  { name: "Soft Piano Heart", mood: "감성 · 저녁", synthMood: "ballad-emo", bpm: 70 },
  { name: "Indie Vlog", mood: "여행 · 일상", synthMood: "indie-bright", bpm: 110 },
];

type Status = "idle" | "uploading" | "analyzing" | "generating" | "done";

// "11:30" 같은 HH:MM 문자열을 받아 다음 발생 시점을 Date 로 — 오늘 이후면 그 시간, 지났으면 내일 그 시간
function nextSlot(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target;
}

export function ReelsScreen() {
  const { brand, userBrand } = useBrand();
  const toast = useToast();
  const detail = getBrandDetail(brand.id);
  const isUserBrand = !!userBrand && brand.id === userBrand.id;
  // 후크 풀 — 사용자 브랜드면 (입력값 + 업종 풀 12개) 결합
  //         더미 브랜드면 brand-detail 의 topHooks
  // useMemo 로 unstable identity 피함 (HOOKS 가 props/effect dep 으로 자주 들어감)
  const HOOKS = React.useMemo(() => {
    if (isUserBrand && userBrand) {
      return buildUserHookPool(
        brand.industry,
        userBrand.hook,
        userBrand.tagline,
        userBrand.signatureMenu,
      );
    }
    return detail?.topHooks ?? ["새벽 4시, 시장이 깨어납니다"];
  }, [isUserBrand, userBrand, brand.industry, detail?.topHooks]);
  const defaultTpl = INDUSTRY_DEFAULT_TPL[brand.industry] ?? "morning";

  const [status, setStatus] = React.useState<Status>("done");
  const [activeTpl, setActiveTpl] = React.useState(defaultTpl);
  const [activeHook, setActiveHook] = React.useState(0);
  const [activeBgm, setActiveBgm] = React.useState(0);

  // ─── 첫 3초 viral 훅 추천 — HOOK_BANK[reels][industry] 에서 3개 (변형 시 다음 3개) ───
  const [viralSeed, setViralSeed] = React.useState(0);
  // 마운트 가드 — pickFreshHookSeeded 가 localStorage(getRecentHooks/recordHook)에 의존해
  // SSR(빈 값) ↔ client(저장값) 결과가 달라 hydration mismatch 가 났음. 마운트 전엔 빈 배열.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  const viralHooks = React.useMemo(() => {
    if (!mounted) return []; // SSR ↔ 첫 client 렌더 동일 보장 (localStorage 미접근)
    const parts = (brand.city ?? "").split(/\s+/).filter(Boolean);
    const district = parts[parts.length - 1] ?? brand.city;
    const slots = {
      brand: brand.name,
      city: brand.city,
      district,
      menu: (isUserBrand && userBrand?.signatureMenu?.[0]) || "오늘의 메뉴",
      industryShort: "",
    };
    const ind = (brand.industry as Industry) || "restaurant";
    const pool = (HOOK_BANK.reels[ind] ?? HOOK_BANK.reels.restaurant)
      .map((tpl) => fillSlots(tpl, slots))
      .filter(isClean);
    const picks: string[] = [];
    const seen = new Set<string>();
    let s = viralSeed;
    while (picks.length < 3 && seen.size < pool.length) {
      const h = pickFreshHookSeeded(`${brand.id}::viral3sec::${s}`, pool, s + brand.id.length);
      if (!seen.has(h)) {
        picks.push(h);
        seen.add(h);
      }
      s += 7;
    }
    return picks;
  }, [mounted, brand.id, brand.industry, brand.city, brand.name, isUserBrand, userBrand?.signatureMenu, viralSeed]);
  const rerollViralHooks = () => setViralSeed((s) => s + 1);

  const DEFAULT_PHOTOS = [
    "from-amber-200 to-rose-300",
    "from-violet-300 to-pink-400",
    "from-amber-300 to-stone-700",
    "from-slate-300 to-stone-500",
    "from-amber-100 to-amber-300",
    "from-rose-200 to-amber-200",
  ];
  type Photo =
    | { kind: "gradient"; grad: string }
    | { kind: "upload"; url: string; name: string; caption: string };
  const [photos, setPhotos] = React.useState<Photo[]>(
    DEFAULT_PHOTOS.map((g) => ({ kind: "gradient", grad: g })),
  );
  React.useEffect(() => {
    // 사용자 브랜드면 온보딩에서 올린 사진을 자동 시드 (캡션은 후크 순환)
    if (isUserBrand && userBrand && userBrand.photos.length > 0) {
      const seeded: Photo[] = userBrand.photos.slice(0, 12).map((p, i) => ({
        kind: "upload",
        url: p.url,
        name: p.name,
        caption: HOOKS[i % HOOKS.length] ?? userBrand.hook.line1,
      }));
      setPhotos(seeded);
      return;
    }
    setPhotos(DEFAULT_PHOTOS.map((g) => ({ kind: "gradient", grad: g })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand.id, isUserBrand, userBrand]);

  const photoInputRef = React.useRef<HTMLInputElement>(null);

  const variation = () => {
    // 한 칸 이동이 아니라 풀 안에서 큰 도약 (체감 변화 ↑)
    const next = HOOKS.length > 0
      ? (activeHook + Math.max(1, Math.floor(HOOKS.length / 3))) % HOOKS.length
      : 0;
    setActiveHook(next);
    setActiveBgm((b) => (b + 1) % 4);
    // 업로드 사진의 캡션도 새 후크 기준으로 다시 시드 (실제 자막이 바뀌어야 의미 있음)
    setPhotos((prev) => {
      let uploadCount = 0;
      return prev.map((p) => {
        if (p.kind !== "upload") return p;
        const caption = HOOKS[(next + uploadCount) % HOOKS.length] ?? p.caption;
        uploadCount += 1;
        return { ...p, caption };
      });
    });
    // 컴파일 결과 무효화 (자막이 바뀌었으니 다시 합성 필요)
    if (compiled?.url) {
      URL.revokeObjectURL(compiled.url);
      setCompiled(null);
    }
    toast.success(`후크 변형됨 — "${HOOKS[next]?.slice(0, 22) ?? ""}..."`);
  };
  const publish = () => {
    const firstUpload = photos.find((p) => p.kind === "upload");
    const item = enqueuePublish({
      brandId: brand.id,
      brandName: brand.name,
      type: "reels",
      typeLabel: "릴스 30초",
      title: HOOKS[activeHook] ?? brand.campaign,
      caption: HOOKS[activeHook],
      thumbnail: firstUpload?.kind === "upload" ? firstUpload.url : undefined,
      channels: ["instagram"],
      status: "scheduled",
      // 즉시 발행 가정 — 11:30 다음 슬롯
      scheduledFor: nextSlot("11:30").toISOString(),
    });
    toast.success(`${brand.name} · 릴스 예약 등록 — /schedule 에서 확인`);
    return item;
  };
  const addToQueue = () => {
    const firstUpload = photos.find((p) => p.kind === "upload");
    enqueuePublish({
      brandId: brand.id,
      brandName: brand.name,
      type: "reels",
      typeLabel: "릴스 30초",
      title: HOOKS[activeHook] ?? brand.campaign,
      caption: HOOKS[activeHook],
      thumbnail: firstUpload?.kind === "upload" ? firstUpload.url : undefined,
      channels: ["instagram"],
      status: "draft",
    });
    toast.success(`${brand.name} 예약 큐에 저장됨 — /schedule 에서 발행 시간 지정`);
  };
  const uploadMore = () => photoInputRef.current?.click();
  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // AI 출연자 패널 토글 + 추가 핸들러
  const [aiPanelOpen, setAiPanelOpen] = React.useState(false);

  // AI 음악 패널 + 적용된 BGM 상태
  const [aiMusicOpen, setAiMusicOpen] = React.useState(false);
  type CustomBgm = {
    audioUrl: string;
    durationSec: number;
    mood: MusicMood;
    moodLabel: string;
    lyrics: string;
    isDemo: boolean;
    costKrw: number;
  };
  const [customBgm, setCustomBgm] = React.useState<CustomBgm | null>(null);
  // 프리셋 BGM 적용 — 무드별 데모 음악을 합성해 customBgm 으로(영상에 실제 임베드)
  const [bgmLoadingIdx, setBgmLoadingIdx] = React.useState<number | null>(null);
  const applyPresetBgm = async (i: number) => {
    setActiveBgm(i);
    const preset = BGM[i];
    setBgmLoadingIdx(i);
    try {
      const durationSec = Math.max(8, (photos.filter((p) => p.kind === "upload").length || 6) * 1.7);
      const { blob, durationSec: actual } = await synthesizeDemoMusic({
        mood: preset.synthMood,
        durationSec,
        bpm: preset.bpm,
      });
      if (customBgm?.audioUrl.startsWith("blob:")) URL.revokeObjectURL(customBgm.audioUrl);
      const url = URL.createObjectURL(blob);
      setCustomBgm({
        audioUrl: url,
        durationSec: actual,
        mood: preset.synthMood,
        moodLabel: preset.name,
        lyrics: "", // 프리셋(가사 없음) — 가사 음악과 구분
        isDemo: true,
        costKrw: 0,
      });
      if (compiled?.url) {
        URL.revokeObjectURL(compiled.url);
        setCompiled(null);
      }
      toast.success(`${preset.name} BGM 적용됨 — "영상으로 변환" 시 영상에 들어갑니다`);
    } catch (e) {
      toast.warn("BGM 생성 실패: " + (e as Error).message);
    } finally {
      setBgmLoadingIdx(null);
    }
  };
  const addAiPhoto = (url: string, sceneTitle: string) => {
    const existingUploadCount = photos.filter((p) => p.kind === "upload").length;
    const caption = HOOKS[existingUploadCount % Math.max(1, HOOKS.length)] ?? brand.campaign;
    const photo: Photo = {
      kind: "upload",
      url,
      name: `AI-${sceneTitle}.png`,
      caption,
    };
    setPhotos((prev) => [photo, ...prev].slice(0, 18));
    // 컴파일된 결과 무효화
    if (compiled?.url) {
      URL.revokeObjectURL(compiled.url);
      setCompiled(null);
    }
    toast.success(`AI 출연자 추가 — "${sceneTitle}" 자동으로 컷에 배치`);
  };

  // 업로드 시 자막 자동 시드 — 브랜드 후크 순환
  const seedCaption = React.useCallback(
    (idx: number) => HOOKS[idx % HOOKS.length] ?? brand.campaign,
    [HOOKS, brand.campaign],
  );

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (e.target) e.target.value = "";
    if (!files.length) return;
    const existingUploadCount = photos.filter((p) => p.kind === "upload").length;
    const readers = await Promise.all(
      files.map(
        (f, k) =>
          new Promise<Photo>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () =>
              resolve({
                kind: "upload",
                url: String(r.result),
                name: f.name,
                caption: seedCaption(existingUploadCount + k),
              });
            r.onerror = () => reject(new Error("읽기 실패"));
            r.readAsDataURL(f);
          }),
      ),
    );
    setPhotos((prev) => [...readers, ...prev].slice(0, 18));
    toast.success(`${readers.length}장 업로드 완료 · 컷별 자막 자동 시드 · 자막 클릭해서 편집`);
    generate();
  };

  const updateCaption = (uploadIdx: number, text: string) => {
    setPhotos((prev) => {
      let i = -1;
      return prev.map((p) => {
        if (p.kind !== "upload") return p;
        i += 1;
        return i === uploadIdx ? { ...p, caption: text } : p;
      });
    });
  };

  // 브랜드 전환 시 자동으로 해당 업종 템플릿으로 점프
  React.useEffect(() => {
    setActiveTpl(INDUSTRY_DEFAULT_TPL[brand.industry] ?? "morning");
    setActiveHook(0);
  }, [brand.id, brand.industry]);

  // 트렌드 스타일 적용 — 내 사진에 트렌드의 포맷·후크(자막)를 입힘
  // videoUrl/posterUrl 은 "참고 영상" 으로만 사용 (폰 미리보기엔 내 사진 유지)
  type AppliedTrend = {
    videoUrl?: string;         // 참고용 (Calendar 추천처럼 영상 없는 경우도 있음)
    posterUrl?: string;        // 참고용 썸네일 이미지
    title: string;             // "케이크 단면" 등
    format: string;            // "ASMR · 5컷"
    hooks: string[];           // 자막 후크 — 내 사진의 caption 으로 시드됨
    photographer?: string;
    pexelsUrl?: string;
    accentGradient?: string;   // 영상 없을 때 썸네일 그라디언트 (Tailwind safe class)
    source?: "trends" | "calendar" | "weekly"; // 어디서 온 추천인지
    appliedAt: number;
    // 자동 추천 — 음악·출연자
    suggestedMusicMood?: MusicMood;
    suggestedMusicMoodLabel?: string;
    suggestedSceneRole?: SceneRole;
    suggestedSceneRoleLabel?: string;
  };
  const [appliedTrend, setAppliedTrend] = React.useState<AppliedTrend | null>(null);

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("briq:applied-trend");
      if (raw) {
        const data = JSON.parse(raw) as AppliedTrend;
        setAppliedTrend(data);
        // 내 사진 upload caption 을 트렌드 hooks 로 시드 (cycle)
        if (data.hooks?.length > 0) {
          setPhotos((prev) => {
            let uploadCount = 0;
            return prev.map((p) => {
              if (p.kind !== "upload") return p;
              const caption = data.hooks[uploadCount % data.hooks.length];
              uploadCount += 1;
              return { ...p, caption };
            });
          });
        }
        sessionStorage.removeItem("briq:applied-trend");
        toast.success(`"${data.title}" 스타일 적용됨 · 내 사진에 자막 입혀짐`);
      }
    } catch {
      // 무시
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAppliedTrend = () => {
    setAppliedTrend(null);
    // 자막을 기본 후크로 복원 (트렌드 hooks 가 입혀진 상태였으니)
    setPhotos((prev) => {
      let uploadCount = 0;
      return prev.map((p) => {
        if (p.kind !== "upload") return p;
        const caption = seedCaption(uploadCount);
        uploadCount += 1;
        return { ...p, caption };
      });
    });
    toast.info("트렌드 스타일 제거 · 기본 자막으로 복원");
  };

  // (참고 릴스 포맷 그리드 제거에 따라 weeklyVideos fetch/applyWeekly 데드코드 삭제)
  // 적용된 스타일의 추천 BGM 무드로 AI 음악 패널 자동 열기
  const startAiMusicForSuggested = () => {
    if (!appliedTrend?.suggestedMusicMood) return;
    setAiMusicOpen(true);
    // 패널이 열린 직후 mood 시드는 AiMusicGenerator 내부에서 처리됨
    // (initialMood prop 으로 받을 수 있게 컴포넌트도 다음 단계에서 확장)
    toast.info(`"${appliedTrend.suggestedMusicMoodLabel}" 무드 추천 — 가사 적고 생성하세요`);
  };

  // 적용된 스타일의 추천 씬으로 AI 출연자 자동 생성 (사진 없을 때 빠른 진입)
  const startAiSceneForSuggested = async () => {
    if (!appliedTrend?.suggestedSceneRole) return;
    const role = appliedTrend.suggestedSceneRole;
    // 업종 + 역할로 매칭되는 씬 찾기
    const scenes = getScenesForIndustry(brand.industry as Industry);
    const scene =
      scenes.find((s) => s.role === role) ??
      getRecommendedScenes(brand.industry as Industry)[0];
    if (!scene) {
      setAiPanelOpen(true);
      return;
    }
    setAiPanelOpen(true);
    // 패널 열고 추천만 — 사용자가 생성 클릭 (자동 fire-and-forget 은 비용 발생이라 보류)
    toast.info(
      `"${appliedTrend.suggestedSceneRoleLabel}" 씬 추천 — 위 패널에서 "AI 출연자 만들기"`,
    );
  };

  // === 사진 → 영상 컴파일 (Canvas + MediaRecorder) ===
  type CompiledVideo = { url: string; mimeType: string; durationMs: number; size: number };
  const [compiled, setCompiled] = React.useState<CompiledVideo | null>(null);
  // 영상 만들기 모드 — "photo"(사진 합성·무료) / "ai"(Veo·프리미엄). 두 카드를 하나로 합침.
  const [videoMode, setVideoMode] = React.useState<"photo" | "ai">("photo");
  const [compiling, setCompiling] = React.useState(false);
  const [compileProgress, setCompileProgress] = React.useState(0);
  // SSR 안전 — 마운트 전엔 true 가정 (경고 배너 미렌더)
  const [compileSupported, setCompileSupported] = React.useState(true);
  React.useEffect(() => {
    setCompileSupported(isCompileSupported());
  }, []);

  // 사진 변경되면 기존 컴파일 결과 폐기 (URL revoke)
  React.useEffect(() => {
    return () => {
      if (compiled?.url) URL.revokeObjectURL(compiled.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compiled?.url]);

  const compileVideo = async () => {
    if (compiling) return;
    if (!compileSupported) {
      toast.warn("이 브라우저는 영상 합성을 지원하지 않습니다 (Chrome / Firefox 권장)");
      return;
    }
    setCompiling(true);
    setCompileProgress(0);

    // 이전 컴파일 결과 cleanup
    if (compiled?.url) {
      URL.revokeObjectURL(compiled.url);
      setCompiled(null);
    }

    try {
      // photos state 에서 upload 만 추출 (위에서 이미 useMemo 됨 — uploadedPhotos)
      const inputPhotos = uploadedPhotos.length
        ? uploadedPhotos.map((p) => ({ url: p.url, caption: p.caption }))
        : null;

      if (!inputPhotos || inputPhotos.length === 0) {
        toast.warn("업로드된 사진이 없습니다 — 먼저 사진을 올려주세요");
        setCompiling(false);
        return;
      }

      // 트렌드 스타일 적용 — 적용된 트렌드의 format 으로 컷 속도·줌·페이드 결정
      const trendStyle = parseTrendStyle(appliedTrend?.format);
      const estCutMs = trendStyle?.cutDurationMs ?? 1200;
      const estSec = (inputPhotos.length * estCutMs / 1000).toFixed(1);
      toast.info(
        appliedTrend
          ? `${inputPhotos.length}장 → "${appliedTrend.title}" 스타일로 합성 중 (약 ${estSec}초)...`
          : `${inputPhotos.length}장 → 영상 합성 중 (약 ${estSec}초)...`,
      );

      // 사용자 브랜드 팔레트 → 최하단 tonal strip + 매거진 색감
      const palette = userBrand && brand.id === userBrand.id
        ? userBrand.palette.slice(0, 6).map((c) => c.hex)
        : [brand.brandColors.secondary, brand.brandColors.primary];

      const result = await compileReelsVideo({
        photos: inputPhotos,
        width: 720,
        height: 1280,
        fps: 30,
        brand: {
          name: brand.name,
          letter: brand.letter,
          gradient: brand.gradient,
          palette,
        },
        style: trendStyle ?? undefined,
        audioUrl: customBgm?.audioUrl,
        audioVolume: 0.7,
        onProgress: (p) => setCompileProgress(p),
      });

      setCompiled({
        url: result.url,
        mimeType: result.mimeType,
        durationMs: result.durationMs,
        size: result.blob.size,
      });
      const sizeMb = (result.blob.size / 1024 / 1024).toFixed(1);
      const duration = (result.durationMs / 1000).toFixed(1);
      toast.success(`영상 합성 완료 · ${duration}초 · ${sizeMb} MB · 프리뷰 반영됨`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.warn(`영상 합성 실패: ${msg}`);
    } finally {
      setCompiling(false);
    }
  };

  const downloadCompiled = () => {
    if (!compiled) return;
    const ext = compiled.mimeType.startsWith("video/mp4") ? "mp4" : "webm";
    const a = document.createElement("a");
    a.href = compiled.url;
    a.download = `${brand.id}-reels-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`${a.download} 다운로드 시작`);
  };

  const clearCompiled = () => {
    if (compiled?.url) URL.revokeObjectURL(compiled.url);
    setCompiled(null);
    toast.info("합성 영상 제거됨 — 사진 슬라이드 모드로 돌아갑니다");
  };

  // === AI 영상 생성 (fal.ai Veo — 프리미엄 메터링) ===
  const [aiVideoStatus, setAiVideoStatus] = React.useState<"idle" | "working" | "done" | "error">("idle");
  const [aiVideoUrl, setAiVideoUrl] = React.useState<string | null>(null);
  const [aiVideoNotice, setAiVideoNotice] = React.useState<string | null>(null);
  const aiVideoAbortRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      aiVideoAbortRef.current = true;
    };
  }, []);

  const generateAiVideo = async () => {
    if (aiVideoStatus === "working") return;
    aiVideoAbortRef.current = false;
    setAiVideoStatus("working");
    setAiVideoUrl(null);
    setAiVideoNotice("AI 영상 생성 중… (최대 2-3분 소요)");
    try {
      // 주제·후크 기반 영문 키워드 + 시네마틱 디렉티브로 프롬프트 구성
      const sceneKw = buildVideoQueryDetailed({
        industry: brand.industry,
        topic: HOOKS[activeHook] ?? brand.campaign,
        campaignHeadline: brand.campaign,
        signatureMenu: isUserBrand ? userBrand?.signatureMenu : undefined,
        mood: brand.mood, // 가입 시 정한 무드 → 영상 톤 반영
      });
      const prompt = `Cinematic vertical 9:16 short-form reel b-roll. ${sceneKw}. Smooth slow camera motion, shallow depth of field, lighting and color grade matching the brand's visual mood above. No on-screen text, no captions, no logos.`;
      // 업로드 사진이 원격(http) 이면 image-to-video 시드로 — 브랜드 일관성
      const firstHttp = uploadedPhotos.find((p) => /^https?:/.test(p.url));

      const r = await fetch("/api/generate-reel-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, posterImageUrl: firstHttp?.url, industry: brand.industry }),
      });
      const data = await r.json();

      if (r.status === 402 || r.status === 403) {
        setAiVideoStatus("error");
        setAiVideoNotice(
          r.status === 403
            ? "이번 달 AI 영상 한도를 모두 사용했어요. 상위 플랜에서 더 생성할 수 있어요."
            : "AI 릴스 영상은 Pro 플랜부터 사용할 수 있어요.",
        );
        return;
      }
      if (r.status === 503) {
        setAiVideoStatus("error");
        setAiVideoNotice("AI 영상 생성이 아직 설정되지 않았어요 (fal.ai 키/크레딧 확인).");
        return;
      }
      if (!data.ok || !data.requestId) {
        setAiVideoStatus("error");
        setAiVideoNotice(data.error ?? "AI 영상 생성을 시작하지 못했어요.");
        return;
      }

      const requestId = data.requestId as string;
      for (let i = 0; i < 36 && !aiVideoAbortRef.current; i++) {
        await new Promise((res) => setTimeout(res, 5000));
        if (aiVideoAbortRef.current) return;
        const pr = await fetch(
          `/api/generate-reel-video?requestId=${encodeURIComponent(requestId)}`,
          { cache: "no-store" },
        );
        const pd = await pr.json();
        if (pd.status === "completed" && pd.videoUrl) {
          setAiVideoUrl(pd.videoUrl);
          setAiVideoStatus("done");
          setAiVideoNotice(
            pd.demo
              ? "테스트 데모 영상 — 실제 Veo는 Gemini 빌링 연결 시 생성됩니다"
              : "AI 영상 완성 ✓",
          );
          toast.success(pd.demo ? "데모 영상 적용 (테스트 모드)" : "AI 릴스 영상 생성 완료");
          return;
        }
        if (pd.status === "failed" || (pd.ok === false && pd.status !== "processing")) {
          setAiVideoStatus("error");
          setAiVideoNotice(pd.error ?? "AI 영상 생성에 실패했어요.");
          return;
        }
      }
      if (!aiVideoAbortRef.current) {
        setAiVideoStatus("error");
        setAiVideoNotice("생성이 예상보다 오래 걸려요. 잠시 후 다시 시도해 주세요.");
      }
    } catch {
      setAiVideoStatus("error");
      setAiVideoNotice("AI 영상 생성 중 오류가 발생했어요.");
    }
  };

  const downloadAiVideo = async () => {
    if (!aiVideoUrl) return;
    try {
      const res = await fetch(aiVideoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${brand.id}-ai-reel-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("AI 영상 다운로드 시작");
    } catch {
      window.open(aiVideoUrl, "_blank");
    }
  };

  const generate = () => {
    if (status !== "done") return; // 중복 클릭 방어
    // 자막을 새 후크로 재시드 — 같은 사진이라도 새 카피로 다시 생성되는 느낌
    setActiveHook((h) => (h + Math.max(1, Math.floor(HOOKS.length / 4))) % HOOKS.length);
    setPhotos((prev) => {
      let uploadCount = 0;
      return prev.map((p) => {
        if (p.kind !== "upload") return p;
        const idx = (uploadCount + activeHook + 1) % HOOKS.length;
        uploadCount += 1;
        return { ...p, caption: HOOKS[idx] ?? p.caption };
      });
    });
    if (compiled?.url) {
      URL.revokeObjectURL(compiled.url);
      setCompiled(null);
    }
    setStatus("uploading");
    setTimeout(() => setStatus("analyzing"), 800);
    setTimeout(() => setStatus("generating"), 2400);
    setTimeout(() => {
      setStatus("done");
      toast.success("새 자막으로 재생성 완료 — '영상 합성' 으로 .mp4 만들기");
    }, 4500);
  };

  // 업로드 사진만 추출
  const uploadedPhotos = React.useMemo(
    () =>
      photos.filter(
        (p): p is { kind: "upload"; url: string; name: string; caption: string } =>
          p.kind === "upload",
      ),
    [photos],
  );
  const cutCount = uploadedPhotos.length > 0 ? uploadedPhotos.length : 8;

  // 프리뷰 컷 — 수동 탐색(좌우 화살표·썸네일). 1.2초 자동 회전은 제거:
  // 편집 중 컷이 멋대로 넘어가 자막 수정이 끊기고, 화면이 산만하던 원인이었음.
  const [cutIdx, setCutIdx] = React.useState(0);
  React.useEffect(() => {
    // 업로드 수가 줄어들면 인덱스도 안전 범위로
    setCutIdx((i) => (uploadedPhotos.length > 0 ? i % uploadedPhotos.length : 0));
  }, [uploadedPhotos.length]);

  const currentCut = uploadedPhotos[cutIdx];
  const currentCaption = currentCut?.caption ?? HOOKS[activeHook] ?? HOOKS[0];
  const stepCut = (dir: 1 | -1) => {
    if (uploadedPhotos.length === 0) return;
    setCutIdx((i) => (i + dir + uploadedPhotos.length) % uploadedPhotos.length);
  };
  const [editingCaption, setEditingCaption] = React.useState(false);
  // 컷 전환 시 편집 모드 종료
  React.useEffect(() => {
    setEditingCaption(false);
  }, [cutIdx]);

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-12" style={{ background: PAPER }}>
      {/* Hero — 매거진 매스트헤드 결 */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10 sm:mb-12 pb-8" style={{ borderBottom: `0.5px solid ${RULE}` }}>
        <div className="min-w-0">
          <Eyebrow>AI Reels · {brand.name} · Tone v{brand.toneVersion}</Eyebrow>
          <h1
            className="mt-4 text-[26px] sm:text-[34px] md:text-[42px] leading-[1.1] tracking-[-0.02em]"
            style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 500, wordBreak: "keep-all" }}
          >
            사진 5~10장이면<br className="hidden sm:block" /> 30초 릴스가 자동 완성
          </h1>
          <p
            className="mt-4 text-[14px] sm:text-[15px] leading-[1.7] max-w-2xl"
            style={{ fontFamily: SERIF_HANGUL, color: INK_SOFT, wordBreak: "keep-all" }}
          >
            {brand.industryLabel} 업종 템플릿 · 컷 분할 · 자막 · BGM · 9:16
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={variation}
            disabled={status !== "done" || compiling}
            className="inline-flex items-center justify-center gap-2 h-[42px] px-5 text-[13px] tracking-[0.01em] transition-colors"
            style={
              status !== "done" || compiling
                ? { border: `0.5px solid ${RULE}`, color: INK_MUTE, fontFamily: SERIF_HANGUL }
                : { border: `0.5px solid ${RULE}`, color: INK, fontFamily: SERIF_HANGUL }
            }
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />자막 새로 추천
          </button>
          <button
            onClick={generate}
            disabled={status !== "done" || compiling}
            className="inline-flex items-center justify-center gap-2 h-[42px] px-6 text-[13px] tracking-[0.01em] font-medium transition-colors"
            style={
              status !== "done" || compiling
                ? { background: "rgba(20,19,15,0.10)", color: INK_MUTE, fontFamily: SERIF_HANGUL }
                : { background: INK, color: PAPER, fontFamily: SERIF_HANGUL }
            }
          >
            {status !== "done" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
            )}
            {status !== "done" ? "생성 중…" : "다시 생성"}
          </button>
        </div>
      </div>

      {appliedTrend && (() => {
        const styleSummary = describeTrendStyle(parseTrendStyle(appliedTrend.format));
        return (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl border border-violet-200 dark:border-violet-900/40 bg-violet-50/60 dark:bg-violet-500/10 p-3 sm:p-3.5"
          >
            <div className="flex items-start gap-3">
              {/* 참고 썸네일 */}
              {appliedTrend.pexelsUrl || appliedTrend.videoUrl ? (
                <a
                  href={appliedTrend.pexelsUrl || appliedTrend.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative h-12 w-12 rounded-md overflow-hidden bg-zinc-900 shrink-0 group"
                  title="참고 영상 보기 (새 탭)"
                >
                  {appliedTrend.posterUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={appliedTrend.posterUrl} alt="" className="h-full w-full object-cover opacity-90 group-hover:opacity-100" />
                  )}
                  <div className="absolute inset-0 grid place-items-center pointer-events-none">
                    <div className="h-5 w-5 rounded-full bg-black/55 grid place-items-center">
                      <Play className="h-2.5 w-2.5 text-white ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </a>
              ) : (
                <div
                  className={`h-12 w-12 rounded-md shrink-0 bg-gradient-to-br ${appliedTrend.accentGradient ?? "from-violet-400 to-rose-500"}`}
                  aria-hidden
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-violet-700/80 dark:text-violet-300/70 font-semibold">
                    트렌드 스타일 적용
                  </span>
                  {appliedTrend.source === "calendar" && (
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-200/60 dark:bg-violet-500/20 text-violet-800 dark:text-violet-200 font-semibold">
                      캘린더
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-sm font-semibold text-violet-900 dark:text-violet-100 truncate">
                  {appliedTrend.title}
                  <span className="ml-1.5 text-[11px] font-normal text-violet-700/80 dark:text-violet-300/70">
                    · {appliedTrend.format}
                  </span>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={clearAppliedTrend} className="shrink-0">
                <X className="h-3.5 w-3.5" />제거
              </Button>
            </div>

            {/* ★ 구체 파라미터 칩 — 사용자가 "뭐가 어떻게 바뀌는지" 시각적으로 확인 */}
            <div className="mt-3 pt-3 border-t border-violet-200/60 dark:border-violet-900/40">
              <div className="text-[10px] uppercase tracking-widest text-violet-700/70 dark:text-violet-300/60 font-semibold mb-1.5">
                이 스타일이 영상에 입히는 변화
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <StyleChip>{styleSummary.cutLabel}</StyleChip>
                <StyleChip>{styleSummary.zoomLabel}</StyleChip>
                <StyleChip>{styleSummary.fadeLabel}</StyleChip>
                <StyleChip>{styleSummary.captionLabel}</StyleChip>
                <StyleChip>{styleSummary.motionLabel}</StyleChip>
                {appliedTrend.hooks?.length ? (
                  <StyleChip>자막 {appliedTrend.hooks.length}개 시드</StyleChip>
                ) : null}
              </div>
              <div className="mt-2 text-[10.5px] text-violet-700/70 dark:text-violet-300/60">
                폰 미리보기엔 <b>자막만</b> 바뀌어 보이고, 컷 속도·줌·전환은 아래 <b>"영상으로 변환"</b>을 눌러야 실제 .mp4에 입혀집니다.
              </div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("reels-compile");
                  if (!el) return;
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  // 어디로 갔는지 보이도록 잠깐 강조
                  el.classList.add("ring-2", "ring-offset-2");
                  window.setTimeout(() => el.classList.remove("ring-2", "ring-offset-2"), 1600);
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-2 transition-colors"
              >
                이 스타일로 영상 만들기 <span aria-hidden>→</span>
              </button>

              {/* ★ AI 자동 매칭 추천 — 스타일에 어울리는 BGM 무드 + 출연자 씬 */}
              {(appliedTrend.suggestedMusicMoodLabel || appliedTrend.suggestedSceneRoleLabel) && (
                <div className="mt-3 pt-3 border-t border-violet-200/60 dark:border-violet-900/40">
                  <div className="text-[10px] uppercase tracking-widest text-violet-700/70 dark:text-violet-300/60 font-semibold mb-1.5">
                    이 스타일에 어울리는 AI 자동 매칭
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {appliedTrend.suggestedMusicMoodLabel && (
                      <button
                        onClick={startAiMusicForSuggested}
                        className="text-left rounded-lg border border-violet-300/60 dark:border-violet-700/60 bg-white/60 dark:bg-zinc-950/40 hover:border-violet-500 dark:hover:border-violet-500 px-3 py-2 transition-colors group"
                      >
                        <div className="flex items-center gap-1.5">
                          <Music className="h-3 w-3 text-violet-500" />
                          <span className="text-[10px] uppercase tracking-wider text-violet-700/80 dark:text-violet-300/70 font-semibold">
                            추천 BGM
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs font-semibold text-violet-900 dark:text-violet-100">
                          {appliedTrend.suggestedMusicMoodLabel}
                        </div>
                        <div className="text-[10px] text-violet-700/70 dark:text-violet-300/60 mt-0.5 group-hover:text-violet-900 dark:group-hover:text-violet-100">
                          가사 적고 음악 만들기 →
                        </div>
                      </button>
                    )}
                    {appliedTrend.suggestedSceneRoleLabel && (
                      <button
                        onClick={startAiSceneForSuggested}
                        className="text-left rounded-lg border border-violet-300/60 dark:border-violet-700/60 bg-white/60 dark:bg-zinc-950/40 hover:border-violet-500 dark:hover:border-violet-500 px-3 py-2 transition-colors group"
                      >
                        <div className="flex items-center gap-1.5">
                          <UserCircle2 className="h-3 w-3 text-violet-500" />
                          <span className="text-[10px] uppercase tracking-wider text-violet-700/80 dark:text-violet-300/70 font-semibold">
                            추천 AI 출연자
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs font-semibold text-violet-900 dark:text-violet-100">
                          {appliedTrend.suggestedSceneRoleLabel}
                        </div>
                        <div className="text-[10px] text-violet-700/70 dark:text-violet-300/60 mt-0.5 group-hover:text-violet-900 dark:group-hover:text-violet-100">
                          {uploadedPhotos.length === 0 ? "사진 없이 바로 만들기 →" : "출연자 추가 →"}
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })()}

      {/* 참고 릴스 포맷 그리드 제거 — 핵심 흐름(업로드→자막→BGM→영상) 집중 */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left - controls (mobile: order-2 so preview is shown first) */}
        <div className="lg:col-span-3 space-y-3 order-2 lg:order-1">
          {/* ★ 첫 3초 viral 훅 추천 — voice-bank reels grammar 기반 */}
          <Card className="p-4 border-violet-200 dark:border-violet-900/40 bg-gradient-to-br from-violet-50/40 to-white dark:from-violet-500/[0.05] dark:to-zinc-950">
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="text-[11px] uppercase tracking-widest font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />첫 3초 — 손가락 멈추는 훅
              </div>
              <button
                type="button"
                onClick={rerollViralHooks}
                className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-0.5"
              >
                <RefreshCw className="h-3 w-3" /> 다른 거
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mb-2.5">
              인스타 릴스 첫 1초에 손가락이 멈춰야 합니다. 아래 중 마음에 드는 거 클릭 → 컷 1의 자막으로
            </p>
            <div className="space-y-1.5">
              {!mounted &&
                [0, 1, 2].map((i) => (
                  <div
                    key={`hook-skel-${i}`}
                    className="w-full h-[42px] rounded-md border border-violet-200/40 dark:border-violet-900/30 bg-violet-50/30 dark:bg-violet-500/5 animate-pulse"
                  />
                ))}
              {viralHooks.map((h, i) => (
                <button
                  key={`${viralSeed}-${i}`}
                  onClick={() => {
                    // 첫 컷 캡션으로 적용 + 기본 활성 후크로
                    setPhotos((prev) => {
                      let uploadIdx = 0;
                      return prev.map((p) => {
                        if (p.kind !== "upload") return p;
                        const next = uploadIdx === 0 ? { ...p, caption: h } : p;
                        uploadIdx += 1;
                        return next;
                      });
                    });
                    if (compiled?.url) {
                      URL.revokeObjectURL(compiled.url);
                      setCompiled(null);
                    }
                    toast.success(`첫 컷 자막: "${h.slice(0, 24)}${h.length > 24 ? "…" : ""}"`);
                  }}
                  className="w-full text-left text-[12.5px] px-3 py-2.5 rounded-md border border-violet-200/60 dark:border-violet-900/40 bg-white dark:bg-zinc-950 hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-500/10 transition-colors leading-snug"
                >
                  <span className="text-violet-500 mr-1.5 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  {h}
                </button>
              ))}
            </div>
            <div className="mt-2.5 text-[10px] text-zinc-500">
              실제 SNS에서 자주 보이는 패턴 기반 · 클리셰 X
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-2">
                <Music className="h-3 w-3" />BGM
              </div>
              <button
                onClick={() => setAiMusicOpen((v) => !v)}
                className={cn(
                  "text-[10px] inline-flex items-center gap-1 px-2 py-1 rounded-md border transition-colors",
                  aiMusicOpen
                    ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-violet-300",
                )}
              >
                <Sparkles className="h-3 w-3 text-violet-500" />
                {aiMusicOpen ? "닫기" : "내 가사로"}
              </button>
            </div>

            {/* 적용된 커스텀 BGM 표시 */}
            {customBgm && customBgm.lyrics !== "" && (
              <div className="mb-3 rounded-lg border border-violet-300 dark:border-violet-700 bg-violet-50/60 dark:bg-violet-500/10 p-2.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="h-3 w-3 text-violet-500 shrink-0" />
                    <div className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 truncate">
                      내 가사 BGM · {customBgm.moodLabel}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (customBgm.audioUrl.startsWith("blob:")) URL.revokeObjectURL(customBgm.audioUrl);
                      setCustomBgm(null);
                      toast.info("커스텀 BGM 제거");
                    }}
                    className="shrink-0 text-zinc-400 hover:text-rose-600"
                    aria-label="제거"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <audio src={customBgm.audioUrl} controls className="w-full h-7" />
                <div className="text-[10px] text-zinc-500 mt-1 truncate">
                  {customBgm.lyrics.split("\n")[0]} · {customBgm.durationSec}초
                  {customBgm.isDemo && " · 데모"}
                </div>
              </div>
            )}

            {/* AI 음악 패널 (확장) */}
            <AnimatePresence>
              {aiMusicOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
                    <AiMusicGenerator
                      compact
                      industry={brand.industry}
                      brandName={brand.name}
                      initialMood={appliedTrend?.suggestedMusicMood}
                      onGenerated={(res) => {
                        // 이전 blob URL 해제
                        if (customBgm?.audioUrl.startsWith("blob:")) URL.revokeObjectURL(customBgm.audioUrl);
                        setCustomBgm(res);
                        setAiMusicOpen(false);
                        // 컴파일 결과 무효화 (BGM 이 바뀌었으니 다시 합성 필요)
                        if (compiled?.url) {
                          URL.revokeObjectURL(compiled.url);
                          setCompiled(null);
                        }
                      }}
                      onClose={() => setAiMusicOpen(false)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-[10px] text-zinc-500 mb-1.5">추천 트랙 ({BGM.length})</div>
            <div className="space-y-1.5">
              {BGM.map((b, i) => {
                const lyricMusic = !!customBgm && customBgm.lyrics !== ""; // AI 가사 음악 사용 중
                const presetActive = !lyricMusic && activeBgm === i && !!customBgm;
                return (
                <button
                  key={b.name}
                  onClick={() => applyPresetBgm(i)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md border text-left transition ${
                    presetActive
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-500/10"
                      : activeBgm === i && !lyricMusic
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
                      : "border-zinc-100 dark:border-zinc-800"
                  } ${lyricMusic ? "opacity-60" : ""}`}
                  disabled={lyricMusic || bgmLoadingIdx !== null}
                  title={lyricMusic ? "내 가사 BGM 사용 중 — 위에서 제거하면 추천 트랙 선택 가능" : "클릭하면 음악을 만들어 영상에 넣습니다"}
                >
                  {bgmLoadingIdx === i ? (
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{b.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {bgmLoadingIdx === i ? "음악 생성 중…" : b.mood}
                    </div>
                  </div>
                  {presetActive && (
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">✓ 영상에 적용</span>
                  )}
                </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Center - Phone preview */}
        <div className="lg:col-span-5 flex flex-col items-center order-1 lg:order-2">
          <div className="relative w-[min(300px,calc(100vw-32px))] lg:w-[280px]">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative rounded-[36px] border-[10px] border-zinc-900 dark:border-zinc-700 bg-zinc-900 overflow-hidden shadow-2xl"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={
                    compiled
                      ? `compiled-${compiled.durationMs}-${compiled.size}`
                      : currentCut
                      ? `cut-${cutIdx}-${currentCut.url.slice(-12)}`
                      : activeTpl
                  }
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5 }}
                  className={`aspect-[9/16] relative overflow-hidden ${
                    compiled || currentCut
                      ? ""
                      : `bg-gradient-to-br ${TEMPLATES.find((t) => t.id === activeTpl)?.grad}`
                  }`}
                >
                  {compiled ? (
                    <video
                      src={compiled.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : currentCut ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentCut.url}
                      alt={currentCut.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
                  {/* readability gradient — 자막 가독성 (compiled 는 자체 오버레이 있음) */}
                  {!compiled && currentCut && (
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/55 pointer-events-none" />
                  )}

                  {/* IG 헤더 — 컴파일된 영상엔 브랜드명이 baked-in 이므로 숨김 */}
                  {!compiled && (
                    <div className="absolute top-4 left-4 right-4 flex items-center gap-2 text-white z-10">
                      <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${brand.gradient} grid place-items-center text-[10px] font-bold`}>
                        {brand.letter}
                      </div>
                      <div className="text-[11px] font-medium drop-shadow">{brand.name}</div>
                      <button className="ml-auto text-[11px] bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">팔로우</button>
                    </div>
                  )}

                  {/* Cut counter */}
                  {uploadedPhotos.length > 0 && (
                    <div className="absolute top-14 left-4 right-4 flex items-center gap-1.5 z-10">
                      {uploadedPhotos.map((_, i) => (
                        <div
                          key={i}
                          className={`h-0.5 flex-1 rounded-full ${i === cutIdx ? "bg-white" : "bg-white/30"}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* React 자막 오버레이 — 컴파일된 영상이 재생 중이면 숨김 (영상에 자막 baked-in) */}
                  {!compiled && (
                  <motion.div
                    key={`caption-${cutIdx}-${brand.id}-${activeHook}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-32 left-4 right-4 text-white z-10"
                  >
                    {editingCaption && currentCut ? (
                      <textarea
                        autoFocus
                        rows={3}
                        value={currentCut.caption}
                        onChange={(e) => updateCaption(cutIdx, e.target.value)}
                        onBlur={() => setEditingCaption(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingCaption(false);
                        }}
                        className="w-full text-center leading-snug bg-black/55 backdrop-blur text-white p-2 rounded-2xl outline-none ring-1 ring-white/60 resize-none"
                        style={{ fontWeight: 800, fontSize: "26px", letterSpacing: "-0.02em" }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => currentCut && setEditingCaption(true)}
                        className="block w-full text-center group/cap"
                        title={currentCut ? "자막 편집 (Esc 종료)" : ""}
                      >
                        {/* 컴파일 .mp4 와 동일한 프로 디자인 — 박스 없음 · 브랜드 컬러 액센트 바 · 아웃라인 */}
                        <span
                          className="mx-auto mb-2.5 block h-[3px] w-11 rounded-full"
                          style={{ background: brand.brandColors?.primary ?? "rgba(255,255,255,0.92)" }}
                        />
                        <span
                          className="inline-block max-w-full px-1 leading-[1.16] group-hover/cap:opacity-90 transition-opacity"
                          style={{
                            fontWeight: 800,
                            fontSize: "27px",
                            letterSpacing: "-0.025em",
                            textShadow: "0 2px 5px rgba(0,0,0,0.55), 0 0 1px rgba(0,0,0,0.9)",
                            WebkitTextStroke: "0.6px rgba(0,0,0,0.55)",
                          }}
                        >
                          {currentCaption}
                          {currentCut && (
                            <Pencil className="inline-block ml-1.5 h-3 w-3 opacity-50 align-baseline" />
                          )}
                        </span>
                      </button>
                    )}
                    <div className="mt-2 text-center text-xs opacity-90 drop-shadow">{detail?.hero.tagline ?? brand.campaign}</div>
                  </motion.div>
                  )}

                  {/* 인스타 액션 아이콘 (미리보기용 — 가짜 수치 제거, 아이콘만) */}
                  <div className="absolute right-3 bottom-32 flex flex-col gap-3.5 text-white/90 z-10 pointer-events-none">
                    <Heart className="h-5 w-5 mx-auto" />
                    <MessageCircle className="h-5 w-5 mx-auto" />
                    <Share2 className="h-5 w-5 mx-auto" />
                    <Bookmark className="h-5 w-5 mx-auto" />
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white text-[10px] flex items-center gap-1.5 z-10">
                    <span className="h-3 w-3 rounded bg-white/20" />♪ {customBgm ? `${customBgm.lyrics ? "내 가사 · " : ""}${customBgm.moodLabel}` : BGM[activeBgm].name}
                    {uploadedPhotos.length > 0 && (
                      <span className="ml-auto opacity-80">
                        컷 {cutIdx + 1}/{uploadedPhotos.length}
                      </span>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
            <div className="absolute -inset-8 -z-10 rounded-full bg-gradient-to-br from-rose-300/20 via-violet-400/20 to-indigo-400/20 blur-3xl" />
          </div>

          {/* Cut 썸네일 스트립 — 모든 컷을 한눈에, 탭하면 그 컷으로 이동 + 자막 바로 편집 */}
          {uploadedPhotos.length > 0 && !compiled && (
            <div className="mt-4 w-full max-w-[420px]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                  컷 {cutIdx + 1} / {uploadedPhotos.length}
                  <span className="ml-1.5 text-[10px] font-normal text-zinc-400">썸네일을 눌러 자막 편집</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => stepCut(-1)} aria-label="이전 컷" className="h-6 w-6 grid place-items-center rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500">◀</button>
                  <button onClick={() => stepCut(1)} aria-label="다음 컷" className="h-6 w-6 grid place-items-center rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500">▶</button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {uploadedPhotos.map((p, i) => {
                  const on = i === cutIdx;
                  return (
                    <button
                      key={`${p.url.slice(-12)}-${i}`}
                      type="button"
                      onClick={() => { setCutIdx(i); setEditingCaption(true); }}
                      title={p.caption || `컷 ${i + 1}`}
                      className={`group relative shrink-0 w-12 aspect-[9/16] rounded-lg overflow-hidden transition-all ${
                        on ? "ring-2 ring-violet-500" : "ring-1 ring-zinc-200 dark:ring-zinc-800 hover:ring-zinc-400"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={`컷 ${i + 1}`} className="absolute inset-0 h-full w-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-black/80 to-transparent" />
                      <span className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] leading-tight text-white/95 px-0.5 line-clamp-2 drop-shadow">
                        {(p.caption || "").split("\n")[0] || "자막 없음"}
                      </span>
                      <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-white bg-black/55 rounded px-1 tabular-nums">{i + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status bar */}
          <div className="mt-6 w-full max-w-[420px]">
            <AnimatePresence mode="wait">
              {status === "done" ? (
                <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-500/5 p-4 text-center">
                  <div className="text-[11px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-semibold">
                    {uploadedPhotos.length > 0 ? `업로드 ${uploadedPhotos.length}장 적용됨` : "사진을 올려 시작하세요"}
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    {cutCount}컷 · 자막 · 전환 자동 적용
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-500">
                    {brand.name} 톤 v{brand.toneVersion} 적용됨
                  </div>
                </motion.div>
              ) : (
                <motion.div key={status} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-violet-200 dark:border-violet-900/50 bg-gradient-to-r from-violet-50/30 to-pink-50/30 dark:from-violet-500/5 dark:to-pink-500/5 p-4 text-center">
                  <div className="text-[11px] uppercase tracking-widest text-violet-700 dark:text-violet-400 font-semibold">
                    {status === "uploading" && "업로드 중..."}
                    {status === "analyzing" && "분위기 · 컷 분석 중..."}
                    {status === "generating" && "자막 · BGM · 전환 자동 생성 중..."}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right - Output assets */}
        <div className="lg:col-span-4 space-y-3 order-3">
          {/* 사진 → 영상 변환 카드 */}
          <Card id="reels-compile" className="p-4 scroll-mt-4 ring-violet-400 transition-shadow">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <div>
                <div className="text-[11px] uppercase tracking-[0.15em] text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1.5">
                  <Film className="h-3 w-3" />영상 만들기
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {videoMode === "photo"
                    ? uploadedPhotos.length > 0
                      ? `내 사진 ${uploadedPhotos.length}장 합성 · 무료 · 720×1280`
                      : "사진 업로드 후 사용 가능 · 무료"
                    : "사진 없이 AI가 영상 생성 · 프리미엄 (Pro+)"}
                </p>
              </div>
              {compiled && videoMode === "photo" && (
                <button
                  onClick={clearCompiled}
                  className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  초기화
                </button>
              )}
            </div>

            {/* 모드 토글 — 사진 합성 / AI 영상 하나로 */}
            <div className="inline-flex w-full rounded-lg border border-zinc-200 dark:border-zinc-800 p-1 bg-zinc-50 dark:bg-zinc-900/40 mb-3">
              {([
                ["photo", "내 사진으로", Film] as const,
                ["ai", "AI 영상", Sparkles] as const,
              ]).map(([m, label, Icon]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setVideoMode(m)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    videoMode === m
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {m === "ai" && <span className="text-[9px] text-amber-500 font-semibold">PRO</span>}
                </button>
              ))}
            </div>

            {videoMode === "photo" ? (
              !compiled ? (
              <>
                <Button
                  className="w-full"
                  size="sm"
                  onClick={compileVideo}
                  disabled={compiling || uploadedPhotos.length === 0 || !compileSupported}
                >
                  {compiling ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      합성 중 {Math.round(compileProgress * 100)}%
                    </>
                  ) : (
                    <>
                      <Film className="h-3.5 w-3.5" />
                      영상으로 변환
                    </>
                  )}
                </Button>
                {compiling && (
                  <div className="mt-2 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 to-pink-500"
                      animate={{ width: `${compileProgress * 100}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}
                {!compileSupported && (
                  <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
                    이 브라우저는 합성을 지원하지 않습니다 (Chrome / Firefox 권장)
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-md bg-violet-50/60 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-900/40">
                  <span className="h-7 w-7 rounded bg-violet-600 text-white grid place-items-center text-[10px] font-bold shrink-0">
                    ✓
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-violet-900 dark:text-violet-100">
                      합성 완료 · 프리뷰 재생 중
                    </div>
                    <div className="text-[10px] text-violet-700/80 dark:text-violet-300/70 tabular-nums">
                      {(compiled.durationMs / 1000).toFixed(1)}s · {(compiled.size / 1024 / 1024).toFixed(1)} MB ·{" "}
                      {compiled.mimeType.startsWith("video/mp4") ? "MP4" : "WebM"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={compileVideo} disabled={compiling} className="flex-1">
                    <RefreshCw className="h-3.5 w-3.5" />다시 합성
                  </Button>
                  <Button size="sm" onClick={downloadCompiled} className="flex-1">
                    <Download className="h-3.5 w-3.5" />.{compiled.mimeType.startsWith("video/mp4") ? "mp4" : "webm"} 저장
                  </Button>
                </div>

                {/* 발행 1-2-3 가이드 — 사용자가 다음에 뭐 할지 명확히 */}
                <div className="mt-2 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-2">
                    이렇게 발행하세요
                  </div>
                  <ol className="space-y-1.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                    <li className="flex gap-2">
                      <span className="h-4 w-4 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 grid place-items-center text-[9px] font-bold tabular-nums shrink-0">1</span>
                      <span><b>.{compiled.mimeType.startsWith("video/mp4") ? "mp4" : "webm"} 다운로드</b> — 사장님 폰/PC에 저장</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="h-4 w-4 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 grid place-items-center text-[9px] font-bold tabular-nums shrink-0">2</span>
                      <span>인스타·틱톡에 업로드 후 아래 <b>캡션·해시태그 복사</b> 붙여넣기</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="h-4 w-4 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 grid place-items-center text-[9px] font-bold tabular-nums shrink-0">3</span>
                      <span>혹은 <b>예약 발행 큐</b>에 올려 두면 추천 시간에 자동 알림 (데모)</span>
                    </li>
                  </ol>
                </div>
              </div>
              )
            ) : (
              <div className="pt-1">
              {!aiVideoUrl ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={generateAiVideo}
                  disabled={aiVideoStatus === "working"}
                >
                  {aiVideoStatus === "working" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      생성 중…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      AI 영상 생성
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <video
                    src={aiVideoUrl}
                    controls
                    playsInline
                    className="w-full rounded-md bg-black aspect-[9/16] max-h-[360px] object-contain"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateAiVideo}
                      disabled={aiVideoStatus === "working"}
                      className="flex-1"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      다시 생성
                    </Button>
                    <Button size="sm" onClick={downloadAiVideo} className="flex-1">
                      <Download className="h-3.5 w-3.5" />
                      .mp4 저장
                    </Button>
                  </div>
                </div>
              )}
              {aiVideoNotice && (
                <div
                  className={`mt-2 text-[10.5px] leading-snug ${
                    aiVideoStatus === "error"
                      ? "text-rose-500"
                      : aiVideoStatus === "done"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {aiVideoStatus === "working" && (
                    <Loader2 className="inline h-3 w-3 mr-1 animate-spin align-[-1px]" />
                  )}
                  {aiVideoNotice}
                </div>
              )}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">업로드 사진</div>
              <span className="text-[10px] text-zinc-500">{photos.filter((p) => p.kind === "upload").length} 업로드 · {photos.length} 총</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {photos.map((p, i) => {
                if (p.kind === "upload") {
                  const uploadOnlyIdx = uploadedPhotos.findIndex((u) => u.url === p.url);
                  const isActive = uploadOnlyIdx === cutIdx;
                  return (
                    <div
                      key={`u-${i}`}
                      className={`relative aspect-square rounded-md overflow-hidden group cursor-pointer ring-2 transition-all ${
                        isActive ? "ring-violet-500" : "ring-transparent hover:ring-zinc-300 dark:hover:ring-zinc-700"
                      }`}
                      onClick={() => {
                        if (uploadOnlyIdx >= 0) setCutIdx(uploadOnlyIdx);
                      }}
                      title={`${p.name} (클릭해서 프리뷰 컷 ${uploadOnlyIdx + 1} 로 이동)`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
                      {isActive && (
                        <span className="absolute bottom-1 left-1 text-[8px] font-bold uppercase tracking-widest text-white bg-violet-600/90 backdrop-blur px-1 py-0.5 rounded">
                          NOW
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(i);
                        }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/60 hover:bg-rose-600 rounded-full p-0.5"
                        title="삭제"
                      >
                        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                }
                return <div key={`g-${i}`} className={`aspect-square rounded-md bg-gradient-to-br ${p.grad}`} />;
              })}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={uploadMore}>
                <Upload className="h-3 w-3" />사진 업로드
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiPanelOpen((v) => !v)}
                className={cn(
                  aiPanelOpen
                    ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                    : "",
                )}
              >
                <UserCircle2 className="h-3 w-3 text-violet-500" />
                {aiPanelOpen ? "닫기" : "AI 출연자"}
              </Button>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={onPhotoChange}
            />

            <AnimatePresence>
              {aiPanelOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <AiModelGenerator
                      compact
                      industry={brand.industry as Industry}
                      signatureMenu={isUserBrand ? userBrand?.signatureMenu : undefined}
                      topic={brand.campaign}
                      onGenerated={({ url, scene }) => {
                        addAiPhoto(url, scene.title);
                      }}
                      onClose={() => setAiPanelOpen(false)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {uploadedPhotos.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Type className="h-3 w-3" />컷별 자막
                </div>
                <button
                  onClick={() => {
                    setPhotos((prev) => {
                      let i = -1;
                      return prev.map((p) => {
                        if (p.kind !== "upload") return p;
                        i += 1;
                        return { ...p, caption: seedCaption(i) };
                      });
                    });
                    toast.info("자막 후크로 리셋");
                  }}
                  className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1"
                >
                  <RefreshCw className="h-2.5 w-2.5" />리셋
                </button>
              </div>
              <ul className="space-y-2">
                {uploadedPhotos.map((u, i) => (
                  <li
                    key={u.url.slice(-32)}
                    className={`flex items-start gap-2 p-2 rounded-md border transition-colors ${
                      i === cutIdx
                        ? "border-violet-300 dark:border-violet-700 bg-violet-50/40 dark:bg-violet-500/10"
                        : "border-zinc-100 dark:border-zinc-800"
                    }`}
                  >
                    <button
                      onClick={() => setCutIdx(i)}
                      className="shrink-0 h-10 w-10 rounded overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-800"
                      title={`컷 ${i + 1} 프리뷰`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u.url} alt={u.name} className="h-full w-full object-cover" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-zinc-500 mb-0.5">컷 {i + 1}</div>
                      <textarea
                        value={u.caption}
                        onChange={(e) => updateCaption(i, e.target.value)}
                        rows={2}
                        placeholder="이 컷에 들어갈 자막"
                        className="w-full text-xs leading-snug px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none focus:border-zinc-400 resize-none"
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-zinc-500">
                컷 클릭 → 프리뷰 동기화 · 자막은 핸드폰 위에서도 클릭해서 인라인 편집 가능
              </p>
            </Card>
          )}

          <Card className="p-4">
            <Button className="w-full" size="lg" onClick={publish}>
              인스타에 발행 →
            </Button>
            <Button variant="outline" className="w-full mt-2" size="sm" onClick={addToQueue}>
              예약 큐에 추가
            </Button>
          </Card>
        </div>
      </div>

      {/* 다음 단계 — 발행 예약 */}
      <div className="px-4 sm:px-6 pb-6">
        <NextStepCard />
      </div>
    </div>
  );
}

// 트렌드 스타일 파라미터 칩 — 배너용
function StyleChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center text-[10.5px] px-2 py-0.5 rounded-md bg-white/70 dark:bg-zinc-900/70 border border-violet-200/60 dark:border-violet-900/40 text-violet-900 dark:text-violet-100 font-medium">
      {children}
    </span>
  );
}
