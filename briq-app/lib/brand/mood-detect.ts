// 사진 팔레트 → 브랜드 무드 자동 추론
//
// 온보딩에서 업로드한 사진의 추출 팔레트(명도·채도·색상)로
// 6개 무드(warm/modern/moody/playful/natural/luxury) 중 하나를 추천한다.
// "사진의 컨셉"이 무드를 결정하도록 — 사용자가 카드로 고른 무드보다 팔레트가 우선 추천.

import type { ExtractedColor } from "@/lib/colors/extract-palette";
import type { Mood } from "@/types";

/**
 * population(색 비중) 가중으로 평균 명도/채도와 따뜻한 색 비율을 구해 무드를 매핑.
 * 팔레트가 비면 안전 폴백 "warm".
 */
export function inferMoodFromPalette(palette: ExtractedColor[]): Mood {
  if (!palette || palette.length === 0) return "warm";

  let wsum = 0;
  let avgL = 0; // 평균 명도 (0-1)
  let avgS = 0; // 평균 채도 (0-1)
  let warmW = 0; // 따뜻한 색(레드~앰버) 가중 합

  for (const c of palette) {
    const w = c.population > 0 ? c.population : 1;
    const [h, s, l] = c.hsl;
    wsum += w;
    avgL += l * w;
    avgS += s * w;
    if (h <= 55 || h >= 340) warmW += w; // 빨강·주황·앰버 계열
  }
  if (wsum === 0) return "warm";
  avgL /= wsum;
  avgS /= wsum;
  const warmRatio = warmW / wsum;

  // 1) 어두운 팔레트 — 저채도면 럭셔리(절제·고급), 색감 있으면 무디(시네마틱)
  if (avgL < 0.30) return avgS < 0.22 ? "luxury" : "moody";

  // 2) 선명하고 밝음 — 플레이풀(비비드)
  if (avgS >= 0.55 && avgL >= 0.42) return "playful";

  // 3) 밝고 저채도 — 모던(미니멀·하이키)
  if (avgL >= 0.72 && avgS < 0.28) return "modern";

  // 4) 차분한 중간톤·저채도 — 내추럴(흙빛·뮤트)
  if (avgS < 0.32) return "natural";

  // 5) 따뜻한 색 우세 — 웜
  if (warmRatio >= 0.5) return "warm";

  // 6) 그 외 — 따뜻함 약하면 모던, 어느 정도면 웜
  return warmRatio >= 0.3 ? "warm" : "modern";
}
