// 업로드 사진 → AI 에디토리얼 포스터 편집 엔드포인트 (image-to-image).
//
// generate-image 와의 차이:
//   · getEditProvider()(Nano Banana 고정)에 inputImage 를 inlineData 로 전달해
//     사장님이 올린 실제 사진을 살려 편집한다 (text-to-image 가 아님).
//   · "no text" 강화를 절대 부착하지 않는다 — 포스터는 타이포/한국어 라벨/손글씨가
//     들어가야 한다 (generate-image 의 photographic no-text 경로와 분리).
//   · 정직성(CLAUDE.md #7): 키/한도/플랜이 없으면 원본 사진을 'AI 포스터'로 둔갑시키지
//     않고 ok:false + 친절 안내로 솔직히 실패한다 (편집은 Pexels 데모 폴백 불가).

import { NextRequest, NextResponse } from "next/server";
import { getEditProvider, ProviderError } from "@/lib/ai/image";
import { ensurePlanAndQuota, bumpUsage } from "@/lib/billing/gate-server";
import { persistImage } from "@/lib/storage/assets";

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

  const inputImage = typeof body.inputImage === "string" ? body.inputImage : "";
  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  let size = (typeof body.size === "string" ? body.size : "") || "1024x1536";
  if (!SIZE_ALLOWLIST.has(size)) size = "1024x1536"; // 원가 가드
  const styleId = typeof body.styleId === "string" ? body.styleId : undefined;
  const slideId = body.slideId;

  if (!inputImage.trim()) {
    return NextResponse.json(
      { ok: false, error: "편집할 사진(inputImage)이 필요합니다." },
      { status: 400 },
    );
  }
  if (!prompt || prompt.trim().length < 5) {
    return NextResponse.json(
      { ok: false, error: "포스터 프롬프트가 비어 있거나 너무 짧습니다." },
      { status: 400 },
    );
  }

  // ── 플랜·한도 enforcement (로그인 사용자만). 비로그인은 데모 모드로 통과(userId=null). ──
  // 편집은 원본 사진을 살리는 일이라 데모 이미지 폴백이 없다 — 한도/플랜 거절 시
  // 원본을 가짜 포스터로 되돌려주지 않고 솔직히 ok:false 로 안내한다(정직성 #7).
  const gate = await ensurePlanAndQuota({
    feature: "ai-image:generate",
    usage: { kind: "aiImage" },
  });
  if (!gate.ok && gate.reason !== "unauthorized") {
    if (gate.reason === "limit_exceeded") {
      return NextResponse.json({
        ok: false,
        error: `이번 달 AI 이미지 한도를 다 쓰셨어요 (${gate.used}/${gate.limit}). 다음 달이나 상위 플랜에서 다시 만들어보세요.`,
        reason: "limit_exceeded",
      });
    }
    // feature_locked — 현재 플랜에 AI 이미지 미포함.
    return NextResponse.json({
      ok: false,
      error: "현재 플랜에는 AI 포스터 편집이 포함돼 있지 않아요. 플랜을 올리면 사진을 포스터로 다듬을 수 있어요.",
      reason: "feature_locked",
    });
  }
  const userId = gate.ok ? gate.userId : null;

  const provider = getEditProvider();

  // 키 미설정 — 원본을 포스터라고 둔갑시키지 않고 솔직히 안내(정직성 #7).
  if (!provider.isConfigured()) {
    return NextResponse.json({
      ok: false,
      error: "AI 포스터 편집은 Google 이미지 키가 필요합니다. (관리자에게 GOOGLE_GENAI_API_KEY 설정을 요청하세요)",
      reason: "no_key",
    });
  }

  try {
    // 프롬프트는 템플릿 결과 그대로 — no-text 강화 금지(포스터는 타이포가 핵심).
    const out = await provider.generate({
      prompt: prompt.trim(),
      size,
      quality: "medium",
      inputImage,
      signal: req.signal,
    });

    // 영속화 — 로그인 사용자의 base64 결과만 Storage 로(거대 data URL 제거).
    let image = out.imageDataUrl;
    if (userId && image.startsWith("data:")) {
      try {
        image = await persistImage(image, userId);
      } catch (e) {
        console.warn("[poster] storage 업로드 실패, data URL 폴백:", (e as Error)?.message);
      }
    }

    // 성공 사용량 +1 (로그인 사용자만)
    if (userId) {
      try {
        await bumpUsage(userId, "aiImage");
      } catch (e) {
        console.warn("[poster] bumpUsage 실패:", (e as Error)?.message);
      }
    }

    return NextResponse.json({
      ok: true,
      image,
      meta: {
        source: "gemini-nanobanana-edit",
        model: out.model,
        size,
        latencyMs: out.latencyMs,
        costUsd: out.costUsd,
        costKrw: Math.round(out.costUsd * 1400),
        styleId,
        slideId: typeof slideId === "string" || typeof slideId === "number" ? slideId : undefined,
      },
    });
  } catch (e: unknown) {
    const pe =
      e instanceof ProviderError
        ? e
        : new ProviderError(500, String((e as Error)?.message ?? e), false);
    console.error("[poster]", provider.id, pe.status, pe.message);
    // 편집 실패 — 원본을 포스터로 되돌려주지 않고 솔직히 실패(정직성 #7).
    const friendly = pe.isBilling
      ? "Google 이미지 계정의 결제·한도 문제로 포스터를 만들지 못했어요. 잠시 후 다시 시도해주세요."
      : "AI 포스터 편집에 실패했어요. 다른 사진이나 스타일로 다시 시도해주세요.";
    return NextResponse.json(
      { ok: false, error: friendly, status: pe.status },
      { status: pe.status >= 400 && pe.status < 600 ? pe.status : 502 },
    );
  }
}
