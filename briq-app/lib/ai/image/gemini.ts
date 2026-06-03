// Gemini 이미지 어댑터 — Nano Banana(gemini-2.5-flash-image) + Imagen 4.
//
// 두 모델은 호출 API 가 다르다:
//   · Nano Banana : models.generateContent → parts[].inlineData (base64)
//   · Imagen 4    : models.generateImages → generatedImages[].image.imageBytes
//
// 모델 ID 는 자주 바뀐다 — 구현 시점에 현 문서와 대조할 것. env 로 override 가능.

import { GoogleGenAI } from "@google/genai";

import {
  ProviderError,
  type ImageGenInput,
  type ImageGenResult,
  type ImageProvider,
  type ImageProviderId,
} from "./types";

// "1024x1536" → Imagen aspectRatio. Imagen 지원: 1:1 / 3:4 / 4:3 / 9:16 / 16:9.
function toAspectRatio(size: string): string {
  const m = size.match(/^(\d+)\s*[xX]\s*(\d+)$/);
  if (!m) return "3:4";
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (w === h) return "1:1";
  const r = w / h;
  // 세로형(카드뉴스 2:3 ≈ 0.667) → 매우 길면 9:16, 보통은 3:4
  if (r < 1) return r <= 0.6 ? "9:16" : "3:4";
  return r >= 1.6 ? "16:9" : "4:3";
}

// 모델별 장당 단가(USD).
const COST_USD: Record<string, number> = {
  "gemini-2.5-flash-image": 0.039,
  "imagen-4.0-fast-generate-001": 0.02,
  "imagen-4.0-generate-001": 0.04,
  "imagen-4.0-ultra-generate-001": 0.06,
};

const DEFAULT_NANOBANANA = "gemini-2.5-flash-image";
const DEFAULT_IMAGEN = "imagen-4.0-fast-generate-001";

function isQuotaError(status: number, message: string): boolean {
  const m = message.toLowerCase();
  return (
    status === 429 ||
    status === 402 ||
    status === 403 ||
    m.includes("resource_exhausted") ||
    m.includes("permission_denied") ||
    m.includes("quota") ||
    // 무료 플랜 / 빌링 미설정 — 다른 프로바이더로 failover 시켜야 함
    m.includes("paid plan") ||
    m.includes("paid tier") ||
    m.includes("billing") ||
    m.includes("only available on")
  );
}

export class GeminiImageProvider implements ImageProvider {
  readonly id: ImageProviderId;
  private readonly model: string;
  private readonly mode: "nanobanana" | "imagen";

  constructor(mode: "nanobanana" | "imagen") {
    this.mode = mode;
    if (mode === "nanobanana") {
      this.id = "gemini-nanobanana";
      this.model = process.env.GEMINI_NANOBANANA_MODEL || DEFAULT_NANOBANANA;
    } else {
      this.id = "gemini-imagen4";
      this.model = process.env.GEMINI_IMAGEN_MODEL || DEFAULT_IMAGEN;
    }
  }

  isConfigured(): boolean {
    const key = process.env.GOOGLE_GENAI_API_KEY ?? "";
    return key.trim().length > 20;
  }

  async generate(input: ImageGenInput): Promise<ImageGenResult> {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY ?? "";
    const startedAt = Date.now();
    const ai = new GoogleGenAI({ apiKey });

    try {
      let b64: string | undefined;

      if (this.mode === "imagen") {
        const res = await ai.models.generateImages({
          model: this.model,
          prompt: input.prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: toAspectRatio(input.size),
          },
        });
        b64 = res.generatedImages?.[0]?.image?.imageBytes;
      } else {
        const res = await ai.models.generateContent({
          model: this.model,
          contents: input.prompt,
        });
        const parts = res.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            b64 = part.inlineData.data;
            break;
          }
        }
      }

      if (!b64) {
        throw new ProviderError(502, `Gemini(${this.model}) 응답에 이미지가 없습니다.`, false);
      }

      return {
        imageDataUrl: `data:image/png;base64,${b64}`,
        model: this.model,
        costUsd: COST_USD[this.model] ?? 0.04,
        latencyMs: Date.now() - startedAt,
      };
    } catch (e: unknown) {
      if (e instanceof ProviderError) throw e;
      const err = e as { status?: number; code?: number; message?: string };
      const message = err?.message || String(e);
      const status = err?.status || err?.code || 500;
      throw new ProviderError(status, message, isQuotaError(status, message));
    }
  }
}
