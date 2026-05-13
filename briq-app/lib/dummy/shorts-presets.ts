// 숏폼 자동 홍보 — 업종 × 톤 × 플랫폼 컨텐츠 생성기
// 사진 1장 업로드 → 인스타 릴스 / 틱톡 / 유튜브 쇼츠 / 네이버 플레이스 동시 작성
// 룰 베이스 (LLM 호출 X — 빠르게 미리보기 가능, 추후 GPT 교체 가능)
//
// v2: 바이럴 톤. lib/viral/voice-bank + context + recent-hooks 사용.
// 플랫폼별 grammar 완전 분리:
//   Reels(감성·저장각) / TikTok(1초 훅·반말) / Shorts(검색형) / Naver(지역 리뷰형)

import {
  HOOK_BANK,
  MID_BANK,
  CTA_BANK,
  VIRAL_HASHTAGS,
  INDUSTRY_SHORT,
  fillSlots,
  isClean,
  type Grammar as VoiceGrammar,
} from "@/lib/viral/voice-bank";
import { pickFreshHookSeeded, recordHook } from "@/lib/viral/recent-hooks";
import { getContext, contextualHookPrefix, inferContextualMood, contextualHashtags } from "@/lib/viral/context";
import type { Industry } from "@/lib/ai-gen/model-scenes";

export type ToneId = "emotional" | "info" | "event" | "discount" | "review";
export type PlatformId = "reels" | "tiktok" | "shorts" | "naver";

// PlatformId → voice-bank Grammar (1:1 매핑)
const PLATFORM_TO_GRAMMAR: Record<PlatformId, VoiceGrammar> = {
  reels: "reels",
  tiktok: "tiktok",
  shorts: "shorts",
  naver: "naver",
};

export const TONES: { id: ToneId; label: string; emoji: string; desc: string }[] = [
  { id: "emotional", label: "감성", emoji: "🌿", desc: "분위기·정성·시간 묘사" },
  { id: "info",      label: "정보", emoji: "📋", desc: "정확한 사실·구체 안내" },
  { id: "event",     label: "이벤트", emoji: "🎁", desc: "기간 한정·새 소식" },
  { id: "discount",  label: "할인",  emoji: "💸", desc: "가격·할인율 강조" },
  { id: "review",    label: "후기",  emoji: "⭐", desc: "단골·평가 인용" },
];

export const PLATFORMS: {
  id: PlatformId;
  label: string;
  vendor: string;
  badgeClass: string;
  gradient: string;
  spec: string;
  hashtagCount: number;
  captionMaxLen: number;
  hint: string;
}[] = [
  {
    id: "reels",
    label: "Instagram 릴스",
    vendor: "Meta",
    badgeClass: "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400 text-white",
    gradient: "from-fuchsia-500 via-pink-500 to-orange-400",
    spec: "9:16 · 30초 · 캡션 2200자",
    hashtagCount: 8,
    captionMaxLen: 220,
    hint: "감성·저장 유도형 캡션",
  },
  {
    id: "tiktok",
    label: "TikTok",
    vendor: "ByteDance",
    badgeClass: "bg-zinc-900 text-white",
    gradient: "from-cyan-400 via-pink-500 to-rose-600",
    spec: "9:16 · 60초 · 캡션 2200자",
    hashtagCount: 5,
    captionMaxLen: 140,
    hint: "강한 첫 문장·짧은 임팩트",
  },
  {
    id: "shorts",
    label: "YouTube 쇼츠",
    vendor: "Google",
    badgeClass: "bg-red-600 text-white",
    gradient: "from-red-500 via-red-600 to-red-800",
    spec: "9:16 · 60초 · 검색 최적화",
    hashtagCount: 4,
    captionMaxLen: 320,
    hint: "SEO 제목 + 설명",
  },
  {
    id: "naver",
    label: "Naver 플레이스",
    vendor: "Naver",
    badgeClass: "bg-emerald-500 text-white",
    gradient: "from-lime-500 via-emerald-500 to-emerald-700",
    spec: "소식·이벤트 · 1000자",
    hashtagCount: 3,
    captionMaxLen: 200,
    hint: "지역·방문 유도형",
  },
];

