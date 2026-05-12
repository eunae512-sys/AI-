import type { Recommendation, ActivityItem } from "@/types";

export const todayRecommendations: Recommendation[] = [
  {
    id: "rec-1",
    kind: "season",
    brandId: "miokdang",
    title: "장마 감성 릴스 · 비 오는 날 메뉴",
    reason: "5/13 장마 시작 예보 · 미옥당 톤 v3 자동 적용",
    expectedSaveRate: 5.8,
    startsAt: "2026-05-13",
    cta: { label: "시작 →", href: "/reels?id=miokdang&mood=rainy" },
  },
  {
    id: "rec-2",
    kind: "anniversary",
    brandId: "seochon-stay",
    title: "가정의 달 효도 스테이 패키지",
    reason: "5/8~21 · 부모님 동반 패키지 + 카드뉴스 5장",
    expectedSaveRate: 4.9,
    startsAt: "2026-05-08",
    cta: { label: "시작 →", href: "/reels?id=seochon-stay" },
  },
  {
    id: "rec-3",
    kind: "trend",
    brandId: "dolce-dessert",
    title: "성수 디저트 ASMR 컷 +312% 저장률",
    reason: "성수 1km · 14개 경쟁사 대비 ASMR 인기 폭증",
    expectedSaveRate: 7.4,
    cta: { label: "시작 →", href: "/reels?id=dolce-dessert&style=asmr" },
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "act-1",
    icon: "✓",
    iconColor: "emerald",
    brandId: "miokdang",
    text: "미옥당 · 5월 봄나물 코스 카드뉴스 6장 자동 발행",
    ago: "14분 전",
  },
  {
    id: "act-2",
    icon: "💬",
    iconColor: "sky",
    brandId: "luna-hair",
    text: "루나헤어 · 네이버 리뷰 3건 자동 답변",
    ago: "38분 전",
  },
  {
    id: "act-3",
    icon: "⚠",
    iconColor: "amber",
    brandId: "miokdang",
    text: "미옥당 · AI 인공 표현 1건 자동 자연화 (\"탁월한\" → \"한 입에 봄이\")",
    ago: "1시간 전",
  },
  {
    id: "act-4",
    icon: "🎬",
    iconColor: "violet",
    brandId: "roastery-1985",
    text: "로스터리 1985 · 릴스 8컷 자동 편집 완료",
    ago: "2시간 전",
  },
  {
    id: "act-5",
    icon: "🎨",
    iconColor: "rose",
    brandId: "seochon-stay",
    text: "서촌 한옥스테이 · 브랜드 키트 자동 생성 (오크+한지)",
    ago: "3시간 전",
  },
];

import type { Industry } from "@/types";

export type TrendingReelsStyle = {
  id: string;
  title: string;
  format: string;
  industryLabel: string;       // 표시용 (e.g. "한정식")
  industries: Industry[];      // 매칭용 — 1개 카드가 여러 업종에 노출될 수 있음
  tag: "감성" | "정보" | "ASMR" | "타임랩스" | "공간" | "Before/After" | "디테일" | "V-log" | "에디토리얼";
  gradient: string;
  query: string;               // Pexels 검색어 (에디토리얼/시네마틱 톤)
  hooks: string[];             // 자막 후크 — 컷마다 cycle, 첫/끝 컷은 큰 매거진 카피
};

