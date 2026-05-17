// 업종별 Persona Engine — 사양 §3
//
// 같은 "AI 모델" 이라도 업종에 따라 촬영 스타일·표정·카메라·편집·자막이
// 전혀 달라야 합니다. 이 파일은 그 차이를 코드화한 프리셋 라이브러리.
//
// Persona 신규 생성 시 (예: "cafe" 업종 선택) 이 프리셋을 기본값으로 채우고,
// 사용자가 일부 필드만 수정해서 자기 브랜드만의 페르소나를 완성.

import type {
  ExpressionProfile,
  PoseProfile,
  FashionProfile,
  LightingProfile,
  CameraProfile,
  MotionProfile,
  VoiceProfile,
  Persona,
} from "@/lib/brand-os/types";

export type PersonaIndustry = "cafe" | "restaurant" | "beauty" | "fitness" | "stay" | "local";

export type PersonaPreset = {
  industry: PersonaIndustry;
  label: string;
  /** 한 줄 컨셉 — UI 에서 사용자가 선택할 때 보임 */
  conceptLine: string;
  expression: ExpressionProfile;
  pose: PoseProfile;
  fashion: FashionProfile;
  lighting: LightingProfile;
  camera: CameraProfile;
  motion: MotionProfile;
  voice: VoiceProfile;
  /** 컨텐츠 생성 시 prompt 에 항상 주입할 시각 컨텍스트 */
  visualMantra: string;
  /** 영상 자막 스타일 */
  subtitleStyle: {
    position: "top" | "center" | "bottom";
    fontWeight: "regular" | "medium" | "bold";
    background: "none" | "dim-scrim" | "blur-box";
    animation: "fade" | "pop" | "type-on" | "slide";
  };
  /** 편집 톤 */
  editingPreset: {
    pace: "slow" | "moderate" | "fast";
    cutsPer10s: number;
    transitions: ("hard-cut" | "match-cut" | "whip-pan" | "speed-ramp" | "dissolve")[];
    grading: "warm-natural" | "cool-clinical" | "filmic-low-contrast" | "vivid-pop";
  };
};

// ─────────────────────────────────────────────────────────────
// CAFE — 감성 브이로그 스타일, 자연광, 아이폰 촬영 느낌
// ─────────────────────────────────────────────────────────────

const CAFE_PRESET: PersonaPreset = {
  industry: "cafe",
  label: "카페 / 감성 브이로그",
  conceptLine: "북향 창가의 따뜻한 아침. 손에 든 잔 한 잔.",
  expression: {
    defaultMood: "soft-smile",
    smileType: "closed-mouth",
    eyeContact: "slight-away",
    variationLatitude: 0.3,
  },
  pose: {
    defaultStance: "three-quarter",
    preferredAngles: ["eye-level", "over-shoulder"],
    handPlacements: ["holding-object", "relaxed-side"],
  },
  fashion: {
    style: "warm-natural",
    colorPalette: ["#e8d9c2", "#a78b6b", "#3c2e22", "#f4ede0"],
    typicalItems: ["linen blouse", "wool cardigan", "denim shirt", "simple t-shirt"],
    avoidItems: ["logo-heavy", "neon", "metallic"],
  },
  lighting: {
    preferred: "north-window",
    timeOfDay: ["morning", "afternoon"],
    mood: "warm",
  },
  camera: {
    device: "smartphone",
    focalLength: "35mm",
    aperture: "shallow-dof",
    filmCharacter: "iphone-native",
  },
  motion: {
    cameraMovement: ["slow-push-in", "handheld-organic"],
    subjectMotion: ["subtle-breathing", "small-gesture", "interacting-with-object"],
    shotDuration: 3.5,
  },
  voice: {
    speakingStyle: "calm Korean female 20s, low-key warm, slight whisper",
    pace: "slow",
  },
  visualMantra:
    "shot on iPhone, natural north window light, warm muted color, shallow depth of field, subtle ceramic and linen textures, candid moment, no posed feel",
  subtitleStyle: {
    position: "center",
    fontWeight: "regular",
    background: "dim-scrim",
    animation: "fade",
  },
  editingPreset: {
    pace: "slow",
    cutsPer10s: 3,
    transitions: ["dissolve", "match-cut"],
    grading: "warm-natural",
  },
};

// ─────────────────────────────────────────────────────────────
// RESTAURANT — 먹방/리뷰어 스타일, 현실적 리액션, 지역 맛집 감성
// ─────────────────────────────────────────────────────────────

