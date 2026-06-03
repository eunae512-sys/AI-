// 이미지 프로바이더 선택 — 우선순위 체인.
//
//   ① 요청별 override (body.engine) — UI 엔진 피커 / A·B
//   ② 플랜 기본값 — Free/Pro → Imagen 4 Fast(최저가), Studio/Agency → Nano Banana
//   ③ env IMAGE_PROVIDER
//   ④ isConfigured() 폴백 — 선택 후보가 미설정이면 다음 후보로
//
// 최종적으로 "설정된 첫 프로바이더"를 반환. 하나도 없으면 null →
// 라우트가 데모 폴백으로 처리(UX 안 끊김).

import type { PlanId } from "@/lib/billing/plans";
import { OpenAIImageProvider } from "./openai";
import { GeminiImageProvider } from "./gemini";
import type { ImageProvider, ImageProviderId } from "./types";

export * from "./types";

function build(id: ImageProviderId): ImageProvider {
  switch (id) {
    case "gemini-nanobanana":
      return new GeminiImageProvider("nanobanana");
    case "gemini-imagen4":
      return new GeminiImageProvider("imagen");
    case "openai":
    default:
      return new OpenAIImageProvider();
  }
}

const VALID_IDS: ImageProviderId[] = ["openai", "gemini-nanobanana", "gemini-imagen4"];

function normalizeEngine(engine: unknown): ImageProviderId | null {
  if (typeof engine !== "string") return null;
  // 별칭 허용 — UI 에서 짧게 보내도 매핑
  const alias: Record<string, ImageProviderId> = {
    openai: "openai",
    gptimage: "openai",
    nanobanana: "gemini-nanobanana",
    "gemini-nanobanana": "gemini-nanobanana",
    imagen: "gemini-imagen4",
    imagen4: "gemini-imagen4",
    "gemini-imagen4": "gemini-imagen4",
  };
  return alias[engine.trim().toLowerCase()] ?? null;
}

function planDefault(planId: PlanId): ImageProviderId {
  // 상위 플랜일수록 품질 우선(Nano Banana), 하위는 최저가(Imagen Fast)
  return planId === "studio" || planId === "agency"
    ? "gemini-nanobanana"
    : "gemini-imagen4";
}

/**
 * 우선순위대로 정렬된 "설정된" 프로바이더 목록.
 * 라우트가 앞에서부터 시도하다 billing/quota 실패면 다음으로 failover.
 */
export function selectImageProviderChain(opts: {
  planId?: PlanId;
  engine?: unknown;
}): ImageProvider[] {
  const order: ImageProviderId[] = [];

  const requested = normalizeEngine(opts.engine);
  if (requested) order.push(requested);

  if (opts.planId) order.push(planDefault(opts.planId));

  const envChoice = normalizeEngine(process.env.IMAGE_PROVIDER);
  if (envChoice) order.push(envChoice);

  // 안전 폴백 체인 — 항상 끝에 전부 둔다 (OpenAI 를 Gemini 뒤에)
  order.push("gemini-imagen4", "openai", "gemini-nanobanana");

  const seen = new Set<ImageProviderId>();
  const chain: ImageProvider[] = [];
  for (const id of order) {
    if (!VALID_IDS.includes(id) || seen.has(id)) continue;
    seen.add(id);
    const provider = build(id);
    if (provider.isConfigured()) chain.push(provider);
  }
  return chain;
}

/**
 * 설정된 첫 프로바이더. 없으면 null. (체인의 첫 항목)
 */
export function selectImageProvider(opts: {
  planId?: PlanId;
  engine?: unknown;
}): ImageProvider | null {
  return selectImageProviderChain(opts)[0] ?? null;
}
