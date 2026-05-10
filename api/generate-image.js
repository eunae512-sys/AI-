// AI 이미지 생성 핸들러
// 로컬: server.js가 Express 라우터로 감쌈
// Vercel: 자동으로 /api/generate-image 서버리스 함수로 인식

const OpenAI = require('openai');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY || '';
  // placeholder 감지: 비어있거나, "sk-..." 형태이거나, 너무 짧거나
  const isPlaceholder = !apiKey || apiKey.trim() === '' || /^sk-\.+$/.test(apiKey) || apiKey.length < 20;
  if (isPlaceholder) {
    res.status(500).json({
      ok: false,
      code: 'NO_KEY',
      error: '.env 파일의 OPENAI_API_KEY 가 placeholder 입니다. 실제 키(sk-proj-... 또는 sk-...)로 교체 후 서버를 재시작해주세요. (https://platform.openai.com/api-keys)',
    });
    return;
  }

  const {
    prompt,
    size = process.env.IMAGE_SIZE || '1024x1536',
    quality = process.env.IMAGE_QUALITY || 'medium',
    model = process.env.IMAGE_MODEL || 'gpt-image-1',
  } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
    res.status(400).json({ ok: false, error: '프롬프트가 비어 있거나 너무 짧습니다.' });
    return;
  }

  // 가드레일 — 한글이 이미지에 새겨지지 않도록 강제 후미 추가
  const fortifiedPrompt =
    prompt.trim() +
    '. CRITICAL: no text, no Korean characters, no signage, no logos, no captions in the image. Leave negative space for separate text overlay.';

  const startedAt = Date.now();
  const openai = new OpenAI({ apiKey });

  try {
    const result = await openai.images.generate({
      model,
      prompt: fortifiedPrompt,
      size,
      quality,
      n: 1,
    });

    const item = result?.data?.[0];
    if (!item) {
      res.status(502).json({ ok: false, error: 'OpenAI 응답에 이미지가 없습니다.' });
      return;
    }

    const imageDataUrl = item.b64_json
      ? `data:image/png;base64,${item.b64_json}`
      : item.url;

    if (!imageDataUrl) {
      res.status(502).json({ ok: false, error: 'OpenAI 응답에 b64_json/url 가 없습니다.' });
      return;
    }

    const latencyMs = Date.now() - startedAt;

    // 비용 (gpt-image-1, 2026-05 기준)
    // medium: $0.04, high: $0.16, low: $0.011
    const costMap = { low: 0.011, medium: 0.04, high: 0.16 };
    const costUsd = costMap[quality] ?? 0.04;

    res.json({
      ok: true,
      image: imageDataUrl,
      meta: { model, size, quality, latencyMs, costUsd, costKrw: Math.round(costUsd * 1400) },
    });
  } catch (e) {
    const message = e?.error?.message || e?.message || String(e);
    const status = e?.status || 500;
    console.error('[image-gen]', status, message);
    res.status(status).json({ ok: false, error: message });
  }
};
