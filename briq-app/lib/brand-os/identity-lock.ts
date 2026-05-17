// Identity Lock — 사양 §2
//
// 같은 브랜드에서 생성되는 모든 콘텐츠가 **같은 인물처럼 보이게** 만드는 핵심 시스템.
//
// 구성 요소:
//   1. 고정 seed (브랜드+페르소나 결정적)
//   2. 잠금 시각 특성 (얼굴형·눈매·피부톤·헤어 등) → prompt 항상 포함
//   3. reference 이미지 (1~5장) → IP-Adapter / InstantID / Redux 입력
//   4. LoRA 모델 ID (학습 완료 시) → 가중치 적용
//   5. 검증 — 생성 결과를 reference 와 face-embedding 비교 (외부 서비스)
//
// 외부 제공자 (어댑터 패턴):
//   - fal.ai: flux-redux / instantid / pulid
//   - Replicate: photomaker, instantid, sdxl-lora
//   - Modal/RunPod: 자체 호스트 SDXL + LoRA
//
// 이 파일은 그 어댑터에 넣을 prompt + seed 를 표준화해서 생성.

import type { Persona, IdentityProfile } from "@/lib/brand-os/types";

// ─────────────────────────────────────────────────────────────
// 1. seed lock
// ─────────────────────────────────────────────────────────────

/**
 * seed 결정 — persona 의 기본 seed 를 사용하되,
 * 콘텐츠 종류별 결정적 offset 을 더해 일관성 유지하면서 다양성 확보.
 *
 * 같은 종류의 콘텐츠는 같은 seed → 모델 얼굴 동일
 * 다른 종류는 약간 다른 seed → 자연스러운 변주
 */
export function resolveSeed(opts: {
  persona: Persona;
  /** 콘텐츠 종류 — 같은 종류는 같은 seed */
  variant?: "cardnews-1" | "cardnews-2" | "cardnews-3" | "reel-cover" | "story" | string;
  /** identityLockStrength = 1 이면 variant 무시 (절대 일관) */
}): number {
  const base = opts.persona.identity.seed;
  if (opts.persona.identityLockStrength >= 0.95 || !opts.variant) return base;
  // variant 마다 0~511 offset
  let h = 0;
  for (let i = 0; i < opts.variant.length; i++) h = (h * 31 + opts.variant.charCodeAt(i)) | 0;
  const offset = Math.abs(h) % 512;
  return base + offset;
}

// ─────────────────────────────────────────────────────────────
// 2. Identity prompt template
//   생성 prompt 의 앞부분에 항상 들어가는 잠금 디스크립터.
//   외부 모델이 동일 인물처럼 그리도록 강제.
// ─────────────────────────────────────────────────────────────

/**
 * 잠금 시각 특성 → 영어 prompt 문장.
 * 외부 이미지 모델 (gpt-image-1, Flux, SDXL) 다 영어 prompt 가 더 정확.
 */
export function buildIdentityPrompt(persona: Persona): string {
  const id = persona.identity.lockedFeatures;
  const age = humanReadableAge(persona.ageRange);
  const gender = persona.gender === "female" ? "Korean woman" : persona.gender === "male" ? "Korean man" : "Korean person";

  const parts: string[] = [
    `the same recurring ${age} ${gender}`,
    `${id.faceShape} face shape`,
    `${id.eyeShape} eyes`,
    `${id.skinTone} skin tone with natural pores (not airbrushed)`,
    `${id.hairstyle}`,
    `${id.bodyType} build`,
  ];
  if (id.distinctiveFeature) parts.push(id.distinctiveFeature);

  return parts.join(", ");
}

function humanReadableAge(range: Persona["ageRange"]): string {
  switch (range) {
    case "early-20s":
      return "22-year-old";
    case "late-20s":
      return "27-year-old";
    case "early-30s":
      return "31-year-old";
    case "late-30s":
      return "36-year-old";
    case "40s":
      return "early-40s";
    case "50s":
      return "mid-50s";
  }
}

// ─────────────────────────────────────────────────────────────
// 3. Style prompt — persona 의 표정·포즈·패션·조명·카메라 → prompt
// ─────────────────────────────────────────────────────────────

export function buildStylePrompt(persona: Persona, sceneOverride?: string): string {
  const parts: string[] = [];

  // 표정
  parts.push(
    `${persona.expression.defaultMood.replace(/-/g, " ")} expression`,
    `${persona.expression.smileType.replace(/-/g, " ")} smile`,
    `${persona.expression.eyeContact.replace(/-/g, " ")} gaze`,
  );

  // 포즈
  parts.push(
    `${persona.pose.defaultStance.replace(/-/g, " ")} body angle`,
  );
  if (persona.pose.preferredAngles.length > 0) {
    parts.push(`shot at ${persona.pose.preferredAngles[0].replace(/-/g, " ")} angle`);
  }

  // 패션
  if (persona.fashion.typicalItems.length > 0) {
    parts.push(`wearing ${persona.fashion.typicalItems[0]}`);
  }
  parts.push(`${persona.fashion.style.replace(/-/g, " ")} wardrobe`);

  // 조명
  parts.push(
    `${persona.lighting.preferred.replace(/-/g, " ")} lighting`,
    `${persona.lighting.mood.replace(/-/g, " ")} mood`,
  );

  // 카메라
  parts.push(
    `shot on ${persona.camera.device}`,
    `${persona.camera.focalLength} lens`,
    `${persona.camera.aperture.replace(/-/g, " ")} aperture`,
  );
  if (persona.camera.filmCharacter) {
    parts.push(`${persona.camera.filmCharacter.replace(/-/g, " ")} color character`);
  }

  if (sceneOverride) parts.push(sceneOverride);

  return parts.join(", ");
}

