import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PexelsVideoFile = {
  id: number;
  quality: "hd" | "sd" | "uhd" | "hls";
  file_type: string;
  width: number;
  height: number;
  link: string;
};

type PexelsVideoPicture = { id: number; picture: string; nr: number };

type PexelsVideo = {
  id: number;
  width: number;
  height: number;
  duration: number;
  user: { name: string; url: string };
  url: string;
  image: string;
  video_files: PexelsVideoFile[];
  video_pictures: PexelsVideoPicture[];
  avg_color?: string | null;
};

const DEMO_VIDEOS: { url: string; poster: string; photographer: string; alt: string }[] = [
  {
    url: "https://videos.pexels.com/video-files/3796033/3796033-uhd_1440_2732_25fps.mp4",
    poster: "https://images.pexels.com/videos/3796033/free-video-3796033.jpg?auto=compress&cs=tinysrgb&w=940",
    photographer: "Pexels Contributor",
    alt: "Cooking ingredients editorial",
  },
  {
    url: "https://videos.pexels.com/video-files/4350103/4350103-uhd_1440_2732_25fps.mp4",
    poster: "https://images.pexels.com/videos/4350103/free-video-4350103.jpg?auto=compress&cs=tinysrgb&w=940",
    photographer: "Pexels Contributor",
    alt: "Coffee pour vertical",
  },
];

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
  const size = typeof body.size === "string" ? body.size : "large"; // large = HD+ 중심 (인기 콘텐츠)
  const perPage = typeof body.perPage === "number" ? body.perPage : 50; // 넓은 풀에서 스코어링
  const pickIndex = typeof body.pickIndex === "number" ? body.pickIndex : -1;
  // 중복 방지 — 호출자가 이미 사용한 videoId 들을 넘기면 픽업에서 제외
  const excludeIds: number[] = Array.isArray(body.excludeIds)
    ? body.excludeIds.filter((x): x is number => typeof x === "number")
    : [];
  const slideId = body.slideId;

  if (!apiKey || apiKey.trim() === "" || apiKey === "YOUR_PEXELS_KEY") {
    const idNum = Number(slideId);
    const demo = DEMO_VIDEOS[Number.isInteger(idNum) && idNum >= 1 ? (idNum - 1) % DEMO_VIDEOS.length : 0];
    return NextResponse.json({
      ok: true,
      video: {
        url: demo.url,
        poster: demo.poster,
        duration: 14,
        width: 1080,
        height: 1920,
      },
      meta: {
        source: "demo-fallback",
        demoMode: true,
        photographer: demo.photographer,
        alt: demo.alt,
        notice: "PEXELS_API_KEY 미설정 — 데모 영상으로 대체",
      },
    });
  }

  const cleanedQuery = query.trim();
  if (cleanedQuery.length < 2) {
    return NextResponse.json({ ok: false, error: "검색어가 너무 짧습니다." }, { status: 400 });
  }

  const params = new URLSearchParams({
    query: cleanedQuery,
    orientation,
    size,
    per_page: String(perPage),
    locale: "en-US",
  });

  const url = `https://api.pexels.com/videos/search?${params.toString()}`;
  const startedAt = Date.now();

  // 네트워크 일시 실패 (Pexels 측 트로틀링/타임아웃) 대응 — 3회 retry, exponential backoff
  const fetchWithRetry = async (attempt = 0): Promise<Response> => {
    try {
      const r = await fetch(url, {
        headers: { Authorization: apiKey },
        signal: AbortSignal.timeout(8000),
      });
      return r;
    } catch (e) {
      if (attempt < 2) {
        const delay = 300 * Math.pow(2, attempt); // 300ms, 600ms
        await new Promise((res) => setTimeout(res, delay));
        return fetchWithRetry(attempt + 1);
      }
      throw e;
    }
  };

  try {
    const r = await fetchWithRetry();
    if (!r.ok) {
      const txt = await r.text();
      return NextResponse.json(
        { ok: false, error: `Pexels Videos ${r.status}: ${txt.slice(0, 200)}` },
        { status: r.status },
      );
    }
    const data = (await r.json()) as { videos?: PexelsVideo[]; total_results?: number };
    const videos = data.videos ?? [];
    if (!videos.length) {
      return NextResponse.json(
        { ok: false, error: `영상 검색 결과가 없습니다: "${cleanedQuery}"` },
        { status: 404 },
      );
    }

    // === 인기/품질 + 에디토리얼 톤 스코어링 ===
    // Pexels는 기본 정렬이 popularity 순 (앞쪽 = 다운로드/조회 많은 콘텐츠)
    // 추가로: 9:16 + 길이 + 해상도 + 채도/명도(에디토리얼 톤 우대)
    const scored = videos.map((v, i) => {
      let score = 0;

      // 1) Pexels 정렬 순위 — 앞쪽일수록 인기
      score += Math.max(0, 50 - i * 1.2);

      // 2) 9:16 세로 비율 — 릴스 핵심
      if (v.height > v.width) score += 20;
      const aspect = v.height / v.width;
      if (aspect >= 1.6 && aspect <= 2.0) score += 10; // 9:16 (1.78) 근처

      // 3) 영상 길이 — 시네마틱일수록 8~15초 (너무 짧으면 다큐/소셜, 너무 길면 강의)
      if (v.duration >= 8 && v.duration <= 15) score += 18; // 에디토리얼 sweet spot
      else if (v.duration >= 5 && v.duration <= 25) score += 10;
      else if (v.duration > 40) score -= 8;

      // 4) 해상도 — HD 이상이 프리미엄
      const maxH = Math.max(...v.video_files.map((f) => f.height));
      if (maxH >= 1920) score += 15;
      else if (maxH >= 1280) score += 8;
      else if (maxH >= 720) score += 3;

      // 5) 파일 variant 수 — 인기 콘텐츠 시그널
      const mp4Count = v.video_files.filter((f) => f.file_type === "video/mp4").length;
      if (mp4Count >= 6) score += 10;
      else if (mp4Count >= 4) score += 5;
      else if (mp4Count >= 2) score += 2;

      // 6) UHD 가능 — 프리미엄 시그널
      if (v.video_files.some((f) => f.quality === "uhd")) score += 5;

      // 7) ★ 에디토리얼/시네마 톤 — avg_color HSL 분석
      //    채도 낮음 + 명도 중간 = 무드 있는 톤 (muted aesthetic)
      //    채도 높음 = 비비드/광고/홈비디오 톤 → 페널티
      if (v.avg_color) {
        const hsl = hexToHsl(v.avg_color);
        if (hsl) {
          const [, s, l] = hsl;
          // 채도 0~100, 명도 0~100
          if (s < 25) score += 18;           // 거의 흑백/베이지 — 매거진 톤
          else if (s < 40) score += 12;       // muted
          else if (s < 60) score += 4;        // 중간
          else if (s >= 75) score -= 12;      // 비비드 (페널티)

          // 명도가 너무 어둡거나 너무 밝으면 톤 깨짐
          if (l >= 25 && l <= 75) score += 4;
          else if (l < 10 || l > 92) score -= 6;
        }
      }

      return { v, i, score };
    });
    scored.sort((a, b) => b.score - a.score);

    // 중복 제외 픽업 — excludeIds 에 없는 가장 높은 점수의 영상 선택
    // 모든 후보가 제외되면 어쩔 수 없이 top 1 사용 (희귀 케이스)
    const filteredPick = excludeIds.length > 0
      ? scored.find(({ v }) => !excludeIds.includes(v.id))?.v
      : undefined;

    const pick =
      pickIndex >= 0 && pickIndex < videos.length
        ? videos[pickIndex]
        : filteredPick ?? scored[0]?.v ?? videos[0];

    // 최적 mp4 파일 선택: portrait + hd 우선, fallback sd
    const mp4Files = pick.video_files.filter((f) => f.file_type === "video/mp4");
    const portraitFiles = mp4Files.filter((f) => f.height > f.width);
    const target =
      portraitFiles.find((f) => f.quality === "hd" && f.height <= 1280) ||
      portraitFiles.find((f) => f.quality === "hd") ||
      portraitFiles.find((f) => f.quality === "sd") ||
      portraitFiles[0] ||
      mp4Files.find((f) => f.quality === "hd") ||
      mp4Files.find((f) => f.quality === "sd") ||
      mp4Files[0];

    if (!target) {
      return NextResponse.json(
        { ok: false, error: "재생 가능한 mp4 파일이 없습니다" },
        { status: 502 },
      );
    }

    const poster = pick.video_pictures?.[0]?.picture || pick.image;

    return NextResponse.json({
      ok: true,
      video: {
        url: target.link,
        poster,
        duration: pick.duration,
        width: target.width,
        height: target.height,
      },
      meta: {
        source: "pexels-video",
        videoId: pick.id,
        photographer: pick.user.name,
        photographerUrl: pick.user.url,
        pexelsUrl: pick.url,
        avgColor: pick.avg_color,
        totalResults: data.total_results,
        latencyMs: Date.now() - startedAt,
        query: cleanedQuery,
      },
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    const message = err?.message || String(e);
    console.error("[pexels-video]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// HEX → HSL — Pexels avg_color 채도/명도 분석용
// 반환: [h: 0-360, s: 0-100, l: 0-100]
function hexToHsl(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