// 업종별 코어 어휘
type IndustryCore = {
  subject: string;          // "오늘의 한 상", "한 잔의 원두" 등
  highlight: string;        // 차별 포인트
  ctaPlace: string;         // "예약", "방문", "픽업"
  hashtagBase: string[];    // 공통 해시태그 풀
  seoKeywords: string[];    // 쇼츠/블로그 검색용
  cityHint: string;         // "강남 한정식" 식 결합어
};

const INDUSTRY_CORE: Record<string, IndustryCore> = {
  restaurant: {
    subject: "오늘의 한 상",
    highlight: "재료의 시간 · 손님께 정성",
    ctaPlace: "예약",
    hashtagBase: ["한정식", "코스요리", "예약필수", "오늘의메뉴", "맛집", "정성한상", "한국전통", "외식추천"],
    seoKeywords: ["한정식", "코스 메뉴", "상견례 추천", "어버이날 식당", "예약 한식"],
    cityHint: "한정식",
  },
  cafe: {
    subject: "오늘 내린 한 잔",
    highlight: "원두 산미 · 한 잔의 리듬",
    ctaPlace: "방문",
    hashtagBase: ["스페셜티커피", "원두", "콜드브루", "카페추천", "동네카페", "원두로스팅", "라떼아트", "커피한잔"],
    seoKeywords: ["스페셜티 카페", "콜드브루 추출", "원두 추천", "동네 카페", "커피 신상"],
    cityHint: "스페셜티 카페",
  },
  dessert: {
    subject: "오늘 만든 한 조각",
    highlight: "한 입의 단면 · 시즌 한정",
    ctaPlace: "픽업",
    hashtagBase: ["디저트맛집", "수제디저트", "오늘의디저트", "케이크", "단면샷", "픽업가능", "기념일선물", "디저트추천"],
    seoKeywords: ["디저트 카페", "수제 케이크", "픽업 가능 디저트", "기념일 케이크", "시즌 한정 디저트"],
    cityHint: "디저트샵",
  },
  stay: {
    subject: "오늘의 환영",
    highlight: "공간의 빛 · 손님의 시간",
    ctaPlace: "예약",
    hashtagBase: ["한옥스테이", "1박패키지", "어버이날숙소", "도심속휴식", "전통숙소", "조용한밤", "효도여행", "감성숙소"],
    seoKeywords: ["한옥스테이", "어버이날 숙소", "조용한 1박", "도심 한옥", "효도 패키지"],
    cityHint: "한옥 숙소",
  },
  beauty: {
    subject: "오늘의 결",
    highlight: "결을 살리는 단계 · 톤 매칭",
    ctaPlace: "예약",
    hashtagBase: ["헤어샵추천", "결케어", "봄컬러", "톤매칭", "디자이너지정", "강남미용실", "헤어시술", "광택"],
    seoKeywords: ["결 케어", "봄 헤어 컬러", "톤 매칭 시술", "지정 디자이너", "헤어 클리닉"],
    cityHint: "미용실",
  },
  local: {
    subject: "한 벌의 무게",
    highlight: "원단·실루엣의 결정",
    ctaPlace: "방문",
    hashtagBase: ["컨템포러리", "에디토리얼룩", "한국디자이너", "쇼룸오픈", "린넨소재", "데일리룩", "패션매거진", "신상룩북"],
    seoKeywords: ["컨템포러리 패션", "쇼룸 안내", "S/S 룩북", "한국 디자이너 브랜드", "리넨 룩"],
    cityHint: "편집샵",
  },
};

type ShapeContext = {
  brandName: string;
  city: string;
  tagline?: string;          // 사장님이 직접 적은 한 줄 소개
  signatureMenu?: string[];  // 시그니처 메뉴 1~3개
  // 캘린더 / 트렌드 카드에서 보낸 테마 — 카피에 직접 반영
  themeTitle?: string;       // "장마 감성 릴스"
  themeDesc?: string;        // "비 오는 날 메뉴 · 따뜻한 한 그릇"
  themeHooks?: string[];     // ["창문에 빗방울,", "솥에서 김이 오르고", ...]
  themeKeyword?: string;     // "장마" "어버이날 효도" "수국" "콜드"
};

