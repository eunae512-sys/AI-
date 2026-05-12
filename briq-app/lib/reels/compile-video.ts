// 업로드 사진 + 자막 → 9:16 webm/mp4 영상 합성
// Canvas 2D 로 프레임 그리고 MediaRecorder 로 인코딩 (클라이언트 사이드, 서버 불필요)

export type ReelPhoto = { url: string; caption: string };

// 트렌드 포맷별 영상 스타일 — 컷 길이/줌/패닝/페이드/자막 크기를 컨트롤
export type TrendStyle = {
  cutDurationMs: number;     // 컷당 지속 시간
  zoomIntensity: number;     // Ken Burns 줌 강도 (0.04 ~ 0.10)
  panIntensity: number;      // 좌우 패닝 강도 (0.010 ~ 0.025)
  fadeInRatio: number;       // 컷 시작 페이드인 비율 (0.08 ~ 0.30)
  captionFontScale: number;  // 자막 폰트 배율 (1.0 ~ 1.20)
  motionEasing?: "linear" | "ease-out" | "ease-in-out"; // 줌 곡선
};

// 트렌드 format 문자열 ("ASMR · 5컷", "타임랩스 · 6컷" 등) → TrendStyle
export function parseTrendStyle(format?: string): TrendStyle | null {
  if (!format) return null;
  const lower = format.toLowerCase();

  // ASMR · 디테일 — 천천히, 강한 줌, 큰 자막
  if (lower.includes("asmr") || lower.includes("디테일") || lower.includes("detail")) {
    return {
      cutDurationMs: 1500,
      zoomIntensity: 0.10,
      panIntensity: 0.012,
      fadeInRatio: 0.28,
      captionFontScale: 1.15,
      motionEasing: "ease-out",
    };
  }

  // 타임랩스 — 빠른 컷, 작은 줌, 스냅 페이드
  if (lower.includes("타임랩스") || lower.includes("timelapse")) {
    return {
      cutDurationMs: 700,
      zoomIntensity: 0.04,
      panIntensity: 0.008,
      fadeInRatio: 0.08,
      captionFontScale: 1.0,
      motionEasing: "linear",
    };
  }

  // 공간 · 공간 무드 — 시네마틱 패닝, 부드러운 페이드
  if (lower.includes("공간")) {
    return {
      cutDurationMs: 1400,
      zoomIntensity: 0.04,
      panIntensity: 0.025,
      fadeInRatio: 0.22,
      captionFontScale: 1.05,
      motionEasing: "ease-in-out",
    };
  }

  // 에디토리얼 · 룩북 — 빠른 컷, 안정적
  if (lower.includes("에디토리얼") || lower.includes("editorial") || lower.includes("lookbook") || lower.includes("룩북")) {
    return {
      cutDurationMs: 900,
      zoomIntensity: 0.05,
      panIntensity: 0.010,
      fadeInRatio: 0.12,
      captionFontScale: 1.0,
      motionEasing: "linear",
    };
  }

  // 포트레이트 — 느린 컷, 약한 줌
  if (lower.includes("포트레이트") || lower.includes("portrait")) {
    return {
      cutDurationMs: 1300,
      zoomIntensity: 0.03,
      panIntensity: 0.010,
      fadeInRatio: 0.25,
      captionFontScale: 1.05,
      motionEasing: "ease-in-out",
    };
  }

  // V-log — 자연스러운 디폴트
  if (lower.includes("v-log") || lower.includes("vlog")) {
    return {
      cutDurationMs: 1100,
      zoomIntensity: 0.05,
      panIntensity: 0.015,
      fadeInRatio: 0.18,
      captionFontScale: 1.0,
      motionEasing: "ease-out",
    };
  }

  // 변신/Before-After — 빠른 전환
  if (lower.includes("변신") || lower.includes("before")) {
    return {
      cutDurationMs: 1000,
      zoomIntensity: 0.06,
      panIntensity: 0.012,
      fadeInRatio: 0.10,
      captionFontScale: 1.05,
      motionEasing: "ease-out",
    };
  }

  return null;
}

const DEFAULT_STYLE: TrendStyle = {
  cutDurationMs: 1200,
  zoomIntensity: 0.06,
  panIntensity: 0.015,
  fadeInRatio: 0.18,
  captionFontScale: 1.0,
  motionEasing: "ease-out",
};

