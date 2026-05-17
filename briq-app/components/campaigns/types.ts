// Campaign 단일 흐름 타입.
//
// 사용자는 "옵션" 을 보지 않는다. 그 결정들은 autoDecisions 필드에 "이미 정해진 결과" 로만 보인다.
// 핵심 결과물은 카드뉴스 (슬라이드) + 릴스 (세로 클립) 두 가지.

export type CampaignChannel = "Instagram" | "Naver Blog" | "Story" | "Kakao 채널" | "Threads";

/** 인스타 카드뉴스 후킹 공식 — 슬라이드 역할.
 *
 *   hook    — 1번. 저장·클릭 유도하는 헤드 (숫자·반전·약속·비밀·질문)
 *   problem — 2번. 페인포인트 직설 ("이것 때문에 망설이셨죠")
 *   value   — 3~N번. 핵심 정보·해결·이야기 (저장 가치)
 *   proof   — 단골 후기·숫자·실사 (사회적 증거)
 *   cta     — 마지막. 단 하나의 명확한 행동 (저장/공유/DM/팔로우)
 */
export type SlideRole = "hook" | "problem" | "value" | "proof" | "cta";

/** 슬라이드 비주얼 유형.
 *
 *   cover — 1번 슬라이드. 매거진 표지 결 (큰 display 서체, 마스트헤드, 호번 표시)
 *   inner — 2~7번. 에디토리얼 본문 결 (헤드라인 + 보조 한 줄)
 */
export type SlideDisplay = "cover" | "inner";

/** 디자이너 컴포지션 — 슬라이드별로 다른 레이아웃을 의도적으로 섞어 "한 사람이 그렸다" 느낌.
 *
 *   masthead     — 표지/마감 슬라이드. 마스트헤드 + 큰 display 헤드 (중앙)
 *   pillar-left  — 좌측 얇은 세로선 + 챕터 넘버럴 + 헤드라인 (에디토리얼 기사 결)
 *   paper-split  — 좌측 페이퍼 패널(텍스트) + 우측 이미지 (or 반대)
 *   overlay-card — 풀블리드 이미지 + 페이퍼 카드 오버레이 (인쇄물 결)
 *   type-hero    — 페이퍼 톤 위 타이포그래피 자체가 비주얼 (PROOF 용)
 */
export type SlideComposition = "masthead" | "pillar-left" | "paper-split" | "overlay-card" | "type-hero";

export type CardnewsSlide = {
  /** 1.. 슬라이드 번호 */
  n: number;
  /** 인스타 마케팅 슬라이드 역할 — 후킹 공식 안 위치 */
  role?: SlideRole;
  /** 비주얼 유형 — cover 슬라이드는 매거진 표지처럼, inner 는 본문처럼 */
  display?: SlideDisplay;
  /** 디자이너 컴포지션 — 7장이 각각 다른 레이아웃을 갖도록 자동 분배 */
  composition?: SlideComposition;
  /** 페이퍼 톤 — 컴포지션이 페이퍼 패널을 쓸 때 색상 (cream/dust/ink/sand/sage) */
  paperTone?: "cream" | "dust" | "ink" | "sand" | "sage";
  /** 슬라이드 배경 이미지 (없으면 페이퍼 톤 색지) */
  cover?: string;
  /** 슬라이드 핵심 카피 — display 가 cover 면 60-96px, inner 면 26-44px */
  caption: string;
  /** 보조 한 줄 — 본문 결 받쳐주는 작은 텍스트 (14-18px). 없으면 미표시. */
  subtext?: string;
  /** Pexels 검색용 영문 쿼리 */
  imageQuery?: string;
  /** 작은 보조선 — 호번·발행일 (마스트헤드 우측) */
  footer?: string;
  /** 텍스트 색 — 자동 결정 결과만 보임 */
  ink?: "light" | "dark";
  /** 텍스트 자동 배치 (안전영역 안 4분면 중 하나) */
  textAt?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
};

/** 브랜드 마크 표시 — 카드뉴스 전체에 적용. */
export type BrandMarkConfig = {
  /** 로고 이미지 (data URL) — 없으면 워드마크 텍스트만 표시 */
  logoDataUrl?: string;
  /** 표시 위치 */
  position: "top-left" | "top-center" | "top-right";
  /** 인너 슬라이드(2~7번) 에도 표시할지 — 기본 true.
   * false 면 표지(1번)에만 크게, 나머지는 워드마크 없음. */
  showOnInner: boolean;
};

export type ReelsClip = {
  /** 첫 프레임 이미지 */
  poster?: string;
  /** 실제 비디오 URL (Pexels MP4 등). 없으면 마운트 시 자동 검색 */
  videoUrl?: string;
  /** Pexels 비디오 검색용 영문 쿼리 — 없으면 industry + caption 으로 자동 합성 */
  videoQuery?: string;
  /** 영상 길이 (초) */
  durationSec: number;
  /** 화면 안 자막 시퀀스 — 1~3 줄 */
  subtitles: { t: string; at: number }[];
  /** 추천 BGM 결 */
  bgmMood: string;
  /** 컷 수 — 자동 결정 */
  cuts: number;
};

/** 인스타 마케팅 자산 묶음 — 카드뉴스 1건이 출고될 때 같이 나가는 것들. */
export type CardnewsMarketing = {
  /** 인스타 게시물 캡션 — 후킹 첫 줄 + 본문 + CTA 끝 */
  caption: string;
  /** 해시태그 (보통 8~15개) — 핵심·범용·롱테일 섞임 */
  hashtags: string[];
  /** 마지막 슬라이드 + 캡션 끝의 단일 행동 (저장/공유/DM/팔로우 중 하나만) */
  cta: string;
  /** 예상 지표 — 발행 전에 기대치를 보여줘서 사장님이 "이게 왜 좋은지" 알게. */
  expectedMetrics: {
    saveRate: string;   // "5.4% (+1.2%p)"
    shareRate: string;  // "1.8%"
    comments: string;   // "12 ~ 18"
    followConv: string; // "2.1%p"
  };
};

export type CampaignPiece =
  | {
      kind: "cardnews";
      format: "Instagram Feed";
      title: string;
      copyPreview: string;
      cardnews: CardnewsSlide[];
      /** 카드뉴스에 딸린 마케팅 자산 — 캡션/해시태그/CTA/예상지표 */
      marketing?: CardnewsMarketing;
    }
  | {
      kind: "reels";
      format: "Instagram Reels";
      title: string;
      copyPreview: string;
      reels: ReelsClip;
    }
  | {
      kind: "blog";
      format: "Naver Blog";
      title: string;
      copyPreview: string;
    }
  | {
      kind: "story";
      format: "Story";
      title: string;
      copyPreview: string;
      reels?: ReelsClip;
    }
  | {
      kind: "kakao";
      format: "Kakao 채널";
      title: string;
      copyPreview: string;
    };

export type AutoDecision = {
  label: string;
  value: string;
  note?: string;
};

export type CampaignDraft = {
  id: string;
  headline: string;
  kind: string;
  rationale: string;
  channels: CampaignChannel[];
  schedule: {
    startsAt: string;
    postsTotal: number;
  };
  autoDecisions: AutoDecision[];
  pieces: CampaignPiece[];
};
