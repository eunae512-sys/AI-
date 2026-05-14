// 직원 보고용 가짜 데이터 — "오늘 사장님 대신 일해놓은 결과"
//
// 톤 시스템:
//   같은 브랜드라도 컨셉에 따라 5가지 톤 중 선택 가능.
//   - editorial : 잡지 톤. 짧고 거리감 있게.
//   - minimal   : 사실만, 형용사 없이. 노션/애플 톤.
//   - warm-shop : 손님한테 말 거는 친근한 톤. (구 기본값)
//   - witty     : 가볍게, MZ 톤.
//   - premium   : 조용한 럭셔리. 영문 라벨 ok.

import type { Brand } from "@/types";

export type VoiceTone = "editorial" | "minimal" | "warm-shop" | "witty" | "premium";

export const TONE_LIST: VoiceTone[] = ["editorial", "minimal", "warm-shop", "witty", "premium"];

export const TONE_LABEL: Record<VoiceTone, string> = {
  editorial: "에디토리얼",
  minimal: "미니멀",
  "warm-shop": "친근한",
  witty: "위트",
  premium: "프리미엄",
};

export const TONE_HINT: Record<VoiceTone, string> = {
  editorial: "잡지처럼, 짧고 거리감",
  minimal: "사실만, 형용사 없이",
  "warm-shop": "손님한테 말 거는 톤",
  witty: "가볍게, 한 줄 농담",
  premium: "조용하고 격있게",
};

// 업종별 기본 톤 — 사장님이 따로 안 정해도 어울리는 출발점
export const TONE_DEFAULT: Record<Brand["industry"], VoiceTone> = {
  restaurant: "warm-shop",
  cafe: "minimal",
  dessert: "witty",
  stay: "editorial",
  beauty: "warm-shop",
  local: "minimal",
};

export type TodayPost = {
  cover: { gradientFrom: string; gradientTo: string; tone: "warm" | "modern" | "moody" | "natural" };
  slideLabel: string;
  slideTitle: string;
  slideHint?: string;
  caption: string;
  hashtags: string[];
  publishAt: string;
  channel: "instagram" | "naver-blog" | "threads";
  channelLabel: string;
  reasoning: string;
  titleFont?: "serif" | "sans";
};

export type WeekDay = {
  date: string;
  weekday: string;
  isToday?: boolean;
  isPast?: boolean;
  kind?: string;
  state: "posted" | "today" | "scheduled" | "rest";
};

export type Reaction = {
  metric: string;
  hint: string;
  quote?: string;
};

export type ShopHand = {
  greeting: string;
  today: TodayPost;
  week: WeekDay[];
  reactions: Reaction[];
};

// ─────────────────────────────────────────────────────────────
// 시간/요일/계절 컨텍스트
// ─────────────────────────────────────────────────────────────

function getContext(now = new Date()) {
  const h = now.getHours();
  const dow = now.getDay();
  const month = now.getMonth() + 1;

  const slot: "dawn" | "morning" | "lunch" | "afternoon" | "evening" | "night" =
    h < 6 ? "dawn"
      : h < 11 ? "morning"
        : h < 14 ? "lunch"
          : h < 17 ? "afternoon"
            : h < 21 ? "evening"
              : "night";

  const dayName = ["일", "월", "화", "수", "목", "금", "토"][dow];
  const isWeekend = dow === 0 || dow === 6;
  const season: "winter" | "spring" | "summer" | "autumn" =
    month <= 2 || month === 12 ? "winter"
      : month <= 5 ? "spring"
        : month <= 8 ? "summer"
          : "autumn";

  return { slot, dayName, dow, isWeekend, season, month };
}

function pickPublishTime(industry: Brand["industry"]): string {
  const map: Record<Brand["industry"], string> = {
    restaurant: "오후 7시 12분",
    cafe: "오전 10시 18분",
    dessert: "오후 3시 24분",
    stay: "저녁 8시 6분",
    beauty: "오후 6시 9분",
    local: "오후 1시 21분",
  };
  return map[industry] ?? "오후 7시";
}

// ─────────────────────────────────────────────────────────────
// 톤별 인사
// ─────────────────────────────────────────────────────────────

