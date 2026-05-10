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

  // ~/.codex/auth.json 존재 사전 확인 — 없으면 데모 이미지 fallback (Vercel 등)
  const authPath = path.join(os.homedir(), '.codex', 'auth.json');
  if (!fs.existsSync(authPath)) {
    const demo = pickDemoImage(prompt, req.body?.slideId);
    res.json({
      ok: true,
      image: demo.url,
      meta: {
        source: 'demo-fallback',
        demoMode: true,
        provider: 'demo',
        model: 'demo',
        size,
        latencyMs: 0,
        costUsd: 0,
        costKrw: 0,
        notice: 'Codex CLI 미설정 환경 — 큐레이션된 데모 이미지로 대체 (Vercel 서버에서는 Codex 사용 불가)',
      },
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

// 데모 이미지 fallback (Codex auth 미설정 시 — Vercel 등)
const DEMO_IMAGES = [
  { url: 'https://images.pexels.com/photos/37433365/pexels-photo-37433365.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    keywords: ['vegetable', 'spring', '봄나물', '시금치', 'fresh', 'ingredient'] },
  { url: 'https://images.pexels.com/photos/35177681/pexels-photo-35177681.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    keywords: ['market', 'traditional', '시장', 'hand', '도매'] },
  { url: 'https://images.pexels.com/photos/34179560/pexels-photo-34179560.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    keywords: ['interior', 'restaurant', '한옥', 'hanok', 'traditional', '실내'] },
  { url: 'https://images.pexels.com/photos/23355655/pexels-photo-23355655.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    keywords: ['banquet', 'table', '한 상', '코스', 'feast', 'dish', '음식'] },
  { url: 'https://images.pexels.com/photos/35177507/pexels-photo-35177507.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    keywords: ['ceramic', 'dish', '도자기', 'plate', 'bowl', '그릇'] },
  { url: 'https://images.pexels.com/photos/27969063/pexels-photo-27969063.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    keywords: ['lantern', 'entrance', '간판', '입구', '등', 'sign', 'evening'] },
];

function pickDemoImage(query, slideId) {
  const idNum = Number(slideId);
  if (Number.isInteger(idNum) && idNum >= 1) {
    return DEMO_IMAGES[(idNum - 1) % DEMO_IMAGES.length];
  }
  const q = String(query || '').toLowerCase();
  let best = null, bestScore = 0;
  for (const img of DEMO_IMAGES) {
    const score = img.keywords.reduce((acc, k) => acc + (q.includes(k.toLowerCase()) ? 1 : 0), 0);
    if (score > bestScore) { best = img; bestScore = score; }
  }
  if (best) return best;
  let hash = 0;
  for (let i = 0; i < q.length; i++) hash = ((hash << 5) - hash + q.charCodeAt(i)) | 0;
  return DEMO_IMAGES[Math.abs(hash) % DEMO_IMAGES.length];
}
