// 데모 이미지 fallback — OPENAI_API_KEY / PEXELS_API_KEY / Codex auth 미설정 시
// 6장 카드뉴스 슬라이드용 큐레이션 (Pexels CDN 직접 URL)

export type DemoImage = {
  url: string;
  keywords: string[];
  photographer: string;
  photographerUrl: string;
  pexelsUrl: string;
  alt: string;
};

export const DEMO_IMAGES: DemoImage[] = [
  {
    url: "https://images.pexels.com/photos/37433365/pexels-photo-37433365.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    keywords: ["vegetable", "spring", "봄나물", "시금치", "fresh", "ingredient"],
    photographer: "Pexels Contributor",
    photographerUrl: "https://www.pexels.com/",
    pexelsUrl: "https://www.pexels.com/photo/37433365/",
    alt: "신선한 봄나물",
  },
  {
    url: "https://images.pexels.com/photos/35177681/pexels-photo-35177681.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    keywords: ["market", "traditional", "시장", "hand", "도매"],
    photographer: "Pexels Contributor",
    photographerUrl: "https://www.pexels.com/",
    pexelsUrl: "https://www.pexels.com/photo/35177681/",
    alt: "전통시장",
  },
  {
    url: "https://images.pexels.com/photos/34179560/pexels-photo-34179560.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    keywords: ["interior", "restaurant", "한옥", "hanok", "traditional", "실내"],
    photographer: "Pexels Contributor",
    photographerUrl: "https://www.pexels.com/",
    pexelsUrl: "https://www.pexels.com/photo/34179560/",
    alt: "한식당 내부",
  },
  {
    url: "https://images.pexels.com/photos/23355655/pexels-photo-23355655.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    keywords: ["banquet", "table", "한 상", "코스", "feast", "dish", "음식"],
    photographer: "Pexels Contributor",
    photographerUrl: "https://www.pexels.com/",
    pexelsUrl: "https://www.pexels.com/photo/23355655/",
    alt: "한정식 한 상",
  },
  {
    url: "https://images.pexels.com/photos/35177507/pexels-photo-35177507.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    keywords: ["ceramic", "dish", "도자기", "plate", "bowl", "그릇"],
    photographer: "Pexels Contributor",
    photographerUrl: "https://www.pexels.com/",
    pexelsUrl: "https://www.pexels.com/photo/35177507/",
    alt: "도자기 그릇",
  },
  {
    url: "https://images.pexels.com/photos/27969063/pexels-photo-27969063.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    keywords: ["lantern", "entrance", "간판", "입구", "등", "sign", "evening"],
    photographer: "Pexels Contributor",
    photographerUrl: "https://www.pexels.com/",
    pexelsUrl: "https://www.pexels.com/photo/27969063/",
    alt: "식당 입구 등불",
  },
];

// ─────────────────────────────────────────────────────────────
// Portrait 폴백 — Pexels 검색 기반 (하드코딩 ID 폐기)
// 하드코딩 풀은 검증 불가 + 업종 불일치 위험 (의료/병원/스튜디오 사진 섞임).
// 대신 업종별 Pexels 검색어로 실시간 큐레이션.
// ─────────────────────────────────────────────────────────────

/** 업종 + 성별 → Pexels 검색어 (편향 키워드 회피, 분위기 일치 우선) */
export function portraitQueryForIndustry(opts: {
  industry?: string;
  gender?: "female" | "male" | "neutral";
}): string {
  const g = opts.gender === "male" ? "man" : opts.gender === "neutral" ? "person" : "woman";
  switch (opts.industry) {
    case "cafe":
      return `cafe ${g} apron warm window light candid`;
    case "restaurant":
      return `${g} chef kitchen warm light asian`;
    case "beauty":
      return `${g} salon hair stylist mirror soft light`;
    case "fitness":
      return `${g} athletic training gym natural`;
    case "stay":
      return `${g} traveler hanok wooden interior calm`;
    case "local":
      return `${g} fashion editorial concept store minimal`;
    case "dessert":
      return `${g} pastry chef bakery warm light`;
    default:
      return `${g} editorial portrait natural warm`;
  }
}

/**
 * Pexels API 직접 호출로 portrait 폴백 이미지 가져오기.
 * API 키 없으면 null 반환 → 호출 측이 다른 폴백으로 처리.
 * 운영 중에도 OpenAI 결제 한도 / 429 일 때 이 함수가 동작.
 */
