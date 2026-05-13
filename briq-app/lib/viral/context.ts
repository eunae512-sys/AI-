// 시간/계절/요일/날씨 → viral 카피 톤 자동 변화
// 비 오는 밤 = 감성, 주말 점심 = 방문 유도, 여름 = 시원함, 겨울 = 따뜻함

export type Season = "spring" | "summer" | "fall" | "winter";
export type DaySlot = "morning" | "lunch" | "afternoon" | "evening" | "night" | "lateNight";
export type WeekSlot = "weekday" | "weekend" | "monFatigue" | "fridayHype";

export type GenContext = {
  date: Date;
  season: Season;
  daySlot: DaySlot;
  weekSlot: WeekSlot;
  // 일기예보 데이터 미연동 — 비/눈은 사용자가 명시한 themeKeyword 로만 활성
  // 향후 OpenWeatherMap 연동 가능
  vibes: string[]; // ["저녁", "주말", "여름밤"] — Hook/Mid 에 자연스럽게 첨가
};

export function getContext(date: Date = new Date()): GenContext {
  const m = date.getMonth() + 1;
  const h = date.getHours();
  const d = date.getDay(); // 0=Sun

  const season: Season =
    m >= 3 && m <= 5 ? "spring" :
    m >= 6 && m <= 8 ? "summer" :
    m >= 9 && m <= 11 ? "fall" : "winter";

  const daySlot: DaySlot =
    h < 6 ? "lateNight" :
    h < 11 ? "morning" :
    h < 14 ? "lunch" :
    h < 18 ? "afternoon" :
    h < 22 ? "evening" : "night";

  const weekSlot: WeekSlot =
    d === 0 || d === 6 ? "weekend" :
    d === 1 ? "monFatigue" :
    d === 5 ? "fridayHype" : "weekday";

  // 자연스러운 컨텍스트 태그 모음 — Hook 슬롯·해시태그에 활용
  const vibes: string[] = [];
  if (daySlot === "morning") vibes.push("주말 오전", "아침 산책길");
  if (daySlot === "lunch") vibes.push("점심");
  if (daySlot === "afternoon" && weekSlot === "weekend") vibes.push("주말 오후");
  if (daySlot === "evening") vibes.push("저녁");
  if (daySlot === "night" || daySlot === "lateNight") vibes.push("밤", "야경");
  if (weekSlot === "weekend") vibes.push("주말");
  if (weekSlot === "fridayHype") vibes.push("불금", "금요일 저녁");
  if (weekSlot === "monFatigue") vibes.push("월요일", "쉬는 카페");
  if (season === "spring") vibes.push("봄", "봄 산책");
  if (season === "summer") vibes.push("여름", "휴가", "시원한");
  if (season === "fall") vibes.push("가을", "단풍");
  if (season === "winter") vibes.push("겨울", "따뜻한");

  return { date, season, daySlot, weekSlot, vibes };
}

// 컨텍스트별 추천 톤 (Hook/Caption 분위기 가이드)
export type ContextualMood =
  | "cozy-night"     // 따뜻·고즈넉·야경
  | "weekend-visit"  // 방문 유도 강함
  | "summer-cool"    // 시원함·휴가
  | "rainy-vibe"     // 비 오는 날 (themeKeyword 가 비 관련일 때)
  | "energetic"      // 활기·트렌디
  | "calm-morning"   // 차분·아침
  | "standard";

export function inferContextualMood(ctx: GenContext, themeKeyword?: string): ContextualMood {
  const kw = (themeKeyword ?? "").toLowerCase();
  if (kw.includes("비") || kw.includes("장마") || kw.includes("rain")) return "rainy-vibe";
  if (kw.includes("야경") || kw.includes("밤") || ctx.daySlot === "night") return "cozy-night";
  if (kw.includes("여름") || ctx.season === "summer") return "summer-cool";
  if (ctx.daySlot === "morning") return "calm-morning";
  if (ctx.weekSlot === "weekend") return "weekend-visit";
  if (ctx.weekSlot === "fridayHype") return "energetic";
  return "standard";
}

// 컨텍스트 → 추가 해시태그 (viral 톤)
export function contextualHashtags(ctx: GenContext): string[] {
  const tags: string[] = [];
  if (ctx.weekSlot === "weekend") tags.push("주말데이트", "주말여행");
  if (ctx.weekSlot === "fridayHype") tags.push("불금", "금요일");
  if (ctx.daySlot === "night") tags.push("야경맛집", "감성야경");
  if (ctx.daySlot === "morning") tags.push("주말오전", "모닝카페");
  if (ctx.daySlot === "lunch") tags.push("오늘점심");
  if (ctx.season === "summer") tags.push("여름맛집", "여름휴가");
  if (ctx.season === "fall") tags.push("가을여행", "가을감성");
  if (ctx.season === "winter") tags.push("겨울맛집", "따뜻한");
  if (ctx.season === "spring") tags.push("봄나들이", "봄감성");
  return tags;
}

// 컨텍스트별 hook prefix (자연스럽게 첫 줄 앞에 붙이는 선택지)
export function contextualHookPrefix(mood: ContextualMood): string[] {
  switch (mood) {
    case "rainy-vibe":
      return ["비 오는 날 가면", "오늘 같은 날", "빗소리 듣고 싶을 때"];
    case "cozy-night":
      return ["밤에 가야 진가", "저녁 늦게 갈 때", "퇴근 후"];
    case "summer-cool":
      return ["이 더위에", "여름엔 여기", "시원한 거 먹고 싶을 때"];
    case "calm-morning":
      return ["주말 오전에", "아침에 일어나서", "차분한 아침"];
    case "weekend-visit":
      return ["이번 주말에", "주말 데이트", "주말 잠깐 외출"];
    case "energetic":
      return ["오늘 같은 금요일", "퇴근하고 바로", "주말 시작 전"];
    case "standard":
    default:
      return [];
  }
}
