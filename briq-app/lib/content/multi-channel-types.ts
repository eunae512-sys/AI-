// 멀티채널 콘텐츠 자동화 — 플랫폼별 출력 타입.
//
// 한 캠페인 (brand + topic) 으로부터 8개 플랫폼 12개 아웃풋이 동시 생성된다.
// 각 플랫폼은 자기 문체·길이·후킹 패턴을 가지며 톤이 자동 변환된다.

export type PlatformId =
  | "instagram-cardnews"
  | "instagram-caption"
  | "instagram-reels"
  | "naver-place"
  | "naver-blog"
  | "naver-clip"
  | "facebook"
  | "threads"
  | "tiktok"
  | "youtube-shorts"
  | "kakao-channel";

/** 네이버 플레이스 — 한국 소상공인의 핵심 채널.
 *  공식 발행 API 가 없어 manual 발행 보조 + Make 위임만 지원.
 *  스마트플레이스 매니저에 직접 입력하는 텍스트를 생성한다.
 */
export type NaverPlaceOutput = {
  /** 새소식 (Smart Place > 소식) — 100-300자 */
  news: string;
  /** 가게 한 줄 소개 갱신 후보 5개 (검색 결과 카드에 노출) */
  taglineCandidates: string[];
  /** 영업시간·메뉴 변동 안내 */
  noticeShort: string;
  /** 사장님 인사말 — 가게 정보 > 소개글 (200-400자) */
  introduction: string;
  /** 리뷰 답글 톤 가이드 */
  reviewReplyTone: string;
  /** SEO 키워드 — 네이버 플레이스 노출용 */
  placeKeywords: string[];
  /** 발행 체크리스트 */
  checklist: { label: string; target: string; status: "ok" | "warn" | "fail" }[];
};

/** Naver 블로그 — 공식 API 종료. 발행 보조 + SEO 최적화 시스템. */
export type NaverBlogOutput = {
  /** 검색형 SEO 제목 5개 — 지역명 + 키워드 조합 */
  titleCandidates: string[];
  /** 본문 — 도입 / 본문 / 정리 / CTA 4섹션, 1500자 이상 */
  body: {
    intro: string;
    main: string[];
    summary: string;
    cta: string;
  };
  /** SEO 키워드 — 핵심 / 보조 / 롱테일 / 지역 */
  keywords: {
    primary: string[];
    secondary: string[];
    longTail: string[];
    local: string[];
  };
  /** 이미지 배치 가이드 */
  imageGuide: {
    coverAltText: string;
    captions: string[];
    placementNote: string;
  };
  /** 발행 체크리스트 */
  checklist: {
    label: string;
    target: string;
    status: "ok" | "warn" | "fail";
  }[];
  /** 글자 수 — 검증용 */
  charCount: number;
};

/** Naver 클립 — 15/30/45초 검색 숏폼 */
export type NaverClipOutput = {
  titleCandidates: string[];
  hookLine: string;
  /** 영상 길이별 구성 — 같은 컨셉 다른 길이 */
  variants: {
    duration: 15 | 30 | 45;
    scenes: { at: number; visual: string; subtitle: string; narration: string }[];
  }[];
  description: string;
  hashtags: string[];
  cta: string;
};

/** 페이스북 — 정보형 + 공유형 */
export type FacebookOutput = {
  post: string; // 300~500자, 정보 + 공유 유도
  cta: string;
};

/** 스레드 — 대화형 + 질문 구조 */
export type ThreadsOutput = {
  /** 1-3개 스레드 (각 280자 한도). 첫 글: 후킹 질문, 뒤: 답변/디테일 */
  posts: string[];
};

/** 틱톡 — 3초 후킹, 빠른 템포 */
export type TikTokOutput = {
  hook3s: string; // 첫 3초 자막
  script: { at: number; visual: string; subtitle: string }[];
  caption: string;
  hashtags: string[];
  cta: string;
};

/** 유튜브 쇼츠 — 제목 클릭률 + 고정댓글 */
export type YouTubeShortsOutput = {
  titleCandidates: string[]; // 클릭률 최적화 5개
  description: string;
  hashtags: string[];
  pinnedComment: string; // 고정댓글
  cta: string;
};

/** 카카오톡 채널 — 클릭 유도 짧은 메시지 */
export type KakaoChannelOutput = {
  message: string; // 80~120자
  linkLabel: string; // 버튼 텍스트
};

/** 인스타 캡션 — 카드뉴스/릴스 본문 (이미 hook-generator 가 만들지만 여기서 다시 노출용) */
export type InstagramCaptionOutput = {
  caption: string;
  hashtags: string[];
  cta: string;
};

/** 인스타 릴스 — 대본 (영상 자체는 ReelsPreview가 별도) */
export type InstagramReelsOutput = {
  hook3s: string;
  scenes: { at: number; visual: string; subtitle: string }[];
  caption: string;
};

/** 멀티채널 통합 출력 — 한 캠페인이 만드는 8 플랫폼 12 아웃풋 */
export type MultiChannelCampaign = {
  topic: string;
  brandId: string;
  generatedAt: string; // ISO

  instagramCardnews: {
    headline: string;
    slideCount: number;
    /** hook-generator 의 결과 그대로 — cardnews 슬라이드는 이미 카드 카드뉴스 시스템에서 생성됨 */
  };
  instagramCaption: InstagramCaptionOutput;
  instagramReels: InstagramReelsOutput;
  naverPlace: NaverPlaceOutput;
  naverBlog: NaverBlogOutput;
  naverClip: NaverClipOutput;
  facebook: FacebookOutput;
  threads: ThreadsOutput;
  tiktok: TikTokOutput;
  youtubeShorts: YouTubeShortsOutput;
  kakaoChannel: KakaoChannelOutput;
};
