// 바이럴 톤 시스템 프롬프트 빌더
// 모든 GPT 호출 API 가 공통으로 사용 — generate-text / compose-cardnews / generate-blog 등
//
// 핵심 원칙:
//  1) AI 클리셰 박멸 — "특별한", "최고의", "잊지 못할" 같은 GPT 기본톤 강제 제거
//  2) 플랫폼별 grammar 분리 — Reels(감성·저장각), TikTok(1초 훅·반말), Shorts(검색형), Naver(지역형)
//  3) 실시간 context 주입 — 지금 계절/시간/요일/날씨를 GPT 가 자연스럽게 톤에 반영
//  4) 반복 회피 — 같은 단어/패턴 연속 사용 금지
//  5) 사실 추정 금지 — 모르는 가격/시간/인테리어/공정 만들지 말 것

import { getContext, type GenContext, inferContextualMood, type ContextualMood, contextualHashtags } from "./context";

export type Voice = "viral" | "formal";

// 자주 보이는 GPT/AI 클리셰 — 시스템 프롬프트에서 명시적으로 금지
export const AI_CLICHES = [
  // 형용사 클리셰
  "특별한", "특별함을", "특별하게",
  "최고의", "최고예요", "최상의",
  "잊지 못할", "잊지 못할 추억",
  "독특한", "독창적인",
  "유일한", "유일무이한",
  "감동적인", "감동을 선사",
  "정겨운", "정겨움이",
  "포근한", "포근함",
  // 정성/엄선 류
  "정성스런", "정성스럽게", "정성스러운", "정성을 다해", "정성껏",
  "엄선된", "엄선한", "최상의 재료",
  "촘촘한", "정교한 조리", "정교한 추출",
  "신선한 재료로", "신선함이 가득",
  // 카피 클리셰
  "맛있는 음식", "맛있어요", "맛있게 즐기세요",
  "분위기 좋은", "분위기가 좋아요",
  "특별한 경험", "특별한 순간",
  "여러분의 기대에", "여러분을 위해",
  "마음을 담아", "마음을 다해",
  "고객님을 위한", "고객님께 선사",
  "잊지 못할 경험", "기억에 남는",
  "향긋한 한 잔", "향긋한 커피",
  "여유로운 한 잔", "여유로운 시간",
  // 광고 클리셰
  "100%", "100프로",
  "강력 추천", "강추",
  "후회 없는 선택",
  "꼭 한 번 방문",
  "기다리고 있겠습니다",
  "방문해 주세요",
];

// 컨텍스트별 톤 가이드 — GPT 에게 줄 자연어 지침
const MOOD_GUIDE: Record<ContextualMood, string> = {
  "rainy-vibe": "비 오는 날의 감성·차분함·실내 따뜻함을 자연스럽게 녹일 것. '빗소리' '창가' '실내 무드' 같은 디테일 OK.",
  "cozy-night": "야경·저녁·불 켜진 매장의 분위기를 살릴 것. '저녁에', '퇴근 후', '밤에 들르기 좋은' 같은 표현 자연스럽게.",
  "summer-cool": "여름 더위·시원함·휴가 무드를 활용. '이 더위에', '여름엔', '시원한 한 잔' OK.",
  "calm-morning": "주말 오전·차분한 아침·여유로움. '주말 오전에', '아침에 들르기 좋은' OK.",
  "weekend-visit": "주말 방문 유도. '이번 주말', '주말 데이트', '쉬는 날' OK.",
  "energetic": "금요일/퇴근 후의 들뜸·활기. '오늘 같은 금요일', '주말 시작' OK.",
  "standard": "특정 시기적 무드를 무리하게 끼우지 말 것 — 일반 톤으로.",
};

