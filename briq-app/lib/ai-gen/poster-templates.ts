// 업종별 포스터 편집 프롬프트 템플릿(기준).
//
// 사장님이 올린 *실제 사진*을 Nano Banana(image-to-image)로 편집해
// 잡지 화보 같은 에디토리얼 포스터로 다듬는 한국어 프롬프트 모음.
// (가짜 사람 생성과 정반대 — 진짜 피사체를 살려 신뢰를 지킨다.)
//
// 대표 스타일 = 사용자 예시(흰 배경 플랫레이 에디토리얼 인포그래픽:
//   확대 디테일 박스 + 얇은 연결선 + 재료 클로즈업 인셋 + 심플 타이포 설명).
//
// 정직성(CLAUDE.md #7): 프롬프트는 "실제 사진을 살려 다듬는" 편집 지시다.
//   없는 메뉴·허위 정보·가짜 수치·가짜 후기 텍스트는 절대 넣지 않는다.

import type { Industry } from "@/lib/ai-gen/model-scenes";

export type PosterStyleOpts = {
  /** 강조 색상(예: "딥 그린", "#4F5F4B", "테라코타") — 포스터 액센트 톤(색감만, 글자 아님) */
  accentColor?: string;
};

/** 앱이 얹는 한글 텍스트가 들어갈 빈 여백 위치 — 합성기(composePoster)가 이 값으로 위치 결정 */
export type TextZone = "top" | "bottom" | "lower-third";

export type PosterStyle = {
  id: string;
  industry: Industry;
  /** UI 라벨 (한글) */
  label: string;
  /** 한 줄 설명 */
  desc: string;
  /** 앱 텍스트(제목/부제)가 얹힐 빈 여백 위치 */
  textZone: TextZone;
  /** 옵션을 받아 완성된 편집 프롬프트(한국어)를 만든다 */
  prompt: (opts?: PosterStyleOpts) => string;
};

// 모든 포스터 편집에 공통으로 붙는 꼬리 지시(한국어).
// 핵심: AI 는 한글을 깨지게 렌더링하므로 이미지 안에 어떤 글자도 그리지 않는다.
//   텍스트는 앱이 정확한 폰트로 따로 얹으므로, 글자가 들어갈 빈 여백만 확보한다.
//   단순 액자/프레임이 아니라 배경 교체·재구도로 실제로 다르게 보이게 변환한다.
const COMMON_EDIT_TAIL =
  "업로드된 사진의 실제 피사체(음식·제품·공간)는 그대로 알아볼 수 있게 유지하되, 단순히 액자/테두리만 씌우지 말고 배경을 깨끗한 화이트로 교체하고 구도를 재배치해 실제로 다르게 보이도록 변환한다. 9:16 세로 비율. 화이트 톤 미니멀 프리미엄 매거진 감성, 자연광의 부드러운 조명, 넉넉하고 깔끔한 여백. 이미지 안에 어떤 글자·문자·숫자·단어·로고도 그리지 않는다(매우 중요 — AI 는 한글을 깨지게 렌더링한다). 텍스트는 나중에 따로 얹으므로, 글자가 들어갈 깨끗한 빈 여백만 확보한다. 실제로 보이는 것만 다듬을 뿐, 없는 요소·허위 정보·과장 문구는 절대 넣지 않는다. CRITICAL: render NO text, letters, numbers, words, or logos anywhere in the image. Leave clean empty margin space for text to be added later.";

// 옵션 → 추가 지시 조각.
function optTail(opts?: PosterStyleOpts): string {
  if (!opts) return "";
  const parts: string[] = [];
  if (opts.accentColor && opts.accentColor.trim()) {
    parts.push(`강조 색상은 ${opts.accentColor.trim()} 톤으로 절제해서 쓴다(색감만, 글자 아님).`);
  }
  return parts.length ? " " + parts.join(" ") : "";
}

// 프롬프트 빌더 — 본문 + 옵션 + 공통 꼬리.
function build(body: string, opts?: PosterStyleOpts): string {
  return `${body}${optTail(opts)} ${COMMON_EDIT_TAIL}`;
}