const RESTAURANT_PRESET: PersonaPreset = {
  industry: "restaurant",
  label: "맛집 / 리뷰어 톤",
  conceptLine: "점심 12시 30분, 한 입 먹고 자연스럽게 끄덕임.",
  expression: {
    defaultMood: "warm",
    smileType: "natural-teeth",
    eyeContact: "direct",
    variationLatitude: 0.45,
  },
  pose: {
    defaultStance: "frontal",
    preferredAngles: ["eye-level", "over-shoulder"],
    handPlacements: ["holding-object", "near-face"],
  },
  fashion: {
    style: "warm-natural",
    colorPalette: ["#d8c4a8", "#7a5a3f", "#2a1f15"],
    typicalItems: ["clean shirt", "knit sweater", "casual jacket"],
  },
  lighting: {
    preferred: "warm-tungsten",
    timeOfDay: ["noon", "evening"],
    mood: "warm",
  },
  camera: {
    device: "smartphone",
    focalLength: "24mm",
    aperture: "moderate",
    filmCharacter: "iphone-native",
  },
  motion: {
    cameraMovement: ["handheld-organic"],
    subjectMotion: ["interacting-with-object", "small-gesture", "turning-head"],
    shotDuration: 2.5,
  },
  voice: {
    speakingStyle: "warm Korean female/male 30s, friendly review tone, occasional surprise reaction",
    pace: "moderate",
  },
  visualMantra:
    "shot on iPhone, warm tungsten + window light mix, candid reaction at the moment of tasting, food in sharp focus, person slightly out of focus, real Korean restaurant interior, no posed feel",
  subtitleStyle: {
    position: "bottom",
    fontWeight: "bold",
    background: "blur-box",
    animation: "pop",
  },
  editingPreset: {
    pace: "moderate",
    cutsPer10s: 5,
    transitions: ["hard-cut", "match-cut"],
    grading: "warm-natural",
  },
};

// ─────────────────────────────────────────────────────────────
// BEAUTY — 뷰티 인플루언서 스타일, 전후 비교, 거울샷, 고급 조명
// ─────────────────────────────────────────────────────────────

const BEAUTY_PRESET: PersonaPreset = {
  industry: "beauty",
  label: "뷰티 / 살롱 인플루언서",
  conceptLine: "전후 거울샷. 빛 한 줄. 결의 차이가 보이는 컷.",
  expression: {
    defaultMood: "confident",
    smileType: "subtle",
    eyeContact: "direct",
    variationLatitude: 0.25,
  },
  pose: {
    defaultStance: "frontal",
    preferredAngles: ["eye-level", "low-angle"],
    handPlacements: ["near-face", "relaxed-side"],
  },
  fashion: {
    style: "minimal-monochrome",
    colorPalette: ["#1a1a1a", "#e6e3dc", "#a8a39c"],
    typicalItems: ["black turtleneck", "white silk shirt", "minimal jewelry"],
  },
  lighting: {
    preferred: "softbox-studio",
    timeOfDay: ["afternoon", "evening"],
    mood: "neutral",
  },
  camera: {
    device: "mirrorless",
    focalLength: "85mm",
    aperture: "shallow-dof",
    filmCharacter: "digital-clean",
  },
  motion: {
    cameraMovement: ["static", "slow-push-in"],
    subjectMotion: ["turning-head", "small-gesture"],
    shotDuration: 2.0,
  },
  voice: {
    speakingStyle: "polished Korean female 20-30s, professional intimate, soft but confident",
    pace: "moderate",
  },
  visualMantra:
    "professional salon lighting, 85mm portrait lens, sharp focus on face and hair texture, clinical minimalist background, mirror reflection composition, before/after match cut, true-to-skin color",
  subtitleStyle: {
    position: "top",
    fontWeight: "medium",
    background: "none",
    animation: "fade",
  },
  editingPreset: {
    pace: "moderate",
    cutsPer10s: 4,
    transitions: ["match-cut", "dissolve"],
    grading: "cool-clinical",
  },
};

// ─────────────────────────────────────────────────────────────
// FITNESS — 건강한 라이프스타일, 강한 시선처리, 역동적 동작
// ─────────────────────────────────────────────────────────────

