import { NextRequest, NextResponse } from "next/server";
import {
  pickDemoImage,
  fetchPortraitFromPexels,
  fetchSceneFromPexels,
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
  // 씬 인식 폴백 컨텍스트 — ModelScene.fallbackQuery + frame.
  const fallbackQuery = typeof body.fallbackQuery === "string" && body.fallbackQuery.trim() ? body.fallbackQuery.trim() : undefined;
  const frame = typeof body.frame === "string" ? body.frame : undefined;
  const allowPeople = frame === "portrait" || frame === "lifestyle";

  if (!prompt || prompt.trim().length < 5) {
    return NextResponse.json(
      { ok: false, error: "프롬프트가 비어 있거나 너무 짧습니다." },
      { status: 400 },
    );
  }

  // graceful 폴백 응답 헬퍼 — Pexels(페르소나 사진) → 일반 demo 풀 순.
  // 게이트 거절(한도/플랜)·프로바이더 전멸 모두 이 경로로 우아하게 끝낸다(하드 실패 금지).
  async function gracefulFallback(opts: {
    notice: string;
    fallbackReason: string;
    startedAt?: number;
  }): Promise<NextResponse> {
    const startedAt = opts.startedAt ?? Date.now();
    // fallbackQuery 있으면 씬 인식 폴백(인물 씬만 사람 허용), 없으면 기존 portrait 폴백(하위호환).
    const portrait = fallbackQuery
      ? await fetchSceneFromPexels({ query: fallbackQuery, allowPeople, seed: personaSeed })
      : await fetchPortraitFromPexels({ industry, gender, seed: personaSeed });
    if (portrait) {
      return NextResponse.json({
        ok: true,
        image: portrait.url,
        meta: {
          source: fallbackQuery ? "pexels-scene-fallback" : "pexels-portrait-fallback",
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
          notice: opts.notice,
          fallbackReason: opts.fallbackReason,
        },
      });
    }
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
        notice: opts.notice,
        fallbackReason: opts.fallbackReason,
      },
    });
  }

  // ── 플랜·한도 enforcement (로그인 사용자만). 비로그인은 데모 모드로 통과. ──
  // 한도 소진/플랜 미포함은 하드 403/402 대신 demo 폴백으로 우아하게 안내한다.
  // (한도 추적은 게이트가 이미 집계했으므로 그대로 유지 — 여기선 bumpUsage 안 함.)
  const gate = await ensurePlanAndQuota({
    feature: "ai-image:generate",
    usage: { kind: "aiImage" },
  });
  if (!gate.ok && gate.reason !== "unauthorized") {
    if (gate.reason === "limit_exceeded") {
      return gracefulFallback({
        notice: `이번 달 AI 이미지 한도 소진(${gate.used}/${gate.limit}) — 데모 이미지로 대체`,
        fallbackReason: "quota-exceeded",
      });
    }
    // feature_locked — 현재 플랜에 AI 이미지 미포함.
    return gracefulFallback({
      notice: "현재 플랜은 AI 이미지 생성 미포함 — 데모 이미지로 대체",
      fallbackReason: "plan-locked",
    });
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

  return gracefulFallback({
    notice: `${lastProviderId} ${status}: ${message.slice(0, 120)} — ${industry ?? "큐레이션된"} 데모 이미지로 대체`,
    fallbackReason,
    startedAt,
  });
}
