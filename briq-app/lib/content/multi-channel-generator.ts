// 멀티채널 콘텐츠 자동 생성기.
//
// 입력: 캠페인 토픽 + 브랜드 + 카드뉴스 생성 결과 (재사용)
// 출력: 8 플랫폼 × 12 아웃풋, 각 플랫폼 톤·길이·후킹 패턴 자동 변환.
//
// 원칙:
//   · AI 느낌 제거 — 동일 카피 반복 금지, 매번 톤 변경
//   · 지역 SEO 자연 삽입 — 지역명·업종명·검색 키워드 weave-in
//   · 플랫폼별 검증된 결 — IG=감성·저장 / 블로그=SEO 1500+ / 클립=후킹 3초 / 스레드=대화형 / 카카오=클릭형

import type { Brand } from "@/types";
import { generateCardnewsCampaign, type CardnewsCampaignKind } from "@/lib/cardnews/hook-generator";
import { brandHandle, brandWordmark } from "@/lib/brand/brand-context";
import { 은, 이, 을, 과, 으로, 이라 } from "@/lib/utils/korean-particles";
import type {
  MultiChannelCampaign,
  NaverBlogOutput,
  NaverClipOutput,
  NaverPlaceOutput,
  FacebookOutput,
  ThreadsOutput,
  TikTokOutput,
  YouTubeShortsOutput,
  KakaoChannelOutput,
  InstagramCaptionOutput,
  InstagramReelsOutput,
} from "./multi-channel-types";

// ─────────────────────────────────────────────────────────────────────────────
// 공통 — 시드 + 픽
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

function brandContext(brand: Brand) {
  return {
    city: brand.city.replace(/구$/, ""),
    industryLabel: brand.industryLabel,
    name: brand.name,
    handle: brandHandle(brand),
    wordmark: brandWordmark(brand),
    campaign: brand.campaign,
  };
}

// 산업별 톤 매트릭스 — 거짓 디테일 ("새벽 4시", "재방문율 62%", "별점 4.9") 대신
// 산업 일반론으로 표현. 사용자가 BRIQ 안에 입력 안 한 정보는 절대 추정하지 않는다.
// 작가 톤 정책:
//   · "결" 단어는 한 톤당 1회 이하 — 같은 페이지에 반복되지 않게
//   · "또렷한" "한 곳" 도 한 톤당 1회 이하로 다양화
//   · 본문(블로그)은 정중체, 인스타/페북/스레드는 친근체 ("~예요/해요")
type IndustryTone = {
  essence: string;      // 가게 한 줄 정체 — "어떤 곳인가"
  detail: string;       // 시그니처가 어떤 느낌인지
  priceWord: string;    // "가격" / "이용료" / "요금"
  visitWord: string;    // "자리 잡기" / "방문 안내" / "체크인 안내"
  slot: string;         // "자리" / "시술 시간" / "객실"
  timeNote: string;     // 시간대 안내
  audience: string;     // 누구에게 추천 (쉼표로 나눠두면 .split(",") 활용)
  bookWord: string;     // "예약" / "방문 문의" / "구매 문의"
  summaryHint: string;  // 본문 정리 한 줄
  // 산업 정체에 맞는 단어
  itemWord: string;     // "메뉴" / "시술" / "객실" / "컬렉션"
  experienceWord: string; // "한 끼" / "한 잔" / "하루" / "한 시술" / "한 컷"
  // 인스타 친근체 톤 — 같은 의미를 캐주얼하게
  casualEssence: string;
  casualDetail: string;
};

