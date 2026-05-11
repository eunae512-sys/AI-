import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { isPlaceholderKey, pickDemoImage } from "@/lib/api/demo-images";

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
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
