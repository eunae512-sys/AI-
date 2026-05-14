import { NextRequest, NextResponse } from "next/server";
import { pickDemoImage } from "@/lib/api/demo-images";

export const runtime = "nodejs";

type PexelsPhoto = {
  id: number;
  url: string;
  alt: string | null;
  photographer: string;
  photographer_url: string;
  avg_color: string;
  src: { large2x?: string; large?: string; original?: string };
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.PEXELS_API_KEY ?? "";

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    body = {};
  }

  const query = typeof body.query === "string" ? body.query : "";
  const orientation = typeof body.orientation === "string" ? body.orientation : "portrait";
  const size = typeof body.size === "string" ? body.size : "large";
  const perPage = typeof body.perPage === "number" ? body.perPage : 24;
  const pickIndex = typeof body.pickIndex === "number" ? body.pickIndex : -1;
  const color = typeof body.color === "string" ? body.color : "";
  const slideId = body.slideId;

  if (!apiKey || apiKey.trim() === "" || apiKey === "YOUR_PEXELS_KEY") {
    const demo = pickDemoImage(query, slideId);
    return NextResponse.json({
      ok: true,
      image: demo.url,
      meta: {
        source: "demo-fallback",
        demoMode: true,
        photographer: demo.photographer,
        photographerUrl: demo.photographerUrl,
        pexelsUrl: demo.pexelsUrl,
        alt: demo.alt,
        latencyMs: 0,
        costUsd: 0,
        costKrw: 0,
        query,
        notice: "PEXELS_API_KEY 미설정 — 큐레이션된 데모 이미지로 대체",
      },
    });
  }

  const cleanedQuery = query.trim();
  if (cleanedQuery.length < 2) {
    return NextResponse.json(
      { ok: false, error: "검색어가 너무 짧습니다." },
      { status: 400 },
    );
  }

  const page = typeof body.page === "number" && body.page > 0 ? Math.floor(body.page) : 1;
  const params = new URLSearchParams({
    query: cleanedQuery,
    orientation,
    size,
    per_page: String(perPage),
    page: String(page),
    locale: "en-US",
  });
  if (color) params.set("color", color);
  const url = `https://api.pexels.com/v1/search?${params.toString()}`;
  const startedAt = Date.now();

  try {
    const r = await fetch(url, { headers: { Authorization: apiKey } });
    if (!r.ok) {
      const txt = await r.text();
      return NextResponse.json(
        { ok: false, error: `Pexels ${r.status}: ${txt.slice(0, 200)}` },
        { status: r.status },
      );
    }
    const data = (await r.json()) as { photos?: PexelsPhoto[]; total_results?: number };
    const photos = data.photos ?? [];
    if (!photos.length) {
      return NextResponse.json(
        { ok: false, error: `검색 결과가 없습니다: "${cleanedQuery}"` },
        { status: 404 },
      );
    }

    // 에디토리얼 품질 스코어링 — alt 텍스트로 매거진/에디토리얼 신호 가중
    const EDITORIAL_KEYWORDS = [
      "editorial",
      "minimal",
      "aesthetic",
      "magazine",
      "lifestyle",
      "moody",
      "natural light",
      "soft light",
      "macro",
      "flat lay",
      "negative space",
      "candid",
      "film",
      "shallow depth",
      "elegant",
    ];
    const CLICHE_KEYWORDS = ["isolated", "white background", "studio shot", "stock"];

    const scored = photos.map((p, i) => {
      const alt = (p.alt ?? "").toLowerCase();
      let score = 0;
      EDITORIAL_KEYWORDS.forEach((k) => {
        if (alt.includes(k)) score += 2;
      });
      CLICHE_KEYWORDS.forEach((k) => {
        if (alt.includes(k)) score -= 3;
      });
      // 가로 비율 — 9:16 캔버스에는 1.0~0.6 정도 (세로형) 선호
      // Pexels의 portrait orientation 으로 이미 필터링됨, 추가 가산점은 부드럽게
      score += Math.max(0, 5 - i * 0.2); // 앞쪽 결과에 살짝 가산
      return { p, i, score };
    });
    scored.sort((a, b) => b.score - a.score);

    // pickIndex 명시되면 그대로, 아니면 top 5 중 랜덤 (다양성 + 품질)
    let pick;
    if (pickIndex >= 0 && pickIndex < photos.length) {
      pick = photos[pickIndex];
    } else {
      const topN = scored.slice(0, Math.min(5, scored.length));
      pick = topN[Math.floor(Math.random() * topN.length)].p;
    }
    const imageUrl = pick.src.large2x || pick.src.large || pick.src.original;

    // returnCandidates: true 이면 top N 후보를 추가로 반환 (기본 3, max 9)
    const returnCandidates = body.returnCandidates === true;
    const candidateCount =
      typeof body.candidateCount === "number"
        ? Math.max(1, Math.min(9, Math.floor(body.candidateCount)))
        : 3;
    const candidates = returnCandidates
      ? scored
          .slice(0, candidateCount)
          .map(({ p }) => ({
            url: p.src.large2x || p.src.large || p.src.original,
            photoId: p.id,
            photographer: p.photographer,
            photographerUrl: p.photographer_url,
            pexelsUrl: p.url,
            alt: p.alt || cleanedQuery,
          }))
      : undefined;

    return NextResponse.json({
      ok: true,
      image: imageUrl,
      candidates,
      meta: {
        source: "pexels",
        photoId: pick.id,
        photographer: pick.photographer,
        photographerUrl: pick.photographer_url,
        pexelsUrl: pick.url,
        alt: pick.alt || cleanedQuery,
        avgColor: pick.avg_color,
        totalResults: data.total_results,
        pickedIndex: photos.indexOf(pick),
        totalReturned: photos.length,
        editorialScored: true,
        latencyMs: Date.now() - startedAt,
        costUsd: 0,
        costKrw: 0,
        query: cleanedQuery,
      },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    const message = err?.message || String(e);
    console.error("[pexels]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
