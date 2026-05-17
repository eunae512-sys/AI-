// Quality Guardrails — 사양 §8
//
// AI 생성 결과물의 "AI 티" 를 차단하는 prompt 룰.
// positive (요구) + negative (금지) 양방향.

export type QualityGuardrails = {
  /** prompt 끝에 붙여서 자연스러움 강화 */
  positiveTail: string;
  /** negative prompt — 외부 모델에 별도 전달 */
  negative: string;
};

export function buildQualityGuardrails(): QualityGuardrails {
  return {
    positiveTail:
      "realistic smartphone photography, natural ambient lighting, imperfect human detail, subtle emotion, realistic soft shadow, shallow depth of field, influencer-grade framing, candid moment captured, real skin texture with pores",
    negative: [
      // 피부
      "plastic skin",
      "airbrushed skin",
      "porcelain skin",
      "doll-like skin",
      // 얼굴
      "over symmetrical face",
      "uncanny valley face",
      "AI-generated face artifact",
      "blurred face",
      "extra fingers",
      "extra limbs",
      "deformed hand",
      "AI hand artifact",
      "warped fingers",
      "fused fingers",
      // 표정
      "unrealistic smile",
      "frozen expression",
      "exaggerated smile",
      "wide unnatural grin",
      // 라이트·후처리
      "over sharpen",
      "fake HDR look",
      "oversaturated color",
      "neon glow",
      "over bokeh",
      "ring light reflection",
      // 스톡·광고티
      "stock photo look",
      "studio backdrop",
      "watermark",
      "text overlay",
      "logo overlay",
      "frame",
      "border",
      // 일반
      "low quality",
      "low resolution",
      "blurry",
      "noisy",
      "compression artifact",
      "jpeg artifact",
    ].join(", "),
  };
}

// ─────────────────────────────────────────────────────────────
// 결과 검사 (생성 후) — 후처리에서 "이건 AI 티 강함" 자동 플래깅
// 단순 휴리스틱 — 외부 검출기 (Hive, RealityDefender) 가 더 정확하지만 v1 stub
// ─────────────────────────────────────────────────────────────

export type QualityFlag = {
  kind:
    | "low-resolution"
    | "over-sharpen-suspect"
    | "high-saturation"
    | "frame-or-border-detected"
    | "watermark-detected";
  severity: "low" | "medium" | "high";
  note: string;
};

/**
 * 클라이언트에서 이미지 분석 후 의심 플래그 반환.
 * 캔버스에서 픽셀 통계 계산 — saturation 평균, contrast 분산, 보더 감지.
 */
export function flagQualityIssues(img: HTMLImageElement): QualityFlag[] {
  const flags: QualityFlag[] = [];
  try {
    const W = 64;
    const H = 64;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return flags;
    ctx.drawImage(img, 0, 0, W, H);
    let data: Uint8ClampedArray;
    try {
      data = ctx.getImageData(0, 0, W, H).data;
    } catch {
      return flags;
    }

    let satSum = 0;
    let lumSum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const sat = mx === 0 ? 0 : (mx - mn) / mx;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      satSum += sat;
      lumSum += lum;
      count++;
    }
    const avgSat = satSum / count;
    if (avgSat > 0.65) {
      flags.push({
        kind: "high-saturation",
        severity: "medium",
        note: `평균 채도 ${avgSat.toFixed(2)} — 자연스러운 사진치곤 강함. 광고티 의심.`,
      });
    }

    // 보더 감지 — 4 edge 의 평균 휘도가 매우 어둡거나 매우 밝으면 프레임 의심
    let edgeSumDark = 0;
    let edgeSumBright = 0;
    let edgeCount = 0;
    for (let x = 0; x < W; x++) {
      [0, H - 1].forEach((y) => {
        const i = (y * W + x) * 4;
        const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        if (lum < 30) edgeSumDark++;
        if (lum > 225) edgeSumBright++;
        edgeCount++;
      });
    }
    for (let y = 0; y < H; y++) {
      [0, W - 1].forEach((x) => {
        const i = (y * W + x) * 4;
        const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        if (lum < 30) edgeSumDark++;
        if (lum > 225) edgeSumBright++;
        edgeCount++;
      });
    }
    if (edgeSumDark / edgeCount > 0.85 || edgeSumBright / edgeCount > 0.85) {
      flags.push({
        kind: "frame-or-border-detected",
        severity: "medium",
        note: "이미지에 프레임/보더 의심 — 광고 템플릿 티.",
      });
    }
  } catch {
    // 무시
  }
  return flags;
}
