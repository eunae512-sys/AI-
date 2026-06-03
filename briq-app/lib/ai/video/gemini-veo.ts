// Gemini Veo 영상 생성 — @google/genai.
//
// 비동기 long-running operation (submit → operation.name 저장 → poll).
// 요청 내 완료 대기 금지(Veo 수십초~수분, Vercel timeout). operation.name 으로
// 재폴링하려면 GenerateVideosOperation 인스턴스를 만들어 name 만 세팅하면 된다
// (SDK 가 operation.name 으로 GET URL 구성 + operation._fromAPIResponse 호출).
//
// 모델 ID 는 자주 바뀜 — 구현 시점에 현 문서로 검증. env override 가능.

import "server-only";

import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";

export function geminiVideoConfigured(): boolean {
  return (process.env.GOOGLE_GENAI_API_KEY ?? "").trim().length > 20;
}

export const VEO_MODEL = process.env.GEMINI_VIDEO_MODEL || "veo-3.0-fast-generate-001";

// 8초 클립 대략 단가(USD × 1000, 정수) — COGS 로깅용 추정.
export const VEO_COST_MILLI = Number(process.env.GEMINI_VIDEO_COST_MILLI || 1200);

function client(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY ?? "" });
}

/** 영상 생성 작업 제출 → operation name 반환. */
export async function submitVeo(opts: {
  prompt: string;
}): Promise<{ operationName: string; model: string }> {
  const ai = client();
  const op = await ai.models.generateVideos({
    model: VEO_MODEL,
    prompt: opts.prompt,
    config: {
      numberOfVideos: 1,
      aspectRatio: "9:16",
      negativePrompt: "on-screen text, captions, subtitles, logos, watermark",
    },
  });
  if (!op.name) throw new Error("Veo operation name 이 반환되지 않았습니다.");
  return { operationName: op.name, model: VEO_MODEL };
}

export type VeoPollResult =
  | { status: "processing" }
  | { status: "failed"; error: string }
  | { status: "completed"; buffer: Buffer; mimeType: string };

/** operation name 으로 상태 폴링. 완료 시 mp4 버퍼 반환. */
export async function pollVeo(operationName: string): Promise<VeoPollResult> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY ?? "";
  const ai = client();

  // name 만 세팅한 인스턴스 → SDK 가 GET 으로 최신 상태 채워서 새 인스턴스 반환
  const stub = new GenerateVideosOperation();
  stub.name = operationName;
  const op = await ai.operations.getVideosOperation({ operation: stub });

  if (!op.done) return { status: "processing" };
  if (op.error) {
    return { status: "failed", error: JSON.stringify(op.error).slice(0, 200) };
  }

  const vid = op.response?.generatedVideos?.[0]?.video;
  if (!vid) {
    const reasons = op.response?.raiMediaFilteredReasons?.join("; ");
    return { status: "failed", error: reasons || "생성된 영상이 없습니다 (안전 필터 가능)." };
  }

  const mimeType = vid.mimeType || "video/mp4";

  // 1) base64 바이트가 직접 오면 그대로
  if (vid.videoBytes) {
    return { status: "completed", buffer: Buffer.from(vid.videoBytes, "base64"), mimeType };
  }

  // 2) uri 면 API 키로 다운로드 (헤더 우선, 실패 시 ?key= 폴백)
  if (vid.uri) {
    let res = await fetch(vid.uri, { headers: { "x-goog-api-key": apiKey } });
    if (!res.ok) {
      const sep = vid.uri.includes("?") ? "&" : "?";
      res = await fetch(`${vid.uri}${sep}key=${apiKey}`);
    }
    if (!res.ok) return { status: "failed", error: `영상 다운로드 실패 ${res.status}` };
    return { status: "completed", buffer: Buffer.from(await res.arrayBuffer()), mimeType };
  }

  return { status: "failed", error: "영상 uri/bytes 가 비어 있습니다." };
}
