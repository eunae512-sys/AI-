"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Coffee, Cake, Home, UtensilsCrossed, Scissors, Sparkles, ChevronLeft, Check, Camera, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractPaletteFromPhotos, type ExtractedColor } from "@/lib/colors/extract-palette";
import { inferMoodFromPalette } from "@/lib/brand/mood-detect";
import { saveUserBrand } from "@/lib/brand/user-brand";
import { useBrand } from "@/components/brand/BrandProvider";
import { useRouter, useSearchParams } from "next/navigation";
import type { Industry as IndustryType, Mood as MoodIdType } from "@/types";
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

// 업종 id → 한국 도시 기본값 (사용자가 도시 미입력 시)
const INDUSTRY_DEFAULT_CITY: Record<string, string> = {
  restaurant: "강남구",
  cafe: "서촌",
  dessert: "성수동",
  stay: "종로구",
  beauty: "강남구",
  local: "한남동",
};

const INDUSTRY_LABEL: Record<string, string> = {
  restaurant: "한정식",
  cafe: "스페셜티 카페",
  dessert: "디저트샵",
  stay: "한옥 숙소",
  beauty: "미용·헤어",
  local: "컨템포러리 패션",
};

type Industry = { id: string; label: string; sub: string; Icon: React.ElementType };
type Mood = {
  id: string;
  label: string;
  sub: string;
  gradient: string;
  swatches: string[]; // 4-5 HEX 컬러 — 미니 무드보드
  ringClass: string; // 선택 시 ring 색
  tag: string; // 캡션 (영문, 매거진 톤)
};

const INDUSTRIES: Industry[] = [
  { id: "cafe", label: "카페", sub: "스페셜티 / 베이커리", Icon: Coffee },
  { id: "dessert", label: "디저트샵", sub: "케이크 / 마카롱 / 빙수", Icon: Cake },
  { id: "stay", label: "숙소", sub: "한옥스테이 / 펜션", Icon: Home },
  { id: "restaurant", label: "음식점", sub: "한식 / 양식 / 일식", Icon: UtensilsCrossed },
  { id: "beauty", label: "미용·뷰티", sub: "헤어 / 네일 / 피부", Icon: Scissors },
  { id: "local", label: "로컬 브랜드", sub: "소품 / 패션 / 라이프스타일", Icon: Sparkles },
];

// Pinterest Predicts 2026 — Editorial Muted Palette
// 단일 hue 안에서 light↔mid 만 변화 (light↔dark 대비 X — 그게 촌스러움의 원인)
// 다이내믹 레인지 좁힘 → 매거진 컬러칩 느낌
const MOODS: Mood[] = [
  {
    id: "warm",
    label: "따뜻한 · 정성",
    sub: "한식 · 베이커리 · 한옥",
    tag: "Almond Milk",
    // 오트밀 크림 — Pinterest "Cottage Country" 2026
    gradient: "from-[#EFE6D5] to-[#D6C3A7]",
    swatches: ["#EFE6D5", "#DFCDB1", "#B89B7B"],
    ringClass: "ring-[#B89B7B]",
  },
  {
    id: "modern",
    label: "미니멀 · 모던",
    sub: "스페셜티 카페 · 편집샵",
    tag: "Atelier",
    // 라이스 페이퍼 그레이 — Quiet Luxury 2026
    gradient: "from-[#ECEAE3] to-[#C7C3B9]",
    swatches: ["#ECEAE3", "#D7D3C9", "#9A958A"],
    ringClass: "ring-[#9A958A]",
  },
  {
    id: "moody",
    label: "감성 · 시네마틱",
    sub: "와인바 · 스튜디오",
    tag: "Mocha Mousse",
    // Pantone 2025 컬러 오브 더 이어 — 차분한 무드
    gradient: "from-[#9A8775] to-[#5A4838]",
    swatches: ["#C2A98E", "#9A8775", "#5A4838"],
    ringClass: "ring-[#9A8775]",
  },
  {
    id: "playful",
    label: "발랄한 · 친근",
    sub: "디저트 · 분식 · 카페",
    tag: "Peach Fuzz",
    // 살구빛 — 분홍 아닌 따뜻한 살굿빛 (Pinterest Predicts 2025-26)
    gradient: "from-[#F3DDD1] to-[#D6A78F]",
    swatches: ["#F3DDD1", "#E5BFAC", "#C99B85"],
    ringClass: "ring-[#C99B85]",
  },
  {
    id: "natural",
    label: "내추럴 · 친환경",
    sub: "비건 · 유기농 · 로컬",
    tag: "Verdigris",
    // 라이켄 그린 — 빈티지 그린 (Pinterest "Eccentric Garden" 2026)
    gradient: "from-[#D7D8C7] to-[#8E957A]",
    swatches: ["#D7D8C7", "#A8AE96", "#7C8268"],
    ringClass: "ring-[#7C8268]",
  },
  {
    id: "luxury",
    label: "럭셔리 · 프리미엄",
    sub: "파인다이닝 · 부티크",
    tag: "Cherry Reign",
    // Pantone 2026 예측 — 보르도 와인 (블랙 클리셰 X)
    gradient: "from-[#7A3B3F] to-[#3D1E22]",
    swatches: ["#C9B59E", "#7A3B3F", "#3D1E22"],
    ringClass: "ring-[#7A3B3F]",
  },
];

