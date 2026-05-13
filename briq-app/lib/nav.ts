import {
  Home,
  Users,
  Megaphone,
  Layers,
  Film,
  FileImage,
  FileText,
  MessageSquare,
  Calendar,
  CheckCircle2,
  MessageSquareHeart,
  Send,
  BarChart3,
  Globe2,
  Search,
  Palette,
  Plug,
  Sparkles,
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
      { label: "내 가게", href: "/clients", icon: Users },
    ],
  },
  {
    title: "오늘 뭐 올릴까?",
    items: [
      { label: "홍보 만들기", href: "/shorts", icon: Sparkles },
      { label: "릴스 만들기", href: "/reels", icon: Film },
      { label: "카드뉴스 만들기", href: "/cardnews", icon: FileImage },
      { label: "쓰레드 만들기", href: "/threads", icon: MessageSquare },
      { label: "블로그 글 쓰기", href: "/blog", icon: FileText },
      { label: "이번달 콘텐츠 달력", href: "/calendar", icon: Calendar },
    ],
  },
  {
    title: "SNS 연결",
    items: [
      { label: "내 SNS 계정", href: "/channels", icon: Plug },
    ],
  },
  {
    title: "발행 관리",
    items: [
      { label: "확인할 콘텐츠", href: "/review-queue", icon: CheckCircle2, badge: { count: 7, tone: "amber" } },
      { label: "후기 답글 쓰기", href: "/reviews", icon: MessageSquareHeart, badge: { count: 3, tone: "rose" } },
      { label: "발행 예약", href: "/schedule", icon: Send, badge: { count: 12, tone: "sky" } },
    ],
  },
  {
    title: "반응 보기",
    items: [
      { label: "내 콘텐츠 반응", href: "/analytics", icon: BarChart3 },
      { label: "동네 트렌드", href: "/trends", icon: Globe2 },
      { label: "검색 노출", href: "/discover", icon: Search },
    ],
  },
  {
    title: "내 가게 정보",
    items: [
      { label: "말투 설정", href: "/brand-tone", icon: Wand2 },
      { label: "가게 색·로고", href: "/brand-kit", icon: Palette },
      { label: "설정", href: "/settings", icon: Settings },
    ],
  },
];

export const NAV_FLAT: NavItem[] = navGroups.flatMap((g) => g.items);