// 시그니처 메뉴 1개 자연스럽게 뽑기 ("갈비찜" → "오늘의 갈비찜")
function pickMenu(menu?: string[], idx: number = 0): string | undefined {
  if (!menu || menu.length === 0) return undefined;
  return menu[idx % menu.length];
}

// 톤별 표현 변환기 — 같은 코어를 다른 결로 풀어냄
// 우선순위: 테마 후크 > 시그니처 메뉴 > 업종 기본
function shapeBy(tone: ToneId, core: IndustryCore, ctx: ShapeContext): {
  hookLine: string;       // 첫 줄
  midLine: string;        // 본문
  detailLine: string;     // 디테일
  ctaLine: string;        // 행동 유도
} {
  const { brandName, city, tagline, signatureMenu, themeTitle, themeDesc, themeHooks, themeKeyword } = ctx;
  const place = core.ctaPlace;
  const menu1 = pickMenu(signatureMenu, 0);
  const menu2 = pickMenu(signatureMenu, 1);

  // ★ 테마 우선 — 캘린더에서 "장마 감성" 같은 추천 들어오면 그 후크로 시작
  const themeHook1 = themeHooks?.[0];
  const themeHook2 = themeHooks?.[1];
  const themeHook3 = themeHooks?.[2];

  // subject: 테마 > 시그니처 메뉴 > 업종 기본
  const subject = themeHook1
    ? themeHook1.replace(/[,.]$/, "")
    : menu1
      ? `오늘의 ${menu1}`
      : core.subject;
  // highlight: 테마 desc > tagline > 업종 highlight
  const highlight = themeDesc ?? tagline ?? core.highlight;

  switch (tone) {
    case "emotional":
      return {
        // 테마 후크 1 → 그대로 첫 줄. 없으면 기존 패턴
        hookLine: themeHook1 ?? `${subject}, 천천히.`,
        // 테마 desc 가 있으면 그 결로 본문
        midLine: themeDesc
          ? `${themeDesc}.`
          : tagline ? `${tagline}.` : `${highlight}.`,
        // 테마 후크 2/3 가 있으면 디테일 자리에
        detailLine: themeHook2 && themeHook3
          ? `${themeHook2} ${themeHook3}.`
          : menu2
            ? `오늘은 ${menu1}과 ${menu2}, ${brandName}이(가) 같은 자리에서 준비했습니다.`
            : `오늘도 같은 시간, 같은 자리에서 ${brandName}이(가) 준비했습니다.`,
        ctaLine: `${city} ${brandName} · ${place} 안내드립니다.`,
      };
    case "info":
      return {
        hookLine: themeTitle
          ? `${brandName} · ${themeTitle} 안내`
          : menu1
            ? `${brandName} ${menu1} 안내`
            : `${brandName} ${core.subject} 안내`,
        midLine: themeDesc
          ? `${themeDesc} — 오늘부터 새로 진행됩니다.`
          : tagline
            ? `${tagline} — 오늘 새로 준비되었습니다.`
            : `${highlight}, 오늘 새로 준비되었습니다.`,
        detailLine: signatureMenu && signatureMenu.length >= 2
          ? `대표 메뉴: ${signatureMenu.slice(0, 3).join(" · ")}. 운영시간은 매장 인스타에 매주 업데이트됩니다.`
          : `운영시간·재료·구성은 매장 인스타에서 매주 업데이트합니다.`,
        ctaLine: `${place} 문의: 매장 DM 또는 전화`,
      };
    case "event":
      return {
        // 테마 keyword 가 있으면 "장마 한정", "어버이날 특별" 식으로 박음
        hookLine: themeKeyword
          ? `${themeKeyword} 한정 — ${menu1 ?? core.subject}`
          : menu1
            ? `이번 주 한정 — ${menu1}`
            : `이번 주 한정 — ${core.subject}`,
        midLine: themeDesc
          ? `${themeDesc}, 이 시기에만 짧게 만나실 수 있어요.`
          : tagline
            ? `${tagline}, 이번 주만 짧게 만나실 수 있어요.`
            : `${highlight}을(를) 만나실 수 있는 짧은 기간입니다.`,
        detailLine: themeHook2
          ? `${themeHook2} · 사전 ${place} 분들께 우선 안내드립니다.`
          : `매장 운영일에 한해 진행되며, 사전 ${place} 분들께 우선 안내드립니다.`,
        ctaLine: `${place} 마감 전 알림 신청 부탁드립니다.`,
      };
    case "discount":
      return {
        hookLine: themeKeyword
          ? `${themeKeyword} 특가 — ${menu1 ?? core.subject}`
          : menu1
            ? `오늘만 — ${menu1} 할인`
            : `오늘만 — ${core.subject} 할인`,
        midLine: themeDesc
          ? `${themeDesc} — 합리적인 가격으로.`
          : tagline
            ? `${tagline}을(를) 합리적인 가격으로 만나는 오늘 하루.`
            : `${highlight}을(를) 평소보다 합리적인 가격으로 안내합니다.`,
        detailLine: `당일 매장 ${place} 분들께 추가 혜택이 제공됩니다 (정확한 할인율은 매장 게시).`,
        ctaLine: `오늘의 가격 확인 후 ${place} 부탁드립니다.`,
      };
    case "review":
      return {
        hookLine: themeHook1
          ? `단골이 먼저 — ${themeHook1.replace(/[,.]$/, "")}`
          : menu1
            ? `단골이 먼저 알아챈 — ${menu1}`
            : `단골 분들이 먼저 알아챈 — ${core.subject}`,
        midLine: themeDesc
          ? `"${themeDesc}" — 단골 분들의 한 마디.`
          : tagline
            ? `"${tagline}" — 단골 분들의 한 마디.`
            : `"${highlight}이(가) 살아 있어요" 라는 한 마디.`,
        detailLine: themeHook2
          ? `${themeHook2} · ${brandName} 의 결을 자주 만나는 분들의 이야기.`
          : `매주 새 후기가 올라옵니다. ${brandName} 의 결을 자주 만나는 분들의 이야기.`,
        ctaLine: `처음이신 분도 같은 ${place} 흐름으로 모십니다.`,
      };
  }
}

