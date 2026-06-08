// 현재 시기(KST) 기준 시즌 컨텍스트. 블로그 추천 주제가 계절에 맞게 자동 변경되도록 한다.
// 순수함수·결정론: 같은 now 입력이면 항상 같은 출력. 서버/클라 무관하게 KST(UTC+9)로 계산.

export type SeasonKey = "spring" | "summer" | "autumn" | "winter";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const SEASON_LABEL: Record<SeasonKey, string> = {
  spring: "봄",
  summer: "여름",
  autumn: "가을",
  winter: "겨울",
};

// 월(1~12) → 시즌. 3~5 봄 / 6~8 여름 / 9~11 가을 / 12·1·2 겨울.
function monthToSeason(month: number): SeasonKey {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter"; // 12, 1, 2
}

export interface SeasonContext {
  month: number;        // 1~12 (KST)
  seasonKey: SeasonKey;
  seasonLabel: string;  // 한글: 봄/여름/가을/겨울
  monthLabel: string;   // "N월"
}

/**
 * 현재(또는 주입한 now)의 KST 월/계절 컨텍스트를 반환.
 * @param now 테스트용 주입. 미지정 시 현재 시각.
 */
export function getSeasonContext(now?: Date): SeasonContext {
  const baseMs = (now ?? new Date()).getTime();
  // UTC ms + 9h → 해당 시각의 KST 벽시계를 UTC 메서드로 읽는다(로컬 타임존 영향 제거).
  const kst = new Date(baseMs + KST_OFFSET_MS);
  const month = kst.getUTCMonth() + 1; // 1~12
  const seasonKey = monthToSeason(month);
  return {
    month,
    seasonKey,
    seasonLabel: SEASON_LABEL[seasonKey],
    monthLabel: `${month}월`,
  };
}
