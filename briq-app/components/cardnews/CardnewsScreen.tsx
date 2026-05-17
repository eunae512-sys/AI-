"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { hexToPexelsColor } from "@/lib/api/demo-images";
import {
  RefreshCw,
  Download,
  Send,
  Sparkles,
  Loader2,
  AlertCircle,
  ImageIcon,
  Cloud,
  CreditCard,
  Upload,
  Pencil,
  Check,
  X,
  AlertTriangle,
  ShieldCheck,
  ClipboardCheck,
  PenLine,
  Wand2,
  LayoutTemplate,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";
import { getBrandDetail } from "@/lib/dummy/brand-detail";
import { NextStepCard } from "@/components/layout/RoadmapStrip";
import { addToQueue as enqueuePublish } from "@/lib/queue/publish-queue";
import { useAutoSaveDraft, formatSavedAt } from "@/lib/drafts/auto-save";
import {
  type LayoutId,
  LAYOUT_SPECS,
  DEFAULT_LAYOUT_SEQUENCE,
  getTitleClass,
  getContainerClass,
} from "@/lib/cardnews/layouts";
import { getContext } from "@/lib/viral/context";
import { cn } from "@/lib/utils";
import { useUsage } from "@/lib/billing/use-usage";
import { incrementUsage } from "@/lib/billing/usage";
import { isFeatureAllowed as isFeatureAllowedFor } from "@/lib/billing/gate";
import { LimitReachedModal } from "@/components/billing/LimitReachedModal";
import { Watermark } from "@/components/billing/Watermark";
import type { UsageKind } from "@/lib/billing/usage";

type Source = "pexels" | "codex" | "ai";

type SlideCopy = {
  label: string;
  title: string;
  sub: string;
  layoutId?: LayoutId;
  body?: string;
  items?: string[];
  footer?: string;
};

type ImageCandidate = {
  url: string;
  photoId?: number;
  photographer?: string;
  photographerUrl?: string;
  pexelsUrl?: string;
  alt?: string;
};

type SlideImage = {
  status: "idle" | "loading" | "ready" | "error";
  url?: string;
  source?: string;
  notice?: string;
  error?: string;
  meta?: { latencyMs?: number; costKrw?: number; photographer?: string };
  // 3가지 변형 후보 (Pexels returnCandidates 응답)
  candidates?: ImageCandidate[];
};

type FactCheckIssue = { slide: number; word: string };
type EditField = "label" | "title" | "sub" | "body" | "footer" | "item";
type EditTarget = { idx: number; field: EditField; itemIdx?: number } | null;

// 브랜드별 카드뉴스 6장 폴백 카피
const SLIDES_BY_BRAND: Record<string, SlideCopy[]> = {
  miokdang: [
    { label: "표지", title: "한 입에 봄이\n옵니다", sub: "미옥당 봄정식 · 5월 코스 공개" },
    { label: "재료", title: "새벽 4시\n양평 시장", sub: "두릅 · 머위 · 곰취 · 직접 담아 옵니다" },
    { label: "메뉴", title: "9가지 정성\n한 그릇의 시간", sub: "정식 코스 풀 라인업" },
    { label: "공간", title: "조용히 데워둔\n한 그릇", sub: "단정한 한식의 시간을 담은 공간" },
    { label: "맛", title: "장 · 산초\n계절의 결", sub: "직접 담근 장 7년의 손맛" },
    { label: "예약", title: "예약\n02-XXXX-1234", sub: "5월 한정 봄정식 · 4인 기준 ₩320,000" },
  ],
  "roastery-1985": [
    { label: "표지", title: "오늘 새 원두\n도착했어요", sub: "에티오피아 예가체프 · 5월 마지막 주" },
    { label: "산지", title: "Yirgacheffe\n2,000m", sub: "G1 · 워시드 · 자스민 · 베르가못" },
    { label: "추출", title: "핸드드립\n한 잔 3분", sub: "92℃ · 1:16 · 푸어오버" },
    { label: "메뉴", title: "콜드브루\n6시간 추출", sub: "5월 시즌 한정 · 산미 · 초콜릿" },
    { label: "공간", title: "1985년의\n첫 잔", sub: "서촌 골목 · 14석" },
    { label: "안내", title: "11~22시\n주말 12~23시", sub: "테이크아웃 -500원 · 매주 월요일 휴무" },
  ],
  "seochon-stay": [
    { label: "표지", title: "창호로 드는\n새벽 빛", sub: "서촌 한옥스테이 · 5월 객실 공개" },
    { label: "공간", title: "마당의\n시간", sub: "한옥 4채 · 모란 · 라일락 · 작약 · 백송" },
    { label: "객실", title: "온돌 · 소반\n조용한 5월의 밤", sub: "최대 4인 · 객실별 마당 전용" },
    { label: "조반", title: "한 상\n차림", sub: "두부조림 · 시금치 · 미역국 · 잡곡밥" },
    { label: "주변", title: "북촌까지\n도보 8분", sub: "경복궁 · 청와대 · 인사동 산책 코스" },
    { label: "예약", title: "1박 ₩280,000\n5월 패키지", sub: "어버이날 효도 패키지 -10%" },
  ],
  "dolce-dessert": [
    { label: "표지", title: "오늘 새로 구운\n수박 케이크", sub: "달콤 멈춤 주의 · 5월 한정" },
    { label: "단면", title: "녹는 단 한 입", sub: "수박 + 크림 치즈 + 라즈베리" },
    { label: "재료", title: "신선한 과일\n직접 손질", sub: "오늘 아침 시장 · 무방부제" },
    { label: "메뉴", title: "5월 신상\n마카롱 12종", sub: "장미 · 자몽 · 피스타치오 · 멜론" },
    { label: "예약", title: "주말 예약\n홀케이크", sub: "2일 전 예약 · 카톡 채널" },
    { label: "안내", title: "11~21시\n매주 화요일 휴무", sub: "성수동 · 주차 가능 (5대)" },
  ],
  "luna-hair": [
    { label: "표지", title: "결이\n살아요", sub: "5월 봄 컬러 시즌 · 단골 -10%" },
    { label: "컬러", title: "오늘의 컬러\n6가지", sub: "샴페인 · 라떼 · 토프 · 더스티 로즈" },
    { label: "시술", title: "5초만에\n광택", sub: "트리트먼트 + 봄 컬러 패키지" },
    { label: "포인트", title: "결을 잡는\n3가지", sub: "헤어 진단 → 시술 → 홈케어" },
    { label: "예약", title: "주중 예약\n10~21시", sub: "단골 ★ 우선 · 카톡 채널" },
    { label: "안내", title: "강남점\n역삼역 5분", sub: "주차 2시간 · 시술 시 무료" },
  ],
  "forum-fashion": [
    { label: "LOOKBOOK", title: "S/S 26\nLOOKBOOK", sub: "한 벌의 무게를 다시 생각합니다" },
    { label: "FABRIC", title: "ONE FABRIC\nTWO WAYS", sub: "Wool linen · 한 원단 두 실루엣" },
    { label: "COLOR", title: "Off white\nDeep charcoal", sub: "S/S 26 핵심 컬러 5종" },
    { label: "STYLING", title: "5 ways to\nwear it", sub: "한 셋업 · 다섯 가지 스타일링" },
    { label: "STORE", title: "한남동\nFORUM.", sub: "11~20시 · 주말 12~21시" },
    { label: "CONTACT", title: "DM 문의\n@forum.kr", sub: "사이즈 컨설팅 · 픽업 가능" },
  ],
};

// 브랜드별 Pexels 검색어 — 매거진/에디토리얼 톤으로 큐레이션
// 슬라이드 순서: 표지 · 후크/디테일 · 스토리/공간 · 메뉴1 · 메뉴2/디테일 · CTA/입구
const PEXELS_QUERY_BY_BRAND: Record<string, string[]> = {
  miokdang: [
    "minimal korean dining table editorial soft light",
    "fresh herbs macro flat lay editorial natural light",
    "traditional korean restaurant interior moody minimal",
    "korean banchan ceramic plates magazine flat lay",
    "ceramic bowl macro detail editorial soft light",
    "lantern hanok entrance evening moody minimal",
  ],
  "roastery-1985": [
    "specialty coffee bar minimal editorial warm light",
    "coffee bean macro detail aesthetic film grain",
    "pour over coffee hands aesthetic editorial",
    "cold brew glass condensation macro editorial",
    "cozy cafe interior warm tone editorial minimal",
    "cafe window evening soft light minimal editorial",
  ],
  "seochon-stay": [
    "hanok window morning light minimal editorial",
    "korean courtyard aesthetic moody natural light",
    "ondol bedroom interior wabi sabi minimal",
    "korean breakfast flat lay magazine editorial",
    "wooden lattice door detail macro editorial",
    "hanok night soft light minimal editorial",
  ],
  "dolce-dessert": [
    "pastel cake flat lay aesthetic editorial soft light",
    "dessert macro slice cross section editorial",
    "fresh berries fruit styling flat lay editorial",
    "macarons pastel minimal magazine flat lay",
    "patisserie display case soft light editorial",
    "boutique bakery interior pastel minimal editorial",
  ],
  "luna-hair": [
    "glossy hair texture macro editorial soft light",
    "hair color swatch palette minimal editorial",
    "modern salon interior minimal editorial",
    "hair detail brushstroke macro shine editorial",
    "minimal salon styling chair editorial",
    "boutique salon entrance window minimal editorial",
  ],
  "forum-fashion": [
    "minimal fashion editorial neutral linen tones",
    "linen fabric texture detail macro editorial",
    "neutral fashion flat lay editorial minimal",
    "minimal fashion model editorial soft natural light",
    "minimal boutique interior gallery editorial",
    "minimal fashion atelier editorial soft light",
  ],
};

// 슬라이드별 구도 모디파이어 (에디토리얼 다양성)
const SLIDE_COMPOSITION = [
  "hero shot with breathing negative space",
  "macro detail crop, shallow depth of field",
  "wide ambient interior, soft natural light",
  "overhead flat lay, composed",
  "tight detail macro, film grain texture",
  "moody atmospheric scene, end-of-day light",
];

const SOURCE_LABEL: Record<Source, { label: string; sub: string; icon: typeof Cloud }> = {
  pexels: { label: "무료 (Pexels)", sub: "0원 · 사실적 사진", icon: Cloud },
  codex: { label: "Codex 구독", sub: "ChatGPT Plus · gpt-image-2", icon: Sparkles },
  ai: { label: "AI 결제 (OpenAI)", sub: "gpt-image-1 · ~₩60/장", icon: CreditCard },
};

// 업종 → 대표 더미 브랜드 ID (사용자 브랜드 시 같은 업종 템플릿을 시작점으로 사용)
const INDUSTRY_TEMPLATE_BRAND: Record<string, string> = {
  restaurant: "miokdang",
  cafe: "roastery-1985",
  stay: "seochon-stay",
  dessert: "dolce-dessert",
  beauty: "luna-hair",
  local: "forum-fashion",
};

// 업종별 GPT 컨텍스트 디폴트 — API 가 한정식으로 fallback 하지 않도록 클라이언트에서 풍부한 컨텍스트 주입
const INDUSTRY_PROMPT_DEFAULTS: Record<
  string,
  { goal: string; target: string; promotion: string; mustSay: string; forbidden: string; tone: string }
> = {
  restaurant: {
    goal: "신규 고객 유입 + 사전 예약 전환",
    target: "30~50대 직장인·가족 모임 주최자",
    promotion: "시즌 한정 코스 · 사전 예약 권장 · 단체석 안내",
    mustSay: "코스, 한 상, 시즌",
    forbidden: "최고, 100%, JMT, 맛집, 대박",
    tone: "정성, 단정한 존댓말, 재료의 시간을 짧게 끊어 보여줌",
  },
  cafe: {
    goal: "단골 유치 + 원두/메뉴 구매 전환",
    target: "20~40대 작업러·커피 애호가·동네 직장인",
    promotion: "시즌 원두 · 신메뉴 · 픽업 안내",
    mustSay: "원두, 추출, 한 잔",
    forbidden: "최고, 1등, 대박, 핫플",
    tone: "매거진 톤, 한 잔의 리듬, 산미·바디 같은 전문 용어 자연스럽게",
  },
  dessert: {
    goal: "인스타 노출 + 픽업 예약 전환",
    target: "20~30대 디저트 애호가·기념일 선물",
    promotion: "시즌 한정 메뉴 · 픽업 예약 · 홀케이크 안내",
    mustSay: "한 입, 단면, 시즌",
    forbidden: "최고, 1등, JMT, 대박",
    tone: "친근한 반말 혹은 가벼운 존댓말, 한 입의 감각 강조",
  },
  stay: {
    goal: "예약 전환 + 패키지 안내",
    target: "30~60대 가족 단위·커플·외국인",
    promotion: "1박 패키지 · 기념일 옵션 · 체크인 안내",
    mustSay: "공간, 빛, 환영",
    forbidden: "최고, 인생숙소, 무조건, 강추",
    tone: "편지 형식, 손님께 보내는 말투, 공간의 빛·소리 묘사",
  },
  beauty: {
    goal: "신규 디자이너 지명 + 시술 예약",
    target: "20~40대 헤어 관리에 관심 있는 직장인",
    promotion: "시즌 컬러 · 케어 패키지 · 단골 우선 예약",
    mustSay: "결, 톤, 케어",
    forbidden: "최고, 100%, 1등, 절대",
    tone: "자신감 있는 존댓말, 단계별 결과 강조",
  },
  local: {
    goal: "쇼룸 방문 + DM 문의 전환",
    target: "20~40대 컨템포러리 패션 관심 소비자",
    promotion: "시즌 룩북 · 신상 컬렉션 · 쇼룸 안내",
    mustSay: "원단, 룩, 쇼룸",
    forbidden: "최고, 1등, 머스트해브, 강추",
    tone: "절제된 영문·한국어 혼용 에디토리얼, 원단·실루엣 디테일",
  },
};

export function CardnewsScreen() {
  const { brand, userBrand } = useBrand();
  const toast = useToast();
  const isUserBrand = !!userBrand && brand.id === userBrand.id;
  // 사용자 브랜드면 업종에 맞는 템플릿 ID로 SLIDES 조회 (industry → template brand)
  const templateBrandId = isUserBrand
    ? INDUSTRY_TEMPLATE_BRAND[brand.industry] ?? "miokdang"
    : brand.id;
  const detail = getBrandDetail(templateBrandId);
  // colors: 사용자 브랜드면 추출 팔레트, 아니면 더미 brand-detail
  const colors = isUserBrand && userBrand
    ? userBrand.palette.map((c) => ({ name: c.name, hex: c.hex }))
    : detail?.colorPalette ?? [];
  const gradient = brand.gradient;

  const defaultSlides = SLIDES_BY_BRAND[templateBrandId] ?? SLIDES_BY_BRAND.miokdang;

  const [slides, setSlides] = useState<SlideCopy[]>(defaultSlides);
  const [source, setSource] = useState<Source>("pexels");
  const [images, setImages] = useState<SlideImage[]>(() => defaultSlides.map(() => ({ status: "idle" })));
  const [approved, setApproved] = useState<boolean[]>(() => defaultSlides.map(() => false));
  const [busy, setBusy] = useState(false);
  const [generatingText, setGeneratingText] = useState(false);
  const [editing, setEditing] = useState<EditTarget>(null);
  const [factCheck, setFactCheck] = useState<FactCheckIssue[] | null>(null);
  const [keyMissing, setKeyMissing] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // 주제 입력 모드 — 주제 한 줄 → 슬라이드 + 레이아웃 자동 구성
  const [topicInput, setTopicInput] = useState("");
  const [composing, setComposing] = useState(false);
  // 톤 모드 — viral 이 기본 (반말체·바이럴), formal 은 정중 존댓말
  const [voice, setVoice] = useState<"viral" | "formal">("viral");

  // 사용량 트래킹 — 현재 플랜의 카드뉴스/AI 이미지 한도 체크
  const { check, plan, planId, isMounted: usageMounted } = useUsage();
  const [limitModal, setLimitModal] = useState<UsageKind | null>(null);

  // 지금 컨텍스트 — 자동으로 GPT 프롬프트에 들어감, 사용자에게 배지로 노출
  const ctx = useMemo(() => getContext(), []);

  // 산업 × 월 매트릭스 — placeholder 가 오늘 시점에 자연스럽게 보이도록
  const topicPlaceholder = useMemo(() => {
    const month = new Date().getMonth() + 1;
    const tableByIndustry: Record<string, string[]> = {
      restaurant: [
        "신년 회식 코스 안내",
        "졸업·입학 축하 한 상",
        "봄 신메뉴 한 상 안내",
        "어버이날 효도 코스",
        "5월 봄나물 코스 안내",
        "초여름 보양 한 상",
        "여름 점심 자리 안내",
        "삼복 보양식 코스",
        "추석 가족 모임 자리",
        "가을 송이 한 상",
        "연말 모임 코스 안내",
        "송년회 단체 자리",
      ],
      cafe: [
        "신년 시즌 라떼 한 잔",
        "발렌타인 디저트 한 잔",
        "봄 시즌 신메뉴 안내",
        "벚꽃 한정 음료",
        "콜드브루 시즌 시작",
        "여름 시그니처 한 잔",
        "한여름 빙수 한 그릇",
        "8월 휴가 영업 안내",
        "가을 시즌 라떼 라인업",
        "10월 핸드드립 라인업",
        "겨울 따뜻한 한 잔",
        "크리스마스 시즌 메뉴",
      ],
      dessert: [
        "신년 디저트 선물 박스",
        "발렌타인 한정 케이크",
        "봄 시즌 마들렌",
        "딸기 시즌 케이크",
        "5월 어버이날 케이크",
        "여름 수박 케이크",
        "한여름 빙수 디저트",
        "여름 휴가 픽업 안내",
        "가을 시즌 몽블랑",
        "할로윈 한정 쿠키",
        "겨울 시즌 슈톨렌",
        "크리스마스 케이크 예약",
      ],
      beauty: [
        "신년 셀프 케어 시술",
        "졸업·입학 단정 룩",
        "봄 컬러 룩북",
        "벚꽃 시즌 결혼식 하객",
        "5월 봄 결혼 시즌 룩",
        "초여름 시원한 컬러",
        "여름 휴가 룩 시술",
        "8월 펌 관리 가이드",
        "가을 컬러 룩북",
        "10월 결혼식 하객 룩",
        "겨울 보호 시술 안내",
        "연말 모임 단정 룩",
      ],
      stay: [
        "신년 한옥 1박 패키지",
        "졸업 가족 여행",
        "봄 한옥 산책 1박",
        "벚꽃 시즌 한옥스테이",
        "어버이날 효도 1박",
        "초여름 한옥 1박",
        "장마철 한옥 1박 패키지",
        "여름 휴가 한옥스테이",
        "추석 가족 모임 한옥",
        "단풍 한옥 1박",
        "겨울 한옥 따뜻한 1박",
        "연말 한옥 패키지",
      ],
    };
    const list = tableByIndustry[brand.industry] ?? tableByIndustry.restaurant;
    const idx = Math.min(11, Math.max(0, month - 1));
    const a = list[idx];
    const b = list[(idx + 1) % 12];
    const c = list[(idx + 2) % 12];
    return `예: ${a} · ${b} · ${c}`;
  }, [brand.industry]);

  const ctxLabel = useMemo(() => {
    const season = { spring: "봄", summer: "여름", fall: "가을", winter: "겨울" }[ctx.season];
    const slot = {
      morning: "오전", lunch: "점심", afternoon: "오후",
      evening: "저녁", night: "밤", lateNight: "심야",
    }[ctx.daySlot];
    const week = {
      weekday: "평일", weekend: "주말",
      monFatigue: "월요일", fridayHype: "금요일",
    }[ctx.weekSlot];
    return `${season} · ${slot} · ${week}`;
  }, [ctx]);

  // 자동 저장 — slides + approved + source (이미지는 dataURL 이라 빼고; 다시 생성하면 됨)
  const { lastSavedAt: draftSavedAt } = useAutoSaveDraft({
    scope: "cardnews",
    brandId: brand.id,
    value: { slides, approved, source },
    onRestore: (draft) => {
      if (Array.isArray(draft.slides) && draft.slides.length > 0) setSlides(draft.slides);
      if (Array.isArray(draft.approved)) setApproved(draft.approved);
      if (typeof draft.source === "string") setSource(draft.source as Source);
    },
  });

  const uploadAllRef = useRef<HTMLInputElement>(null);
  const uploadOneRef = useRef<HTMLInputElement>(null);
  const uploadTargetSlide = useRef<number | null>(null);

  const queries = PEXELS_QUERY_BY_BRAND[templateBrandId] ?? PEXELS_QUERY_BY_BRAND.miokdang;

  // 브랜드 전환 시 상태 리셋
  useEffect(() => {
    const fresh = SLIDES_BY_BRAND[templateBrandId] ?? SLIDES_BY_BRAND.miokdang;
    setSlides(fresh);
    setImages(fresh.map(() => ({ status: "idle" })));
    setApproved(fresh.map(() => false));
    setFactCheck(null);
    setEditing(null);
  }, [brand.id]);

  // 키 누락 사전 점검
  useEffect(() => {
    let alive = true;
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const missing: string[] = [];
        if (!d?.openai?.configured) missing.push("OPENAI_API_KEY");
        if (!d?.pexels?.configured) missing.push("PEXELS_API_KEY");
        setKeyMissing(missing.length ? missing.join(" · ") : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const generateOne = useCallback(
    async (idx: number, src: Source, slideParam?: SlideCopy): Promise<SlideImage> => {
      // slideParam 우선 (compose 직후처럼 state 가 아직 반영 안 됐을 때) → 없으면 state 에서
      const slide = slideParam ?? slides[idx];
      const slideId = idx + 1;

      if (src === "pexels") {
        const q = queries[idx] ?? queries[0];
        const pexelsColor = hexToPexelsColor(colors[0]?.hex);
        const res = await fetch("/api/search-pexels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: q,
            orientation: "portrait",
            size: "large",
            perPage: 24,
            color: pexelsColor,
            slideId,
            returnCandidates: true,
          }),
        });
        const data = await res.json();
        if (!data.ok) return { status: "error", error: data.error || "Pexels 검색 실패" };
        return {
          status: "ready",
          url: data.image,
          source: data.meta?.source,
          notice: data.meta?.notice,
          meta: { latencyMs: data.meta?.latencyMs, photographer: data.meta?.photographer },
          candidates: Array.isArray(data.candidates) ? data.candidates : undefined,
        };
      }

      const prompt = buildImagePrompt(brand.id, brand.industryLabel, brand.campaign, slide, idx, colors[0]?.hex);

      if (src === "codex") {
        // ChatGPT 이미지 한도 체크 — Free 0장 / Pro 50장 / Studio 300장 / Agency 무제한
        const limit = check("aiImage");
        if (!limit.allowed) {
          setLimitModal("aiImage");
          return { status: "error", error: "월 ChatGPT 이미지 한도 도달" };
        }
        const res = await fetch("/api/generate-image-codex", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, size: "1024x1536", slideId }),
        });
        const data = await res.json();
        if (!data.ok) return { status: "error", error: data.error || "Codex 생성 실패" };
        // 성공한 장 수만큼 카운터 증가
        incrementUsage("aiImage");
        return {
          status: "ready",
          url: data.image,
          source: data.meta?.source,
          notice: data.meta?.notice,
          meta: { latencyMs: data.meta?.latencyMs, costKrw: data.meta?.costKrw },
        };
      }

      // ai (OpenAI gpt-image-1)
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size: "1024x1536", quality: "medium", slideId }),
      });
      const data = await res.json();
      if (!data.ok) return { status: "error", error: data.error || "OpenAI 이미지 생성 실패" };
      return {
        status: "ready",
        url: data.image,
        source: data.meta?.source,
        notice: data.meta?.notice,
        meta: { latencyMs: data.meta?.latencyMs, costKrw: data.meta?.costKrw },
      };
    },
    [brand.id, brand.industryLabel, brand.campaign, slides, queries, colors, check],
  );

  // 임의의 slides 배열에 대해 6장 이미지 일괄 생성 — compose 직후처럼 state 가 아직 반영 안 됐을 때 슬라이드 인라인 전달
  const generateImagesForSlides = useCallback(
    async (slidesToUse: SlideCopy[], silent = false): Promise<SlideImage[]> => {
      setBusy(true);
      setImages(slidesToUse.map(() => ({ status: "loading" })));
      if (!silent) toast.info(`${brand.name} · 6장 ${SOURCE_LABEL[source].label} 로 생성 시작`);
      const results = await Promise.all(
        slidesToUse.map(async (s, i) => {
          try {
            return await generateOne(i, source, s);
          } catch (e) {
            const err = e instanceof Error ? e.message : String(e);
            return { status: "error" as const, error: err };
          }
        }),
      );
      setImages(results);
      setBusy(false);
      const okCount = results.filter((r) => r.status === "ready").length;
      const demoCount = results.filter((r) => r.source === "demo-fallback").length;
      if (okCount === slidesToUse.length) {
        if (demoCount > 0) {
          toast.warn(`${okCount}/${slidesToUse.length} 완료 · ${demoCount}장은 데모 폴백 (API 키 확인)`);
        } else {
          toast.success(`${brand.name} · ${okCount}장 ${SOURCE_LABEL[source].label} 완료`);
        }
      } else {
        toast.warn(`${okCount}/${slidesToUse.length} 완료 · 일부 실패`);
      }
      return results;
    },
    [brand.name, source, generateOne, toast],
  );

  const regenerateAll = useCallback(async () => {
    if (busy || generatingText) return;
    await generateImagesForSlides(slides);
  }, [busy, generatingText, generateImagesForSlides, slides]);

  const regenerateOne = useCallback(
    async (idx: number) => {
      setImages((prev) => prev.map((s, i) => (i === idx ? { status: "loading" } : s)));
      try {
        const r = await generateOne(idx, source);
        setImages((prev) => prev.map((s, i) => (i === idx ? r : s)));
        if (r.status === "ready") {
          toast.success(`${idx + 1}번 슬라이드 ${SOURCE_LABEL[source].label} 완료`);
        } else {
          toast.warn(`${idx + 1}번 실패: ${r.error}`);
        }
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        setImages((prev) => prev.map((s, i) => (i === idx ? { status: "error", error: err } : s)));
        toast.warn(`${idx + 1}번 오류: ${err}`);
      }
    },
    [generateOne, source, toast],
  );

  const readAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("파일 읽기 실패"));
      reader.readAsDataURL(file);
    });

  const onUploadAll = () => uploadAllRef.current?.click();

  const onUploadAllChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (e.target) e.target.value = "";
    if (!files.length) return;
    const useCount = Math.min(files.length, slides.length);
    toast.info(`업로드 시작 — ${useCount} / ${slides.length} 슬라이드 적용 중`);
    const next: SlideImage[] = [...images];
    for (let i = 0; i < useCount; i++) {
      try {
        const file = files[i];
        const dataUrl = await readAsDataUrl(file);
        next[i] = {
          status: "ready",
          url: dataUrl,
          source: "upload",
          meta: { latencyMs: 0, costKrw: 0 },
          notice: `${file.name} · ${Math.round(file.size / 1024)}KB`,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        next[i] = { status: "error", error: msg };
      }
    }
    setImages(next);
    toast.success(`${useCount}장 업로드 완료 · 텍스트는 그대로 유지됩니다`);
  };

  const onUploadOneClick = (slideIdx: number) => {
    uploadTargetSlide.current = slideIdx;
    uploadOneRef.current?.click();
  };

  const onUploadOneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetIdx = uploadTargetSlide.current;
    if (e.target) e.target.value = "";
    uploadTargetSlide.current = null;
    if (!file || targetIdx === null) return;
    if (!file.type.startsWith("image/")) {
      toast.warn("이미지 파일만 업로드 가능합니다");
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      setImages((prev) =>
        prev.map((s, i) =>
          i === targetIdx
            ? {
                status: "ready",
                url: dataUrl,
                source: "upload",
                meta: { latencyMs: 0, costKrw: 0 },
                notice: `${file.name} · ${Math.round(file.size / 1024)}KB`,
              }
            : s,
        ),
      );
      toast.success(`${targetIdx + 1}번 슬라이드 업로드 완료 (${Math.round(file.size / 1024)}KB)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.warn(`업로드 실패: ${msg}`);
    }
  };

  // 주제 → 슬라이드 6장 + 페이지별 레이아웃 자동 구성
  const composeFromTopic = useCallback(async () => {
    if (composing || busy || generatingText) return;
    const topic = topicInput.trim();
    if (!topic) {
      toast.warn("어떤 주제로 카드뉴스를 만들지 한 줄 적어주세요");
      return;
    }
    // 한도 체크 — Free 는 월 2편, Pro 이상 무제한
    const limit = check("cardnews");
    if (!limit.allowed) {
      setLimitModal("cardnews");
      return;
    }
    setComposing(true);
    toast.info(`"${topic}" 주제 — 6장 + 페이지 디자인 자동 구성 중...`);
    try {
      const ind = INDUSTRY_PROMPT_DEFAULTS[brand.industry] ?? INDUSTRY_PROMPT_DEFAULTS.restaurant;
      const userMenu = isUserBrand && userBrand?.signatureMenu
        ? userBrand.signatureMenu.filter(Boolean).join(", ")
        : "";
      const userTagline = isUserBrand && userBrand?.tagline ? userBrand.tagline : "";
      const res = await fetch("/api/compose-cardnews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: brand.name,
          industry: brand.industryLabel,
          location: brand.city,
          topic,
          tagline: userTagline,
          signatureMenu: userMenu,
          tone: detail?.toneSummary ?? ind.tone,
          forbidden: (detail?.forbiddenWords ?? []).join(", "),
          slideCount: 6,
          voice,
        }),
      });
      const data = await res.json();
      if (!data?.ok) {
        toast.warn(`자동 구성 실패: ${data?.error ?? "알 수 없음"}`);
        return;
      }
      const rawSlides = (data.slides as Array<{
        role?: string;
        layoutId?: LayoutId;
        label?: string;
        title?: string;
        sub?: string;
        body?: string;
        items?: string[];
        footer?: string;
      }>) ?? [];
      const newSlides: SlideCopy[] = rawSlides.slice(0, 6).map((s, i) => ({
        label: s.label ?? "",
        title: s.title ?? "",
        sub: s.sub ?? "",
        layoutId: s.layoutId ?? DEFAULT_LAYOUT_SEQUENCE[i] ?? "hero",
        body: s.body,
        items: Array.isArray(s.items) ? s.items : undefined,
        footer: s.footer,
      }));
      while (newSlides.length < 6) {
        const i = newSlides.length;
        newSlides.push({ label: "", title: "", sub: "", layoutId: DEFAULT_LAYOUT_SEQUENCE[i] ?? "hero" });
      }
      setSlides(newSlides);
      setApproved(newSlides.map(() => false));
      setFactCheck(null);
      setEditing(null);
      // 사용량 카운터 +1 — 한도가 있는 플랜에서만 의미 있음 (무제한 플랜은 무시)
      incrementUsage("cardnews");
      const cost = data.meta?.costKrw ?? 0;
      const demo = data.meta?.demoMode ? " (데모)" : "";
      toast.success(`6장 구성 완료${demo} · 각 슬라이드 레이아웃 자동 선택 · ₩${cost}`);
      if (Array.isArray(data.flagged) && data.flagged.length) {
        const issues: FactCheckIssue[] = data.flagged.map(
          (f: { slide: number; word: string }) => ({ slide: f.slide, word: f.word }),
        );
        setFactCheck(issues);
        toast.warn(`${issues.length}건 금지어/클리셰 검출 — 검수 결과 확인`);
      }
      // ★ 자동 이미지 트리거 — 텍스트 직후 이미지까지 한 번에
      toast.info("이미지도 자동 채우는 중...");
      await generateImagesForSlides(newSlides, true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.warn(`자동 구성 오류: ${msg}`);
    } finally {
      setComposing(false);
    }
  }, [topicInput, brand, detail, isUserBrand, userBrand, busy, composing, generatingText, toast, voice, generateImagesForSlides, check]);

  const generateText = useCallback(async () => {
    if (generatingText || busy) return;
    setGeneratingText(true);
    toast.info(`${brand.name} 카드뉴스 텍스트 GPT-4o 생성 중...`);
    try {
      const ind = INDUSTRY_PROMPT_DEFAULTS[brand.industry] ?? INDUSTRY_PROMPT_DEFAULTS.restaurant;
      const detailMustSay = (detail?.preferredWords ?? []).join(", ");
      const detailForbidden = (detail?.forbiddenWords ?? []).join(", ");
      // ★ 사용자 브랜드 데이터 주입 — 시그니처 메뉴 + tagline 이 카피에 박힘
      const userMenuMustSay = isUserBrand && userBrand?.signatureMenu
        ? userBrand.signatureMenu.filter(Boolean).join(", ")
        : "";
      const userTagline = isUserBrand && userBrand?.tagline ? userBrand.tagline : "";
      const campaignWithTagline = userTagline
        ? `${brand.campaign} · 가게 한 줄 소개: "${userTagline}"`
        : brand.campaign;
      const body = {
        brand: brand.name,
        industry: brand.industryLabel,
        location: brand.city,
        campaign: campaignWithTagline,
        goal: ind.goal,
        target: ind.target,
        promotion: ind.promotion,
        tone: detail?.toneSummary ?? ind.tone,
        forbidden: [detailForbidden, ind.forbidden].filter(Boolean).join(", "),
        // 시그니처 메뉴는 must_say 최상단 — GPT 가 우선 반영
        must_say: [userMenuMustSay, detailMustSay, ind.mustSay].filter(Boolean).join(", "),
        slide_count: slides.length || 6,
        voice,
      };
      const res = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.warn(`텍스트 생성 실패: ${data.error}`);
        return;
      }
      const raw = (data.slides as Array<{ label?: string; title?: string; sub?: string }>) || [];
      const newSlides: SlideCopy[] = raw.slice(0, 6).map((s) => ({
        label: s.label ?? "",
        title: s.title ?? "",
        sub: s.sub ?? "",
      }));
      while (newSlides.length < 6) newSlides.push({ label: "", title: "", sub: "" });
      setSlides(newSlides);
      setApproved(newSlides.map(() => false));
      setFactCheck(null);
      setEditing(null);
      const cost = data.meta?.costKrw ?? 0;
      const lat = data.meta?.latencyMs ?? 0;
      if (data.meta?.demoMode) {
        toast.warn("6장 텍스트 데모 폴백 — OPENAI_API_KEY 확인 필요");
      } else {
        toast.success(`6장 텍스트 GPT-4o 완료 · ₩${cost} · ${lat}ms`);
      }
      if (Array.isArray(data.flagged) && data.flagged.length) {
        const issues: FactCheckIssue[] = data.flagged.map(
          (f: { slide: number; word: string }) => ({ slide: f.slide, word: f.word }),
        );
        setFactCheck(issues);
        toast.warn(`${issues.length}건 금지어 검출 — 검수 결과 확인`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.warn(`텍스트 생성 오류: ${msg}`);
    } finally {
      setGeneratingText(false);
    }
  }, [brand, detail, toast]);

  const runFactCheck = useCallback(() => {
    const forbiddenList = detail?.forbiddenWords ?? [];
    if (forbiddenList.length === 0) {
      setFactCheck([]);
      toast.info("브랜드 금지어 미설정 — 검출 룰 없음");
      return;
    }
    const issues: FactCheckIssue[] = [];
    slides.forEach((s, idx) => {
      const text = `${s.label} ${s.title} ${s.sub}`;
      forbiddenList.forEach((word) => {
        if (text.includes(word)) issues.push({ slide: idx + 1, word });
      });
    });
    setFactCheck(issues);
    if (issues.length === 0) toast.success("사실 확인 완료 · 금지어 검출 없음");
    else toast.warn(`${issues.length}건 검출 — 검수 결과 카드 확인`);
  }, [slides, detail, toast]);

  const updateField = (idx: number, field: "label" | "title" | "sub" | "body" | "footer", value: string) => {
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const updateItem = (idx: number, itemIdx: number, value: string) => {
    setSlides((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const items = [...(s.items ?? [])];
        items[itemIdx] = value;
        return { ...s, items };
      }),
    );
  };

  const toggleApprove = (idx: number) => {
    setApproved((prev) => prev.map((a, i) => (i === idx ? !a : a)));
  };

  const approveAll = () => {
    setApproved(slides.map(() => true));
    toast.success("6장 모두 승인 — 인스타 업로드 준비 완료");
  };

  const rejectAll = () => {
    setApproved(slides.map(() => false));
    toast.warn("6장 모두 반려 — 재검수 필요");
  };

  const approvedCount = approved.filter(Boolean).length;

  const onVariation = useCallback(async () => {
    // 중복 클릭 방어 — disabled prop 이 안 잡힐 가능성 대비 (focus/keyboard 등)
    if (generatingText || busy) return;
    setGeneratingText(true);
    toast.info(`${brand.name} 변형 카피 GPT-4o 생성 중 — 다른 각도로 6장`);
    try {
      const variationHint = " 변형 버전 — 같은 캠페인이지만 다른 후크·스토리·각도로 새로 작성. 첫 시도와 같은 단어·문장 반복 금지.";
      const ind = INDUSTRY_PROMPT_DEFAULTS[brand.industry] ?? INDUSTRY_PROMPT_DEFAULTS.restaurant;
      const detailMustSay = (detail?.preferredWords ?? []).join(", ");
      const detailForbidden = (detail?.forbiddenWords ?? []).join(", ");
      const userMenuMustSay = isUserBrand && userBrand?.signatureMenu
        ? userBrand.signatureMenu.filter(Boolean).join(", ")
        : "";
      const userTagline = isUserBrand && userBrand?.tagline ? userBrand.tagline : "";
      const campaignBase = userTagline
        ? `${brand.campaign} · 가게 한 줄 소개: "${userTagline}"`
        : brand.campaign;
      const body = {
        brand: brand.name,
        industry: brand.industryLabel,
        location: brand.city,
        campaign: campaignBase + variationHint,
        goal: ind.goal,
        target: ind.target,
        promotion: ind.promotion,
        tone: detail?.toneSummary ?? ind.tone,
        forbidden: [detailForbidden, ind.forbidden].filter(Boolean).join(", "),
        must_say: [userMenuMustSay, detailMustSay, ind.mustSay].filter(Boolean).join(", "),
        slide_count: slides.length || 6,
      };
      const res = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.warn(`변형 생성 실패: ${data.error}`);
        return;
      }
      const raw = (data.slides as Array<{ label?: string; title?: string; sub?: string }>) || [];
      const next: SlideCopy[] = raw.slice(0, 6).map((s) => ({
        label: s.label ?? "",
        title: s.title ?? "",
        sub: s.sub ?? "",
      }));
      while (next.length < 6) next.push({ label: "", title: "", sub: "" });
      setSlides(next);
      setApproved(next.map(() => false));
      setFactCheck(null);
      const cost = data.meta?.costKrw ?? 0;
      toast.success(`변형 6장 완료 · ₩${cost}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.warn(`변형 생성 오류: ${msg}`);
    } finally {
      setGeneratingText(false);
    }
  }, [brand, detail, toast, busy, generatingText, slides.length]);
  const onPublish = () => {
    if (approvedCount < slides.length) {
      toast.warn(`승인된 슬라이드 ${approvedCount}/${slides.length} · 전체 승인 후 발행 가능`);
      return;
    }
    const firstSlide = slides[0];
    const firstImage = images[0];
    enqueuePublish({
      brandId: brand.id,
      brandName: brand.name,
      type: "cardnews",
      typeLabel: `카드뉴스 ${slides.length}장`,
      title: firstSlide?.title ?? brand.campaign,
      caption: firstSlide?.sub,
      thumbnail: firstImage?.status === "ready" ? firstImage.url : undefined,
      channels: ["instagram"],
      status: "scheduled",
    });
    toast.success(`${brand.name} 카드뉴스 발행 큐에 등록 — /schedule 에서 시간 지정`);
  };
  const onQueue = () => {
    const firstSlide = slides[0];
    const firstImage = images[0];
    enqueuePublish({
      brandId: brand.id,
      brandName: brand.name,
      type: "cardnews",
      typeLabel: `카드뉴스 ${slides.length}장`,
      title: firstSlide?.title ?? brand.campaign,
      caption: firstSlide?.sub,
      thumbnail: firstImage?.status === "ready" ? firstImage.url : undefined,
      channels: ["instagram"],
      status: "draft",
    });
    toast.success(`${brand.name} 카드뉴스 초안으로 큐에 저장됨`);
  };
  const onDownload = () => toast.info("ZIP 다운로드 시작 — 6.4 MB");

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      <AnimatePresence>
        {keyMissing && !bannerDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">키 누락: {keyMissing}</span>
              <span className="ml-2 opacity-80">
                briq-app/.env.local 에 키 추가 후 dev 서버 재시작 · 그 전까지는 데모 폴백 동작
              </span>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-[10px] px-2 py-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5 sm:mb-6">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-violet-600 dark:text-violet-400 font-semibold">
            AI CARDNEWS · {brand.name}
          </div>
          <h1 className="mt-2 text-[22px] sm:text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15]">
            카드뉴스 6장 자동 생성
          </h1>
          <p className="mt-1.5 text-[13px] sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            {brand.name} 톤 v{brand.toneVersion} · {detail?.hero.tagline ?? brand.campaign}
          </p>
        </div>
        {/* Mobile: 2x2 grid; sm+: inline
            disabled 정책: busy(이미지 재생성 중) OR generatingText(텍스트 생성 중) → 모든 작업 버튼 disabled
            spinner 정책: 각 버튼의 자체 작업 중일 때만 spinner */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2 sm:flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={generateText}
            disabled={busy || generatingText}
            className="text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50"
          >
            {generatingText ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PenLine className="h-3.5 w-3.5" />
            )}
            <span>{generatingText ? "AI 작성 중..." : "AI 텍스트"}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onUploadAll} disabled={busy || generatingText}>
            <Upload className="h-3.5 w-3.5" />
            <span>직접 업로드</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onVariation}
            disabled={busy || generatingText}
          >
            {generatingText ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span>{generatingText ? "변형 중..." : "변형 생성"}</span>
          </Button>
          <Button size="sm" onClick={regenerateAll} disabled={busy || generatingText}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span>{busy ? "이미지 생성 중..." : "이미지 재생성"}</span>
          </Button>
        </div>
      </div>

      {/* 사용량 인디케이터 — 한도 있는 플랜만 노출.
          SSR 디폴트(Free) 도 cardnewsPerMonth = 2 이므로 첫 프레임부터 그대로 보인다.
          Pro 이상 마운트 후엔 한도 null 이라 자연스럽게 사라짐. */}
      {plan.limits.cardnewsPerMonth !== null && (
        <UsageStrip
          planName={plan.name}
          used={check("cardnews").used}
          limit={plan.limits.cardnewsPerMonth}
          onUpgrade={() => setLimitModal("cardnews")}
        />
      )}

      {/* 주제 한 줄 입력 → 6장 + 페이지 디자인 자동 구성 (대표 흐름) */}
      <Card className="p-4 sm:p-5 mb-4 border-violet-200 dark:border-violet-900/40 bg-gradient-to-br from-violet-50/60 to-white dark:from-violet-500/5 dark:to-zinc-950">
        <div className="flex items-start gap-3 flex-wrap mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Wand2 className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-[11px] uppercase tracking-wider font-semibold text-violet-700 dark:text-violet-300">
                주제 한 줄 → 카드뉴스 6장 자동 구성
              </span>
              <Badge tone="amber" title="오늘의 계절·시간대·요일이 자동으로 카피 톤에 반영됩니다">{ctxLabel}</Badge>
            </div>
            <p className="text-[12.5px] text-zinc-600 dark:text-zinc-400 mt-1">
              주제만 적으면 글 + <b>페이지별 레이아웃</b>까지 AI 가 결정 — 표지·인용·메뉴 리스트·단계·CTA 가 모두 다른 디자인으로 짜집니다.
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
              지금 컨텍스트 ({ctxLabel}) 가 자동으로 카피 톤에 반영됩니다. 예: 비/저녁/주말 → 분위기 강조, 여름 → 시원함 강조.
            </p>
          </div>
          {/* 톤 모드 토글 — viral(반말체 바이럴) / formal(정중 존댓말) */}
          <div className="flex gap-1 p-1 rounded-md bg-zinc-100 dark:bg-zinc-900 shrink-0">
            <button
              onClick={() => setVoice("viral")}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded transition-colors font-medium",
                voice === "viral"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
              )}
              title="반말체 · 저장각 · 바이럴 SNS 톤"
            >
              🔥 바이럴
            </button>
            <button
              onClick={() => setVoice("formal")}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded transition-colors font-medium",
                voice === "formal"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
              )}
              title="정중 존댓말 톤"
            >
              ✒ 정중
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && topicInput.trim() && !composing) composeFromTopic();
            }}
            placeholder={topicPlaceholder}
            className="flex-1 px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-violet-500"
            disabled={composing}
          />
          <Button
            onClick={composeFromTopic}
            disabled={composing || busy || generatingText || !topicInput.trim()}
            className="sm:w-auto bg-violet-600 hover:bg-violet-700"
          >
            {composing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                구성 중...
              </>
            ) : (
              <>
                <LayoutTemplate className="h-3.5 w-3.5" />
                글 + 디자인 자동 생성
              </>
            )}
          </Button>
        </div>
        {/* 활성 레이아웃 시퀀스 — 사용자가 현재 구성을 한눈에 */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[10px]">
          <span className="text-zinc-500 mr-1">현재 6장 레이아웃:</span>
          {slides.map((s, i) => {
            const layoutId = s.layoutId ?? DEFAULT_LAYOUT_SEQUENCE[i] ?? "hero";
            const spec = LAYOUT_SPECS[layoutId];
            return (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                <span className="text-zinc-400 tabular-nums">{i + 1}</span>
                {spec.label}
              </span>
            );
          })}
        </div>

        {/* ★ 내 사진 직접 업로드 (드래그앤드롭 큰 영역) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("border-emerald-500", "bg-emerald-50/60", "dark:bg-emerald-500/10");
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove("border-emerald-500", "bg-emerald-50/60", "dark:bg-emerald-500/10");
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("border-emerald-500", "bg-emerald-50/60", "dark:bg-emerald-500/10");
            const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
            if (!files.length) return;
            const dt = new DataTransfer();
            files.forEach((f) => dt.items.add(f));
            if (uploadAllRef.current) {
              uploadAllRef.current.files = dt.files;
              const evt = new Event("change", { bubbles: true });
              uploadAllRef.current.dispatchEvent(evt);
            }
          }}
          className="mt-3 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors p-3 flex items-center gap-3 cursor-pointer"
          onClick={onUploadAll}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter") onUploadAll(); }}
        >
          <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 grid place-items-center shrink-0">
            <Upload className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-zinc-900 dark:text-zinc-100">
              내 사진 직접 업로드 (6장 한 번에 OK)
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              드래그하거나 클릭 · 슬라이드 순서대로 적용됨 · 각 슬라이드 호버해 한 장씩도 교체 가능
            </div>
          </div>
          <div className="text-[10px] text-zinc-400 dark:text-zinc-600 hidden sm:block">JPG / PNG / WEBP</div>
        </div>
      </Card>

      {/* 자동 저장 상태 — 사용자 신뢰 */}
      <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
        ✓ {formatSavedAt(draftSavedAt)} · 카피·승인 상태 자동 보존됨
      </div>

      <input
        ref={uploadAllRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={onUploadAllChange}
      />
      <input
        ref={uploadOneRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onUploadOneChange}
      />

      {/* Source toggle */}
      <Card className="p-4 mb-4">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">이미지 소스</div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              브랜드 무드에 맞는 소스 선택 · 6장 모두 같은 소스로 생성됩니다
            </p>
          </div>
          <div className="inline-flex w-full sm:w-auto overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 p-1 bg-zinc-50 dark:bg-zinc-900/40">
            {(Object.keys(SOURCE_LABEL) as Source[]).map((s) => {
              const Icon = SOURCE_LABEL[s].icon;
              const active = source === s;
              // Pexels 는 Free 도 가능, codex/ai 는 Pro 부터
              const locked = (s === "codex" || s === "ai") && usageMounted && !isFeatureAllowedFor("ai-image:generate", planId);
              return (
                <button
                  key={s}
                  onClick={() => {
                    if (locked) {
                      setLimitModal("aiImage"); // 모달은 한도 도달과 동일하게 — Pro 업셀
                      return;
                    }
                    setSource(s);
                  }}
                  disabled={busy}
                  title={locked ? "Pro 부터 사용 가능" : undefined}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap min-h-10 ${
                    active
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : locked
                        ? "text-zinc-400 dark:text-zinc-600"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{SOURCE_LABEL[s].label}</span>
                  {locked && <Lock className="h-3 w-3 text-zinc-400" />}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 text-[11px] text-zinc-500">
          현재: <span className="font-medium text-zinc-700 dark:text-zinc-300">{SOURCE_LABEL[source].label}</span> · {SOURCE_LABEL[source].sub}
        </div>
      </Card>

      {/* Slide grid */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">6장 캐러셀</h3>
          <span className="text-[11px] text-zinc-500">4:5 · 인스타 캐러셀 · 발행 전 검수 자동</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {slides.map((s, i) => {
            const c = colors[i % (colors.length || 1)];
            const img = images[i] ?? { status: "idle" };
            const fallbackBg = c
              ? { backgroundImage: `linear-gradient(135deg, ${c.hex}, ${colors[(i + 1) % colors.length]?.hex ?? c.hex})` }
              : undefined;

            return (
              <motion.article
                key={`${brand.id}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`cardnews-slide relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm hover:shadow-md transition-shadow group`}
                style={img.status !== "ready" ? fallbackBg : undefined}
              >
                {img.status === "ready" && img.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.url}
                    alt={s.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                {/* 매거진 톤 dual gradient — 위(헤더 가독성), 아래(타이틀 가독성) 따로 */}
                {img.status === "ready" && (
                  <>
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 via-black/15 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/35 to-transparent pointer-events-none" />
                  </>
                )}

                {/* 매거진 letterhead — 브랜드 마크 + 슬라이드 번호 (모든 layout 공통) */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-5 w-5 rounded-full shrink-0 grid place-items-center text-[8px] font-bold text-white"
                      style={{
                        background: c
                          ? `linear-gradient(135deg, ${c.hex}, ${colors[(i + 1) % Math.max(1, colors.length)]?.hex ?? c.hex})`
                          : undefined,
                        backgroundColor: c ? undefined : "rgba(255,255,255,0.15)",
                      }}
                    >
                      {brand.letter}
                    </span>
                    <div className="min-w-0">
                      {editing?.idx === i && editing.field === "label" ? (
                        <input
                          autoFocus
                          value={s.label}
                          onChange={(ev) => updateField(i, "label", ev.target.value)}
                          onBlur={() => setEditing(null)}
                          onKeyDown={(ev) => {
                            if (ev.key === "Enter" || ev.key === "Escape") setEditing(null);
                          }}
                          className="cardnews-label-uppercase text-[10px] sm:text-[9px] text-white bg-black/60 backdrop-blur px-1.5 py-0.5 rounded outline-none ring-1 ring-white/40 w-28"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditing({ idx: i, field: "label" })}
                          className="block max-w-[140px] sm:max-w-[120px] truncate text-left cardnews-label-uppercase text-[10px] sm:text-[9px] text-white/85 hover:text-white transition-colors"
                          title="라벨 편집"
                        >
                          {s.label || `${String(i + 1).padStart(2, "0")} ·`}
                        </button>
                      )}
                    </div>
                  </div>
                  {/* 페이지 카운터 — 매거진 톤 */}
                  <div className="cardnews-label-uppercase text-[10px] sm:text-[9px] text-white/70 tabular-nums shrink-0">
                    {String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                  </div>
                </div>

                {/* DEMO / UPLOAD / 승인 배지 — 카드 좌하단 */}
                <div className="absolute top-10 left-3 flex flex-wrap gap-1 z-10">
                  {img.source === "demo-fallback" && (
                    <span className="cardnews-label-uppercase text-[8px] text-white/90 bg-amber-600/80 backdrop-blur px-1.5 py-0.5 rounded">
                      DEMO
                    </span>
                  )}
                  {img.source === "upload" && (
                    <span className="cardnews-label-uppercase text-[8px] text-white/90 bg-emerald-600/80 backdrop-blur px-1.5 py-0.5 rounded">
                      UPLOAD
                    </span>
                  )}
                  {approved[i] && (
                    <span className="cardnews-label-uppercase text-[8px] text-white bg-emerald-700/90 backdrop-blur px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>

                {/* 하단 브랜드 accent line — palette 의 첫 컬러 사용 */}
                <div
                  className="absolute inset-x-0 bottom-0 h-[3px] z-10"
                  style={{
                    background: c
                      ? `linear-gradient(90deg, ${c.hex}, ${colors[(i + 1) % Math.max(1, colors.length)]?.hex ?? c.hex})`
                      : "rgba(255,255,255,0.4)",
                  }}
                  aria-hidden
                />

                {img.status === "loading" && (
                  <div className="absolute inset-0 grid place-items-center bg-black/30 backdrop-blur-sm">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}

                {img.status === "error" && (
                  <div className="absolute inset-0 grid place-items-center bg-rose-900/40 backdrop-blur-sm p-3">
                    <div className="text-center">
                      <AlertCircle className="h-5 w-5 text-rose-200 mx-auto" />
                      <div className="mt-1 text-[9px] text-rose-100 line-clamp-3">{img.error}</div>
                      <div className="mt-1 text-[8px] text-rose-200/80">탭해서 재시도</div>
                    </div>
                  </div>
                )}

                {/* 레이아웃 분기 렌더링 — layoutId 별로 다른 디자인 */}
                {(() => {
                  const layoutId = s.layoutId ?? DEFAULT_LAYOUT_SEQUENCE[i] ?? "hero";
                  const isEditingTitle = editing?.idx === i && editing.field === "title";
                  const isEditingSub = editing?.idx === i && editing.field === "sub";
                  const titleFont =
                    brand.id === "miokdang" || brand.id === "seochon-stay"
                      ? "'Nanum Myeongjo', serif"
                      : layoutId === "quote"
                        ? "'Nanum Myeongjo', serif"
                        : undefined;
                  const renderTitle = (extraCls: string) =>
                    isEditingTitle ? (
                      <textarea
                        autoFocus
                        value={s.title}
                        onChange={(ev) => updateField(i, "title", ev.target.value)}
                        onBlur={() => setEditing(null)}
                        onKeyDown={(ev) => { if (ev.key === "Escape") setEditing(null); }}
                        rows={3}
                        className={`w-full ${extraCls} bg-black/50 backdrop-blur text-white p-1 rounded outline-none ring-1 ring-white/50 resize-none`}
                        style={{ fontFamily: titleFont }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditing({ idx: i, field: "title" })}
                        className={`block w-full text-left ${extraCls} whitespace-pre-line drop-shadow-lg hover:bg-black/20 rounded transition-colors`}
                        style={{ fontFamily: titleFont }}
                        title="제목 편집 (Esc 종료)"
                      >
                        {s.title || <span className="opacity-60">제목 추가</span>}
                      </button>
                    );
                  const renderSub = (extraCls: string) =>
                    isEditingSub ? (
                      <input
                        autoFocus
                        value={s.sub}
                        onChange={(ev) => updateField(i, "sub", ev.target.value)}
                        onBlur={() => setEditing(null)}
                        onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === "Escape") setEditing(null); }}
                        className={`w-full ${extraCls} bg-black/50 backdrop-blur text-white px-1 py-0.5 rounded outline-none ring-1 ring-white/50`}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditing({ idx: i, field: "sub" })}
                        className={`block w-full text-left ${extraCls} drop-shadow hover:opacity-100 hover:bg-black/20 rounded transition-all`}
                        title="부제 편집"
                      >
                        {s.sub || <span className="opacity-60">부제</span>}
                      </button>
                    );
                  const meta = img.status === "ready" && img.meta && (img.meta.latencyMs || img.meta.costKrw) ? (
                    <div className="mt-1.5 flex items-center gap-1 text-[8px] uppercase tracking-wider text-white/75">
                      {img.meta.latencyMs ? <span>{(img.meta.latencyMs / 1000).toFixed(1)}s</span> : null}
                      {img.meta.costKrw ? <span>· ₩{img.meta.costKrw}</span> : null}
                      {img.meta.photographer ? <span className="truncate">· {img.meta.photographer}</span> : null}
                    </div>
                  ) : null;

                  // ── COVER — 잡지 표지 (Cormorant Garamond display) ──
                  if (layoutId === "cover") {
                    return (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-7 sm:px-6 text-white">
                        {/* 작은 운영자 라벨 - 톤 강조 */}
                        <div className="cardnews-label-uppercase text-[10px] sm:text-[9px] text-white/75 mb-3">
                          {brand.industryLabel} · {brand.city}
                        </div>
                        {/* 큰 표지 타이틀 — Cormorant Garamond italic */}
                        {renderTitle("cardnews-title-display text-[32px] sm:text-[30px] md:text-[36px] leading-[1.05]")}
                        {/* 가는 디바이더 */}
                        <div className="cardnews-divider w-12 my-3.5" />
                        <div className="w-full max-w-[85%] sm:max-w-[80%]">
                          {renderSub("text-[14px] sm:text-[13px] text-white/85 leading-snug line-clamp-2")}
                        </div>
                        {meta && <div className="absolute bottom-3 right-3">{meta}</div>}
                      </div>
                    );
                  }
                  // ── QUOTE — 잡지 인용 (큰 curly quote + 명조체) ──
                  if (layoutId === "quote") {
                    const isEditingBody = editing?.idx === i && editing.field === "body";
                    const isEditingFooter = editing?.idx === i && editing.field === "footer";
                    return (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-7 sm:px-6 text-white">
                        {/* 매거진 sized opening curly quote */}
                        <div className="cardnews-title-display text-[76px] sm:text-[68px] md:text-[72px] leading-[0.65] text-white/40 mb-3 select-none">
                          &ldquo;
                        </div>
                        {isEditingBody ? (
                          <textarea
                            autoFocus
                            value={s.body ?? ""}
                            onChange={(ev) => updateField(i, "body", ev.target.value)}
                            onBlur={() => setEditing(null)}
                            onKeyDown={(ev) => { if (ev.key === "Escape") setEditing(null); }}
                            rows={3}
                            className="cardnews-quote w-[90%] text-[20px] sm:text-[18px] md:text-[19px] bg-black/50 backdrop-blur text-white p-1.5 rounded outline-none ring-1 ring-white/50 resize-none text-center"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditing({ idx: i, field: "body" })}
                            className="cardnews-quote text-[20px] sm:text-[18px] md:text-[19px] max-w-[90%] sm:max-w-[88%] whitespace-pre-line drop-shadow-lg hover:bg-white/5 rounded transition-colors px-2"
                            title="인용 편집"
                          >
                            {s.body || s.title || <span className="opacity-60 not-italic">인용 추가</span>}
                          </button>
                        )}
                        <div className="cardnews-divider w-10 my-3.5" />
                        {isEditingFooter ? (
                          <input
                            autoFocus
                            value={s.footer ?? ""}
                            onChange={(ev) => updateField(i, "footer", ev.target.value)}
                            onBlur={() => setEditing(null)}
                            onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === "Escape") setEditing(null); }}
                            className="cardnews-label-uppercase w-[70%] text-[11px] sm:text-[10px] bg-black/50 backdrop-blur text-white px-1.5 py-1 rounded outline-none ring-1 ring-white/50 text-center"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditing({ idx: i, field: "footer" })}
                            className="cardnews-label-uppercase text-[11px] sm:text-[10px] text-white/85 hover:text-white transition-colors px-1"
                            title="발언 주체 편집"
                          >
                            {s.footer || s.sub || <span className="opacity-60 normal-case tracking-normal">— 발언 주체</span>}
                          </button>
                        )}
                        {meta && <div className="absolute bottom-3 right-3">{meta}</div>}
                      </div>
                    );
                  }
                  // ── LIST — 매거진 메뉴 리스트 (oldstyle numerals + 명조 타이틀) ──
                  if (layoutId === "list") {
                    const items = s.items ?? [];
                    return (
                      <>
                        <div className="absolute top-14 left-6 right-6 sm:left-5 sm:right-5 text-white">
                          {renderTitle("cardnews-title-serif text-[23px] sm:text-[20px] md:text-[22px] leading-tight")}
                          <div className="mt-1.5">{renderSub("text-[12.5px] sm:text-[11px] text-white/80 leading-snug line-clamp-1")}</div>
                          <div className="cardnews-divider w-10 mt-3" />
                        </div>
                        <div className="absolute left-6 right-6 sm:left-5 sm:right-5 bottom-6 text-white">
                          <ul className="space-y-3 sm:space-y-2.5">
                            {items.slice(0, 5).map((it, k) => {
                              const editingItem =
                                editing?.idx === i && editing.field === "item" && editing.itemIdx === k;
                              return (
                                <li key={k} className="text-[14.5px] sm:text-[13px] leading-snug flex items-baseline gap-3 drop-shadow">
                                  <span className="cardnews-numeral text-[20px] sm:text-[18px] text-white/70 shrink-0 leading-none w-6 text-right">
                                    {String(k + 1).padStart(2, "0")}
                                  </span>
                                  {editingItem ? (
                                    <input
                                      autoFocus
                                      value={it}
                                      onChange={(ev) => updateItem(i, k, ev.target.value)}
                                      onBlur={() => setEditing(null)}
                                      onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === "Escape") setEditing(null); }}
                                      className="flex-1 bg-black/50 backdrop-blur text-white px-1.5 py-0.5 rounded outline-none ring-1 ring-white/50 text-[14.5px] sm:text-[13px]"
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setEditing({ idx: i, field: "item", itemIdx: k })}
                                      className="flex-1 text-left line-clamp-1 hover:bg-white/5 rounded transition-colors px-1"
                                      title={`항목 ${k + 1} 편집`}
                                    >
                                      {it}
                                    </button>
                                  )}
                                </li>
                              );
                            })}
                            {items.length === 0 && (
                              <li className="text-[12px] sm:text-[11px] opacity-60">리스트 항목 (자동 생성 또는 직접 입력)</li>
                            )}
                          </ul>
                          {meta}
                        </div>
                      </>
                    );
                  }
                  // ── PROCESS — 매거진 단계 (세로 흐름, oldstyle numerals) ──
                  if (layoutId === "process") {
                    const items = s.items ?? [];
                    return (
                      <>
                        <div className="absolute top-14 left-6 right-6 sm:left-5 sm:right-5 text-white">
                          {renderTitle("cardnews-title-serif text-[23px] sm:text-[20px] md:text-[22px] leading-tight")}
                          <div className="mt-1.5">{renderSub("text-[12.5px] sm:text-[11px] text-white/80 leading-snug line-clamp-1")}</div>
                          <div className="cardnews-divider w-10 mt-3" />
                        </div>
                        <div className="absolute left-6 right-6 sm:left-5 sm:right-5 bottom-6 text-white">
                          <ol className="space-y-3 sm:space-y-2.5">
                            {items.slice(0, 4).map((it, k) => {
                              const editingItem =
                                editing?.idx === i && editing.field === "item" && editing.itemIdx === k;
                              return (
                                <li key={k} className="flex items-start gap-3 drop-shadow">
                                  <span className="cardnews-numeral text-[20px] sm:text-[18px] text-white/70 leading-none mt-0.5 shrink-0 w-6">
                                    {String(k + 1).padStart(2, "0")}
                                  </span>
                                  {editingItem ? (
                                    <input
                                      autoFocus
                                      value={it}
                                      onChange={(ev) => updateItem(i, k, ev.target.value)}
                                      onBlur={() => setEditing(null)}
                                      onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === "Escape") setEditing(null); }}
                                      className="flex-1 text-[14.5px] sm:text-[13px] bg-black/50 backdrop-blur text-white px-1.5 py-0.5 rounded outline-none ring-1 ring-white/50"
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setEditing({ idx: i, field: "item", itemIdx: k })}
                                      className="flex-1 text-left text-[14.5px] sm:text-[13px] leading-snug hover:bg-white/5 rounded transition-colors px-1"
                                      title={`단계 ${k + 1} 편집`}
                                    >
                                      {it}
                                    </button>
                                  )}
                                </li>
                              );
                            })}
                            {items.length === 0 && (
                              <li className="text-[12px] sm:text-[11px] opacity-60">단계 항목 (자동 생성)</li>
                            )}
                          </ol>
                          {meta}
                        </div>
                      </>
                    );
                  }
                  // ── CTA — 잡지 마무리 (큰 display 타이틀 + 디바이더 + 운영 정보) ──
                  if (layoutId === "cta") {
                    const isEditingFooter = editing?.idx === i && editing.field === "footer";
                    return (
                      <div className="absolute inset-x-0 bottom-0 px-7 pb-7 sm:px-6 sm:pb-6 text-center text-white">
                        {renderTitle("cardnews-title-display text-[28px] sm:text-[26px] md:text-[28px] leading-[1.05]")}
                        <div className="mt-2.5">{renderSub("text-[14px] sm:text-[12.5px] md:text-[13px] text-white/85 leading-snug line-clamp-2")}</div>
                        <div className="cardnews-divider w-12 mx-auto my-3.5" />
                        {isEditingFooter ? (
                          <input
                            autoFocus
                            value={s.footer ?? ""}
                            onChange={(ev) => updateField(i, "footer", ev.target.value)}
                            onBlur={() => setEditing(null)}
                            onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === "Escape") setEditing(null); }}
                            className="cardnews-label-uppercase w-[80%] text-[11px] sm:text-[10px] bg-black/50 backdrop-blur text-white px-1.5 py-1 rounded outline-none ring-1 ring-white/50 text-center"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditing({ idx: i, field: "footer" })}
                            className="cardnews-label-uppercase inline-block text-[11px] sm:text-[10px] text-white/80 hover:text-white transition-colors px-1"
                            title="운영 정보 편집"
                          >
                            {s.footer || <span className="opacity-60 normal-case tracking-normal">운영 안내 추가</span>}
                          </button>
                        )}
                        {meta && <div className="absolute bottom-3 right-3">{meta}</div>}
                      </div>
                    );
                  }
                  // ── HERO (default) — 잡지 분위기 컷 (하단 큰 명조 타이틀) ──
                  return (
                    <div className="absolute bottom-6 left-6 right-6 sm:left-5 sm:right-5 text-white">
                      {renderTitle("cardnews-title-serif text-[24px] sm:text-[19px] md:text-[21px] leading-[1.15]")}
                      <div className="mt-2 sm:mt-1.5">{renderSub("text-[13px] sm:text-[11px] text-white/85 leading-snug line-clamp-2")}</div>
                      <div className="cardnews-divider w-8 mt-3" />
                      {meta}
                    </div>
                  );
                })()}

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      toggleApprove(i);
                    }}
                    className={`text-[8px] font-semibold uppercase tracking-widest backdrop-blur px-1.5 py-1 rounded inline-flex items-center gap-1 ${
                      approved[i]
                        ? "text-white bg-emerald-700 hover:bg-emerald-800"
                        : "text-white/95 bg-white/15 hover:bg-white/30"
                    }`}
                    title={approved[i] ? "승인 취소" : "이 슬라이드 승인"}
                  >
                    <Check className="h-2.5 w-2.5" />
                    {approved[i] ? " 승인됨" : " 승인"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onUploadOneClick(i);
                    }}
                    className="text-[8px] font-semibold uppercase tracking-widest text-white/95 bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur px-1.5 py-1 rounded inline-flex items-center gap-1 disabled:opacity-50"
                    title="이 슬라이드 사진 직접 업로드"
                  >
                    <Upload className="h-2.5 w-2.5" /> 업로드
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      regenerateOne(i);
                    }}
                    className="text-[8px] font-semibold uppercase tracking-widest text-white/95 bg-black/60 hover:bg-black/80 backdrop-blur px-1.5 py-1 rounded inline-flex items-center gap-1 disabled:opacity-50"
                    title="이 슬라이드만 재생성"
                  >
                    <RefreshCw className="h-2.5 w-2.5" /> 재생성
                  </button>
                </div>

                {/* ★ 3개 후보 + 업로드 — 호버 시 하단 중앙에 작게 노출 (슬라이드 내부) */}
                {img.status === "ready" && img.candidates && img.candidates.length > 0 && (
                  <div className="absolute inset-x-0 bottom-0 p-1.5 flex items-center justify-center gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/70 to-transparent">
                    {img.candidates.slice(0, 3).map((cand, k) => {
                      const isActive = cand.url === img.url;
                      return (
                        <button
                          key={cand.photoId ?? k}
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setImages((prev) =>
                              prev.map((s, j) =>
                                j === i
                                  ? {
                                      ...s,
                                      url: cand.url,
                                      source: "pexels",
                                      meta: { ...(s.meta ?? {}), photographer: cand.photographer },
                                    }
                                  : s,
                              ),
                            );
                            toast.success(`슬라이드 ${i + 1} · 변형 ${k + 1} 적용`);
                          }}
                          className={`relative h-8 w-8 rounded overflow-hidden ring-2 transition-all ${
                            isActive
                              ? "ring-violet-400"
                              : "ring-white/40 hover:ring-white"
                          }`}
                          title={`변형 ${k + 1}${cand.photographer ? ` · ${cand.photographer}` : ""}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={cand.url} alt={`변형 ${k + 1}`} className="h-full w-full object-cover" />
                          {isActive && (
                            <div className="absolute inset-0 grid place-items-center bg-violet-500/40">
                              <Check className="h-3 w-3 text-white drop-shadow" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onUploadOneClick(i);
                      }}
                      className="h-8 w-8 rounded ring-2 ring-dashed ring-white/60 hover:ring-emerald-300 hover:bg-emerald-500/20 grid place-items-center text-white/90 hover:text-emerald-200 transition-colors disabled:opacity-50"
                      title="내 사진 직접 업로드"
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {/* Free 워터마크 — Pro 이상 자동 숨김 */}
                <Watermark position="bottom-left" variant="light" />
              </motion.article>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-zinc-500 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            슬라이드 호버 = 업로드/재생성/승인
          </span>
          <span className="inline-flex items-center gap-1">
            <Pencil className="h-3 w-3" />
            라벨·제목·부제 클릭 = 인라인 편집
          </span>
          <span className="inline-flex items-center gap-1 ml-auto">
            <ClipboardCheck className="h-3 w-3" />
            승인 {approvedCount}/{slides.length}
          </span>
        </div>
      </Card>

      {/* Actions + Tone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
            <h3 className="text-sm font-semibold">검수 결과</h3>
            <Button variant="outline" size="sm" onClick={runFactCheck}>
              <ShieldCheck className="h-3.5 w-3.5" />사실 확인
            </Button>
          </div>
          <p className="text-[11px] text-zinc-500 mb-4">
            {brand.name} 톤 v{brand.toneVersion} · 금지어 {detail?.forbiddenWords.length ?? 0}개 · 필수어 {detail?.preferredWords.length ?? 0}개
          </p>

          <ul className="space-y-2 text-xs">
            {factCheck === null ? (
              <li className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800">
                <span className="h-5 w-5 rounded bg-zinc-100 dark:bg-zinc-800 grid place-items-center text-zinc-500 font-bold text-[10px]">i</span>
                <span className="flex-1 text-zinc-600 dark:text-zinc-400">
                  &quot;사실 확인&quot; 버튼을 눌러 금지어/표현 검사를 실행하세요
                </span>
              </li>
            ) : factCheck.length === 0 ? (
              <>
                <li className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="h-5 w-5 rounded bg-emerald-100 dark:bg-emerald-500/20 grid place-items-center text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                    ✓
                  </span>
                  <span className="flex-1">금지어 검사 통과 ({detail?.forbiddenWords.length ?? 0}개 단어 모두 검출 안됨)</span>
                </li>
                <li className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="h-5 w-5 rounded bg-emerald-100 dark:bg-emerald-500/20 grid place-items-center text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                    ✓
                  </span>
                  <span className="flex-1">컬러 팔레트 일관성 (6 컬러 모두 적용)</span>
                </li>
              </>
            ) : (
              factCheck.map((issue, k) => (
                <li
                  key={`${issue.slide}-${issue.word}-${k}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-rose-50/40 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-900/40"
                >
                  <span className="h-5 w-5 rounded bg-rose-100 dark:bg-rose-500/20 grid place-items-center text-rose-700 dark:text-rose-400 font-bold text-[10px]">
                    !
                  </span>
                  <span className="flex-1">
                    슬라이드 {issue.slide}장 — 금지어 검출:{" "}
                    <span className="font-semibold text-rose-700 dark:text-rose-300">{issue.word}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setEditing({ idx: issue.slide - 1, field: "title" })}
                  >
                    수정
                  </Button>
                </li>
              ))
            )}
          </ul>

          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={onPublish}>
              <Send className="h-3.5 w-3.5" />인스타에 발행
              <span className="ml-1 text-[10px] opacity-80">({approvedCount}/{slides.length})</span>
            </Button>
            <Button variant="outline" size="sm" onClick={approveAll}>
              <Check className="h-3.5 w-3.5" />전체 승인
            </Button>
            <Button variant="outline" size="sm" onClick={rejectAll}>
              <X className="h-3.5 w-3.5" />전체 반려
            </Button>
            <Button variant="outline" size="sm" onClick={onQueue}>
              예약 큐에 추가
            </Button>
            <Button variant="ghost" size="sm" onClick={onDownload}>
              <Download className="h-3.5 w-3.5" />ZIP 다운로드
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3">{brand.name} 컬러</h3>
          <div className="grid grid-cols-3 gap-2">
            {colors.map((c) => (
              <div key={c.hex}>
                <div className="aspect-square rounded-lg border border-zinc-100 dark:border-zinc-800" style={{ background: c.hex }} />
                <div className="mt-1 text-[10px] font-medium truncate">{c.name}</div>
                <div className="text-[9px] text-zinc-500 tabular-nums">{c.hex}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Badge tone="violet">{SOURCE_LABEL[source].label}</Badge>
            <p className="mt-2 text-[10px] text-zinc-500">{SOURCE_LABEL[source].sub}</p>
          </div>
        </Card>
      </div>

      {/* 다음 단계 — 발행 예약 */}
      <div className="mt-5">
        <NextStepCard />
      </div>

      {/* 한도 도달 모달 — 사장님이 Free 한도 막혔을 때만 */}
      <LimitReachedModal
        open={limitModal !== null}
        kind={limitModal ?? "cardnews"}
        onClose={() => setLimitModal(null)}
      />
    </div>
  );
}

// 사용량 인디케이터 — Free 카드뉴스 한도 도달 트리거. 한도 있는 플랜에서만 노출.
function UsageStrip({
  planName,
  used,
  limit,
  onUpgrade,
}: {
  planName: string;
  used: number;
  limit: number;
  onUpgrade: () => void;
}) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const remaining = Math.max(0, limit - used);
  const isNear = used >= limit - 1;
  return (
    <div className="mb-3 px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40">
      {/* 모바일: 두 줄 — 라벨/카운터/CTA 한 줄, 프로그레스+남음 한 줄 */}
      <div className="flex items-center gap-3 sm:hidden">
        <span className="text-[10px] tracking-[0.12em] uppercase text-zinc-500 truncate">
          {planName} · 이번 달
        </span>
        <span className="tabular-nums text-[12px] text-zinc-900 dark:text-zinc-100 shrink-0">
          {used} <span className="text-zinc-400">/ {limit}편</span>
        </span>
        <button
          type="button"
          onClick={onUpgrade}
          className="ml-auto text-[10.5px] tracking-[0.1em] uppercase text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 decoration-[0.5px] shrink-0"
        >
          무제한 →
        </button>
      </div>
      <div className="mt-2 flex items-center gap-3 sm:hidden">
        <div className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className={cn("h-full transition-all", isNear ? "bg-amber-500" : "bg-emerald-500")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] text-zinc-500 tabular-nums shrink-0">{remaining}편 남음</span>
      </div>

      {/* 데스크탑(sm+): 한 줄 */}
      <div className="hidden sm:flex items-center gap-3">
        <span className="text-[10px] tracking-[0.12em] uppercase text-zinc-500">{planName} · 이번 달 카드뉴스</span>
        <span className="tabular-nums text-[12px] text-zinc-900 dark:text-zinc-100">
          {used} <span className="text-zinc-400">/ {limit}편</span>
        </span>
        <div className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className={cn("h-full transition-all", isNear ? "bg-amber-500" : "bg-emerald-500")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] text-zinc-500">{remaining}편 남음</span>
        <button
          type="button"
          onClick={onUpgrade}
          className="text-[10.5px] tracking-[0.1em] uppercase text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 decoration-[0.5px]"
        >
          무제한으로 →
        </button>
      </div>
    </div>
  );
}

// 브랜드 + 슬라이드 → gpt-image-1 / Codex 용 매거진 품질 영문 프롬프트
function buildImagePrompt(
  brandId: string,
  industryLabel: string,
  campaign: string,
  slide: SlideCopy,
  slideIdx: number,
  primaryHex?: string,
): string {
  const mood = MOOD_BY_BRAND[brandId] ?? MOOD_BY_BRAND.miokdang;
  const composition = SLIDE_COMPOSITION[slideIdx % SLIDE_COMPOSITION.length];
  const colorDirective = primaryHex
    ? `Color palette anchored on ${primaryHex}, harmonised desaturated tones. `
    : "";
  return [
    `Editorial magazine photograph for a ${industryLabel} brand. ${mood}.`,
    `Reference aesthetic: Kinfolk, Cereal Magazine, Wallpaper*, Vogue Korea 2025 spread.`,
    `Composition: ${composition}. Vertical 9:16 portrait. Rule of thirds with intentional negative space for headline overlay (top or bottom 30%).`,
    `${colorDirective}Soft directional natural light, subtle film grain, cinematic depth of field f/1.8–f/2.8. Muted, sophisticated palette — no saturated cartoon colors.`,
    `Subject: ${slide.label} — ${slide.title.replace(/\n/g, " ")} (${slide.sub}). Campaign context: ${campaign}.`,
    `Strictly avoid: stock-photo cliché, white isolated background, harsh on-camera flash, oversaturated HDR, generic faces looking at camera, logos, on-image text/typography.`,
    `Aim for: 2025 editorial photography quality, intentional, restrained, like a real human photographer's portfolio shot.`,
  ].join(" ");
}

const MOOD_BY_BRAND: Record<string, string> = {
  miokdang:
    "Refined Korean traditional fine dining (한정식). Warm clay-earth tones, aged ceramic ware, dark walnut and brass accents, hanok ambience. Intimate omakase-counter mood. Think: Noma Korea, Park's Tokyo. Avoid touristy hanbok and red lanterns.",
  "roastery-1985":
    "Specialty third-wave coffee bar. Warm amber-stone palette, exposed brick, brushed steel, dark walnut counters. Pour-over rituals, beans cooling, condensation on cold-brew glass. Reference: Blue Bottle, Coffee Libre, Onibus aesthetic.",
  "seochon-stay":
    "Traditional Korean hanok stay. Wooden lattice doors (살창), white hanji paper, polished wood floor, courtyard with single tree. Wabi-sabi minimalism, dawn light filtering through paper. Reference: ryokan Kyoto + Seochon hanok crossover.",
  "dolce-dessert":
    "Boutique patisserie with pastel sophistication — not cute, but elegant. Soft blush, ivory, dusty rose. Marble countertop, satin ribbon, single rose. Fresh fruit cross-sections under daylight window. Reference: Cédric Grolet, Maison Pic plating.",
  "luna-hair":
    "Modern minimal hair salon, lifestyle editorial. Glossy hair detail macro, brush strokes, color swatches laid out. Soft window light, brushed concrete, single fresh flower. Reference: Aveda campaign + Korean idol hair editorial 2025.",
  "forum-fashion":
    "High-end minimal fashion editorial. Off-white, deep charcoal, oat linen, ecru. Concrete or oak floor, gallery-white wall, single garment on hanger. Soft north-facing window light. Reference: The Row, Jil Sander, Lemaire campaign 2025.",
};