// 플랫폼별 최종 포장
export type PlatformOutput = {
  platform: PlatformId;
  title: string;          // 썸네일/검색 제목
  caption: string;        // 본문
  subtitle: string;       // 자막용 짧은 문장 (영상 위에 입히기)
  hashtags: string[];
  cta: string;
  charCount: number;
};

// 슬롯 채우기 — {brand}, {city}, {district}, {menu}, {industryShort}
function buildSlots(args: {
  brandName: string;
  city: string;
  signatureMenu?: string[];
  industry: string;
}): Record<string, string> {
  // city 에서 동/구 추출 시도 — "서울 종로 광화문" → district = "광화문"
  const parts = args.city.split(/\s+/).filter(Boolean);
  const district = parts[parts.length - 1] ?? args.city;
  const menu = args.signatureMenu?.[0] ?? "";
  const industry = args.industry as Industry;
  return {
    brand: args.brandName,
    city: args.city,
    district,
    menu,
    industryShort: INDUSTRY_SHORT[industry] ?? "",
  };
}

// 브랜드별 결정론적 seed — 호출마다 동일 입력이면 동일 결과 (UI 일관성)
function brandSeed(brandName: string, platform: PlatformId, salt = 0): number {
  let h = 0;
  const s = `${brandName}::${platform}::${salt}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

export function generateForPlatform(args: {
  platform: PlatformId;
  industry: string;
  tone: ToneId;
  brandName: string;
  city: string;
  tagline?: string;
  signatureMenu?: string[];
  // 캘린더/트렌드 카드에서 보낸 테마 — 카피·해시태그에 박힘
  themeTitle?: string;
  themeDesc?: string;
  themeHooks?: string[];
  themeKeyword?: string;
  // variation seed — variation 클릭 시 증가시켜 다른 hook 픽
  variationSeed?: number;
}): PlatformOutput {
  const core = INDUSTRY_CORE[args.industry] ?? INDUSTRY_CORE.restaurant;
  const meta = PLATFORMS.find((p) => p.id === args.platform)!;
  const grammar = PLATFORM_TO_GRAMMAR[args.platform];
  const industry = (args.industry as Industry) || "restaurant";
  const slots = buildSlots({
    brandName: args.brandName,
    city: args.city,
    signatureMenu: args.signatureMenu,
    industry: args.industry,
  });

  // ─── 1) HOOK 픽 ────────────────────────────────
  //   우선순위: theme hook > viral HOOK_BANK[grammar][industry] (anti-repetition)
  const ctx = getContext();
  const mood = inferContextualMood(ctx, args.themeKeyword);
  const moodPrefixOptions = contextualHookPrefix(mood);
  const seed = brandSeed(args.brandName, args.platform, args.variationSeed ?? 0);

  const hookPool = HOOK_BANK[grammar][industry] ?? HOOK_BANK[grammar].restaurant;
  // 슬롯 치환 → isClean 필터링 (시그니처 메뉴 없을 때 {menu} 가 빈칸 되는 후크 제거)
  const filledHooks = hookPool
    .map((tpl) => fillSlots(tpl, slots))
    .filter(isClean);
  const finalPool = filledHooks.length > 0 ? filledHooks : hookPool.map((tpl) => fillSlots(tpl, { ...slots, menu: slots.menu || "오늘의 메뉴", industryShort: slots.industryShort || "가게" }));

  // 테마 hook 우선 (캘린더에서 들어온 경우), 없으면 viral 풀에서 anti-repetition pick
  const themeFirst = args.themeHooks?.[0];
  let pickedHook = themeFirst && isClean(themeFirst)
    ? themeFirst.replace(/[,.]$/, "")
    : pickFreshHookSeeded(`${args.brandName}::${args.platform}`, finalPool, seed);

  // 컨텍스트 prefix (비/밤/주말 등) — 30% 확률로 prepend, 너무 길어지지 않게
  if (moodPrefixOptions.length > 0 && pickedHook.length < 20 && (seed & 7) >= 5) {
    const prefix = moodPrefixOptions[Math.abs(seed) % moodPrefixOptions.length];
    if (!pickedHook.toLowerCase().includes(prefix.toLowerCase())) {
      pickedHook = `${prefix} ${pickedHook}`;
    }
  }

  // ─── 2) MID 픽 — themeDesc 또는 MID_BANK ────────
  const midPool = (MID_BANK[industry] ?? MID_BANK.restaurant)
    .map((tpl) => fillSlots(tpl, slots))
    .filter(isClean);
  const midLine = args.themeDesc && isClean(args.themeDesc)
    ? args.themeDesc.replace(/[.]$/, "")
    : midPool.length > 0
      ? midPool[Math.abs(seed >> 3) % midPool.length]
      : args.tagline ?? core.highlight;

  // ─── 3) CTA 픽 — viral CTA_BANK ────────────────
  const ctaPool = CTA_BANK[grammar];
  const ctaLine = ctaPool[Math.abs(seed >> 6) % ctaPool.length];

  // ─── 4) 해시태그 — viral + signature menu + context ──
  const themeTags = args.themeKeyword
    ? [`#${args.themeKeyword.replace(/\s/g, "")}`]
    : [];
  const menuTags = (args.signatureMenu ?? [])
    .map((m) => m.trim())
    .filter(Boolean)
    .map((m) => `#${m.replace(/\s/g, "")}`);
  const ctxTags = contextualHashtags(ctx).slice(0, 2).map((t) => `#${t}`);
  const viralTagsRaw = VIRAL_HASHTAGS[grammar].slice(0, 4);
  const viralTags = viralTagsRaw.map((t) => `#${t}`);

  const allHashtags = [
    ...themeTags,
    ...menuTags.slice(0, 2),
    ...viralTags,
    ...ctxTags,
    `#${args.brandName.replace(/\s/g, "")}`,
    `#${slots.district || args.city}${core.cityHint}`,
  ];

  // ─── 5) 플랫폼별 최종 조립 ───────────────────────
  let title = "";
  let caption = "";
  let subtitle = "";
  let cta = "";
  let hashtags: string[] = [];

  switch (args.platform) {
    case "reels": {
      // 감성·저장 유도. caption 길게 OK
      title = pickedHook;
      caption = `${pickedHook}\n\n${midLine}.\n\n${ctaLine}`;
      subtitle = pickedHook.replace(/[—,].+$/, "").trim();
      cta = ctaLine;
      hashtags = allHashtags.slice(0, meta.hashtagCount);
      break;
    }
    case "tiktok": {
      // 1초 훅 · 짧은 본문 · trending tag
      title = pickedHook;
      caption = `${pickedHook}\n${midLine}.\n👇 ${ctaLine}`;
      subtitle = pickedHook;
      cta = ctaLine;
      hashtags = [...allHashtags.slice(0, 3), "#fyp", "#포유"];
      break;
    }
    case "shorts": {
      // SEO 제목 — 검색형 grammar 의 hook 자체가 이미 "{city} 카페 BEST" 식이라 그대로
      title = pickedHook.length <= 60 ? pickedHook : pickedHook.slice(0, 58) + "…";
      caption = `${pickedHook}\n\n${midLine}.\n\n${ctaLine}\n\n관련 검색: ${core.seoKeywords.slice(0, 3).join(", ")}`;
      subtitle = pickedHook;
      cta = ctaLine;
      hashtags = [
        ...core.seoKeywords.slice(0, 2).map((k) => `#${k.replace(/\s/g, "")}`),
        ...allHashtags.slice(0, 3),
      ];
      break;
    }
    case "naver": {
      // 지역형 · 리뷰형 · 짧게
      title = pickedHook;
      caption = `${pickedHook}\n\n${midLine}.\n\n${ctaLine}`;
      subtitle = `${slots.district || args.city} ${core.cityHint}`;
      cta = ctaLine;
      hashtags = [
        `#${slots.district || args.city}${core.cityHint}`,
        `#${args.brandName.replace(/\s/g, "")}`,
        `#${core.seoKeywords[0]?.replace(/\s/g, "") ?? core.cityHint}`,
      ];
      break;
    }
  }

  // 사용한 hook 을 recent 에 기록 (variation 시 다음 호출에서 회피)
  recordHook(`${args.brandName}::${args.platform}`, pickedHook);

  return {
    platform: args.platform,
    title,
    caption: caption.slice(0, meta.captionMaxLen + 80), // 살짝 여유
    subtitle,
    hashtags,
    cta,
    charCount: caption.length,
  };
}

