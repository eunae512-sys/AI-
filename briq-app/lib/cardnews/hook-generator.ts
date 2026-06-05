// 인스타 카드뉴스 자동 기획 엔진 — v2.
//
// 같은 (brand, topic) → 같은 결과 (안정적 미리보기).
// 다른 (brand, topic) → 다른 결과 (변형 풀 + 토픽 키워드 직접 박기).
//
// 구조:
//   1. 토픽에서 키워드 명사구 추출 (extractTopicTokens)
//   2. 브랜드 + 토픽 → 결정론적 시드 해시
//   3. 슬롯별(HOOK/PROBLEM/VALUE/PROOF/CTA) 변형 풀에서 시드로 픽
//   4. 변형 풀 안 템플릿이 토픽 키워드 + 브랜드 컨텍스트를 직접 참조
//
// 슬라이드 7장:
//   1. HOOK — 후킹 (저장하게 만든다)
//   2. PROBLEM — 페인포인트
//   3-5. VALUE × 3 — 저장 가치
//   6. PROOF — 사회적 증거
//   7. CTA — 단 하나의 행동

import type { Brand } from "@/types";
import type { CardnewsSlide, CardnewsMarketing, SlideRole } from "@/components/campaigns/types";
import { brandHandle, brandWordmark } from "@/lib/brand/brand-context";
import { 은, 이, 을 } from "@/lib/utils/korean-particles";
// 시중 잘된 카드뉴스 학습 패턴 — 후크 7종 · 업종별 시퀀스 · 톤 매핑.
// 출처: docs/cardnews-branding-research.md (29CM · 무신사 · 콤포타블 · 노티드 등).
import { HOOK_PATTERNS_BY_TYPE } from "@/lib/cardnews/hook-patterns";
import { translateTopicToEN } from "@/lib/cardnews/video-query";

export type CardnewsCampaignKind =
  | "신메뉴"
  | "신상품"
  | "시즌"
  | "단골"
  | "리뷰"
  | "예약"
  | "트렌드"
  | "이벤트";

export type GeneratedCardnewsCampaign = {
  headline: string;
  slides: CardnewsSlide[];
  marketing: CardnewsMarketing;
};