// ─────────────────────────────────────────────────────────────
// 4. 최종 prompt 조립 — Identity + Style + Quality guardrails
// ─────────────────────────────────────────────────────────────

import { buildQualityGuardrails } from "@/lib/brand-os/quality-guardrails";

export type IdentityLockedPrompt = {
  prompt: string;
  negativePrompt: string;
  seed: number;
  referencePhotos: string[];
  loraModelId?: string;
};

/**
 * 한 컷 생성 시 외부 이미지 모델에 보낼 전체 prompt 묶음.
 * scene · action · emotion 만 사용자가 추가로 명시.
 */
export function compileIdentityLockedPrompt(opts: {
  persona: Persona;
  scene?: string;
  action?: string;
  emotion?: string;
  /** variant — seed offset 결정 */
  variant?: string;
}): IdentityLockedPrompt {
  const identity = buildIdentityPrompt(opts.persona);
  const style = buildStylePrompt(opts.persona);
  const sceneBlock = [
    opts.scene && `scene: ${opts.scene}`,
    opts.action && `action: ${opts.action}`,
    opts.emotion && `feeling: ${opts.emotion}`,
  ]
    .filter(Boolean)
    .join(", ");

  const persona = opts.persona;
  const mantra = persona.industry
    ? `, ${getMantra(persona.industry)}`
    : "";

  const positive = [
    identity,
    style,
    sceneBlock,
    mantra,
    "realistic Korean smartphone influencer photography",
  ]
    .filter(Boolean)
    .join(". ");

  const { positiveTail, negative } = buildQualityGuardrails();
  const prompt = `${positive}. ${positiveTail}`.replace(/\.\s*\./g, ".");

  return {
    prompt,
    negativePrompt: negative,
    seed: resolveSeed({ persona, variant: opts.variant }),
    referencePhotos: persona.identity.referencePhotos.map((r) => r.url),
    loraModelId: persona.identity.loraModelId,
  };
}

import { getPersonaPreset, type PersonaIndustry } from "@/lib/brand-os/persona-presets";
function getMantra(industry: Persona["industry"]): string {
  return getPersonaPreset(industry as PersonaIndustry).visualMantra;
}

/**
 * Persona 초상 미리보기용 prompt — 매거진 에디토리얼 포트레이트.
 * 가게 운영자가 "이 사람이 우리 가게 모델" 이라고 한눈에 알아보게.
 */
export function compilePortraitPrompt(persona: Persona): IdentityLockedPrompt {
  const identity = buildIdentityPrompt(persona);
  const style = buildStylePrompt(persona);
  const portraitScene =
    "editorial half-body portrait, plain warm beige paper background, soft natural window light from the left, looking slightly off-camera, magazine cover composition, sharp focus on face, shallow depth of field background, real Korean influencer reference photo aesthetic, photographed on a Sony A7 with 85mm lens";

  const mantra = persona.industry
    ? `, ${getMantra(persona.industry)}`
    : "";

  const positive = [
    identity,
    style,
    portraitScene,
    mantra,
    "single subject, centered composition, no other people, no props on face",
  ].join(". ");

  const { positiveTail, negative } = buildQualityGuardrails();
  const prompt = `${positive}. ${positiveTail}`.replace(/\.\s*\./g, ".");

  return {
    prompt,
    negativePrompt: negative,
    seed: resolveSeed({ persona, variant: "portrait-preview" }),
    referencePhotos: persona.identity.referencePhotos.map((r) => r.url),
    loraModelId: persona.identity.loraModelId,
  };
}

// ─────────────────────────────────────────────────────────────
// 5. Identity verification 인터페이스 (외부 서비스 호출 어댑터)
//   생성된 이미지가 reference 와 같은 인물인지 face-embedding 비교.
//   v1 에선 stub. v2 에서 fal.ai face-similarity 또는 InsightFace 연동.
// ─────────────────────────────────────────────────────────────

export type IdentityVerificationResult = {
  /** 0~1, 높을수록 같은 인물 */
  similarity: number;
  passed: boolean;
  threshold: number;
  reason: string;
};

export async function verifyIdentity(opts: {
  generatedUrl: string;
  persona: Persona;
}): Promise<IdentityVerificationResult> {
  // v1 stub — 실제 구현은 외부 face-embedding 서비스 호출
  // 현재는 항상 통과로 마킹 (LoRA / IP-Adapter 가 처리한다고 가정)
  const threshold = 0.65;
  return {
    similarity: 0.95, // optimistic placeholder
    passed: true,
    threshold,
    reason: "verification stub — external face-embedding service not yet wired",
  };
}

// ─────────────────────────────────────────────────────────────
// 6. Reference photo 관리
// ─────────────────────────────────────────────────────────────

export function addReferencePhoto(
  identity: IdentityProfile,
  photo: { url: string; description?: string },
): IdentityProfile {
  if (identity.referencePhotos.length >= 5) {
    // 가장 오래된 거 제거 (단, 첫 장 = 마스터 컷은 보존)
    const [master, ...rest] = identity.referencePhotos;
    return {
      ...identity,
      referencePhotos: [
        master,
        ...rest.slice(1),
        { ...photo, uploadedAt: new Date().toISOString() },
      ],
    };
  }
  return {
    ...identity,
    referencePhotos: [
      ...identity.referencePhotos,
      { ...photo, uploadedAt: new Date().toISOString() },
    ],
  };
}