function buildGreeting(brand: Brand, ctx: ReturnType<typeof getContext>, tone: VoiceTone): string {
  const name = brand.name.replace(/\s.*$/, "");

  switch (tone) {
    case "editorial":
      return `${name}. ${ctx.dayName}요일.`;
    case "minimal":
      return `${name} — ${ctx.dayName}요일.`;
    case "warm-shop": {
      const dayPhrase = ctx.isWeekend
        ? `${ctx.dayName}요일 아침이라 일찍 시작해뒀어요`
        : ctx.slot === "morning" ? "오늘 아침"
          : ctx.slot === "lunch" ? "점심 시간 전에"
            : ctx.slot === "afternoon" ? `${ctx.dayName}요일 오후`
              : ctx.slot === "evening" ? "저녁 발행 준비 끝"
                : "밤 사이";
      return `${name} 사장님, ${dayPhrase}.`;
    }
    case "witty":
      return `${name}, ${ctx.dayName}요일이래요.`;
    case "premium":
      return `${name}. A quiet ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][ctx.dow]}.`;
  }
}

// ─────────────────────────────────────────────────────────────
// 톤별 카피 풀
// ─────────────────────────────────────────────────────────────

type CopyPool = {
  slideLabel: string;
  slideTitle: string;
  slideHint?: string;
  caption: string;
  hashtags: string[];
  reasoning: string;
  tone: TodayPost["cover"]["tone"];
  titleFont?: "serif" | "sans";
};

function deterministicPick<T>(pool: T[], seedStr: string): T {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}

// 도시 단순화
function shortCity(brand: Brand) {
  return brand.city.replace(/(시|군|구)$/, "");
}

// ── EDITORIAL: 잡지 톤 ──────────────────────────────────────
function editorialPool(brand: Brand, ctx: ReturnType<typeof getContext>): CopyPool[] {
  const city = shortCity(brand);
  switch (brand.industry) {
    case "restaurant":
      return [{
        slideLabel: `ISSUE · ${ctx.month}월`,
        slideTitle: "정오, 자리는 열린다",
        slideHint: "예약 없이.",
        caption: `정오에 문을 연다.\n오늘 메뉴는 한 줄만 바꿨다.\n자리는 있다. 그게 전부다.`,
        hashtags: [`#${city}`, "#한정식", "#오늘점심"],
        reasoning: "평일 점심 자리 안내. 헤드라인 톤으로 거리감 유지.",
        tone: "natural",
        titleFont: "serif",
      }];
    case "cafe":
      return [{
        slideLabel: `THIS WEEK · ${ctx.month}.${new Date().getDate()}`,
        slideTitle: "에티오피아, 한 배치",
        slideHint: "주말 전 종료.",
        caption: `이번 주의 원두는 에티오피아.\n한 배치만 들였고, 주말 전에 끝난다.\n향이 진하다.`,
        hashtags: [`#${city}`, "#스페셜티커피", "#싱글오리진"],
        reasoning: "원두 소진 안내 — 잡지 헤드라인처럼 사실만.",
        tone: "modern",
        titleFont: "serif",
      }];
    case "dessert":
      return [{
        slideLabel: `TODAY · ${ctx.month}.${new Date().getDate()}`,
        slideTitle: "오늘은 60개",
        slideHint: "그게 전부.",
        caption: `오늘은 60개.\n오후 다섯 시쯤이면 거의 끝난다.\n포장은 받는다.`,
        hashtags: [`#${city}`, "#휘낭시에", "#한정수량"],
        reasoning: "수량 한정 — 짧고 단호한 톤.",
        tone: "warm",
        titleFont: "serif",
      }];
    case "stay":
      return [{
        slideLabel: "QUIET WEEKDAY",
        slideTitle: "비가 좀 와도 좋다",
        slideHint: "처마 아래, 차 한 잔.",
        caption: `평일 한옥은 조용하다.\n비가 오는 날은 더 그렇다.\n마당 처마 아래 의자 두 개를 둔다.`,
        hashtags: [`#${city}한옥`, "#한옥스테이", "#평일여행"],
        reasoning: "분위기 차별화 — 잡지 에세이 톤.",
        tone: "moody",
        titleFont: "serif",
      }];
    case "beauty":
      return [{
        slideLabel: `${ctx.dayName.toUpperCase()} · APPOINTMENTS`,
        slideTitle: "히메컷, 둘",
        slideHint: "DM으로.",
        caption: `이번주, 히메컷은 두 명.\n오후 두 시와 다섯 시.\nDM으로 시간을 잡는다.`,
        hashtags: [`#${city}`, "#히메컷", "#트렌드컷"],
        reasoning: "예약 안내 — 명확하고 짧게.",
        tone: "modern",
        titleFont: "serif",
      }];
    case "local":
      return [{
        slideLabel: `NEW · ${ctx.month}월`,
        slideTitle: "이번주, 여섯 점",
        slideHint: "셔츠 두 장, 가디건 넷.",
        caption: `이번주 입고는 여섯 점.\n셔츠 두 장, 가디건 네 장.\n사이즈는 각기 다르다.`,
        hashtags: [`#${city}`, "#편집샵", "#신상"],
        reasoning: "신상 입고 — 잡지 캡션 톤.",
        tone: "natural",
        titleFont: "serif",
      }];
  }
}

