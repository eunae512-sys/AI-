import { NextRequest, NextResponse } from "next/server";
import {
  pickDemoImage,
  fetchPortraitFromPexels,
} from "@/lib/api/demo-images";
import { selectImageProviderChain, ProviderError, type ImageQuality } from "@/lib/ai/image";
import { ensurePlanAndQuota, bumpUsage } from "@/lib/billing/gate-server";
import { persistImage } from "@/lib/storage/assets";
import type { PlanId } from "@/lib/billing/plans";

export const runtime = "nodejs";
export const maxDuration = 60;

const SIZE_ALLOWLIST = new Set(["1024x1536", "1024x1024", "1536x1024"]);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    body = {};
  }

  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  let size = (typeof body.size === "string" ? body.size : process.env.IMAGE_SIZE) || "1024x1536";
  if (!SIZE_ALLOWLIST.has(size)) size = "1024x1536"; // 원가 가드 — 사이즈 allowlist
  let quality =
    ((typeof body.quality === "string" ? body.quality : process.env.IMAGE_QUALITY) ||
      "medium") as ImageQuality;
  const engine = body.engine;
  const slideId = body.slideId;
  // 페르소나 컨텍스트 (폴백 정확도용)
  const industry = typeof body.industry === "string" ? body.industry : undefined;
  const gender =
    body.gender === "female" || body.gender === "male" || body.gender === "neutral"
      ? (body.gender as "female" | "male" | "neutral")
      : undefined;
  const personaSeed = typeof body.personaSeed === "string" || typeof body.personaSeed === "number"
    ? String(body.personaSeed)
    : (typeof slideId === "string" || typeof slideId === "number" ? String(slideId) : undefined);

  if (!prompt || prompt.trim().length < 5) {
    return NextResponse.json(
      { ok: false, error: "프롬프트가 비어 있거나 너무 짧습니다." },
      { status: 400 },
    );
  }

  // ── 플랜·한도 enforcement (로그인 사용자만). 비로그인은 데모 모드로 통과. ──
  const gate = await ensurePlanAndQuota({
    feature: "ai-image:generate",
    usage: { kind: "aiImage" },
  });
  if (!gate.ok && gate.reason !== "unauthorized") {
    return NextResponse.json(gate, { status: gate.status });
  }
  const userId = gate.ok ? gate.userId : null;
  const planId: PlanId | undefined = gate.ok ? gate.planId : undefined;

  // 원가 가드 — Studio 미만은 high 품질 차단(중간으로 하향)
  if (quality === "high" && planId !== "studio" && planId !== "agency") {
    quality = "medium";
  }

  const chain = selectImageProviderChain({ planId, engine });

  // 설정된 프로바이더가 하나도 없으면 데모 이미지로 대체 (기존 placeholder 경로).
  if (chain.length === 0) {
    const demo = pickDemoImage(prompt, slideId);
    return NextResponse.json({
      ok: true,
      image: demo.url,
      meta: {
        source: "demo-fallback",
        demoMode: true,
        model: "demo",
        size,
        quality,
        latencyMs: 0,
        costUsd: 0,
        costKrw: 0,
        notice: "이미지 생성 키 미설정 — 큐레이션된 데모 이미지로 대체",
      },
    });
  }

  const fortifiedPrompt =
    prompt.trim() +
    ". CRITICAL: no text, no Korean characters, no signage, no logos, no captions, no typography, no watermark in the image. Photographic. Leave negative space for separate text overlay.";

  const startedAt = Date.now();

  // 프로바이더 체인 failover — billing/quota 실패면 다음 프로바이더 시도.
  // (예: Google 빌링 미설정 → Gemini 400 → OpenAI 로 자동 전환)
  let lastErr: ProviderError | null = null;
  let lastProviderId = chain[0].id;

  for (const provider of chain) {
    try {
      const out = await provider.generate({
        prompt: fortifiedPrompt,
        size,
        quality,
        signal: req.signal,
      });

      // 영속화 — 로그인 사용자의 base64 결과만 Storage 로(거대 data URL 제거).
      let image = out.imageDataUrl;
      if (userId && image.startsWith("data:")) {
        try {
          image = await persistImage(image, userId);
        } catch (e) {
          console.warn("[image-gen] storage 업로드 실패, data URL 폴백:", (e as Error)?.message);
        }
      }

      // 성공 사용량 +1 (로그인 사용자만)
      if (userId) {
        try {
          await bumpUsage(userId, "aiImage");
        } catch (e) {
          console.warn("[image-gen] bumpUsage 실패:", (e as Error)?.message);
        }
      }

      return NextResponse.json({
        ok: true,
        image,
        meta: {
          source: provider.id,
          model: out.model,
          size,
          quality,
          latencyMs: out.latencyMs,
          costUsd: out.costUsd,
          costKrw: Math.round(out.costUsd * 1400),
        },
      });
    } catch (e: unknown) {
      const pe =
        e instanceof ProviderError
          ? e
          : new ProviderError(500, String((e as Error)?.message ?? e), false);
      lastErr = pe;
      lastProviderId = provider.id;
      console.error("[image-gen]", provider.id, pe.status, pe.message);

      const retryable = pe.isBilling || pe.status === 429 || pe.status === 402;
      // 빌링/한도 실패면 다음 프로바이더로 failover, 그 외 하드 에러는 즉시 중단.
      if (retryable) continue;
      return NextResponse.json({ ok: false, error: pe.message, status: pe.status }, { status: pe.status });
    }
  }

  // 모든 프로바이더가 billing/quota 로 실패 — Pexels → 데모 폴백.
  const status = lastErr?.status ?? 502;
  const message = lastErr?.message ?? "all providers failed";
  const fallbackReason =
    lastErr?.isBilling ? "billing-limit" : status === 429 ? "rate-limit" : "payment-required";

  // 1순위: persona 컨텍스트(industry + gender) 기반 Pexels 실시간 검색
  const portrait = await fetchPortraitFromPexels({ industry, gender, seed: personaSeed });
  if (portrait) {
    return NextResponse.json({
      ok: true,
      image: portrait.url,
      meta: {
        source: "pexels-portrait-fallback",
        demoMode: true,
        model: "pexels",
        size,
        quality,
        latencyMs: Date.now() - startedAt,
        costUsd: 0,
        costKrw: 0,
        photographer: portrait.photographer,
        photographerUrl: portrait.photographerUrl,
        pexelsUrl: portrait.pexelsUrl,
        industry,
        notice: `${lastProviderId} ${status}: ${message.slice(0, 100)} — ${industry ?? "general"} 업종 사진으로 대체`,
        fallbackReason,
      },
    });
  }
  // 2순위: Pexels 도 안 되면 일반 demo 풀
  const demo = pickDemoImage(prompt, slideId);
  return NextResponse.json({
    ok: true,
    image: demo.url,
    meta: {
      source: "demo-fallback",
      demoMode: true,
      model: "demo",
      size,
      quality,
      latencyMs: Date.now() - startedAt,
      costUsd: 0,
      costKrw: 0,
      notice: `${lastProviderId} ${status}: ${message.slice(0, 120)} — 큐레이션된 데모 이미지로 대체`,
      fallbackReason,
    },
  });
}
