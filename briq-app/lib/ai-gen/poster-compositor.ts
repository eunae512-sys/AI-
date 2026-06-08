// AI 사진 소재 + 앱이 그리는 전체 에디토리얼 레이아웃 → 단일 PNG 합성 (canvas).
//
// ★ 아키텍처: AI = 사진만. 앱 = 디자인·타이포·콜아웃·라벨 100%.
//
// AI(Nano Banana 등)는 한글을 깨지게 렌더링하고, 자기가 그린 박스 위치를 앱에
// 못 알려준다. 그래서 AI 에겐 "글자·박스·선 없는 깨끗한 사진"만 받고(poster-templates.ts),
// 이 모듈이 디자인 토큰으로 제목·부제·콜아웃 칩+연결선+라벨·메뉴 리스트를
// *결정론적으로* 그린다. → 텍스트 항상 정확, 위치 통제, 온브랜드, 정직.
//
// 3종 레이아웃:
//   callout — 사진 카드 + 라벨 칩(진짜 한글) + 얇은 연결선 + SAGE 끝점 + 인셋(선택)
//   cover   — 풀블리드 히어로 + 하단 잉크 스크림 + 큰 명조 헤드라인
//   menu    — 상단 사진 + 하단 메뉴 리스트(이름 + 설명, 헤어라인 구분)
//
// 철칙(CLAUDE.md): 한글은 명조(Nanum Myeongjo) upright — italic 절대 금지.
//   단일 SAGE 액센트, 사각·헤어라인(RULE), keep-all, 가짜 수치/정보 금지.
//   빈 칩 절대 금지 — 라벨 없으면 그 칩을 그리지 않는다.

import type { PosterLayout } from "@/lib/ai-gen/poster-templates";
import {
  INK,
  INK_SOFT,
  INK_MUTE,
  PAPER,
  SAGE,
} from "@/lib/landing/tokens";

export type PosterCallout = { label: string };
export type PosterMenuItem = { name: string; desc?: string };

export type PosterContent = {
  title?: string;
  subtitle?: string;
  /** callout 레이아웃 — 앱이 그릴 라벨 칩(빈 라벨은 자동 제외) */
  callouts?: PosterCallout[];
  /** menu 레이아웃 — 메뉴 리스트(이름 + 선택 설명) */
  menuItems?: PosterMenuItem[];
  /** cover/공통 eyebrow — 영문 브랜드명 등(라틴 대문자 자간, 한글이면 upright) */
  caption?: string;
  /** 강조 색상 — 미지정 시 SAGE */
  accentColor?: string;
  /** 손글씨 느낌 — 라틴/숫자에만(한글은 명조 유지) */
  handwriting?: boolean;
};

export type ComposePosterOpts = {
  imageSrc: string;
  layout: PosterLayout;
  content: PosterContent;
};

// 고해상도 출력 — 9:16.
const OUT_W = 1080;
const OUT_H = 1920;

const SERIF_HANGUL_STACK =
  "'Nanum Myeongjo', 'Cormorant Garamond', 'Apple SD Gothic Neo', serif";
const SANS_STACK = "'Pretendard', 'Apple SD Gothic Neo', sans-serif";
const LATIN_SERIF_STACK = "'Cormorant Garamond', 'Nanum Myeongjo', serif";

// PAPER #FAF7EE → rgba 헬퍼.
function paperRGBA(a: number): string {
  return `rgba(250,247,238,${a})`;
}
// INK #14130F → rgba 헬퍼.
function inkRGBA(a: number): string {
  return `rgba(20,19,15,${a})`;
}

/** 폰트 미리 로드(실패/타임아웃 시 시스템 폴백으로도 그린다). */
async function ensureFonts(): Promise<void> {
  const docFonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!docFonts?.load) return;
  const specs = [
    `700 96px 'Nanum Myeongjo'`,
    `800 96px 'Nanum Myeongjo'`,
    `400 40px 'Pretendard'`,
    `600 40px 'Pretendard'`,
    `600 40px 'Cormorant Garamond'`,
  ];
  try {
    await Promise.race([
      Promise.all(specs.map((s) => docFonts.load(s))),
      new Promise((r) => setTimeout(r, 1600)),
    ]);
  } catch {
    // 폴백 — 시스템 명조/Pretendard 로 그린다.
  }
}