const SEASON_LABEL: Record<GenContext["season"], string> = {
  spring: "봄 (3~5월)",
  summer: "여름 (6~8월)",
  fall: "가을 (9~11월)",
  winter: "겨울 (12~2월)",
};
const DAY_SLOT_LABEL: Record<GenContext["daySlot"], string> = {
  morning: "오전 (6-11시)",
  lunch: "점심 시간대 (11-14시)",
  afternoon: "오후 (14-18시)",
  evening: "저녁 (18-22시)",
  night: "밤 (22-2시)",
  lateNight: "심야 (2-6시)",
};
const WEEK_SLOT_LABEL: Record<GenContext["weekSlot"], string> = {
  weekday: "평일",
  weekend: "주말",
  monFatigue: "월요일",
  fridayHype: "금요일",
};

/**
 * GPT 시스템 프롬프트에 끼울 viral 톤 + 컨텍스트 블록.
 * 호출하는 API 가 자신의 본 시스템 프롬프트 뒤에 이걸 붙임.
 */
export function buildViralMandate(opts: {
  voice?: Voice;
  themeKeyword?: string;
  industryLabel?: string;
  platform?: "reels" | "tiktok" | "shorts" | "naver" | "general";
} = {}): string {
  const voice = opts.voice ?? "viral";
  if (voice === "formal") {
    // 정중체 — 기존 톤 유지. 추가 가드만.
    return `
==== 톤 모드: 정중 존댓말 (formal) ====
- 동네 가게 사장님 톤. ~합니다 / ~드립니다.
- 절제·신뢰. 단정한 표현.

==== 절대 금지 — AI 클리셰 ====
다음 표현은 어떤 형태로도 본문/카피에 들어가지 말 것:
${AI_CLICHES.join(" / ")}

위 단어들이 들어가면 출력이 거부됩니다. 대체 표현을 직접 찾으세요.
예) "특별한 경험" → 그 자리에 구체적 디테일을 넣을 것 (시간/장면/감각 묘사)
예) "정성을 다해" → 실제 무엇을 어떻게 하는지로 대체
예) "여러분을 위해" → 빼고 핵심만`;
  }

  const ctx = getContext();
  const mood = inferContextualMood(ctx, opts.themeKeyword);
  const moodGuide = MOOD_GUIDE[mood];
  const extraHashtags = contextualHashtags(ctx);

  // 플랫폼별 grammar
  const platformGrammar = opts.platform === "tiktok"
    ? `
==== TikTok grammar (1초 훅) ====
- 첫 줄 = 1초 만에 끝나는 짧은 강한 훅. 7~14자.
  예: "이거 봐봐 진짜", "여기 뭐임 진심", "이 가격에 이 양?"
- 본문 = 짧은 단문 2~3개. 평균 8~16자.
- 반말·구어체 우선. "임", "함", "ㄱㄱ", "ㄹㅇ", "찐" 자연스러움 허용.
- 마지막 줄에 행동 유도 (저장/공유/팔로우) 짧게.`
    : opts.platform === "reels"
      ? `
==== Reels grammar (감성·저장 유도) ====
- 첫 줄 = 분위기·감각 묘사 + 저장 유도. 12~20자.
  예: "비 오는 날 가면 분위기 미친 곳", "{도시} 와서 여기 안 가면 손해"
- 본문 = 1~2문장, 감각적 디테일 살리기. 평균 18~30자.
- 톤 = 친근체 + 약간의 감성. "~함", "~인 곳", "~ 진심"
- 마지막에 "저장각", "주말에 박아둬", "친구 태그" 같은 저장 유도.`
      : opts.platform === "shorts"
        ? `
==== Shorts grammar (검색형·정보형) ====
- 제목 = 검색 키워드 + 핵심 정보. "{지역} {카테고리} {지역특성}" 패턴.
  예: "성수 카페 BEST", "강남 한정식 점심 추천", "북촌 한옥스테이 1박"
- 본문 = 정보형. 무엇이/언제/어디가 명확.
- 톤 = 친근체. 정중 ~합니다 보다 ~함/~예요 가 자연스러움.
- 마지막에 "구독 ㄱㄱ", "다음 영상 알림" 같은 채널형 CTA.`
        : opts.platform === "naver"
          ? `
==== Naver Place grammar (지역형·리뷰형) ====
- 제목 = 동네/지역 + 가게명 + 한 줄 핵심.
  예: "광화문 점심 — 70년 노포 메밀국수", "성수 카페 단골이 가는 곳"
- 본문 = 방문 가이드 톤. 동선·시간대·운영 정보 자연스럽게.
- 톤 = 차분한 존댓말도 OK (네이버는 정보 채널). 단 클리셰는 금지.
- 마지막에 "네이버 예약", "길찾기", "단골 후기" 같은 지도형 CTA.`
          : `
==== 일반 grammar ====
- 친근체 우선. ~함 / ~예요 / ~인 곳. 동네 가게 사장님이 직접 SNS 쓰는 톤.
- 한 문장에 형용사 2개 이상 쓰지 말 것 (남발 방지).`;

  return `
==== 톤 모드: 바이럴 (viral) ====
이 카피는 SaaS 광고대행사가 만든 글이 아니라,
**SNS 마케팅 잘하는 동네 가게 사장님이 직접 쓴 글**처럼 보여야 합니다.

기본 톤 규칙:
1. **클리셰 형용사 금지**. 아래 표현 절대 사용 금지:
   ${AI_CLICHES.join(" · ")}
   이 단어들이 출력에 들어가면 즉시 거부됩니다.
2. **추상 표현 대신 구체 디테일**. "정성껏" 대신 "이 한 그릇 들고 나오는 데 30분", "분위기 좋아요" 대신 "창가 자리에서 한 시간이 그냥 감".
3. **친근체·반말체 OK** — "~함", "~인 곳", "~ 진심", "ㄱㅊ", "ㄹㅇ" 자연스럽게 섞임. 너무 어색하게 강한 반말은 피하고, 동네 사장님이 손님한테 말하듯이.
4. **첫 줄이 모든 것** — 첫 줄에서 손님이 멈출지 스크롤할지 결정. 평이한 인사·소개 금지. 무조건 호기심 자극·저장 유도·감각 묘사 중 하나로 시작.
5. **저장/공유/방문 유도** — 마지막 줄에 자연스러운 행동 유도. "저장각", "친구 태그", "주말에 박아둬", "DM 으로 위치", "남들 모르게 가는 곳" 같은 표현 OK.
6. **반복 금지** — 같은 단어가 여러 슬라이드/문단에 등장하지 말 것.

==== 지금 실시간 컨텍스트 (자연스럽게 반영) ====
- 계절: ${SEASON_LABEL[ctx.season]}
- 시간대: ${DAY_SLOT_LABEL[ctx.daySlot]}
- 요일: ${WEEK_SLOT_LABEL[ctx.weekSlot]}
- 무드 가이드: ${moodGuide}

이 컨텍스트는 **무리하게 끼워 넣지 말 것**. 글의 흐름과 자연스럽게 어울릴 때만 사용.
예) 지금이 비/장마면 "비 오는 날 가면 좋은", 주말이면 "이번 주말 데이트", 여름이면 "시원한" 같은 표현이 자연스럽게.

추천 viral 해시태그 (캡션이 해시태그를 포함할 때):
${extraHashtags.length ? `#${extraHashtags.join(" #")}` : "(컨텍스트 해시태그 없음)"}

${platformGrammar}

==== 사실 추정 금지 ====
가격·시간·전화·인증·구체 인테리어·메뉴 가격·운영 빈도 → 알려준 것 외엔 만들지 말 것.
대신: "운영 시간은 매장 인스타", "방문 전 확인 권장", "DM 으로 문의" 같은 안전 표현.`;
}

// 출력 본문에서 클리셰 발견되면 flag (post-validation 용)
export function detectCliches(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const c of AI_CLICHES) {
    if (text.includes(c) || lower.includes(c.toLowerCase())) {
      found.add(c);
    }
  }
  return Array.from(found);
}