// ── MINIMAL: 사실만, 형용사 없이 ─────────────────────────────
function minimalPool(brand: Brand, _ctx: ReturnType<typeof getContext>): CopyPool[] {
  const city = shortCity(brand);
  switch (brand.industry) {
    case "restaurant":
      return [{
        slideLabel: "OPEN",
        slideTitle: "12:00",
        slideHint: "자리 있음.",
        caption: `12:00 개점.\n자리 있음.\n예약 없이.`,
        hashtags: [`#${city}`, "#한정식"],
        reasoning: "최소 정보 — 노션 톤.",
        tone: "modern",
        titleFont: "sans",
      }];
    case "cafe":
      return [{
        slideLabel: "BEAN",
        slideTitle: "Ethiopia",
        slideHint: "이번 주.",
        caption: `이번 주 원두 — 에티오피아.\n주말 전 종료.`,
        hashtags: [`#${city}`, "#스페셜티커피"],
        reasoning: "정보만 — 한 단어 헤드라인.",
        tone: "modern",
        titleFont: "sans",
      }];
    case "dessert":
      return [{
        slideLabel: "TODAY",
        slideTitle: "60",
        slideHint: "오후 5시 종료.",
        caption: `60개.\n오후 5시 종료.\n포장 가능.`,
        hashtags: [`#${city}`, "#휘낭시에"],
        reasoning: "숫자 헤드라인 — 더 못 줄임.",
        tone: "warm",
        titleFont: "sans",
      }];
    case "stay":
      return [{
        slideLabel: "WEEKDAY",
        slideTitle: "객실 2",
        slideHint: "평일.",
        caption: `평일 객실 두 개.\n주말 만실.\n조식 포함.`,
        hashtags: [`#${city}한옥`, "#평일여행"],
        reasoning: "재고 + 사실만.",
        tone: "modern",
        titleFont: "sans",
      }];
    case "beauty":
      return [{
        slideLabel: "SLOTS",
        slideTitle: "2",
        slideHint: "컷 + 펌.",
        caption: `남은 자리 2.\n컷 + 펌.\nDM 예약.`,
        hashtags: [`#${city}`, "#예약가능"],
        reasoning: "자리 수만.",
        tone: "modern",
        titleFont: "sans",
      }];
    case "local":
      return [{
        slideLabel: "NEW",
        slideTitle: "6",
        slideHint: "셔츠 2 / 가디건 4.",
        caption: `이번주 입고 6점.\n셔츠 2 / 가디건 4.\n사이즈 각 1-2.`,
        hashtags: [`#${city}`, "#신상입고"],
        reasoning: "재고 표 톤.",
        tone: "natural",
        titleFont: "sans",
      }];
  }
}

