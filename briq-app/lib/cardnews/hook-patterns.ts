// 시중 브랜딩 잘된 카드뉴스 패턴 라이브러리.
// 출처: docs/cardnews-branding-research.md
// 29CM · 무신사 매거진 · 콤포타블 · 오설록 · 노티드 · 베이크 · 이솝 한국 등에서
// 반복적으로 보이는 7컷 카드뉴스 구조 · 후크 카피 · CTA 패턴을 코드화.

import type { Brand } from "@/types";

/** 7컷 매트릭스의 각 자리(역할). */
export type SlideRole =
  | "cover"     // 1슬 — 멈춤 유도, 호기심
  | "context"   // 2슬 — 왜 지금인지, 누구에게
  | "story"     // 3슬 — 핵심 메시지 도입
  | "detail"    // 4-5슬 — 제품/메뉴/장면
  | "proof"     // 6슬 — 후기·통계·신뢰
  | "cta";      // 7슬 — 다음 행동 유도

/** 후크 카피 유형 — 시중 잘된 카드뉴스 1슬에서 반복 검증된 7가지 골격. */
export type HookPattern =
  | "situational" // 상황형: 사용자 현재 상황 호출 ("비 오는 화요일에...")
  | "numeric"     // 숫자형: 권위·희소성 ("1년에 60일,")
  | "question"    // 질문형: 답을 찾아 슬라이드 넘김 ("오늘은 어떤 한 잔을...")
  | "promise"     // 약속형: 청자에게 베푸는 톤 ("오늘만큼은 한 시간만 더...")
  | "quote"       // 인용형: 제3자 발화 신뢰 ("'이건 진짜 못 참아'...")
  | "twist"       // 반전형: 의외성 호기심 ("비싸서 망설였는데...")
  | "secret";     // 금기/특별: 비밀 누설감 ("단골만 알던...")

/** 카피 톤 — 어미·어휘 결. */
export type CopyTone =
  | "formal"  // A: 정중 안내체 — 한정식·차·호텔·세리프 브랜드
  | "casual"  // B: 친근 바이럴체 — 디저트·카페·캐주얼
  | "neutral"; // C: 단정 정보체 — 네이버 블로그·정보 카드

/** CTA 강도 — 약 → 강. */
export type CtaIntensity =
  | "gentle"      // 약: "지나가실 때 한 번 들러보세요"
  | "save"        // 중: "이번 시즌 놓치지 마세요. 저장 →"
  | "dm"          // 중: "DM 'BACK' 한 글자만"
  | "link"        // 강: "프로필 링크에서 자리 잡기"
  | "countdown";  // 강: "D-3 · 자리 2남음"

// ─────────────────────────────────────────────────────────────────────────────
// 업종별 권장 톤 매핑 (research §4 사장님 업종 → 톤 매핑 표)
// ─────────────────────────────────────────────────────────────────────────────

