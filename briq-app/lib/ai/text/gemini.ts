// Gemini 텍스트 생성 — JSON 출력 전용 헬퍼.
//
// 카드뉴스 문구 등 구조화 JSON 생성에 사용. 이미지 모델과 달리 텍스트 모델
// (gemini-2.5-flash)은 무료 티어에도 쿼터가 있어 빌링 전에도 동작한다.
//
// 실패는 throw — 호출 측이 message/status 로 billing/quota 판별 후 failover.

import "server-only";

import { GoogleGenAI } from "@google/genai";

export function geminiTextConfigured(): boolean {
  return (process.env.GOOGLE_GENAI_API_KEY ?? "").trim().length > 20;
}

export type GeminiJsonResult = {
  json: unknown;
  model: string;
  costUsd: number;
  latencyMs: number;
};

// gemini-2.5-flash 대략 단가 (USD / 1M tokens). 정확도보다 추정용.
const RATE_IN = 0.3;
const RATE_OUT = 2.5;

export async function geminiGenerateJson(opts: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<GeminiJsonResult> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY ?? "";
  const model = opts.model || process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  const ai = new GoogleGenAI({ apiKey });
  const started = Date.now();

  const res = await ai.models.generateContent({
    model,
    contents: opts.user,
    config: {
      systemInstruction: opts.system,
      responseMimeType: "application/json",
      temperature: opts.temperature ?? 0.7,
      // 긴 본문(블로그 2000~3000자)이 JSON 중간에 잘려 파싱 실패하지 않도록 충분히 확보
      maxOutputTokens: opts.maxOutputTokens ?? 8192,
      // gemini-2.5-flash 는 thinking 토큰이 maxOutputTokens 예산을 잠식 → 긴 본문이 잘림.
      // 구조화 카피/본문 생성엔 추론 불필요하므로 thinking 끔(출력 예산 확보 + 속도/비용↓).
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const text = (res.text ?? "").trim();
  if (!text) throw new Error(`Gemini(${model}) 빈 응답`);

  const json = JSON.parse(text); // 파싱 실패 시 throw → 호출 측에서 처리
  const um = res.usageMetadata;
  const inTok = um?.promptTokenCount ?? 0;
  const outTok = um?.candidatesTokenCount ?? 0;
  const costUsd = (inTok * RATE_IN + outTok * RATE_OUT) / 1_000_000;

  return { json, model, costUsd: Number(costUsd.toFixed(6)), latencyMs: Date.now() - started };
}

/** 메시지/상태로 billing·quota·rate-limit 여부 판별 (failover 트리거용). */
export function isGeminiQuotaError(e: unknown): boolean {
  const err = e as { status?: number; code?: number; message?: string };
  const status = err?.status ?? err?.code ?? 0;
  const m = (err?.message ?? String(e)).toLowerCase();
  return (
    status === 429 ||
    status === 402 ||
    status === 403 ||
    m.includes("resource_exhausted") ||
    m.includes("quota") ||
    m.includes("billing") ||
    m.includes("paid plan") ||
    m.includes("rate limit") ||
    m.includes("rate_limit")
  );
}
