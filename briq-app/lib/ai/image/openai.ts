// OpenAI 이미지 어댑터 — 기존 generate-image 라우트 본문을 그대로 이전.
// 빌링/한도/인증 실패를 ProviderError(isBilling) 로 정규화한다.

import OpenAI from "openai";

import { isPlaceholderKey } from "@/lib/api/demo-images";
import {
  ProviderError,
  type ImageGenInput,
  type ImageGenResult,
  type ImageProvider,
} from "./types";

const COST_MAP: Record<string, number> = { low: 0.011, medium: 0.04, high: 0.16 };

// 라우트에 있던 빌링 키워드 — OpenAI 결제/한도 신호 감지.
const BILLING_KEYWORDS = [
  "billing hard limit",
  "billing_hard_limit_reached",
  "insufficient_quota",
  "exceeded your current quota",
  "rate limit",
  "rate_limit_exceeded",
];

export class OpenAIImageProvider implements ImageProvider {
  readonly id = "openai" as const;

  isConfigured(): boolean {
    return !isPlaceholderKey(process.env.OPENAI_API_KEY);
  }

  async generate(input: ImageGenInput): Promise<ImageGenResult> {
    const apiKey = process.env.OPENAI_API_KEY ?? "";
    const model = process.env.IMAGE_MODEL || "gpt-image-1";
    const startedAt = Date.now();
    const openai = new OpenAI({ apiKey });

    try {
      const result = await openai.images.generate(
        {
          model,
          prompt: input.prompt,
          size: input.size as never,
          quality: input.quality as never,
          n: 1,
        },
        { signal: input.signal },
      );

      const item = result?.data?.[0];
      const imageDataUrl = item?.b64_json
        ? `data:image/png;base64,${item.b64_json}`
        : item?.url;

      if (!imageDataUrl) {
        throw new ProviderError(502, "OpenAI 응답에 b64_json/url 가 없습니다.", false);
      }

      return {
        imageDataUrl,
        model,
        costUsd: COST_MAP[input.quality] ?? 0.04,
        latencyMs: Date.now() - startedAt,
      };
    } catch (e: unknown) {
      if (e instanceof ProviderError) throw e;
      const err = e as { error?: { message?: string }; message?: string; status?: number };
      const message = err?.error?.message || err?.message || String(e);
      const status = err?.status || 500;
      const isBilling = BILLING_KEYWORDS.some((k) =>
        message.toLowerCase().includes(k),
      );
      throw new ProviderError(status, message, isBilling || status === 429 || status === 402);
    }
  }
}
