// Brand OS — "AI 인플루언서 기반 마케팅 운영 시스템" 의 핵심 타입
//
// 데이터 계층 구조:
//   Brand (가게)  →  Persona (AI 모델)  →  Campaign (목적)  →  ContentAsset (결과물)
//                 ↘
//                  BrandMemory (장기 운영 메모리)
//
// localStorage 기반 (v1). Postgres 마이그레이션은 `storage.ts` 인터페이스만 갈아끼우면 됨.

import type { Brand as BaseBrand } from "@/types";

// ─────────────────────────────────────────────────────────────
// 1. Brand — 기존 Brand 타입 확장
// ─────────────────────────────────────────────────────────────

export type BrandExtended = BaseBrand & {
  /** 브랜드톤 — 5종 톤 시스템과 연결 */
  voiceTone?: "editorial" | "minimal" | "warm-shop" | "witty" | "premium";
  /** 타겟 연령 */
  targetAge?: "10s" | "20s" | "30s" | "40s" | "50s+" | "30-40s" | "20-30s";
  /** SNS 스타일 */
  snsStyle?: "lifestyle" | "review" | "tutorial" | "vlog" | "editorial";
  /** 금지 표현 */
  forbiddenPhrases?: string[];
  /** CTA 스타일 */
  ctaStyle?: "soft" | "direct" | "magazine" | "challenge" | "exclusive";
  /** 활성 Persona id (선택된 AI 모델) */
  activePersonaId?: string;
};

// ─────────────────────────────────────────────────────────────
// 2. Persona — AI 인플루언서 모델
// ─────────────────────────────────────────────────────────────

export type Gender = "female" | "male" | "neutral";
export type AgeRange = "early-20s" | "late-20s" | "early-30s" | "late-30s" | "40s" | "50s";

export type IdentityProfile = {
  /** 얼굴 reference 이미지들 — 최대 5장 (LoRA 학습 또는 IP-Adapter 입력) */
  referencePhotos: {
    url: string;
    description?: string; // "정면 자연광", "측면 미소", "측면 무표정" 등
    uploadedAt: string;
  }[];
  /** 고정 seed — 같은 prompt 면 같은 결과 보장 */
  seed: number;
  /** 얼굴 임베딩 (외부 서비스에서 계산해 저장) — base64 또는 url */
  faceEmbedding?: string;
  /** LoRA 모델 ID — fine-tune 완료 시 채워짐 (fal.ai / Replicate) */
  loraModelId?: string;
  /** 변하면 안 되는 시각적 고정 요소 — prompt 항상 포함 */
  lockedFeatures: {
    faceShape: string; // "oval", "heart", "round", "long"
    eyeShape: string; // "almond", "round", "monolid", "double-lid"
    skinTone: string; // "fair-warm", "fair-cool", "medium-warm", "medium-neutral" 등
    hairstyle: string; // "shoulder-length wavy brown", "short pixie", 등
    hairColor: string;
    bodyType: string; // "slim", "athletic", "curvy", "average"
    distinctiveFeature?: string; // "small mole near lip", "thin eyebrows" 등 (개성 강화)
  };
};

export type ExpressionProfile = {
  defaultMood: "soft-smile" | "neutral" | "confident" | "warm" | "thoughtful";
  smileType: "closed-mouth" | "natural-teeth" | "subtle" | "wide";
  eyeContact: "direct" | "slight-away" | "downcast";
  /** 표정 변주 허용 폭 — 0 (얼굴 항상 같음) ~ 1 (자유) */
  variationLatitude: number;
};

export type PoseProfile = {
  defaultStance: "three-quarter" | "frontal" | "side-profile" | "candid";
  preferredAngles: ("over-shoulder" | "low-angle" | "high-angle" | "eye-level")[];
  handPlacements: ("relaxed-side" | "holding-object" | "near-face" | "in-pockets" | "interacting-with-object")[];
};

export type FashionProfile = {
  style:
    | "minimal-monochrome"
    | "warm-natural"
    | "editorial-modern"
    | "athleisure"
    | "vintage-curated"
    | "preppy"
    | "streetwear";
  colorPalette: string[]; // hex codes — 코어 의상 색
  typicalItems: string[]; // "linen shirt", "wool cardigan", "athletic top"
  avoidItems?: string[]; // "logo-heavy", "neon" 등
};

