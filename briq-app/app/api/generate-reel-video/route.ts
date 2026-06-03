// AI 릴스 영상 생성 — Gemini Veo (@google/genai).
//
//   POST  → 작업 제출(generateVideos). { requestId(=operation.name), status:"queued" } 즉시 반환.
//           ※ 요청 내 완료 대기 금지(Veo 수십초~수분, Vercel timeout). 클라가 GET 폴링.
//   GET ?requestId=  → operation 상태 폴링. 완료 시 mp4 를 Supabase Storage 재호스팅 → public URL.
//                      한도 차감(bumpUsage)은 완료 시점에 1회만(counted 멱등).
//
// 프리미엄 메터링: ensurePlanAndQuota({ feature:"ai-video:generate", usage:{kind:"aiVideo"} }).
// 영상도 사용자가 충전한 Gemini 빌링으로 동작(이미지·문구와 동일 키).

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { ensurePlanAndQuota, bumpUsage } from "@/lib/billing/gate-server";
import { adminDb } from "@/lib/db/admin";
import { videoJobs } from "@/lib/db/schema";
import { persistVideo } from "@/lib/storage/assets";
import {
  geminiVideoConfigured,
  submitVeo,
  pollVeo,
  VEO_COST_MILLI,
} from "@/lib/ai/video/gemini-veo";
import { pickDemoReelVideo } from "@/lib/ai/video/demo";

export const runtime = "nodejs";
export const maxDuration = 60;

// ───────────────────────────────────────────────
// POST — 작업 제출
// ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const gate = await ensurePlanAndQuota({
    feature: "ai-video:generate",
    usage: { kind: "aiVideo" },
  });
  if (!gate.ok) return NextResponse.json(gate, { status: gate.status });
  const userId = gate.userId;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    body = {};
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const industry = typeof body.industry === "string" ? body.industry : undefined;
  if (!prompt || prompt.length < 5) {
    return NextResponse.json(
      { ok: false, error: "영상 프롬프트가 비어 있거나 너무 짧습니다." },
      { status: 400 },
    );
  }

  // 데모 폴백 — Veo 실패(빌링/쿼터/권한/키없음) 시 테스트용 영상으로 플로우 유지.
  // (이미지→Pexels, 문구→데모 와 동일 정책. 한도 차감 안 함.)
  async function demoFallback(reason: string) {
    const demo = pickDemoReelVideo(industry, prompt);
    const demoReqId = `demo-${globalThis.crypto.randomUUID()}`;
    await adminDb.insert(videoJobs).values({
      userId,
      requestId: demoReqId,
      provider: "demo",
      status: "completed",
      resultUrl: demo.url,
      costUsd: 0,
      counted: true, // 데모는 한도 차감 안 함
      errorMessage: reason.slice(0, 200),
    });
    return NextResponse.json({ ok: true, requestId: demoReqId, status: "queued" });
  }

  if (!geminiVideoConfigured()) {
    return demoFallback("GOOGLE_GENAI_API_KEY 미설정 — 데모 영상");
  }

  try {
    const { operationName, model } = await submitVeo({ prompt });
    await adminDb.insert(videoJobs).values({
      userId: gate.userId,
      requestId: operationName,
      provider: `gemini-veo:${model}`,
      status: "queued",
      costUsd: VEO_COST_MILLI,
    });
    return NextResponse.json({ ok: true, requestId: operationName, status: "queued" });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    const raw = err?.message || String(e);
    console.error("[reel-video] Veo submit 실패 → 데모 폴백:", err?.status ?? 0, raw.slice(0, 800));
    return demoFallback(raw);
  }
}

// ───────────────────────────────────────────────
// GET ?requestId= — 상태 폴링
// ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const gate = await ensurePlanAndQuota({}); // 인증만 — 한도는 POST 에서 이미 체크
  if (!gate.ok) return NextResponse.json(gate, { status: gate.status });

  const requestId = req.nextUrl.searchParams.get("requestId") ?? "";
  if (!requestId) {
    return NextResponse.json({ ok: false, error: "requestId 누락" }, { status: 400 });
  }

  const [job] = await adminDb
    .select()
    .from(videoJobs)
    .where(and(eq(videoJobs.requestId, requestId), eq(videoJobs.userId, gate.userId)))
    .limit(1);

  if (!job) {
    return NextResponse.json({ ok: false, error: "작업을 찾을 수 없습니다." }, { status: 404 });
  }
  // 완료(데모 포함) / 실패는 즉시 반환 — Gemini 설정 불필요.
  if (job.status === "completed" && job.resultUrl) {
    return NextResponse.json({
      ok: true,
      status: "completed",
      videoUrl: job.resultUrl,
      demo: job.provider === "demo",
    });
  }
  if (job.status === "failed") {
    return NextResponse.json({ ok: false, status: "failed", error: job.errorMessage ?? "생성 실패" });
  }

  if (!geminiVideoConfigured()) {
    return NextResponse.json({ ok: false, error: "GOOGLE_GENAI_API_KEY 미설정", status: 503 }, { status: 503 });
  }

  try {
    const result = await pollVeo(requestId);

    if (result.status === "processing") {
      if (job.status === "queued") {
        await adminDb
          .update(videoJobs)
          .set({ status: "processing" })
          .where(eq(videoJobs.requestId, requestId));
      }
      return NextResponse.json({ ok: true, status: "processing" });
    }

    if (result.status === "failed") {
      await adminDb
        .update(videoJobs)
        .set({ status: "failed", errorMessage: result.error })
        .where(eq(videoJobs.requestId, requestId));
      return NextResponse.json({ ok: false, status: "failed", error: result.error });
    }

    // completed — Storage 재호스팅 (Gemini 파일 uri 는 키 필요/만료 → 재호스팅)
    let videoUrl: string;
    try {
      videoUrl = await persistVideo(result.buffer, gate.userId, result.mimeType);
    } catch (e) {
      console.error("[reel-video] storage 업로드 실패:", (e as Error)?.message);
      await adminDb
        .update(videoJobs)
        .set({ status: "failed", errorMessage: "영상 저장 실패" })
        .where(eq(videoJobs.requestId, requestId));
      return NextResponse.json({ ok: false, status: "failed", error: "영상 저장에 실패했어요." });
    }

    // 한도 차감 — 완료 시점 1회만 (counted 멱등 가드)
    if (!job.counted) {
      try {
        await bumpUsage(gate.userId, "aiVideo");
      } catch (e) {
        console.warn("[reel-video] bumpUsage 실패:", (e as Error)?.message);
      }
    }

    await adminDb
      .update(videoJobs)
      .set({ status: "completed", resultUrl: videoUrl, counted: true })
      .where(eq(videoJobs.requestId, requestId));

    return NextResponse.json({ ok: true, status: "completed", videoUrl });
  } catch (e: unknown) {
    const message = (e as Error)?.message || String(e);
    console.error("[reel-video] poll 실패:", message);
    return NextResponse.json({ ok: false, error: message, status: 502 }, { status: 502 });
  }
}
