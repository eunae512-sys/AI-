export type Industry = "cafe" | "dessert" | "stay" | "restaurant" | "beauty" | "local";
export type Mood = "warm" | "modern" | "moody" | "playful" | "natural" | "luxury";

export type Brand = {
  id: string;
  name: string;
  letter: string;
  industry: Industry;
  industryLabel: string;
  city: string;
  toneVersion: number;
  brandColors: { primary: string; secondary: string };
  gradient: string;
  campaign: string;
  followers: number;
  saveRate: number;
  reachThisMonth: number;
  isDemo?: boolean;
};

export type ContentItem = {
  id: string;
  brandId: string;
  type: "reels" | "cardnews" | "blog" | "story";
  title: string;
  thumbnail: string;
  status: "draft" | "scheduled" | "published" | "review";
  scheduledFor?: string;
  publishedAt?: string;
  metrics?: { reach: number; saves: number; ctr: number };
};

export type Review = {
  id: string;
  brandId: string;
  platform: "naver" | "google" | "baemin" | "yogiyo" | "kakao";
  author: string;
  rating: number;
  body: string;
  receivedAt: string;
  customerType: "new" | "regular" | "difficult";
  reply?: string;
  replyStatus: "pending" | "auto-sent" | "manual-sent" | "needs-review";
};

export type Recommendation = {
  id: string;
  kind: "season" | "anniversary" | "weather" | "trend" | "local";
  brandId: string;
  title: string;
  reason: string;
  expectedSaveRate?: number;
  startsAt?: string;
  cta: { label: string; href: string };
};

export type ActivityItem = {
  id: string;
  icon: string;
  iconColor: string;
  brandId: string;
  text: string;
  ago: string;
};

export type ToneSlider = {
  axis: string;
  leftLabel: string;
  rightLabel: string;
  value: number; // 0..100, 0 = leftmost
};
