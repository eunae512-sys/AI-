"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Sparkles, Loader2, Copy, Check, FileText, MapPin, Image as ImageIcon, Wand2, Search, TrendingUp, X, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";
import { getBrandDetail } from "@/lib/dummy/brand-detail";
import { cn } from "@/lib/utils";
import { useAutoSaveDraft, formatSavedAt } from "@/lib/drafts/auto-save";
import { getSeasonContext, type SeasonKey } from "@/lib/content/season";

type Topic = { title: string; keywords: string[]; intent: string };

// 업종 × 시즌 추천 주제. 현재 KST 계절에 맞춰 자동 선택된다(getSeasonContext).
// 시기 표현은 해당 계절에만. 가짜 수치·통계 금지(정직성).
const SEASONAL_TOPICS: Record<string, Record<SeasonKey, Topic[]>> = {
  restaurant: {
    spring: [
      { title: "봄나물 코스 — 강남 제철 한 상", keywords: ["봄나물 한정식", "강남 봄정식"], intent: "시즌 정보" },
      { title: "상견례 봄 코스 — 강남 룸 예약 가이드", keywords: ["강남 상견례 한정식", "상견례 룸"], intent: "예약 전환" },
      { title: "한정식 1인 가격대별 추천", keywords: ["한정식 1인 가격", "강남 한정식 추천"], intent: "비교/리뷰" },
    ],
    summer: [
      { title: "여름 보양 한 상 — 강남 제철 코스", keywords: ["여름 보양식 강남", "복날 한정식"], intent: "시즌 정보" },
      { title: "냉(冷) 메뉴가 있는 한정식 — 더위 식히는 한 상", keywords: ["여름 한정식", "강남 시원한 한식"], intent: "시즌 가이드" },
      { title: "한정식 1인 가격대별 추천", keywords: ["한정식 1인 가격", "강남 한정식 추천"], intent: "비교/리뷰" },
    ],
    autumn: [
      { title: "가을 제철 코스 — 버섯·전어 한 상", keywords: ["가을 한정식", "강남 제철 코스"], intent: "시즌 정보" },
      { title: "추석 상차림 예약 가이드 — 강남 룸 추천", keywords: ["추석 한정식 강남", "명절 상차림"], intent: "예약 전환" },
      { title: "한정식 1인 가격대별 추천", keywords: ["한정식 1인 가격", "강남 한정식 추천"], intent: "비교/리뷰" },
    ],
    winter: [
      { title: "겨울 따뜻한 한 상 — 국물·전골 코스", keywords: ["겨울 한정식", "강남 전골 코스"], intent: "시즌 정보" },
      { title: "연말 모임 한정식 — 강남 단체 룸 가이드", keywords: ["연말 모임 한정식", "강남 단체 룸"], intent: "예약 전환" },
      { title: "한정식 1인 가격대별 추천", keywords: ["한정식 1인 가격", "강남 한정식 추천"], intent: "비교/리뷰" },
    ],
  },
  cafe: {
    spring: [
      { title: "봄 한정 시즌 음료 — 우리가 고른 향", keywords: ["봄 시즌 음료", "서촌 카페"], intent: "시즌 한정" },
      { title: "서촌 봄 산책 후 들르기 좋은 자리", keywords: ["서촌 카페", "서촌 봄 나들이"], intent: "지역 가이드" },
      { title: "에티오피아 예가체프 — 우리가 고른 농장", keywords: ["예가체프 원두 추천", "스페셜티 원두"], intent: "산지 스토리" },
    ],
    summer: [
      { title: "콜드브루 추출 비율 — 집에서 따라하는 법", keywords: ["콜드브루 추출법", "콜드브루"], intent: "HowTo 정보" },
      { title: "여름 아이스 메뉴 — 우리가 권하는 한 잔", keywords: ["여름 아이스 음료", "서촌 카페"], intent: "시즌 가이드" },
      { title: "서촌 작업 카페 — 콘센트·와이파이 자리", keywords: ["서촌 작업 카페", "서촌 카페"], intent: "지역 비교" },
    ],
    autumn: [
      { title: "가을 원두 — 깊은 바디의 한 잔", keywords: ["가을 원두 추천", "스페셜티 원두"], intent: "산지 스토리" },
      { title: "서촌 단풍 산책 후 들르기 좋은 카페", keywords: ["서촌 카페", "서촌 가을 나들이"], intent: "지역 가이드" },
      { title: "핸드드립 — 집에서 맛 살리는 법", keywords: ["핸드드립 방법", "원두"], intent: "HowTo 정보" },
    ],
    winter: [
      { title: "겨울 따뜻한 라떼 — 우리가 데우는 우유 온도", keywords: ["겨울 라떼", "서촌 카페"], intent: "시즌 가이드" },
      { title: "겨울 원두 블렌드 — 진하고 단단한 한 잔", keywords: ["겨울 원두 추천", "스페셜티 원두"], intent: "산지 스토리" },
      { title: "서촌 작업 카페 — 콘센트·와이파이 자리", keywords: ["서촌 작업 카페", "서촌 카페"], intent: "지역 비교" },
    ],
  },
  dessert: {
    spring: [
      { title: "봄 딸기 디저트 — 제철 한 접시", keywords: ["봄 딸기 케이크", "성수동 디저트"], intent: "시즌 한정" },
      { title: "벚꽃 시즌 선물 디저트 — 포장 추천", keywords: ["봄 디저트 선물", "성수동 디저트"], intent: "선물 가이드" },
      { title: "비건 케이크 — 맛·알러지 비교", keywords: ["비건 케이크 서울", "성수동 디저트"], intent: "비교" },
    ],
    summer: [
      { title: "여름 빙수 — 제철 과일로 올린 한 그릇", keywords: ["여름 빙수", "성수동 디저트"], intent: "시즌 한정" },
      { title: "수박 케이크 — 농장 직거래 한 통", keywords: ["수박 케이크", "성수 디저트"], intent: "시즌 한정" },
      { title: "여름 디저트 가이드 — 시원함·당도로 고르기", keywords: ["여름 디저트 추천"], intent: "시즌 가이드" },
    ],
    autumn: [
      { title: "가을 밤·단호박 디저트 — 제철 한 접시", keywords: ["가을 디저트", "밤 케이크"], intent: "시즌 한정" },
      { title: "마롱·고구마 라떼와 어울리는 구움과자", keywords: ["가을 구움과자", "성수동 디저트"], intent: "페어링" },
      { title: "비건 케이크 — 맛·알러지 비교", keywords: ["비건 케이크 서울", "성수동 디저트"], intent: "비교" },
    ],
    winter: [
      { title: "겨울 따뜻한 디저트 — 데워 먹는 한 접시", keywords: ["겨울 디저트", "성수동 디저트"], intent: "시즌 한정" },
      { title: "연말 선물 케이크 — 포장·예약 가이드", keywords: ["연말 케이크 예약", "성수동 디저트"], intent: "선물 가이드" },
      { title: "비건 케이크 — 맛·알러지 비교", keywords: ["비건 케이크 서울", "성수동 디저트"], intent: "비교" },
    ],
  },
  stay: {
    spring: [
      { title: "봄꽃 산책 코스 — 도보 10분 동선", keywords: ["북촌 산책 코스", "북촌 한옥스테이"], intent: "동네 가이드" },
      { title: "봄나들이 한옥 1박 — 마당에 햇살 드는 방", keywords: ["봄 한옥스테이", "서울 전통 숙소"], intent: "시즌 가이드" },
      { title: "객실 비교 — 마루·창호·온돌 디테일", keywords: ["서울 전통 숙소"], intent: "객실 비교" },
    ],
    summer: [
      { title: "여름 휴가 한옥 1박 — 더위 피하는 마루·바람길", keywords: ["여름 한옥스테이", "여름 휴가 숙소"], intent: "시즌 가이드" },
      { title: "장마철 빗소리 한옥 1박 — 마루에서 듣는 비", keywords: ["장마 감성 스테이", "북촌 한옥스테이"], intent: "시즌 가이드" },
      { title: "객실 비교 — 마루·창호·온돌 디테일", keywords: ["서울 전통 숙소"], intent: "객실 비교" },
    ],
    autumn: [
      { title: "단풍 든 한옥 마당 — 가을빛 1박", keywords: ["가을 한옥스테이", "북촌 단풍"], intent: "시즌 가이드" },
      { title: "북촌 가을 산책 코스 — 도보 10분 동선", keywords: ["북촌 산책 코스", "북촌 한옥스테이"], intent: "동네 가이드" },
      { title: "객실 비교 — 마루·창호·온돌 디테일", keywords: ["서울 전통 숙소"], intent: "객실 비교" },
    ],
    winter: [
      { title: "온돌 데운 겨울 한옥 1박 — 따뜻한 방 고르기", keywords: ["겨울 한옥스테이", "온돌 숙소"], intent: "시즌 가이드" },
      { title: "연말 한옥 1박 — 조용히 보내는 마무리", keywords: ["연말 숙소", "북촌 한옥스테이"], intent: "시즌 가이드" },
      { title: "객실 비교 — 마루·창호·온돌 디테일", keywords: ["서울 전통 숙소"], intent: "객실 비교" },
    ],
  },
  beauty: {
    spring: [
      { title: "봄 환절기 두피·헤어 케어 루틴", keywords: ["봄 헤어 관리", "환절기 두피 케어"], intent: "시즌 HowTo" },
      { title: "봄 컬러 — 톤 매칭 가이드", keywords: ["봄 헤어 컬러", "강남 헤어"], intent: "트렌드" },
      { title: "데이트 헤어 — 우리가 픽한 스타일", keywords: ["데이트 헤어", "강남 미용실"], intent: "스타일 가이드" },
    ],
    summer: [
      { title: "장마철 헤어 케어 루틴 — 결 살리는 단계", keywords: ["장마철 헤어 관리", "결 살리는 케어"], intent: "시즌 HowTo" },
      { title: "여름 두피 케어 — 땀·열에 지친 두피 식히기", keywords: ["여름 두피 케어", "강남 헤어"], intent: "시즌 HowTo" },
      { title: "여름 컬러 — 톤 매칭 가이드", keywords: ["여름 헤어 컬러", "강남 헤어"], intent: "트렌드" },
    ],
    autumn: [
      { title: "가을 환절기 빠지는 머리 — 두피 케어 루틴", keywords: ["가을 탈모 관리", "환절기 두피 케어"], intent: "시즌 HowTo" },
      { title: "가을 컬러 — 차분한 톤 매칭 가이드", keywords: ["가을 헤어 컬러", "강남 헤어"], intent: "트렌드" },
      { title: "데이트 헤어 — 우리가 픽한 스타일", keywords: ["데이트 헤어", "강남 미용실"], intent: "스타일 가이드" },
    ],
    winter: [
      { title: "건조한 겨울 두피·헤어 케어 루틴", keywords: ["겨울 두피 케어", "건조 헤어 관리"], intent: "시즌 HowTo" },
      { title: "겨울 컬러 — 깊은 톤 매칭 가이드", keywords: ["겨울 헤어 컬러", "강남 헤어"], intent: "트렌드" },
      { title: "연말 모임 헤어 — 우리가 픽한 스타일", keywords: ["연말 헤어", "강남 미용실"], intent: "스타일 가이드" },
    ],
  },
  local: {
    spring: [
      { title: "봄 룩 — 컬러·실루엣·소재 제안", keywords: ["봄 룩 코디", "컨템포러리 패션"], intent: "스타일 가이드" },
      { title: "Wool × Linen — 우리가 선택한 한 mill", keywords: ["wool linen 블렌드"], intent: "원단 스토리" },
      { title: "한국 컨템포러리 — 소재·핏으로 고르기", keywords: ["한국 디자이너 브랜드"], intent: "브랜드 비교" },
    ],
    summer: [
      { title: "여름 룩 — 린넨·통기성 소재 제안", keywords: ["여름 룩 코디", "린넨 셔츠"], intent: "스타일 가이드" },
      { title: "땀에 강한 여름 원단 — 우리가 고른 소재", keywords: ["여름 원단", "컨템포러리 패션"], intent: "원단 스토리" },
      { title: "한국 컨템포러리 — 소재·핏으로 고르기", keywords: ["한국 디자이너 브랜드"], intent: "브랜드 비교" },
    ],
    autumn: [
      { title: "가을 레이어드 — 컬러·실루엣 제안", keywords: ["가을 룩 코디", "레이어드 코디"], intent: "스타일 가이드" },
      { title: "Wool × Linen — 우리가 선택한 한 mill", keywords: ["wool linen 블렌드"], intent: "원단 스토리" },
      { title: "한국 컨템포러리 — 소재·핏으로 고르기", keywords: ["한국 디자이너 브랜드"], intent: "브랜드 비교" },
    ],
    winter: [
      { title: "겨울 아우터 — 보온·실루엣으로 고르기", keywords: ["겨울 아우터", "코트 추천"], intent: "스타일 가이드" },
      { title: "겨울 니트 소재 — 우리가 선택한 원사", keywords: ["겨울 니트", "원사 스토리"], intent: "원단 스토리" },
      { title: "한국 컨템포러리 — 소재·핏으로 고르기", keywords: ["한국 디자이너 브랜드"], intent: "브랜드 비교" },
    ],
  },
};

