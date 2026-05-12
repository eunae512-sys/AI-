// KFTC (Dec 2025 시행) 의무 — AI 생성 콘텐츠 라벨 워터마크
// 이미지 우하단에 "AI 생성 콘텐츠" 28% opacity로 추가
// 클라이언트 사이드 Canvas 후처리 — 별도 서버 의존 없음

const WATERMARK_TEXT = "AI 생성 콘텐츠";

export type WatermarkOptions = {
  text?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  opacity?: number; // 0..1
  fontSize?: number; // px (이미지 너비에 비례해 자동 계산되지만 override 가능)
};

/**
 * 데이터 URL (또는 일반 URL) 이미지에 AI 생성 라벨 워터마크 적용
 * 반환: 워터마크 처리된 데이터 URL (PNG)
 */
export async function applyAiWatermark(
  imageSrc: string,
  opts: WatermarkOptions = {},
): Promise<string> {
  const {
    text = WATERMARK_TEXT,
    position = "bottom-right",
    opacity = 0.85,
  } = opts;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => reject(new Error("이미지 로드 실패"));
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context 생성 실패"));
          return;
        }

        ctx.drawImage(img, 0, 0);

        // 비례 폰트 크기 — 이미지 짧은 변 기준 2.4%
        const baseSize = Math.min(canvas.width, canvas.height) * 0.024;
        const fontSize = Math.max(14, Math.min(opts.fontSize ?? baseSize, 48));

        ctx.font = `600 ${fontSize}px "Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif`;
        ctx.textBaseline = "middle";

        const padX = fontSize * 0.9;
        const padY = fontSize * 0.55;
        const metrics = ctx.measureText(text);
        const textW = metrics.width;
        const textH = fontSize;
        const pillW = textW + padX * 2;
        const pillH = textH + padY * 2;
        const margin = Math.max(12, fontSize * 0.8);

        let x = 0;
        let y = 0;
        switch (position) {
          case "bottom-right":
            x = canvas.width - pillW - margin;
            y = canvas.height - pillH - margin;
            break;
          case "bottom-left":
            x = margin;
            y = canvas.height - pillH - margin;
            break;
          case "top-right":
            x = canvas.width - pillW - margin;
            y = margin;
            break;
          case "top-left":
            x = margin;
            y = margin;
            break;
        }

        // pill 배경 — 검정 반투명
        ctx.globalAlpha = opacity * 0.55;
        ctx.fillStyle = "#000";
        roundRect(ctx, x, y, pillW, pillH, pillH / 2);
        ctx.fill();

        // 작은 점 표시 (AI 라벨임을 강조)
        const dotR = fontSize * 0.18;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.fillStyle = "#a78bfa"; // violet-400 — AI 톤
        ctx.arc(x + padX * 0.55, y + pillH / 2, dotR, 0, Math.PI * 2);
        ctx.fill();

        // 텍스트 — 흰색 (점 옆에 한 번만)
        ctx.fillStyle = "#fff";
        ctx.fillText(text, x + padX * 0.55 + dotR + fontSize * 0.35, y + pillH / 2);

        ctx.globalAlpha = 1;
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(e as Error);
      }
    };
    img.src = imageSrc;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// 캡션에 AI 생성 해시태그 자동 추가
export function appendAiHashtag(caption: string): string {
  if (!caption) return "#AI생성";
  if (/#AI생성/.test(caption)) return caption;
  return `${caption.trim()}\n\n#AI생성`;
}

// 메타데이터 빌더 — publish-queue에 함께 저장하면 분석 페이지에서 추적 가능
export function buildAiMeta(scene?: {
  id?: string;
  title?: string;
  industry?: string;
  role?: string;
}) {
  return {
    aiGenerated: true,
    aiModel: "gpt-image-1",
    aiScene: scene,
    kftcLabelAttached: true,
    generatedAt: new Date().toISOString(),
  };
}
