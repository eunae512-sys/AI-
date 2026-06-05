// 인스타그램·릴스·스토리 텍스트 자동 배치 엔진
//
// 동작:
//   1) 이미지 → 작은 캔버스 격자 → 셀별 saliency (얼굴·음식·로고 등 핵심 피사체 추정)
//   2) 플랫폼별 안전영역 (UI 가림 영역) 마스킹
//   3) 역할별 선호 영역 가중치 → 베스트 region 자동 픽
//   4) 해당 region 의 평균 밝기 → 텍스트 색 · backdrop (gradient / blur / scrim) 자동
//   5) 텍스트 길이 → 자동 줄바꿈 · 최대 줄수 제한 · 자동 폰트 다운스케일
//
// 좌표는 0~1 비율로 반환 — 어떤 크기 컨테이너에서도 그대로 적용 가능.

// ─────────────────────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────────────────────

export type PlatformTarget =
  | "instagram-feed-square" // 1:1
  | "instagram-feed-portrait" // 4:5
  | "instagram-reels" // 9:16 비디오
  | "instagram-reels-thumb" // 9:16 썸네일
  | "instagram-story" // 9:16
  | "naver-blog" // varies
  | "kakao-channel"; // varies

export type SafeZones = {
  /** 상단에서 N 비율 (0~1) 만큼 UI 가 가림 — 텍스트 배치 금지 */
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type Region = {
  x: number; // 0~1
  y: number;
  width: number; // 0~1
  height: number;
  /** 0 (피사체 없음, 텍스트 좋음) ~ 1 (피사체 강함, 텍스트 나쁨) */
  saliency: number;
  /** 평균 밝기 0~255 */
  meanLuminance: number;
};

export type Role =
  | "title" // 큰 헤드라인 — 매거진 cover line
  | "subtitle" // 부제
  | "body-quote" // 본문 인용
  | "label" // 작은 매거진 라벨
  | "cta" // 행동 유도 한 줄
  | "footer"; // 운영 정보 한 줄

export type Alignment = "left" | "center" | "right";

export type BackdropKind =
  | "none" // 대비 충분 — backdrop 없음
  | "scrim-top" // 상단 어두운 그라데이션
  | "scrim-bottom" // 하단 어두운 그라데이션
  | "scrim-center" // 중앙 어두운 띠
  | "blur-box" // 텍스트 뒤 반투명 블러 박스
  | "solid-box"; // 솔리드 박스 (강한 대비 필요할 때)

export type PlacementResult = {
  /** 텍스트 박스 위치/크기 — 0~1 비율 */
  region: { x: number; y: number; width: number; height: number };
  alignment: Alignment;
  /** "light" → 흰색 글자, "dark" → 검정 글자 */
  textColor: "light" | "dark";
  /** 자동 줄바꿈 결과 */
  lines: string[];
  /** 추천 폰트 사이즈 — 컨테이너 높이의 비율 (0~1) */
  fontSizePct: number;
  backdrop: BackdropKind;
  backdropOpacity: number;
  /** 디버깅용 */
  meta: {
    saliency: number;
    luminance: number;
    contrast: number;
    reason: string;
    preferred: AnchorBand;
  };
};

type AnchorBand = "top" | "upper-center" | "center" | "lower-center" | "bottom";

// ─────────────────────────────────────────────────────────────
// 플랫폼별 안전영역 — 실제 인스타 디자인 캔버스 기준 픽셀 사양
// pct 는 자동 계산. 픽셀 단위가 진실 (디자이너 사양 그대로).
// ─────────────────────────────────────────────────────────────

export type PlatformSafeSpec = {
  /** 디자인 캔버스 (인스타 권장 사이즈) */
  canvas: { w: number; h: number };
  /** UI 가리는 영역 픽셀 마진 — top/bottom/left/right */
  margins: { top: number; bottom: number; left: number; right: number };
  /** 비대칭 마스킹 — 예: 릴스 우측 액션 컬럼은 하단 60% 만 차지 */
  extraMasks?: { x: number; y: number; w: number; h: number; reason: string }[];
};

export const PLATFORM_SPECS: Record<PlatformTarget, PlatformSafeSpec> = {
  // 인스타 게시물 1:1 — 캐러셀·정사각
  "instagram-feed-square": {
    canvas: { w: 1080, h: 1080 },
    margins: { top: 80, bottom: 80, left: 80, right: 80 },
  },
  // 인스타 게시물 4:5 — 카드뉴스 / 포트레이트 기본
  // ★ 사양: 모든 변 최소 80px 내부 여백
  "instagram-feed-portrait": {
    canvas: { w: 1080, h: 1350 },
    margins: { top: 80, bottom: 80, left: 80, right: 80 },
  },
  // 릴스 (재생 중) 9:16
  // ★ 사양: 상단 250px 금지 / 하단 350px 금지 / 우측 UI 컬럼 회피
  "instagram-reels": {
    canvas: { w: 1080, h: 1920 },
    margins: { top: 250, bottom: 350, left: 60, right: 60 },
    extraMasks: [
      // 우측 액션 컬럼 — 좋아요·댓글·공유·저장·프로필. 하단 ~60% 차지.
      { x: 1080 - 180, y: 1920 * 0.4, w: 180, h: 1920 * 0.6, reason: "릴스 우측 UI 컬럼" },
    ],
  },
  // 릴스 썸네일 / 커버 (피드에 노출되는 정적 이미지) — 우측 UI 없음, 캡션 영역만
  "instagram-reels-thumb": {
    canvas: { w: 1080, h: 1920 },
    margins: { top: 250, bottom: 350, left: 60, right: 60 },
  },
  // 스토리 9:16
  // ★ 사양: 상단 progress + 프로필 가림 / 하단 답장 입력창 가림
  // 상단: progress bar(8) + margin(16) + avatar+name(80) + margin(20) ≈ 124px → 여유 230px
  // 하단: 답장 입력창 ~88px + 안전 영역 + 액션 ≈ 350px
  "instagram-story": {
    canvas: { w: 1080, h: 1920 },
    margins: { top: 230, bottom: 350, left: 80, right: 80 },
  },
  // 네이버 블로그 — 카드뉴스 형태로 첨부 시 표준 1080
  "naver-blog": {
    canvas: { w: 1080, h: 1080 },
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
  },
  // 카카오 채널 메시지 카드
  "kakao-channel": {
    canvas: { w: 1080, h: 1080 },
    margins: { top: 80, bottom: 80, left: 80, right: 80 },
  },
};

/** spec → 0~1 비율 safe zone 자동 변환 */
function specToZones(spec: PlatformSafeSpec): SafeZones {
  return {
    top: spec.margins.top / spec.canvas.h,
    bottom: spec.margins.bottom / spec.canvas.h,
    left: spec.margins.left / spec.canvas.w,
    right: spec.margins.right / spec.canvas.w,
  };
}

export const PLATFORM_SAFE_ZONES: Record<PlatformTarget, SafeZones> = Object.fromEntries(
  (Object.entries(PLATFORM_SPECS) as [PlatformTarget, PlatformSafeSpec][]).map(
    ([k, v]) => [k, specToZones(v)],
  ),
) as Record<PlatformTarget, SafeZones>;

/** 비대칭 마스크 (extraMasks) 를 0~1 비율로 변환 */
export type NormalizedMask = { x: number; y: number; w: number; h: number; reason: string };
export function getExtraMasks(target: PlatformTarget): NormalizedMask[] {
  const spec = PLATFORM_SPECS[target];
  if (!spec.extraMasks) return [];
  return spec.extraMasks.map((m) => ({
    x: m.x / spec.canvas.w,
    y: m.y / spec.canvas.h,
    w: m.w / spec.canvas.w,
    h: m.h / spec.canvas.h,
    reason: m.reason,
  }));
}

// ─────────────────────────────────────────────────────────────
// 역할별 선호 위치 / 폰트 사이즈 / 정렬
// ─────────────────────────────────────────────────────────────

type RoleSpec = {
  preferred: AnchorBand;
  fallback: AnchorBand[];
  align: Alignment;
  maxLines: number;
  /** 컨테이너 높이의 % */
  fontSizePct: number;
  /** 텍스트 박스 가로 폭 (0~1, 안전영역 안에서) */
  widthPct: number;
};

const ROLE_SPEC: Record<Role, RoleSpec> = {
  title: {
    preferred: "upper-center",
    fallback: ["bottom", "center"],
    align: "left",
    maxLines: 3,
    fontSizePct: 0.08,
    widthPct: 0.88,
  },
  subtitle: {
    preferred: "upper-center",
    fallback: ["lower-center", "bottom"],
    align: "left",
    maxLines: 2,
    fontSizePct: 0.034,
    widthPct: 0.78,
  },
  "body-quote": {
    preferred: "center",
    fallback: ["upper-center", "lower-center"],
    align: "center",
    maxLines: 4,
    fontSizePct: 0.05,
    widthPct: 0.86,
  },
  label: {
    preferred: "top",
    fallback: ["bottom"],
    align: "left",
    maxLines: 1,
    fontSizePct: 0.022,
    widthPct: 0.62,
  },
  cta: {
    preferred: "bottom",
    fallback: ["lower-center"],
    align: "center",
    maxLines: 1,
    fontSizePct: 0.034,
    widthPct: 0.72,
  },
  footer: {
    preferred: "bottom",
    fallback: ["lower-center"],
    align: "left",
    maxLines: 1,
    fontSizePct: 0.022,
    widthPct: 0.7,
  },
};

// AnchorBand → 세로 비율 범위 (y0, y1 in 0~1) — 기본값
function anchorBandRange(band: AnchorBand): { y0: number; y1: number } {
  switch (band) {
    case "top":
      return { y0: 0.02, y1: 0.18 };
    case "upper-center":
      return { y0: 0.18, y1: 0.45 };
    case "center":
      return { y0: 0.38, y1: 0.62 };
    case "lower-center":
      return { y0: 0.55, y1: 0.82 };
    case "bottom":
      return { y0: 0.78, y1: 0.96 };
  }
}

// (target × role) 별 앵커 오버라이드 — 사양 반영
// 예: 릴스 title 은 중앙보다 약간 위 (0.32~0.55)
const TARGET_ROLE_BAND_OVERRIDE: Partial<Record<PlatformTarget, Partial<Record<Role, { y0: number; y1: number }>>>> = {
  "instagram-reels": {
    // ★ 사양: 핵심 문구는 중앙보다 약간 위
    title: { y0: 0.32, y1: 0.55 },
    "body-quote": { y0: 0.32, y1: 0.6 },
    subtitle: { y0: 0.5, y1: 0.7 },
    cta: { y0: 0.78, y1: 0.92 }, // 하단 안전영역 위(350px 마진 안)
  },
  "instagram-reels-thumb": {
    title: { y0: 0.3, y1: 0.55 },
    "body-quote": { y0: 0.3, y1: 0.6 },
  },
  "instagram-story": {
    title: { y0: 0.3, y1: 0.6 },
    "body-quote": { y0: 0.32, y1: 0.62 },
    cta: { y0: 0.72, y1: 0.84 }, // 답장창 위 안전 영역
  },
  "instagram-feed-portrait": {
    // 카드뉴스는 사양 그대로 — 제목 상단·핵심 중앙·CTA 하단 유지
    title: { y0: 0.08, y1: 0.34 },
    "body-quote": { y0: 0.32, y1: 0.62 },
    cta: { y0: 0.72, y1: 0.92 },
  },
};

/**
 * 역할별 후보 band 목록 — (target × role) 오버라이드 우선 적용.
 * 첫 번째 항목이 preferred. override 는 첫 항목의 range 만 교체.
 */
function getBandsForRoleAndTarget(
  target: PlatformTarget,
  role: Role,
): Array<{ band: AnchorBand; range: { y0: number; y1: number } }> {
  const spec = ROLE_SPEC[role];
  const override = TARGET_ROLE_BAND_OVERRIDE[target]?.[role];
  const bands: AnchorBand[] = [spec.preferred, ...spec.fallback];
  return bands.map((b, i) => ({
    band: b,
    range: i === 0 && override ? override : anchorBandRange(b),
  }));
}

// ─────────────────────────────────────────────────────────────
// 이미지 → saliency 격자
// 작은 캔버스에 그려서 셀별 brightness variance + saturation peak 분석
// 캔버스 안 쓰는 SSR 환경에선 균등 saliency 반환 (안전한 default)
// ─────────────────────────────────────────────────────────────

const SALIENCY_COLS = 8;
const SALIENCY_ROWS = 10; // 4:5 에 가까운 격자

export type SaliencyGrid = {
  cols: number;
  rows: number;
  /** rows × cols 매트릭스, 각 셀: { saliency 0~1, luminance 0~255 } */
  cells: { saliency: number; luminance: number }[][];
};

/**
 * HTMLImageElement → SaliencyGrid
 * CORS-safe 이미지여야 함 (crossOrigin="anonymous" 설정 권장).
 * 실패 시 null 반환 (호출 측에서 fallback).
 */
export function computeSaliencyGrid(
  imageEl: HTMLImageElement,
  cols: number = SALIENCY_COLS,
  rows: number = SALIENCY_ROWS,
): SaliencyGrid | null {
  if (typeof document === "undefined") return null;
  try {
    const W = cols * 8;
    const H = rows * 8;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(imageEl, 0, 0, W, H);
    let data: Uint8ClampedArray;
    try {
      data = ctx.getImageData(0, 0, W, H).data;
    } catch {
      // CORS tainted canvas — 깔끔하게 fallback
      return null;
    }

    const cells: { saliency: number; luminance: number }[][] = [];
    for (let row = 0; row < rows; row++) {
      cells[row] = [];
      for (let col = 0; col < cols; col++) {
        const x0 = Math.floor((col * W) / cols);
        const x1 = Math.floor(((col + 1) * W) / cols);
        const y0 = Math.floor((row * H) / rows);
        const y1 = Math.floor(((row + 1) * H) / rows);
        let sumL = 0;
        let sumLSq = 0;
        let satMax = 0;
        let count = 0;
        // edge intensity — 셀 내부 인접 픽셀 차이 합
        let edgeSum = 0;
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = (y * W + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // luminance (BT.709)
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            sumL += lum;
            sumLSq += lum * lum;
            count++;
            const mx = Math.max(r, g, b);
            const mn = Math.min(r, g, b);
            const sat = mx === 0 ? 0 : (mx - mn) / mx;
            if (sat > satMax) satMax = sat;
            // edge — 오른쪽 픽셀과의 차이
            if (x + 1 < x1) {
              const j = i + 4;
              const lum2 =
                0.2126 * data[j] + 0.7152 * data[j + 1] + 0.0722 * data[j + 2];
              edgeSum += Math.abs(lum - lum2);
            }
          }
        }
        const meanL = sumL / Math.max(1, count);
        const varianceL = sumLSq / Math.max(1, count) - meanL * meanL;
        // saliency 종합 — variance(주제 디테일) + saturation(컬러 피사체) + edge(경계)
        const sal =
          Math.min(1, varianceL / 1800) * 0.45 +
          Math.min(1, satMax) * 0.3 +
          Math.min(1, edgeSum / (count * 12)) * 0.25;
        cells[row][col] = { saliency: Math.max(0, Math.min(1, sal)), luminance: meanL };
      }
    }
    return { cols, rows, cells };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// 한국어 + 영문 자동 줄바꿈
// 단어 단위로 줄을 쌓되, 한국어는 어절 단위로 분할
// ─────────────────────────────────────────────────────────────

/**
 * 텍스트를 줄로 나눔 — 한국어는 공백 어절, 영문도 공백.
 * maxLines 초과 시 마지막 줄에 … 추가.
 */
export function wrapText(
  text: string,
  maxCharsPerLine: number,
  maxLines: number,
): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const tokens = cleaned.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const t of tokens) {
    const next = current ? `${current} ${t}` : t;
    if (visualLen(next) <= maxCharsPerLine) {
      current = next;
    } else {
      if (current) lines.push(current);
      // 단일 토큰이 한 줄 폭보다 길면 강제 분할
      if (visualLen(t) > maxCharsPerLine) {
        const parts = forceSplit(t, maxCharsPerLine);
        for (let i = 0; i < parts.length - 1; i++) lines.push(parts[i]);
        current = parts[parts.length - 1];
      } else {
        current = t;
      }
    }
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length > maxLines) {
    const truncated = lines.slice(0, maxLines);
    // 마지막 줄에 ellipsis
    truncated[maxLines - 1] = ellipsizeEnd(truncated[maxLines - 1], maxCharsPerLine);
    return truncated;
  }
  return lines;
}

