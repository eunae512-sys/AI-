// SNS 채널 연결 정보 + 채널별 발행 메타데이터

export type ChannelId =
  | "instagram"
  | "threads"
  | "naver-blog"
  | "naver-place"
  | "kakao-channel"
  | "x-twitter"
  | "youtube-shorts"
  | "tiktok";

export type Channel = {
  id: ChannelId;
  name: string;
  vendor: string; // Meta / Naver / Kakao / X / Google / ByteDance
  letter: string;
  gradient: string; // Tailwind 안전 (static class)
  description: string;
  formats: string[]; // 지원하는 콘텐츠 포맷
  characterLimit?: number;
  hashtagLimit?: number;
  bestTime?: string;
  scheduledThisWeek?: number;
  publishedThisMonth?: number;
  oauthType: "oauth2" | "api-key" | "manual";
};

export const CHANNELS: Channel[] = [
  {
    id: "instagram",
    name: "Instagram",
    vendor: "Meta",
    letter: "IG",
    gradient: "from-fuchsia-500 via-pink-500 to-orange-400",
    description: "릴스 · 피드 · 카드뉴스 캐러셀 · 스토리",
    formats: ["릴스 30초", "카드뉴스 6-10장", "스토리 24시간"],
    characterLimit: 2200,
    hashtagLimit: 30,
    bestTime: "월·수 19:00 / 금 20:00",
    scheduledThisWeek: 4,
    publishedThisMonth: 18,
    oauthType: "oauth2",
  },
  {
    id: "threads",
    name: "Threads",
    vendor: "Meta",
    letter: "T",
    gradient: "from-zinc-700 via-zinc-900 to-zinc-950",
    description: "텍스트 중심 짧은 호흡 · 일상 톤",
    formats: ["텍스트 500자", "이미지 1-10장", "스레드 연결"],
    characterLimit: 500,
    bestTime: "평일 07:30 / 22:00",
    scheduledThisWeek: 6,
    publishedThisMonth: 24,
    oauthType: "oauth2",
  },
  {
    id: "naver-blog",
    name: "Naver Blog",
    vendor: "Naver",
    letter: "N",
    gradient: "from-emerald-500 via-emerald-600 to-emerald-800",
    description: "한국 SEO 핵심 · 본문 + 사진 + 지도",
    formats: ["본문 1500-3000자", "사진 10-20장", "지도 첨부"],
    characterLimit: 30000,
    bestTime: "평일 10:00 / 14:00",
    scheduledThisWeek: 2,
    publishedThisMonth: 6,
    oauthType: "oauth2",
  },
  {
    id: "naver-place",
    name: "Naver 플레이스",
    vendor: "Naver",
    letter: "P",
    gradient: "from-lime-500 via-emerald-500 to-emerald-700",
    description: "지역 검색 · 영업정보 · 소식·이벤트",
    formats: ["소식 1000자", "사진 30장", "쿠폰"],
    characterLimit: 1000,
    bestTime: "주말 11:00",
    scheduledThisWeek: 1,
    publishedThisMonth: 4,
    oauthType: "manual",
  },
  {
    id: "kakao-channel",
    name: "카카오톡 채널",
    vendor: "Kakao",
    letter: "K",
    gradient: "from-yellow-300 via-yellow-400 to-amber-500",
    description: "단골 1:1 · 쿠폰 발송 · 메시지",
    formats: ["메시지 1000자", "쿠폰", "이미지"],
    characterLimit: 1000,
    bestTime: "금 17:00 / 일 20:00",
    scheduledThisWeek: 3,
    publishedThisMonth: 12,
    oauthType: "oauth2",
  },
  {
    id: "x-twitter",
    name: "X (Twitter)",
    vendor: "X",
    letter: "X",
    gradient: "from-zinc-800 via-zinc-900 to-black",
    description: "실시간 · 트렌드 · 해시태그",
    formats: ["280자", "이미지 4장", "스레드"],
    characterLimit: 280,
    bestTime: "평일 09:00 / 12:00 / 21:00",
    scheduledThisWeek: 0,
    publishedThisMonth: 0,
    oauthType: "oauth2",
  },
  {
    id: "youtube-shorts",
    name: "YouTube Shorts",
    vendor: "Google",
    letter: "Y",
    gradient: "from-red-500 via-red-600 to-red-800",
    description: "60초 세로 영상 · 검색 SEO",
    formats: ["Shorts 60초", "설명·태그"],
    characterLimit: 5000,
    bestTime: "주말 14:00",
    scheduledThisWeek: 0,
    publishedThisMonth: 2,
    oauthType: "oauth2",
  },
  {
    id: "tiktok",
    name: "TikTok",
    vendor: "ByteDance",
    letter: "TT",
    gradient: "from-cyan-400 via-pink-500 to-rose-600",
    description: "60초 영상 · 트렌드 음원",
    formats: ["영상 60초", "캡션 2200자"],
    characterLimit: 2200,
    bestTime: "주말 20:00",
    scheduledThisWeek: 0,
    publishedThisMonth: 0,
    oauthType: "oauth2",
  },
];

export type ConnectionState = {
  channelId: ChannelId;
  connected: boolean;
  connectedAt?: string;
  accountHandle?: string;
  health: "healthy" | "warning" | "error" | "not-connected";
  lastSyncedAt?: string;
};

// 기본 연결 상태 (데모 — localStorage 가 없으면 이 값 사용)
export const DEFAULT_CONNECTIONS: ConnectionState[] = [
  { channelId: "instagram",     connected: true,  accountHandle: "@our_brand",      connectedAt: "2026-04-12", health: "healthy", lastSyncedAt: "5분 전" },
  { channelId: "threads",       connected: true,  accountHandle: "@our_brand",      connectedAt: "2026-04-12", health: "healthy", lastSyncedAt: "12분 전" },
  { channelId: "naver-blog",    connected: true,  accountHandle: "our_brand.naver", connectedAt: "2026-03-21", health: "warning", lastSyncedAt: "어제 18:30" },
  { channelId: "naver-place",   connected: true,  accountHandle: "our_brand",       connectedAt: "2026-03-21", health: "healthy", lastSyncedAt: "1시간 전" },
  { channelId: "kakao-channel", connected: true,  accountHandle: "@우리브랜드",     connectedAt: "2026-04-02", health: "healthy", lastSyncedAt: "30분 전" },
  { channelId: "x-twitter",     connected: false, health: "not-connected" },
  { channelId: "youtube-shorts",connected: false, health: "not-connected" },
  { channelId: "tiktok",        connected: false, health: "not-connected" },
];

export const STORAGE_KEY = "briq:channel-connections";

export const getChannel = (id: ChannelId) => CHANNELS.find((c) => c.id === id);
