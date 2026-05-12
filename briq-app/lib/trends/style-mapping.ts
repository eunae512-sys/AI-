// 인기 릴스 스타일 → AI BGM 무드 + AI 출연자 씬 자동 매핑
// 사용자가 popular reel 카드를 클릭하면 음악·이미지 생성에도 그 스타일이 전파됨

import type { MusicMood } from "@/lib/ai-gen/music-presets";
import type { SceneRole } from "@/lib/ai-gen/model-scenes";

export type StyleSuggestion = {
  musicMood: MusicMood;
  musicMoodLabel: string;
  sceneRole: SceneRole;
  sceneRoleLabel: string;
  // 카테고리 라벨 — 카드에 표시 (가짜 saveDelta 대체)
  categoryLabel: string;
};

// title/format 키워드 → MusicMood
function suggestMusicMood(title: string, format: string): MusicMood {
  const k = `${title} ${format}`.toLowerCase();

  // 디테일/ASMR/매크로 → 잔잔
  if (k.includes("asmr") || k.includes("디테일") || k.includes("detail") || k.includes("플랫")) {
    return "lofi-chill";
  }
  // 타임랩스/오픈/푸어오버 같이 동작감 — 인디 밝음
  if (k.includes("타임랩스") || k.includes("오픈") || k.includes("푸어") || k.includes("3분")) {
    return "indie-bright";
  }
  // 공간/마당/저녁/한옥/스테이/숙소 — 따뜻한 어쿠스틱
  if (
    k.includes("공간") ||
    k.includes("마당") ||
    k.includes("한옥") ||
    k.includes("저녁") ||
    k.includes("아침")
  ) {
    return "warm-acoustic";
  }
  // 촛불·차·온돌·새벽 — 앰비언트
  if (
    k.includes("촛불") ||
    k.includes("차 한") ||
    k.includes("온돌") ||
    k.includes("새벽") ||
    k.includes("이불") ||
    k.includes("티")
  ) {
    return "ambient-spa";
  }
  // 에디토리얼·룩북·쇼룸·스튜디오 — 시티팝
  if (
    k.includes("에디토리얼") ||
    k.includes("editorial") ||
    k.includes("룩북") ||
    k.includes("lookbook") ||
    k.includes("쇼룸") ||
    k.includes("스튜디오") ||
    k.includes("아틀리에")
  ) {
    return "city-pop";
  }
  // 포트레이트·결·컬러·스타일링 — 발라드
  if (
    k.includes("포트레이트") ||
    k.includes("결") ||
    k.includes("스타일링") ||
    k.includes("기념")
  ) {
    return "ballad-emo";
  }
  // 도구·재료·빗질·플레이팅 — 따뜻한 어쿠스틱 (기본 톤)
  return "warm-acoustic";
}

const MUSIC_LABEL: Record<MusicMood, string> = {
  "warm-acoustic": "따뜻한 어쿠스틱",
  "lofi-chill": "로파이 잔잔",
  "indie-bright": "인디 산뜻함",
  "ballad-emo": "감성 발라드",
  "city-pop": "시티팝",
  "kpop-energy": "K-Pop 활기",
  "rock-edge": "록 강렬함",
  "ambient-spa": "앰비언트 스파",
};

// title/format → SceneRole
function suggestSceneRole(title: string, format: string): SceneRole {
  const k = `${title} ${format}`.toLowerCase();

  // 디테일 컷 — 손·재료·도구 → 직원/작업 (staff)
  if (
    k.includes("디테일") ||
    k.includes("손") ||
    k.includes("재료") ||
    k.includes("플레이팅") ||
    k.includes("라떼") ||
    k.includes("푸어") ||
    k.includes("빗질") ||
    k.includes("도구") ||
    k.includes("케어") ||
    k.includes("드리즐") ||
    k.includes("파우더") ||
    k.includes("원단")
  ) {
    return "staff";
  }
  // 공간 컷 — 인테리어·마당·쇼룸·살롱 → product (사람 없음, 공간)
  if (
    k.includes("공간") ||
    k.includes("마당") ||
    k.includes("쇼룸") ||
    k.includes("스튜디오") ||
    k.includes("창가") ||
    k.includes("아틀리에") ||
    k.includes("플랫")
  ) {
    return "product";
  }
  // 포트레이트·룩북·결 → 손님/모델
  if (
    k.includes("포트레이트") ||
    k.includes("룩북") ||
    k.includes("스타일링") ||
    k.includes("결")
  ) {
    return "customer";
  }
  // 디폴트 — 사장님
  return "owner";
}

const SCENE_LABEL: Record<SceneRole, string> = {
  owner: "사장님",
  staff: "직원·작업",
  customer: "손님",
  product: "제품·공간만",
};

// format ("ASMR · 5컷") → 카테고리만 추출 ("ASMR")
function extractCategory(format: string): string {
  const head = format.split("·")[0]?.trim() ?? format;
  return head || "에디토리얼";
}

export function suggestForWeeklyStyle(opts: { title: string; format: string }): StyleSuggestion {
  const musicMood = suggestMusicMood(opts.title, opts.format);
  const sceneRole = suggestSceneRole(opts.title, opts.format);
  return {
    musicMood,
    musicMoodLabel: MUSIC_LABEL[musicMood],
    sceneRole,
    sceneRoleLabel: SCENE_LABEL[sceneRole],
    categoryLabel: extractCategory(opts.format),
  };
}