// ── 공통 푸드 스타일(restaurant/cafe/dessert 가 공유) ──────────────────────
function foodEditorialInfographic(industry: Industry): PosterStyle {
  return {
    id: `${industry}-editorial-infographic`,
    industry,
    label: "에디토리얼 인포그래픽",
    desc: "흰 배경 플랫레이 · 확대 디테일 박스 + 연결선 + 재료 인셋",
    textZone: "top",
    prompt: (opts) =>
      build(
        "이 음식 사진을 흰 배경의 플랫레이(위에서 내려다본) 에디토리얼 인포그래픽 포스터로 재구성한다. 음식을 중앙에 두고, 주변에 핵심 디테일을 확대한 작은 사각 콜아웃 박스 2~3개를 얇은 가는 연결선으로 음식의 해당 부분과 잇는다. 한쪽에는 주재료를 클로즈업한 둥근/사각 인셋 이미지를 둔다. 콜아웃 박스와 연결선은 글자 없이 가는 선·도형 그래픽으로만 그리고, 라벨 자리는 빈 칸으로 비워둔다. 위쪽에는 제목이 들어갈 큰 빈 여백을 확보하되 글자는 넣지 않는다.",
        opts,
      ),
  };
}

function foodMagazineCover(industry: Industry): PosterStyle {
  return {
    id: `${industry}-magazine-cover`,
    industry,
    label: "감성 매거진 커버",
    desc: "잡지 표지처럼 — 큰 여백 + 깨끗한 화이트 톤",
    textZone: "lower-third",
    prompt: (opts) =>
      build(
        "이 음식 사진을 고급 음식 잡지 표지처럼 재구성한다. 음식을 화면의 주인공으로 크게 살리고, 아래쪽 1/3에는 헤드라인·부제가 들어갈 큰 빈 여백을 확보하되 글자는 넣지 않는다. 넉넉한 여백과 차분한 화이트 톤.",
        opts,
      ),
  };
}