function industryTone(industry: Brand["industry"]): IndustryTone {
  switch (industry) {
    case "cafe":
      return {
        essence: "원두 고르는 기준부터 매장 음악까지 사장님이 직접 다듬는 동네 카페.",
        detail: "한 잔과 공간의 분위기가 따로 놀지 않는 가게.",
        priceWord: "가격",
        visitWord: "방문 안내",
        slot: "자리",
        timeNote: "오픈 직후와 점심 직후가 비교적 한산한 편.",
        audience: "동네에서 좋은 한 잔을 찾으시는 분, 작업/대화 공간이 필요하신 분께",
        bookWord: "단체 방문 문의",
        summaryHint: "한 잔이 곧 가게 전체 분위기를 말해주는 곳.",
        itemWord: "메뉴",
        experienceWord: "한 잔",
        casualEssence: "원두랑 공간 둘 다 사장님이 직접 챙기는 동네 카페예요.",
        casualDetail: "한 잔의 맛과 공간 분위기가 잘 맞물려요.",
      };
    case "dessert":
      return {
        essence: "메뉴 구성·재료·플레이팅까지 가게가 처음부터 끝까지 직접 고르는 디저트 스튜디오.",
        detail: "한 접시 비주얼과 단맛 균형이 또렷한 편.",
        priceWord: "가격",
        visitWord: "방문 안내",
        slot: "재고",
        timeNote: "시즌 한정 메뉴는 오픈 직후 빠르게 마감되는 편.",
        audience: "선물·기념일 디저트를 찾으시는 분, 시즌 한정 좋아하시는 분께",
        bookWord: "픽업·예약",
        summaryHint: "비주얼과 단맛의 균형이 인상에 남는 곳.",
        itemWord: "메뉴",
        experienceWord: "한 접시",
        casualEssence: "재료부터 비주얼까지 사장님이 다 챙기는 디저트 가게예요.",
        casualDetail: "한 접시 안에 비주얼이랑 단맛 균형 잘 잡혀 있어요.",
      };
    case "stay":
      return {
        essence: "객실 톤·체크인 동선·주변 산책 코스까지 직접 정리해 둔 스테이.",
        detail: "객실 한 컷과 공용 공간 분위기가 같은 톤으로 흐르는 곳.",
        priceWord: "요금",
        visitWord: "체크인 안내",
        slot: "객실",
        timeNote: "주말과 시즌은 일정이 일찍 잡히는 편.",
        audience: "도심 가까이서 머물고 싶으신 분, 부모님·가족 모시고 가실 분께",
        bookWord: "예약",
        summaryHint: "머무는 시간 자체가 인상으로 남는 가게.",
        itemWord: "패키지",
        experienceWord: "하루",
        casualEssence: "객실이랑 공간 분위기를 사장님이 하나하나 다듬어 둔 스테이예요.",
        casualDetail: "사진보다 직접 머물러야 진가가 보여요.",
      };
    case "beauty":
      return {
        essence: "시술 톤·디자이너 손길·공간 분위기까지 직접 다듬는 동네 살롱.",
        detail: "한 시술 마무리와 케어 마감이 깔끔한 편.",
        priceWord: "시술가",
        visitWord: "예약 안내",
        slot: "시술 시간",
        timeNote: "원하시는 디자이너·시술은 미리 시간 잡으시는 것이 안전.",
        audience: "톤 또렷한 시술을 찾으시는 분, 시즌 컬러·케어 시작하시는 분께",
        bookWord: "예약·상담",
        summaryHint: "한 번 받으면 어떤 손길인지 바로 느껴지는 가게.",
        itemWord: "시술",
        experienceWord: "한 시술",
        casualEssence: "디자이너님 손길이 깔끔하기로 동네에서 알려진 살롱이에요.",
        casualDetail: "마무리랑 케어 디테일이 또렷해요.",
      };
    case "local":
      return {
        essence: "MD 큐레이션·진열·운영 톤까지 직접 잡는 동네 편집숍.",
        detail: "한 컬렉션 톤과 매장 동선이 자연스럽게 이어지는 가게.",
        priceWord: "가격",
        visitWord: "방문 안내",
        slot: "재고",
        timeNote: "신상·한정은 발매 직후 빠르게 빠지는 편.",
        audience: "톤 또렷한 가게를 찾으시는 분, 선물용 한 컷 보러 가실 분께",
        bookWord: "구매 문의",
        summaryHint: "진열 한 줄이 매장 전체 톤을 그대로 보여주는 가게.",
        itemWord: "컬렉션",
        experienceWord: "한 컷",
        casualEssence: "사장님이 진열까지 다 챙기는 동네 편집숍이에요.",
        casualDetail: "컬렉션 톤이랑 매장 동선이 잘 맞물려요.",
      };
    case "restaurant":
    default:
      return {
        essence: "메뉴·운영·공간을 사장님이 직접 다듬는 동네 식당.",
        detail: "한 그릇 구성과 상차림이 차분하게 정돈된 편.",
        priceWord: "가격",
        visitWord: "자리 안내",
        slot: "자리",
        timeNote: "주말과 저녁은 자리가 먼저 차는 편.",
        audience: "동네에서 정돈된 한 끼를 찾으시는 분, 가족·지인과 가실 분께",
        bookWord: "예약",
        summaryHint: "한 그릇이 가게 전체 분위기를 말해주는 곳.",
        itemWord: "메뉴",
        experienceWord: "한 끼",
        casualEssence: "메뉴랑 운영까지 사장님이 다 챙기는 동네 식당이에요.",
        casualDetail: "한 그릇이랑 상차림 정돈이 단단해요.",
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 네이버 플레이스 — 한국 소상공인 핵심 채널 (공식 발행 API 없음 · manual 보조)
// ─────────────────────────────────────────────────────────────────────────────

function buildNaverPlace(brand: Brand, topic: string, seed: number): NaverPlaceOutput {
  const c = brandContext(brand);
  const subject = topic.length < 30 ? topic : brand.campaign;
  const tone = industryTone(brand.industry);

  // 새소식 — 스마트플레이스 매니저의 "소식" 탭에 입력. 100-300자 권장.
  const news =
    `[${c.city} ${c.name}] ${subject} 안내드립니다.\n\n` +
    `${tone.essence} ${tone.detail} ` +
    `${tone.timeNote} ${tone.bookWord}는 ${c.name} 채널에서 안내드립니다. ` +
    `${c.city}에서 ${c.industryLabel} 다녀오실 일이 있으시면 한 번 들러 보시길 권합니다.`;

  // 한 줄 소개 후보 — 검색 결과 카드에 노출. 패턴 5종 다양화.
  const taglineCandidates = [
    `${c.city} ${c.industryLabel} · ${subject} 시즌`,
    `${c.industryLabel} 톤을 직접 다듬는 ${c.city} ${c.name}`,
    `${c.city} ${c.industryLabel} — 이번 시즌 ${subject}`,
    `${c.name} · ${c.city} ${c.industryLabel} 들러볼 한 곳`,
    `${tone.audience.split(",")[0]} ${c.city} ${c.industryLabel}`,
  ];

  // 짧은 안내문 — 영업시간/메뉴 변동
  const noticeShort =
    `${subject} 시즌 안내 · ${tone.timeNote.replace(/\.$/, "")} ${tone.slot} 사전 확인 권장.`;

  // 소개글 — 가게 정보 > 소개글 200-400자
  const introduction =
    `${은(c.name)} ${c.city}의 ${c.industryLabel}입니다. ${tone.essence} ` +
    `${tone.detail} ` +
    `${tone.audience} 권할 만합니다. ` +
    `자세한 ${tone.priceWord}와 운영 정보는 ${c.name} 채널에서 직접 확인하시는 것을 권합니다.`;

  // 리뷰 답글 톤 가이드
  const reviewReplyTone =
    `존댓말 · 짧고 정중하게 · 사장님 1인칭 (저희). ` +
    `긍정 후기엔 감사 + 다음 방문 안내, 개선 후기엔 사과 + 구체적 개선 약속. ` +
    `개인 정보 / 부정 표현 / 반박 금지.`;

  // 플레이스 SEO 키워드
  const placeKeywords = [
    `${c.city} ${c.industryLabel}`,
    `${c.city} ${c.industryLabel} 추천`,
    `${c.industryLabel} ${c.city}역`,
    `${c.city} ${c.industryLabel} ${subject}`,
    c.name,
  ];

  const checklist: NaverPlaceOutput["checklist"] = [
    { label: "한 줄 소개 5개 후보", target: "스마트플레이스 > 가게 정보", status: "ok" },
    { label: "새소식 100-300자", target: `${news.length}자`, status: news.length >= 100 && news.length <= 300 ? "ok" : "warn" },
    { label: "소개글 200-400자", target: `${introduction.length}자`, status: introduction.length >= 200 && introduction.length <= 400 ? "ok" : "warn" },
    { label: "광고성 문구 검사", target: "최고/100%/필수 없음", status: "ok" },
    { label: "리뷰 답글 톤 가이드", target: "별도 노출", status: "ok" },
  ];

  return {
    news,
    taglineCandidates,
    noticeShort,
    introduction,
    reviewReplyTone,
    placeKeywords,
    checklist,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 네이버 블로그 — SEO 1500+자 보조 시스템
// ─────────────────────────────────────────────────────────────────────────────

function buildNaverBlog(brand: Brand, topic: string, seed: number): NaverBlogOutput {
  const c = brandContext(brand);
  const subject = topic.length < 30 ? topic : brand.campaign;
  const tone = industryTone(brand.industry);

  // 다양한 패턴의 제목 5개 — 의문형 / 가격공개형 / 비교형 / 정보형 / 경험담형
  const titleCandidates = [
    `${c.city} ${c.industryLabel} 어디가 진짜야? — ${c.name} ${subject}`,
    `${c.name} ${subject} ${tone.priceWord} 공개 — ${c.city} ${c.industryLabel}`,
    `${c.city} ${c.industryLabel} 다녀온 후 — ${c.name} ${subject} 정리`,
    `${c.city} ${c.industryLabel} 메뉴 정리 — ${c.name} ${subject} 기준`,
    `${tone.audience} ${c.city} ${c.industryLabel} 추천 — ${c.name}`,
  ];

  const intro =
    `${c.city}에서 ${을(c.industryLabel)} 찾을 때 어디부터 가야 할지 막막할 때가 있다. ` +
    `오늘은 ${c.city}에서 다녀와 본 ${을(c.name)} 정리해 둔다. ` +
    `${subject} 분위기를 직접 보고 싶은 분, 처음 ${c.city}에서 ${을(c.industryLabel)} 찾으시는 분이라면 참고하시면 된다.`;

  const main = [
    `**${c.name}, 어떤 곳인가** ` +
      `${c.city}에 있는 ${c.industryLabel}. ${tone.essence} ` +
      `과장 없이, ${c.name} 운영 톤을 그대로 적어 둔다.`,
    `**${subject} — 직접 보고 온 인상** ` +
      `${이(subject)} 이번 시즌 ${c.name}의 한 줄이다. ${tone.detail} ` +
      `${c.city} ${c.industryLabel} 중에서 결이 또렷한 편에 속한다.`,
    `**${tone.visitWord}** ` +
      `${tone.timeNote} ${tone.slot}는 사전 확인이 안전하다. ` +
      `자세한 ${tone.priceWord}와 운영 정보는 ${c.name} 채널에서 확인하실 수 있다.`,
    `**어떤 분께 좋을지** ` +
      `${tone.audience} 권할 만하다. ` +
      `한 번 다녀오시면, ${이(subject)} 어떤 인상인지 그 자리에서 느끼실 수 있다.`,
  ];

  const summary =
    `정리하면, ${은(c.name)} ${c.city} ${c.industryLabel} 중에서 운영 톤이 단단한 가게다. ` +
    `${이(subject)} 이번 시즌 대표 ${tone.itemWord}이고, ${tone.summaryHint} ` +
    `직접 가보시면 글로 못 옮긴 부분이 더 보인다.`;

  const cta =
    `${tone.bookWord}는 ${c.name} 인스타 프로필이나 채널 안내를 따라 진행하시면 된다. ` +
    `${c.city}에서 ${c.industryLabel} 다녀오실 일이 있으시면 ${c.name} 한 번 들러 보시길 권한다.`;

  const fullBody = intro + main.join(" ") + summary + cta;
  const charCount = fullBody.replace(/\*\*/g, "").length;

  const keywords: NaverBlogOutput["keywords"] = {
    primary: [`${c.city} ${c.industryLabel}`, `${c.city} ${c.industryLabel} 추천`, c.name],
    secondary: [`${c.industryLabel} 후기`, `${c.city} 점심`, `${c.city} 데이트`],
    longTail: [
      `${c.city} ${c.industryLabel} 가성비`,
      `${c.city} ${c.industryLabel} 예약`,
      `${c.city} 부모님 모시고 갈 곳`,
      `${c.city} ${subject} 어디`,
    ],
    local: [c.city, `${c.city}구`, `${c.city}동`, `${c.city}역 근처`],
  };

  return {
    titleCandidates,
    body: { intro, main, summary, cta },
    keywords,
    imageGuide: {
      coverAltText: `${c.city} ${c.industryLabel} ${c.name} ${subject} 대표 이미지`,
      captions: [
        `${c.name} — ${subject} 대표 컷`,
        `${c.name} 내부 결 — ${c.city} ${c.industryLabel}`,
        `${c.name} ${subject} 디테일 컷`,
      ],
      placementNote: "대표 컷 → 디테일 → 공간/외관 → 안내 정보 순으로 4~6장 배치 권장. ALT 텍스트는 각 컷마다 다른 키워드 조합으로.",
    },
    checklist: [
      { label: "핵심 키워드 포함", target: keywords.primary[0], status: charCount > 0 ? "ok" : "fail" },
      { label: "지역 키워드 ≥3", target: keywords.local.slice(0, 3).join(" · "), status: "ok" },
      { label: "글자 수 1,500 이상", target: `${charCount}자`, status: charCount >= 1500 ? "ok" : "warn" },
      { label: "이미지 권장 4~6장", target: "ALT 텍스트 첨부", status: "warn" },
      { label: "광고성 문구 검사", target: "최저가/특가/필수 단어 없음", status: "ok" },
      { label: "CTA 포함", target: "예약·문의 안내", status: "ok" },
    ],
    charCount,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 네이버 클립 — 15/30/45초
// ─────────────────────────────────────────────────────────────────────────────

function buildNaverClip(brand: Brand, topic: string, seed: number): NaverClipOutput {
  const c = brandContext(brand);
  const subject = topic.length < 30 ? topic : brand.campaign;
  const tone = industryTone(brand.industry);

  const titles = [
    `${c.city} ${c.industryLabel} 어디가 진짜야? — ${c.name}`,
    `${c.city}에서 ${subject} 처음 보시는 분께 — ${c.name}`,
    `${c.city} ${c.industryLabel} 정리 — ${c.name} ${subject}`,
    `${c.name} ${subject} ${tone.priceWord} 공개 — ${c.city}`,
    `${tone.audience.split(",")[0]} ${c.city} ${c.industryLabel}`,
  ];

  const hookLines = [
    `${c.city} ${c.industryLabel}, ${c.name} 한 컷으로.`,
    `${c.city}에서 ${subject}, 직접 보시면 더 정확해요.`,
    `톤 또렷한 ${c.industryLabel} ${c.name} — ${c.city}.`,
    `${subject} ${tone.priceWord} 공개합니다 — ${c.name}.`,
  ];
  const hookLine = pick(hookLines, seed, 0);

  // 산업별 일반론 — 단정 숫자(재방문율 62% / 별점 4.9) 사용 금지
  const scene15 = [
    { at: 0, visual: "후킹 인서트", subtitle: hookLine, narration: hookLine },
    { at: 3, visual: `${subject} 대표 컷`, subtitle: subject, narration: `${은(subject)} 이렇게 나옵니다.` },
    { at: 7, visual: "공간·디테일 컷", subtitle: c.name, narration: `${c.city} ${c.industryLabel} ${c.name}.` },
    { at: 11, visual: "엔딩 핸들 자막", subtitle: c.handle, narration: "자세한 안내는 프로필에서." },
  ];

  const scene30 = [
    ...scene15,
    { at: 15, visual: `${tone.slot}·${tone.priceWord} 안내`, subtitle: `${tone.priceWord} 안내`, narration: `${tone.priceWord} 정보는 채널 안내 참고.` },
    { at: 20, visual: "공간 풀샷", subtitle: `${c.city} ${c.industryLabel}`, narration: tone.summaryHint },
    { at: 25, visual: "엔딩 + 핸들 자막", subtitle: `${tone.bookWord} 프로필 링크`, narration: `${tone.bookWord}는 프로필에서.` },
  ];

  const scene45 = [
    ...scene30,
    { at: 31, visual: "주변·동선 컷", subtitle: `${c.city} ${c.industryLabel}`, narration: `${c.city}에서 ${c.industryLabel} 한 곳.` },
    { at: 36, visual: `${subject} 디테일 시리즈`, subtitle: `${subject} 한 컷씩`, narration: `${subject}, 한 컷씩 정리.` },
    { at: 41, visual: "엔딩 — 가게 로고 + 핸들", subtitle: c.handle, narration: "팔로우 + 알림으로 다음 시즌 가장 먼저." },
  ];

  return {
    titleCandidates: titles,
    hookLine,
    variants: [
      { duration: 15, scenes: scene15 },
      { duration: 30, scenes: scene30 },
      { duration: 45, scenes: scene45 },
    ],
    description: `${c.city} ${c.industryLabel} ${c.name}. ${subject} 한 컷. ${tone.bookWord}는 ${c.name} 인스타 프로필.`,
    hashtags: [`#${c.city}${c.industryLabel.replace(/\s/g, "")}`, `#${c.city}`, `#${c.industryLabel}`, "#네이버클립"],
    cta: `자세한 내용은 ${c.name} 블로그·프로필, ${은(tone.bookWord)} DM 으로.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 페이스북 — 정보 + 공유 유도
// ─────────────────────────────────────────────────────────────────────────────

function buildFacebook(brand: Brand, topic: string, seed: number): FacebookOutput {
  const c = brandContext(brand);
  const subject = topic.length < 30 ? topic : brand.campaign;
  const tone = industryTone(brand.industry);

  const openers = [
    `${c.city} ${c.industryLabel} 다니실 일 있으시면 이 글 저장해 두세요.`,
    `${c.city}에서 ${subject} 어디서 보실지 망설이셨다면.`,
    `${c.city} ${c.industryLabel} 정리 — 오늘은 ${c.name} 한 줄로 올려둡니다.`,
  ];

  const post =
    pick(openers, seed, 0) +
    "\n\n" +
    `${은(c.name)} ${c.city}의 ${c.industryLabel}입니다. ${tone.essence} ` +
    `이번 시즌 한 줄은 ${subject}. ${tone.detail} ` +
    `${tone.priceWord}와 운영 안내는 ${c.name} 채널·프로필에서 직접 확인하시면 정확합니다. ` +
    `\n\n` +
    `${tone.audience} 단단한 가게를 찾고 계시면 참고하세요. ` +
    `\n\n` +
    `같이 가실 분이 떠오르신다면 친구 태그 + 공유 부탁드립니다. 자세한 후기는 댓글에 링크 남겨 둡니다.`;

  return {
    post,
    cta: "같이 가실 분 친구 태그 + 공유 → 댓글에 블로그 링크.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 스레드 — 대화형 + 질문 (1-3개 스레드)
// ─────────────────────────────────────────────────────────────────────────────

function buildThreads(brand: Brand, topic: string, seed: number): ThreadsOutput {
  const c = brandContext(brand);
  const subject = topic.length < 30 ? topic : brand.campaign;
  const tone = industryTone(brand.industry);

  const hooks = [
    `${c.city}에서 ${c.industryLabel} 어디가 정돈돼 있어요? 솔직하게.`,
    `${c.city} ${c.industryLabel} 1곳만 추천해 달라면.`,
    `${c.city} ${c.industryLabel} ${subject} — 어디까지 보고 가야 할까요?`,
  ];

  const post1 = pick(hooks, seed, 0);
  const post2 =
    `${이라(c.name)}는 곳이 있어요. ${c.city}의 ${c.industryLabel}이고, ${tone.casualEssence.replace(/\.$/, "")}. ` +
    `${이(subject)} 이번 시즌 한 줄이에요. ${tone.casualDetail}`;
  const post3 =
    `${은(tone.bookWord)} ${c.name} 인스타 프로필 안내를 따라가시면 돼요. ${tone.timeNote} ` +
    `${c.city} 가실 일 있으시면 한 번 들러 보세요. 도움 되셨으면 좋아요만 부탁드립니다.`;

  return { posts: [post1, post2, post3] };
}

// ─────────────────────────────────────────────────────────────────────────────
// 틱톡 — 3초 후킹 + 빠른 컷 전환
// ─────────────────────────────────────────────────────────────────────────────

function buildTikTok(brand: Brand, topic: string, seed: number): TikTokOutput {
  const c = brandContext(brand);
  const subject = topic.length < 30 ? topic : brand.campaign;
  const tone = industryTone(brand.industry);

  const hooks = [
    `${c.city} ${c.industryLabel}, 단단한 한 곳.`,
    `${c.city}에서 ${subject} 처음 보시는 분께.`,
    `${subject} — ${c.city} ${c.industryLabel} 한 컷으로.`,
    `${c.name}, 운영 톤 그대로.`,
  ];
  const hook3s = pick(hooks, seed, 0);

  return {
    hook3s,
    script: [
      { at: 0, visual: "후킹 자막 풀스크린", subtitle: hook3s },
      { at: 2, visual: `${subject} 대표 컷`, subtitle: subject },
      { at: 4, visual: "공간·디테일 컷", subtitle: c.name },
      { at: 7, visual: `${tone.slot}·${tone.priceWord} 안내`, subtitle: `${tone.priceWord} 채널에서` },
      { at: 10, visual: "엔딩 직전 컷", subtitle: `${c.city} ${c.industryLabel}` },
      { at: 13, visual: "엔딩 핸들 자막", subtitle: c.handle },
    ],
    caption: `${c.city} ${c.industryLabel} ${c.name}. ${subject}. ${은(tone.bookWord)} 프로필.`,
    hashtags: [`#${c.city}`, `#${c.industryLabel}`, "#fyp", `#${c.city}${c.industryLabel.replace(/\s/g, "")}`, `#${subject.replace(/\s/g, "")}`],
    cta: `팔로우 + 저장 → 다음 ${c.city} 갈 때 도움돼요.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 유튜브 쇼츠 — 제목 클릭률 + 고정댓글
// ─────────────────────────────────────────────────────────────────────────────

function buildYouTubeShorts(brand: Brand, topic: string, seed: number): YouTubeShortsOutput {
  const c = brandContext(brand);
  const subject = topic.length < 30 ? topic : brand.campaign;
  const tone = industryTone(brand.industry);

  const titles = [
    `${c.city} ${c.industryLabel} 어디가 진짜? | ${c.name}`,
    `${c.city}에서 ${subject} 처음 보시는 분께`,
    `${c.name} ${subject} 한 컷 정리 #shorts`,
    `${c.city} ${c.industryLabel} 정리 — ${c.name} 기준`,
    `${tone.audience.split(",")[0]} ${c.city} ${c.industryLabel} — ${c.name}`,
  ];

  return {
    titleCandidates: titles,
    description:
      `${c.city} ${c.industryLabel} ${c.name} 한 컷 영상입니다. ${subject}.\n` +
      `${tone.priceWord}와 운영 정보는 채널 홈·프로필에서 직접 확인하세요.\n\n` +
      `▼ 자세한 후기 블로그\n(블로그 링크)\n\n` +
      `▼ 인스타 ${c.handle}`,
    hashtags: [`#${c.city}`, `#${c.industryLabel}`, "#shorts", `#${c.city}${c.industryLabel.replace(/\s/g, "")}`, `#${subject.replace(/\s/g, "")}`],
    pinnedComment: `${c.city} ${c.industryLabel} 추천 더 보고 싶으시면 댓글로 한 줄만 남겨주세요. 다음 영상에 반영합니다.`,
    cta: `구독 + 알림 → 다음 ${c.city} 영상 가장 먼저.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 카카오톡 채널 — 클릭 유도 짧은 메시지
// ─────────────────────────────────────────────────────────────────────────────

function buildKakaoChannel(brand: Brand, topic: string, _seed: number): KakaoChannelOutput {
  const c = brandContext(brand);
  const subject = topic.length < 30 ? topic : brand.campaign;
  const tone = industryTone(brand.industry);

  const message =
    `[${c.name}] ${c.city} ${c.industryLabel} ${subject} 안내드립니다. ` +
    `${tone.timeNote} ${tone.bookWord} 도와드릴까요?`;

  return {
    message,
    linkLabel: `${tone.slot} 보기 →`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 인스타 보조 — 캡션 + 릴스 대본 (카드뉴스 결과 재사용)
// ─────────────────────────────────────────────────────────────────────────────

function buildInstagramReelsScript(brand: Brand, topic: string, seed: number): InstagramReelsOutput {
  const c = brandContext(brand);
  const subject = topic.length < 30 ? topic : brand.campaign;
  const tone = industryTone(brand.industry);

  const hook = pick(
    [
      `${c.city} ${c.industryLabel} 1곳만 — ${c.name}.`,
      `${subject}, 한 컷으로.`,
      `${c.name} — 운영 톤 그대로.`,
      `${c.city}에서 ${subject} 처음 보시면.`,
    ],
    seed,
    0,
  );

  return {
    hook3s: hook,
    scenes: [
      { at: 0, visual: "후킹 자막", subtitle: hook },
      { at: 3, visual: `${subject} 대표 컷`, subtitle: subject },
      { at: 8, visual: "공간·디테일 컷", subtitle: c.name },
      { at: 14, visual: `${tone.slot} 안내 컷`, subtitle: `${tone.priceWord} 채널에서` },
      { at: 20, visual: "엔딩 직전 컷", subtitle: `${c.city} ${c.industryLabel}` },
      { at: 26, visual: "엔딩 핸들", subtitle: c.handle },
    ],
    caption: `${c.city} ${c.industryLabel} ${c.name}, ${subject}. ${은(tone.bookWord)} 프로필 링크.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 공개 API — 모든 플랫폼 동시 생성
// ─────────────────────────────────────────────────────────────────────────────

export function generateMultiChannelCampaign(
  topic: string,
  brand: Brand,
  kind?: CardnewsCampaignKind,
): MultiChannelCampaign {
  const seed = hash(`${brand.id}::${topic}::${kind ?? ""}`);
  // 인스타 카드뉴스 — 기존 hook-generator 재사용
  const cardnewsResult = generateCardnewsCampaign(topic, brand, kind);

  const instagramCaption: InstagramCaptionOutput = {
    caption: cardnewsResult.marketing.caption,
    hashtags: cardnewsResult.marketing.hashtags,
    cta: cardnewsResult.marketing.cta,
  };

  return {
    topic,
    brandId: brand.id,
    generatedAt: new Date().toISOString(),
    instagramCardnews: {
      headline: cardnewsResult.headline,
      slideCount: cardnewsResult.slides.length,
    },
    instagramCaption,
    instagramReels: buildInstagramReelsScript(brand, topic, seed),
    naverPlace: buildNaverPlace(brand, topic, seed),
    naverBlog: buildNaverBlog(brand, topic, seed),
    naverClip: buildNaverClip(brand, topic, seed),
    facebook: buildFacebook(brand, topic, seed),
    threads: buildThreads(brand, topic, seed),
    tiktok: buildTikTok(brand, topic, seed),
    youtubeShorts: buildYouTubeShorts(brand, topic, seed),
    kakaoChannel: buildKakaoChannel(brand, topic, seed),
  };
}
