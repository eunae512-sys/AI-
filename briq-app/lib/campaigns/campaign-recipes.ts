// 브랜드별 자주 쓰는 캠페인 추천 사전.
// 산업 × 시즌 매트릭스 + 사장님 본인 입력 학습.
// CampaignOneLineInput 이 "자주 적는 캠페인" 칩으로 노출.

import type { Brand } from "@/types";

// ─────────────────────────────────────────────────────────────
// 산업별 베이스 캠페인 — 시즌 무관, 일년 내내 자주 쓰는 패턴
// ─────────────────────────────────────────────────────────────

const BASE_BY_INDUSTRY: Record<Brand["industry"], string[]> = {
  restaurant: [
    "신메뉴 출시 안내",
    "주말 코스 안내",
    "런치 자리 안내",
    "단골 손님 감사",
    "예약 자리 안내",
    "시그니처 메뉴 소개",
    "주방 한 컷",
    "재료 산지 후기",
  ],
  cafe: [
    "시즌 음료 출시",
    "오늘의 한 잔 추천",
    "원두 입고 안내",
    "주말 자리 안내",
    "단골 감사 이벤트",
    "신메뉴 디저트 페어링",
    "원두 산지 스토리",
    "콜드브루 신상 안내",
  ],
  dessert: [
    "시즌 신메뉴 출시",
    "오늘의 디저트 추천",
    "픽업 예약 안내",
    "기념일 케이크 안내",
    "한정 시즌 컬렉션",
    "선물 박스 안내",
    "DM 주문 안내",
    "재방문 단골 인사",
  ],
  beauty: [
    "시즌 컬러 룩북",
    "예약 자리 안내",
    "신규 시술 안내",
    "단골 가격 감사",
    "결혼식 하객 룩",
    "주중 한가한 시간 안내",
    "신상 컬러 제품 입고",
    "단골 후기 모음",
  ],
  stay: [
    "1박 패키지 안내",
    "시즌 한 박 패키지",
    "체크인 시간 안내",
    "단골 회원 가격",
    "공간 산책 한 컷",
    "조식 메뉴 안내",
    "주말 객실 안내",
    "재방문 단골 감사",
  ],
  local: [
    "시즌 컬렉션 출시",
    "신상 입고 안내",
    "리오더 인기 상품",
    "단골 가격 감사",
    "주말 매장 안내",
    "스타일링 가이드",
    "픽업·배송 안내",
    "재방문 회원 가격",
  ],
};

// ─────────────────────────────────────────────────────────────
// 시즌(현재 월) × 산업 → 시즌 캠페인 1-2개
// ─────────────────────────────────────────────────────────────

const SEASONAL: Record<number, Partial<Record<Brand["industry"], string[]>>> = {
  1: {
    restaurant: ["신년 회식 코스 안내", "새해 가족 모임 자리"],
    cafe: ["신년 시즌 라떼 한 잔", "1월 따뜻한 한 잔"],
    dessert: ["신년 디저트 선물 박스"],
    stay: ["신년 한옥 1박 패키지"],
    beauty: ["신년 셀프 케어 시술"],
    local: ["신년 컬러 리오더"],
  },
  2: {
    restaurant: ["발렌타인 코스 안내", "졸업·입학 축하 자리"],
    cafe: ["발렌타인 디저트 한 잔", "졸업 시즌 음료"],
    dessert: ["발렌타인 한정 케이크", "졸업·입학 선물 박스"],
    beauty: ["졸업·입학 단정 룩"],
    stay: ["졸업 가족 여행 1박"],
    local: ["발렌타인 한정 색상"],
  },
  3: {
    restaurant: ["봄 신메뉴 한 상 안내", "졸업 시즌 회식 자리"],
    cafe: ["봄 시즌 신메뉴 안내", "3월 신상 라떼"],
    dessert: ["봄 시즌 마들렌", "딸기 시즌 케이크"],
    beauty: ["봄 컬러 룩북", "벚꽃 시즌 결혼식 하객"],
    stay: ["봄 한옥 산책 1박", "벚꽃 시즌 한옥스테이"],
    local: ["봄 신상 컬렉션 출시"],
  },
  4: {
    restaurant: ["벚꽃 시즌 한 상 안내", "봄나물 코스 안내"],
    cafe: ["벚꽃 한정 음료", "4월 시그니처 한 잔"],
    dessert: ["딸기 시즌 케이크", "벚꽃 한정 디저트"],
    beauty: ["봄 결혼식 하객 룩", "벚꽃 시즌 컬러"],
    stay: ["벚꽃 한옥 1박 패키지"],
    local: ["봄 컬렉션 본격 출시"],
  },
  5: {
    restaurant: ["어버이날 효도 코스", "5월 봄나물 코스 안내", "가족의 달 자리 안내"],
    cafe: ["5월 콜드브루 시즌 시작", "어버이날 선물 음료"],
    dessert: ["어버이날 케이크 예약", "5월 시즌 마들렌"],
    beauty: ["5월 봄 결혼 시즌 룩", "어버이날 효도 시술 가격"],
    stay: ["어버이날 효도 1박", "5월 한옥 패키지"],
    local: ["가정의 달 선물 컬렉션"],
  },
  6: {
    restaurant: ["초여름 보양 한 상", "장마철 자리 안내"],
    cafe: ["여름 시그니처 한 잔", "콜드브루 시즌 본격"],
    dessert: ["여름 빙수 시작", "수박 시즌 디저트"],
    beauty: ["초여름 시원한 컬러"],
    stay: ["초여름 한옥 1박", "장마철 한옥 패키지"],
    local: ["여름 컬렉션 출시"],
  },
  7: {
    restaurant: ["삼복 보양식 코스", "여름 점심 자리 안내"],
    cafe: ["한여름 빙수 한 그릇", "여름 시즌 시그니처"],
    dessert: ["한여름 빙수 디저트", "여름 휴가 픽업"],
    beauty: ["여름 휴가 룩 시술"],
    stay: ["여름 휴가 한옥스테이"],
    local: ["여름 휴가 룩 컬렉션"],
  },
  8: {
    restaurant: ["여름 점심 자리 안내", "보양 한 상 안내"],
    cafe: ["8월 휴가 영업 안내", "한여름 빙수"],
    dessert: ["여름 휴가 픽업 안내"],
    beauty: ["8월 펌 관리 가이드"],
    stay: ["여름 휴가 한옥 패키지"],
    local: ["여름 세일 컬렉션"],
  },
  9: {
    restaurant: ["추석 가족 모임 자리", "가을 송이 한 상"],
    cafe: ["가을 시즌 라떼 라인업", "9월 따뜻한 한 잔"],
    dessert: ["가을 시즌 몽블랑", "추석 선물 박스"],
    beauty: ["가을 컬러 룩북"],
    stay: ["추석 가족 모임 한옥", "초가을 1박 패키지"],
    local: ["가을 컬렉션 출시"],
  },
  10: {
    restaurant: ["가을 송이 코스 안내", "단풍 시즌 자리 안내"],
    cafe: ["10월 핸드드립 라인업", "단풍 시즌 음료"],
    dessert: ["할로윈 한정 쿠키", "가을 몽블랑"],
    beauty: ["10월 결혼식 하객 룩"],
    stay: ["단풍 한옥 1박"],
    local: ["가을 니트 컬렉션"],
  },
  11: {
    restaurant: ["연말 모임 코스 안내", "송년회 단체 자리"],
    cafe: ["겨울 따뜻한 한 잔", "11월 시즌 라떼"],
    dessert: ["겨울 시즌 디저트", "크리스마스 예약 시작"],
    beauty: ["겨울 보호 시술 안내"],
    stay: ["겨울 한옥 따뜻한 1박"],
    local: ["겨울 코트 컬렉션"],
  },
  12: {
    restaurant: ["송년회 단체 자리", "연말 모임 코스 안내"],
    cafe: ["크리스마스 시즌 메뉴", "겨울 시그니처 한 잔"],
    dessert: ["크리스마스 케이크 예약", "겨울 시즌 슈톨렌"],
    beauty: ["연말 모임 단정 룩"],
    stay: ["연말 한옥 패키지"],
    local: ["연말 선물 컬렉션"],
  },
};