// ── WARM-SHOP: 친근한 (구 기본) ──────────────────────────────
function warmShopPool(brand: Brand, ctx: ReturnType<typeof getContext>): CopyPool[] {
  const city = shortCity(brand);
  switch (brand.industry) {
    case "restaurant":
      return [
        {
          slideLabel: "오늘의 한 상",
          slideTitle: `${ctx.dayName}요일 점심 자리 있어요`,
          slideHint: "12시부터 — 예약 없이 오셔도 ok",
          caption: `${ctx.dayName}요일 점심.\n오늘은 자리 여유 있습니다.\n12시 오픈, 두 시간만 운영해요.\n오신 김에 천천히 드시고 가세요.`,
          hashtags: [`#${city}맛집`, "#한정식", `#${city}점심`, "#오늘점심"],
          reasoning: "평일 점심 안내 — 손님에게 말 거는 톤.",
          tone: "warm",
        },
        {
          slideLabel: "직원 한 컷",
          slideTitle: "오늘 들어온 재료",
          slideHint: "새벽에 직접 보신 것만",
          caption: `오늘 들어온 재료들.\n새벽 시장에서 직접 보고 들여왔어요.\n양 한정이라 빨리 끝날 수 있어요.`,
          hashtags: [`#${city}한정식`, "#당일재료", "#한정수량"],
          reasoning: "재료 사진 = 신뢰감 카드.",
          tone: "natural",
        },
      ];
    case "cafe":
      return [{
        slideLabel: "오늘 원두",
        slideTitle: "에티오피아 한 배치 끝나갑니다",
        slideHint: "주말 전에 마시러 오세요",
        caption: `이번 주 원두 — 에티오피아 예가체프.\n향이 진짜 좋아서 자주 찾으셨어요.\n이번 주말 전에 끝날 것 같아요.`,
        hashtags: [`#${city}카페`, "#스페셜티커피", "#오늘의커피"],
        reasoning: "소진 안내 = 진짜 정보 + FOMO.",
        tone: "warm",
      }];
    case "dessert":
      return [{
        slideLabel: "오늘 굽은 거",
        slideTitle: "휘낭시에 60개만 굽었어요",
        slideHint: "오후 5시쯤 거의 다 나갑니다",
        caption: `오늘 아침에 60개 굽었어요.\n오후 5시쯤이면 거의 다 나가요.\n포장도 가능합니다.`,
        hashtags: [`#${city}디저트`, "#휘낭시에", "#수량한정"],
        reasoning: "한정 + 시간 안내.",
        tone: "warm",
      }];
    case "stay":
      return [{
        slideLabel: `${ctx.dayName}요일 비어 있어요`,
        slideTitle: "평일 1박 — 지금 잡으면 여유",
        slideHint: "주말은 이미 만실",
        caption: `이번주 평일 두 객실 비어 있어요.\n주말은 다음달까지 만실이라 평일이 오히려 조용해서 좋아요.\n조식 포함, 체크인 4시.`,
        hashtags: [`#${city}한옥`, "#한옥스테이", "#평일여행"],
        reasoning: "주말 만실 + 평일 빈자리 안내.",
        tone: "moody",
      }];
    case "beauty":
      return [{
        slideLabel: `${ctx.dayName}요일 자리`,
        slideTitle: "컷 + 펌 자리 두 개 남아요",
        slideHint: "예약은 DM 으로",
        caption: `이번주 ${ctx.dayName}요일 자리.\n컷 + 펌 두 분 받을 수 있어요. 오후 2시 / 5시.\nDM 으로 시간 알려주세요.`,
        hashtags: [`#${city}미용실`, "#예약가능", "#펌잘하는곳"],
        reasoning: "남은 자리 안내 = DM 전환 패턴.",
        tone: "warm",
      }];
    case "local":
      return [{
        slideLabel: "신상 입고",
        slideTitle: "이번주 새로 들어온 거 — 6점",
        slideHint: "사이즈는 댓글로 확인",
        caption: `이번주 입고 — 봄용 셔츠랑 가디건 6점이에요.\n사이즈별로 한두 장씩만 들여왔어요.\n댓글로 어떤 거 보고 싶으신지 알려주시면 자세히 찍어드릴게요.`,
        hashtags: [`#${city}패션`, "#신상입고", "#오늘의룩"],
        reasoning: "수량 한정 + 댓글 유도.",
        tone: "natural",
      }];
  }
}