export async function fetchPortraitFromPexels(opts: {
  industry?: string;
  gender?: "female" | "male" | "neutral";
  seed?: string;
}): Promise<DemoImage | null> {
  const apiKey = process.env.PEXELS_API_KEY ?? "";
  if (!apiKey || apiKey.trim() === "" || apiKey === "YOUR_PEXELS_KEY") return null;

  const query = portraitQueryForIndustry(opts);
  const params = new URLSearchParams({
    query,
    orientation: "portrait",
    size: "large",
    per_page: "24",
    locale: "en-US",
  });
  try {
    const r = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
      headers: { Authorization: apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as {
      photos?: Array<{
        id: number;
        url: string;
        alt: string | null;
        photographer: string;
        photographer_url: string;
        src: { large2x?: string; large?: string; original?: string };
      }>;
    };
    const photos = data.photos ?? [];
    if (photos.length === 0) return null;

    // seed 로 결정적 픽 — 같은 페르소나는 같은 사진 (재호출해도 일관)
    const seedStr = String(opts.seed ?? "");
    let h = 0;
    for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) | 0;
    const pick = photos[Math.abs(h) % photos.length];

    return {
      url: pick.src.large2x || pick.src.large || pick.src.original || "",
      keywords: [opts.industry ?? "portrait", "pexels-fallback"],
      photographer: pick.photographer,
      photographerUrl: pick.photographer_url,
      pexelsUrl: pick.url,
      alt: pick.alt || query,
    };
  } catch {
    return null;
  }
}

/**
 * 최종 비상용 — Pexels 도 사용 불가 시 단색 placeholder.
 * 잘못된 분위기 (의료·법조 등) 사진 보여주는 것보다 빈 박스가 낫다.
 */
function placeholderPortraitDemo(industry?: string): DemoImage {
  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536"><rect width="100%" height="100%" fill="#e4e2db"/><text x="512" y="780" font-family="serif" font-size="42" fill="#94918a" text-anchor="middle" font-style="italic">portrait pending</text><text x="512" y="830" font-family="sans-serif" font-size="20" fill="#94918a" text-anchor="middle" letter-spacing="3">${(industry ?? "MODEL").toUpperCase()}</text></svg>`,
    )}`,
    keywords: ["placeholder"],
    photographer: "BRIQ",
    photographerUrl: "",
    pexelsUrl: "",
    alt: "초상 준비 중",
  };
}

/** prompt 안에 portrait/persona/model 같은 단어 있으면 인물 풀에서 픽. */
function isPortraitPrompt(query: string | undefined): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  return /portrait|persona|model|headshot|recurring|korean (woman|man|person|female|male)/.test(q);
}

export function pickDemoImage(query: string | undefined, slideId: unknown): DemoImage {
  // 인물 prompt 면 placeholder — 하드코딩 사진 의료/법조 사진 섞일 위험 차단.
  // 실제 인물 폴백은 fetchPortraitFromPexels (비동기) 가 처리.
  if (isPortraitPrompt(query)) {
    return placeholderPortraitDemo();
  }
  const idNum = Number(slideId);
  if (Number.isInteger(idNum) && idNum >= 1) {
    return DEMO_IMAGES[(idNum - 1) % DEMO_IMAGES.length];
  }
  const q = String(query ?? "").toLowerCase();
  let best: DemoImage | null = null;
  let bestScore = 0;
  for (const img of DEMO_IMAGES) {
    const score = img.keywords.reduce((acc, k) => acc + (q.includes(k.toLowerCase()) ? 1 : 0), 0);
    if (score > bestScore) {
      best = img;
      bestScore = score;
    }
  }
  if (best) return best;
  let hash = 0;
  for (let i = 0; i < q.length; i++) hash = ((hash << 5) - hash + q.charCodeAt(i)) | 0;
  return DEMO_IMAGES[Math.abs(hash) % DEMO_IMAGES.length];
}

export function isPlaceholderKey(key: string | undefined): boolean {
  if (!key) return true;
  const k = key.trim();
  if (!k) return true;
  if (/^sk-\.+$/.test(k)) return true;
  if (k.length < 20) return true;
  return false;
}

// HEX → Pexels 지원 named color (red/orange/yellow/green/turquoise/blue/violet/pink/brown/black/gray/white)
export function hexToPexelsColor(hex: string | undefined): string | "" {
  if (!hex) return "";
  const m = hex.replace("#", "").match(/^([0-9a-fA-F]{6})$/);
  if (!m) return "";
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lum = (max + min) / 2;
  const sat = max === 0 ? 0 : (max - min) / max;

  if (lum < 28) return "black";
  if (lum > 232 && sat < 0.1) return "white";
  if (sat < 0.12) return "gray";
  // 갈색 — 빨강 우세 + 채도 낮음 + 어두움
  if (r > g && g >= b && sat < 0.55 && lum < 165) return "brown";

  // 색조 계산 (간단화)
  let hue = 0;
  if (max === r) hue = ((g - b) / (max - min || 1)) % 6;
  else if (max === g) hue = (b - r) / (max - min || 1) + 2;
  else hue = (r - g) / (max - min || 1) + 4;
  hue = hue * 60;
  if (hue < 0) hue += 360;

  if (hue < 15 || hue >= 345) return "red";
  if (hue < 40) return "orange";
  if (hue < 65) return "yellow";
  if (hue < 160) return "green";
  if (hue < 190) return "turquoise";
  if (hue < 250) return "blue";
  if (hue < 290) return "violet";
  return "pink";
}
