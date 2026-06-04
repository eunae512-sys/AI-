import { NextRequest, NextResponse } from "next/server";
import { ensureFalConfigured, fal } from "@/lib/ai/video/fal";

export const runtime = "nodejs";
export const maxDuration = 120;

// 가사 → AI 음악 생성
// 1순위: FAL_KEY — fal-ai/minimax-music/v2 (가사를 실제로 부르는 보컬 모델)
// 2순위: REPLICATE_API_TOKEN — meta/musicgen (악기 전용, 보컬 없음)
// 3순위: demoMode 시그널 → 클라이언트가 Web Audio 로 합성 (악기 전용)
const FAL_MUSIC_MODEL = process.env.FAL_MUSIC_MODEL || "fal-ai/minimax-music/v2";

type Body = {
  instrumentalPrompt?: string;
  lyrics?: string;
  durationSec?: number;
  mood?: string;
  bpm?: number;
};

const REPLICATE_MODEL = "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb";

export async function POST(req: NextRequest) {
  let body: Body = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    body = {};
  }

  const prompt = (body.instrumentalPrompt ?? "").trim();
  const durationSec = clamp(Math.round(body.durationSec ?? 15), 5, 60);

  if (!prompt) {
    return NextResponse.json(
      { ok: false, error: "instrumentalPrompt 필요" },
      { status: 400 },
    );
  }

  // ── 1순위: fal.ai minimax-music — 가사를 실제로 부르는 보컬 모델 ──
  const lyrics = (body.lyrics ?? "").trim();
  let falNote = ""; // fal 실패 사유 — 데모 폴백 시 사용자에게 노출
  if (ensureFalConfigured() && lyrics.length >= 10) {
    const startedFal = Date.now();
    try {
      const stylePrompt = prompt.slice(0, 300); // 무드/장르 설명 (10~300자)
      const r = (await fal.subscribe(FAL_MUSIC_MODEL, {
        input: { prompt: stylePrompt, lyrics_prompt: lyrics.slice(0, 3000) },
      })) as { data?: { audio?: { url?: string } } };
      const url = r?.data?.audio?.url;
      if (url) {
        const costUsd = 0.04; // minimax-music v2 대략 단가
        return NextResponse.json({
          ok: true,
          audioUrl: url,
          meta: {
            source: "fal-minimax-music",
            model: FAL_MUSIC_MODEL,
            vocals: true,
            durationSec,
            bpm: body.bpm ?? 100,
            mood: body.mood,
            latencyMs: Date.now() - startedFal,
            costUsd,
            costKrw: Math.round(costUsd * 1400),
          },
        });
      }
      // url 없으면 아래 폴백으로
    } catch (e) {
      const ex = e as { message?: string; status?: number; body?: { detail?: string } };
      const detail = ex?.body?.detail || ex?.message || "";
      console.error("[generate-music] fal ERROR", ex?.status, detail);
      falNote = /balance|locked|exhaust/i.test(detail)
        ? "fal.ai 잔액 소진 — 보컬 음악 생성 불가(충전 필요). 임시 데모 BGM(악기)으로 대체"
        : "보컬 음악 생성 실패 — 임시 데모 BGM(악기)으로 대체";
      // fal 실패 → musicgen/데모 폴백
    }
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token || token.length < 10) {
    // 데모 모드 — 클라이언트가 Web Audio 로 합성
    return NextResponse.json({
      ok: true,
      demoMode: true,
      meta: {
        source: "demo-web-audio",
        durationSec,
        bpm: body.bpm ?? 100,
        mood: body.mood ?? "warm-acoustic",
        notice: falNote || "REPLICATE_API_TOKEN 미설정 — 브라우저 합성 데모 음악으로 대체",
        costUsd: 0,
        costKrw: 0,
      },
    });
  }

  const startedAt = Date.now();
  try {
    // Replicate prediction 생성
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: REPLICATE_MODEL.split(":")[1],
        input: {
          prompt,
          duration: durationSec,
          model_version: "stereo-melody-large",
          output_format: "mp3",
          normalization_strategy: "peak",
        },
      }),
    });
    const created = await createRes.json();
    if (!created?.id) {
      return NextResponse.json(
        { ok: false, error: created?.detail || "Replicate prediction 생성 실패" },
        { status: 502 },
      );
    }

    // 폴링 — 최대 90초
    let prediction = created;
    const deadline = Date.now() + 90_000;
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled" &&
      Date.now() < deadline
    ) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { "Authorization": `Token ${token}` },
      });
      prediction = await pollRes.json();
    }

    if (prediction.status !== "succeeded") {
      return NextResponse.json(
        { ok: false, error: prediction.error || `Replicate ${prediction.status}` },
        { status: 502 },
      );
    }

    const audioUrl: string | string[] = prediction.output;
    const url = Array.isArray(audioUrl) ? audioUrl[0] : audioUrl;
    if (!url) {
      return NextResponse.json({ ok: false, error: "Replicate output 비어있음" }, { status: 502 });
    }

    const latencyMs = Date.now() - startedAt;
    // musicgen-melody: ~$0.04/min on Replicate (대략)
    const costUsd = Math.max(0.02, (durationSec / 60) * 0.04);

    return NextResponse.json({
      ok: true,
      audioUrl: url,
      meta: {
        source: "replicate-musicgen",
        model: "meta/musicgen-stereo-melody-large",
        durationSec,
        bpm: body.bpm ?? 100,
        mood: body.mood,
        latencyMs,
        costUsd,
        costKrw: Math.round(costUsd * 1400),
      },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return NextResponse.json(
      { ok: false, error: err?.message || String(e) },
      { status: 500 },
    );
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
