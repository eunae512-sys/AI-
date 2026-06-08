// 오늘의 한 컷 (today post) — 브랜드 실데이터 기반 생성기
//
// 주제(subject)는 실데이터에서 도출한다:
//   ① 사장님이 직접 입력한 시그니처 메뉴 → ② 캠페인 → ③ 현시즌 추천 주제(getSeasonalTopics).
// 톤 시스템(5종)은 그 실주제를 감싸는 "표현 래퍼"다 — 주제 자체는 톤과 무관하게 데이터에서 온다.
//   - editorial : 잡지 톤. 짧고 거리감 있게. (serif)
//   - minimal   : 사실만, 형용사 없이. 노션/애플 톤.
//   - warm-shop : 손님한테 말 거는 친근한 톤. (구 기본값)
//   - witty     : 가볍게, MZ 톤.
//   - premium   : 조용한 럭셔리. 영문 라벨 ok. (serif)
// week/reactions/greeting 은 여전히 데모 보고용(범위 밖, 보존).

import type { Brand } from "@/types";
import { getSeasonalTopics, type Topic } from "@/lib/content/seasonal-topics";

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
  /** 주제 도출 출처 — 정직성 라벨용 (menu=실입력, campaign=캠페인, season=시즌 추정) */
  source: SubjectSource;
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

// ─────────────────────────────────────────────────────────────
// 실주제 도출 — 톤과 무관하게 데이터에서 subject 를 뽑는다.
//   ① realData.signatureMenu (사장님 실입력) → source="menu"
//   ② brand.campaign (placeholder "· 첫 캠페인" 아닐 때) → source="campaign"
//   ③ getSeasonalTopics 현시즌 추천 1개 → source="season"
// 결정론: deterministicPick 시드에 datestamp 포함 → 일 단위 로테이션, 같은 날 같은 출력.
// ─────────────────────────────────────────────────────────────

export type SubjectSource = "menu" | "campaign" | "season";

type ResolvedSubject = {
  subject: string;
  source: SubjectSource;
  topic?: Topic; // season 일 때만
};

// 캠페인 문자열이 온보딩 자동생성 placeholder("…· 첫 캠페인")인지.
function isPlaceholderCampaign(campaign: string | undefined): boolean {
  if (!campaign) return true;
  return /첫 캠페인/.test(campaign);
}

// 캠페인 문자열에서 무드태그(· 앞)를 떼고 실주제만.
function campaignSubject(campaign: string): string {
  // "Linen & Clay · 신메뉴 출시" → "신메뉴 출시"
  const parts = campaign.split("·").map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : campaign.trim();
}

function resolveSubject(
  brand: Brand,
  realData: { signatureMenu?: string[]; tagline?: string } | undefined,
  tone: VoiceTone,
  now: Date,
): ResolvedSubject {
  const datestamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

  const menus = (realData?.signatureMenu ?? []).map((m) => m.trim()).filter(Boolean);
  if (menus.length > 0) {
    // 여러 시그니처 메뉴 → 그날의 1개 결정론 선택 (일 단위 로테이션)
    const subject = deterministicPick(menus, `${brand.id}-${tone}-${datestamp}-menu`);
    return { subject, source: "menu" };
  }

  if (!isPlaceholderCampaign(brand.campaign)) {
    return { subject: campaignSubject(brand.campaign), source: "campaign" };
  }

  const topics = getSeasonalTopics(brand.industry, undefined, now);
  const topic = deterministicPick(topics, `${brand.id}-${tone}-${datestamp}-season`);
  return { subject: topic.title, source: "season", topic };
}

// reasoning(Editor's Note)에 도출 출처를 정직하게 1줄.
function sourceNote(source: SubjectSource): string {
  switch (source) {
    case "menu": return "시그니처 메뉴 기반 — 사장님이 등록한 대표 메뉴.";
    case "campaign": return "진행 중인 캠페인 주제 기반.";
    case "season": return "현재 시즌 추천 주제 기반 — 예시 성격의 제안.";
  }
}

// ── EDITORIAL: 잡지 톤 ──────────────────────────────────────
function editorialTemplate(
  brand: Brand,
  ctx: ReturnType<typeof getContext>,
  rs: ResolvedSubject,
): CopyPool {
  const city = shortCity(brand);
  const day = new Date();
  const subj = rs.subject;
  const hint = rs.source === "menu"
    ? "오늘 골라둔 한 컷."
    : rs.source === "campaign"
      ? "이번 주의 한 줄."
      : `${ctx.month}월, 제철의 결.`;
  const body = rs.source === "season" && rs.topic
    ? `${subj}.\n${rs.topic.intent}로, 이번 시즌의 결을 한 컷에 담았다.`
    : `${subj}.\n오늘의 한 컷은 여기에 둔다.\n자리는 있다.`;
  return {
    slideLabel: `ISSUE · ${ctx.month}.${day.getDate()}`,
    slideTitle: subj,
    slideHint: hint,
    caption: body,
    hashtags: [`#${city}`, `#${brand.industryLabel}`, "#오늘의한컷"],
    reasoning: sourceNote(rs.source),
    tone: "natural",
    titleFont: "serif",
  };
}

