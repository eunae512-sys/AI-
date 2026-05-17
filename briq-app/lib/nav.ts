import {
  LayoutDashboard,
  Target,
  Clock,
  Compass,
  Settings,
  Layers,
  type LucideIcon,
} from "lucide-react";

// 운영 중심 IA — 메뉴는 4개. 그 이상은 기능 나열에 가깝다.
//   Dashboard   — 지금 가게가 어떻게 굴러가는가 (상태 보기)
//   Campaigns   — 캠페인 한 줄 입력 → 자동 생성 → 승인만
//   Scheduler   — 이번 주 발행 일정 / 자동 응답 상태
//   Insights    — 발견한 것 (숫자 아닌 문장으로)
//
// 그 외 모든 화면 (pipeline, automation, analytics, brand-kit, channels, settings,
// 개별 생성 도구들) 은 라우트는 살아있지만 메뉴에선 숨김. 필요한 위치에서만 노출된다.

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: { count: number; tone: "amber" | "rose" | "sky" | "emerald" };
  /** 메뉴 비공개, 라우트만 유지 */
  hidden?: boolean;
};

export type NavGroup = {
  title?: string;
  items: NavItem[];
};

// 한 그룹, 다섯 줄. 부제목도 없음. — 화면 자체가 답이 되도록.
export const navGroups: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Campaigns", href: "/campaigns", icon: Target, badge: { count: 2, tone: "amber" } },
      { label: "Scheduler", href: "/scheduler", icon: Clock, badge: { count: 12, tone: "sky" } },
      { label: "Insights", href: "/insights", icon: Compass },
    ],
  },
];

// 설정은 사이드바 하단의 톱니바퀴로만 진입. 메뉴 줄 차지하지 않음.
export const SETTINGS_ITEM: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
};

// 메뉴엔 안 보이지만 라우트는 살아있는 화면.
//   - 개별 생성 도구 → Campaigns 안 "직접 편집" 으로 진입
//   - pipeline / automation / analytics → Campaigns / Scheduler / Insights 안에 흡수
//   - brand-kit / channels → Settings 하위로
export const HIDDEN_ROUTES: NavItem[] = [
  { label: "Content Distribution", href: "/content-distribution", icon: Layers, hidden: true },
  { label: "Content Pipeline", href: "/pipeline", icon: Layers, hidden: true },
  { label: "Automation rules", href: "/automation", icon: Layers, hidden: true },
  { label: "Analytics", href: "/analytics", icon: Layers, hidden: true },
  { label: "Brand Assets", href: "/brand-kit", icon: Layers, hidden: true },
  { label: "Social Channels", href: "/channels", icon: Layers, hidden: true },
  { label: "Shorts editor", href: "/shorts", icon: Layers, hidden: true },
  { label: "Reels editor", href: "/reels", icon: Layers, hidden: true },
  { label: "Cardnews editor", href: "/cardnews", icon: Layers, hidden: true },
  { label: "Blog editor", href: "/blog", icon: Layers, hidden: true },
  { label: "Threads editor", href: "/threads", icon: Layers, hidden: true },
  { label: "Brand tone", href: "/brand-tone", icon: Layers, hidden: true },
  { label: "Calendar", href: "/calendar", icon: Layers, hidden: true },
  { label: "Schedule (legacy)", href: "/schedule", icon: Layers, hidden: true },
  { label: "Review queue", href: "/review-queue", icon: Layers, hidden: true },
  { label: "Reviews", href: "/reviews", icon: Layers, hidden: true },
  { label: "Trends", href: "/trends", icon: Layers, hidden: true },
  { label: "Discover", href: "/discover", icon: Layers, hidden: true },
  { label: "Clients", href: "/clients", icon: Layers, hidden: true },
];

export const NAV_FLAT: NavItem[] = [
  ...navGroups.flatMap((g) => g.items),
  SETTINGS_ITEM,
  ...HIDDEN_ROUTES,
];
