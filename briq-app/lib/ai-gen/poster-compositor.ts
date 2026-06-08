// AI 포스터 이미지 + 한글 텍스트 오버레이 → 단일 PNG 합성 (canvas).
//
// AI(Nano Banana 등)는 한글을 깨지게 렌더링하므로, 프롬프트는 글자 없이
// 비주얼만 변환해 빈 여백을 남긴다(poster-templates.ts). 이 모듈이 그 여백 위에
// *정확한* 한글 텍스트(가게명·메뉴·부제)를 디자인 폰트로 얹어 합성한다.
// (카드뉴스/워터마크의 image+text canvas 철학 재사용 — watermark.ts 패턴.)
//
// 철칙: 한글은 명조(Nanum Myeongjo) upright — italic 절대 금지.
//   손글씨(handwriting) 옵션은 라틴/숫자 제목에만 이탤릭 느낌, 한글 제목은 명조 유지.
// 정직성(CLAUDE.md #7): title/subtitle 은 사용자 입력/브랜드 실데이터만.
//   가짜 수치·없는 정보는 만들지 않는다.

import type { TextZone } from "@/lib/ai-gen/poster-templates";
import { INK, PAPER } from "@/lib/landing/tokens";

export type ComposePosterOpts = {
  /** AI 결과 이미지(워터마크 적용 전, data URL 또는 URL) */
  imageSrc: string;
  /** 제목(가게명/시그니처 메뉴) — 한글 명조 upright */
  title?: string;
  /** 부제(한 줄 소개/태그라인) */
  subtitle?: string;
  /** 텍스트가 얹힐 빈 여백 위치(스타일의 textZone) */
  zone: TextZone;
  /** 손글씨 느낌 — 라틴/숫자에만 이탤릭(한글은 명조 유지) */
  handwriting?: boolean;
  /** 강조 색상(헤어라인 룰 등) — 미지정 시 SAGE 폴백은 호출부 책임. 여기선 텍스트=INK */
  accentColor?: string;
};

const SERIF_HANGUL_STACK =
  "'Nanum Myeongjo', 'Cormorant Garamond', 'Apple SD Gothic Neo', serif";

