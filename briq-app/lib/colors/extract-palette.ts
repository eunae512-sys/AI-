// 사진 → 브랜드 컬러 팔레트 추출
// 1) k-means quantization
// 2) Pinterest aesthetic 필터 — 채도 클램프, 다이버시티, 톤 정제
// 3) HSL 기반 색상 명명 (한국어 + 카페 무드)

type RGB = [number, number, number];
type HSL = [number, number, number]; // h: 0-360, s/l: 0-1

export type ExtractedColor = {
  hex: string;
  name: string;
  hsl: HSL;
  population: number; // 0-1
};

const PALETTE_SIZE = 6;
const SAMPLE_DIM = 80; // 사진당 80×80 = 6400 픽셀 샘플
const QUANT_BUCKETS = 4; // RGB 각 채널 4단계 → 64 버킷
const MIN_HUE_DIFF = 22; // 다이버시티: 색상환 최소 거리
const MIN_L_DIFF = 0.12; // 같은 hue 면 lightness 차이 필요

// === 공용 변환 ===
function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = h * 60;
  if (h < 0) h += 360;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (hp >= 0 && hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

// === 픽셀 샘플링 ===
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src.slice(0, 60)}`));
    img.src = src;
  });
}

function samplePixels(img: HTMLImageElement): RGB[] {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_DIM;
  canvas.height = SAMPLE_DIM;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  // object-cover crop 같이 짧은 변 기준
  const ratio = img.width / img.height;
  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height;
  if (ratio > 1) {
    // 너비가 큼 — 좌우 크롭
    sw = img.height;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SAMPLE_DIM, SAMPLE_DIM);
  const data = ctx.getImageData(0, 0, SAMPLE_DIM, SAMPLE_DIM).data;
  const pixels: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 200) continue;
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    // 너무 어두운 / 너무 밝은 픽셀 제외 (배경 흑백 무시)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 18) continue; // 거의 검정
    if (min > 245 && max - min < 6) continue; // 거의 흰색
    pixels.push([r, g, b]);
  }
  return pixels;
}

// === Quantization (간단 버킷 + 가중치) ===
function quantize(pixels: RGB[]): { centroid: RGB; count: number }[] {
  const buckets = new Map<string, { sum: [number, number, number]; count: number }>();
  for (const [r, g, b] of pixels) {
    const key =
      Math.floor((r / 256) * QUANT_BUCKETS) +
      "-" +
      Math.floor((g / 256) * QUANT_BUCKETS) +
      "-" +
      Math.floor((b / 256) * QUANT_BUCKETS);
    const entry = buckets.get(key);
    if (entry) {
      entry.sum[0] += r;
      entry.sum[1] += g;
      entry.sum[2] += b;
      entry.count += 1;
    } else {
      buckets.set(key, { sum: [r, g, b], count: 1 });
    }
  }
  return Array.from(buckets.values()).map((b) => ({
    centroid: [b.sum[0] / b.count, b.sum[1] / b.count, b.sum[2] / b.count],
    count: b.count,
  }));
}

// === Pinterest aesthetic 정제 ===
function refineForPinterest(centroids: { centroid: RGB; count: number }[]): ExtractedColor[] {
  // 1) HSL 변환 + 필터
  const candidates = centroids
    .map((c) => {
      const [r, g, b] = c.centroid;
      const [h, s, l] = rgbToHsl(r, g, b);
      return { rgb: c.centroid, hsl: [h, s, l] as HSL, count: c.count };
    })
    // 너무 어둡거나 너무 밝거나 너무 회색은 제외
    .filter(({ hsl }) => {
      const [, s, l] = hsl;
      if (l < 0.10) return false;
      if (l > 0.92) return false;
      if (s < 0.05 && l > 0.82) return false; // 거의 흰색 회색
      return true;
    })
    // 2) Pinterest 톤으로 부드럽게
    .map(({ rgb, hsl, count }) => {
      let [h, s, l] = hsl;
      // 채도 클램프 — 0.55 초과는 무드 톤으로 다운
      if (s > 0.65) s = 0.55;
      else if (s > 0.55) s = s * 0.88;
      // 어두운 + 채도 높은 색은 살짝 풀어줌
      if (l < 0.30 && s > 0.45) s = s * 0.85;
      // 너무 밝은 페일은 살짝 톤 올림 (지나치게 옅은 거 방지)
      if (l > 0.82 && s > 0.10) l = Math.max(0.72, l * 0.92);
      // 노이즈 보정 — 결과 RGB 다시 계산
      const newRgb = hslToRgb(h, s, l);
      return { rgb: newRgb, hsl: [h, s, l] as HSL, count };
    })
    // 인구 많은 순
    .sort((a, b) => b.count - a.count);

  // 3) 다이버시티 필터 — 비슷한 색은 하나만
  const picked: typeof candidates = [];
  for (const c of candidates) {
    const [h, , l] = c.hsl;
    const tooClose = picked.some((p) => {
      const hd = Math.min(Math.abs(p.hsl[0] - h), 360 - Math.abs(p.hsl[0] - h));
      const ld = Math.abs(p.hsl[2] - l);
      // 같은 hue 범위에선 lightness 차이 필요
      return hd < MIN_HUE_DIFF && ld < MIN_L_DIFF;
    });
    if (!tooClose) picked.push(c);
    if (picked.length >= PALETTE_SIZE) break;
  }

  // 4) 부족하면 톤 변형으로 채움
  while (picked.length < PALETTE_SIZE && candidates.length > 0) {
    // 가장 많이 보유한 색에 lightness ±0.15 변형 추가
    const base = candidates[0];
    const variantL = base.hsl[2] > 0.5 ? base.hsl[2] - 0.18 : base.hsl[2] + 0.18;
    const variant: typeof base = {
      rgb: hslToRgb(base.hsl[0], base.hsl[1] * 0.9, variantL),
      hsl: [base.hsl[0], base.hsl[1] * 0.9, variantL],
      count: base.count / 4,
    };
    const exists = picked.some(
      (p) =>
        Math.abs(p.hsl[2] - variantL) < 0.05 && Math.abs(p.hsl[0] - base.hsl[0]) < 8,
    );
    if (!exists) picked.push(variant);
    else break;
  }

  // 5) 정렬: lightness 기준 어두운 → 밝은 (primary 가 첫번째 = 가장 진한 톤)
  picked.sort((a, b) => a.hsl[2] - b.hsl[2]);

  // 6) HEX + 이름
  const totalCount = picked.reduce((sum, p) => sum + p.count, 0) || 1;
  return picked.map(({ rgb, hsl, count }) => ({
    hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
    name: nameColor(hsl),
    hsl,
    population: count / totalCount,
  }));
}

// === 색상 명명 — Pinterest 카페/매거진 톤 ===
function nameColor([h, s, l]: HSL): string {
  // 거의 무채색
  if (s < 0.12) {
    if (l < 0.22) return "차콜";
    if (l < 0.40) return "딥 그레이";
    if (l < 0.62) return "스톤";
    if (l < 0.82) return "라이트 그레이";
    return "아이보리";
  }

  // 색상별
  let base = "";
  if (h < 12 || h >= 350) base = "로즈";
  else if (h < 24) base = "테라코타";
  else if (h < 40) base = "카멜";
  else if (h < 55) base = "머스타드";
  else if (h < 70) base = "샌드";
  else if (h < 95) base = "올리브";
  else if (h < 140) base = "세이지";
  else if (h < 170) base = "민트";
  else if (h < 200) base = "세린";
  else if (h < 230) base = "슬레이트";
  else if (h < 260) base = "인디고";
  else if (h < 285) base = "라벤더";
  else if (h < 320) base = "모브";
  else base = "더스티 핑크";

  // 톤 모디파이어
  let mod = "";
  if (l < 0.25) mod = "딥 ";
  else if (l < 0.40 && s < 0.40) mod = "무드 ";
  else if (l > 0.72 && s < 0.35) mod = "페일 ";
  else if (s < 0.25) mod = "더스티 ";

  return (mod + base).trim();
}

// === 메인 진입점 ===
export async function extractPaletteFromPhotos(
  photoUrls: string[],
  onProgress?: (progress: number) => void,
): Promise<ExtractedColor[]> {
  if (photoUrls.length === 0) throw new Error("사진이 없습니다");

  let allPixels: RGB[] = [];
  for (let i = 0; i < photoUrls.length; i++) {
    try {
      const img = await loadImage(photoUrls[i]);
      const pixels = samplePixels(img);
      allPixels = allPixels.concat(pixels);
      onProgress?.((i + 1) / photoUrls.length);
    } catch {
      // 한 장 실패해도 계속
    }
  }

  if (allPixels.length === 0) throw new Error("픽셀 샘플링 실패 — 사진 확인 필요");

  const centroids = quantize(allPixels);
  return refineForPinterest(centroids);
}
