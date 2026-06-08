import { NextRequest, NextResponse } from "next/server";
import { pickDemoImage, pickDemoImages } from "@/lib/api/demo-images";

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
    const returnCandidates = body.returnCandidates === true;
    const candidateCount =
      typeof body.candidateCount === "number"
        ? Math.max(1, Math.min(9, Math.floor(body.candidateCount)))
        : 3;
    const page = typeof body.page === "number" && body.page > 0 ? Math.floor(body.page) : 1;
    const industry = typeof body.industry === "string" ? body.industry : undefined;
    // exclude: 사장님이 이미 본 사진 url 들 (CoverStory 가 seenUrls 누적)
    const exclude: string[] = Array.isArray(body.excludeUrls)
      ? body.excludeUrls.filter((u: unknown): u is string => typeof u === "string")
      : [];

    if (returnCandidates) {
      const picks = pickDemoImages({ query, count: candidateCount, page, exclude, industry });
      return NextResponse.json({
        ok: true,
        image: picks[0]?.url,
        candidates: picks.map((p) => ({
          url: p.url,
          photoId: p.url, // url 자체를 id 로 (exclude 비교용)
          photographer: p.photographer,
          photographerUrl: p.photographerUrl,
          pexelsUrl: p.pexelsUrl,
          alt: p.alt,
        })),
        meta: {
          source: "demo-fallback",
          demoMode: true,
          photographer: picks[0]?.photographer,
          alt: picks[0]?.alt,
          query,
          poolSize: picks.length,
          notice: "PEXELS_API_KEY 미설정 — 큐레이션 데모 풀 (54장)",
        },
      });
    }

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

    // 인물·모델·얼굴 사진 차단 — 카드뉴스 슬라이드에 갑자기 외국인 모델 얼굴 떨어지는 거 방지.
    // 호출자가 명시적으로 인물을 원하면 (allowPeople: true) 페널티 해제.
    const allowPeople = body.allowPeople === true;
    const PEOPLE_KEYWORDS = [
      "portrait",
      "model",
      "fashion",
      "headshot",
      "selfie",
      "face",
      "woman wearing",
      "man wearing",
      "girl",
      "boy",
      "smiling",
      "posing",
      "person standing",
      "person sitting",
      "people walking",
      "young woman",
      "young man",
      "young girl",
      "young boy",
      "businessman",
      "businesswoman",
      "couple",
      "child",
      "kid ",
      "baby",
      "wedding",
      "bride",
      "groom",
      "bikini",
      "swimsuit",
      "lingerie",
      "underwear",
      "naked",
      "nude",
      "shirtless",
    ];

    const scored = photos.map((p, i) => {
      const alt = (p.alt ?? "").toLowerCase();
      let score = 0;
      EDITORIAL_KEYWORDS.forEach((k) => {
        if (alt.includes(k)) score += 2;
      });
      CLICHE_KEYWORDS.forEach((k) => {
        if (alt.includes(k)) score -= 3;
      });
      // 인물 사진 강 페널티 — 단 한 키워드만 맞아도 사실상 후순위로 보냄
      if (!allowPeople) {
        let peopleHits = 0;
        for (const k of PEOPLE_KEYWORDS) {
          if (alt.includes(k)) peopleHits++;
        }
        if (peopleHits > 0) score -= 50 * peopleHits;
      }
      // 가로 비율 — 9:16 캔버스에는 1.0~0.6 정도 (세로형) 선호
      // Pexels의 portrait orientation 으로 이미 필터링됨, 추가 가산점은 부드럽게
      score += Math.max(0, 5 - i * 0.2); // 앞쪽 결과에 살짝 가산
      return { p, i, score };
    });
    scored.sort((a, b) => b.score - a.score);

    // 인물 페널티 (-50 이하) 면 후보에서 완전 제거. 남는 게 없으면 그대로 사용.
    const filtered = allowPeople ? scored : scored.filter((s) => s.score > -20);
    const pool = filtered.length > 0 ? filtered : scored;

    // pickIndex 명시되면 그대로.
    // 아니면 top 5 중 — slideId 가 유효 정수면 결정적 오프셋(슬라이드 간 분산·랜덤 충돌 회귀 방지),
    // slideId·pickIndex 둘 다 없을 때만 랜덤(다양성).
    const slideIdNum =
      typeof slideId === "number"
        ? slideId
        : typeof slideId === "string" && /^-?\d+$/.test(slideId.trim())
          ? Number(slideId.trim())
          : null;
    let pick;
    if (pickIndex >= 0 && pickIndex < photos.length) {
      pick = photos[pickIndex];
    } else {
      const topN = pool.slice(0, Math.min(5, pool.length));
      if (slideIdNum !== null) {
        // 결정적: slideId 기반 모듈로 오프셋 (1-based slideId 가정, 음수도 안전 처리)
        const offset = ((Math.trunc(slideIdNum) - 1) % topN.length + topN.length) % topN.length;
        pick = topN[offset].p;
      } else {
        pick = topN[Math.floor(Math.random() * topN.length)].p;
      }
    }
    const imageUrl = pick.src.large2x || pick.src.large || pick.src.original;

    // returnCandidates: true 이면 top N 후보를 추가로 반환 (기본 3, max 9)
    const returnCandidates = body.returnCandidates === true;
    const candidateCount =
      typeof body.candidateCount === "number"
        ? Math.max(1, Math.min(9, Math.floor(body.candidateCount)))
        : 3;
    const candidates = returnCandidates
      ? pool
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
