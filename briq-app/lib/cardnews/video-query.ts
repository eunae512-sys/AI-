// 카드뉴스/릴스 비디오 검색어 빌더 — 주제에 디테일하게 맞도록.
//
// 문제: Pexels 는 영문 인덱스이라 한국어 토픽이 직접 들어가면 매칭 0건 → generic fallback.
// 해결: 한국어 토픽 → 영문 키워드 사전 매핑 + 산업 컨텍스트 + 시즌 추론 + 짧은 query.
//
// 학습 자료: docs/cardnews-branding-research.md §8 업종별 권장 시퀀스 +
// 시중 잘된 카드뉴스 (29CM · 무신사 매거진 · 콤포타블 · 노티드 · 오설록 등) 가
// 비디오/사진을 어떻게 매칭하는지의 패턴.

import type { Brand } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// 한국어 → 영문 키워드 사전 (식재료·메뉴·계절·시간·분위기)
// ─────────────────────────────────────────────────────────────────────────────

// 식재료 (한 카드뉴스 토픽에 자주 등장)
const INGREDIENT_KO_EN: Record<string, string> = {
  봄나물: "spring vegetables namul",
  나물: "korean greens namul",
  수박: "watermelon",
  딸기: "strawberry",
  복숭아: "peach",
  무화과: "fig",
  단호박: "kabocha pumpkin",
  단감: "persimmon",
  송이: "matsutake mushroom",
  꽃게: "blue crab",
  대게: "snow crab",
  굴: "oyster",
  전복: "abalone",
  소고기: "korean beef",
  돼지고기: "pork",
  갈비: "galbi short ribs",
  냉면: "naengmyeon cold noodles",
  비빔밥: "bibimbap rice bowl",
  김밥: "kimbap rolls",
  떡: "rice cake tteok",
  콩나물: "soybean sprouts",
  무: "korean radish",
  배추: "napa cabbage",
  쌀: "korean rice",
  된장: "doenjang fermented paste",
  김치: "kimchi fermented",
  // 한식 메뉴/요리 — 사장님 signatureMenu 와 직접 매칭
  갈비찜: "braised short ribs galbi jjim",
  떡갈비: "tteokgalbi grilled patty",
  잡채: "japchae glass noodles",
  불고기: "bulgogi grilled beef",
  닭갈비: "dak galbi spicy chicken",
  김치찌개: "kimchi stew",
  된장찌개: "doenjang stew",
  순두부찌개: "soft tofu stew",
  부대찌개: "budae jjigae stew",
  육개장: "yukgaejang spicy beef soup",
  설렁탕: "seolleongtang ox bone soup",
  곰탕: "gomtang beef soup",
  냉이된장국: "namul soybean paste soup",
  파전: "scallion pancake pajeon",
  해물파전: "seafood scallion pancake",
  보쌈: "bossam boiled pork",
  족발: "jokbal braised pork trotter",
  삼겹살: "grilled pork belly samgyeopsal",
  삼계탕: "samgyetang chicken ginseng soup",
  떡볶이: "tteokbokki spicy rice cake",
  순대: "sundae korean blood sausage",
  전복죽: "abalone porridge",
  쌈밥: "lettuce wrap ssambap",
  한정식: "korean traditional banquet hanjeongsik",
  "5첩 한정식": "korean banquet five sides",
  "7첩 한정식": "korean banquet seven sides",
  돌솥비빔밥: "stone bowl bibimbap dolsot",
  // 카페·디저트 보강
  아메리카노: "americano black coffee",
  카푸치노: "cappuccino foam art",
  바닐라라떼: "vanilla latte",
  플랫화이트: "flat white",
  스콘: "scone bakery",
  크루아상: "croissant flaky pastry",
  티라미수: "tiramisu dessert",
  롤케이크: "roll cake swiss",
  // 미용
  컬러: "hair color salon",
  펌: "hair perm styling",
  염색: "hair dye salon",
  네일: "manicure nail art",
  // 패션·잡화
  린넨: "linen fabric texture",
  코트: "minimal coat outerwear",
  니트: "knit sweater editorial",
  // 카페·디저트
  콜드브루: "cold brew iced coffee",
  라떼: "latte",
  에스프레소: "espresso",
  드립커피: "pour over coffee drip",
  핸드드립: "hand drip pour over coffee",
  티: "tea brewing pour",
  녹차: "green tea matcha",
  말차: "matcha green tea",
  케이크: "cake patisserie",
  마들렌: "madeleine pastry",
  쿠키: "cookies bakery",
  타르트: "tart pastry",
  몽블랑: "mont blanc pastry",
  슈톨렌: "stollen christmas pastry",
  도넛: "donut bakery",
  빙수: "shaved ice bingsu",
  마카롱: "macaron",
};