// ─────────────────────────────────────────────────────────────
// 사장님 본인 입력 학습 — localStorage
// ─────────────────────────────────────────────────────────────

const STORAGE_PREFIX = "briq:recent-topics:";
const MAX_RECENT = 20;

export function loadRecentTopics(brandId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + brandId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function pushRecentTopic(brandId: string, topic: string): void {
  if (typeof window === "undefined") return;
  const clean = topic.trim();
  if (!clean) return;
  try {
    const cur = loadRecentTopics(brandId);
    // 중복 제거 후 맨 앞에 추가
    const next = [clean, ...cur.filter((t) => t !== clean)].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_PREFIX + brandId, JSON.stringify(next));
  } catch {
    // 무시
  }
}

// ─────────────────────────────────────────────────────────────
// 추천 풀 빌더 — 사장님 본인 + 시즌 + 산업 베이스 결합
// ─────────────────────────────────────────────────────────────

export type SuggestedTopic = {
  text: string;
  source: "recent" | "seasonal" | "base";
};

export function buildSuggestedTopics(opts: {
  brand: Brand;
  /** 최대 노출 수 (기본 6) */
  limit?: number;
  /** 사장님 본인 최근 입력 (선택, 못 받으면 localStorage 에서) */
  recent?: string[];
}): SuggestedTopic[] {
  const limit = opts.limit ?? 6;
  const month = new Date().getMonth() + 1;

  // 1. 사장님 본인 최근 입력 — 가장 우선 (최대 2개)
  const recent = opts.recent ?? loadRecentTopics(opts.brand.id);
  const recentPicks: SuggestedTopic[] = recent.slice(0, 2).map((text) => ({
    text,
    source: "recent",
  }));

  // 2. 이번 달 시즌 캠페인 (최대 2개)
  const seasonal = SEASONAL[month]?.[opts.brand.industry] ?? [];
  const seasonalPicks: SuggestedTopic[] = seasonal.slice(0, 2).map((text) => ({
    text,
    source: "seasonal",
  }));

  // 3. 산업 베이스 — 나머지 채움
  const base = BASE_BY_INDUSTRY[opts.brand.industry] ?? BASE_BY_INDUSTRY.restaurant;

  // 중복 제거 (recent/seasonal 에 이미 있는 텍스트는 base 에서 제외)
  const usedSet = new Set([...recentPicks, ...seasonalPicks].map((p) => p.text));
  const remaining = limit - recentPicks.length - seasonalPicks.length;
  const basePicks: SuggestedTopic[] = base
    .filter((t) => !usedSet.has(t))
    .slice(0, Math.max(0, remaining))
    .map((text) => ({ text, source: "base" }));

  return [...recentPicks, ...seasonalPicks, ...basePicks];
}