// ── WITTY: 가볍게, MZ 한 줄 농담 ──────────────────────────────
function wittyPool(brand: Brand, ctx: ReturnType<typeof getContext>): CopyPool[] {
  const city = shortCity(brand);
  switch (brand.industry) {
    case "restaurant":
      return [{
        slideLabel: "PSST",
        slideTitle: `${ctx.dayName}요일 점심, 자리 있어요`,
        slideHint: "자랑 아니고요.",
        caption: `${ctx.dayName}요일 점심에 자리 있다고 하면 좀 그런가요.\n그래도 있어요. 와요.\n12시부터.`,
        hashtags: [`#${city}맛집`, "#오늘점심", "#한정식"],
        reasoning: "위트 톤 — 자리 부족 안 보이려는 자세 자체를 농담으로.",
        tone: "warm",
      }];
    case "cafe":
      return [{
        slideLabel: "ALERT",
        slideTitle: "에티오피아 떨어져요",
        slideHint: "들으셨죠.",
        caption: `에티오피아 원두 곧 끝납니다.\n급하다는 거 아니고요. 그냥 말씀드리는 거예요.\n주말 전에는 분명히 없어요.`,
        hashtags: [`#${city}카페`, "#원두", "#스페셜티"],
        reasoning: "FOMO 를 위트로 — 압박감 줄이면서 정보 전달.",
        tone: "modern",
      }];
    case "dessert":
      return [{
        slideLabel: "GAME",
        slideTitle: "휘낭시에 60. 손 빠른 분 승",
        slideHint: "오후 5시 게임 종료.",
        caption: `오늘 60개 굽었어요.\n빨리 오시는 분이 이깁니다.\n그렇다고 뛰진 마세요.`,
        hashtags: [`#${city}디저트`, "#휘낭시에", "#수량한정"],
        reasoning: "수량 한정을 게임처럼.",
        tone: "warm",
      }];
    case "stay":
      return [{
        slideLabel: "TIP",
        slideTitle: "비 오면 한옥이 진짜예요",
        slideHint: "처음이세요?",
        caption: `한옥 처음이세요?\n비 오는 날에 와보세요. 그게 진짜예요.\n평일 객실 두 개 비어 있어요.`,
        hashtags: [`#${city}한옥`, "#한옥스테이", "#비오는날"],
        reasoning: "유머로 새 손님 진입장벽 ↓.",
        tone: "moody",
      }];
    case "beauty":
      return [{
        slideLabel: "FIND",
        slideTitle: "히메컷 어울리실 분 찾아요",
        slideHint: "둘만.",
        caption: `히메컷, 이번주 두 분만 받아요.\n잘 어울릴 것 같으신 분 — DM으로 사진 한 장 주세요.\n시간 잡아드릴게요.`,
        hashtags: [`#${city}미용실`, "#히메컷", "#트렌드컷"],
        reasoning: "선별 톤 — 미용업에 어울리는 큐레이션.",
        tone: "modern",
      }];
    case "local":
      return [{
        slideLabel: "FYI",
        slideTitle: "신상 6점. 사이즈 한 장씩",
        slideHint: "자비없음.",
        caption: `이번주 신상 6점.\n사이즈는 거의 한 장씩이에요. 자비 없습니다.\n원하시는 핏 있으면 댓글로 빨리.`,
        hashtags: [`#${city}편집샵`, "#신상", "#사이즈한정"],
        reasoning: "재고 부족을 농담으로 = MZ 톤 핵심.",
        tone: "natural",
      }];
  }
}

