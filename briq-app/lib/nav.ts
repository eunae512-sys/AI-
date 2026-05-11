import {
  Home,
  Users,
  Megaphone,
  Layers,
  Film,
  FileImage,
  Calendar,
  CheckCircle2,
  MessageSquareHeart,
  Send,
  BarChart3,
  Globe2,
  Palette,
  Wand2,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: { count: number; tone: "amber" | "rose" | "sky" | "emerald" };
};

export type NavGroup = {
  title?: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    items: [
      { label: "홈", href: "/dashboard", icon: Home },
      { label: "클라이언트", href: "/clients", icon: Users },
    ],
  },
  {
    title: "AI 콘텐츠",
    items: [
      { label: "AI 릴스", href: "/reels", icon: Film },
      { label: "카드뉴스", href: "/cardnews", icon: FileImage },
      { label: "콘텐츠 캘린더", href: "/calendar", icon: Calendar },
    ],
  },
  {
    title: "자동화",
    items: [
      { label: "검토 큐", href: "/review-queue", icon: CheckCircle2, badge: { count: 7, tone: "amber" } },
      { label: "리뷰 답변", href: "/reviews", icon: MessageSquareHeart, badge: { count: 3, tone: "rose" } },
      { label: "업로드 예약", href: "/schedule", icon: Send, badge: { count: 12, tone: "sky" } },
    ],
  },
  {
    title: "인사이트",
    items: [
      { label: "성과 분석", href: "/analytics", icon: BarChart3 },
      { label: "지역 트렌드", href: "/trends", icon: Globe2 },
    ],
  },
  {
    title: "브랜드",
    items: [
      { label: "브랜드 톤", href: "/brand-tone", icon: Wand2 },
      { label: "브랜드 키트", href: "/brand-kit", icon: Palette },
      { label: "설정", href: "/settings", icon: Settings },
    ],
  },
];

export const NAV_FLAT: NavItem[] = navGroups.flatMap((g) => g.items);