/** 한글 포함 여부 — true 면 italic 금지(철칙). */
function hasHangul(s: string): boolean {
  return /[가-힣ᄀ-ᇿ㄰-㆏]/.test(s);
}

/** keep-all 줄바꿈 — 공백 단위로만 끊고 한글 음절 중간은 끊지 않는다. */
function wrapKeepAll(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** object-cover 로 소스 이미지를 dest 사각에 채워 그린다(중앙 크롭). */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  sxFrac = 0.5,
  syFrac = 0.5,
): void {
  const iw = img.naturalWidth || 1;
  const ih = img.naturalHeight || 1;
  const scale = Math.max(dw / iw, dh / ih);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (iw - sw) * sxFrac;
  const sy = (ih - sh) * syFrac;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/** 사각 헤어라인 테두리. */
function strokeRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  lw: number,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw);
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지 로드 실패"));
    img.src = src;
  });

/**
 * AI 사진 소재 위에 앱이 전체 레이아웃을 그려 단일 PNG(data URL) 반환.
 */
export async function composePoster(opts: ComposePosterOpts): Promise<string> {
  const { imageSrc, layout, content } = opts;
  const accent = content.accentColor?.trim() || SAGE;

  const img = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context 생성 실패");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  await ensureFonts();

  if (layout === "cover") {
    drawCover(ctx, img, content, accent);
  } else if (layout === "menu") {
    drawMenu(ctx, img, content, accent);
  } else {
    drawCallout(ctx, img, content, accent);
  }

  return canvas.toDataURL("image/png");
}

// ── 공통 텍스트 헬퍼 ───────────────────────────────────────────────────────

