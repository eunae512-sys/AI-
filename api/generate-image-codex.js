// god-tibo-imagen 을 통해 Codex 구독 (gpt-image-2) 으로 이미지 생성
// https://github.com/NomaDamas/god-tibo-imagen
// 비공식 — ~/.codex/auth.json (Codex CLI 로그인) 필요. ChatGPT Plus/Pro 구독 권한 필수.

const path = require('path');
const fs = require('fs');
const os = require('os');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const {
    prompt,
    size = '1024x1536',          // gpt-image-2 portrait
    provider = 'auto',           // 'private-codex' | 'codex-cli' | 'auto'
    model = 'gpt-5.4',
    images,
  } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
    res.status(400).json({ ok: false, error: '프롬프트가 비어 있거나 너무 짧습니다.' });
    return;
  }

  // ~/.codex/auth.json 존재 사전 확인
  const authPath = path.join(os.homedir(), '.codex', 'auth.json');
  if (!fs.existsSync(authPath)) {
    res.status(400).json({
      ok: false,
      code: 'NO_CODEX_AUTH',
      error: 'Codex 로그인 상태를 찾을 수 없습니다 (~/.codex/auth.json 없음). Codex CLI 설치 후 로그인 필요: https://github.com/openai/codex',
    });
    return;
  }

  const fortifiedPrompt = prompt.trim() +
    '. CRITICAL: no text, no Korean characters, no signage, no logos, no captions in the image. Leave negative space for separate text overlay.';

  // 출력 파일 경로
  const ts = Date.now();
  const slug = `slide-${ts}-${Math.random().toString(36).slice(2, 6)}.png`;
  const outDir = path.join(process.cwd(), 'generated');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outputPath = path.join(outDir, slug);

  const startedAt = Date.now();

  try {
    // ESM 라이브러리이므로 dynamic import 사용
    const lib = await import('god-tibo-imagen');
    const config = lib.resolveConfig({ provider });
    const providerInstance = lib.createProvider(config);

    const result = await providerInstance.generateImage({
      prompt: fortifiedPrompt,
      model,
      outputPath,
      size,
      images: Array.isArray(images) ? images : undefined,
      dryRun: false,
      debug: false,
    });

    const savedPath = result?.savedPath || outputPath;
    if (!fs.existsSync(savedPath)) {
      res.status(502).json({ ok: false, error: '이미지가 저장되지 않았습니다 (Codex 응답 파싱 실패 가능성)' });
      return;
    }

    const stat = fs.statSync(savedPath);
    const relPath = '/generated/' + path.basename(savedPath);
    const latencyMs = Date.now() - startedAt;

    res.json({
      ok: true,
      image: relPath,    // 정적 서빙되는 URL
      meta: {
        source: 'codex',
        provider: result?.provider || provider,
        model,
        size,
        latencyMs,
        fileSizeKb: Math.round(stat.size / 1024),
        // 구독 기반이라 호출 단위 비용은 0 (월 구독료에 포함)
        costUsd: 0,
        costKrw: 0,
      },
    });
  } catch (e) {
    const message = e?.message || String(e);
    console.error('[image-codex]', message);
    let userError = message;
    let status = 500;
    let code = 'CODEX_ERROR';
    if (/auth/i.test(message) || /session/i.test(message) || /unauthor/i.test(message)) {
      userError = 'Codex 인증 실패 — 터미널에서 `codex login` 다시 실행 후 재시도 (구독 권한 확인)';
      code = 'CODEX_AUTH';
      status = 401;
    } else if (/entitle/i.test(message) || /permission/i.test(message)) {
      userError = '이미지 생성 권한 없음 — ChatGPT Plus/Pro 구독 + Codex 이미지 권한 필요';
      code = 'CODEX_ENTITLEMENT';
      status = 403;
    } else if (/codex.*not.*found/i.test(message) || /command not found/i.test(message)) {
      userError = 'Codex CLI 미설치 — https://github.com/openai/codex 에서 설치';
      code = 'CODEX_NOT_INSTALLED';
      status = 500;
    }
    res.status(status).json({ ok: false, code, error: userError, raw: message.slice(0, 200) });
  }
};
