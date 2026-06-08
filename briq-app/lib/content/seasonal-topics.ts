// 시즌×업종 추천 주제 단일 소스. 블로그·카드뉴스가 공유. 가짜 수치·통계 금지(정직성).

import { getSeasonContext, type SeasonKey } from "./season";

export type Topic = { title: string; keywords: string[]; intent: string };

export const SEASONAL_TOPICS: Record<string, Record<SeasonKey, Topic[]>> = {
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

// 업종 × 시즌 추천 주제. season 미지정 시 현재 KST 시즌. 업종 미존재 시 restaurant 폴백.
export function getSeasonalTopics(industry: string, season?: SeasonKey, now?: Date): Topic[] {
  const key = season ?? getSeasonContext(now).seasonKey;
  const byIndustry = SEASONAL_TOPICS[industry] ?? SEASONAL_TOPICS.restaurant;
  return byIndustry[key] ?? byIndustry.spring;
}

// placeholder 용 제목만.
export function getSeasonalTopicTitles(industry: string, season?: SeasonKey, now?: Date): string[] {
  return getSeasonalTopics(industry, season, now).map((t) => t.title);
}