// ── PREMIUM: 조용한 럭셔리. 영문 라벨 OK ────────────────────
function premiumPool(brand: Brand, _ctx: ReturnType<typeof getContext>): CopyPool[] {
  switch (brand.industry) {
    case "restaurant":
      return [{
        slideLabel: "LUNCH SERVICE",
        slideTitle: "Quietly, at twelve",
        slideHint: "As always.",
        caption: `Lunch begins at twelve.\nA single seating.\nWalk-ins welcomed today.`,
        hashtags: ["#omakase", "#seoul", "#lunchservice"],
        reasoning: "프리미엄 식음료 — 영문 + 절제.",
        tone: "moody",
        titleFont: "serif",
      }];
    case "cafe":
      return [{
        slideLabel: "SINGLE ORIGIN",
        slideTitle: "Ethiopia, this week",
        slideHint: "One batch.",
        caption: `Single origin, Ethiopia.\nOne batch, ending this weekend.`,
        hashtags: ["#singleorigin", "#specialtycoffee", "#seoul"],
        reasoning: "스페셜티 카페 = 영문 라벨이 자연스러움.",
        tone: "moody",
        titleFont: "serif",
      }];
    case "dessert":
      return [{
        slideLabel: "TODAY",
        slideTitle: "Sixty pieces",
        slideHint: "Until five.",
        caption: `Sixty pieces, baked this morning.\nAvailable until five.`,
        hashtags: ["#patisserie", "#seoul", "#finediningdessert"],
        reasoning: "프리미엄 디저트 = 영문 카운트.",
        tone: "warm",
        titleFont: "serif",
      }];
    case "stay":
      return [{
        slideLabel: "WEEKDAY",
        slideTitle: "A quieter stay",
        slideHint: "Mid-week openings.",
        caption: `Two rooms remain open mid-week.\nBreakfast at eight. Check-in at four.`,
        hashtags: ["#hanok", "#quietluxury", "#seoul"],
        reasoning: "한옥 럭셔리 — 영문 + 침묵.",
        tone: "moody",
        titleFont: "serif",
      }];
    case "beauty":
      return [{
        slideLabel: "BY APPOINTMENT",
        slideTitle: "Two openings",
        slideHint: "This week.",
        caption: `Two appointments available this week.\nCut and perm. By direct message.`,
        hashtags: ["#salon", "#seoul", "#byappointment"],
        reasoning: "프리미엄 살롱 = 예약제 영문 톤.",
        tone: "modern",
        titleFont: "serif",
      }];
    case "local":
      return [{
        slideLabel: "NEW ARRIVALS",
        slideTitle: "Six pieces",
        slideHint: "One of each.",
        caption: `Six new arrivals this week.\nOne of each, mostly.`,
        hashtags: ["#editorial", "#concept", "#seoul"],
        reasoning: "편집샵 프리미엄 = 영문 신상 라벨.",
        tone: "natural",
        titleFont: "serif",
      }];
  }
}

function copyPool(brand: Brand, ctx: ReturnType<typeof getContext>, tone: VoiceTone): CopyPool[] {
  switch (tone) {
    case "editorial": return editorialPool(brand, ctx);
    case "minimal": return minimalPool(brand, ctx);
    case "warm-shop": return warmShopPool(brand, ctx);
    case "witty": return wittyPool(brand, ctx);
    case "premium": return premiumPool(brand, ctx);
  }
}

// ─────────────────────────────────────────────────────────────
// 색상 — 무드 → 그라디언트 (절제된 톤만)
// ─────────────────────────────────────────────────────────────

function moodGradient(t: TodayPost["cover"]["tone"]): { from: string; to: string } {
  switch (t) {
    case "warm": return { from: "#F5E6D3", to: "#E8C9A8" };
    case "modern": return { from: "#E8EBF0", to: "#CBD2DC" };
    case "moody": return { from: "#3D3833", to: "#1E1B19" };
    case "natural": return { from: "#E8E2D5", to: "#C9C0AE" };
  }
}

// ─────────────────────────────────────────────────────────────
// 이번주 7일 (톤 무관)
// ─────────────────────────────────────────────────────────────

