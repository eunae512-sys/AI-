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

export const trendingReelsStyles = [
  {
    id: "trend-1",
    title: "새벽 4시 시장",
    format: "시간순 다큐 · 6컷",
    industry: "한정식",
    delta: "+312%",
    gradient: "from-amber-200 via-rose-300 to-amber-400",
  },
  {
    id: "trend-2",
    title: "결이 살아요",
    format: "ASMR 시술 · 8컷",
    industry: "미용",
    delta: "+248%",
    gradient: "from-zinc-700 via-zinc-900 to-stone-800",
  },
  {
    id: "trend-3",
    title: "5분 만에 안내",
    format: "정보형 카드 · 5컷",
    industry: "의료",
    delta: "+189%",
    gradient: "from-sky-100 via-slate-200 to-blue-300",
  },
  {
    id: "trend-4",
    title: "한옥 새벽 빛",
    format: "공간 무드 · 7컷",
    industry: "숙소",
    delta: "+167%",
    gradient: "from-amber-100 via-stone-200 to-amber-300",
  },
];