const FITNESS_PRESET: PersonaPreset = {
  industry: "fitness",
  label: "피트니스 / 헬시 라이프",
  conceptLine: "땀 한 방울. 호흡 한 번. 강한 시선 한 컷.",
  expression: {
    defaultMood: "confident",
    smileType: "subtle",
    eyeContact: "direct",
    variationLatitude: 0.3,
  },
  pose: {
    defaultStance: "frontal",
    preferredAngles: ["low-angle", "eye-level"],
    handPlacements: ["relaxed-side", "near-face"],
  },
  fashion: {
    style: "athleisure",
    colorPalette: ["#1a1a1a", "#3a3a3a", "#d8d8d8", "#a3deef"],
    typicalItems: ["fitted training top", "high-waist leggings", "running shoes"],
  },
  lighting: {
    preferred: "softbox-studio",
    timeOfDay: ["morning", "afternoon"],
    mood: "high-key-bright",
  },
  camera: {
    device: "mirrorless",
    focalLength: "35mm",
    aperture: "moderate",
    filmCharacter: "digital-clean",
  },
  motion: {
    cameraMovement: ["gimbal-smooth", "slow-push-in"],
    subjectMotion: ["walking", "subtle-breathing"],
    shotDuration: 1.8,
  },
  voice: {
    speakingStyle: "energetic Korean voice, motivational direct",
    pace: "energetic",
  },
  visualMantra:
    "high-end fitness studio, clean white background, sharp focus on athletic form, dynamic motion blur on edges, cool clinical lighting, real athletic body proportions, no over-airbrushed skin",
  subtitleStyle: {
    position: "center",
    fontWeight: "bold",
    background: "none",
    animation: "pop",
  },
  editingPreset: {
    pace: "fast",
    cutsPer10s: 7,
    transitions: ["hard-cut", "whip-pan", "speed-ramp"],
    grading: "vivid-pop",
  },
};

// ─────────────────────────────────────────────────────────────
// STAY (TRAVEL/PENSION) — 여행 유튜버, 풍경 중심, cinematic
// ─────────────────────────────────────────────────────────────

const STAY_PRESET: PersonaPreset = {
  industry: "stay",
  label: "스테이 / 여행 시네마틱",
  conceptLine: "오후 햇살에 처마 그림자. 차 한 잔. 정적 한 컷.",
  expression: {
    defaultMood: "thoughtful",
    smileType: "closed-mouth",
    eyeContact: "slight-away",
    variationLatitude: 0.2,
  },
  pose: {
    defaultStance: "side-profile",
    preferredAngles: ["over-shoulder", "high-angle"],
    handPlacements: ["holding-object", "in-pockets"],
  },
  fashion: {
    style: "vintage-curated",
    colorPalette: ["#7a6650", "#4a3a28", "#d8c8a8", "#1a1411"],
    typicalItems: ["wool coat", "linen wide-pants", "earth tone knit"],
  },
  lighting: {
    preferred: "golden-hour",
    timeOfDay: ["golden-hour", "morning"],
    mood: "moody-low-key",
  },
  camera: {
    device: "mirrorless",
    focalLength: "50mm",
    aperture: "shallow-dof",
    filmCharacter: "fuji-400h",
  },
  motion: {
    cameraMovement: ["slow-push-in", "slow-pull-out", "gimbal-smooth"],
    subjectMotion: ["walking", "turning-head", "subtle-breathing"],
    shotDuration: 4.0,
  },
  voice: {
    speakingStyle: "calm Korean voice, quiet narration, almost whisper",
    pace: "slow",
  },
  visualMantra:
    "cinematic 50mm, golden hour or overcast natural light, hanok or traditional Korean interior, film grain Fuji 400H feel, wide negative space, ambient sound implied, slow contemplative pace",
  subtitleStyle: {
    position: "bottom",
    fontWeight: "regular",
    background: "none",
    animation: "fade",
  },
  editingPreset: {
    pace: "slow",
    cutsPer10s: 2,
    transitions: ["dissolve", "match-cut"],
    grading: "filmic-low-contrast",
  },
};

// ─────────────────────────────────────────────────────────────
// LOCAL — 동네 패션·잡화·셀렉트샵
// ─────────────────────────────────────────────────────────────