export const INDUSTRY_TONE_MAP: Record<Brand["industry"], { primary: CopyTone; secondary: CopyTone }> = {
  restaurant: { primary: "formal", secondary: "neutral" },
  cafe:       { primary: "formal", secondary: "casual"  },
  dessert:    { primary: "casual", secondary: "formal"  },
  beauty:     { primary: "casual", secondary: "formal"  },
  stay:       { primary: "formal", secondary: "neutral" },
  local:      { primary: "casual", secondary: "formal"  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 업종별 권장 7컷 시퀀스 (research §8)
// 각 슬라이드의 역할 + 그 슬라이드에 들어갈 카피 한 줄 가이드.
// ─────────────────────────────────────────────────────────────────────────────

export type SequenceSlot = {
  role: SlideRole;
  copyHint: string;     // 카피 생성기에 줄 한 줄 가이드
  visualHint: string;   // 비주얼 톤 가이드 (이미지 프롬프트에 반영)
};

export const INDUSTRY_SEQUENCE: Record<Brand["industry"], SequenceSlot[]> = {
  restaurant: [
    { role: "cover",   copyHint: "시즌 코스 한 줄 + 가게 결",         visualHint: "큰 음식 사진 · 세리프 헤드라인 오버레이" },
    { role: "context", copyHint: "재료 산지 또는 오늘 들어온 식재",     visualHint: "재료 클로즈업 또는 가마솥" },
    { role: "story",   copyHint: "사장님 손길 / 다듬는 시간 한 줄",     visualHint: "주방 손 동작 컷" },
    { role: "detail",  copyHint: "메뉴 구성 4-5개 리스트",              visualHint: "한 상 차림 또는 메뉴별 컷" },
    { role: "detail",  copyHint: "가격대 + 예약 우선 안내",             visualHint: "예약 시간 · 가격 텍스트 위주" },
    { role: "proof",   copyHint: "단골 후기 한 줄 + 출처",              visualHint: "후기 인용 텍스트 카드" },
    { role: "cta",     copyHint: "프로필 링크 → 자리 잡기",              visualHint: "단색 배경 + 굵은 한 줄" },
  ],
  cafe: [
    { role: "cover",   copyHint: "시즌 한 잔 헤드라인",                visualHint: "한 잔 사진 · 필기체 또는 세리프" },
    { role: "context", copyHint: "원두 산지 또는 추출 과정",            visualHint: "원두 또는 추출 컷" },
    { role: "story",   copyHint: "한 잔에 담기는 풍미 한 줄",            visualHint: "스팀 또는 콜드브루 디테일" },
    { role: "detail",  copyHint: "메뉴 3종 — 사이즈 · 가격",            visualHint: "메뉴 라인업 그리드" },
    { role: "detail",  copyHint: "평일 vs 주말 자리 안내",              visualHint: "매장 분위기 컷" },
    { role: "proof",   copyHint: "단골 손님 한 줄 인용",                visualHint: "후기 인용 텍스트" },
    { role: "cta",     copyHint: "오늘 한 잔 챙기러 오세요",            visualHint: "차분한 단색 + 한 줄" },
  ],
  dessert: [
    { role: "cover",   copyHint: "시즌 디저트 한정 헤드라인",           visualHint: "디저트 사진 · 둥근 산세리프" },
    { role: "context", copyHint: "만드는 과정 한 컷 한 줄",             visualHint: "오븐 또는 손 작업" },
    { role: "story",   copyHint: "한 입에 담기는 재료 한 줄",            visualHint: "단면 컷" },
    { role: "detail",  copyHint: "라인업 3-5종",                        visualHint: "디저트 그리드" },
    { role: "detail",  copyHint: "가격대 + 픽업 안내",                  visualHint: "포장 박스 또는 픽업 컷" },
    { role: "proof",   copyHint: "단골 후기 한 줄 (친근체)",            visualHint: "후기 인용" },
    { role: "cta",     copyHint: "DM 'STRAW' 또는 픽업 예약 링크",      visualHint: "단색 + CTA 강조" },
  ],
  beauty: [
    { role: "cover",   copyHint: "시즌 룩북 헤드라인",                 visualHint: "시술 결과 컷 · 세리프 또는 산세리프" },
    { role: "context", copyHint: "컬러 칩 4종 또는 무드",               visualHint: "컬러 스와치 또는 모델 컷" },
    { role: "story",   copyHint: "시술 시간·결의 마무리 한 줄",         visualHint: "디테일 모발 컷" },
    { role: "detail",  copyHint: "헤어 디자이너 한 줄 소개",            visualHint: "디자이너 인물 또는 작업 컷" },
    { role: "detail",  copyHint: "가격대 + 시술 안내",                  visualHint: "시술 카드 텍스트" },
    { role: "proof",   copyHint: "단골 고객 후기",                      visualHint: "후기 인용" },
    { role: "cta",     copyHint: "예약은 카톡 채널 또는 DM",            visualHint: "단색 + 액션 동사" },
  ],
  stay: [
    { role: "cover",   copyHint: "한 박 한 줄 안내",                    visualHint: "한옥 외관 · 명조 헤드라인" },
    { role: "context", copyHint: "객실 내부 무드",                      visualHint: "객실 인테리어 컷" },
    { role: "story",   copyHint: "공간의 결 한 줄",                    visualHint: "디테일 텍스처 컷" },
    { role: "detail",  copyHint: "패키지 구성 (조식·체크인)",            visualHint: "조식 또는 마당 컷" },
    { role: "detail",  copyHint: "시즌 가격 안내",                      visualHint: "가격표 텍스트 위주" },
    { role: "proof",   copyHint: "다녀가신 분 후기 한 줄",              visualHint: "후기 인용" },
    { role: "cta",     copyHint: "프로필 링크 → 예약하기",              visualHint: "단색 + 한 줄" },
  ],
  local: [
    { role: "cover",   copyHint: "시즌 컬렉션 헤드라인",                visualHint: "룩북 사진 · 명조 또는 영문 세리프" },
    { role: "context", copyHint: "룩 디테일 한 줄",                    visualHint: "디테일 컷" },
    { role: "story",   copyHint: "한 컷의 균형 한 줄",                  visualHint: "원단 텍스처" },
    { role: "detail",  copyHint: "라인업 3-5개",                        visualHint: "그리드 룩북" },
    { role: "detail",  copyHint: "사이즈·가격 안내",                    visualHint: "가격표 텍스트" },
    { role: "proof",   copyHint: "단골 인용",                          visualHint: "후기 인용" },
    { role: "cta",     copyHint: "스토어 픽업 또는 배송",                visualHint: "단색 + 한 줄" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 후크 패턴 7종 (research §3 후크 카피 패턴 7종)
// 각 패턴마다 (산업·시즌·단골 등 컨텍스트와 무관한) 카피 골격을 함수형으로 제공.
// hook-generator 가 자기 풀에 합쳐 사용.
// ─────────────────────────────────────────────────────────────────────────────

/** 후크 카피 빌더가 받는 최소 컨텍스트 — hook-generator 의 Ctx 와 호환. */
export type HookCtx = {
  v: {
    city: string;
    catShort: string;
    signature: string;
    customerWord: string;
    experienceWord: string;
    process: string;
  };
  t: {
    subject?: string;
    timeWord?: string;
    number?: string;
  };
};

/** 7패턴 후크 카피 — 시중 잘된 카드뉴스에서 추출한 1슬 헤드라인 골격. */
export const HOOK_PATTERNS_BY_TYPE: Record<HookPattern, ((c: HookCtx) => string)[]> = {
  situational: [
    // 사용자의 지금 상황을 호출 → 자기 일로 느낌
    (c) => `비 오는 ${c.t.timeWord ?? "오늘"},\n${c.v.experienceWord} 마시기 좋은 곳.`,
    (c) => `퇴근 길에 한 번,\n${c.v.city} ${c.v.catShort} 한 ${c.v.experienceWord}.`,
    (c) => `${c.v.city} 토요일 점심,\n자리 잡기 좋은 곳을 정리해둡니다.`,
  ],
  numeric: [
    // 구체 숫자 → 권위·희소성
    (c) => `1년에 ${c.t.number ?? "60"}일,\n그 ${c.t.number ?? "60"}일이 시작됐습니다.`,
    (c) => `${c.v.city} ${c.v.catShort} 100곳 중,\n이 결을 갖춘 곳은 한 곳.`,
    (c) => `1년에 딱 한 시즌,\n다시 돌아온 ${c.t.subject || c.v.signature}.`,
  ],
  question: [
    // 답을 찾아 슬라이드 넘김
    (c) => `오늘은 어떤 ${c.v.experienceWord}을\n골라드릴까요?`,
    (c) => `${c.v.city}에서 ${c.v.catShort},\n어디까지 가야 진가가 보일까요?`,
    (c) => `${c.t.subject || c.v.signature},\n어디서 제대로 받을지 고민이셨다면.`,
  ],
  promise: [
    // 청자에게 베푸는 톤
    (c) => `오늘만큼은 한 시간만 더,\n편히 머무시도록 자리 비워둡니다.`,
    (c) => `${c.t.timeWord ?? "이번 시즌"} 동안은,\n${c.v.customerWord}부터 먼저 안내드립니다.`,
    (c) => `한 ${c.v.experienceWord},\n${c.v.process} 시간만큼 정성껏 차립니다.`,
  ],
  quote: [
    // 제3자 발화 인용 → 신뢰
    (c) => `"이건 진짜 못 참겠다"\n— 지난 주 ${c.v.customerWord}의 말.`,
    (c) => `"비싸서 망설였는데 또 갔어요"\n— ${c.v.customerWord} 후기 그대로.`,
    (c) => `"여긴 결이 다르다"\n— 다녀가신 분 한 줄.`,
  ],
  twist: [
    // 의외성 → 호기심
    (c) => `비싸 보여 망설였다는 분도\n결국 다시 찾는 ${c.t.subject || c.v.signature}.`,
    (c) => `이 가격에 이게 된다고요?\n${c.v.city} ${c.v.catShort} 한 곳.`,
    (c) => `한 번 가본 분이\n조용히 또 다녀가시는 곳.`,
  ],
  secret: [
    // 비밀 누설감 → 저장 유도
    (c) => `${c.v.customerWord}만 알던\n${c.t.subject || c.v.signature}, 오늘 처음 공개합니다.`,
    (c) => `${c.v.city} 단골들 사이에서\n조용히 도는 ${c.v.catShort} 한 곳.`,
    (c) => `검색해도 잘 안 나오는,\n${c.v.city}의 ${c.v.catShort} 한 곳.`,
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CTA 강도별 카피 (research §7 CTA 패턴 5종)
// ─────────────────────────────────────────────────────────────────────────────

export const CTA_BY_INTENSITY: Record<CtaIntensity, ((c: HookCtx) => string)[]> = {
  gentle: [
    () => `지나가실 때 한 번\n들러보세요.`,
    () => `오늘 한 ${"잔"} 챙기러\n오시는 것도 좋습니다.`,
  ],
  save: [
    (c) => `${c.t.timeWord ?? "이번 시즌"} 놓치지 마세요.\n게시물 저장 →`,
    () => `잊지 않도록\n저장해두세요.`,
  ],
  dm: [
    () => `DM 'BACK' 한 글자만\n보내주세요.`,
    () => `궁금하면 DM 'OPEN'\n자리 비워둡니다.`,
  ],
  link: [
    () => `프로필 링크에서\n자리 잡기 →`,
    () => `예약은 프로필 링크에서,\n자리 빠르게 차요.`,
  ],
  countdown: [
    (c) => `D-${c.t.number ?? "3"} 마감,\n자리 ${c.t.number ?? "2"}만 남았습니다.`,
    (c) => `${c.t.timeWord ?? "오늘"} 23시 마감.\n${c.v.experienceWord} 자리 곧 마감.`,
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 안티패턴 검증용 키워드 (research §9 안티패턴 회피)
// scripts/test-copy-quality.mjs 가 import 해서 0건 회귀.
// ─────────────────────────────────────────────────────────────────────────────

export const COPY_ANTIPATTERNS = {
  exaggeratedClaims: [
    "100% 만족",
    "한국 최고",
    "최고의",
    "유일한",
    "최저가",
    "전국 1위",
    "압도적",
  ],
  saleScreaming: [
    "50% OFF",
    "지금 바로 구매!",
    "놓치면 후회!",
    "오늘만 특가!",
    "마지막 기회!",
  ],
  vagueEnglish: [
    "Brand Story",
    "Special Edition",
    "Limited Edition",
    "New Arrivals",
    "Premium",
    "Best Choice",
  ],
  fabricatedAuthority: [
    "20년 전통",
    "30년 전통",
    "원조",
    "최초",
    "1위",
    "별점 4.9",
    "재방문율",
    "새벽 4시",
  ],
} as const;