function buildWeek(brand: Brand, now = new Date()): WeekDay[] {
  const dow = now.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + mondayOffset);

  const weekdayShort = ["월", "화", "수", "목", "금", "토", "일"];
  const pattern: Record<Brand["industry"], (string | null)[]> = {
    restaurant: ["사진 1장", "사진 1장", "릴스", "사진 1장", "블로그", "쉼", "쉼"],
    cafe: ["사진 1장", "사진 1장", "릴스", "사진 1장", "사진 1장", "릴스", "쉼"],
    dessert: ["사진 1장", "사진 1장", "사진 1장", "릴스", "사진 1장", "사진 1장", "릴스"],
    stay: ["블로그", "쉼", "사진 1장", "릴스", "사진 1장", "쉼", "쉼"],
    beauty: ["쉼", "사진 1장", "사진 1장", "릴스", "사진 1장", "사진 1장", "쉼"],
    local: ["사진 1장", "사진 1장", "릴스", "사진 1장", "사진 1장", "릴스", "쉼"],
  };

  const ind = pattern[brand.industry];
  return weekdayShort.map((wd, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const isToday = d.toDateString() === now.toDateString();
    const isPast = d < now && !isToday;
    const kind = ind[i];
    const state: WeekDay["state"] = kind === "쉼"
      ? "rest"
      : isToday ? "today"
        : isPast ? "posted" : "scheduled";
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      weekday: wd,
      isToday,
      isPast,
      kind: kind ?? undefined,
      state,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// 가게 반응 — 톤별 미세하게 다르게
// ─────────────────────────────────────────────────────────────

function buildReactions(brand: Brand, tone: VoiceTone): Reaction[] {
  const city = shortCity(brand);
  const newViewers = Math.round(brand.reachThisMonth * 0.04 / 100) * 100;
  const savers = Math.max(2, Math.round(brand.saveRate));

  const searchByIndustry: Record<Brand["industry"], string> = {
    restaurant: `${city} 한정식 점심`,
    cafe: `${city} 조용한 카페`,
    dessert: `${city} 디저트 맛집`,
    stay: `${city} 한옥 평일`,
    beauty: `${city} 펌 잘하는 곳`,
    local: `${city} 편집샵`,
  };

  switch (tone) {
    case "editorial":
      return [
        { metric: `+${newViewers}`, hint: "더 본 사람." },
        { metric: `${savers}명`, hint: "저장한 사람." },
        { metric: searchByIndustry[brand.industry], hint: "이 검색어로 진입." },
      ];
    case "minimal":
      return [
        { metric: `+${newViewers}`, hint: "viewers" },
        { metric: `${savers}`, hint: "saves" },
        { metric: searchByIndustry[brand.industry], hint: "top search" },
      ];
    case "warm-shop":
      return [
        { metric: `+${newViewers}명`, hint: "지난주보다 가게 본 사람 늘었어요" },
        { metric: `${savers}명`, hint: "저장한 분 — 한 분은 두 번 저장하셨어요" },
        { metric: searchByIndustry[brand.industry], hint: "이 검색어로 들어온 분 늘었어요", quote: "검색 → 프로필 → 저장 패턴" },
      ];
    case "witty":
      return [
        { metric: `+${newViewers}`, hint: "더 들렀어요. 우연 아닐 거예요." },
        { metric: `${savers}명`, hint: "저장하셨네요. 잊지 마세요." },
        { metric: searchByIndustry[brand.industry], hint: "이렇게 검색해서 들어오심." },
      ];
    case "premium":
      return [
        { metric: `+${newViewers}`, hint: "new visitors" },
        { metric: `${savers}`, hint: "quietly saved" },
        { metric: searchByIndustry[brand.industry], hint: "entered via search" },
      ];
  }
}

// ─────────────────────────────────────────────────────────────
// 메인 export — tone 인자 추가
// ─────────────────────────────────────────────────────────────

export function getShopHand(brand: Brand, tone: VoiceTone, now = new Date()): ShopHand {
  const ctx = getContext(now);
  const datestamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const pool = copyPool(brand, ctx, tone);
  const pick = deterministicPick(pool, `${brand.id}-${tone}-${datestamp}`);
  const grad = moodGradient(pick.tone);

  const today: TodayPost = {
    cover: { gradientFrom: grad.from, gradientTo: grad.to, tone: pick.tone },
    slideLabel: pick.slideLabel,
    slideTitle: pick.slideTitle,
    slideHint: pick.slideHint,
    caption: pick.caption,
    hashtags: pick.hashtags,
    publishAt: pickPublishTime(brand.industry),
    channel: "instagram",
    channelLabel: "인스타그램",
    reasoning: pick.reasoning,
    titleFont: pick.titleFont,
  };

  return {
    greeting: buildGreeting(brand, ctx, tone),
    today,
    week: buildWeek(brand, now),
    reactions: buildReactions(brand, tone),
  };
}