// ── MINIMAL: 사실만, 형용사 없이 ─────────────────────────────
function minimalTemplate(
  brand: Brand,
  _ctx: ReturnType<typeof getContext>,
  rs: ResolvedSubject,
): CopyPool {
  const city = shortCity(brand);
  const subj = rs.subject;
  const hint = rs.source === "menu" ? "대표 메뉴." : rs.source === "campaign" ? "이번 캠페인." : "이번 시즌.";
  const body = `${subj}.\n${hint}`;
  return {
    slideLabel: "TODAY",
    slideTitle: subj,
    slideHint: hint,
    caption: body,
    hashtags: [`#${city}`, `#${brand.industryLabel}`],
    reasoning: sourceNote(rs.source),
    tone: "modern",
    titleFont: "sans",
  };
}

// ── WARM-SHOP: 친근한 (구 기본) ──────────────────────────────
function warmShopTemplate(
  brand: Brand,
  ctx: ReturnType<typeof getContext>,
  rs: ResolvedSubject,
): CopyPool {
  const city = shortCity(brand);
  const subj = rs.subject;
  const lead = rs.source === "menu"
    ? `오늘은 ${subj} 이야기 한 컷 골라뒀어요.`
    : rs.source === "campaign"
      ? `이번엔 ${subj}, 한 컷으로 먼저 보여드릴게요.`
      : `${subj} — 요즘 결에 맞춰 한 컷 준비했어요.`;
  const body = `${ctx.dayName}요일이에요.\n${lead}\n오신 김에 편하게 둘러보고 가세요.`;
  return {
    slideLabel: "오늘의 한 컷",
    slideTitle: subj,
    slideHint: rs.source === "menu" ? "사장님이 고른 한 컷" : "오늘 골라둔 한 컷",
    caption: body,
    hashtags: [`#${city}`, `#${brand.industryLabel}`, "#오늘의한컷"],
    reasoning: sourceNote(rs.source),
    tone: "warm",
  };
}

// ── WITTY: 가볍게, MZ 한 줄 농담 ──────────────────────────────
function wittyTemplate(
  brand: Brand,
  _ctx: ReturnType<typeof getContext>,
  rs: ResolvedSubject,
): CopyPool {
  const city = shortCity(brand);
  const subj = rs.subject;
  const body = rs.source === "menu"
    ? `${subj}, 오늘은 이거 한 컷이에요.\n괜히 자랑 같지만, 골라둔 데는 이유가 있어요.`
    : rs.source === "campaign"
      ? `${subj}.\n별거 아닌 척하지만 꽤 신경 썼어요.`
      : `${subj}.\n시즌 따라 결도 슬쩍 바꿔봤어요. 슬쩍.`;
  return {
    slideLabel: "PSST",
    slideTitle: subj,
    slideHint: "슬쩍 보여드려요.",
    caption: body,
    hashtags: [`#${city}`, `#${brand.industryLabel}`, "#오늘의한컷"],
    reasoning: sourceNote(rs.source),
    tone: "warm",
  };
}

// ── PREMIUM: 조용한 럭셔리. 영문 라벨 OK ────────────────────
function premiumTemplate(
  brand: Brand,
  _ctx: ReturnType<typeof getContext>,
  rs: ResolvedSubject,
): CopyPool {
  const subj = rs.subject;
  const body = rs.source === "menu"
    ? `${subj}.\n오늘의 한 컷, 조용히 둡니다.`
    : rs.source === "campaign"
      ? `${subj}.\n이번 호의 한 줄.`
      : `${subj}.\n계절의 결을 한 컷에.`;
  return {
    slideLabel: rs.source === "season" ? "THIS SEASON" : "FEATURE",
    slideTitle: subj,
    slideHint: "Quietly noted.",
    caption: body,
    hashtags: ["#editorial", "#seoul", `#${brand.industryLabel}`],
    reasoning: sourceNote(rs.source),
    tone: "moody",
    titleFont: "serif",
  };
}

// 톤 → subject 래퍼 템플릿 디스패치. 주제는 rs(데이터)에서, 톤은 문체만.
function buildCopy(
  brand: Brand,
  ctx: ReturnType<typeof getContext>,
  tone: VoiceTone,
  rs: ResolvedSubject,
): CopyPool {
  switch (tone) {
    case "editorial": return editorialTemplate(brand, ctx, rs);
    case "minimal": return minimalTemplate(brand, ctx, rs);
    case "warm-shop": return warmShopTemplate(brand, ctx, rs);
    case "witty": return wittyTemplate(brand, ctx, rs);
    case "premium": return premiumTemplate(brand, ctx, rs);
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

export function getShopHand(
  brand: Brand,
  tone: VoiceTone,
  now = new Date(),
  realData?: { signatureMenu?: string[]; tagline?: string },
): ShopHand {
  const ctx = getContext(now);
  // 주제는 실데이터(메뉴→캠페인→시즌)에서, 톤은 그 주제를 감싸는 문체만.
  const rs = resolveSubject(brand, realData, tone, now);
  const pick = buildCopy(brand, ctx, tone, rs);
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
    source: rs.source,
  };

  return {
    greeting: buildGreeting(brand, ctx, tone),
    today,
    week: buildWeek(brand, now),
    reactions: buildReactions(brand, tone),
  };
}
