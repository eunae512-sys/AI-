// Pexels 무료 사진 검색
// https://www.pexels.com/api/  · 무료 · 200 req/hour, 20,000/month

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.PEXELS_API_KEY || '';
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_PEXELS_KEY') {
    res.status(500).json({
      ok: false,
      code: 'NO_PEXELS_KEY',
      error: '.env 의 PEXELS_API_KEY 가 설정되어 있지 않습니다. https://www.pexels.com/api/ 에서 무료 발급 후 .env 에 추가하세요.',
    });
    return;
  }

  const {
    query = '',
    orientation = 'portrait', // portrait | landscape | square
    size = 'large',           // small | medium | large
    perPage = 15,
    pickIndex = -1,           // -1 이면 랜덤
  } = req.body || {};

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