// 트렌드 스타일 → 사용자가 이해할 수 있는 한국어 라벨 4종
// 배너에 노출되는 "1.5초/컷 · 강한 줌 · 길게 페이드 · 큰 자막" 같은 구체 표현용
export type StyleSummary = {
  cutLabel: string;       // "1.5초/컷 · 느린 호흡"
  zoomLabel: string;      // "강한 줌 (Ken Burns)"
  fadeLabel: string;      // "길게 페이드 인"
  captionLabel: string;   // "큰 자막 (1.15×)"
  motionLabel: string;    // "Ease-Out (시작 빠름 · 끝 느림)"
};

export function describeTrendStyle(style: TrendStyle | null): StyleSummary {
  const s = style ?? DEFAULT_STYLE;

  // 컷 길이 — 800 미만은 빠름, 1300 이상은 느림
  const cutSec = (s.cutDurationMs / 1000).toFixed(1);
  const cutLabel =
    s.cutDurationMs < 800
      ? `${cutSec}초/컷 · 빠른 호흡`
      : s.cutDurationMs > 1300
        ? `${cutSec}초/컷 · 느린 호흡`
        : `${cutSec}초/컷 · 표준`;

  // 줌 — 0.05 미만 약함, 0.08 이상 강함
  const zoomLabel =
    s.zoomIntensity < 0.05
      ? "약한 줌 (정적)"
      : s.zoomIntensity > 0.08
        ? "강한 줌 (Ken Burns)"
        : "보통 줌";

  // 페이드 인 비율 — 0.15 미만 스냅, 0.22 이상 길게
  const fadeLabel =
    s.fadeInRatio < 0.15
      ? "스냅 페이드"
      : s.fadeInRatio > 0.22
        ? "길게 페이드 인"
        : "보통 페이드";

  // 자막 크기
  const captionLabel =
    s.captionFontScale > 1.1
      ? `큰 자막 (${s.captionFontScale.toFixed(2)}×)`
      : s.captionFontScale < 1.0
        ? `작은 자막 (${s.captionFontScale.toFixed(2)}×)`
        : "표준 자막";

  // 모션 easing
  const motionLabel =
    s.motionEasing === "linear"
      ? "Linear (균일 모션)"
      : s.motionEasing === "ease-in-out"
        ? "Ease-In-Out (부드럽게)"
        : "Ease-Out (시작 빠름)";

  return { cutLabel, zoomLabel, fadeLabel, captionLabel, motionLabel };
}

export type CompileOptions = {
  photos: ReelPhoto[];
  cutDurationMs?: number; // default 1200ms (인스타 릴스 평균 컷 속도) — style 이 있으면 무시됨
  width?: number; // default 720 (HD 9:16)
  height?: number; // default 1280
  fps?: number; // default 30
  brand: {
    name: string;
    letter: string;
    gradient?: string;
    palette?: string[]; // 사용자 브랜드 추출 컬러 (≥3개 권장) — 하단 tonal strip + 색감 보정에 사용
  };
  fontFamily?: string;
  serifFontFamily?: string; // 매거진 톤 자막용 (Cormorant Garamond / Nanum Myeongjo)
  style?: TrendStyle; // 적용된 트렌드 스타일 (없으면 DEFAULT_STYLE)
  // 선택 — 합성할 BGM 오디오 URL (blob:, data:, https:). 로드 실패 시 무음으로 진행.
  audioUrl?: string;
  audioVolume?: number; // 0..1, default 0.8
  onProgress?: (progress: number) => void;
};

export type CompileResult = {
  blob: Blob;
  url: string; // ObjectURL — 사용 후 URL.revokeObjectURL 필수
  mimeType: string;
  durationMs: number;
};

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "video/mp4;codecs=avc1.42E01E",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const t of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch {
      // 무시
    }
  }
  return "";
}

