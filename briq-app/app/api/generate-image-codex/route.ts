import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { pickDemoImage } from "@/lib/api/demo-images";

export const runtime = "nodejs";
export const maxDuration = 120;

// god-tibo-imagen 을 통해 Codex 구독 (gpt-image-2) 으로 이미지 생성
// 비공식 — ~/.codex/auth.json (Codex CLI 로그인) 필요. ChatGPT Plus/Pro 구독 권한 필수.

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    body = {};
  }

  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  const size = (typeof body.size === "string" ? body.size : "1024x1536") || "1024x1536";
  const provider = (typeof body.provider === "string" ? body.provider : "auto") || "auto";
  const model = (typeof body.model === "string" ? body.model : "gpt-5.4") || "gpt-5.4";
  const images = Array.isArray(body.images) ? (body.images as string[]) : undefined;
  const slideId = body.slideId;

  if (!prompt || prompt.trim().length < 5) {
    return NextResponse.json(
      { ok: false, error: "프롬프트가 비어 있거나 너무 짧습니다." },
      { status: 400 },
    );
  }

  // ~/.codex/auth.json 존재 사전 확인 — 없으면 데모 이미지 fallback
  const authPath = path.join(os.homedir(), ".codex", "auth.json");
  if (!fs.existsSync(authPath)) {
    const demo = pickDemoImage(prompt, slideId);
    return NextResponse.json({
      ok: true,
      image: demo.url,
      meta: {
        source: "demo-fallback",
        demoMode: true,
        provider: "demo",
        model: "demo",
        size,
        latencyMs: 0,
        costUsd: 0,
        costKrw: 0,
        notice:
          "Codex CLI 미설정 환경 — 큐레이션된 데모 이미지로 대체 (Vercel 서버에서는 Codex 사용 불가)",
      },
    });
  }

  const fortifiedPrompt =
    prompt.trim() +
    ". CRITICAL: no text, no Korean characters, no signage, no logos, no captions in the image. Leave negative space for separate text overlay.";

  const ts = Date.now();
  const slug = `slide-${ts}-${Math.random().toString(36).slice(2, 6)}.png`;
  // generated/ 폴더는 프로젝트 루트(briq-app의 부모) — public 직접 서빙 불가하므로
  // briq-app/public/generated 로 저장해서 /generated/...png 로 접근
  const outDir = path.join(process.cwd(), "public", "generated");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outputPath = path.join(outDir, slug);

  const startedAt = Date.now();

  try {
    const lib = await import("god-tibo-imagen");
    const config = lib.resolveConfig({ provider } as Parameters<typeof lib.resolveConfig>[0]);
    const providerInstance = lib.createProvider(config);

    const result = (await providerInstance.generateImage({
      prompt: fortifiedPrompt,
      model,
      outputPath,
      size,
      images,
      dryRun: false,
      debug: false,
    } as Parameters<typeof providerInstance.generateImage>[0])) as {
      savedPath?: string;
      provider?: string;
    };

    const savedPath = result?.savedPath || outputPath;
    if (!fs.existsSync(savedPath)) {
      return NextResponse.json(
        { ok: false, error: "이미지가 저장되지 않았습니다 (Codex 응답 파싱 실패 가능성)" },
        { status: 502 },
      );
    }

    const stat = fs.statSync(savedPath);
    const relPath = "/generated/" + path.basename(savedPath);
    const latencyMs = Date.now() - startedAt;

    return NextResponse.json({
      ok: true,
      image: relPath,
      meta: {
        source: "codex",
        provider: result?.provider || provider,
        model,
        size,
        latencyMs,
        fileSizeKb: Math.round(stat.size / 1024),
        costUsd: 0,
        costKrw: 0,
      },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    const message = err?.message || String(e);
    console.error("[image-codex]", message);
    let userError = message;
    let status = 500;
    let code = "CODEX_ERROR";
    if (/auth/i.test(message) || /session/i.test(message) || /unauthor/i.test(message)) {
      userError = "Codex 인증 실패 — 터미널에서 `codex login` 다시 실행 후 재시도 (구독 권한 확인)";
      code = "CODEX_AUTH";
      status = 401;
    } else if (/entitle/i.test(message) || /permission/i.test(message)) {
      userError = "이미지 생성 권한 없음 — ChatGPT Plus/Pro 구독 + Codex 이미지 권한 필요";
      code = "CODEX_ENTITLEMENT";
      status = 403;
    } else if (/codex.*not.*found/i.test(message) || /command not found/i.test(message)) {
      userError = "Codex CLI 미설치 — https://github.com/openai/codex 에서 설치";
      code = "CODEX_NOT_INSTALLED";
      status = 500;
    }
    return NextResponse.json(
      { ok: false, code, error: userError, raw: message.slice(0, 200) },
      { status },
    );
  }
}
