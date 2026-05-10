// Pexels 무료 사진 검색
// https://www.pexels.com/api/  · 무료 · 200 req/hour, 20,000/month

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.PEXELS_API_KEY || '';
  const {
    query = '',
    orientation = 'portrait', // portrait | landscape | square
    size = 'large',           // small | medium | large
    perPage = 15,
    pickIndex = -1,           // -1 이면 랜덤
  } = req.body || {};

  // 키 없으면 데모 이미지 fallback (Vercel 등 env 미설정 환경)
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_PEXELS_KEY') {
    const slideId = req.body?.slideId;
    const demo = pickDemoImage(String(query || ''), slideId);
    res.json({
      ok: true,
      image: demo.url,
      meta: {
        source: 'demo-fallback',
        demoMode: true,
        photographer: demo.photographer,
        photographerUrl: demo.photographerUrl,
        pexelsUrl: demo.pexelsUrl,
        alt: demo.alt,
        latencyMs: 0,
        costUsd: 0,
        costKrw: 0,
        query: String(query || ''),
        notice: 'PEXELS_API_KEY 미설정 — 큐레이션된 데모 이미지로 대체',
      },
    });
    return;
  }

  const cleanedQuery = String(query || '').trim();
  if (cleanedQuery.length < 2) {
    res.status(400).json({ ok: false, error: '검색어가 너무 짧습니다.' });
    return;
  }

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanedQuery)}&orientation=${orientation}&size=${size}&per_page=${perPage}`;
  const startedAt = Date.now();

  try {
    const r = await fetch(url, { headers: { Authorization: apiKey } });
    if (!r.ok) {
      const txt = await r.text();
      res.status(r.status).json({ ok: false, error: `Pexels ${r.status}: ${txt.slice(0, 200)}` });
      return;
    }
    const data = await r.json();
    const photos = data.photos || [];
    if (!photos.length) {
      res.status(404).json({ ok: false, error: `검색 결과가 없습니다: "${cleanedQuery}"` });
      return;
    }

    const idx = pickIndex >= 0 && pickIndex < photos.length
      ? pickIndex
      : Math.floor(Math.random() * photos.length);
    const pick = photos[idx];

    // 가장 큰 적당한 사이즈 (large2x ~ 940x1400 portrait)
    const imageUrl = pick.src.large2x || pick.src.large || pick.src.original;

    res.json({
      ok: true,
      image: imageUrl,
      meta: {
        source: 'pexels',
        photoId: pick.id,
        photographer: pick.photographer,
        photographerUrl: pick.photographer_url,
        pexelsUrl: pick.url,
        alt: pick.alt || cleanedQuery,
        avgColor: pick.avg_color,
        totalResults: data.total_results,
        pickedIndex: idx,
        totalReturned: photos.length,
        latencyMs: Date.now() - startedAt,
        costUsd: 0,
        costKrw: 0,
        query: cleanedQuery,
      },
    });
  } catch (e) {
    const message = e?.message || String(e);
    console.error('[pexels]', message);
    res.status(500).json({ ok: false, error: message });
  }
};

// 6개 카드뉴스 슬라이드용 큐레이션 데모 이미지 (Pexels CDN 직접 URL — 무인증 접근 가능)
const DEMO_IMAGES = [
  { url: 'https://images.pexels.com/photos/37433365/pexels-photo-37433365.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    keywords: ['vegetable', 'spring', '봄나물', '시금치', 'fresh', 'ingredient'],
    photographer: 'Pexels Contributor', photographerUrl: 'https://www.pexels.com/',
    pexelsUrl: 'https://www.pexels.com/photo/37433365/', alt: '신선한 봄나물' },
  { url: 'https://images.pexels.com/photos/35177681/pexels-photo-35177681.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    keywords: ['market', 'traditional', '시장', 'hand', '도매'],
    photographer: 'Pexels Contributor', photographerUrl: 'https://www.pexels.com/',
    pexelsUrl: 'https://www.pexels.com/photo/35177681/', alt: '전통시장' },
  { url: 'https://images.pexels.com/photos/34179560/pexels-photo-34179560.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    keywords: ['interior', 'restaurant', '한옥', 'hanok', 'traditional', '실내'],
    photographer: 'Pexels Contributor', photographerUrl: 'https://www.pexels.com/',
    pexelsUrl: 'https://www.pexels.com/photo/34179560/', alt: '한식당 내부' },
  { url: 'https://images.pexels.com/photos/23355655/pexels-photo-23355655.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    keywords: ['banquet', 'table', '한 상', '코스', 'feast', 'dish', '음식'],
    photographer: 'Pexels Contributor', photographerUrl: 'https://www.pexels.com/',
    pexelsUrl: 'https://www.pexels.com/photo/23355655/', alt: '한정식 한 상' },
  { url: 'https://images.pexels.com/photos/35177507/pexels-photo-35177507.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    keywords: ['ceramic', 'dish', '도자기', 'plate', 'bowl', '그릇'],
    photographer: 'Pexels Contributor', photographerUrl: 'https://www.pexels.com/',
    pexelsUrl: 'https://www.pexels.com/photo/35177507/', alt: '도자기 그릇' },
  { url: 'https://images.pexels.com/photos/27969063/pexels-photo-27969063.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    keywords: ['lantern', 'entrance', '간판', '입구', '등', 'sign', 'evening'],
    photographer: 'Pexels Contributor', photographerUrl: 'https://www.pexels.com/',
    pexelsUrl: 'https://www.pexels.com/photo/27969063/', alt: '식당 입구 등불' },
];

function pickDemoImage(query, slideId) {
  // slideId(1~6+)가 명시되면 결정적 매핑 — 중복 방지 최우선
  const idNum = Number(slideId);
  if (Number.isInteger(idNum) && idNum >= 1) {
    return DEMO_IMAGES[(idNum - 1) % DEMO_IMAGES.length];
  }
  // slideId 없으면 키워드 매칭 + query 해시 fallback
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