// 한국 주요 동/구 이름 — 추천 주제 자동 치환에 사용
const KOREAN_DISTRICTS = [
  "강남구", "강남", "양평", "서촌", "성수동", "성수", "북촌", "종로구", "종로",
  "한남동", "한남", "이태원", "홍대", "압구정", "광화문", "을지로",
];

// brand.city 에 붙은 "구"/"동" 접미사 제거 → 토픽 치환에 쓰기 좋게 정규화
const normalizeCityName = (city: string): string =>
  city.replace(/(구|동|읍|면)$/, "");

// 추천 주제 한 줄에 박힌 지역명을 사장님 가게 도시로 치환.
// 예: "어버이날 한정식 예약 가이드 — 강남 상견례 룸" → 가게가 한남동이면 "— 한남 상견례 룸"
function localizeTopic(title: string, brandCity: string): string {
  const my = normalizeCityName(brandCity);
  if (!my) return title;
  // 사장님 가게가 이미 그 지역이면 변경 X
  if (KOREAN_DISTRICTS.some((d) => my.includes(d) || d.includes(my))) {
    if (title.includes(my)) return title;
  }
  // 타이틀에 등장하는 첫 번째 지역명을 사장님 도시로 치환
  for (const d of KOREAN_DISTRICTS) {
    if (title.includes(d) && d !== my) {
      return title.split(d).join(my);
    }
  }
  return title;
}