export function isCompileSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  if (typeof HTMLCanvasElement === "undefined") return false;
  const canvas = document.createElement("canvas");
  if (typeof canvas.captureStream !== "function") return false;
  return !!pickMimeType();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // crossOrigin 은 dataURL 에는 영향 없고, 원격 URL 에는 필요
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src.slice(0, 60)}`));
    img.src = src;
  });
}

// 한글/영문 혼합 캡션 줄바꿈 — \n 우선, 길면 문자 단위 wrap
function wrapKoreanText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const ch of para) {
      const test = current + ch;
      if (ctx.measureText(test).width > maxWidth && current.length > 0) {
        lines.push(current);
        current = ch;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export async function compileReelsVideo(opts: CompileOptions): Promise<CompileResult> {
  const {
    photos,
    width = 720,
    height = 1280,
    fps = 30,
    brand,
    fontFamily = '"Pretendard Variable", system-ui, -apple-system, sans-serif',
    serifFontFamily = '"Cormorant Garamond", "Nanum Myeongjo", "Times New Roman", serif',
    style,
    onProgress,
  } = opts;
  // 스타일 우선순위: opts.style > opts.cutDurationMs (legacy) > DEFAULT_STYLE
  const activeStyle: TrendStyle = style ?? {
    ...DEFAULT_STYLE,
    cutDurationMs: opts.cutDurationMs ?? DEFAULT_STYLE.cutDurationMs,
  };
  const cutDurationMs = activeStyle.cutDurationMs;

  if (photos.length === 0) throw new Error("사진이 없습니다");

  const mimeType = pickMimeType();
  if (!mimeType) throw new Error("이 브라우저는 MediaRecorder를 지원하지 않습니다");

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D context 를 가져올 수 없습니다");

  // 모든 이미지 미리 로드 (병렬, 일부 실패해도 진행)
  const loaded = await Promise.all(
    photos.map((p) =>
      loadImage(p.url)
        .then((img) => ({ img, photo: p }))
        .catch(() => null),
    ),
  );
  const validPairs = loaded.filter(
    (x): x is { img: HTMLImageElement; photo: ReelPhoto } => x !== null,
  );
  if (validPairs.length === 0) throw new Error("로드 가능한 사진이 없습니다");

  const images = validPairs.map((p) => p.img);
  const validPhotos = validPairs.map((p) => p.photo);
  // 이후 모든 인덱스 접근은 validPhotos / images 짝이 보장됨
  photos.length = 0;
  photos.push(...validPhotos);

  // 첫 프레임 그려두기 (recorder 시작 전 검은 화면 방지)
  drawFrame(ctx, width, height, images[0], photos[0], 0, brand, fontFamily, serifFontFamily, activeStyle, 0, photos.length);

  const videoStream = canvas.captureStream(fps);

  // 옵션 BGM 합성 — Web Audio MediaStreamDestination 으로 오디오 트랙 추가
  let audioCtx: AudioContext | null = null;
  let audioEl: HTMLAudioElement | null = null;
  let combinedStream: MediaStream = videoStream;
  if (opts.audioUrl) {
    try {
      audioEl = new Audio(opts.audioUrl);
      audioEl.crossOrigin = "anonymous";
      audioEl.loop = true;
      audioEl.volume = Math.max(0, Math.min(1, opts.audioVolume ?? 0.8));
      // 오디오 메타 로드 대기 (URL 검증)
      await new Promise<void>((resolve, reject) => {
        audioEl!.addEventListener("loadedmetadata", () => resolve(), { once: true });
        audioEl!.addEventListener("error", () => reject(new Error("audio load error")), { once: true });
        // 안전 타임아웃 3초
        setTimeout(() => resolve(), 3000);
      });
      const AC: typeof AudioContext =
        (window as any).AudioContext ?? (window as any).webkitAudioContext;
      audioCtx = new AC();
      const source = audioCtx.createMediaElementSource(audioEl);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      // destination 에도 연결 (선택 — 녹화 중에도 들리게)
      // 미리듣기 방지를 위해 마스터 출력은 생략
      combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);
    } catch (e) {
      // 오디오 합성 실패 시 무음으로 진행
      console.warn("[compile-video] audio mixing failed:", (e as Error).message);
      audioCtx?.close();
      audioCtx = null;
      audioEl = null;
      combinedStream = videoStream;
    }
  }

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 3_500_000, // 720p 에 적정 (file size ↓, encode ↑)
    audioBitsPerSecond: 128_000,
  });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const totalDurationMs = photos.length * cutDurationMs;

  const cleanupAudio = () => {
    try {
      audioEl?.pause();
    } catch {
      // 무시
    }
    try {
      audioCtx?.close();
    } catch {
      // 무시
    }
  };

  const finished = new Promise<CompileResult>((resolve, reject) => {
    recorder.onstop = () => {
      cleanupAudio();
      const blob = new Blob(chunks, { type: mimeType });
      resolve({
        blob,
        url: URL.createObjectURL(blob),
        mimeType,
        durationMs: totalDurationMs,
      });
    };
    recorder.onerror = (ev) => {
      cleanupAudio();
      reject(new Error(`MediaRecorder 오류: ${String(ev)}`));
    };
  });

  // 오디오 재생 시작 — 녹화와 동기
  if (audioEl) {
    try {
      // 일부 환경에서 first-play 가 막힐 수 있음 — silently 진행
      await audioEl.play();
    } catch (e) {
      console.warn("[compile-video] audio play blocked:", (e as Error).message);
    }
  }

  recorder.start(200);

  const startTime = performance.now();
  let rafId = 0;

  const tick = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / totalDurationMs, 1);
    onProgress?.(progress);

    if (elapsed >= totalDurationMs) {
      // 마지막 프레임 한 번 더 그리고 stop
      const lastIdx = Math.max(0, Math.min(photos.length, images.length) - 1);
      drawFrame(ctx, width, height, images[lastIdx], photos[lastIdx], 1, brand, fontFamily, serifFontFamily, activeStyle, lastIdx, photos.length);
      try {
        recorder.requestData?.();
      } catch {
        // 무시
      }
      // 짧게 flush 후 stop
      setTimeout(() => recorder.stop(), 60);
      return;
    }

    // cutIdx 는 photos + images 둘 다 범위 안에 있도록 안전 클램프
    const maxIdx = Math.max(0, Math.min(photos.length, images.length) - 1);
    const cutIdx = Math.max(0, Math.min(Math.floor(elapsed / cutDurationMs), maxIdx));
    const cutProgress = (elapsed % cutDurationMs) / cutDurationMs;
    drawFrame(ctx, width, height, images[cutIdx], photos[cutIdx], cutProgress, brand, fontFamily, serifFontFamily, activeStyle, cutIdx, photos.length);

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  try {
    return await finished;
  } finally {
    cancelAnimationFrame(rafId);
    combinedStream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
  }
}

// 매거진 톤 컴파일러 — 시네마틱 vignette + serif italic 후크 + palette tonal strip + frame counter
function drawFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  img: HTMLImageElement | undefined,
  photo: ReelPhoto | undefined,
  cutProgress: number,
  brand: { name: string; letter: string; gradient?: string; palette?: string[] },
  fontFamily: string,
  serifFontFamily: string,
  style: TrendStyle,
  cutIdx: number,
  totalCuts: number,
) {
  // 배경 검정 — 항상 먼저 칠함
  ctx.fillStyle = "#0a0a0b";
  ctx.fillRect(0, 0, width, height);

  if (!img || !img.width || !img.height || !photo) {
    return;
  }

  // Ken Burns 모션
  const easedProgress = applyEasing(cutProgress, style.motionEasing ?? "ease-out");
  const zoom = 1 + style.zoomIntensity * easedProgress;
  const panX = Math.sin(cutProgress * Math.PI) * width * style.panIntensity;

  // object-cover crop
  const imgRatio = img.width / img.height;
  const canvasRatio = width / height;
  let drawW: number, drawH: number, drawX: number, drawY: number;
  if (imgRatio > canvasRatio) {
    drawH = height;
    drawW = height * imgRatio;
    drawX = (width - drawW) / 2;
    drawY = 0;
  } else {
    drawW = width;
    drawH = width / imgRatio;
    drawX = 0;
    drawY = (height - drawH) / 2;
  }

  ctx.save();
  ctx.translate(width / 2 + panX, height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-width / 2, -height / 2);
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();

  // 컷 시작 페이드인
  if (cutProgress < style.fadeInRatio) {
    const alpha = 1 - cutProgress / style.fadeInRatio;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.55})`;
    ctx.fillRect(0, 0, width, height);
  }

  const sizeScale = width / 720;

  // ── 시네마틱 vignette — 4코너 살짝 어둡게 (필름 톤) ──
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.4,
    width / 2, height / 2, Math.max(width, height) * 0.7,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // ── 하단 그라디언트 (캡션 가독성) — 더 짙고 우아하게 ──
  const grad = ctx.createLinearGradient(0, height * 0.45, 0, height);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.35)");
  grad.addColorStop(1, "rgba(0,0,0,0.82)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // ── 상단 그라디언트 (브랜드 라벨 가독성) — 미세 ──
  const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.16);
  topGrad.addColorStop(0, "rgba(0,0,0,0.42)");
  topGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, height * 0.18);

  // ── ① 상단 브랜드 라벨 — uppercase tracking + 하단 hairline underline (매거진 헤더 스타일) ──
  {
    const label = brand.name.toUpperCase();
    const labelPx = Math.round(15 * sizeScale);
    ctx.font = `500 ${labelPx}px ${fontFamily}`;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 4;
    // letter-spacing 흉내 — 한 글자씩 그려서 간격 추가 (tracking 0.18em)
    const tracking = labelPx * 0.18;
    const x0 = 42 * sizeScale;
    const y0 = 56 * sizeScale;
    let cx = x0;
    for (const ch of label) {
      ctx.fillText(ch, cx, y0);
      cx += ctx.measureText(ch).width + tracking;
    }
    ctx.shadowBlur = 0;
    // hairline underline
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(x0, y0 + labelPx + 6 * sizeScale, Math.min(cx - x0, width * 0.55), Math.max(1, sizeScale));
  }

  // ── ② 우상단 컷 인디케이터 — "01 / 08" (시네마틱 frame counter) ──
  {
    const counterPx = Math.round(13 * sizeScale);
    ctx.font = `500 ${counterPx}px ${fontFamily}`;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    const txt = `${String(cutIdx + 1).padStart(2, "0")} / ${String(totalCuts).padStart(2, "0")}`;
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 4;
    ctx.fillText(txt, width - 42 * sizeScale, 56 * sizeScale);
    ctx.shadowBlur = 0;
  }

  // ── ③ 자막 (하단) — 매거진 톤
  //    한 줄짜리 짧은 후크 = serif italic (큰 사이즈)
  //    여러 줄 / 긴 카피 = sans 중간 사이즈
  //    공통: hairline strip 위에 살짝 떠 있는 카피 ──
  const caption = photo.caption || "";
  if (caption) {
    const captionEnter = Math.min(1, cutProgress / Math.max(0.001, style.fadeInRatio));
    const slideY = (1 - captionEnter) * 22 * sizeScale;
    const captionAlpha = captionEnter;

    const isShortHook = caption.length <= 18 && !caption.includes("\n");
    const useSerif = isShortHook;

    const baseCaptionPx = useSerif
      ? 64 * style.captionFontScale  // serif 큰 후크
      : 40 * style.captionFontScale; // sans 중간 본문

    const fontDecl = useSerif
      ? `italic 500 ${Math.round(baseCaptionPx * sizeScale)}px ${serifFontFamily}`
      : `500 ${Math.round(baseCaptionPx * sizeScale)}px ${fontFamily}`;

    ctx.font = fontDecl;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    const maxWidth = width * 0.82;
    const lineHeight = (baseCaptionPx + (useSerif ? 8 : 10)) * sizeScale;
    const lines = wrapKoreanText(ctx, caption, maxWidth);
    const totalTextHeight = lines.length * lineHeight;
    // 자막 위치: 하단 18% 라인 위 (palette strip 와 안 겹치게)
    const baseY = height * 0.83 - totalTextHeight / 2 + lineHeight + slideY;

    // hairline strip — 카피 위에 작은 가로선 (매거진 디바이더)
    ctx.fillStyle = `rgba(255, 255, 255, ${captionAlpha * 0.55})`;
    ctx.fillRect(width / 2 - 18 * sizeScale, baseY - lineHeight - 16 * sizeScale, 36 * sizeScale, Math.max(1, sizeScale));

    // 카피 자체 — 옅은 그림자 (drop-shadow 보다 부드럽게)
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 14 * sizeScale;
    ctx.fillStyle = `rgba(255, 255, 255, ${captionAlpha})`;
    lines.forEach((line, i) => {
      ctx.fillText(line, width / 2, baseY + i * lineHeight);
    });
    ctx.shadowBlur = 0;
  }

  // ── ④ 최하단 palette tonal strip — 브랜드 추출 컬러 (≥1개) 노출 ──
  if (brand.palette && brand.palette.length > 0) {
    const stripH = Math.max(3, 4 * sizeScale);
    const stripY = height - stripH;
    const swatchCount = Math.min(brand.palette.length, 8);
    const swatchW = width / swatchCount;
    for (let i = 0; i < swatchCount; i++) {
      ctx.fillStyle = brand.palette[i];
      ctx.fillRect(i * swatchW, stripY, swatchW + 1, stripH);
    }
  }
}

// easing 함수 — Ken Burns 줌에 적용
function applyEasing(t: number, easing: "linear" | "ease-out" | "ease-in-out"): number {
  if (easing === "linear") return t;
  if (easing === "ease-out") return 1 - Math.pow(1 - t, 2); // 시작 빠름, 끝 느림
  // ease-in-out
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