// 모든 쿼리 공통 — 다큐/홈비디오/소셜 톤 단어 제거, 에디토리얼/매거진/시네마 단어 추가
// 핵심 키워드: cinematic, editorial, muted, neutral, soft, slow, minimal, fine, still
// 12개 풀 — 업종별 1~3개씩 + 공통 활용 가능한 포맷
export const trendingReelsStyles: TrendingReelsStyle[] = [
  // 한정식 / 음식점 (4개)
  {
    id: "trend-r1",
    title: "오늘의 한 상",
    format: "시네마틱 디테일 · 6컷",
    industryLabel: "한정식",
    industries: ["restaurant"],
    tag: "타임랩스",
    gradient: "from-amber-200 via-rose-300 to-amber-400",
    query: "cinematic korean cuisine plating editorial moody",
    hooks: ["오늘의 한 상,", "정성으로 차립니다", "재료가 말합니다", "한 그릇의 시간", "끝의 인사", "고맙습니다"],
  },
  {
    id: "trend-r2",
    title: "한 상의 김",
    format: "ASMR 플레이팅 · 8컷",
    industryLabel: "음식점",
    industries: ["restaurant"],
    tag: "ASMR",
    gradient: "from-rose-200 via-amber-300 to-stone-500",
    query: "slow motion food plating fine dining cinematic",
    hooks: ["한 술의 시작,", "솥의 김", "한 점, 한 결", "장맛의 시간", "마주 앉다", "오늘의 마무리"],
  },
  {
    id: "trend-r3",
    title: "재료의 시간",
    format: "타임랩스 · 5컷",
    industryLabel: "음식점",
    industries: ["restaurant"],
    tag: "타임랩스",
    gradient: "from-stone-200 via-amber-300 to-stone-500",
    query: "ingredients prep kitchen still editorial muted",
    hooks: ["새벽의 재료,", "다듬는 손", "끓는 결", "한 상으로", "오늘의 시작"],
  },
  {
    id: "trend-r4",
    title: "마주 앉다",
    format: "공간 V-log · 6컷",
    industryLabel: "음식점",
    industries: ["restaurant"],
    tag: "공간",
    gradient: "from-amber-100 via-stone-300 to-rose-300",
    query: "korean restaurant dining hall warm light cinematic",
    hooks: ["문 앞의 등,", "오늘의 자리", "잔과 잔 사이", "한 상의 무게", "끝의 인사", "다음에 또"],
  },

  // 카페 (4개)
  {
    id: "trend-c1",
    title: "한 잔의 리듬",
    format: "추출 슬로우모션 · 5컷",
    industryLabel: "스페셜티 카페",
    industries: ["cafe"],
    tag: "ASMR",
    gradient: "from-sky-100 via-slate-200 to-amber-200",
    query: "slow motion espresso pour minimal aesthetic cinematic",
    hooks: ["한 잔의 시간,", "오늘 다시 내립니다", "산미의 결", "한 모금의 리듬", "다시, 한 잔"],
  },
  {
    id: "trend-c2",
    title: "원두에서 잔까지",
    format: "공정 디테일 · 7컷",
    industryLabel: "스페셜티 카페",
    industries: ["cafe"],
    tag: "디테일",
    gradient: "from-amber-100 via-stone-300 to-amber-500",
    query: "specialty coffee beans roastery still editorial muted",
    hooks: ["원두에서", "분쇄로", "추출의 시간", "한 방울씩", "잔에 담기까지", "오늘의 한 잔"],
  },
  {
    id: "trend-c3",
    title: "라떼아트의 결",
    format: "탑샷 디테일 · 4컷",
    industryLabel: "스페셜티 카페",
    industries: ["cafe"],
    tag: "디테일",
    gradient: "from-stone-100 via-amber-200 to-stone-400",
    query: "latte art top down editorial muted minimal",
    hooks: ["하얀 결 위에,", "한 줄의 무늬", "오늘의 한 잔", "테이블 위 시간"],
  },
  {
    id: "trend-c4",
    title: "원두 노트",
    format: "정적 미니멀 · 5컷",
    industryLabel: "스페셜티 카페",
    industries: ["cafe"],
    tag: "에디토리얼",
    gradient: "from-amber-50 via-stone-200 to-amber-300",
    query: "coffee bag origin notes editorial still neutral",
    hooks: ["산지의 결,", "오늘의 노트", "한 입의 차이", "잔에서 만나요", "다음 시즌까지"],
  },

  // 디저트 (4개)
  {
    id: "trend-d1",
    title: "단면 한 컷",
    format: "단면 클로즈업 · 4컷",
    industryLabel: "디저트샵",
    industries: ["dessert"],
    tag: "디테일",
    gradient: "from-pink-200 via-rose-300 to-amber-200",
    query: "patisserie dessert closeup editorial minimal aesthetic",
    hooks: ["오늘의 단면,", "한 결의 색", "조용한 단맛", "한 입의 마침표"],
  },
  {
    id: "trend-d2",
    title: "오늘 만든 한 조각",
    format: "메이킹 타임랩스 · 6컷",
    industryLabel: "디저트샵",
    industries: ["dessert"],
    tag: "타임랩스",
    gradient: "from-rose-100 via-pink-200 to-rose-300",
    query: "pastry making process cinematic slow editorial",
    hooks: ["가루에서", "반죽으로", "오븐의 시간", "식어가는 결", "마지막 한 줄기", "오늘의 디저트"],
  },
  {
    id: "trend-d3",
    title: "쇼케이스의 빛",
    format: "정적 미니멀 · 5컷",
    industryLabel: "디저트샵",
    industries: ["dessert"],
    tag: "에디토리얼",
    gradient: "from-stone-100 via-rose-100 to-amber-200",
    query: "dessert showcase soft light editorial muted aesthetic",
    hooks: ["오늘 진열된,", "한 칸의 색", "고르는 시간", "한 조각, 픽업", "다음에 또"],
  },
  {
    id: "trend-d4",
    title: "선물 포장",
    format: "ASMR 포장 · 5컷",
    industryLabel: "디저트샵",
    industries: ["dessert"],
    tag: "ASMR",
    gradient: "from-rose-200 via-amber-100 to-stone-200",
    query: "gift wrapping pastry box minimal soft editorial",
    hooks: ["오늘의 선물,", "리본의 결", "전하는 마음", "한 줄의 메시지", "받는 분께"],
  },

  // 숙소 (4개)
  {
    id: "trend-s1",
    title: "한옥 새벽 빛",
    format: "공간 무드 · 7컷",
    industryLabel: "한옥 숙소",
    industries: ["stay"],
    tag: "공간",
    gradient: "from-amber-100 via-stone-200 to-amber-300",
    query: "warm interior soft morning light still editorial minimal",
    hooks: ["창호로 드는 빛,", "마당의 한 결", "오늘의 환영", "조용한 객실", "차 한 잔의 시간", "다음 손님을 기다리며", "고맙습니다"],
  },
  {
    id: "trend-s2",
    title: "객실의 시간",
    format: "V-log · 8컷",
    industryLabel: "스테이",
    industries: ["stay"],
    tag: "V-log",
    gradient: "from-stone-200 via-amber-200 to-stone-400",
    query: "minimal hotel room natural light editorial soft",
    hooks: ["문을 엽니다,", "방의 첫 인상", "창가의 빛", "낮은 의자", "저녁의 색", "조명을 낮추고", "내일을 위해", "다녀가세요"],
  },
  {
    id: "trend-s3",
    title: "마당의 한 결",
    format: "공간 정적 · 5컷",
    industryLabel: "스테이",
    industries: ["stay"],
    tag: "공간",
    gradient: "from-stone-100 via-amber-100 to-stone-300",
    query: "garden courtyard wood asian still editorial soft",
    hooks: ["마당 한 켠,", "오늘의 빛", "조용한 결", "차 한 잔", "오래 머무세요"],
  },
  {
    id: "trend-s4",
    title: "조반 한 상",
    format: "디테일 · 6컷",
    industryLabel: "스테이",
    industries: ["stay"],
    tag: "디테일",
    gradient: "from-amber-100 via-stone-200 to-amber-200",
    query: "breakfast tray hotel morning soft light editorial",
    hooks: ["아침 7시,", "오늘의 조반", "차의 결", "한 상의 시작", "오늘 하루", "다녀가세요"],
  },

  // 미용 (4개)
  {
    id: "trend-b1",
    title: "결이 살아요",
    format: "ASMR 시술 · 8컷",
    industryLabel: "미용·헤어",
    industries: ["beauty"],
    tag: "ASMR",
    gradient: "from-zinc-700 via-zinc-900 to-stone-800",
    query: "hair styling salon cinematic editorial muted slow",
    hooks: ["오늘의 결,", "한 가닥씩", "톤의 변화", "광택의 마침표", "거울 앞", "다시 보는 나", "여기까지 5초", "오늘의 마무리"],
  },
  {
    id: "trend-b2",
    title: "3개월 후",
    format: "Before/After · 5컷",
    industryLabel: "미용·헤어",
    industries: ["beauty"],
    tag: "Before/After",
    gradient: "from-rose-200 via-fuchsia-300 to-violet-400",
    query: "hair transformation portrait editorial soft natural light",
    hooks: ["3개월 전,", "오늘의 톤", "결의 시간", "한 단계, 한 단계", "그리고 지금"],
  },
  {
    id: "trend-b3",
    title: "톤 매칭의 시간",
    format: "포트레이트 · 6컷",
    industryLabel: "미용·헤어",
    industries: ["beauty"],
    tag: "에디토리얼",
    gradient: "from-stone-200 via-rose-200 to-amber-200",
    query: "hair color palette editorial portrait soft natural",
    hooks: ["피부와 결,", "오늘의 톤", "거울 앞에서", "한 단계 더", "마지막 정돈", "오늘의 마무리"],
  },
  {
    id: "trend-b4",
    title: "샴푸 바의 결",
    format: "ASMR 케어 · 5컷",
    industryLabel: "미용·헤어",
    industries: ["beauty"],
    tag: "ASMR",
    gradient: "from-stone-100 via-zinc-200 to-stone-400",
    query: "hair wash spa close up cinematic muted",
    hooks: ["물 한 줄기,", "거품의 결", "두피의 시간", "결을 살리는", "끝의 안락함"],
  },

  // 로컬 / 패션 (4개)
  {
    id: "trend-l1",
    title: "원단의 결정",
    format: "에디토리얼 · 8컷",
    industryLabel: "컨템포러리 패션",
    industries: ["local"],
    tag: "에디토리얼",
    gradient: "from-stone-300 via-zinc-400 to-stone-600",
    query: "minimal fashion editorial neutral palette cinematic still",
    hooks: ["한 벌의 무게,", "원단의 결", "실루엣의 선택", "스튜디오의 시간", "한 사람의 무드", "오늘의 룩", "다음 시즌까지", "FORUM"],
  },
  {
    id: "trend-l2",
    title: "룩북 · S/S",
    format: "포트레이트 · 6컷",
    industryLabel: "컨템포러리 패션",
    industries: ["local"],
    tag: "에디토리얼",
    gradient: "from-stone-200 via-rose-200 to-stone-400",
    query: "fashion lookbook editorial natural light minimal portrait",
    hooks: ["S/S 26,", "한 사람의 무드", "톤의 결정", "선의 절제", "오늘의 한 벌", "FORUM"],
  },
  {
    id: "trend-l3",
    title: "쇼룸 정적",
    format: "공간 미니멀 · 5컷",
    industryLabel: "컨템포러리 패션",
    industries: ["local"],
    tag: "공간",
    gradient: "from-stone-100 via-zinc-200 to-stone-300",
    query: "fashion showroom interior minimal editorial still",
    hooks: ["문 너머의 결,", "행거의 한 줄", "거울 앞", "오늘의 픽", "방문 환영"],
  },
  {
    id: "trend-l4",
    title: "디테일 한 점",
    format: "디테일 클로즈업 · 4컷",
    industryLabel: "컨템포러리 패션",
    industries: ["local"],
    tag: "디테일",
    gradient: "from-stone-200 via-zinc-300 to-stone-500",
    query: "fabric texture closeup fashion editorial neutral",
    hooks: ["실의 결,", "한 땀의 시간", "원단이 말합니다", "오늘의 한 점"],
  },
];

// 헬퍼: 시드 기반 셔플로 매번 같은 라운드 안에서는 일관, 라운드 바뀌면 다른 순서
// 중요: 업종 매칭 카드만 반환 — 다른 업종으로 padding 하지 않음
//      (미용실 사장님이 카페 영상 보는 일 없도록)
export function pickTrendingForBrand(
  industry: Industry | string,
  seed: number,
  count: number = 4,
): TrendingReelsStyle[] {
  const matched = trendingReelsStyles.filter((t) => t.industries.includes(industry as Industry));

  // mulberry32 — 가벼운 시드 기반 PRNG (라운드별 결정적)
  const rand = mulberry32(seed);
  const a = [...matched];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, count);
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