// 메뉴/요리 형식
const MENU_KO_EN: Record<string, string> = {
  코스: "tasting course fine dining plating",
  "한 상": "korean banquet table plating",
  세트: "tasting set plating",
  점심: "lunch plate korean",
  저녁: "dinner plate fine dining",
  도시락: "lunch box bento",
  뷔페: "buffet table",
  주말: "weekend lunch plate",
};

// 시즌·이벤트
const SEASON_KO_EN: Record<string, string> = {
  봄: "spring soft light",
  여름: "summer bright sunlight",
  가을: "autumn warm amber",
  겨울: "winter cozy candle",
  장마: "rainy day quiet",
  추석: "korean chuseok autumn family",
  설: "korean new year",
  어버이날: "family dinner gathering",
  크리스마스: "christmas warm candle",
  발렌타인: "valentines chocolate",
  화이트데이: "soft pink",
  연말: "year end gathering",
  새해: "new year",
  벚꽃: "cherry blossom spring",
  단풍: "autumn maple leaves",
};

// 시간대
const TIME_KO_EN: Record<string, string> = {
  아침: "morning light",
  점심: "lunch midday",
  오후: "afternoon golden",
  저녁: "evening warm",
  밤: "night ambient",
  새벽: "dawn quiet",
};

// 무드 / 분위기 (브랜드 결)
const MOOD_KO_EN: Record<string, string> = {
  정성: "careful slow handcraft",
  편안: "cozy quiet relax",
  단정: "minimal editorial",
  따뜻: "warm amber light",
  차분: "calm meditative",
  활기: "lively bright",
};

// 가입 시 정한 브랜드 무드(Brand["mood"]) → 영상 비주얼 키워드.
// 토픽에서 추출한 mood 와 별개로, 브랜드가 가진 결을 강제 반영.
const MOOD_VIDEO_EN: Record<string, string> = {
  warm: "warm golden cozy light",
  modern: "minimal bright clean modern",
  moody: "moody cinematic low light dramatic",
  playful: "vivid colorful playful lively",
  natural: "natural organic daylight earthy",
  luxury: "elegant luxurious refined",
};

// 산업 → 기본 영문 컨텍스트 (시중 카드뉴스 톤 학습 기반)
const INDUSTRY_VIDEO_CONTEXT: Record<string, string> = {
  restaurant: "korean fine dining traditional table plating chef hands",
  cafe: "specialty coffee barista cafe interior morning",
  dessert: "patisserie boutique dessert plating",
  beauty: "hair salon editorial styling hands",
  stay: "hanok korean traditional house wooden interior sunlight",
  local: "minimal boutique fashion lookbook editorial",
};

