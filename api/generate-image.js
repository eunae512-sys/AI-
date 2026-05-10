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
  const isPlaceholder = !apiKey || apiKey.trim() === '' || /^sk-\.+$/.test(apiKey) || apiKey.length < 20;

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

  // 키 없으면 데모 이미지 fallback
  if (isPlaceholder) {
    const demo = pickDemoImage(prompt, req.body?.slideId);
    res.json({
      ok: true,
      image: demo.url,
      meta: {
        source: 'demo-fallback',
        demoMode: true,
        model: 'demo',
        size,
        quality,
        latencyMs: 0,
        costUsd: 0,
        costKrw: 0,
        notice: 'OPENAI_API_KEY 미설정 — 큐레이션된 데모 이미지로 대체',
      },
    });
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

// 데모 이미지 fallback (OPENAI_API_KEY 미설정 시)
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