/** 명조 헤드라인 그리기 → 다음 y 반환. */
function drawHeadline(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  px: number,
  color: string,
  weight = 700,
  align: CanvasTextAlign = "left",
): number {
  ctx.font = `${weight} ${px}px ${SERIF_HANGUL_STACK}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  const lines = wrapKeepAll(ctx, text, maxW);
  const lh = px * 1.16;
  let cy = y + px;
  for (const line of lines) {
    ctx.fillText(line, x, cy);
    cy += lh;
  }
  return cy - lh + px * 0.16;
}

// ── 2a. CALLOUT — 핵심 레이아웃 ────────────────────────────────────────────
function drawCallout(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  content: PosterContent,
  accent: string,
): void {
  const W = OUT_W;
  const H = OUT_H;
  const RULE_C = inkRGBA(0.16);

  // 배경 PAPER 풀캔버스.
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const marginX = Math.round(W * 0.085);
  const title = (content.title ?? "").trim();
  const subtitle = (content.subtitle ?? "").trim();

  // ── 상단 타이틀 블록 ──
  let y = Math.round(H * 0.072);
  if (title) {
    const titlePx = Math.round(W * 0.082);
    y = drawHeadline(ctx, title, marginX, y, W - marginX * 2, titlePx, INK, 700, "left");
    y += Math.round(H * 0.012);
  }
  if (subtitle) {
    ctx.font = `400 ${Math.round(W * 0.032)}px ${SANS_STACK}`;
    ctx.fillStyle = INK_MUTE;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const subPx = Math.round(W * 0.032);
    const subLines = wrapKeepAll(ctx, subtitle, W - marginX * 2);
    let cy = y + subPx;
    for (const line of subLines) {
      ctx.fillText(line, marginX, cy);
      cy += subPx * 1.4;
    }
    y = cy - subPx * 1.4 + subPx * 0.3;
  }
  // 짧은 SAGE rule.
  y += Math.round(H * 0.014);
  ctx.fillStyle = accent;
  ctx.fillRect(marginX, y, Math.round(W * 0.12), Math.max(3, Math.round(W * 0.0045)));
  const headerBottom = y + Math.round(H * 0.03);

  // ── 콜아웃 데이터(빈 라벨 제외) ──
  const callouts = (content.callouts ?? [])
    .map((c) => ({ label: (c.label ?? "").trim() }))
    .filter((c) => c.label.length > 0)
    .slice(0, 4);
  const n = callouts.length;

  // ── 사진 카드 — 중앙, 칩 여백 확보 ──
  // 칩이 좌우에 놓이므로 사진 폭을 70% 로 줄이고 중앙 정렬.
  const cardW = Math.round(W * 0.62);
  const cardX = Math.round((W - cardW) / 2);
  const cardTop = headerBottom + Math.round(H * 0.05);
  const cardBottom = H - Math.round(H * 0.06);
  const cardH = cardBottom - cardTop;
  const cardCx = cardX + cardW / 2;
  const cardCy = cardTop + cardH / 2;

  // 사진(사각, object-cover) + RULE 헤어라인.
  ctx.save();
  ctx.beginPath();
  ctx.rect(cardX, cardTop, cardW, cardH);
  ctx.clip();
  drawImageCover(ctx, img, cardX, cardTop, cardW, cardH);
  ctx.restore();
  strokeRect(ctx, cardX, cardTop, cardW, cardH, RULE_C, Math.max(2, Math.round(W * 0.002)));

  if (n === 0) return; // 라벨 없으면 칩 없이 제목+사진만.

  // ── 칩 슬롯 — 사진 좌우 여백에 결정론적 균형 배치(겹침 0) ──
  // 좌측 슬롯은 카드 왼쪽 여백 중앙, 우측 슬롯은 오른쪽 여백 중앙.
  const chipH = Math.round(H * 0.052);
  const chipW = Math.round(W * 0.235);
  const dotR = Math.max(4, Math.round(W * 0.006));

  type Slot = { side: "L" | "R"; cyFrac: number };
  // 배치 규칙: 2=좌상/우하, 3=좌상/우상/좌하(또는 우하), 4=좌상/좌하/우상/우하.
  const slotPlans: Record<number, Slot[]> = {
    1: [{ side: "L", cyFrac: 0.32 }],
    2: [
      { side: "L", cyFrac: 0.3 },
      { side: "R", cyFrac: 0.7 },
    ],
    3: [
      { side: "L", cyFrac: 0.26 },
      { side: "R", cyFrac: 0.42 },
      { side: "L", cyFrac: 0.74 },
    ],
    4: [
      { side: "L", cyFrac: 0.26 },
      { side: "L", cyFrac: 0.72 },
      { side: "R", cyFrac: 0.4 },
      { side: "R", cyFrac: 0.84 },
    ],
  };
  const slots = slotPlans[n] ?? slotPlans[4];

  const gutterL = cardX; // 0..cardX
  const gutterR = W - (cardX + cardW);

  callouts.forEach((c, i) => {
    const slot = slots[i];
    const left = slot.side === "L";
    // 칩 x — 여백 내부에서 카드 쪽으로 붙이되 화면 가장자리 마진 확보.
    const edgeMargin = Math.round(W * 0.03);
    let chipX: number;
    if (left) {
      chipX = Math.max(edgeMargin, gutterL - chipW - Math.round(W * 0.005));
      if (chipX < edgeMargin) chipX = edgeMargin;
    } else {
      const rightStart = cardX + cardW + Math.round(W * 0.005);
      chipX = Math.min(rightStart, W - edgeMargin - chipW);
    }
    const chipCy = cardTop + cardH * slot.cyFrac;
    const chipY = Math.round(chipCy - chipH / 2);

    // 연결선 — 칩 안쪽 모서리 → 사진 가장자리의 동일 높이 지점.
    const chipInnerX = left ? chipX + chipW : chipX;
    const photoEdgeX = left ? cardX : cardX + cardW;
    const lineY = Math.round(chipCy);
    ctx.strokeStyle = inkRGBA(0.28);
    ctx.lineWidth = Math.max(1.2, W * 0.0014);
    ctx.beginPath();
    ctx.moveTo(chipInnerX, lineY);
    ctx.lineTo(photoEdgeX, lineY);
    ctx.stroke();
    // 사진 가장자리 SAGE 끝점.
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(photoEdgeX, lineY, dotR, 0, Math.PI * 2);
    ctx.fill();

    // 칩 박스 — PAPER 위 RULE 헤어라인 사각.
    ctx.fillStyle = PAPER;
    ctx.fillRect(chipX, chipY, chipW, chipH);
    strokeRect(ctx, chipX, chipY, chipW, chipH, RULE_C, Math.max(1.4, W * 0.0014));
    // 칩 안쪽 SAGE 작은 마커(앞).
    const markX = chipX + Math.round(W * 0.018);
    const markY = chipY + chipH / 2;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(markX, markY, Math.max(2.5, W * 0.0035), 0, Math.PI * 2);
    ctx.fill();

    // 라벨 — 명조 INK, keep-all, 칩 안 한 줄(넘치면 폰트 축소).
    const labelMaxW = chipW - Math.round(W * 0.055);
    let labelPx = Math.round(W * 0.03);
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${labelPx}px ${SANS_STACK}`;
    while (ctx.measureText(c.label).width > labelMaxW && labelPx > 16) {
      labelPx -= 1;
      ctx.font = `600 ${labelPx}px ${SANS_STACK}`;
    }
    ctx.fillText(c.label, markX + Math.round(W * 0.022), markY + 1);
  });
}