// 산업 → 항상 끝에 붙는 톤 키워드 — 정갈/에디토리얼/미니멀 강화.
// 시중 잘된 카드뉴스 (29CM · 무신사 매거진 · 콤포타블 등) 의 비디오 결을
// Pexels 매칭에 강제 — aesthetic, minimal, editorial 자동 부착.
const INDUSTRY_VIDEO_TONE: Record<string, string> = {
  restaurant: "editorial minimal aesthetic slow plating soft natural light vertical",
  cafe: "minimal aesthetic slow pour cinematic muted morning vertical",
  dessert: "editorial minimal close up aesthetic muted vertical",
  beauty: "editorial minimal aesthetic salon soft close up vertical",
  stay: "minimal aesthetic interior sunlight muted wooden vertical",
  local: "editorial minimal aesthetic lookbook muted vertical",
};

// ─────────────────────────────────────────────────────────────────────────────
// 토픽 토큰 추출 — 한국어 주제에서 식재료·메뉴·시즌·시간 키워드 매칭
// ─────────────────────────────────────────────────────────────────────────────

export type VideoTopicTokens = {
  ingredients: string[];   // ["spring vegetables namul"]
  menu: string[];          // ["tasting course fine dining plating"]
  season: string[];        // ["spring soft light"]
  time: string[];          // ["lunch midday"]
  mood: string[];          // ["warm amber light"]
};

export function extractVideoTokens(topic: string): VideoTopicTokens {
  const tokens: VideoTopicTokens = { ingredients: [], menu: [], season: [], time: [], mood: [] };
  if (!topic) return tokens;

  const matchAll = (dict: Record<string, string>, target: string[]) => {
    for (const ko of Object.keys(dict)) {
      if (topic.includes(ko)) {
        const en = dict[ko];
        if (!target.includes(en)) target.push(en);
      }
    }
  };

  matchAll(INGREDIENT_KO_EN, tokens.ingredients);
  matchAll(MENU_KO_EN, tokens.menu);
  matchAll(SEASON_KO_EN, tokens.season);
  matchAll(TIME_KO_EN, tokens.time);
  matchAll(MOOD_KO_EN, tokens.mood);

  return tokens;
}

// 영상 토큰 사전에 없는 카테고리 보조 (AI 출연자/이미지 프롬프트용)
const TOPIC_EXTRA_KO_EN: Record<string, string> = {
  룩북: "fashion lookbook",
  디저트: "korean dessert",
  파마: "hair perm",
  헤어: "hair salon",
  한옥: "hanok interior",
  스테이: "stay interior",
  네일: "nail art",
};

/**
 * 한국어 주제 → 영문 소재 키워드 (AI 출연자·이미지 프롬프트용).
 * 식재료/메뉴 사전 + 보조 사전으로 핵심 명사만 영문화. 매칭 0건이면 빈 문자열.
 * 예) "여름 수박 케이크" → "watermelon cake patisserie"
 */