/** 폰트를 미리 로드(실패/타임아웃 시 Pretendard 폴백으로도 그릴 수 있게). */
async function ensureFonts(px: number): Promise<void> {
  const docFonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!docFonts?.load) return;
  const specs = [
    `700 ${px}px 'Nanum Myeongjo'`,
    `400 ${Math.round(px * 0.5)}px 'Pretendard'`,
  ];
  try {
    await Promise.race([
      Promise.all(specs.map((s) => docFonts.load(s))),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch {
    // 폴백 — 폰트 로드 실패해도 시스템 명조/Pretendard 로 그린다.
  }
}

/** 한글이 포함됐는지 — true 면 italic 금지(철칙). */
function hasHangul(s: string): boolean {
  return /[가-힣ᄀ-ᇿ㄰-㆏]/.test(s);
}

/** keep-all 줄바꿈: 단어(공백) 단위로만 끊고, 한글 음절 중간은 끊지 않는다. */
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

/**
 * AI 포스터 이미지 위에 제목/부제를 합성해 단일 PNG(data URL) 반환.
 * 텍스트가 비어 있으면 이미지 그대로 PNG 로 반환(워터마크는 호출부에서 별도 적용).
 */
export async function composePoster(opts: ComposePosterOpts): Promise<string> {
  const { imageSrc, title, subtitle, zone, handwriting, accentColor } = opts;
  const t = (title ?? "").trim();
  const s = (subtitle ?? "").trim();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => reject(new Error("이미지 로드 실패"));
    img.onload = () => {
      void (async () => {
        try {
          const canvas = document.createElement("canvas");
          const W = (canvas.width = img.naturalWidth || 1024);
          const H = (canvas.height = img.naturalHeight || 1536);
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context 생성 실패"));
            return;
          }
          ctx.drawImage(img, 0, 0, W, H);

          // 텍스트 없으면 이미지만 PNG.
          if (!t && !s) {
            resolve(canvas.toDataURL("image/png"));
            return;
          }

          const titlePx = Math.round(W * 0.082);
          const subPx = Math.round(W * 0.038);
          await ensureFonts(titlePx);

          const padX = Math.round(W * 0.08);
          const maxTextW = W - padX * 2;

          // 줄 계산.
          const titleHangul = hasHangul(t);
          const titleItalic = handwriting && !titleHangul ? "italic " : "";
          ctx.font = `${titleItalic}700 ${titlePx}px ${SERIF_HANGUL_STACK}`;
          const titleLines = t ? wrapKeepAll(ctx, t, maxTextW) : [];
          ctx.font = `400 ${subPx}px 'Pretendard', 'Apple SD Gothic Neo', sans-serif`;
          const subLines = s ? wrapKeepAll(ctx, s, maxTextW) : [];

          const titleLH = titlePx * 1.18;
          const subLH = subPx * 1.4;
          const gap = titleLines.length && subLines.length ? subPx * 0.7 : 0;
          const blockH =
            titleLines.length * titleLH + subLines.length * subLH + gap;

          // zone → 블록 상단 y.
          const margin = Math.round(H * 0.055);
          let blockTop: number;
          if (zone === "top") {
            blockTop = margin;
          } else if (zone === "bottom") {
            blockTop = H - margin - blockH;
          } else {
            // lower-third: 아래 1/3 영역 상단부에 배치.
            blockTop = H * 0.66 + (H * 0.34 - blockH) / 2 - margin * 0.2;
            if (blockTop + blockH > H - margin) blockTop = H - margin - blockH;
          }

          // 가독 스크림 — 사진 위(top/bottom/lower-third 모두 사진 영역일 수 있음).
          // 명조/페이퍼 박스를 텍스트 뒤에 얇게 깔아 흰 여백·사진 양쪽에서 안전.
          const boxPadY = Math.round(H * 0.022);
          const boxTop = Math.max(0, blockTop - boxPadY);
          const boxH = Math.min(H - boxTop, blockH + boxPadY * 2);
          // 사진 위 텍스트 대비를 위해 PAPER 반투명 밴드(잉크 텍스트와 함께 종이 결 유지).
          const grad = ctx.createLinearGradient(0, boxTop, 0, boxTop + boxH);
          const paperRGBA = (a: number) => {
            // PAPER #FAF7EE → rgba
            return `rgba(250,247,238,${a})`;
          };
          grad.addColorStop(0, paperRGBA(0));
          grad.addColorStop(0.15, paperRGBA(0.86));
          grad.addColorStop(0.85, paperRGBA(0.86));
          grad.addColorStop(1, paperRGBA(0));
          ctx.fillStyle = grad;
          ctx.fillRect(0, boxTop, W, boxH);

          // 강조 룰(헤어라인) — accentColor 있으면 그 색, 없으면 잉크 12%.
          const ruleColor = accentColor?.trim() ? accentColor.trim() : INK;
          ctx.globalAlpha = accentColor?.trim() ? 0.9 : 0.18;
          ctx.fillStyle = ruleColor;
          const ruleW = Math.round(W * 0.16);
          ctx.fillRect(padX, blockTop - boxPadY * 0.4, ruleW, Math.max(2, W * 0.004));
          ctx.globalAlpha = 1;

          // 텍스트 그리기 — 좌측 정렬, 잉크.
          ctx.textBaseline = "top";
          ctx.textAlign = "left";
          let y = blockTop;

          ctx.fillStyle = INK;
          ctx.font = `${titleItalic}700 ${titlePx}px ${SERIF_HANGUL_STACK}`;
          for (const line of titleLines) {
            ctx.fillText(line, padX, y);
            y += titleLH;
          }
          if (titleLines.length && subLines.length) y += gap;

          ctx.fillStyle = "#4A4742"; // INK_SOFT
          ctx.font = `400 ${subPx}px 'Pretendard', 'Apple SD Gothic Neo', sans-serif`;
          for (const line of subLines) {
            ctx.fillText(line, padX, y);
            y += subLH;
          }

          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          reject(e as Error);
        }
      })();
    };
    img.src = imageSrc;
  });
}

// PAPER 토큰 사용처 명시(트리쉐이킹/린트 안정) — 위 인라인 rgba 와 동일 값.
export const POSTER_PAPER = PAPER;