/** 한국어 1자 = 1.6, 영문 1자 = 1, 공백/숫자 = 1 — 시각 폭 추정 */
function visualLen(s: string): number {
  let n = 0;
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    // 한글 (가-힣) 또는 한자 영역
    if ((c >= 0xac00 && c <= 0xd7a3) || (c >= 0x4e00 && c <= 0x9fff)) {
      n += 1.6;
    } else {
      n += 1;
    }
  }
  return n;
}

function forceSplit(token: string, maxVisual: number): string[] {
  const parts: string[] = [];
  let current = "";
  for (const ch of token) {
    const next = current + ch;
    if (visualLen(next) > maxVisual) {
      if (current) parts.push(current);
      current = ch;
    } else {
      current = next;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function ellipsizeEnd(line: string, maxVisual: number): string {
  let s = line;
  while (visualLen(s) + 1 > maxVisual && s.length > 1) s = s.slice(0, -1);
  return s + "…";
}

// ─────────────────────────────────────────────────────────────
// Best region 찾기 — saliency + safe zones + role anchor
// ─────────────────────────────────────────────────────────────

/**
 * 격자 + 안전영역 + 역할 → 텍스트가 들어갈 베스트 region 자동 계산.
 * grid 가 null 이면 안전영역만 사용하는 휴리스틱.
 * extraMasks (비대칭 UI 마스크) 도 saliency 처럼 회피 영역으로 반영.
 */
export function findBestRegion(opts: {
  grid: SaliencyGrid | null;
  safeZones: SafeZones;
  role: Role;
  target: PlatformTarget;
  extraMasks?: NormalizedMask[];
}): { region: Region; band: AnchorBand } {
  const { grid, safeZones, role, target, extraMasks = [] } = opts;
  const candidates = getBandsForRoleAndTarget(target, role);

  let bestBand: AnchorBand = candidates[0].band;
  let bestRegion: Region | null = null;
  let bestScore = Infinity;

  // 텍스트 박스 가로 폭 — 비대칭 마스크에 따라 좌·우 추가로 줄여야 할 수 있음
  // (예: 릴스 우측 UI 컬럼은 하단 60% 만 적용 → 해당 band 에서만 right 추가)
  function effectiveHorizontalForBand(y0: number, y1: number): { left: number; right: number } {
    let extraLeft = 0;
    let extraRight = 0;
    for (const m of extraMasks) {
      // 마스크가 [y0, y1] 와 세로로 겹치는지
      const overlap = !(m.y + m.h < y0 || m.y > y1);
      if (!overlap) continue;
      // 왼쪽 마스크인지 오른쪽 마스크인지 — 가로 위치로 판단
      if (m.x < 0.5) {
        // 왼쪽
        const masked = Math.min(0.5, m.x + m.w) - safeZones.left;
        extraLeft = Math.max(extraLeft, masked);
      } else {
        // 오른쪽
        const masked = (1 - safeZones.right) - m.x;
        extraRight = Math.max(extraRight, masked);
      }
    }
    return {
      left: safeZones.left + Math.max(0, extraLeft),
      right: safeZones.right + Math.max(0, extraRight),
    };
  }

  for (let i = 0; i < candidates.length; i++) {
    const { band, range } = candidates[i];
    const y0 = Math.max(range.y0, safeZones.top);
    const y1 = Math.min(range.y1, 1 - safeZones.bottom);
    if (y1 - y0 < 0.05) continue;

    const { left, right } = effectiveHorizontalForBand(y0, y1);
    if (1 - left - right < 0.1) continue; // 가로 폭 너무 좁으면 스킵

    let avgSal = 0;
    let avgLum = 128;
    if (grid) {
      const ix0 = Math.max(0, Math.floor(left * grid.cols));
      const ix1 = Math.min(grid.cols, Math.ceil((1 - right) * grid.cols));
      const iy0 = Math.max(0, Math.floor(y0 * grid.rows));
      const iy1 = Math.min(grid.rows, Math.ceil(y1 * grid.rows));
      let s = 0;
      let l = 0;
      let n = 0;
      for (let r = iy0; r < iy1; r++) {
        for (let c = ix0; c < ix1; c++) {
          s += grid.cells[r][c].saliency;
          l += grid.cells[r][c].luminance;
          n++;
        }
      }
      if (n > 0) {
        avgSal = s / n;
        avgLum = l / n;
      }
    }
    const preferredPenalty = i === 0 ? 0 : 0.15;
    const score = avgSal + preferredPenalty;
    if (score < bestScore) {
      bestScore = score;
      bestBand = band;
      bestRegion = {
        x: left,
        y: y0,
        width: 1 - left - right,
        height: y1 - y0,
        saliency: avgSal,
        meanLuminance: avgLum,
      };
    }
  }

  if (!bestRegion) {
    bestRegion = {
      x: safeZones.left,
      y: safeZones.top,
      width: 1 - safeZones.left - safeZones.right,
      height: 1 - safeZones.top - safeZones.bottom,
      saliency: 0.5,
      meanLuminance: 128,
    };
  }

  return { region: bestRegion, band: bestBand };
}

// ─────────────────────────────────────────────────────────────
// 대비 측정 → 텍스트 색 · backdrop 결정
// ─────────────────────────────────────────────────────────────

/**
 * region 의 평균 휘도 → 텍스트 색 결정
 * 휘도 128 미만 = 어두움 → light text (흰색)
 * 휘도 128 이상 = 밝음 → dark text (검정)
 */
export function pickTextColor(meanLuminance: number): "light" | "dark" {
  return meanLuminance < 128 ? "light" : "dark";
}

/**
 * 휘도 + saliency → backdrop 종류 추천
 * saliency 높음 = 피사체 위 → 강한 backdrop 필요
 * 휘도 중간 (80~180) = 대비 애매 → backdrop 권장
 */
export function recommendBackdrop(opts: {
  meanLuminance: number;
  saliency: number;
  textColor: "light" | "dark";
  band: AnchorBand;
}): { kind: BackdropKind; opacity: number } {
  const { meanLuminance, saliency, textColor, band } = opts;
  // 대비 정도 — 0 (안전) ~ 1 (위험)
  const ambiguous =
    textColor === "light"
      ? Math.max(0, Math.min(1, (meanLuminance - 40) / 100))
      : Math.max(0, Math.min(1, (200 - meanLuminance) / 100));
  const risk = ambiguous * 0.55 + saliency * 0.45;

  if (risk < 0.2) return { kind: "none", opacity: 0 };

  // 위치 기반 scrim 결정
  if (band === "top") {
    return { kind: "scrim-top", opacity: 0.35 + risk * 0.3 };
  }
  if (band === "bottom") {
    return { kind: "scrim-bottom", opacity: 0.4 + risk * 0.3 };
  }
  if (band === "upper-center" || band === "lower-center") {
    if (risk > 0.55) {
      return { kind: "blur-box", opacity: 0.6 };
    }
    return { kind: band === "upper-center" ? "scrim-top" : "scrim-bottom", opacity: 0.35 + risk * 0.25 };
  }
  // center — 박스 형태가 자연스러움
  if (risk > 0.65) {
    return { kind: "blur-box", opacity: 0.55 };
  }
  return { kind: "scrim-center", opacity: 0.35 };
}

// 이미지 분석이 없을 때 위치(band)에 맞춰 바닥 스크림 종류 결정 — 항상 가독 확보용
function bandFallbackScrim(band: AnchorBand): BackdropKind {
  if (band === "top" || band === "upper-center") return "scrim-top";
  if (band === "bottom" || band === "lower-center") return "scrim-bottom";
  return "scrim-center";
}

// ─────────────────────────────────────────────────────────────
// 메인 export — 한 줄 호출
// ─────────────────────────────────────────────────────────────

/**
 * 이미지·텍스트·역할·플랫폼 주면 자동 배치 결과 반환.
 * imageEl 없으면 (서버 사이드 또는 CORS 실패) 안전영역 기반 휴리스틱으로 fallback.
 */
export function computePlacement(opts: {
  text: string;
  role: Role;
  target: PlatformTarget;
  imageEl?: HTMLImageElement | null;
  /** 컨테이너 가로/세로 비율 — 안 주면 4:5 가정 (인스타 카드뉴스) */
  aspectRatio?: number;
}): PlacementResult {
  const safeZones = PLATFORM_SAFE_ZONES[opts.target];
  const extraMasks = getExtraMasks(opts.target);
  const grid = opts.imageEl ? computeSaliencyGrid(opts.imageEl) : null;
  const spec = ROLE_SPEC[opts.role];
  const { region, band } = findBestRegion({
    grid,
    safeZones,
    role: opts.role,
    target: opts.target,
    extraMasks,
  });

  // 이미지 분석이 없을 때(서버 렌더·CORS·미로드)는 바탕 휘도를 알 수 없다.
  // 기본 lum=128 → pickTextColor 가 검은 글씨를 골라 어두운 릴스/스토리 프레임에서
  // 글자가 사라지고 미리보기가 통째로 빈 것처럼 보였다. 이미지가 없을 땐 '밝은 글씨 +
  // 바닥 스크림'을 강제해 어떤 바탕에서도 읽히게 한다(표시 img 로딩 전/실패 시 포함).
  const noImage = !grid;
  const textColor: "light" | "dark" = noImage ? "light" : pickTextColor(region.meanLuminance);
  const backdrop = noImage
    ? { kind: bandFallbackScrim(band), opacity: 0.5 }
    : recommendBackdrop({
        meanLuminance: region.meanLuminance,
        saliency: region.saliency,
        textColor,
        band,
      });

  // 가로 폭에 맞는 줄당 글자 수 추정 — 폰트 사이즈와 박스 폭으로
  // 컨테이너 폭 1 기준, 한국어 한 글자 폭 ≈ fontSizePct * (aspectRatio ? 1 : 1)
  // 가로 박스 폭 (region.width) * spec.widthPct 안에 들어가야 함
  const aspectRatio = opts.aspectRatio ?? 4 / 5; // 폭/높이
  // 한 글자 폭 ≈ fontSizePct (높이의 비율) ÷ aspectRatio (높이→폭 환산)
  // 한국어 시각폭 1.6 반영
  const charVisualWidthRel = (spec.fontSizePct / aspectRatio) * 1.0;
  const usableWidthRel = region.width * spec.widthPct;
  const maxCharsPerLineVisual = Math.max(8, Math.floor(usableWidthRel / charVisualWidthRel));

  const lines = wrapText(opts.text, maxCharsPerLineVisual, spec.maxLines);

  return {
    region: {
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
    },
    alignment: spec.align,
    textColor,
    lines,
    fontSizePct: spec.fontSizePct,
    backdrop: backdrop.kind,
    backdropOpacity: backdrop.opacity,
    meta: {
      saliency: region.saliency,
      luminance: region.meanLuminance,
      contrast: region.meanLuminance < 128 ? region.meanLuminance / 128 : (255 - region.meanLuminance) / 128,
      reason: backdropReason(region.saliency, region.meanLuminance, backdrop.kind),
      preferred: band,
    },
  };
}

function backdropReason(sal: number, lum: number, kind: BackdropKind): string {
  if (kind === "none") return `대비 충분 (saliency ${sal.toFixed(2)}, lum ${Math.round(lum)})`;
  if (kind.startsWith("scrim")) return `약한 그라데이션 추가 (lum ${Math.round(lum)})`;
  if (kind === "blur-box") return `피사체 위 — 블러 박스 적용 (saliency ${sal.toFixed(2)})`;
  return `backdrop 적용`;
}