// ─────────────────────────────────────────────────────────────────────────────
// 시드 — 같은 입력엔 같은 출력 (재현 가능), 다른 입력엔 다른 픽
// ─────────────────────────────────────────────────────────────────────────────

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function pick<T>(arr: readonly T[], seed: number, offset: number): T {
  return arr[(seed + offset) % arr.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// 토픽 키워드 추출 — 카피 안에 토픽 명사 그대로 박기 위한 재료
// ─────────────────────────────────────────────────────────────────────────────

type TopicTokens = {
  /** 첫 핵심 명사구 — 헤드라인용 (예: "봄나물 코스", "콜드브루") */
  subject: string;
  /** 시간/시즌 표현 (예: "5월", "어버이날", "여름") */
  timeWord?: string;
  /** 한정/혜택 표현 (예: "한정", "선착순", "특가") */
  limitWord?: string;
  /** 숫자 (예: "5", "10", "100") */
  number?: string;
};

const TIME_PATTERN = /([1-9]|1[0-2])월|어버이날|크리스마스|발렌타인|추석|설|가정의\s*달|봄|여름|가을|겨울|장마|연말|연초|새해|화이트데이|블랙프라이데이/;
const LIMIT_PATTERN = /한정|선착순|특가|반값|D-\d+|D-N/;
// 월·일·주 = 시간 표현 → timeWord 가 이미 잡는다. 카운트로 오용 금지
// ("5월 콜드브루" → number 5 → "5년 만에" / "올해도 5%" 같은 깨진 문장 방지).
const NUM_PATTERN = /(\d+)\s*(개|명|곳|가지|종|컷|장|호|박|인분|팀|벌)/;

/** 제너릭 Dashboard 라벨 ("신메뉴 / 신상품 홍보", "예약·DM 유도" 등) 을
 *  브랜드의 실제 캠페인 명("5월 봄나물 코스" 등) 으로 치환.
 *  → 카피에 "이 신메뉴 / 신상품 홍보 만드는 곳" 같은 깨진 문장 방지. */
function realizedTopic(rawTopic: string, brand: Brand): string {
  const genericMarkers = [
    "신메뉴 / 신상품",
    "신메뉴/신상품",
    "예약·DM",
    "예약/DM",
    "재방문 유도",
    "리뷰 리포스트",
    "트렌드 콘텐츠",
    "시즌 이벤트",
    "리뷰 자동",
    "단골 자동",
    "홍보",
  ];
  const isGeneric = genericMarkers.some((g) => rawTopic.includes(g));
  if (isGeneric && brand.campaign) return brand.campaign;
  return rawTopic;
}

// 캠페인 종류 라벨 단어 — 주제에 "신메뉴 봄나물 코스" 처럼 붙어도 subject 에선 뺀다
// (subject = 진짜 키워드 "봄나물 코스" 가 되도록). 단, 단독으로만 적었으면(=다른 단어
// 없음) subject 를 비우지 않도록 한 단어는 남긴다.
const KIND_LABEL_WORDS = /^(신메뉴|신상품|신상|시즌|단골|리뷰|후기|예약|트렌드|이벤트|홍보|프로모션|행사)$/;

function extractTopicTokens(topic: string): TopicTokens {
  const cleaned = topic.replace(/[—–·]/g, " ").replace(/\s+/g, " ").trim();

  const timeMatch = cleaned.match(TIME_PATTERN);
  const limitMatch = cleaned.match(LIMIT_PATTERN);
  const numMatch = cleaned.match(NUM_PATTERN);

  // 의미 토큰만 추리기 — 시간/한정/숫자 메타 표현 제거. 단, "봄나물" 처럼 시간 단어가
  // 다른 글자와 붙은 복합 명사는 보존하기 위해 '띄어쓰기로 분리된 토큰' 단위로만 메타 제거.
  const metaToken = new RegExp(
    `^(?:${TIME_PATTERN.source}|${LIMIT_PATTERN.source}|${NUM_PATTERN.source})$`,
  );
  const meaningful = cleaned
    .split(" ")
    .filter(Boolean)
    // 캠페인 종류 라벨 단어 제거 ("신메뉴" "신상" 등) — 진짜 키워드만 남게
    .filter((w) => !KIND_LABEL_WORDS.test(w))
    // 단독 메타 토큰(=정확히 "봄" "5월" "한정" "3개") 제거. "봄나물" 은 부분일치라 살아남음.
    .filter((w) => !metaToken.test(w));

  // 첫 4 단어까지를 subject 로. 메타·라벨만 있는 입력이면 정제 전 토큰으로 폴백.
  const subject =
    meaningful.slice(0, 4).join(" ") ||
    cleaned.split(" ").filter((w) => !KIND_LABEL_WORDS.test(w)).slice(0, 4).join(" ") ||
    cleaned;

  return {
    subject,
    timeWord: timeMatch?.[0],
    limitWord: limitMatch?.[0],
    number: numMatch?.[1],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 업종 어휘 — 브랜드 industry 기반 카피 빌딩 블록
// ─────────────────────────────────────────────────────────────────────────────

type Industry = Brand["industry"];

type Vocab = {
  cat: string;          // "한정식" "스페셜티 카페" — 정식 명칭
  catShort: string;     // "한정식" "카페" — 짧은 형
  unit: string;         // 결과물 단위 ("코스" "원두" "케이크" "시술")
  unitPlural: string;   // 다수 표현
  experienceWord: string; // 한 단위 경험 ("한 끼" "한 잔" "한 시술" "한 컷" "한 접시")
  outcomePhrase: string; // 완성 표현 ("한 상의 정성을 차려냅니다" "한 잔의 풍미가 깊어집니다")
  containerNoun: string; // 한 단위 그릇/잔/세션 ("그릇" "잔" "세션" "객실" "착장")
  slot: string;         // 채워지는 단위 ("자리" "객실" "시술 시간" "재고")
  slotBusyPhrase: string; // "자리가 가장 빠르게 차는 시간" — 단어 충돌 방지용 한 줄
  signature: string;    // 시그니처 표현 ("점심 코스" "시즌 원두")
  process: string;      // 과정 표현 ("끓이고" "내리고" "굽고" "다듬고")
  ingredientWord: string; // ("재료" "원두" "결" "원단")
  customerWord: string; // ("손님" "단골" "고객")
  visitWord: string;    // ("다녀가시는" "들르시는" "예약하시는")
  purchaseAction: string; // ("예약" "주문" "방문")
  purchaseWord: string;  // 그 동사형 ("예약하시는" "주문하시는")
  city: string;
};

function vocabFor(brand: Brand): Vocab {
  const city = brand.city.replace(/구$/, "");
  const base = { city };
  switch (brand.industry as Industry) {
    case "cafe":
      return { ...base,
        cat: brand.industryLabel, catShort: "카페", unit: "원두", unitPlural: "원두",
        experienceWord: "한 잔", outcomePhrase: "잔에 향이 더 오래 남습니다",
        containerNoun: "잔", slot: "자리", slotBusyPhrase: "자리가 가장 빠르게 차는 시간",
        signature: "시즌 원두", process: "내리는",
        ingredientWord: "원두", customerWord: "손님", visitWord: "들르시는",
        purchaseAction: "주문", purchaseWord: "주문하시는" };
    case "dessert":
      return { ...base,
        cat: brand.industryLabel, catShort: "디저트", unit: "케이크", unitPlural: "디저트",
        experienceWord: "한 접시", outcomePhrase: "단맛이 과하지 않게 떨어집니다",
        containerNoun: "접시", slot: "재고", slotBusyPhrase: "재고가 가장 빠르게 마감되는 시간",
        signature: "시즌 케이크", process: "굽는",
        ingredientWord: "재료", customerWord: "손님", visitWord: "찾으시는",
        purchaseAction: "주문", purchaseWord: "주문하시는" };
    case "beauty":
      return { ...base,
        cat: brand.industryLabel, catShort: "헤어", unit: "시술", unitPlural: "시술",
        experienceWord: "한 시술", outcomePhrase: "결이 한결 자연스러워집니다",
        containerNoun: "세션", slot: "예약", slotBusyPhrase: "예약이 가장 빠르게 차는 시간",
        signature: "시즌 컬러", process: "잡는",
        ingredientWord: "결", customerWord: "고객", visitWord: "예약하시는",
        purchaseAction: "예약", purchaseWord: "예약하시는" };
    case "stay":
      return { ...base,
        cat: brand.industryLabel, catShort: "한옥스테이", unit: "1박", unitPlural: "1박",
        experienceWord: "하루", outcomePhrase: "방 안 공기가 달라집니다",
        containerNoun: "객실", slot: "객실", slotBusyPhrase: "객실이 가장 빠르게 차는 시즌",
        signature: "1박 패키지", process: "맞이하는",
        ingredientWord: "공간", customerWord: "손님", visitWord: "머무시는",
        purchaseAction: "예약", purchaseWord: "예약하시는" };
    case "local":
      return { ...base,
        cat: brand.industryLabel, catShort: "패션", unit: "룩", unitPlural: "룩",
        experienceWord: "한 컷", outcomePhrase: "핏이 몸에 자연스럽게 붙습니다",
        containerNoun: "착장", slot: "재고", slotBusyPhrase: "신상이 가장 빠르게 빠지는 시간",
        signature: "시즌 룩", process: "고르는",
        ingredientWord: "원단", customerWord: "고객", visitWord: "둘러보시는",
        purchaseAction: "주문", purchaseWord: "주문하시는" };
    case "restaurant":
    default:
      return { ...base,
        cat: brand.industryLabel, catShort: "한정식", unit: "코스", unitPlural: "코스",
        experienceWord: "한 끼", outcomePhrase: "국물 맛이 한층 깊어집니다",
        containerNoun: "그릇", slot: "자리", slotBusyPhrase: "자리가 가장 빠르게 차는 시간",
        signature: "점심 코스", process: "다듬는",
        ingredientWord: "재료", customerWord: "단골", visitWord: "다녀가시는",
        purchaseAction: "예약", purchaseWord: "예약하시는" };
  }
}

// 업종이 '먹는' 결인지 — "잘 먹어요 / 찐맛집 / 맛집" 류 표현은 음식 업종에서만.
function isFoodIndustry(ind: Brand["industry"]): boolean {
  return ind === "restaurant" || ind === "cafe" || ind === "dessert";
}

// "찐맛집" 대체 — 업종별 '잘하는 곳' 한 단어 (비-음식 업종 문맥 보호)
function placeWord(ind: Brand["industry"]): string {
  switch (ind) {
    case "beauty": return "단골 많은 곳";
    case "stay": return "머물기 좋은 곳";
    case "local": return "자주 찾는 곳";
    default: return "찐맛집";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 슬롯별 변형 풀
// ─────────────────────────────────────────────────────────────────────────────

type Ctx = {
  brand: Brand;
  v: Vocab;
  t: TopicTokens;
  kind: CardnewsCampaignKind;
  topic: string;
};

// HOOK — 캠페인 종류별 후킹 패턴 (마케팅 전문가 결).
// 한국 소상공인 인스타에서 저장·공유·댓글 검증된 키워드 강제: 저장각·찐맛집·줄서는·꿀팁·노하우·한정·D-N

// HOOK 신메뉴 — 마케팅 전문가 결, 자연스러운 한국어 문장
const HOOK_NEW_MENU: ((c: Ctx) => string)[] = [
  // 숫자 후킹
  (c) => `${c.v.city} ${c.v.catShort} 100곳 중,\n${을(c.t.subject || c.v.signature)} 이렇게 하는 곳은 1곳.`,
  (c) => `${c.t.subject || c.v.signature}.\n${c.v.city}에서 아직 안 드셔보셨다면 오늘 한 번.`,
  // 시간 한정
  (c) => `${c.t.timeWord ?? "이번 시즌"} 한정,\n${c.t.subject || c.v.signature}.`,
  (c) => `1년에 60일,\n그 60일이 시작됐습니다. ${c.t.subject || c.v.signature}.`,
  // 권위
  (c) => `${c.t.subject || c.v.signature},\n사장님이 직접 손대는 가게입니다.`,
  (c) => `${c.v.catShort} 톤을 오래 다듬어 온\n${c.v.city}의 한 가게, ${c.t.subject || c.v.signature}.`,
  // 가성비
  (c) => `${c.v.city} ${c.v.catShort},\n${c.t.subject || c.v.signature} 한 번은 가볼 만한 가게.`,
  // 사회적 증거
  (c) => `찾는 사람 많은 ${c.v.city} ${c.v.catShort},\n그 이유는 ${c.t.subject || c.v.signature} 하나.`,
  (c) => `${c.v.city} 진짜 ${placeWord(c.brand.industry)},\n${c.t.subject || c.v.signature} 한 번이면 압니다.`,
  // 비밀 / 노하우
  (c) => `${c.v.city} 단골들만 알던 ${c.t.subject || c.v.signature},\n오늘 처음 공개합니다.`,
  // 인생
  (c) => `${c.v.city} 인생 ${c.v.unit} 한 줄,\n${c.t.subject || c.v.signature}.`,
];

const HOOK_SEASON: ((c: Ctx) => string)[] = [
  // D-N 카운트다운
  (c) => `${c.t.timeWord ?? "이번 시즌"} ${c.t.subject || c.v.signature},\n${c.v.slot} 곧 마감입니다.`,
  (c) => `${c.t.timeWord ?? "올해"} ${c.t.subject || c.v.signature},\n작년에 놓치셨다면 올해는 미리.`,
  // 시간 한정성
  (c) => `${c.t.timeWord ?? "이번 시즌"} 한 번뿐인 ${c.t.subject || c.v.unit}.\n자리 ${c.t.limitWord ?? "한정"}, 빠르게.`,
  (c) => `${c.t.timeWord ?? "5월"}이라\n가능한 ${c.t.subject || c.v.unit}. 다음은 1년 뒤.`,
  // 작년 통계 인용 — 권위
  (c) => `${c.t.timeWord ?? "어버이날"} 직전 주\n예약 평소 대비 +2.4배. 미리 잡으세요.`,
  (c) => `작년 ${c.t.timeWord ?? "어버이날"} 다녀가신 분,\n올해도 같은 자리 비워둡니다.`,
  // 가족·관계 후킹
  (c) => `${c.t.timeWord ?? "어버이날"},\n${c.v.city}에서 부모님 챙겨드리기 좋은 곳.`,
  // 가장 먼저
  (c) => `${c.v.city} ${c.v.catShort} 중,\n${c.t.timeWord ?? "시즌"} 가장 먼저 ${c.v.purchaseAction} 받습니다.`,
];

const HOOK_RETURNING: ((c: Ctx) => string)[] = [
  // 단골 비밀 후킹
  (c) => `${c.v.customerWord}만 아는\n${c.t.subject || c.v.signature}, ${c.t.timeWord ?? "이맘때"}에만 나와요.`,
  (c) => `오래된 ${c.v.customerWord}께\n먼저 살짝 알려드려요.`,
  // 1년 만에
  (c) => `1년 만에 다시 오시는 분,\n자리 미리 비워둘게요.`,
  // 한 번 와본 분만
  (c) => `한 번 다녀가신 분께만\n조용히 드리는 안내예요.`,
  // 다시 오시는 이유
  (c) => `${c.v.city} ${c.v.catShort} 중,\n다시 ${c.v.visitWord} 분이 많은 한 곳.`,
  // 단골 가격
  (c) => `오래 와주신 분께 드리는\n${c.t.timeWord ?? "이번"} 안내예요.`,
  // 안 잊는 가게
  (c) => `1년에 한 번이라도 들르셨다면,\n이번 소식도 한 번 보세요.`,
];

const HOOK_REVIEW: ((c: Ctx) => string)[] = [
  // 반전 후킹
  (c) => `"비싸서 망설였는데\n다음에 또 갔어요" — ${c.v.customerWord} 후기.`,
  (c) => `"이 가격에 이게 된다고요"\n— 지난 주 ${c.v.customerWord}의 말.`,
  // 다녀간 분들 후기
  (c) => `${c.v.city} ${c.v.catShort},\n다녀간 분들 후기 한 줄로 모았습니다.`,
  // 정돈된 한 곳
  (c) => `${c.v.city} ${c.v.catShort},\n다녀간 분들이 비슷한 말을 해요.`,
  // 줄서는 이유
  (c) => `${c.v.city} ${c.v.catShort},\n다녀간 분들 말씀이 닿는 곳.`,
  // 입소문 후킹
  (c) => `${c.v.customerWord} 후기 모음,\n${c.v.city} ${c.v.catShort} 한 곳.`,
];

const HOOK_TREND: ((c: Ctx) => string)[] = [
  // 검색 트렌드
  (c) => `요즘 ${c.v.city}에서 가장 많이\n검색되는 ${c.v.catShort} 패턴 공개.`,
  (c) => `${c.v.city} ${c.v.catShort} 저장 상위 ${c.t.number ?? "3"}곳,\n오늘 알려드립니다.`,
  // 동네 질문
  (c) => `${c.v.city}에서 ${c.v.catShort},\n어디까지 가봐야 진가가 보일까요?`,
  // 동네 후킹
  (c) => `${c.v.city} 사람들이 요즘\n가장 자주 가는 동네 ${c.v.catShort}.`,
  // 가까운
  (c) => `${c.v.city} 직장인 점심,\n진짜 자주 가는 ${c.v.catShort} 패턴.`,
];

const HOOK_EVENT: ((c: Ctx) => string)[] = [
  (c) => `${c.t.subject || "이벤트"}, 선착순 ${c.t.number ?? "10"}분.\n${c.t.timeWord ?? "오늘"}까지만 받아요.`,
  (c) => `오늘만 여는 ${c.t.subject || "이벤트"},\n생각 있으시면 미리 연락 주세요.`,
  (c) => `${c.v.customerWord}께 드리는 이벤트,\n댓글이나 디엠으로 알려주세요.`,
];

// 동사 활용 헬퍼 — process(어간) → "process는" 동작 어구로
function processVerb(process: string): string {
  // process = "다듬는" "내리는" "굽는" "잡는" "맞이하는" "고르는"
  // → "다듬으려고" "내리려고" "굽으려고" "잡으려고" "맞이하려고" "고르려고"
  if (process.endsWith("는")) {
    const stem = process.slice(0, -1);
    if (stem.endsWith("내리") || stem.endsWith("고르") || stem.endsWith("잡") || stem.endsWith("맞이하"))
      return stem + "려고";
    return stem + "으려고";
  }
  return process + "려고";
}

function hookPoolFor(kind: CardnewsCampaignKind): ((c: Ctx) => string)[] {
  // 캠페인 종류별 기본 후크 풀 + 리서치 7패턴 (situational/promise/quote/twist) 합치기.
  // 잘된 카드뉴스 사례에서 반복 검증된 후크 골격을 모든 캠페인 종류가 공유.
  const sharedPatterns: ((c: Ctx) => string)[] = [
    ...HOOK_PATTERNS_BY_TYPE.situational,
    ...HOOK_PATTERNS_BY_TYPE.promise,
    ...HOOK_PATTERNS_BY_TYPE.quote,
    ...HOOK_PATTERNS_BY_TYPE.twist,
  ];
  switch (kind) {
    case "신메뉴":
    case "신상품":
      return [...HOOK_NEW_MENU, ...HOOK_PATTERNS_BY_TYPE.numeric, ...HOOK_PATTERNS_BY_TYPE.secret, ...sharedPatterns];
    case "시즌":
    case "예약":
      return [...HOOK_SEASON, ...HOOK_PATTERNS_BY_TYPE.numeric, ...sharedPatterns];
    case "단골":
      return [...HOOK_RETURNING, ...HOOK_PATTERNS_BY_TYPE.secret, ...sharedPatterns];
    case "리뷰":
      return [...HOOK_REVIEW, ...HOOK_PATTERNS_BY_TYPE.quote, ...HOOK_PATTERNS_BY_TYPE.twist];
    case "트렌드":
      return [...HOOK_TREND, ...HOOK_PATTERNS_BY_TYPE.question, ...HOOK_PATTERNS_BY_TYPE.situational];
    case "이벤트":
      return [...HOOK_EVENT, ...HOOK_PATTERNS_BY_TYPE.numeric];
  }
}

// 주제 키워드가 충분히 의미 있는지 — 브랜드 기본 signature 로 폴백된 게 아니라
// 사장님이 친 실제 키워드인지 판단 (2글자 이상 + 한글 포함 + signature 와 다름).
function hasRealSubject(c: Ctx): boolean {
  const s = c.t.subject?.trim() ?? "";
  return s.length >= 2 && /[가-힣]/.test(s) && s !== c.v.signature;
}

// 후크 픽 — 시드로 한 번 고르되, 그게 주제 키워드를 안 담고 있고 주제가 진짜 키워드면
// 풀에서 'subject 를 실제로 출력하는' 템플릿만 추려 시드로 다시 고른다.
// (키워드가 슬라이드 1장 헤드라인에서 사라지는 게 증상의 핵심이었음.)
function pickHookWithSubject(
  pool: ((c: Ctx) => string)[],
  ctx: Ctx,
  seed: number,
  offset: number,
): string {
  const first = pick(pool, seed, offset)(ctx);
  if (!hasRealSubject(ctx)) return first;
  if (first.includes(ctx.t.subject)) return first;
  // subject 를 실제로 렌더에 포함하는 템플릿만 (signature 폴백이 아닌 것)
  const subjectBearing = pool.filter((fn) => {
    try {
      return fn(ctx).includes(ctx.t.subject);
    } catch {
      return false;
    }
  });
  if (subjectBearing.length === 0) return first;
  return pick(subjectBearing, seed, offset)(ctx);
}

// PROBLEM — 페인포인트. 자연스러운 한국어 완성형, 검색 행동 인용.
const PROBLEM_POOL: ((c: Ctx) => string)[] = [
  (c) => `매번 ${은(c.v.purchaseAction)}\n놓치셨다면, 이번엔 미리.`,
  (c) => `"${c.v.city}에서 ${c.v.signature},\n어디가 좋을지 망설였다면."`,
  (c) => `${c.v.city} ${c.v.catShort},\n어디부터 가야 할지 막막하셨다면.`,
  (c) => `비싸다고 망설이셨던 ${c.v.cat},\n이번엔 부담 없이 안내드릴게요.`,
  (c) => `검색만 하다 발걸음\n돌리셨던 분만 읽어주세요.`,
  (c) => `${c.t.timeWord ?? "이번 시즌"}에만 나오는 ${c.v.signature},\n매년 놓치셨다면 이번엔 미리.`,
  (c) => `${c.v.slotBusyPhrase}.\n늘 한 발 늦으셨다면 이번엔 미리.`,
  (c) => `${c.v.city}에서 ${c.v.signature},\n어디서 제대로 받을지 모르셨다면.`,
  (c) => `${c.v.cat}, 처음이라\n어디부터 봐야 할지 막막하셨다면.`,
];

// "산지에서 들어옵니다" 는 물성 있는 업종만 — 무형(숙소·미용)엔 다른 결.
function sourcingLine(c: Ctx): string {
  switch (c.brand.industry) {
    case "stay": return `공간은 매일\n새로 정돈해 둡니다.`;
    case "beauty": return `쓰는 제품은 결에 맞춰\n하나씩 고릅니다.`;
    case "local": return `${은(c.v.ingredientWord)} 시즌마다\n새로 들어옵니다.`;
    default: return `${은(c.v.ingredientWord)} 산지에서\n그날그날 들어옵니다.`;
  }
}

// VALUE — 한국어 자연스러운 완성형 문장. 변수는 문법 안전한 자리에만.
// 정책: 출처 없는 단정 숫자 ("새벽 4시 / 별점 4.9 / 재방문율 62%") 금지.
//      산업 일반론 + 브랜드 입력 값 (saveRate · followers · reachThisMonth) 만 사용.
const VALUE_POOL: ((c: Ctx) => string)[] = [
  // 산지·재료 — 업종 인지 (무형 업종엔 산지 표현 금지)
  (c) => sourcingLine(c),
  // 결과 — 산업별 구체 감각(outcomePhrase)
  (c) => `${c.v.experienceWord} ${c.v.process}\n시간만큼 ${c.v.outcomePhrase}.`,
  // 고집 — 클리셰 대신 단정한 한 줄
  (c) => `요란하게는 안 해도,\n오던 분들은 다 아세요.`,
  (c) => `사장님이 직접 챙기는 ${c.v.signature},\n어디 하나 대충이 없습니다.`,
  // 시그니처
  (c) => `${c.v.customerWord}들이 매번 다시 찾는 건\n따로 있습니다.`,
  // 가격 — 단정 금액 제거, 채널 안내(자연스러운 구어)
  (c) => `${c.v.purchaseAction} 가격은\n${c.brand.name} 채널에 다 적어뒀어요.`,
  // 재방문 — 저장률 단정은 PROOF 에서만
  (c) => `한 번 와본 분이\n조용히 다시 ${c.v.visitWord} 곳입니다.`,
  // 시간대 — 산업별 분기
  (c) => `${c.v.slotBusyPhrase} —\n${c.t.timeWord ?? defaultBusyTime(c.brand.industry)}.`,
  (c) => `붐비는 게 싫으면\n${defaultQuietTime(c.brand.industry)} 좋아요.`,
  // 환대 — 시즌 한정 표현은 VALUE_SEASON_POOL 로 분리(비시즌 캠페인 문맥 보호)
  (c) => `처음 오신 분도 단골처럼\n편하게 계시다 가세요.`,
];

// 산업별 시간대 기본값 — 모든 산업에 "주말 점심" 박는 식당-편향 제거
function defaultBusyTime(industry: Brand["industry"]): string {
  switch (industry) {
    case "cafe": return "주말 오전·점심 직후";
    case "dessert": return "주말 오후";
    case "beauty": return "토요일 오후";
    case "stay": return "주말 · 시즌";
    case "local": return "신상 발매 직후";
    case "restaurant":
    default: return "주말 점심";
  }
}
function defaultQuietTime(industry: Brand["industry"]): string {
  switch (industry) {
    case "cafe": return "평일 오픈 직후가";
    case "dessert": return "평일 오후가";
    case "beauty": return "평일 오전이";
    case "stay": return "평일 입실이";
    case "local": return "평일 오후가";
    case "restaurant":
    default: return "평일 화·수 점심이";
  }
}

// 시즌·예약 캠페인 전용 VALUE — D-N + 카운트다운 + DM 행동 키워드
const VALUE_SEASON_POOL: ((c: Ctx) => string)[] = [
  (c) => `남은 ${c.v.slot},\n생각보다 빠르게 마감되는 ${c.t.timeWord ?? "시즌"}입니다.`,
  (c) => `${c.t.timeWord ?? "이번 시즌"}에만 여는 구성,\n지나면 다음 시즌에 다시 만나요.`,
  (c) => `${은(c.v.purchaseAction)} 디엠이나\n댓글로 편하게 남겨주세요.`,
  (c) => `매년 다시 ${c.v.visitWord} 분부터\n먼저 모십니다.`,
  (c) => `이번 ${c.t.timeWord ?? "시즌"}만 가능한\n${c.v.unitPlural} 조합 ${c.t.number ?? "4"}가지.`,
  (c) => `작년 ${c.t.timeWord ?? "이맘때"} 다녀가신 분,\n올해도 먼저 ${c.v.purchaseWord} 분이 많아요.`,
];

// PROOF — 브랜드 자체 값 (saveRate · followers · reachThisMonth) 만 인용.
// 정책: 출처 없는 단정 숫자 (별점 4.9 / 재방문율 62% / 검색 1위) 금지.
const PROOF_POOL: ((c: Ctx) => string)[] = [
  (c) => `이번 달 저장 ${(c.brand.saveRate ?? 5.4).toFixed(1)}%,\n팔로워 ${Math.round((c.brand.followers ?? 8000) / 100) / 10}k가 보고 있어요.`,
  (c) => `${c.v.purchaseWord} 분 열에 몇은\n그달 안에 다시 옵니다.`,
  (c) => `이번 달 ${Math.round((c.brand.reachThisMonth ?? 40000) / 1000)}k에게 닿았어요.\n대부분 ${c.v.city} 근처 분들.`,
  (c) => `"또 올 것 같아요"\n— 지난주 ${c.v.customerWord} 한마디.`,
  (c) => `"여기 알고 나선\n딴 데를 잘 안 가요" — ${c.v.customerWord} 후기.`,
  (c) => `처음 오신 분도,\n세 번째 오신 분도 있는 곳이에요.`,
];

// CTA — 캠페인 종류별 핵심 행동
type CtaVariant = { slide: string; ctaText: string };

// CTA — 단 하나의 행동 (저장 / DM / 공유 / 팔로우+알림). 마케팅 트리거 단어 강제.
const CTA_NEW_MENU: ((c: Ctx) => CtaVariant)[] = [
  (c) => ({
    slide: `또 생각나실 것 같으면\n저장해두셔도 좋아요.`,
    ctaText: `다음 시즌엔 다른 ${이(c.v.unit)} 나와요. 오실 땐 프로필 링크나 댓글로 편하게 ${c.v.purchaseAction}하세요.`,
  }),
  (c) => ({
    slide: `같이 가면 좋을 분,\n한 명쯤 떠오르시죠.`,
    ctaText: `${c.v.city} 같이 갈 분한테 슬쩍 보내보세요. 다음에 같이 오시면 더 좋아요.`,
  }),
  (c) => ({
    slide: `다음 ${c.v.signature} 준비되면\n먼저 알려드릴게요.`,
    ctaText: `팔로우만 해두시면 다음 ${c.v.signature} 나올 때 먼저 알려드릴게요.`,
  }),
  (c) => ({
    slide: `${c.v.purchaseAction}은 디엠으로\n편하게 남겨주세요.`,
    ctaText: `${c.v.purchaseAction}은 디엠 한 줄이면 돼요. ${c.v.slot} 빠르게 잡아드릴게요.`,
  }),
];

const CTA_SEASON: ((c: Ctx) => CtaVariant)[] = [
  (c) => ({
    slide: `자리 궁금하시면\n디엠으로 편하게 물어보세요.`,
    ctaText: `디엠 주시면 ${c.v.slot} 바로 안내해 드릴게요.`,
  }),
  (c) => ({
    slide: `${c.t.timeWord ?? "이번 시즌"} 지나면\n또 한참 뒤예요.`,
    ctaText: `${c.t.timeWord ?? "이번 시즌"} 안에 오시는 게 좋아요. ${c.v.slot} 한정이라 디엠으로 미리 ${c.v.purchaseAction} 부탁드려요.`,
  }),
  (c) => ({
    slide: `자리 많지 않아요.\n생각 있으시면 미리.`,
    ctaText: `${c.v.slot} 한정이라 일찍 차요. 같이 오실 분 있으면 같이 챙겨 오세요.`,
  }),
  (c) => ({
    slide: `댓글로 인원만\n남겨주시면 돼요.`,
    ctaText: `댓글로 인원만 알려주시면 ${c.v.slot} 잡아둘게요.`,
  }),
];

const CTA_RETURNING: ((c: Ctx) => CtaVariant)[] = [
  (c) => ({
    slide: `오시기 전에 한마디만\n주시면 자리 비워둘게요.`,
    ctaText: `오시기 전에 디엠 한 줄 주시면 ${c.v.customerWord} 자리 따로 비워둘게요.`,
  }),
  (c) => ({
    slide: `팔로우해두시면\n다음 소식 먼저 챙겨드려요.`,
    ctaText: `팔로우만 해두시면 다음 ${c.v.signature} 나올 때 먼저 알려드릴게요.`,
  }),
  (c) => ({
    slide: `단골 안내는\n카카오로 보내드려요.`,
    ctaText: `단골 안내는 카카오 채널로 보내드려요. 프로필 링크에서 채널 추가해두시면 그때그때 챙겨드릴게요.`,
  }),
];

const CTA_REVIEW: ((c: Ctx) => CtaVariant)[] = [
  (c) => ({
    slide: `${c.v.city} 가실 일 있으면\n한 번 떠올려 주세요.`,
    ctaText: `다음에 ${c.v.city} 가실 때 생각나시면 들러주세요. 같이 갈 분한테 보내주셔도 좋아요.`,
  }),
  (c) => ({
    slide: `후기 더 궁금하시면\n프로필에 모아뒀어요.`,
    ctaText: `다녀가신 분들 후기는 프로필 하이라이트 '리뷰'에 모아뒀어요. ${c.v.purchaseAction}은 링크에서.`,
  }),
  (c) => ({
    slide: `망설이는 분 있으면\n슬쩍 보여주세요.`,
    ctaText: `가볼까 말까 하는 분한테 보여주세요. 한 번 다녀가면 왜 그러는지 아실 거예요.`,
  }),
];

const CTA_TREND: ((c: Ctx) => CtaVariant)[] = [
  (c) => ({
    slide: `${c.v.city} 단골집,\n댓글로 한 곳만 알려주세요.`,
    ctaText: `여러분 동네 ${c.v.catShort}도 댓글로 한 줄 부탁드려요. ${c.v.city} 가실 때 서로 도움돼요.`,
  }),
  (c) => ({
    slide: `${c.v.city} 같이 다닐 분,\n한 명쯤 있으시죠.`,
    ctaText: `${c.v.city} ${c.v.catShort} 같이 다니는 분한테 보내보세요. 다음 약속 정할 때 편해요.`,
  }),
  (c) => ({
    slide: `팔로우해두시면\n${c.v.city} 이야기 종종 전해드려요.`,
    ctaText: `팔로우만 해두시면 ${c.v.city} ${c.v.catShort} 이야기 종종 전해드릴게요.`,
  }),
];

function ctaPoolFor(kind: CardnewsCampaignKind) {
  switch (kind) {
    case "신메뉴":
    case "신상품":
      return CTA_NEW_MENU;
    case "시즌":
    case "예약":
    case "이벤트":
      return CTA_SEASON;
    case "단골":
      return CTA_RETURNING;
    case "리뷰":
      return CTA_REVIEW;
    case "트렌드":
      return CTA_TREND;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 이미지 쿼리 — 슬라이드 역할별 + 토픽 명사 직접 박기
// ─────────────────────────────────────────────────────────────────────────────

function translateSubject(subject: string): string {
  // 자주 쓰이는 명사구만 매핑 — 나머지는 영어 산문 부분으로만 들어감
  const map: Record<string, string> = {
    봄나물: "spring greens",
    두릅: "fatsia sprouts",
    곰취: "wild greens",
    산마늘: "wild garlic leaf",
    한정식: "korean fine dining",
    코스: "course meal",
    콜드브루: "cold brew coffee",
    원두: "specialty coffee beans",
    드립: "pour over coffee",
    케이크: "cake slice",
    디저트: "korean dessert",
    수박: "watermelon",
    봄: "spring",
    여름: "summer",
    가을: "autumn",
    겨울: "winter",
    어버이날: "family dinner",
    크리스마스: "christmas",
    한옥: "hanok traditional house",
    룩북: "fashion lookbook",
    컬러: "hair color salon",
    헤어: "hair salon",
    // 음료 — imageQueryFor 1차 빠른 매핑
    레몬에이드: "lemonade",
    레모네이드: "lemonade",
    에이드: "fruit ade sparkling",
    자몽: "grapefruit",
    청귤: "green tangerine",
    한라봉: "hallabong citrus",
    스무디: "fruit smoothie",
    셰이크: "milkshake",
    망고: "mango",
    딸기: "strawberry",
  };
  let out = subject;
  for (const [k, v] of Object.entries(map)) {
    if (subject.includes(k)) {
      out = v;
      break;
    }
  }
  return out;
}

function imageQueryFor(role: SlideRole, ctx: Ctx): string {
  const industryScene: Record<Industry, string> = {
    restaurant: "korean fine dining table",
    cafe: "specialty cafe minimal still life",
    dessert: "korean dessert tablescape",
    beauty: "minimal salon interior chair",
    stay: "warm hanok stay interior",
    local: "neighborhood boutique interior",
  };
  // 가입 시 정한 무드 → 비주얼 스타일(이미지 톤). mood 누락 시 warm 폴백.
  const moodStyle = MOOD_IMAGE_STYLE[ctx.brand.mood ?? "warm"] ?? MOOD_IMAGE_STYLE.warm;
  const tail = `${moodStyle}, editorial magazine, shallow depth of field, film aesthetic, no people`;
  const industrySubject = industryScene[ctx.brand.industry as Industry] ?? industryScene.restaurant;
  // translateSubject 성공 시 그것 우선; 실패(입력 그대로 반환) 시 video-query 사전으로 폴백
  const direct = translateSubject(ctx.t.subject);
  const translated = direct !== ctx.t.subject ? direct : translateTopicToEN(ctx.t.subject);
  // 번역 결과가 있으면 토픽 우선 결합, 완전히 비어있을 때만 industry-only 폴백
  const subject = translated && translated.trim().length > 0
    ? `${translated}, ${industrySubject}`
    : industrySubject;

  // 역할별 구도만 지정 — 톤/분위기는 mood(tail)가 결정하도록 고정 톤 단어 제거
  switch (role) {
    case "hook":
      return `${subject} hero overhead composition, ${tail}`;
    case "problem":
      return `${subject} quiet corner, ${tail}`;
    case "value":
      return `${subject} detail close up, ${tail}`;
    case "proof":
      return `${subject} intimate scene, candid, ${tail}`;
    case "cta":
      return `${subject} welcoming entrance, ${tail}`;
  }
}

// 무드 → 이미지 비주얼 스타일 (가입 시 선택한 결을 Pexels/AI 이미지 톤에 반영)
const MOOD_IMAGE_STYLE: Record<string, string> = {
  warm: "warm golden hour light, cozy inviting, soft natural light",
  modern: "clean minimal, bright airy, crisp high-key, modern editorial",
  moody: "moody cinematic, low-key lighting, deep shadows, dramatic dark tone",
  playful: "bright vivid colors, playful energetic, high saturation",
  natural: "organic natural textures, earthy muted tone, raw daylight, candid",
  luxury: "elegant refined, sophisticated, premium rich contrast, luxurious",
};

// ─────────────────────────────────────────────────────────────────────────────
// 캡션 / 해시태그 / 예상 지표 — 변형 풀
// ─────────────────────────────────────────────────────────────────────────────

// 캡션 오프너 — 한 줄 인스타 본문 시작 (저장각·찐맛집·꿀팁 등 마케팅 키워드 직접 박힘)
const CAPTION_OPENERS: ((c: Ctx) => string)[] = [
  (c) => `${c.v.city} ${c.v.catShort} 다닐 일 있으면 한 번 떠올려 주세요.\n${c.t.subject || c.v.signature}, 요즘 자주들 찾으세요.`,
  (c) => `${c.v.city} 진짜 ${placeWord(c.brand.industry)} 한 곳.\n오늘 ${c.t.subject || c.v.signature} 그대로 보여드립니다.`,
  (c) => `${c.v.customerWord}만 알던 ${c.t.subject || c.v.signature},\n이번 ${c.t.timeWord ?? "시즌"}에만 공개합니다.`,
  (c) => `${c.v.city} ${c.v.catShort} 어디 갈지 막막했다면,\n이 한 ${c.v.unit}만 저장해두세요.`,
  (c) => `${c.t.timeWord ?? "5월"} ${c.t.subject || c.v.signature} 꿀팁 한 줄,\n${c.v.city} 가실 분만 보세요.`,
  (c) => `찾는 사람 많은 ${c.v.city} ${c.v.catShort},\n그 이유 ${c.t.subject || c.v.unit} 한 가지에 다 있습니다.`,
];

// ─────────────────────────────────────────────────────────────────────────────
// 무드 → 카피 톤 (가입 시 정한 결을 글의 목소리에도 반영)
//   · MOOD_HOOK_OFFSET: 같은 캠페인 후크 풀에서 무드별로 다른 후크를 고름
//   · MOOD_CAPTION_OPENER: 인스타 캡션 첫 줄을 무드 톤으로 (문법 안전 — 변수는 자리만)
// ─────────────────────────────────────────────────────────────────────────────
const MOOD_HOOK_OFFSET: Record<string, number> = {
  warm: 0, modern: 1, moody: 2, playful: 3, natural: 4, luxury: 5,
};

const MOOD_CAPTION_OPENER: Record<string, (c: Ctx) => string> = {
  // 따뜻 — 다정하고 편안한 목소리
  warm: (c) => `${c.v.city} ${c.v.catShort} 다니다 괜히 또 생각나는 곳이에요.\n${c.t.subject || c.v.signature}, 가면 마음이 놓여요.`,
  // 모던 — 군더더기 없이 핵심만
  modern: (c) => `${c.v.city} ${c.v.catShort}, 군더더기 없이 깔끔해요.\n${c.t.subject || c.v.signature}, 핵심만 보여드릴게요.`,
  // 무디 — 차분하고 절제된, 아는 사람만
  moody: (c) => `${c.v.city} ${c.v.catShort}, 아는 사람만 조용히 가요.\n${c.t.subject || c.v.signature}, 오늘 살짝 보여드려요.`,
  // 플레이풀 — 가볍고 신나는, 저장 유도
  playful: (c) => `${c.v.city} ${c.v.catShort} 중에 이건 진짜예요.\n${c.t.subject || c.v.signature}, 보면 또 생각나요.`,
  // 내추럴 — 꾸밈없이 솔직한
  natural: (c) => `${c.v.city} ${c.v.catShort}, 꾸밈없이 그대로 좋아요.\n${c.t.subject || c.v.signature}, 보시면 압니다.`,
  // 럭셔리 — 격조 있고 절제된
  luxury: (c) => `${c.v.city}에서 격이 다른 ${c.v.catShort} 한 곳.\n${c.t.subject || c.v.signature}, 아는 분은 이미 알아요.`,
};

// 캡션 본문 라인 — 권위 + 행동 트리거.
// 정책: 출처 없는 단정 숫자 (새벽 4시, 별점 4.9, 재방문율 62%) 금지. 브랜드 자체 값만 인용.
const CAPTION_BODY_LINES: ((c: Ctx) => string)[] = [
  (c) => `· ${sourcingLine(c).replace(/\n/g, " ")}`,
  (c) => `· ${c.v.experienceWord} ${c.v.process} 시간만큼 ${c.v.outcomePhrase}.`,
  (c) => `· 한 번 와본 분이 조용히 다시 ${c.v.visitWord} 곳이에요.`,
  (c) => `· ${이(c.v.customerWord)} 매번 다시 찾는 건 따로 있어요.`,
  (c) => `· ${c.v.slotBusyPhrase} — ${c.t.timeWord ?? defaultBusyTime(c.brand.industry)}.`,
  (c) => `· "또 올 것 같아요" — 지난주 ${c.v.customerWord} 한마디.`,
  (c) => `· 남들 하는 방식 말고, 여기 결대로 합니다.`,
  (c) => `· 붐비는 게 싫으면 ${defaultQuietTime(c.brand.industry)} 좋아요.`,
  (c) => `· ${은(c.v.purchaseAction)} ${c.v.purchaseAction === "예약" ? "프로필 링크나 댓글" : "DM이나 카카오톡"}, 빠르면 그날 답해요.`,
  (c) => `· ${c.v.purchaseAction} 가격은 ${c.brand.name} 채널에 적어뒀어요.`,
  (c) => `· ${c.t.subject || c.v.signature}, 생각날 때 한 번 들러주세요.`,
];

function buildCaption(hook: string, ctaText: string, ctx: Ctx, seed: number): string {
  // 무드가 있으면 그 톤의 오프너, 없으면 기존 풀에서 시드 픽
  const moodOpener = ctx.brand.mood ? MOOD_CAPTION_OPENER[ctx.brand.mood] : undefined;
  const opener = moodOpener ? moodOpener(ctx) : pick(CAPTION_OPENERS, seed, 7)(ctx);
  // body 3줄 — 중복 없이
  const used = new Set<number>();
  const body: string[] = [];
  for (let i = 0; body.length < 3 && i < 30; i++) {
    const idx = (seed + i * 11) % CAPTION_BODY_LINES.length;
    if (used.has(idx)) continue;
    used.add(idx);
    body.push(CAPTION_BODY_LINES[idx](ctx));
  }
  const wordmark = brandWordmark(ctx.brand);
  return [
    hook.replace(/\n/g, " "),
    "",
    opener,
    "",
    body.join("\n"),
    "",
    ctaText,
    "",
    `— ${wordmark}`,
  ].join("\n");
}

function buildHashtags(ctx: Ctx, seed: number): string[] {
  const { v, brand, t, kind } = ctx;
  const brandClean = brand.name.replace(/\s/g, "");

  // 1) 핵심 — 지역 + 업종
  const core = [`#${v.city}${v.catShort}`, `#${v.city}맛집`, `#${v.catShort}`];

  // 2) 롱테일 — 검색 의도 강한 결합
  const longTail = [
    `#${v.city}${v.catShort}추천`,
    `#${v.city}${v.purchaseAction}`,
    `#${v.city}점심`,
  ];

  // 3) 토픽 명사 — 매거진식 단일 명사 태그
  const topicTags: string[] = [];
  if (t.subject && t.subject.length >= 2 && /[가-힣]/.test(t.subject)) {
    const s = t.subject.replace(/\s/g, "");
    topicTags.push(`#${s}`);
    if (s.length > 2) topicTags.push(`#${s}추천`);
  }
  if (t.timeWord) topicTags.push(`#${t.timeWord}`);

  // 4) 캠페인 종류 풀 — 더 다양하게, 검증된 마케팅 태그 위주
  const kindTagPool: Record<CardnewsCampaignKind, string[]> = {
    신메뉴: ["#신메뉴", "#시즌메뉴", `#${v.city}신상`, "#오늘의메뉴", "#한정메뉴"],
    신상품: ["#신상품", "#컬렉션", `#${v.city}신상`, "#시즌신상", "#룩북"],
    시즌: ["#가정의달", "#시즌한정", "#5월한정", "#한정메뉴", "#마감임박"],
    단골: ["#단골이벤트", "#재방문", "#단골선물", "#리텐션", "#단골할인"],
    리뷰: ["#리뷰", "#후기", "#가성비", "#가심비"],
    예약: ["#예약필수", `#${v.city}예약`, "#자리한정", "#예약문의"],
    트렌드: [`#${v.city}동네`, "#로컬", "#트렌드", "#동네맛집"],
    이벤트: ["#이벤트", "#한정", "#기간한정", "#오늘만"],
  };
  const kindPool = kindTagPool[kind];
  const kindTags: string[] = [];
  for (let i = 0; kindTags.length < Math.min(3, kindPool.length) && i < 12; i++) {
    const idx = (seed + i * 7) % kindPool.length;
    if (!kindTags.includes(kindPool[idx])) kindTags.push(kindPool[idx]);
  }

  // 5) 저장 / 공유 / 발견 트리거 — 검증된 인스타 알고리즘 태그
  const triggerPool = [
    "#저장각", "#꿀팁", "#찐맛집", "#인스타맛집",
    "#줄서는맛집", "#입소문", "#인생맛집",
    "#사장님맛집", "#로컬맛집", "#소상공인",
  ];
  const triggerTags: string[] = [];
  for (let i = 0; triggerTags.length < 3 && i < 20; i++) {
    const idx = (seed + i * 13) % triggerPool.length;
    if (!triggerTags.includes(triggerPool[idx])) triggerTags.push(triggerPool[idx]);
  }

  // 6) 브랜드 태그
  const brandTags = [`#${brandClean}`, `#${v.city}`];

  return [...core, ...longTail, ...topicTags, ...kindTags, ...triggerTags, ...brandTags];
}

function buildExpectedMetrics(brand: Brand, kind: CardnewsCampaignKind): CardnewsMarketing["expectedMetrics"] {
  const baseSave = brand.saveRate ?? 4.0;
  const boost: Record<CardnewsCampaignKind, number> = {
    신메뉴: 1.2, 신상품: 1.2, 시즌: 1.4, 예약: 1.5, 이벤트: 1.3,
    단골: 1.1, 리뷰: 1.6, 트렌드: 1.0,
  };
  const saveRate = (baseSave * boost[kind]).toFixed(1);
  const delta = (baseSave * (boost[kind] - 1)).toFixed(1);
  return {
    saveRate: `${saveRate}% (+${delta}%p)`,
    shareRate: kind === "리뷰" || kind === "트렌드" ? "2.4%" : kind === "단골" ? "1.2%" : "1.8%",
    comments: kind === "트렌드" ? "18 ~ 28" : kind === "이벤트" || kind === "예약" ? "14 ~ 22" : "8 ~ 14",
    followConv: kind === "단골" ? "1.4%p" : kind === "신메뉴" ? "2.1%p" : kind === "시즌" ? "1.9%p" : "1.6%p",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 공개 API
// ─────────────────────────────────────────────────────────────────────────────

export function generateCardnewsCampaign(
  topic: string,
  brand: Brand,
  kindOverride?: CardnewsCampaignKind,
): GeneratedCardnewsCampaign {
  // Dashboard 제너릭 라벨 → 브랜드의 실제 캠페인명으로 치환
  const realTopic = realizedTopic(topic, brand);
  const kind = kindOverride ?? inferKindFromTopic(realTopic);
  const seed = hash(`${brand.id}::${realTopic}::${kind}`);
  const v = vocabFor(brand);
  const t = extractTopicTokens(realTopic);
  const ctx: Ctx = { brand, v, t, kind, topic: realTopic };

  const hookPool = hookPoolFor(kind);
  // 같은 캠페인 후크 풀에서 무드별로 다른 후크를 골라 카드 헤드라인도 무드를 탄다
  const moodOffset = MOOD_HOOK_OFFSET[brand.mood ?? "warm"] ?? 0;
  // 주제 키워드가 반드시 후크에 박히도록 — 시드가 주제 무관 템플릿을 골랐고
  // subject 가 브랜드 기본(signature) 과 다른 진짜 키워드면, subject 를 쓰는 후크로 교체.
  const hook = pickHookWithSubject(hookPool, ctx, seed, moodOffset);

  const problem = pick(PROBLEM_POOL, seed, 3)(ctx);

  // VALUE 3개 — 시즌/예약/이벤트 캠페인은 시간 한정 풀에서 1개 + 일반 풀에서 2개 섞기
  const usesSeasonPool = kind === "시즌" || kind === "예약" || kind === "이벤트";
  const values: string[] = [];
  const usedV = new Set<string>();
  if (usesSeasonPool) {
    const sv = pick(VALUE_SEASON_POOL, seed, 5)(ctx);
    values.push(sv);
    usedV.add(sv);
  }
  for (let i = 0; values.length < 3 && i < 40; i++) {
    const v2 = pick(VALUE_POOL, seed, 11 + i * 3)(ctx);
    if (!usedV.has(v2)) {
      values.push(v2);
      usedV.add(v2);
    }
  }

  const proof = pick(PROOF_POOL, seed, 23)(ctx);

  const ctaPool = ctaPoolFor(kind);
  const ctaVariant = pick(ctaPool, seed, 29)(ctx);

  const wordmark = brandWordmark(brand);
  const handle = brandHandle(brand);

  // 호번·발행 결 — 매거진 표지 느낌 (예: "Vol. 24 · 2026.05.17")
  const issueLabel = `Vol. ${(seed % 90) + 10} · ${new Date().toISOString().slice(0, 10).replace(/-/g, ".")}`;
  // PROBLEM·VALUE 슬라이드의 보조 한 줄 — 캡션 풀에서 짧은 한 줄을 픽
  const innerSubtexts = [
    `${v.city} ${v.catShort}`,
    `${kind} · ${t.timeWord ?? "이번 시즌"}`,
    `${이(v.customerWord)} 가장 많이 찾는 ${v.signature}`,
    `${v.signature} 라인`,
  ];

  // 슬라이드별 디자이너 컴포지션 분배 — 7장이 각각 다른 결로 흐른다.
  //   1: masthead (표지)
  //   2: pillar-left (좌측 세로선 + 챕터 넘버럴)
  //   3: paper-split (페이퍼 패널 + 이미지)
  //   4: overlay-card (이미지 + 페이퍼 카드)
  //   5: pillar-left (반복하되 이미지/내용 다름)
  //   6: type-hero (PROOF 슬라이드는 타이포 자체가 비주얼)
  //   7: masthead (CTA — 표지와 짝을 이루는 닫음)
  //
  // 종이 톤도 같은 슬라이드에 같은 색이 두 번 안 나오도록 시드 픽.
  const tones: NonNullable<CardnewsSlide["paperTone"]>[] = ["cream", "dust", "sand", "sage", "ink"];
  const pickTone = (offset: number) => tones[(seed + offset) % tones.length];

  const slides: CardnewsSlide[] = [
    // 1. 표지
    { n: 1, role: "hook", display: "cover", composition: "masthead", caption: hook,
      subtext: t.subject || v.signature,
      footer: issueLabel, ink: "light", textAt: "center",
      imageQuery: imageQueryFor("hook", ctx) },
    // 2. 페인포인트 — 좌측 세로선 결
    { n: 2, role: "problem", display: "inner", composition: "pillar-left", caption: problem,
      subtext: pick(innerSubtexts, seed, 1),
      ink: "light", textAt: "bottom-left",
      imageQuery: imageQueryFor("problem", ctx) },
    // 3. VALUE — 페이퍼 패널 좌측
    { n: 3, role: "value", display: "inner", composition: "paper-split", paperTone: pickTone(2),
      caption: values[0], subtext: pick(innerSubtexts, seed, 2),
      ink: "dark", textAt: "top-left",
      imageQuery: imageQueryFor("value", ctx) },
    // 4. VALUE — 이미지 위 페이퍼 카드 오버레이
    { n: 4, role: "value", display: "inner", composition: "overlay-card", paperTone: pickTone(5),
      caption: values[1], subtext: pick(innerSubtexts, seed, 3),
      ink: "dark", textAt: "center",
      imageQuery: imageQueryFor("value", ctx) },
    // 5. VALUE — 다시 필러 (방향 반전)
    { n: 5, role: "value", display: "inner", composition: "pillar-left", caption: values[2],
      subtext: pick(innerSubtexts, seed, 4),
      ink: "light", textAt: "bottom-left",
      imageQuery: imageQueryFor("value", ctx) },
    // 6. PROOF — 타이포 히어로 (페이퍼 톤 위)
    { n: 6, role: "proof", display: "inner", composition: "type-hero", paperTone: pickTone(8),
      caption: proof, subtext: `${wordmark} · ${v.city}`,
      ink: "dark", textAt: "center",
      imageQuery: imageQueryFor("proof", ctx) },
    // 7. CTA — 표지와 짝, 마감 마스트헤드
    { n: 7, role: "cta", display: "inner", composition: "masthead", caption: ctaVariant.slide,
      subtext: handle, footer: handle, ink: "light", textAt: "center",
      imageQuery: imageQueryFor("cta", ctx) },
  ];

  const marketing: CardnewsMarketing = {
    caption: buildCaption(hook, ctaVariant.ctaText, ctx, seed),
    hashtags: buildHashtags(ctx, seed),
    cta: ctaVariant.ctaText,
    expectedMetrics: buildExpectedMetrics(brand, kind),
  };

  return {
    headline: hook.replace(/\n/g, " "),
    slides,
    marketing,
  };
}

export function inferKindFromTopic(topic: string): CardnewsCampaignKind {
  // 사장님이 캠페인 종류를 명시했으면("신메뉴 봄나물 코스") 그 의도를 시즌 단어보다 우선.
  // (안 그러면 "봄" 한 글자가 신메뉴 의도를 덮어써 시즌 풀로 잘못 라우팅됨.)
  if (/신메뉴/.test(topic)) return "신메뉴";
  if (/신상품|신상|컬렉션|룩북/.test(topic)) return "신상품";
  if (/시즌|봄|여름|가을|겨울|장마|연말|연초|새해|어버이|크리스마스|발렌타인|화이트데이|추석|설|가정의\s*달/i.test(topic)) return "시즌";
  if (/단골|재방문|리텐션/i.test(topic)) return "단골";
  if (/리뷰|후기/i.test(topic)) return "리뷰";
  if (/예약|자리|빈\s*시간/i.test(topic)) return "예약";
  if (/트렌드|동네|로컬|키워드/i.test(topic)) return "트렌드";
  if (/이벤트|한정|기간/i.test(topic)) return "이벤트";
  if (/상품|컬렉션|룩북/i.test(topic)) return "신상품";
  return "신메뉴";
}