// 모든 플랫폼 한 번에 생성
export function generateAllPlatforms(args: {
  industry: string;
  tone: ToneId;
  brandName: string;
  city: string;
  tagline?: string;
  signatureMenu?: string[];
  themeTitle?: string;
  themeDesc?: string;
  themeHooks?: string[];
  themeKeyword?: string;
  variationSeed?: number;
}): PlatformOutput[] {
  return PLATFORMS.map((p) =>
    generateForPlatform({
      platform: p.id,
      industry: args.industry,
      tone: args.tone,
      brandName: args.brandName,
      city: args.city,
      tagline: args.tagline,
      signatureMenu: args.signatureMenu,
      themeTitle: args.themeTitle,
      themeDesc: args.themeDesc,
      themeHooks: args.themeHooks,
      themeKeyword: args.themeKeyword,
      variationSeed: args.variationSeed,
    }),
  );
}

// 업종 분석 시뮬레이션 (업로드된 사진의 분위기·모드 추정 — 데모용)
export function inferMoodFromIndustry(industry: string): { mood: string; vibe: string } {
  switch (industry) {
    case "restaurant": return { mood: "정성 · 따뜻", vibe: "한 상의 시간" };
    case "cafe":       return { mood: "차분 · 매거진", vibe: "한 잔의 리듬" };
    case "dessert":    return { mood: "친근 · 발랄", vibe: "한 입의 감각" };
    case "stay":       return { mood: "고즈넉 · 환영", vibe: "공간의 빛" };
    case "beauty":     return { mood: "세련 · 자신감", vibe: "결의 변화" };
    case "local":      return { mood: "절제 · 에디토리얼", vibe: "한 벌의 무게" };
    default:           return { mood: "단정 · 신뢰", vibe: "오늘의 시작" };
  }
}

// 추천 발행 시간 (플랫폼별)
export const PUBLISH_TIME_HINT: Record<PlatformId, string> = {
  reels: "월·수 19:00 / 금 20:00",
  tiktok: "평일 07:30 / 22:00",
  shorts: "주말 14:00",
  naver: "평일 10:00 / 14:00",
};