export type LightingProfile = {
  preferred: "golden-hour" | "north-window" | "softbox-studio" | "overcast-natural" | "warm-tungsten";
  timeOfDay: ("morning" | "noon" | "afternoon" | "golden-hour" | "evening" | "night")[];
  mood: "warm" | "cool" | "neutral" | "moody-low-key" | "high-key-bright";
};

export type CameraProfile = {
  device: "smartphone" | "mirrorless" | "dslr" | "vintage-film";
  focalLength: "24mm" | "35mm" | "50mm" | "85mm";
  aperture: "shallow-dof" | "moderate" | "deep-focus";
  /** 셔터/필름 그레인 같은 캐릭터 */
  filmCharacter?: "kodak-portra" | "fuji-400h" | "digital-clean" | "iphone-native";
};

export type MotionProfile = {
  /** 영상 생성 시 카메라 움직임 */
  cameraMovement: ("static" | "slow-push-in" | "slow-pull-out" | "handheld-organic" | "gimbal-smooth")[];
  /** 인물 움직임 */
  subjectMotion: ("subtle-breathing" | "small-gesture" | "walking" | "turning-head" | "interacting-with-object")[];
  /** 평균 컷 길이 (초) */
  shotDuration: number;
};

export type VoiceProfile = {
  /** TTS 또는 영상 더빙 시 음성 ID (HeyGen / ElevenLabs 등) */
  voiceId?: string;
  /** 톤 안내 — script 생성 시 system prompt 에 주입 */
  speakingStyle: string; // "calm warm Korean female 20s, soft pace, intimate"
  pace: "slow" | "moderate" | "energetic";
};

export type Persona = {
  id: string;
  brandId: string;
  name: string; // "민지" "유진" 등 친근한 이름
  gender: Gender;
  ageRange: AgeRange;
  /** Persona 의 역할 컨텍스트 — "사장님 본인" 또는 "전속 모델" */
  role: "owner" | "staff" | "model" | "customer";
  /** 정체성 잠금 — 변하면 안 되는 모든 것 */
  identity: IdentityProfile;
  expression: ExpressionProfile;
  pose: PoseProfile;
  fashion: FashionProfile;
  lighting: LightingProfile;
  camera: CameraProfile;
  motion: MotionProfile;
  voice: VoiceProfile;
  /** 업종 — persona-presets 와 매칭 */
  industry: BaseBrand["industry"] | "fitness";
  /** 0 (자유) ~ 1 (절대 일관성). 0.7 이상 권장 */
  identityLockStrength: number;
  /** 페르소나 초상 미리보기 — 한 번 생성하면 캐시 (재생성 가능). v1 은 단일 portrait, v2 는 LoRA 기반. */
  previewImageUrl?: string;
  previewGeneratedAt?: string;
  /** 미리보기 생성 시 사용된 prompt (디버그) */
  previewPromptUsed?: string;
  createdAt: string;
  updatedAt: string;
};

// ─────────────────────────────────────────────────────────────
// 3. Campaign — 운영 목적별 묶음
// ─────────────────────────────────────────────────────────────

export type CampaignGoal =
  | "promotion" // 일반 홍보
  | "new-menu" // 신메뉴
  | "event" // 이벤트
  | "branding" // 브랜딩
  | "retargeting" // 단골 재방문
  | "seasonal"; // 시즌

export type CampaignPlatform = "instagram" | "tiktok" | "shorts" | "naver-blog" | "naver-place" | "kakao-channel";

export type Campaign = {
  id: string;
  brandId: string;
  personaId: string;
  goal: CampaignGoal;
  platforms: CampaignPlatform[];
  targetAudience: string; // "30대 여성, 강남 직장인"
  contentStyle: string; // "warm lifestyle"
  kpi: {
    target: "reach" | "saves" | "shares" | "bookings" | "follows" | "comments";
    value: number;
  };
  schedule: {
    startDate: string;
    endDate?: string;
    cadence: "daily" | "weekly-3" | "weekly-5" | "weekday-only";
    timeOfDay?: string; // "19:00"
  };
  status: "draft" | "scheduled" | "running" | "paused" | "completed";
  createdAt: string;
};

// ─────────────────────────────────────────────────────────────
// 4. Content Asset — 실제 생성 결과물
// ─────────────────────────────────────────────────────────────

