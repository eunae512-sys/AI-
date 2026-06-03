// fal.ai 영상 생성 설정 — Veo 3.1 Fast / Kling.
//
// 비동기 큐 전용 (submit → status → result). 모델 슬러그·입력 스키마는 자주 바뀜 →
// env override 가능. 기본은 최저가 티어(Veo 3 Fast).
//
// 주의: 모델 슬러그는 구현 시점에 fal.ai 문서로 검증할 것.

import "server-only";

import { fal } from "@fal-ai/client";

let configured = false;

/** FAL_KEY 가 있으면 fal 클라이언트를 1회 설정하고 true. 없으면 false. */
export function ensureFalConfigured(): boolean {
  const key = process.env.FAL_KEY ?? "";
  if (key.trim().length < 8) return false;
  if (!configured) {
    fal.config({ credentials: key });
    configured = true;
  }
  return true;
}

// 텍스트→영상 / 이미지→영상 모델 슬러그.
export const T2V_MODEL = process.env.FAL_VIDEO_MODEL_T2V || "fal-ai/veo3/fast";
export const I2V_MODEL =
  process.env.FAL_VIDEO_MODEL_I2V || "fal-ai/veo3/fast/image-to-video";

// 8초 클립 단가(USD × 1000, 정수). Veo 3 Fast ≈ $0.40.
export const COST_USD_MILLI: Record<string, number> = {
  "fal-ai/veo3/fast": 400,
  "fal-ai/veo3/fast/image-to-video": 400,
};

export function costMilliFor(model: string): number {
  return COST_USD_MILLI[model] ?? 400;
}

export { fal };