// ── 2b. COVER ──────────────────────────────────────────────────────────────
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  content: PosterContent,
  accent: string,
): void {
  const W = OUT_W;
  const H = OUT_H;

  // 풀블리드 히어로.
  drawImageCover(ctx, img, 0, 0, W, H);

  // 하단 스크림 — transparent → INK.
  const scrimH = Math.round(H * 0.5);
  const scrimTop = H - scrimH;
  const grad = ctx.createLinearGradient(0, scrimTop, 0, H);
  grad.addColorStop(0, inkRGBA(0));
  grad.addColorStop(0.45, inkRGBA(0.55));
  grad.addColorStop(1, inkRGBA(0.9));
  ctx.fillStyle = grad;
  ctx.fillRect(0, scrimTop, W, scrimH);

  const marginX = Math.round(W * 0.085);
  const caption = (content.caption ?? "").trim();
  const title = (content.title ?? "").trim();
  const subtitle = (content.subtitle ?? "").trim();
  const maxW = W - marginX * 2;

  // 하단 정렬로 쌓기 위해 높이부터 계산.
  const eyebrowPx = Math.round(W * 0.026);
  const titlePx = Math.round(W * 0.088);
  const subPx = Math.round(W * 0.032);

  // 측정용.
  ctx.font = `700 ${titlePx}px ${SERIF_HANGUL_STACK}`;
  const titleLines = title ? wrapKeepAll(ctx, title, maxW) : [];
  ctx.font = `400 ${subPx}px ${SANS_STACK}`;
  const subLines = subtitle ? wrapKeepAll(ctx, subtitle, maxW) : [];

  const titleLH = titlePx * 1.14;
  const subLH = subPx * 1.42;
  const ruleGap = Math.round(H * 0.018);
  const blockH =
    (caption ? eyebrowPx + Math.round(H * 0.016) : 0) +
    titleLines.length * titleLH +
    (subLines.length ? ruleGap + Math.max(3, Math.round(W * 0.0045)) + ruleGap : 0) +
    subLines.length * subLH;

  const bottomPad = Math.round(H * 0.075);
  let y = H - bottomPad - blockH;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // eyebrow(영문 대문자 자간 — 라틴만; 한글이면 upright 일반).
  if (caption) {
    const latin = !hasHangul(caption);
    ctx.font = `600 ${eyebrowPx}px ${latin ? LATIN_SERIF_STACK : SANS_STACK}`;
    ctx.fillStyle = paperRGBA(0.85);
    const text = latin ? caption.toUpperCase() : caption;
    if (latin) {
      // 자간 — letter-by-letter.
      let cx = marginX;
      const tracking = eyebrowPx * 0.22;
      for (const ch of text) {
        ctx.fillText(ch, cx, y + eyebrowPx);
        cx += ctx.measureText(ch).width + tracking;
      }
    } else {
      ctx.fillText(text, marginX, y + eyebrowPx);
    }
    y += eyebrowPx + Math.round(H * 0.016);
  }

  // 헤드라인 — PAPER 텍스트.
  ctx.font = `700 ${titlePx}px ${SERIF_HANGUL_STACK}`;
  ctx.fillStyle = PAPER;
  let cy = y + titlePx;
  for (const line of titleLines) {
    ctx.fillText(line, marginX, cy);
    cy += titleLH;
  }
  y = cy - titleLH + titlePx * 0.18;

  // SAGE rule + 부제.
  if (subLines.length) {
    y += ruleGap;
    ctx.fillStyle = accent;
    ctx.fillRect(marginX, y, Math.round(W * 0.1), Math.max(3, Math.round(W * 0.0045)));
    y += Math.max(3, Math.round(W * 0.0045)) + ruleGap;
    ctx.font = `400 ${subPx}px ${SANS_STACK}`;
    ctx.fillStyle = paperRGBA(0.85);
    let sy = y + subPx;
    for (const line of subLines) {
      ctx.fillText(line, marginX, sy);
      sy += subLH;
    }
  }
}