export function translateTopicToEN(topic: string): string {
  if (!topic) return "";
  const t = extractVideoTokens(topic);
  const parts: string[] = [...t.ingredients, ...t.menu];
  for (const [ko, en] of Object.entries(TOPIC_EXTRA_KO_EN)) {
    if (topic.includes(ko) && !parts.includes(en)) parts.push(en);
  }
  return parts.slice(0, 3).join(" ").trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 비디오 쿼리 빌더 — 산업 + 추출 토큰 합성, 짧고 또렷한 검색어
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pexels 비디오 검색 최적 쿼리 합성.
 *
 * 예시 입력:
 *   industry="restaurant", topic="5월 봄나물 코스"
 *
 * 출력 흐름:
 *   ingredients: ["spring vegetables namul"]
 *   menu: ["tasting course fine dining plating"]
 *   season: ["spring soft light"]
 *   → "spring vegetables namul tasting course korean fine dining editorial slow motion vertical"
 *
 * 핵심:
 *   - 토픽이 한국어든 영어든 무관하게 영문 키워드만 출력 (Pexels 매칭률↑)
 *   - 토큰이 매칭되면 산업 일반 컨텍스트는 줄이고 토픽 디테일 우선
 *   - 끝에 짧은 톤 키워드만 (긴 modifier 는 Pexels 매칭 정확도 떨어짐)
 */
export function buildVideoQueryDetailed(opts: {
  industry?: Brand["industry"];
  topic?: string;
  /** 캠페인 헤드라인 — 있으면 topic 보다 우선 (더 구체적인 키워드 보유) */
  campaignHeadline?: string;
  /** 사장님 시그니처 메뉴/상품 — 사전 매칭 시 영상에 정밀 반영 */
  signatureMenu?: string[];
  /** 가입 시 정한 브랜드 무드 — 영상 톤(라이팅·채도)에 반영 */
  mood?: Brand["mood"];
  /** 명시적 영문 keyword 가 있으면 그것 우선 (caller 가 결정한 시드) */
  seedQuery?: string;
}): string {
  if (opts.seedQuery && /^[\x20-\x7e\s]+$/.test(opts.seedQuery)) {
    // 시드가 이미 영문이면 그대로
    return opts.seedQuery;
  }

  const industry = opts.industry ?? "restaurant";

  // 토픽 소스 결합 — campaignHeadline 우선, topic, signatureMenu 합쳐서 추출.
  // 사장님이 캠페인 헤드라인을 "5월 봄나물 코스 안내" 로 설정하면 그것이 가장 정확한
  // 영상 매칭 시드. 토픽(릴스 메타 타이틀)은 보조. signatureMenu 는 한식 메뉴 사전 매칭.
  const topicSources: string[] = [];
  if (opts.campaignHeadline) topicSources.push(opts.campaignHeadline);
  if (opts.topic && opts.topic !== opts.campaignHeadline) topicSources.push(opts.topic);
  if (opts.signatureMenu && opts.signatureMenu.length > 0) {
    // 시그니처 메뉴 첫 2개를 추가 — 다국어 사전 매칭 대상
    topicSources.push(opts.signatureMenu.slice(0, 2).join(" "));
  }
  const combinedTopic = topicSources.join(" ");

  const tokens = extractVideoTokens(combinedTopic);

  // 매칭된 디테일이 있으면 산업 컨텍스트는 1단어 정도만, 토픽 디테일 우선
  const hasDetail =
    tokens.ingredients.length > 0 ||
    tokens.menu.length > 0 ||
    tokens.season.length > 0;

  const parts: string[] = [];

  // 1. 매칭된 토픽 디테일 (가장 중요) — ingredients 가 menu 보다 우선
  parts.push(...tokens.ingredients.slice(0, 2));
  parts.push(...tokens.menu.slice(0, 1));

  // 2. 산업 컨텍스트 — 디테일 있으면 짧게, 없으면 풀 컨텍스트
  if (hasDetail) {
    const shortContext: Record<string, string> = {
      restaurant: "korean dining",
      cafe: "cafe",
      dessert: "patisserie",
      beauty: "salon",
      stay: "hanok interior",
      local: "boutique",
    };
    parts.push(shortContext[industry] ?? "korean");
  } else {
    parts.push(INDUSTRY_VIDEO_CONTEXT[industry] ?? "korean editorial");
  }

  // 3. 시즌/시간 — 매칭 있으면 짧게 추가
  if (tokens.season.length > 0) parts.push(tokens.season[0]);
  if (tokens.time.length > 0 && tokens.season.length === 0) parts.push(tokens.time[0]);

  // 3.5 브랜드 무드 — 가입 시 정한 결을 라이팅/채도로 반영 (10단어 한도 전에 우선 배치)
  if (opts.mood && MOOD_VIDEO_EN[opts.mood]) parts.push(MOOD_VIDEO_EN[opts.mood]);

  // 4. 톤 (vertical 포함, editorial minimal aesthetic 자동)
  parts.push(INDUSTRY_VIDEO_TONE[industry] ?? "editorial vertical");

  // 중복 제거 + 10 단어 한도
  const cleaned = parts
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, 10)
    .join(" ");

  return cleaned;
}
