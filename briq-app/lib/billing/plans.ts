// BRIQ 가격 정책 — 한 파일에서 관리.
//
// 3티어 × 1애드온 묶음. Pro 가 매출 견인, Studio 가 대행사 거점, Free 는 입소문 트리거.
// 가격 변경 시 이 파일만 수정 — 가격 페이지·사용량 체크·결제 페이지가 같은 출처를 본다.

export type PlanId = "free" | "pro" | "studio" | "agency";

export type PlanLimit = {
  /** 월 카드뉴스 생성 한도. null = 무제한 */
  cardnewsPerMonth: number | null;
  /** 월 네이버 블로그 본문 한도. null = 무제한 */
  blogPerMonth: number | null;
  /** 월 ChatGPT 이미지 한도. null = 무제한 */
  aiImagesPerMonth: number | null;
  /** 브랜드 수 한도 */
  brandCount: number;
  /** 사용자 수 한도 */
  userCount: number;
};

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number;       // 원
  priceAnnualMonthly: number; // 연간 결제 시 월 환산
  badge?: string;             // "가장 인기" 등
  cta: { label: string; href: string };
  limits: PlanLimit;
  features: {
    label: string;
    included: boolean;
    detail?: string;
  }[];
  showWatermark: boolean;
};

export const ANNUAL_DISCOUNT = 0.16; // 16% off

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "시험삼아 한 번",
    priceMonthly: 0,
    priceAnnualMonthly: 0,
    cta: { label: "무료로 시작", href: "/onboarding" },
    showWatermark: true,
    limits: {
      cardnewsPerMonth: 2,
      blogPerMonth: 0,
      aiImagesPerMonth: 0,
      brandCount: 1,
      userCount: 1,
    },
    features: [
      { label: "카드뉴스 월 2편", included: true },
      { label: "인스타 캡션 + 해시태그", included: true, detail: "월 2회" },
      { label: "Pexels 사진 검색", included: true },
      { label: "사진 직접 업로드", included: true },
      { label: "수동 발행 (클립보드 + 새 탭)", included: true },
      { label: "워터마크 \"Powered by BRIQ\"", included: true, detail: "카드 좌하단 옅게" },
      { label: "릴스 스크립트 + Pexels 비디오", included: false },
      { label: "네이버 블로그 본문", included: false },
      { label: "ChatGPT 이미지 생성", included: false },
      { label: "Make/Zapier Webhook 분배", included: false },
      { label: "Instagram Graph API 직결", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "사장님 한 명이 매일 운영",
    priceMonthly: 49000,
    priceAnnualMonthly: 41160, // ₩49,000 × 0.84
    badge: "가장 많이 선택",
    cta: { label: "14일 무료 체험", href: "/onboarding?plan=pro" },
    showWatermark: false,
    limits: {
      cardnewsPerMonth: null,
      blogPerMonth: 8,
      aiImagesPerMonth: 50,
      brandCount: 1,
      userCount: 1,
    },
    features: [
      { label: "카드뉴스 무제한", included: true },
      { label: "인스타 캡션 + 해시태그 무제한", included: true },
      { label: "릴스 스크립트 + Pexels 비디오", included: true },
      { label: "네이버 블로그 본문 (1500+자)", included: true, detail: "월 8편" },
      { label: "네이버 클립 15·30·45초", included: true },
      { label: "페이스북·스레드·틱톡·쇼츠·카카오", included: true },
      { label: "ChatGPT 이미지 생성", included: true, detail: "월 50장" },
      { label: "Make/Zapier Webhook 분배", included: true },
      { label: "일괄 예약 (10 플랫폼 stagger)", included: true },
      { label: "워터마크 제거", included: true },
      { label: "메일 지원 (영업일 24h 내)", included: true },
      { label: "Instagram Graph API 직결", included: false },
      { label: "PDF 매거진 리포트", included: false },
      { label: "멀티 브랜드", included: false },
    ],
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "대행사 1명이 15곳 운영",
    priceMonthly: 149000,
    priceAnnualMonthly: 125160,
    cta: { label: "14일 무료 체험", href: "/onboarding?plan=studio" },
    showWatermark: false,
    limits: {
      cardnewsPerMonth: null,
      blogPerMonth: null,
      aiImagesPerMonth: 300,
      brandCount: 10,
      userCount: 1,
    },
    features: [
      { label: "Pro 의 모든 기능", included: true },
      { label: "네이버 블로그 본문 무제한", included: true },
      { label: "ChatGPT 이미지", included: true, detail: "월 300장" },
      { label: "멀티 브랜드", included: true, detail: "10개까지" },
      { label: "Instagram Graph API 직결 발행", included: true },
      { label: "카카오 알림톡 자동 응답", included: true },
      { label: "매주 PDF 매거진 자동 리포트", included: true, detail: "클라이언트 전달용" },
      { label: "카톡 지원 (영업일 4h 내)", included: true },
      { label: "사용자 수", included: true, detail: "1명" },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    tagline: "5명+ 팀 대행사",
    priceMonthly: 500000, // 시작가
    priceAnnualMonthly: 420000,
    cta: { label: "도입 문의", href: "/contact?plan=agency" },
    showWatermark: false,
    limits: {
      cardnewsPerMonth: null,
      blogPerMonth: null,
      aiImagesPerMonth: null,
      brandCount: 999,
      userCount: 5,
    },
    features: [
      { label: "Studio 의 모든 기능", included: true },
      { label: "사용자 수", included: true, detail: "5명 이상" },
      { label: "무제한 브랜드", included: true },
      { label: "무제한 ChatGPT 이미지", included: true },
      { label: "자체 도메인", included: true, detail: "briq.your-agency.com" },
      { label: "전담 매니저", included: true },
      { label: "Supabase 자체 호스팅 옵션", included: true },
      { label: "커스텀 톤 트레이닝", included: true },
      { label: "SLA 보장", included: true, detail: "99.9% 가동시간" },
    ],
  },
];

export function getPlan(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

// 산업별 추천 — Pricing 페이지 헤더에 노출
export const INDUSTRY_RECOMMEND: Record<string, { plan: PlanId; reason: string }> = {
  restaurant: { plan: "pro", reason: "주 2회 인스타 발행 + 시즌 메뉴 블로그" },
  cafe: { plan: "pro", reason: "시즌 메뉴가 자주 바뀌고 비주얼 컷이 핵심" },
  beauty: { plan: "pro", reason: "시술 전후 + 예약 안내가 매주 필요" },
  dessert: { plan: "pro", reason: "월 2-4회 발행, 시즌 한정 메뉴 중심" },
  stay: { plan: "studio", reason: "객실별 캠페인 분리 + 멀티 브랜드" },
  local: { plan: "pro", reason: "MD 큐레이션 + 시즌 룩북 중심" },
};

// 가격 표시 헬퍼
export function formatKrw(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n);
}