// 업종별 본문 톤
const BODY_TONE: Record<string, string> = {
  restaurant: "단정한 존댓말 · 재료의 시간 · 산지 디테일",
  cafe: "한 잔의 리듬 · 산미 · 무드 묘사",
  dessert: "친근한 반말 · 한 입의 감각 · 색감",
  stay: "편지 형식 · 공간의 빛 · 손님 호칭 '머무시는 분'",
  beauty: "자신감 있는 존댓말 · 단계별 · 결과 강조",
  local: "절제된 영문 + 한국어 혼용 · 원단·실루엣",
};

// 블로그 화자 — 3종
type BlogPerspective = "visitor" | "brand-owner" | "brand-curator";

const PERSPECTIVE_OPTIONS: { id: BlogPerspective; label: string; hint: string; example: string }[] = [
  {
    id: "visitor",
    label: "방문 후기",
    hint: "단골 손님이 다녀와서 쓰는 파워블로거 톤",
    example: "오랜만에 친구랑 다녀왔어요. 12시 30분쯤 도착했는데…",
  },
  {
    id: "brand-owner",
    label: "사장님 일기",
    hint: "사장님 본인이 1주 1편 직접 쓰는 칼럼 톤",
    example: "이번 겨울 메뉴를 정할 때 가장 오래 고민한 건 국물의 무게였습니다.",
  },
  {
    id: "brand-curator",
    label: "브랜드 매거진",
    hint: "잡지 기자가 3인칭 평서체로 가게를 소개하는 톤",
    example: "골목 안쪽에 자리한 이 작은 가게는, 도시의 속도에서 한 걸음 비껴 서 있다.",
  },
];

