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

// 데모 비디오 fallback — PEXELS_API_KEY 미설정 시 사용.
// 2026-05: editorial/aesthetic/minimal 톤 검색에서 점수화로 골라낸
// 7개 매장 무드 영상 큐레이트. 모두 HD 720p 9:16 portrait + 검증된 작가
// (cottonbro studio · ArtHouse Studio · Timur Weber · Mizuno K 등).
type DemoVideo = { url: string; poster: string; photographer: string; alt: string; industry?: string };

const DEMO_VIDEOS: DemoVideo[] = [
  {
    industry: "restaurant",
    // 식 플레이팅 — 조용한 손동작, 채도 낮은 매거진 톤
    url: "https://videos.pexels.com/video-files/5269551/5269551-hd_720_1280_24fps.mp4",
    poster: "https://images.pexels.com/videos/5269551/pictures/preview-0.jpeg",
    photographer: "宇航 钱",
    alt: "Food preparation editorial plating",
  },
  {
    industry: "cafe",
    // 도자 잔에 커피 푸어 — 미니멀 한 잔
    url: "https://videos.pexels.com/video-files/13737157/13737157-hd_720_1280_24fps.mp4",
    poster: "https://images.pexels.com/videos/13737157/pictures/preview-0.jpeg",
    photographer: "Mizuno K",
    alt: "Coffee pour into ceramic cup",
  },
  {
    industry: "stay",
    // 식물 잎에 미스팅 — 차분한 인테리어 무드
    url: "https://videos.pexels.com/video-files/7292472/7292472-hd_720_1280_24fps.mp4",
    poster: "https://images.pexels.com/videos/7292472/pictures/preview-0.jpeg",
    photographer: "ArtHouse Studio",
    alt: "Plant misting interior moment",
  },
  {
    industry: "dessert",
    // 유리잔 과일 주스 클로즈업 — 결 정갈
    url: "https://videos.pexels.com/video-files/8677691/8677691-hd_720_1280_60fps.mp4",
    poster: "https://images.pexels.com/videos/8677691/pictures/preview-0.jpeg",
    photographer: "Timur Weber",
    alt: "Fresh fruit close up vertical",
  },
  {
    industry: "beauty",
    // 헤어 드라이 시술 — cottonbro studio 검증 작가
    url: "https://videos.pexels.com/video-files/7440184/7440184-hd_1080_2048_25fps.mp4",
    poster: "https://images.pexels.com/videos/7440184/pictures/preview-0.jpeg",
    photographer: "cottonbro studio",
    alt: "Hair styling editorial",
  },
  {
    industry: "local",
    // 정갈 패션 — 손과 의류 디테일
    url: "https://videos.pexels.com/video-files/8513139/8513139-hd_720_1280_30fps.mp4",
    poster: "https://images.pexels.com/videos/8513139/pictures/preview-0.jpeg",
    photographer: "Artem Podrez",
    alt: "Minimal fashion long sleeve",
  },
  {
    // 일반 매장 — 추가 fallback, 라운드 로빈용
    url: "https://videos.pexels.com/video-files/29267692/12625261_360_640_60fps.mp4",
    poster: "https://images.pexels.com/videos/29267692/pictures/preview-0.jpeg",
    photographer: "Sapol Churanon",
    alt: "Editorial cooking warmth",
  },
];

// videoId 안정 해시 — URL 에서 숫자 ID 추출 (Pexels video-files/{id}/...).
// "다른 컷" 클릭 시 호출자가 excludeIds 로 누적 → 매번 다른 영상을 받도록.
function demoVideoId(v: DemoVideo): number {
  const m = v.url.match(/video-files\/(\d+)\//);
  return m ? Number(m[1]) : 0;
}

function pickDemoVideo(
  industry: string | undefined,
  slideId: number | string | undefined,
  excludeIds: number[] = [],
): DemoVideo {
  // 1) 제외 후보로 좁힌 풀
  const available = DEMO_VIDEOS.filter((v) => !excludeIds.includes(demoVideoId(v)));
  // 모두 제외됐다면 reset — 다시 처음부터
  const pool = available.length > 0 ? available : DEMO_VIDEOS;
  // 2) 업종 매칭 우선 (단, 제외 풀 안에서만)
  if (industry) {
    const matched = pool.find((v) => v.industry === industry);
    if (matched) return matched;
  }
  // 3) slideId 라운드 로빈
  const idNum = Number(slideId);
  const idx = Number.isInteger(idNum) && idNum >= 1 ? (idNum - 1) % pool.length : 0;
  return pool[idx];
}

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
    const industry = typeof body.industry === "string" ? body.industry : undefined;
    const demo = pickDemoVideo(industry, slideId as string | number | undefined, excludeIds);
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
        // videoId 반환 → 호출자(ReelsPreview)가 seenIds 에 누적 → "다른 컷" 마다 다른 영상
        videoId: demoVideoId(demo),
        photographer: demo.photographer,
        alt: demo.alt,
        notice: "PEXELS_API_KEY 미설정 — 업종 매핑 데모 영상 (Pexels)",
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
      //    채도 높음 = 비비드/광고/홈비디오 톤 → 강한 페널티 (사장님 "정갈" 요구)
      if (v.avg_color) {
        const hsl = hexToHsl(v.avg_color);
        if (hsl) {
          const [, s, l] = hsl;
          // 채도 0~100, 명도 0~100 — 정갈한 결을 위해 가중치 강화
          if (s < 20) score += 24;           // 거의 흑백/베이지 — 최상 매거진 톤
          else if (s < 35) score += 16;      // muted (정갈)
          else if (s < 50) score += 6;       // 중간
          else if (s >= 65) score -= 18;     // 비비드 → 강한 페널티 (광고/스톡 톤)
          else if (s >= 75) score -= 28;     // 매우 비비드 → 매우 강한 페널티

          // 명도가 너무 어둡거나 너무 밝으면 톤 깨짐
          if (l >= 30 && l <= 72) score += 6;  // 미드톤 — 매거진 sweet spot
          else if (l < 10 || l > 92) score -= 10;
        }
      }

      // 8) ★ 검증된 작가 화이트리스트 — 시중 카드뉴스 톤 부합 작가들
      //    Pexels 에서 일관되게 정갈/에디토리얼 결을 내는 사진가/영상가.
      const userName = (v.user?.name || "").toLowerCase();
      const editorialAuthors = [
        "cottonbro studio", "mart production", "arthouse studio", "timur weber",
        "mizuno k", "peggy anke", "ron lach", "artem podrez", "tima miroshnichenko",
        "rdne stock project", "mikhail nilov", "anete lusina", "polina tankilevitch",
        "kampus production", "sora shimazaki", "ivan samkov",
      ];
      if (editorialAuthors.some((a) => userName.includes(a))) score += 15;

      // 9) ★ alt/title 톤 매칭 — URL 슬러그에서 "editorial/minimal/aesthetic" 단어
      //    부정 키워드 (광고티) 있으면 페널티
      const slug = (v.url || "").toLowerCase();
      const positiveTokens = ["editorial", "minimal", "aesthetic", "ceramic", "wooden", "linen", "still", "soft"];
      const negativeTokens = ["sale", "discount", "promotion", "advertisement", "logo", "watermark", "smile", "selfie"];
      score += positiveTokens.filter((t) => slug.includes(t)).length * 4;
      score -= negativeTokens.filter((t) => slug.includes(t)).length * 10;

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