// ── 업종별 스타일 사전 ────────────────────────────────────────────────────
const STYLES: Record<Industry, PosterStyle[]> = {
  restaurant: [
    foodEditorialInfographic("restaurant"),
    {
      id: "restaurant-minimal-menu",
      industry: "restaurant",
      label: "미니멀 메뉴판",
      desc: "메뉴 카드형 — 음식 + 깔끔한 여백",
      textZone: "top",
      prompt: (opts) =>
        build(
          "이 음식 사진을 미니멀한 메뉴판 카드 포스터로 재구성한다. 음식을 깔끔하게 정렬하고, 이름·설명이 들어갈 칸을 가는 헤어라인 구분선으로 잡아두되 글자는 비워둔다. 위쪽에 제목이 들어갈 빈 여백을 확보한다.",
          opts,
        ),
    },
    foodMagazineCover("restaurant"),
  ],
  cafe: [
    {
      id: "cafe-drink-infographic",
      industry: "cafe",
      label: "음료 디테일 인포그래픽",
      desc: "흰 배경 · 음료/원두 확대 콜아웃 + 연결선",
      textZone: "top",
      prompt: (opts) =>
        build(
          "이 음료·원두 사진을 흰 배경의 에디토리얼 인포그래픽 포스터로 재구성한다. 음료(또는 원두)를 중앙에 두고, 거품·층·원두·가니시 등 핵심 디테일을 확대한 작은 콜아웃 박스를 얇은 연결선으로 잇는다. 콜아웃 박스와 연결선은 글자 없이 가는 선·도형 그래픽으로만 그리고, 라벨 자리는 빈 칸으로 비워둔다. 위쪽에 제목이 들어갈 빈 여백을 확보한다.",
          opts,
        ),
    },
    {
      id: "cafe-minimal-menu",
      industry: "cafe",
      label: "미니멀 메뉴판",
      desc: "음료 메뉴 카드 — 가는 구분선 + 여백",
      textZone: "top",
      prompt: (opts) =>
        build(
          "이 음료 사진을 미니멀한 카페 메뉴판 카드 포스터로 재구성한다. 음료를 단정하게 배치하고, 이름·설명이 들어갈 칸을 가는 헤어라인 구분선으로 잡아두되 글자는 비워둔다. 위쪽에 제목이 들어갈 빈 여백을 확보한다.",
          opts,
        ),
    },
    foodMagazineCover("cafe"),
  ],
  dessert: [
    foodEditorialInfographic("dessert"),
    {
      id: "dessert-minimal-menu",
      industry: "dessert",
      label: "미니멀 메뉴판",
      desc: "디저트 카드형 — 가는 구분선 + 여백",
      textZone: "top",
      prompt: (opts) =>
        build(
          "이 디저트 사진을 미니멀한 메뉴판 카드 포스터로 재구성한다. 디저트를 깔끔하게 정렬하고, 이름·설명이 들어갈 칸을 가는 헤어라인 구분선으로 잡아두되 글자는 비워둔다. 위쪽에 제목이 들어갈 빈 여백을 확보한다.",
          opts,
        ),
    },
    foodMagazineCover("dessert"),
  ],
  beauty: [
    {
      id: "beauty-detail-callout",
      industry: "beauty",
      label: "디테일 콜아웃 에디토리얼",
      desc: "흰 배경 · 헤어 결/네일 클로즈업 콜아웃 + 연결선",
      textZone: "top",
      prompt: (opts) =>
        build(
          "이 시술 결과 사진을 흰 배경의 에디토리얼 디테일 콜아웃 포스터로 재구성한다. 결과물(헤어 결·네일·피부 등)을 주인공으로 두고, 디테일을 확대한 작은 콜아웃 박스를 얇은 연결선으로 해당 부분과 잇는다. 콜아웃 박스와 연결선은 글자 없이 가는 선·도형 그래픽으로만 그리고, 라벨 자리는 빈 칸으로 비워둔다. 위쪽에 제목이 들어갈 빈 여백을 확보한다. 사람 얼굴이 보이면 그대로 유지하되 과장하지 않는다.",
          opts,
        ),
    },
    {
      id: "beauty-minimal-pricecard",
      industry: "beauty",
      label: "미니멀 시술 카드",
      desc: "가는 구분선 + 여백 (수치 임의 생성 금지)",
      textZone: "top",
      prompt: (opts) =>
        build(
          "이 사진을 미니멀한 뷰티 시술 안내 카드 포스터로 재구성한다. 결과물을 단정하게 배치하고, 이름·설명이 들어갈 칸을 가는 헤어라인 구분선으로 잡아두되 글자는 비워둔다. 위쪽에 제목이 들어갈 빈 여백을 확보한다.",
          opts,
        ),
    },
  ],
  stay: [
    {
      id: "stay-space-editorial",
      industry: "stay",
      label: "공간 화보",
      desc: "잡지 화보처럼 — 공간을 주인공으로 + 큰 여백",
      textZone: "lower-third",
      prompt: (opts) =>
        build(
          "이 공간 사진을 고급 숙소 잡지 화보 포스터로 재구성한다. 공간(객실·라운지·풍경)을 주인공으로 크게 살리고, 아래쪽 1/3에는 헤드라인·부제가 들어갈 큰 빈 여백을 확보하되 글자는 넣지 않는다. 차분한 화이트 톤과 넉넉한 여백.",
          opts,
        ),
    },
    {
      id: "stay-amenity-infographic",
      industry: "stay",
      label: "어메니티 콜아웃 인포그래픽",
      desc: "흰 배경 · 공간 디테일 확대 콜아웃 + 연결선",
      textZone: "top",
      prompt: (opts) =>
        build(
          "이 공간 사진을 흰 배경의 에디토리얼 인포그래픽 포스터로 재구성한다. 공간을 중심에 두고, 어메니티·뷰·디테일을 확대한 작은 콜아웃 박스를 얇은 연결선으로 해당 위치와 잇는다. 콜아웃 박스와 연결선은 글자 없이 가는 선·도형 그래픽으로만 그리고, 라벨 자리는 빈 칸으로 비워둔다. 위쪽에 제목이 들어갈 빈 여백을 확보한다. 없는 시설은 절대 만들지 않는다.",
          opts,
        ),
    },
  ],
  local: [
    {
      id: "local-lookbook-flatlay",
      industry: "local",
      label: "룩북 플랫레이",
      desc: "흰 배경 플랫레이 · 원단/실루엣 디테일 콜아웃 + 연결선",
      textZone: "top",
      prompt: (opts) =>
        build(
          "이 제품(의류·소품) 사진을 흰 배경의 룩북 플랫레이 에디토리얼 포스터로 재구성한다. 제품을 위에서 내려다본 플랫레이로 두고, 원단 질감·실루엣·디테일을 확대한 작은 콜아웃 박스를 얇은 연결선으로 잇는다. 콜아웃 박스와 연결선은 글자 없이 가는 선·도형 그래픽으로만 그리고, 라벨 자리는 빈 칸으로 비워둔다. 위쪽에 제목이 들어갈 빈 여백을 확보한다.",
          opts,
        ),
    },
    {
      id: "local-product-card",
      industry: "local",
      label: "미니멀 프로덕트 카드",
      desc: "제품 카드형 — 가는 구분선 + 여백",
      textZone: "top",
      prompt: (opts) =>
        build(
          "이 제품 사진을 미니멀한 프로덕트 카드 포스터로 재구성한다. 제품을 단정하게 배치하고, 이름·설명이 들어갈 칸을 가는 헤어라인 구분선으로 잡아두되 글자는 비워둔다. 위쪽에 제목이 들어갈 빈 여백을 확보한다.",
          opts,
        ),
    },
  ],
};

/** 업종별 포스터 스타일 목록(기준). 대표 스타일이 항상 첫 번째. */
export function getPosterStyles(industry: Industry): PosterStyle[] {
  return STYLES[industry] ?? STYLES.restaurant;
}
