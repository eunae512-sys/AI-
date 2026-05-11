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

export function pickDemoImage(query: string | undefined, slideId: unknown): DemoImage {
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
