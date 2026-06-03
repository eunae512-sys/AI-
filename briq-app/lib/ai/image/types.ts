// 이미지 생성 프로바이더 추상화 — OpenAI / Gemini 를 한 계약 뒤로.
//
// 설계 원칙
//   · 어댑터는 "이미 강화된(fortified) 프롬프트"를 받는다. "no text" 접미사 등
//     공통 전처리는 라우트가 책임진다 (프로바이더 무관).
//   · 실패는 ProviderError 로 정규화 → 라우트의 3단 폴백(Pexels→데모)이
//     프로바이더와 무관하게 동작.
//   · 반환은 항상 { imageDataUrl, model, costUsd, latencyMs } 로 정규화.

export type ImageQuality = "low" | "medium" | "high";

export type ImageProviderId =
  | "openai"
  | "gemini-nanobanana"
  | "gemini-imagen4";

export interface ImageGenInput {
  /** 이미 강화된 프롬프트 (라우트에서 "no text..." 접미사 부착 완료) */
  prompt: string;
  /** "1024x1536" 형식 — 어댑터가 자체 포맷(aspectRatio 등)으로 매핑 */
  size: string;
  quality: ImageQuality;
  signal?: AbortSignal;
}

export interface ImageGenResult {
  /** "data:image/png;base64,..." 또는 외부 https URL */
  imageDataUrl: string;
  model: string;
  costUsd: number;
  latencyMs: number;
}

export interface ImageProvider {
  id: ImageProviderId;
  /** 키·설정이 갖춰졌는지 — index 의 폴백 체인이 이걸로 건너뜀 판단 */
  isConfigured(): boolean;
  /** 실패 시 ProviderError throw */
  generate(input: ImageGenInput): Promise<ImageGenResult>;
}

/**
 * 프로바이더 무관 에러. 라우트는 isBilling / status 만 보고 폴백 결정.
 * (OpenAI 의 billing_hard_limit, Gemini 의 RESOURCE_EXHAUSTED 등을 동일 취급)
 */
export class ProviderError extends Error {
  constructor(
    public status: number,
    message: string,
    public isBilling: boolean,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