const PERSPECTIVE_STORAGE_PREFIX = "briq:blog-perspective:";

function readSavedPerspective(brandId: string): BlogPerspective {
  if (typeof window === "undefined") return "visitor";
  try {
    const v = localStorage.getItem(PERSPECTIVE_STORAGE_PREFIX + brandId);
    if (v === "visitor" || v === "brand-owner" || v === "brand-curator") return v;
  } catch {
    // 무시
  }
  return "visitor";
}

function savePerspective(brandId: string, p: BlogPerspective) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PERSPECTIVE_STORAGE_PREFIX + brandId, p);
  } catch {
    // 무시
  }
}

export function BlogScreen() {
  const { brand, userBrand } = useBrand();
  const isUserBrand = !!userBrand && brand.id === userBrand.id;
  const toast = useToast();
  const detail = getBrandDetail(brand.id);
  // 현재 KST 계절 — 추천 주제를 시기에 맞게 자동 선택.
  const season = React.useMemo(() => getSeasonContext(), []);
  // 업종 × 현재 시즌 풀 선택 → 사장님 가게 도시로 추천 주제 자동 치환.
  const presets = React.useMemo(() => {
    const byIndustry = SEASONAL_TOPICS[brand.industry] ?? SEASONAL_TOPICS.restaurant;
    const base = byIndustry[season.seasonKey] ?? byIndustry.spring;
    return base.map((p) => ({ ...p, title: localizeTopic(p.title, brand.city) }));
  }, [brand.industry, brand.city, season.seasonKey]);
  const tone = BODY_TONE[brand.industry] ?? BODY_TONE.restaurant;

  const [activePreset, setActivePreset] = React.useState(0);
  const [topic, setTopic] = React.useState(presets[0]?.title ?? "");
  const [body, setBody] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // 화자(perspective) — 방문 후기 / 사장님 일기 / 브랜드 매거진
  const [perspective, setPerspective] = React.useState<BlogPerspective>("visitor");
  React.useEffect(() => {
    setPerspective(readSavedPerspective(brand.id));
  }, [brand.id]);
  const changePerspective = (p: BlogPerspective) => {
    setPerspective(p);
    savePerspective(brand.id, p);
  };

  // SERP 분석 결과 + 진행 상태
  type SerpPost = { rank: number; title: string; bloggerName: string; postDate: string; snippet: string; blogUrl: string };
  type SerpResult = {
    keyword: string;
    posts: SerpPost[];
    avgTitleLen: number;
    avgSnippetLen: number;
    estimatedBodyChars: { min: number; recommended: number; max: number };
    commonTerms: { term: string; count: number }[];
    titlePatterns: string[];
    demoMode: boolean;
  };
  const [serp, setSerp] = React.useState<SerpResult | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [phase, setPhase] = React.useState<"idle" | "analyzing" | "generating">("idle");

  // 자동 저장 — 활성 브랜드 작업 영속화.
  const { lastSavedAt } = useAutoSaveDraft({
    scope: "blog",
    brandId: brand.id,
    value: { topic, body, activePreset },
    onRestore: (draft) => {
      if (typeof draft.topic === "string") setTopic(draft.topic);
      if (typeof draft.body === "string") setBody(draft.body);
      if (typeof draft.activePreset === "number") setActivePreset(draft.activePreset);
    },
  });

  React.useEffect(() => {
    // 브랜드 전환 시: preset·주제·본문·분석 리셋.
    setActivePreset(0);
    setTopic(presets[0]?.title ?? "");
    setBody("");
    setSerp(null);
  }, [brand.id, presets]);

  // presets 가 바뀌어 activePreset 이 범위를 벗어나면 0 으로 보정.
  React.useEffect(() => {
    if (activePreset > presets.length - 1) {
      setActivePreset(0);
      setTopic(presets[0]?.title ?? "");
    }
  }, [presets, activePreset]);

  // 1) 키워드 분석 — 상위 노출 글 패턴 추출
  const analyzeKeyword = async (rawKeyword?: string): Promise<SerpResult | null> => {
    const preset = presets[activePreset];
    const keyword = (rawKeyword ?? preset?.keywords?.[0] ?? topic).trim();
    if (!keyword) {
      toast.warn("분석할 키워드가 없습니다");
      return null;
    }
    setAnalyzing(true);
    setPhase("analyzing");
    try {
      const res = await fetch("/api/analyze-naver-blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();
      if (!data?.ok) {
        toast.warn(`상위 글 분석 실패: ${data?.error ?? "알 수 없음"}`);
        return null;
      }
      const result: SerpResult = {
        keyword: data.analysis?.keyword ?? keyword,
        posts: data.posts ?? [],
        avgTitleLen: data.analysis?.avgTitleLen ?? 0,
        avgSnippetLen: data.analysis?.avgSnippetLen ?? 0,
        estimatedBodyChars: data.analysis?.estimatedBodyChars ?? { min: 1500, recommended: 1800, max: 2400 },
        commonTerms: data.analysis?.commonTerms ?? [],
        titlePatterns: data.analysis?.titlePatterns ?? [],
        demoMode: !!data.demoMode,
      };
      setSerp(result);
      const demoNote = result.demoMode ? " (데모 — NAVER API 키 미설정)" : "";
      toast.success(`"${keyword}" 상위 ${result.posts.length}개 글 분석 완료${demoNote}`);
      return result;
    } catch (e) {
      toast.warn(`상위 글 분석 오류: ${(e as Error).message}`);
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  // 2) 본문 생성 — 분석 결과를 전달 (없으면 그냥 생성)
  const generateBody = async (analysisOverride?: SerpResult | null) => {
    if (!topic.trim()) {
      toast.warn("주제를 입력하거나 추천 카드를 선택해 주세요");
      return;
    }
    if (loading) return;
    setLoading(true);
    setPhase("generating");
    try {
      const preset = presets[activePreset];
      const keywords = preset?.keywords ?? [];
      const userMenu = isUserBrand && userBrand?.signatureMenu
        ? userBrand.signatureMenu.filter(Boolean)
        : [];
      const userTagline = isUserBrand && userBrand?.tagline ? userBrand.tagline : "";
      const analysisToSend = analysisOverride ?? serp;

      const ctxBrandName = brand.name;
      const ctxIndustry = brand.industryLabel;
      const ctxLocation = brand.city;
      const ctxTagline = userTagline;
      const ctxSignature = userMenu.join(", ");

      const res = await fetch("/api/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: ctxBrandName,
          industry: ctxIndustry,
          location: ctxLocation,
          topic,
          tagline: ctxTagline,
          signatureMenu: ctxSignature,
          keywords: keywords.join(", "),
          tone: `${tone}${detail?.toneSummary ? ` · ${detail.toneSummary}` : ""}`,
          perspective,
          forbidden: "100% 보장, 무조건, 만병통치, 완치, 부작용 없음, 최고, 대박, JMT",
          // targetChars 는 생략 — analysis 가 있으면 서버가 추정 분량 자동 채택
          serpAnalysis: analysisToSend
            ? {
                keyword: analysisToSend.keyword,
                avgTitleLen: analysisToSend.avgTitleLen,
                avgSnippetLen: analysisToSend.avgSnippetLen,
                estimatedBodyChars: analysisToSend.estimatedBodyChars,
                commonTerms: analysisToSend.commonTerms,
                titlePatterns: analysisToSend.titlePatterns,
                posts: analysisToSend.posts.slice(0, 5).map((p) => ({
                  rank: p.rank,
                  title: p.title,
                  snippet: p.snippet,
                })),
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.warn(`본문 생성 실패: ${data.error ?? "알 수 없음"} — 폴백 템플릿 사용`);
        const draft = buildDraft({
          topic,
          brandName: brand.name,
          city: brand.city,
          industryLabel: brand.industryLabel,
          keywords,
          tone,
          toneSummary: detail?.toneSummary ?? "",
        });
        setBody(draft);
        return;
      }
      const fullBody = (data.body as string | undefined)?.trim() ?? "";
      if (!fullBody) {
        toast.warn("본문 결과가 비었어요 — 다시 시도");
        return;
      }
      setBody(fullBody);
      const cost = data.meta?.costKrw ?? 0;
      const chars = data.meta?.charCount ?? fullBody.replace(/\s+/g, "").length;
      const demo = data.meta?.demoMode ? " (데모)" : "";
      const expanded = data.meta?.expandedOnce ? " · 자동 확장 1회" : "";
      const serpUsed = analysisToSend ? " · 상위 글 분석 반영" : "";
      const particles = data.meta?.particlesFixed
        ? ` · 조사 보정 ${data.meta.particlesFixed}건`
        : "";
      toast.success(`본문 ${chars}자 생성${expanded}${serpUsed}${particles}${cost ? ` · ₩${cost}` : ""}${demo}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.warn(`본문 생성 오류: ${msg}`);
    } finally {
      setLoading(false);
      setPhase("idle");
    }
  };

  // 통합 핸들러 — "분석 후 본문 생성" 1클릭
  const analyzeAndGenerate = async () => {
    const preset = presets[activePreset];
    const result = await analyzeKeyword(preset?.keywords?.[0]);
    await generateBody(result);
  };

  // 분석 없이 바로 본문만 — 기존 흐름 유지
  const generate = () => generateBody();

  const copyAll = async () => {
    if (!body) return;
    try {
      await navigator.clipboard.writeText(`${topic}\n\n${body}`);
      setCopied(true);
      toast.success("제목 + 본문 복사됨");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.warn("복사 실패");
    }
  };

  // 네이버 블로그 글쓰기로 가기 — 클립보드에 자동 복사 후 새 탭으로 열기.
  // 사장님이 "그래서 어떻게 올리지?" 멈추는 마찰을 한 클릭으로 메움.
  const sendToNaver = async () => {
    if (!body) return;
    try {
      await navigator.clipboard.writeText(`${topic}\n\n${body}`);
      toast.success("본문이 클립보드에 복사됐어요. 네이버 글쓰기에서 Cmd/Ctrl+V 로 붙여넣으세요.");
    } catch {
      // 클립보드 실패해도 새 탭은 열어둠
      toast.info("새 탭이 열렸습니다. 본문은 화면에서 직접 복사해 주세요.");
    }
    // 네이버 블로그 글쓰기 페이지
    window.open("https://blog.naver.com/PostWriteForm.naver", "_blank", "noopener,noreferrer");
  };

  // 같은 주제로 한 번 더 생성 — 사장님이 결과가 마음에 안 들 때.
  const regenerate = async () => {
    if (loading || analyzing) return;
    // serp 는 그대로 두고 본문만 다시. SERP 없으면 그냥 generate.
    await generateBody(serp);
  };

  const wordCount = body.replace(/\s+/g, "").length;
  const seoTarget = 1500;
  const seoPct = Math.min(100, Math.round((wordCount / seoTarget) * 100));

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400 font-semibold">
            NAVER BLOG STUDIO · {brand.name}
          </div>
          <h1 className="mt-2 text-[22px] sm:text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15]">
            네이버 블로그 본문 자동 작성
          </h1>
          <p className="mt-1.5 text-[13px] sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            한국 SEO 핵심 채널 · 본문 1500자+, 자연스러운 키워드 분포, 우리 톤 유지
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Topic presets + input */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" /> 추천 주제
                </h3>
                <div className="mt-0.5 text-[10.5px] text-zinc-400">
                  {season.monthLabel} · {season.seasonLabel} 기준
                </div>
              </div>
              <Badge tone="default">{brand.industryLabel}</Badge>
            </div>
            <div className="space-y-2">
              {presets.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    // 다른 preset 으로 옮길 때 — 이전 주제의 상위글 분석(serp) 과 본문이
                    // 새 prompt 에 침범하지 않도록 깨끗이 정리한다.
                    if (i !== activePreset) {
                      setSerp(null);
                      setBody("");
                    }
                    setActivePreset(i);
                    setTopic(p.title);
                  }}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-all",
                    activePreset === i
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
                      : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                  )}
                >
                  <div className="text-[12.5px] font-medium tracking-tight leading-snug">{p.title}</div>
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    {p.keywords.slice(0, 2).map((k) => (
                      <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {k}
                      </span>
                    ))}
                    <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {p.intent}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-zinc-500" /> 제목 (직접 수정)
            </h3>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              placeholder="제목을 입력하거나 위 추천에서 선택"
              className="w-full text-[13px] px-3 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />

            {/* 화자 선택 — 같은 가게라도 누구 시점인지가 결정적 */}
            <div className="mt-4 border-t border-zinc-100 dark:border-zinc-900 pt-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-600 font-semibold mb-2">
                누가 쓰나
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {PERSPECTIVE_OPTIONS.map((opt) => {
                  const active = opt.id === perspective;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => changePerspective(opt.id)}
                      title={opt.hint}
                      className={cn(
                        "rounded-md border px-2.5 py-2 text-left transition-all",
                        active
                          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100",
                      )}
                    >
                      <div className="text-[12px] font-semibold">{opt.label}</div>
                      <div className={cn("text-[10px] mt-0.5 leading-snug line-clamp-2", active ? "text-white/80 dark:text-zinc-900/70" : "text-zinc-500")}>
                        {opt.hint}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 text-[11px] text-zinc-500 italic line-clamp-2">
                예: {PERSPECTIVE_OPTIONS.find((o) => o.id === perspective)?.example}
              </div>
            </div>

            <div className="mt-3 text-[11px] text-zinc-500 space-y-1">
              <div>톤 가이드: <span className="text-zinc-700 dark:text-zinc-300">{tone}</span></div>
              <div>지역: <span className="text-zinc-700 dark:text-zinc-300">{brand.city}</span></div>
              <div>분석 키워드: <span className="text-violet-700 dark:text-violet-300 font-medium">{presets[activePreset]?.keywords?.[0] ?? topic}</span></div>
            </div>

            {/* 1순위 — 본문 만들기 (네이버 상위 글 분석 포함). 사장님이 가장 자주 누를 버튼. */}
            <Button
              onClick={analyzeAndGenerate}
              disabled={loading || analyzing}
              className="w-full mt-4"
            >
              {phase === "analyzing" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  네이버 상위 글 분석 중...
                </>
              ) : phase === "generating" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  본문 작성 중...
                </>
              ) : (
                <>
                  <TrendingUp className="h-3.5 w-3.5" />
                  본문 만들기 (네이버 노출 분석 포함)
                </>
              )}
            </Button>

            {/* 2순위 — 빠르게 (분석 단계 생략, 10초 내외) */}
            <button
              onClick={generate}
              disabled={loading || analyzing}
              className="w-full mt-2 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50"
            >
              분석 생략하고 빠르게 (10초) →
            </button>
          </Card>

          {/* 상위 글 분석 결과 패널 */}
          {serp && (
            <Card className="p-4 border-violet-200 dark:border-violet-900/40">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Search className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-xs font-semibold truncate">
                    "{serp.keyword}" 상위 글 분석
                  </span>
                  {serp.demoMode && <Badge tone="amber">데모</Badge>}
                </div>
                <button
                  onClick={() => setSerp(null)}
                  className="text-zinc-400 hover:text-rose-600"
                  aria-label="분석 결과 제거"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-md bg-zinc-50 dark:bg-zinc-900 px-2 py-1.5 text-center">
                  <div className="text-[9px] text-zinc-500">상위 글 수</div>
                  <div className="text-sm font-semibold">{serp.posts.length}</div>
                </div>
                <div className="rounded-md bg-zinc-50 dark:bg-zinc-900 px-2 py-1.5 text-center">
                  <div className="text-[9px] text-zinc-500">제목 평균</div>
                  <div className="text-sm font-semibold">{serp.avgTitleLen}자</div>
                </div>
                <div className="rounded-md bg-violet-50 dark:bg-violet-500/10 px-2 py-1.5 text-center">
                  <div className="text-[9px] text-violet-600 dark:text-violet-400">목표 분량</div>
                  <div className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                    ~{serp.estimatedBodyChars.recommended}자
                  </div>
                </div>
              </div>

              {serp.commonTerms.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                    공통 키워드 (LSI)
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {serp.commonTerms.slice(0, 8).map((t) => (
                      <span
                        key={t.term}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300"
                      >
                        {t.term} <span className="text-violet-500/70">×{t.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {serp.titlePatterns.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                    제목 패턴
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {serp.titlePatterns.map((p) => (
                      <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                상위 5개 제목
              </div>
              <ol className="space-y-1">
                {serp.posts.slice(0, 5).map((p) => (
                  <li key={p.rank} className="text-[11px] leading-snug">
                    <a
                      href={p.blogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-violet-700 dark:hover:text-violet-300 line-clamp-2"
                    >
                      <span className="text-zinc-400 tabular-nums mr-1">{p.rank}.</span>
                      {p.title}
                    </a>
                  </li>
                ))}
              </ol>

              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-500">
                이 분석을 시스템 프롬프트에 주입해 본문이 작성됩니다. 분량·LSI 키워드 자동 반영.
              </div>
            </Card>
          )}
        </div>

        {/* Right: Generated body */}
        <Card className="lg:col-span-3 p-5 flex flex-col min-h-[520px]">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-500" /> 본문 · Naver Blog
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 tabular-nums">
                {wordCount.toLocaleString()}자
                <span className="text-zinc-400 mx-1">·</span>
                SEO {seoPct}%
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ {formatSavedAt(lastSavedAt)}
              </span>
              <button
                onClick={regenerate}
                disabled={!body || loading || analyzing}
                title="같은 주제로 본문만 다시"
                className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-40"
              >
                <Wand2 className="h-3 w-3" />
                한 번 더
              </button>
              <button
                onClick={copyAll}
                disabled={!body}
                className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-40"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? "복사됨" : "복사"}
              </button>
              <button
                onClick={sendToNaver}
                disabled={!body}
                title="클립보드에 복사 + 네이버 블로그 글쓰기 열기"
                className="text-[11px] inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#03C75A] text-white hover:bg-[#02B850] disabled:opacity-40 disabled:hover:bg-[#03C75A] font-medium"
              >
                <Send className="h-3 w-3" />
                네이버 글쓰기로
              </button>
            </div>
          </div>

          {/* SEO 진행도 바 */}
          <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
              animate={{ width: `${seoPct}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
            />
          </div>

          {body ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 w-full text-[13px] leading-[1.7] px-4 py-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400"
              style={{ fontFamily: '"Nanum Myeongjo", "Pretendard Variable", serif' }}
            />
          ) : (
            <div className="flex-1 grid place-items-center text-center text-zinc-400 text-[12.5px] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md p-8">
              <div>
                <ImageIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
                주제 선택 후 "본문 자동 생성"을 눌러주세요
                <div className="mt-1 text-[11px]">1500자+ Naver SEO 최적 본문이 생성됩니다</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// 톤·키워드 기반 본문 시뮬레이션 (실서비스는 LLM 호출)
function buildDraft(args: {
  topic: string;
  brandName: string;
  city: string;
  industryLabel: string;
  keywords: string[];
  tone: string;
  toneSummary: string;
}): string {
  const { topic, brandName, city, industryLabel, keywords } = args;
  const k1 = keywords[0] ?? industryLabel;
  const k2 = keywords[1] ?? city;
  return `안녕하세요, ${brandName}입니다.

요즘 ${k1}을(를) 찾는 분들이 부쩍 늘었습니다. 단골 분들께서도 비슷한 질문을 많이 주시는데요, 오늘은 "${topic}"에 대해 ${brandName}이(가) 어떻게 준비하는지, 그리고 ${city} 지역에서 ${industryLabel}을(를) 고를 때 무엇을 보면 좋은지 차근차근 풀어보려 합니다.

1. ${k1} — 우리가 고집하는 이유

${brandName}이(가) ${k1}에 집중하는 데는 분명한 이유가 있습니다. 매주 같은 자리에서 같은 손길로 준비하지만, 계절마다 재료가 바뀌고, 그 변화가 한 그릇·한 잔에 자연스럽게 담깁니다. ${industryLabel}을(를) 오래 운영해 온 입장에서, 무엇보다 중요하게 여기는 부분은 결과가 아니라 과정입니다.

2. ${k2}와 함께 보면 좋은 것

${k2}을(를) 함께 찾으시는 분들에게는 한 가지를 더 권해 드립니다. 처음 오시는 분이라면 시즌 한정 메뉴를, 단골 분이라면 우리가 새로 도입한 ${industryLabel} 변형을 추천합니다. 두 가지 모두 ${brandName}의 일관된 톤 안에서 준비되었습니다.

3. ${city}에서 ${industryLabel}을(를) 고를 때 체크 포인트

• 재료의 출처가 명시되어 있는가
• 시즌별로 메뉴가 바뀌는가
• 운영자가 직접 ${k1}에 대해 설명할 수 있는가

이 세 가지만 보셔도 ${city}의 좋은 ${industryLabel}을(를) 가려내실 수 있습니다.

4. 마무리

${brandName}은(는) 거창한 광고 카피를 만들기보다, 매일 같은 시간에 같은 손길로 준비하는 일을 더 중요하게 생각합니다. ${topic}에 관심 있으신 분이라면, 가까운 날 한 번 들러주세요. 인스타그램(@${brandName.replace(/\s/g, "").toLowerCase()})에서 매주 새 소식을 전하고 있습니다.

#${k1.replace(/\s/g, "")} #${k2.replace(/\s/g, "")} #${brandName.replace(/\s/g, "")} #${city}맛집 #${industryLabel.replace(/\s/g, "")}`;
}