export type ContentAssetKind =
  | "feed-image" // 단일 게시물 사진
  | "cardnews" // 6장 캐러셀
  | "reel" // 30~60초 영상
  | "story" // 24시간 스토리
  | "thumbnail" // 영상 썸네일
  | "shorts" // 60초 이내
  | "tiktok" // 60초 이내
  | "blog-post" // 네이버 블로그
  | "ad-creative"; // 광고용

export type ContentAsset = {
  id: string;
  brandId: string;
  personaId: string;
  campaignId?: string;
  kind: ContentAssetKind;
  platform: CampaignPlatform;
  /** 결과물 URL — 이미지 / 영상 / json 본문 */
  outputUrl?: string;
  /** 본문 텍스트 / 캡션 */
  caption?: string;
  /** 첫 1~2초 훅 카피 */
  hook?: string;
  /** 본문 안 CTA */
  cta?: string;
  hashtags: string[];
  /** 사용된 seed (identity lock) */
  seedUsed: number;
  /** 사용된 prompt (디버그/재현용) */
  promptUsed?: string;
  /** 발행 상태 */
  status: "draft" | "approved" | "scheduled" | "published" | "archived";
  scheduledFor?: string;
  publishedAt?: string;
  /** 발행 후 반응 — 운영 메모리에 피드백 */
  metrics?: {
    reach?: number;
    saves?: number;
    shares?: number;
    comments?: number;
    clicks?: number;
  };
  createdAt: string;
};

// ─────────────────────────────────────────────────────────────
// 5. Brand Memory — 장기 운영 메모리
// ─────────────────────────────────────────────────────────────

export type BrandMemory = {
  brandId: string;
  /** 최근 사용한 훅 — 중복 방지용 (최근 N 개) */
  recentHooks: { text: string; usedAt: string; assetId: string }[];
  /** 최근 사용한 해시태그 — 같은 패턴 반복 차단 */
  recentHashtags: { tag: string; usedAt: string; count: number }[];
  /** 최근 사용한 구도 — composition similarity hash */
  recentCompositions: { hash: string; usedAt: string; assetId: string }[];
  /** 잘 반응 나온 콘텐츠 패턴 */
  winnerPatterns: {
    hookPattern?: string;
    hashtagSet?: string[];
    composition?: string;
    timeOfDay?: string;
    metric: { reach: number; saves: number };
    assetId: string;
  }[];
  /** 자주 쓰는 문구 (브랜드 시그니처) */
  signaturePhrases: string[];
  /** 자주 사용하는 BGM 스타일 */
  preferredBgm: string[];
  /** 지역 키워드 */
  localKeywords: string[];
  /** 마지막 업데이트 */
  updatedAt: string;
};

// ─────────────────────────────────────────────────────────────
// 6. Generation Request — 파이프라인 입력
// ─────────────────────────────────────────────────────────────

export type GenerationRequest = {
  brandId: string;
  personaId: string;
  campaignId?: string;
  kind: ContentAssetKind;
  platform: CampaignPlatform;
  /** 상황·장면 명시 */
  scene?: string;
  /** 액션 (영상의 경우) */
  action?: string;
  /** 감정 톤 */
  emotion?: string;
  /** 영상 길이 (초) */
  duration?: number;
  /** 카메라 스타일 override */
  cameraStyle?: string;
};

// ─────────────────────────────────────────────────────────────
// 7. 외부 서비스 어댑터 인터페이스
// — 이미지/영상 생성기를 plug-and-play 로 갈아끼울 수 있게
// ─────────────────────────────────────────────────────────────

export interface ImageGenerator {
  name: string;
  generate(opts: {
    prompt: string;
    seed: number;
    referencePhotos?: string[];
    aspectRatio?: "1:1" | "4:5" | "9:16" | "16:9";
    loraModelId?: string;
  }): Promise<{ url: string; meta?: Record<string, unknown> }>;
}

export interface VideoGenerator {
  name: string;
  generate(opts: {
    prompt: string;
    seed: number;
    referencePhotos?: string[];
    duration: number;
    aspectRatio?: "9:16" | "1:1" | "16:9";
    loraModelId?: string;
    voiceId?: string;
  }): Promise<{ url: string; meta?: Record<string, unknown> }>;
}

export interface IdentityProvider {
  name: string;
  /** reference 이미지 → faceEmbedding 계산 */
  computeEmbedding(referencePhotos: string[]): Promise<string>;
  /** LoRA 학습 시작 (비동기) */
  trainLora?(referencePhotos: string[]): Promise<{ loraModelId: string }>;
}
