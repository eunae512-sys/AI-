// 데모 이미지 fallback — PEXELS_API_KEY 미설정 시 사용.
// 업종별 큐레이트 풀 (Pexels 실시간 검색 + 점수화로 정갈한 매장 무드 사진 선별).
// 사장님이 "같은 사진 계속 돈다" 지적 해소 — 6장 → 54장 (업종별 9장 × 6업종).

export type DemoImage = {
  url: string;
  keywords: string[];
  industry?: string;          // 업종 매핑 — restaurant/cafe/dessert/beauty/stay/local
  photographer: string;
  photographerUrl: string;
  pexelsUrl: string;
  alt: string;
};

// Pexels CDN 직접 URL — 모두 HTTP 200 검증, editorial 톤 점수화로 선별.
// 운영 가이드: 새 이미지 추가 시 (a) HTTP 200 검증, (b) avg_color HSL 채도 35
// 이하 정갈 톤 우선, (c) 업종 컨텍스트 일치 (음식·매장·도자기·우드 톤).
const PEXELS_IMG = (id: number | string, slug = "") =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1700&w=940${slug}`;
const PEXELS_PAGE = (id: number) => `https://www.pexels.com/photo/${id}/`;

export const DEMO_IMAGES: DemoImage[] = [
  // ── restaurant (한정식·한식당) × 9 ─────────────────────
  { url: PEXELS_IMG(8112975), industry: "restaurant", keywords: ["plating", "fine dining", "한정식"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(8112975), alt: "Editorial fine dining plate" },
  { url: PEXELS_IMG(34463145), industry: "restaurant", keywords: ["plate", "minimal", "ceramic"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(34463145), alt: "Minimal ceramic plate" },
  { url: PEXELS_IMG(35420084), industry: "restaurant", keywords: ["banquet", "table", "한 상"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(35420084), alt: "Korean banquet table" },
  { url: PEXELS_IMG(8112985), industry: "restaurant", keywords: ["chef", "hands"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(8112985), alt: "Chef hands plating" },
  { url: PEXELS_IMG(8112976), industry: "restaurant", keywords: ["course", "wooden"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(8112976), alt: "Course plate wooden" },
  { url: PEXELS_IMG(8112434), industry: "restaurant", keywords: ["ingredient", "fresh"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(8112434), alt: "Fresh ingredient prep" },
  { url: PEXELS_IMG(8112970), industry: "restaurant", keywords: ["plate", "modern"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(8112970), alt: "Modern dish plating" },
  { url: PEXELS_IMG(5900512), industry: "restaurant", keywords: ["table", "still life"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(5900512), alt: "Korean table still life" },
  { url: PEXELS_IMG(34520959), industry: "restaurant", keywords: ["plating", "minimal"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(34520959), alt: "Minimal plating editorial" },

  // ── cafe (스페셜티 카페) × 9 ─────────────────────────────
  { url: PEXELS_IMG(7658116), industry: "cafe", keywords: ["coffee", "pour", "specialty"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(7658116), alt: "Specialty coffee pour" },
  { url: PEXELS_IMG(4763628), industry: "cafe", keywords: ["latte", "ceramic"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(4763628), alt: "Latte in ceramic cup" },
  { url: PEXELS_IMG(7658097), industry: "cafe", keywords: ["espresso", "minimal"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(7658097), alt: "Minimal espresso shot" },
  { url: PEXELS_IMG(7658342), industry: "cafe", keywords: ["beans", "fresh"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(7658342), alt: "Fresh coffee beans" },
  { url: PEXELS_IMG(7658346), industry: "cafe", keywords: ["drip", "pour over"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(7658346), alt: "Hand drip pour over" },
  { url: PEXELS_IMG(7623576), industry: "cafe", keywords: ["cafe", "interior", "morning"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(7623576), alt: "Cafe morning interior" },
  { url: PEXELS_IMG(29491843), industry: "cafe", keywords: ["minimal", "cup"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(29491843), alt: "Minimal cup still" },
  { url: PEXELS_IMG(14129565), industry: "cafe", keywords: ["latte art", "warm"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(14129565), alt: "Latte art warm light" },
  { url: PEXELS_IMG(31273656), industry: "cafe", keywords: ["coffee", "still"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(31273656), alt: "Coffee still life" },

  // ── dessert (디저트·베이커리) × 9 ────────────────────────
  { url: PEXELS_IMG(29380153), industry: "dessert", keywords: ["cake", "patisserie"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(29380153), alt: "Patisserie cake editorial" },
  { url: PEXELS_IMG(19499002), industry: "dessert", keywords: ["tart", "fruit"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(19499002), alt: "Fruit tart minimal" },
  { url: PEXELS_IMG(18532489), industry: "dessert", keywords: ["macaron", "minimal"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(18532489), alt: "Minimal macarons" },
  { url: PEXELS_IMG(16536179), industry: "dessert", keywords: ["bakery", "warm"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(16536179), alt: "Bakery warm pastry" },
  { url: PEXELS_IMG(29380152), industry: "dessert", keywords: ["cake", "slice"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(29380152), alt: "Cake slice editorial" },
  { url: PEXELS_IMG(17283902), industry: "dessert", keywords: ["cookies", "still"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(17283902), alt: "Cookie still life" },
  { url: PEXELS_IMG(33626956), industry: "dessert", keywords: ["cake", "minimal"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(33626956), alt: "Minimal cake plate" },
  { url: PEXELS_IMG(17283924), industry: "dessert", keywords: ["sweet", "warm"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(17283924), alt: "Sweet warm tone" },
  { url: PEXELS_IMG(27304372), industry: "dessert", keywords: ["pastry", "fresh"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(27304372), alt: "Fresh pastry close up" },

  // ── beauty (미용실·살롱) × 9 ─────────────────────────────
  { url: PEXELS_IMG(7440134), industry: "beauty", keywords: ["hair", "salon"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(7440134), alt: "Hair salon editorial" },
  { url: PEXELS_IMG(7440055), industry: "beauty", keywords: ["styling", "soft"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(7440055), alt: "Soft styling moment" },
  { url: PEXELS_IMG(7440058), industry: "beauty", keywords: ["scissors", "minimal"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(7440058), alt: "Minimal salon scissors" },
  { url: PEXELS_IMG(36784894), industry: "beauty", keywords: ["color", "swatches"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(36784894), alt: "Color swatches editorial" },
  { url: PEXELS_IMG(7440126), industry: "beauty", keywords: ["mirror", "soft"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(7440126), alt: "Salon mirror still" },
  { url: PEXELS_IMG(3993311), industry: "beauty", keywords: ["hair detail", "macro"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(3993311), alt: "Hair detail macro" },
  { url: PEXELS_IMG(33867553), industry: "beauty", keywords: ["editorial", "soft"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(33867553), alt: "Editorial soft beauty" },
  { url: PEXELS_IMG(36553502), industry: "beauty", keywords: ["interior", "minimal"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(36553502), alt: "Salon interior minimal" },
  { url: PEXELS_IMG(10317446), industry: "beauty", keywords: ["tools", "still"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(10317446), alt: "Salon tools still life" },

  // ── stay (한옥스테이·숙소) × 9 ───────────────────────────
  { url: PEXELS_IMG(31990882), industry: "stay", keywords: ["hanok", "interior", "wooden"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(31990882), alt: "Hanok wooden interior" },
  { url: PEXELS_IMG(35215225), industry: "stay", keywords: ["traditional", "sunlight"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(35215225), alt: "Traditional sunlight room" },
  { url: PEXELS_IMG(12632382), industry: "stay", keywords: ["window", "morning"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(12632382), alt: "Hanok window morning" },
  { url: PEXELS_IMG(33415078), industry: "stay", keywords: ["wooden floor", "warm"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(33415078), alt: "Warm wooden floor" },
  { url: PEXELS_IMG(12780720), industry: "stay", keywords: ["lantern", "evening"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(12780720), alt: "Hanok evening lantern" },
  { url: PEXELS_IMG(33415075), industry: "stay", keywords: ["interior", "calm"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(33415075), alt: "Calm interior" },
  { url: PEXELS_IMG(30189054), industry: "stay", keywords: ["courtyard", "minimal"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(30189054), alt: "Minimal courtyard" },
  { url: PEXELS_IMG(29673494), industry: "stay", keywords: ["detail", "wooden"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(29673494), alt: "Wooden detail moment" },
  { url: PEXELS_IMG(12632381), industry: "stay", keywords: ["bed", "linen"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(12632381), alt: "Linen bed window light" },

  // ── local (패션·잡화·라이프) × 9 ─────────────────────────
  { url: PEXELS_IMG(6702631), industry: "local", keywords: ["fashion", "minimal"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(6702631), alt: "Minimal fashion editorial" },
  { url: PEXELS_IMG(6702724), industry: "local", keywords: ["lookbook", "soft"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(6702724), alt: "Lookbook soft tone" },
  { url: PEXELS_IMG(27869836), industry: "local", keywords: ["linen", "warm"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(27869836), alt: "Linen warm fabric" },
  { url: PEXELS_IMG(34094489), industry: "local", keywords: ["shop", "interior"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(34094489), alt: "Concept store interior" },
  { url: PEXELS_IMG(33401682), industry: "local", keywords: ["folded", "still"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(33401682), alt: "Folded apparel still" },
  { url: PEXELS_IMG(27843893), industry: "local", keywords: ["fashion", "muted"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(27843893), alt: "Muted fashion editorial" },
  // 패션 보강 — 실제 매장·옷걸이·니트 (이전 음식점/등불 사진 교체)
  { url: PEXELS_IMG(12111440), industry: "local", keywords: ["hangers", "boutique"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(12111440), alt: "Clothing on hangers boutique" },
  { url: PEXELS_IMG(12299947), industry: "local", keywords: ["concept store", "interior"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(12299947), alt: "Chic clothing store interior" },
  { url: PEXELS_IMG(12931727), industry: "local", keywords: ["knit", "sweater"], photographer: "Pexels", photographerUrl: "https://www.pexels.com/", pexelsUrl: PEXELS_PAGE(12931727), alt: "Warm knit sweater close up" },
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
      return `korean cafe ${g} apron warm window light candid`;
    case "restaurant":
      return `korean ${g} chef kitchen warm light`;
    case "beauty":
      return `korean ${g} salon hair stylist mirror soft light`;
    case "fitness":
      return `korean ${g} athletic training gym natural`;
    case "stay":
      return `korean ${g} traveler hanok wooden interior calm`;
    case "local":
      return `korean ${g} fashion editorial concept store minimal`;
    case "dessert":
      return `korean ${g} pastry chef bakery warm light`;
    default:
      return `korean ${g} editorial portrait natural warm`;
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

// industry 후보 키워드 → DEMO_IMAGES.industry 매칭.
// 순서가 중요: 더 specific 한 산업 먼저 검사. "wooden" 같은 일반어로 stay 가
// fashion/cafe query 까지 가로채면 안 됨 → stay 키워드는 hanok·courtyard 같이
// 매우 specific 한 것으로 한정.
function inferIndustry(query: string | undefined): string | undefined {
  if (!query) return undefined;
  const q = query.toLowerCase();
  // 1. 패션 — linen/hanger/clothing 키워드 (stay 의 wooden 보다 우선)
  if (/(fashion|lookbook|apparel|hanger|boutique|clothing|knit|sweater|coat|linen shirt|fabric|concept store)/.test(q)) return "local";
  // 2. 카페
  if (/(coffee|espresso|latte|cafe|pour over|colombian|brew|barista|cappuccino)/.test(q)) return "cafe";
  // 3. 디저트
  if (/(patisserie|pastry|cake|dessert|bakery|tart|macaron|cookie|scone|croissant)/.test(q)) return "dessert";
  // 4. 미용
  if (/(salon|hair|stylist|scissors|color swatch|cosmetic|nail|manicure|perm)/.test(q)) return "beauty";
  // 5. 한옥/숙소 — hanok 또는 lantern/courtyard 같은 매우 specific 한 단어만
  if (/(hanok|courtyard|tea pot|lantern|traditional korean|guest room|stay)/.test(q)) return "stay";
  // 6. 음식점 — 음식 plate/bowl/ceramic 도 매칭
  if (/(plating|dining|chef|food|table|banquet|ceramic|bowl|한정식|코스|한 상|kitchen|side dish|chopstick)/.test(q)) return "restaurant";
  return undefined;
}

export function pickDemoImage(query: string | undefined, slideId: unknown): DemoImage {
  if (isPortraitPrompt(query)) {
    return placeholderPortraitDemo();
  }
  const inferred = inferIndustry(query);
  const pool = inferred ? DEMO_IMAGES.filter((d) => d.industry === inferred) : DEMO_IMAGES;
  const effective = pool.length > 0 ? pool : DEMO_IMAGES;
  const idNum = Number(slideId);
  if (Number.isInteger(idNum) && idNum >= 1) {
    return effective[(idNum - 1) % effective.length];
  }
  const q = String(query ?? "").toLowerCase();
  let best: DemoImage | null = null;
  let bestScore = 0;
  for (const img of effective) {
    const score = img.keywords.reduce((acc, k) => acc + (q.includes(k.toLowerCase()) ? 1 : 0), 0);
    if (score > bestScore) {
      best = img;
      bestScore = score;
    }
  }
  if (best) return best;
  let hash = 0;
  for (let i = 0; i < q.length; i++) hash = ((hash << 5) - hash + q.charCodeAt(i)) | 0;
  return effective[Math.abs(hash) % effective.length];
}

/**
 * Demo 풀에서 N장 다른 사진을 반환 (candidates 모드).
 * 사장님이 "다른 사진 추천" 누를 때마다 다른 6장이 나오도록.
 * @param page  pageSeed (1 부터) — 같은 query 라도 page 별로 다른 sliding window
 * @param exclude  이미 본 url 들 (사용자가 이번 세션에 본 사진 제외)
 */
export function pickDemoImages(opts: {
  query?: string;
  count: number;
  page?: number;
  exclude?: string[];
  industry?: string;
}): DemoImage[] {
  const { query, count, page = 1, exclude = [], industry } = opts;
  // 1) 업종 풀 우선, 없으면 query 추론, 없으면 전체
  const inferredInd = industry ?? inferIndustry(query);
  const pool = inferredInd ? DEMO_IMAGES.filter((d) => d.industry === inferredInd) : DEMO_IMAGES;
  const base = pool.length >= count ? pool : DEMO_IMAGES;

  // 2) exclude 처리
  const available = base.filter((img) => !exclude.includes(img.url));
  // 모두 제외됐다면 reset — base 사용
  const working = available.length >= count ? available : base;

  // 3) page 기반 sliding window — page 가 다르면 다른 offset
  const offset = ((page - 1) * count) % working.length;
  const rotated = [...working.slice(offset), ...working.slice(0, offset)];

  return rotated.slice(0, count);
}

export function isPlaceholderKey(key: string | undefined): boolean {
  if (!key) return true;
  const k = key.trim();
  if (!k) return true;
  if (/^sk-\.+$/.test(k)) return true;
  if (k.length < 20) return true;
  return false;
}

// HEX → Pexels 지원 named color
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
  if (r > g && g >= b && sat < 0.55 && lum < 165) return "brown";

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
