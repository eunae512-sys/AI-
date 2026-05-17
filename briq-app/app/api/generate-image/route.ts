import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  isPlaceholderKey,
  pickDemoImage,
  fetchPortraitFromPexels,
} from "@/lib/api/demo-images";

export const runtime = "nodejs";
export const maxDuration = 60;

const COST_MAP: Record<string, number> = { low: 0.011, medium: 0.04, high: 0.16 };

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  const placeholder = isPlaceholderKey(apiKey);

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    body = {};
  }

  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  const size = (typeof body.size === "string" ? body.size : process.env.IMAGE_SIZE) || "1024x1536";
  const quality =
    (typeof body.quality === "string" ? body.quality : process.env.IMAGE_QUALITY) || "medium";
  const model =
    (typeof body.model === "string" ? body.model : process.env.IMAGE_MODEL) || "gpt-image-1";
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

  if (placeholder) {
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
        notice: "OPENAI_API_KEY 미설정 — 큐레이션된 데모 이미지로 대체",
      },
    });
  }

  const fortifiedPrompt =
    prompt.trim() +
    ". CRITICAL: no text, no Korean characters, no signage, no logos, no captions in the image. Leave negative space for separate text overlay.";

  const startedAt = Date.now();
  const openai = new OpenAI({ apiKey });

  try {
    const result = await openai.images.generate({
      model,
      prompt: fortifiedPrompt,
      size: size as never,
      quality: quality as never,
      n: 1,
    });

    const item = result?.data?.[0];
    if (!item) {
      return NextResponse.json(
        { ok: false, error: "OpenAI 응답에 이미지가 없습니다." },
        { status: 502 },
      );
    }

    const imageDataUrl = item.b64_json
      ? `data:image/png;base64,${item.b64_json}`
      : item.url;

    if (!imageDataUrl) {
      return NextResponse.json(
        { ok: false, error: "OpenAI 응답에 b64_json/url 가 없습니다." },
        { status: 502 },
      );
    }

    const latencyMs = Date.now() - startedAt;
    const costUsd = COST_MAP[quality] ?? 0.04;

    return NextResponse.json({
      ok: true,
      image: imageDataUrl,
      meta: {
        source: "openai",
        model,
        size,
        quality,
        latencyMs,
        costUsd,
        costKrw: Math.round(costUsd * 1400),
      },
    });
  } catch (e: unknown) {
    const err = e as { error?: { message?: string }; message?: string; status?: number };
    const message = err?.error?.message || err?.message || String(e);
    const status = err?.status || 500;
    console.error("[image-gen]", status, message);

    // 빌링 / 한도 / 인증 실패 — 데모 이미지로 자동 폴백.
    // 운영 중에도 OpenAI 가 503·429 일 때 같은 폴백 발동 → 사용자 경험 안 끊김.
    const billingKeywords = [
      "Billing hard limit",
      "billing_hard_limit_reached",
      "insufficient_quota",
      "exceeded your current quota",
      "Rate limit",
      "rate_limit_exceeded",
    ];
    const isBilling = billingKeywords.some((k) => message.toLowerCase().includes(k.toLowerCase()));
    if (isBilling || status === 429 || status === 402) {
      // 1순위: persona 컨텍스트 (industry + gender) 기반 Pexels 실시간 검색
      //        — 업종 맞고 의료/법조 사진 섞일 위험 없음
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
            notice: `OpenAI ${status}: ${message.slice(0, 100)} — ${industry ?? "general"} 업종 인물 사진으로 대체`,
            fallbackReason: isBilling ? "billing-limit" : status === 429 ? "rate-limit" : "payment-required",
          },
        });
      }
      // 2순위: Pexels 도 안 되면 일반 demo 풀 (단 portrait prompt 면 SVG placeholder 자동)
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
          notice: `OpenAI ${status}: ${message.slice(0, 120)} — 큐레이션된 데모 이미지로 대체`,
          fallbackReason: isBilling ? "billing-limit" : status === 429 ? "rate-limit" : "payment-required",
        },
      });
    }

    return NextResponse.json({ ok: false, error: message, status }, { status });
  }
}