const LOCAL_PRESET: PersonaPreset = {
  industry: "local",
  label: "로컬 / 셀렉트샵",
  conceptLine: "옷걸이 사이. 손이 결을 만진다. 거리 빛이 한 줄.",
  expression: {
    defaultMood: "neutral",
    smileType: "subtle",
    eyeContact: "slight-away",
    variationLatitude: 0.3,
  },
  pose: {
    defaultStance: "candid",
    preferredAngles: ["eye-level", "over-shoulder"],
    handPlacements: ["interacting-with-object"],
  },
  fashion: {
    style: "editorial-modern",
    colorPalette: ["#1a1a1a", "#d8d4cc", "#7a6a58", "#3a2a1f"],
    typicalItems: ["oversized blazer", "wide linen pants", "minimal sneaker"],
  },
  lighting: {
    preferred: "north-window",
    timeOfDay: ["afternoon"],
    mood: "neutral",
  },
  camera: {
    device: "mirrorless",
    focalLength: "35mm",
    aperture: "shallow-dof",
    filmCharacter: "digital-clean",
  },
  motion: {
    cameraMovement: ["handheld-organic", "slow-push-in"],
    subjectMotion: ["interacting-with-object", "walking"],
    shotDuration: 2.8,
  },
  voice: {
    speakingStyle: "casual editorial Korean voice, dry and observational",
    pace: "moderate",
  },
  visualMantra:
    "editorial concept store interior, north window soft light, fabric texture and wooden fixtures, candid hand reaching toward garment, 35mm shallow focus, magazine-grade composition",
  subtitleStyle: {
    position: "top",
    fontWeight: "regular",
    background: "none",
    animation: "fade",
  },
  editingPreset: {
    pace: "moderate",
    cutsPer10s: 4,
    transitions: ["hard-cut", "match-cut"],
    grading: "filmic-low-contrast",
  },
};

// ─────────────────────────────────────────────────────────────
// 통합 export
// ─────────────────────────────────────────────────────────────

export const PERSONA_PRESETS: Record<PersonaIndustry, PersonaPreset> = {
  cafe: CAFE_PRESET,
  restaurant: RESTAURANT_PRESET,
  beauty: BEAUTY_PRESET,
  fitness: FITNESS_PRESET,
  stay: STAY_PRESET,
  local: LOCAL_PRESET,
};

export function getPersonaPreset(industry: PersonaIndustry): PersonaPreset {
  return PERSONA_PRESETS[industry];
}

/**
 * 프리셋 + 사용자 입력 → 완성된 Persona 생성.
 * Identity 는 빈 reference photos 로 시작 — 사용자가 업로드 후 채움.
 */
export function buildPersonaFromPreset(opts: {
  brandId: string;
  name: string;
  industry: PersonaIndustry;
  gender: Persona["gender"];
  ageRange: Persona["ageRange"];
  role?: Persona["role"];
  lockedFeatures?: Partial<Persona["identity"]["lockedFeatures"]>;
}): Persona {
  const preset = PERSONA_PRESETS[opts.industry];
  const now = new Date().toISOString();
  // identity lock 의 기본값 — preset 에서 유추한 자연스러운 한국인 20-30대 가정
  const defaultLockedFeatures: Persona["identity"]["lockedFeatures"] = {
    faceShape: "oval",
    eyeShape: opts.gender === "male" ? "almond" : "double-lid",
    skinTone: "fair-warm",
    hairstyle:
      opts.industry === "beauty"
        ? "shoulder-length wavy chestnut"
        : opts.industry === "fitness"
          ? "high ponytail"
          : opts.industry === "stay"
            ? "loose low bun"
            : "shoulder-length straight dark brown",
    hairColor: "dark brown",
    bodyType: opts.industry === "fitness" ? "athletic" : "slim",
  };

  return {
    id: `persona_${opts.brandId}_${Date.now()}`,
    brandId: opts.brandId,
    name: opts.name,
    gender: opts.gender,
    ageRange: opts.ageRange,
    role: opts.role ?? "model",
    identity: {
      referencePhotos: [],
      seed: deterministicSeed(opts.brandId, opts.name),
      lockedFeatures: { ...defaultLockedFeatures, ...opts.lockedFeatures },
    },
    expression: preset.expression,
    pose: preset.pose,
    fashion: preset.fashion,
    lighting: preset.lighting,
    camera: preset.camera,
    motion: preset.motion,
    voice: preset.voice,
    industry: opts.industry,
    identityLockStrength: 0.85,
    createdAt: now,
    updatedAt: now,
  };
}

/** 결정적 seed — 브랜드 id + 페르소나 이름 기반 */
function deterministicSeed(brandId: string, name: string): number {
  const s = `${brandId}::${name}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 2_147_483_647;
}