// ── 2c. MENU ─────────────────────────────────────────────────────────────��─
function drawMenu(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  content: PosterContent,
  accent: string,
): void {
  const W = OUT_W;
  const H = OUT_H;
  const RULE_SOFT_C = inkRGBA(0.1);

  // 배경 PAPER.
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // 상단 사진 ~54%.
  const photoH = Math.round(H * 0.54);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, photoH);
  ctx.clip();
  drawImageCover(ctx, img, 0, 0, W, photoH);
  ctx.restore();

  const marginX = Math.round(W * 0.085);
  const title = (content.title ?? "").trim();
  const subtitle = (content.subtitle ?? "").trim();

  let y = photoH + Math.round(H * 0.05);

  if (title) {
    const titlePx = Math.round(W * 0.064);
    y = drawHeadline(ctx, title, marginX, y, W - marginX * 2, titlePx, INK, 700, "left");
    y += Math.round(H * 0.006);
  }
  if (subtitle) {
    const subPx = Math.round(W * 0.03);
    ctx.font = `400 ${subPx}px ${SANS_STACK}`;
    ctx.fillStyle = INK_MUTE;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(subtitle, marginX, y + subPx);
    y += subPx * 1.6;
  }
  // SAGE rule.
  y += Math.round(H * 0.01);
  ctx.fillStyle = accent;
  ctx.fillRect(marginX, y, Math.round(W * 0.1), Math.max(3, Math.round(W * 0.0045)));
  y += Math.round(H * 0.035);

  const items = (content.menuItems ?? [])
    .map((m) => ({ name: (m.name ?? "").trim(), desc: (m.desc ?? "").trim() }))
    .filter((m) => m.name.length > 0)
    .slice(0, 6);

  const rowH = Math.round(H * 0.066);
  const namePx = Math.round(W * 0.038);
  const descPx = Math.round(W * 0.028);

  for (const item of items) {
    if (y + rowH > H - Math.round(H * 0.04)) break;
    // 이름 — 명조 INK.
    ctx.font = `700 ${namePx}px ${SERIF_HANGUL_STACK}`;
    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const rowMid = y + rowH * 0.42;
    ctx.fillText(item.name, marginX, rowMid);

    // 설명 — INK_MUTE, 우측 정렬(겹치면 다음 줄 대신 폭 제한).
    if (item.desc) {
      ctx.font = `400 ${descPx}px ${SANS_STACK}`;
      ctx.fillStyle = INK_MUTE;
      ctx.textAlign = "right";
      const nameW = (() => {
        ctx.font = `700 ${namePx}px ${SERIF_HANGUL_STACK}`;
        const w = ctx.measureText(item.name).width;
        ctx.font = `400 ${descPx}px ${SANS_STACK}`;
        return w;
      })();
      const descMaxX = W - marginX;
      const descMinX = marginX + nameW + Math.round(W * 0.04);
      let desc = item.desc;
      while (
        descMaxX - ctx.measureText(desc).width < descMinX &&
        desc.length > 1
      ) {
        desc = desc.slice(0, -1);
      }
      if (desc !== item.desc) desc = desc.replace(/\s*$/, "…");
      ctx.fillText(desc, descMaxX, rowMid);
      ctx.textAlign = "left";
    }

    // 행 구분 헤어라인.
    const lineY = y + rowH;
    ctx.strokeStyle = RULE_SOFT_C;
    ctx.lineWidth = Math.max(1, W * 0.001);
    ctx.beginPath();
    ctx.moveTo(marginX, lineY);
    ctx.lineTo(W - marginX, lineY);
    ctx.stroke();

    y = lineY;
  }
}

// 토큰 사용처 명시(트리쉐이킹/린트 안정).
export const POSTER_TOKENS = { INK, INK_SOFT, INK_MUTE, PAPER, SAGE };