// 업종 × 무드 → 톤 설명 (실제 분석 결과 시뮬레이션)
const INDUSTRY_TONE: Record<string, string> = {
  restaurant: "한식의 정성과 재료의 시간을 단정한 존댓말로 짧게 끊어 보여줍니다",
  cafe: "한 잔의 리듬과 원두의 산미를 매거진 톤으로 차분하게 풀어냅니다",
  dessert: "달콤한 순간의 단면과 색을 친근한 반말로 가볍게 띄웁니다",
  stay: "공간의 빛과 시간의 결을 손님께 보내는 편지 형식으로 담습니다",
  beauty: "결과 컬러의 변화를 자신감 있는 존댓말로 압축해 보여줍니다",
  local: "원단과 실루엣을 절제된 영문 + 한국어 혼용 에디토리얼로 다룹니다",
};

const MOOD_TONE_MODIFIER: Record<string, string> = {
  warm: "따뜻한 정성 · 손맛 · 새벽 분위기를 강조",
  modern: "여백 · 미니멀 · 한 줄 카피 위주",
  moody: "시네마틱 · 깊이감 · 저녁 톤",
  playful: "발랄 · 친근 · 짧은 호흡 · 이모지 가볍게",
  natural: "유기적 · 손글씨 느낌 · 자연광 · 식물 디테일",
  luxury: "절제 · 영문 액센트 · 큰 여백 · 시그니처 한 컷",
};

// 업종별 첫 릴스 후크 카피 (Step 7 미리보기용)
const INDUSTRY_HOOK: Record<string, { line1: string; line2: string; hashtag: string }> = {
  restaurant: { line1: "오늘의 한 상,", line2: "정성으로 차립니다", hashtag: "#한정식 #제철" },
  cafe:       { line1: "한 잔의 시간,",  line2: "오늘 다시 내립니다", hashtag: "#스페셜티 #로스터리" },
  dessert:    { line1: "달콤한 한 입,",  line2: "이 계절의 색", hashtag: "#디저트 #신상" },
  stay:       { line1: "창호로 드는 빛,", line2: "오늘의 환영", hashtag: "#한옥 #스테이" },
  beauty:     { line1: "결을 살리는,",   line2: "오늘의 컬러", hashtag: "#헤어 #봄컬러" },
  local:      { line1: "한 벌의 무게,",  line2: "한 줄의 시그니처", hashtag: "#룩북 #에디토리얼" },
};

const STAGES = [
  { id: 0, title: "사진에서 컬러 추출", sub: "5장 · 평균 컬러 6개" },
  { id: 1, title: "분위기 · 구도 · 채도 분석", sub: "'따뜻한 자연광 + 단정한 미니멀'" },
  { id: 2, title: "인스타 캡션 23개에서 톤 학습", sub: "Claude Sonnet 4.6 · 5축 톤 슬라이더" },
  { id: 3, title: "금지어 / 자주 쓰는 표현 추출", sub: "" },
  { id: 4, title: "업종 가이드라인 · 지역 트렌드 매칭", sub: "" },
  { id: 5, title: "브랜드 키트 · 첫 콘텐츠 생성", sub: "" },
];

// 가격 페이지 ?plan=pro|studio|agency|free deep-link 인식
const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  studio: "Studio",
  agency: "Agency",
};

// ── 매거진 결 공통 부속 — 랜딩(tokens)과 한 결 ──────────────────────────
/** STEP 라벨 — 이탤릭 라틴 small caps (영문이라 진짜 이탤릭 OK) */
function StepMark({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className="text-[10.5px] tracking-[0.22em] uppercase italic"
      style={{ color: accent ? SAGE : INK_MUTE, fontFamily: SERIF_LATIN }}
    >
      {children}
    </div>
  );
}

/** 스텝 표제 — 세리프, 한글 중간 줄바꿈 방지 */
function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-3 text-[30px] sm:text-[40px] leading-[1.08] tracking-[-0.02em]"
      style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 500, wordBreak: "keep-all" }}
    >
      {children}
    </h1>
  );
}

/** 스텝 본문 lede */
function StepLede({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mt-3 text-[15px] sm:text-[16px] leading-[1.7]"
      style={{ fontFamily: SERIF_HANGUL, color: INK_SOFT, wordBreak: "keep-all" }}
    >
      {children}
    </p>
  );
}

// 공통 버튼 스타일
const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 h-[46px] px-7 text-[13.5px] tracking-[0.01em] font-medium transition-colors";
const BACK_BTN =
  "text-[12px] tracking-[0.04em] inline-flex items-center gap-1 transition-colors";

const INPUT_CLS =
  "mt-1.5 w-full h-11 px-3 text-[14px] transition-colors focus:outline-none";
const inputStyle: React.CSSProperties = {
  border: `0.5px solid ${RULE}`,
  background: "#FFFFFF",
  color: INK,
  fontFamily: SERIF_HANGUL,
};
const labelStyle: React.CSSProperties = { color: INK, fontFamily: SERIF_HANGUL };

export function Onboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addBrand } = useBrand();
  // /onboarding?plan=pro → selectedPlan = "pro"
  const planParam = searchParams?.get("plan") ?? null;
  const selectedPlan = (planParam && PLAN_LABEL[planParam]) ? planParam as "free" | "pro" | "studio" | "agency" : undefined;
  // /onboarding?add=1 → 기존 브랜드 무손상 + 신규 추가·활성화
  const addMode = searchParams?.get("add") === "1";
  const [step, setStep] = React.useState(1);
  const totalSteps = 7;
  const [industry, setIndustry] = React.useState<string>();
  const [mood, setMood] = React.useState<string>();
  const [analysisStep, setAnalysisStep] = React.useState(0);
  const [extractedPalette, setExtractedPalette] = React.useState<ExtractedColor[]>([]);
  const [extractError, setExtractError] = React.useState<string | null>(null);
  // 사진 팔레트로 자동 추천된 무드 — 사용자가 직접 바꾸기 전까지 적용됨
  const [moodAutoDetected, setMoodAutoDetected] = React.useState(false);

  // === Step 4: 사진 업로드 ===
  type UploadedPhoto = { url: string; name: string; size: number };
  const [photos, setPhotos] = React.useState<UploadedPhoto[]>([]);
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const MAX_PHOTOS = 20;
  const MIN_PHOTOS = 3;

  // === Step 4 추가: 사장님 가게 정보 ===
  const [shopName, setShopName] = React.useState("");
  const [tagline, setTagline] = React.useState("");
  const [signatureMenu, setSignatureMenu] = React.useState<[string, string, string]>(["", "", ""]);
  const [ownerName, setOwnerName] = React.useState("");
  const [ownerEmail, setOwnerEmail] = React.useState("");

  const readFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const remaining = MAX_PHOTOS - photos.length;
    const accepted = files.slice(0, remaining);
    const readers = await Promise.all(
      accepted.map(
        (f) =>
          new Promise<UploadedPhoto>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () =>
              resolve({ url: String(r.result), name: f.name, size: f.size });
            r.onerror = () => reject(new Error("읽기 실패"));
            r.readAsDataURL(f);
          }),
      ),
    );
    setPhotos((prev) => [...prev, ...readers].slice(0, MAX_PHOTOS));
  };

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await readFiles(e.target.files);
    if (e.target) e.target.value = "";
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files) await readFiles(e.dataTransfer.files);
  };

  const removePhoto = (idx: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const next = () => setStep((s) => Math.min(s + 1, totalSteps));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  // Step 5 analysis — 실제 사진에서 컬러 추출 + 단계 애니메이션
  React.useEffect(() => {
    if (step !== 5) return;
    setAnalysisStep(0);
    setExtractError(null);
    let cancelled = false;
    const timers: NodeJS.Timeout[] = [];

    // 단계 애니메이션 (시각 효과)
    STAGES.forEach((_, i) => {
      timers.push(setTimeout(() => {
        if (!cancelled) setAnalysisStep(i + 1);
      }, (i + 1) * 1100));
    });

    // 실제 컬러 추출 (병렬 진행 — 애니메이션 끝까지 보장)
    (async () => {
      try {
        if (photos.length === 0) throw new Error("사진이 없습니다");
        const colors = await extractPaletteFromPhotos(photos.map((p) => p.url));
        if (!cancelled) {
          setExtractedPalette(colors);
          // 사진 팔레트로 무드 자동 추천 — "사진의 컨셉"이 무드를 결정.
          // step 2 에서 고른 무드 위에 팔레트 분석 결과를 덮어쓰고, step 6 에서 변경 가능.
          const detected = inferMoodFromPalette(colors);
          setMood(detected);
          setMoodAutoDetected(true);
        }
      } catch (e) {
        if (!cancelled) setExtractError(e instanceof Error ? e.message : String(e));
      }
    })();

    // 애니메이션 완료 후 step 6 이동 (추출은 그때까지 보통 끝남)
    timers.push(setTimeout(() => {
      if (!cancelled) setStep(6);
    }, STAGES.length * 1100 + 600));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [step, photos]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: PAPER }}>
      {/* Header — 매거진 매스트헤드 결 */}
      <header
        className="backdrop-blur-md sticky top-0 z-10"
        style={{ background: "rgba(250, 247, 238, 0.8)", borderBottom: `0.5px solid ${RULE}` }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2">
            <span
              className="text-[18px] leading-none tracking-[-0.02em]"
              style={{ fontFamily: SERIF_LATIN, fontWeight: 500, color: INK }}
            >
              BRIQ
            </span>
            <span className="text-[9.5px] tracking-[0.22em] uppercase" style={{ color: INK_MUTE }}>
              Onboarding
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const idx = i + 1;
              const done = idx < step;
              const current = idx === step;
              return (
                <motion.span
                  key={i}
                  className={cn("h-[3px]", current ? "w-12" : "w-9")}
                  style={{ background: done || current ? INK : RULE }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              );
            })}
          </div>
          <div className="text-[11px] tabular-nums w-12 text-right" style={{ color: INK_MUTE }}>{step} / {totalSteps}</div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 md:py-20">
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 sm:mb-10 -mt-2 sm:-mt-6 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 pl-4 py-2"
            style={{ borderLeft: `2px solid ${INK}` }}
          >
            <span className="text-[10.5px] tracking-[0.22em] uppercase italic shrink-0" style={{ color: INK_MUTE, fontFamily: SERIF_LATIN }}>
              Selected plan
            </span>
            {/* 한글 문장은 이탤릭(가짜 기울임) 금지 — 정자로 */}
            <span className="text-[14px] sm:text-[15px]" style={{ fontFamily: SERIF_HANGUL, color: INK }}>
              {PLAN_LABEL[selectedPlan]} 플랜으로 시작합니다 — 14일 무료체험 (체험 종료 전 해지 가능).
            </span>
          </motion.div>
        )}
        <AnimatePresence mode="wait">
          {/* Step 1 - Industry */}
          {step === 1 && (
            <motion.section
              key="s1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <StepMark>Step 01</StepMark>
              <StepTitle>어떤 가게를 운영하세요?</StepTitle>
              <StepLede>업종을 선택하면 BRIQ가 맞춤 톤·템플릿을 자동 적용합니다.</StepLede>
              <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3">
                {INDUSTRIES.map((it) => {
                  const Icon = it.Icon;
                  const selected = industry === it.id;
                  return (
                    <button
                      key={it.id}
                      onClick={() => setIndustry(it.id)}
                      className="p-5 text-left transition-all"
                      style={{
                        border: `0.5px solid ${selected ? INK : RULE}`,
                        background: selected ? PAPER_HOVER : "transparent",
                      }}
                    >
                      <Icon className="h-7 w-7" strokeWidth={1.5} style={{ color: INK }} />
                      <div className="mt-3 text-[15px]" style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 600 }}>{it.label}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: INK_MUTE }}>{it.sub}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-10 flex items-center justify-end">
                <button
                  onClick={next}
                  disabled={!industry}
                  className={cn(PRIMARY_BTN, !industry && "cursor-not-allowed")}
                  style={industry ? { background: INK, color: PAPER } : { background: "rgba(20,19,15,0.10)", color: INK_MUTE }}
                >
                  다음 →
                </button>
              </div>
            </motion.section>
          )}

          {/* Step 2 - Mood */}
          {step === 2 && (
            <motion.section
              key="s2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <StepMark>Step 02</StepMark>
              <StepTitle>브랜드 분위기는<br />어떤 결인가요?</StepTitle>
              <StepLede>선택한 무드로 컬러·폰트·문체 톤이 자동 매칭됩니다.</StepLede>
              <div className="mt-8 sm:mt-10 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {MOODS.map((m) => {
                  const selected = mood === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMood(m.id)}
                      className={cn(
                        "group overflow-hidden text-left transition-all",
                        selected ? `ring-2 ${m.ringClass} -translate-y-0.5` : "hover:-translate-y-0.5",
                      )}
                      style={{ border: `0.5px solid ${selected ? INK : RULE}`, background: "#FFFFFF" }}
                    >
                      {/* Moodboard preview — editorial paint chip */}
                      <div className={cn("relative aspect-[4/3] bg-gradient-to-br overflow-hidden", m.gradient)}>
                        {/* very soft inner shadow — depth without grain */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            boxShadow: "inset 0 0 60px rgba(0,0,0,0.06)",
                          }}
                        />
                        {/* selected check — minimal, no shadow */}
                        {selected && (
                          <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-white/95 backdrop-blur grid place-items-center">
                            <Check className="h-3 w-3" strokeWidth={2.5} style={{ color: INK }} />
                          </div>
                        )}
                        {/* serif italic tag — magazine spread label (영문, 진짜 이탤릭 OK) */}
                        <span
                          className="absolute bottom-3 left-4 text-[12px] italic tracking-tight"
                          style={{
                            fontFamily: SERIF_LATIN,
                            color: "rgba(0,0,0,0.55)",
                            mixBlendMode: "multiply",
                          }}
                        >
                          {m.tag}
                        </span>
                      </div>
                      {/* hairline tonal strip — 3 accent only */}
                      <div className="flex h-1">
                        {m.swatches.map((sw) => (
                          <div key={sw} className="flex-1" style={{ background: sw }} />
                        ))}
                      </div>
                      <div className="p-4 sm:p-5">
                        <div className="text-[15px] sm:text-[14px] tracking-tight" style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 600 }}>{m.label}</div>
                        <div className="text-[12px] mt-1 leading-relaxed" style={{ color: INK_MUTE }}>{m.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-10 flex items-center justify-between">
                <button onClick={back} className={BACK_BTN} style={{ color: INK_MUTE }}>
                  <ChevronLeft className="h-3 w-3" />이전
                </button>
                <button
                  onClick={next}
                  disabled={!mood}
                  className={cn(PRIMARY_BTN, !mood && "cursor-not-allowed")}
                  style={mood ? { background: INK, color: PAPER } : { background: "rgba(20,19,15,0.10)", color: INK_MUTE }}
                >
                  다음 →
                </button>
              </div>
            </motion.section>
          )}

          {/* Step 3 - Instagram connect (현재 베타: 직접 업로드만) */}
          {step === 3 && (
            <motion.section key="s3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
              <StepMark>Step 03</StepMark>
              <StepTitle>인스타 자동 분배는 곧 열립니다</StepTitle>
              <StepLede>
                지금은 사장님이 카드뉴스·캡션을 한 번에 만든 뒤, 인스타에 직접 올리시는 방식이에요.
                Meta 비즈니스 API 연동은 베타 다음 단계에서 자동으로 사장님 계정에 연결됩니다.
              </StepLede>
              <div className="mt-10 space-y-3">
                <div className="p-5 flex items-center gap-4 text-left" style={{ border: `0.5px solid ${RULE}` }}>
                  <div className="h-11 w-11 grid place-items-center text-[12px] tracking-[0.08em]" style={{ border: `0.5px solid ${RULE}`, color: INK_MUTE, fontFamily: SERIF_LATIN }}>IG</div>
                  <div className="flex-1">
                    <div className="text-[14px]" style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 600 }}>Instagram 자동 분배 — 준비 중</div>
                    <div className="text-[12px] mt-0.5" style={{ color: INK_MUTE }}>Meta 비즈니스 API 심사 진행 중 · 베타 다음 단계</div>
                  </div>
                  <span className="text-[10px] tracking-[0.16em] uppercase italic" style={{ color: INK_MUTE, fontFamily: SERIF_LATIN }}>Soon</span>
                </div>
                <div className="p-5" style={{ border: `0.5px solid ${RULE}`, borderLeft: `2px solid ${SAGE}`, background: PAPER_HOVER }}>
                  <div className="text-[14px]" style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 600 }}>지금은 — 사진 직접 업로드</div>
                  <div className="text-[12.5px] mt-1 leading-relaxed" style={{ fontFamily: SERIF_HANGUL, color: INK_SOFT }}>
                    매장 사진 5~10장을 다음 단계에서 올려주시면, 카드뉴스·캡션·블로그·릴스가 자동으로 만들어집니다.
                    인스타에는 한 번의 복사·붙여넣기로 올리실 수 있어요.
                  </div>
                </div>
              </div>
              <div className="mt-10 flex items-center justify-between">
                <button onClick={back} className={BACK_BTN} style={{ color: INK_MUTE }}>
                  <ChevronLeft className="h-3 w-3" />이전
                </button>
                <button onClick={next} className={PRIMARY_BTN} style={{ background: INK, color: PAPER }}>
                  사진 올리러 가기 →
                </button>
              </div>
            </motion.section>
          )}

          {/* Step 4 - Photo upload */}
          {step === 4 && (
            <motion.section key="s4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
              <StepMark>Step 04</StepMark>
              <StepTitle>사진 5~10장만<br />업로드해 주세요</StepTitle>
              <StepLede>매장·메뉴·공간 사진. BRIQ가 컬러·구도·분위기를 분석합니다.</StepLede>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className="mt-8 w-full p-10 text-center transition cursor-pointer block"
                style={{
                  border: `1px dashed ${dragOver ? INK : RULE}`,
                  background: dragOver ? PAPER_HOVER : "transparent",
                }}
              >
                <Camera className="h-9 w-9 mx-auto" strokeWidth={1.25} style={{ color: INK_MUTE }} />
                <div className="mt-4 text-[15px]" style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 500 }}>이곳에 사진을 드롭하거나 클릭</div>
                <div className="mt-1 text-[12px]" style={{ color: INK_MUTE }}>JPG · PNG · HEIC · 최대 {MAX_PHOTOS}장</div>
              </button>

              {/* 모바일 보조 — 갤러리 / 카메라 두 갈래 (PC 에선 위 dropzone 충분) */}
              <div className="mt-3 flex gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-2 text-[13.5px]"
                  style={{ border: `0.5px solid ${RULE}`, color: INK, fontFamily: SERIF_HANGUL }}
                >
                  <Images className="h-4 w-4" strokeWidth={1.5} /> 사진 선택
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-2 text-[13.5px]"
                  style={{ border: `0.5px solid ${RULE}`, color: INK, fontFamily: SERIF_HANGUL }}
                >
                  <Camera className="h-4 w-4" strokeWidth={1.5} /> 직접 촬영
                </button>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                multiple
                accept="image/*"
                /* 갤러리 — 사장님 폰에 있는 사진 여러 장 선택 */
                className="hidden"
                onChange={onPhotoChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                /* iOS/Android: 카메라 앱 바로 열림 (capture=environment 후면 카메라) */
                capture="environment"
                className="hidden"
                onChange={onPhotoChange}
              />

              {photos.length > 0 ? (
                <div className="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {photos.map((p, i) => (
                    <motion.div
                      key={`${p.name}-${i}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="relative aspect-square overflow-hidden group"
                      style={{ border: `0.5px solid ${RULE}` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={p.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(i);
                        }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 grid place-items-center rounded-full bg-black/65 hover:bg-black text-white"
                        aria-label="삭제"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="aspect-square grid place-items-center transition-colors text-2xl"
                      style={{ border: `1px dashed ${RULE}`, color: INK_MUTE }}
                      aria-label="사진 더 추가"
                    >
                      +
                    </button>
                  )}
                </div>
              ) : null}

              <div className="mt-3 text-[11px]" style={{ color: INK_MUTE }}>
                업로드된 사진: <b style={{ color: INK }}>{photos.length}장</b>
                {photos.length >= MIN_PHOTOS ? (
                  <span className="ml-1" style={{ color: SAGE }}>· 최소 {MIN_PHOTOS}장 충족 ✓</span>
                ) : (
                  <span className="ml-1" style={{ color: INK_SOFT }}>
                    · 분석 시작까지 {MIN_PHOTOS - photos.length}장 더 필요
                  </span>
                )}
              </div>

              {/* 가게 정보 입력 — 카피 생성 정확도 결정적 */}
              <div className="mt-10 p-5 sm:p-6" style={{ border: `0.5px solid ${RULE}` }}>
                <StepMark>가게 정보 (카피에 그대로 반영됩니다)</StepMark>
                <h2 className="mt-2 text-[19px] tracking-tight" style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 600, wordBreak: "keep-all" }}>
                  사장님 가게를 한 줄로 소개해 주세요
                </h2>
                <p className="mt-1 text-[12.5px]" style={{ color: INK_MUTE, fontFamily: SERIF_HANGUL }}>
                  이 정보로 릴스·카드뉴스·블로그 카피가 만들어져요. 비워두면 일반 템플릿으로 생성됩니다.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold" style={labelStyle}>가게 이름</label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="예: 미옥당 본점"
                      className={INPUT_CLS}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold" style={labelStyle}>한 줄 소개 (선택)</label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="예: 엄마 손맛 그대로, 강남에서 30년"
                      maxLength={40}
                      className={INPUT_CLS}
                      style={inputStyle}
                    />
                    <div className="mt-1 text-[10px] tabular-nums" style={{ color: INK_MUTE }}>{tagline.length}/40</div>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold" style={labelStyle}>시그니처 메뉴 3개 (선택)</label>
                    <p className="mt-1 text-[11px]" style={{ color: INK_MUTE }}>
                      대표 메뉴/상품을 적으면 카피에서 이 이름들을 우선 사용해요.
                    </p>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {signatureMenu.map((v, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={v}
                          onChange={(e) => {
                            const next: [string, string, string] = [...signatureMenu] as [string, string, string];
                            next[idx] = e.target.value;
                            setSignatureMenu(next);
                          }}
                          placeholder={["갈비찜", "냉이된장국", "5첩 한정식"][idx]}
                          maxLength={20}
                          className="h-11 px-3 text-[14px] focus:outline-none"
                          style={inputStyle}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pt-4" style={{ borderTop: `0.5px solid ${RULE_SOFT}` }}>
                    <StepMark>사장님 정보 (결제·알림용)</StepMark>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[12px] font-semibold" style={labelStyle}>사장님 이름</label>
                        <input
                          type="text"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="예: 홍길동"
                          className={INPUT_CLS}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label className="text-[12px] font-semibold" style={labelStyle}>이메일</label>
                        <input
                          type="email"
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          placeholder="예: hong@email.com"
                          className={INPUT_CLS}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between gap-3 flex-wrap">
                <button onClick={back} className={BACK_BTN} style={{ color: INK_MUTE }}>
                  <ChevronLeft className="h-3 w-3" />이전
                </button>
                <div className="flex items-center gap-4 ml-auto">
                  {/* 사진 없이도 데모 흐름을 볼 수 있는 비상구 — 사장님 의사결정 가속 */}
                  {photos.length < MIN_PHOTOS && (
                    <button
                      onClick={next}
                      className="text-[12.5px] underline underline-offset-[6px] decoration-[0.5px]"
                      style={{ color: INK_SOFT, textDecorationColor: RULE }}
                      title="기본 톤으로 일단 시작 — 사진은 나중에 추가하실 수 있습니다"
                    >
                      사진 없이 일단 시작
                    </button>
                  )}
                  <button
                    onClick={next}
                    disabled={photos.length < MIN_PHOTOS}
                    className={cn(PRIMARY_BTN, photos.length < MIN_PHOTOS && "cursor-not-allowed")}
                    style={photos.length >= MIN_PHOTOS ? { background: INK, color: PAPER } : { background: "rgba(20,19,15,0.10)", color: INK_MUTE }}
                  >
                    분석 시작 →
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {/* Step 5 - AI analysis */}
          {step === 5 && (
            <motion.section key="s5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
              <StepMark>Step 05</StepMark>
              <StepTitle>BRIQ가 브랜드를 분석 중…</StepTitle>
              <StepLede>평균 47초 소요됩니다. 잠시만 기다려 주세요.</StepLede>
              <div className="mt-12 space-y-2.5">
                {STAGES.map((s, i) => {
                  const done = analysisStep > i;
                  const active = analysisStep === i;
                  return (
                    <motion.div
                      key={s.id}
                      className="p-4 flex items-center gap-3 transition-all"
                      style={{
                        border: `0.5px solid ${done || active ? RULE : RULE_SOFT}`,
                        background: active ? PAPER_HOVER : "transparent",
                        opacity: done || active ? 1 : 0.5,
                      }}
                    >
                      <div
                        className="h-8 w-8 grid place-items-center text-sm"
                        style={{
                          border: `0.5px solid ${done ? INK : active ? SAGE : RULE}`,
                          background: done ? INK : "transparent",
                          color: done ? PAPER : active ? SAGE : INK_MUTE,
                        }}
                      >
                        {done ? <Check className="h-4 w-4" /> : active ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>◐</motion.span> : "○"}
                      </div>
                      <div className="flex-1">
                        <div className="text-[14px]" style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 500 }}>{s.title}</div>
                        {s.sub && <div className="text-[11px] mt-0.5" style={{ color: INK_MUTE }}>{s.sub}</div>}
                      </div>
                      {done && <span className="text-[10px] tracking-[0.12em] uppercase italic" style={{ color: SAGE, fontFamily: SERIF_LATIN }}>done</span>}
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Step 6 - Results */}
          {step === 6 && (
            <motion.section key="s6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }}>
              <StepMark accent>Step 06 · 분석 완료</StepMark>
              <StepTitle>
                사장님 브랜드,<br />
                <span className="relative inline-block">
                  <span className="relative z-10">이렇게 정리됐어요.</span>
                  <span aria-hidden className="absolute inset-x-[-2px] bottom-[4px] sm:bottom-[6px] h-[10px] sm:h-[14px] -z-0" style={{ background: HL, opacity: 0.9 }} />
                </span>
              </StepTitle>
              <div className="mt-10 space-y-4">
                <div className="p-6" style={{ border: `0.5px solid ${RULE}` }}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <StepMark>브랜드 컬러 (업로드 사진 {photos.length}장에서 추출)</StepMark>
                    {extractedPalette.length > 0 && (
                      <div className="text-[10px] tracking-[0.12em] uppercase italic" style={{ color: SAGE, fontFamily: SERIF_LATIN }}>
                        {extractedPalette.length} colors
                      </div>
                    )}
                  </div>
                  {extractError ? (
                    <div className="mt-3 text-[12px]" style={{ color: INK_SOFT }}>
                      컬러 추출 실패: {extractError} — 기본 팔레트로 진행합니다.
                    </div>
                  ) : null}
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(extractedPalette.length > 0
                      ? extractedPalette
                      : [
                          { hex: "#E5E0D6", name: "오프 화이트", hsl: [40, 0.2, 0.88] as [number, number, number], population: 0 },
                          { hex: "#C9BCA0", name: "샌드", hsl: [42, 0.25, 0.7] as [number, number, number], population: 0 },
                          { hex: "#9A8775", name: "모카", hsl: [28, 0.18, 0.53] as [number, number, number], population: 0 },
                          { hex: "#6E5847", name: "월넛", hsl: [25, 0.22, 0.36] as [number, number, number], population: 0 },
                          { hex: "#3F362C", name: "다크 토프", hsl: [30, 0.18, 0.21] as [number, number, number], population: 0 },
                          { hex: "#1A1714", name: "차콜", hsl: [25, 0.12, 0.09] as [number, number, number], population: 0 },
                        ]
                    ).map((c, i) => (
                      <motion.div
                        key={c.hex + i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="space-y-1.5"
                      >
                        <div
                          className="aspect-square"
                          style={{ background: c.hex, border: `0.5px solid ${RULE}` }}
                        />
                        <div className="text-[10.5px] font-medium truncate" style={{ color: INK }}>{c.name}</div>
                        <div className="text-[9.5px] tabular-nums" style={{ color: INK_MUTE }}>{c.hex}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="p-6" style={{ border: `0.5px solid ${RULE}` }}>
                  <StepMark>브랜드 톤 (업종 · 무드 기반 매칭)</StepMark>
                  <div className="mt-3 text-[16px] leading-relaxed" style={{ fontFamily: SERIF_HANGUL, color: INK }}>
                    “{industry ? INDUSTRY_TONE[industry] ?? "사장님의 브랜드 결을 단정한 톤으로 담습니다" : "사장님의 브랜드 결을 단정한 톤으로 담습니다"}.”
                  </div>
                  {mood && MOOD_TONE_MODIFIER[mood] && (
                    <div className="mt-3 text-[12px] leading-relaxed" style={{ color: INK_SOFT }}>
                      <span className="text-[10px] uppercase tracking-[0.18em] mr-2" style={{ color: INK_MUTE }}>무드 가중</span>
                      {MOOD_TONE_MODIFIER[mood]}
                    </div>
                  )}
                  {/* 사진 팔레트로 자동 추천된 무드 — 다른 칩 누르면 직접 변경 */}
                  <div className="mt-5 pt-4" style={{ borderTop: `0.5px solid ${RULE_SOFT}` }}>
                    <div className="text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: INK_MUTE }}>
                      {moodAutoDetected ? "사진 분석 추천 무드" : "무드"}
                      <span className="ml-2 normal-case tracking-normal" style={{ color: INK_MUTE }}>
                        {moodAutoDetected ? "· 업로드 사진 팔레트 기반 (직접 변경 가능)" : "· 직접 선택됨"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {MOODS.map((m) => {
                        const on = mood === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setMood(m.id); setMoodAutoDetected(false); }}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] transition"
                            style={{
                              border: `0.5px solid ${on ? INK : RULE}`,
                              background: on ? INK : "transparent",
                              color: on ? PAPER : INK_SOFT,
                              fontFamily: SERIF_HANGUL,
                            }}
                          >
                            <span className="flex -space-x-0.5">
                              {m.swatches.slice(0, 3).map((sw, i) => (
                                <span key={i} className="h-2.5 w-2.5 rounded-full ring-1 ring-white/40" style={{ background: sw }} />
                              ))}
                            </span>
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-10 flex items-center justify-between">
                <button onClick={back} className={BACK_BTN} style={{ color: INK_MUTE }}>조정하기</button>
                <button onClick={next} className={PRIMARY_BTN} style={{ background: INK, color: PAPER }}>완벽해요 → 첫 릴스 만들기</button>
              </div>
            </motion.section>
          )}

          {/* Step 7 - Done — 업로드 사진 + 추출 팔레트 + 업종 후크 반영 */}
          {step === 7 && (() => {
            const hook = (industry && INDUSTRY_HOOK[industry]) || INDUSTRY_HOOK.restaurant;
            const industryLabel = INDUSTRIES.find((it) => it.id === industry)?.label ?? "내 브랜드";
            const moodTag = mood ? MOODS.find((m) => m.id === mood)?.tag : null;
            const heroPhoto = photos[0]?.url;
            const accentColor = extractedPalette[Math.floor(extractedPalette.length / 2)]?.hex ?? "#9A8775";
            const primaryColor = extractedPalette[extractedPalette.length - 1]?.hex ?? "#3F362C";

            return (
            <motion.section key="s7" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }}>
              <StepMark accent>Step 07 · 완료</StepMark>
              <StepTitle>첫 릴스가<br />방금 만들어졌어요 ✦</StepTitle>
              <StepLede>
                업로드하신 사진 {photos.length}장과 추출된 팔레트로 30초 릴스를 자동 편집했습니다.
              </StepLede>
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="relative mx-auto w-full" style={{ maxWidth: 280 }}>
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-[28px] overflow-hidden"
                    style={{ border: `8px solid ${INK}`, background: INK, boxShadow: "0 24px 60px -24px rgba(20,19,15,0.45)" }}
                  >
                    <div className="aspect-[9/16] relative overflow-hidden">
                      {/* 업로드한 첫 사진 — 실제 영상 첫 프레임으로 사용 */}
                      {heroPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={heroPhoto}
                          alt="첫 릴스 프리뷰"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(135deg, ${extractedPalette[0]?.hex ?? "#EFE6D5"}, ${primaryColor})`,
                          }}
                        />
                      )}
                      {/* 하단 어두운 그라디언트 (자막 가독성) */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.65) 100%)",
                        }}
                      />
                      {/* 상단 IG-style 헤더 — 브랜드 컬러 사용 */}
                      <div className="absolute top-3 left-3 right-3 flex items-center gap-2 text-white">
                        <div
                          className="h-6 w-6 rounded-full ring-1 ring-white/40"
                          style={{ background: accentColor }}
                        />
                        <div className="text-[10px] font-medium drop-shadow">our_brand</div>
                        {moodTag && (
                          <span
                            className="ml-auto text-[9px] italic tracking-tight"
                            style={{ fontFamily: SERIF_LATIN, color: "rgba(255,255,255,0.85)" }}
                          >
                            {moodTag}
                          </span>
                        )}
                      </div>
                      {/* 업종별 후크 카피 */}
                      <div className="absolute bottom-16 left-4 right-4 text-white">
                        <div className="text-[22px] font-bold leading-[1.2] drop-shadow-lg" style={{ fontFamily: SERIF_HANGUL, wordBreak: "keep-all" }}>
                          {hook.line1}<br />{hook.line2}
                        </div>
                        <div className="mt-2 text-[10px] text-white/85 drop-shadow">{hook.hashtag}</div>
                      </div>
                      {/* 컬러 스트립 — 추출 팔레트 가시화 */}
                      {extractedPalette.length > 0 && (
                        <div className="absolute inset-x-0 bottom-0 flex h-1.5">
                          {extractedPalette.map((c) => (
                            <div key={c.hex} className="flex-1" style={{ background: c.hex }} />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
                <div className="space-y-3">
                  <div className="p-4" style={{ border: `0.5px solid ${RULE}`, borderLeft: `2px solid ${SAGE}`, background: PAPER_HOVER }}>
                    <StepMark accent>생성된 콘텐츠</StepMark>
                    <ul className="mt-2 space-y-1.5 text-[12.5px]" style={{ fontFamily: SERIF_HANGUL, color: INK_SOFT }}>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 shrink-0" style={{ color: SAGE }} />{industryLabel} 인스타 릴스 30초 (8컷, 업로드 사진 기반)</li>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 shrink-0" style={{ color: SAGE }} />브랜드 톤 캡션 + 해시태그 12개</li>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 shrink-0" style={{ color: SAGE }} />썸네일 1:1 / 9:16 (추출 팔레트 적용)</li>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 shrink-0" style={{ color: SAGE }} />카드뉴스 6장 (캐러셀)</li>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 shrink-0" style={{ color: SAGE }} />네이버 블로그 본문 1편</li>
                    </ul>
                  </div>
                  {/* 적용된 사용자 데이터 요약 */}
                  <div className="p-4" style={{ border: `0.5px solid ${RULE}` }}>
                    <StepMark>반영된 사장님 데이터</StepMark>
                    <ul className="mt-2.5 space-y-1.5 text-[11.5px]" style={{ color: INK_SOFT, fontFamily: SERIF_HANGUL }}>
                      <li>업종: <span style={{ color: INK, fontWeight: 600 }}>{industryLabel}</span></li>
                      {moodTag && <li>무드: <span style={{ color: INK, fontWeight: 600 }}>{moodTag}</span></li>}
                      <li>업로드 사진: <span style={{ color: INK, fontWeight: 600 }}>{photos.length}장</span></li>
                      <li>추출 팔레트: <span style={{ color: INK, fontWeight: 600 }}>{extractedPalette.length}개 컬러</span></li>
                    </ul>
                    {extractedPalette.length > 0 && (
                      <div className="mt-2.5 flex gap-1">
                        {extractedPalette.map((c) => (
                          <div
                            key={c.hex}
                            className="h-4 flex-1"
                            style={{ background: c.hex, border: `0.5px solid ${RULE}` }}
                            title={`${c.name} · ${c.hex}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-10 flex flex-col items-end gap-2">
                <button
                  onClick={() => {
                    // 1) 온보딩 결과 영속화
                    if (industry) {
                      const brandId = `me-${Date.now().toString(36)}`;
                      const moodTag2 = (mood && MOODS.find((m) => m.id === mood)?.tag) || "My Brand";
                      const cleanMenu = signatureMenu.map((m) => m.trim()).filter(Boolean);
                      const payload = {
                        id: brandId,
                        name: shopName.trim() || "내 브랜드",
                        industry: industry as IndustryType,
                        industryLabel: INDUSTRY_LABEL[industry] ?? industry,
                        city: INDUSTRY_DEFAULT_CITY[industry] ?? "서울",
                        moodId: (mood ?? "warm") as MoodIdType,
                        moodTag: moodTag2,
                        palette: extractedPalette,
                        photos: photos.map((p) => ({ url: p.url, name: p.name })),
                        hook,
                        toneText:
                          (industry && INDUSTRY_TONE[industry]) ??
                          "사장님의 브랜드 결을 단정한 톤으로 담습니다",
                        tagline: tagline.trim() || undefined,
                        signatureMenu: cleanMenu.length ? cleanMenu : undefined,
                        ownerName: ownerName.trim() || undefined,
                        ownerEmail: ownerEmail.trim() || undefined,
                        selectedPlan,
                        createdAt: Date.now(),
                      };
                      if (addMode) {
                        // ?add=1: 기존 브랜드 무손상 + 신규 추가·활성화 (BrandProvider 가 dispatch 처리)
                        addBrand(payload);
                      } else {
                        saveUserBrand(payload);
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new Event("briq:user-brand-updated"));
                        }
                      }
                    }

                    // 2) 유료 플랜 선택 시: 결제는 별도 페이지에서 (가입과 결제 분리)
                    //    /billing/start 가 로그인 체크 후 비로그인 → /login?next=... 로 분기.
                    if (selectedPlan && selectedPlan !== "free") {
                      router.push(`/billing/start?plan=${selectedPlan}&cycle=monthly`);
                      return;
                    }

                    // 3) Free 플랜 또는 미선택 — 바로 대시보드
                    router.push("/dashboard");
                  }}
                  className="text-[13.5px] font-medium px-6 py-3 tracking-[0.01em] transition-colors"
                  style={{ background: INK, color: PAPER }}
                >
                  {selectedPlan && selectedPlan !== "free"
                    ? `${PLAN_LABEL[selectedPlan]} 14일 무료체험 시작하기 →`
                    : "대시보드로 들어가기 →"}
                </button>
                {selectedPlan && selectedPlan !== "free" && (
                  <p className="text-[11px]" style={{ color: INK_MUTE }}>
                    다음 화면에서 결제수단만 등록하시면 됩니다. 14일 후 첫 청구 — 그 전에 해지 시 청구 없음.
                  </p>
                )}
              </div>
            </motion.section>
            );
          })()}
        </AnimatePresence>
      </main>
    </div>
  );
}
