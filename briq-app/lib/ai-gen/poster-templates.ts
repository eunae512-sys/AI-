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
  /** 강조 색상(예: "딥 그린", "#4F5F4B", "테라코타") — 포스터 액센트 톤 */
  accentColor?: string;
  /** 제목/라벨 일부를 감성 손글씨 스타일로 */
  handwriting?: boolean;
  /** 가게명/메뉴명 — 포스터에 텍스트로 활용(없으면 일반 라벨만) */
  signature?: string;
};

export type PosterStyle = {
  id: string;
  industry: Industry;
  /** UI 라벨 (한글) */
  label: string;
  /** 한 줄 설명 */
  desc: string;
  /** 옵션을 받아 완성된 편집 프롬프트(한국어)를 만든다 */
  prompt: (opts?: PosterStyleOpts) => string;
};

// 모든 포스터 편집에 공통으로 붙는 꼬리 지시(한국어).
// 실제 피사체 유지 + 화이트 미니멀 매거진 톤 + 타이포 허용을 못 박는다.
const COMMON_EDIT_TAIL =
  "업로드된 사진의 실제 피사체(음식·제품·공간)는 그대로 알아볼 수 있게 유지하고 구도·배경·레이아웃만 재구성한다. 9:16 세로 비율. 화이트 톤 미니멀 프리미엄 매거진 감성, 자연광의 부드러운 조명, 넉넉하고 깔끔한 여백. 결과물에는 한국어 라벨·짧은 설명 타이포가 포함될 수 있다. 실제로 보이는 것만 다듬을 뿐, 없는 요소·허위 정보·과장 문구는 절대 넣지 않는다.";

// 옵션 → 추가 지시 조각.
function optTail(opts?: PosterStyleOpts): string {
  if (!opts) return "";
  const parts: string[] = [];
  if (opts.accentColor && opts.accentColor.trim()) {
    parts.push(`강조 색상은 ${opts.accentColor.trim()} 톤으로 절제해서 쓴다.`);
  }
  if (opts.handwriting) {
    parts.push("제목이나 라벨 일부를 감성적인 손글씨 스타일 타이포로 표현한다.");
  }
  if (opts.signature && opts.signature.trim()) {
    parts.push(`"${opts.signature.trim()}" 를 가게명·메뉴명 텍스트로 자연스럽게 배치한다.`);
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
    prompt: (opts) =>
      build(
        "이 음식 사진을 흰 배경의 플랫레이(위에서 내려다본) 에디토리얼 인포그래픽 포스터로 재구성한다. 음식을 중앙에 두고, 주변에 핵심 디테일을 확대한 작은 사각 콜아웃 박스 2~3개를 얇은 가는 연결선으로 음식의 해당 부분과 잇는다. 한쪽에는 주재료를 클로즈업한 둥근/사각 인셋 이미지를 둔다. 라벨과 짧은 설명은 심플한 산세리프/명조 타이포로 미니멀하게.",
        opts,
      ),
  };
}

function foodMagazineCover(industry: Industry): PosterStyle {
  return {
    id: `${industry}-magazine-cover`,
    industry,
    label: "감성 매거진 커버",
    desc: "잡지 표지처럼 — 큰 헤드라인 타이포 + 여백",
    prompt: (opts) =>
      build(
        "이 음식 사진을 고급 음식 잡지 표지처럼 재구성한다. 음식을 화면의 주인공으로 크게 살리고, 위쪽 또는 아래쪽에 큰 세리프 헤드라인 타이포와 작은 부제를 잡지 표지 레이아웃으로 배치한다. 넉넉한 여백과 절제된 타이포, 차분한 화이트 톤.",
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
      desc: "메뉴 카드형 — 음식 + 깔끔한 이름 라벨",
      prompt: (opts) =>
        build(
          "이 음식 사진을 미니멀한 메뉴판 카드 포스터로 재구성한다. 음식을 깔끔하게 정렬하고, 옆이나 아래에 메뉴 이름과 간단한 한 줄 설명을 가는 헤어라인 구분선과 함께 타이포로 정리한다. 가격이나 수치는 절대 임의로 지어내지 않는다.",
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
      prompt: (opts) =>
        build(
          "이 음료·원두 사진을 흰 배경의 에디토리얼 인포그래픽 포스터로 재구성한다. 음료(또는 원두)를 중앙에 두고, 거품·층·원두·가니시 등 핵심 디테일을 확대한 작은 콜아웃 박스를 얇은 연결선으로 잇는다. 라벨은 미니멀 타이포로.",
          opts,
        ),
    },
    {
      id: "cafe-minimal-menu",
      industry: "cafe",
      label: "미니멀 메뉴판",
      desc: "음료 메뉴 카드 — 이름 + 가는 구분선",
      prompt: (opts) =>
        build(
          "이 음료 사진을 미니멀한 카페 메뉴판 카드 포스터로 재구성한다. 음료를 단정하게 배치하고 음료 이름과 짧은 설명을 가는 헤어라인 구분선과 함께 타이포로 정리한다. 가격·수치는 임의로 만들지 않는다.",
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
      desc: "디저트 카드형 — 이름 라벨 + 여백",
      prompt: (opts) =>
        build(
          "이 디저트 사진을 미니멀한 메뉴판 카드 포스터로 재구성한다. 디저트를 깔끔하게 정렬하고 이름과 한 줄 설명을 가는 구분선과 함께 타이포로 정리한다. 가격·수치는 지어내지 않는다.",
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
      prompt: (opts) =>
        build(
          "이 시술 결과 사진을 흰 배경의 에디토리얼 디테일 콜아웃 포스터로 재구성한다. 결과물(헤어 결·네일·피부 등)을 주인공으로 두고, 디테일을 확대한 작은 콜아웃 박스를 얇은 연결선으로 해당 부분과 잇는다. 라벨은 미니멀 타이포로. 사람 얼굴이 보이면 그대로 유지하되 과장하지 않는다.",
          opts,
        ),
    },
    {
      id: "beauty-minimal-pricecard",
      industry: "beauty",
      label: "미니멀 시술 카드",
      desc: "시술 이름 + 가는 구분선 (수치 임의 생성 금지)",
      prompt: (opts) =>
        build(
          "이 사진을 미니멀한 뷰티 시술 안내 카드 포스터로 재구성한다. 결과물을 단정하게 배치하고 시술 이름과 짧은 설명을 가는 헤어라인 구분선과 함께 타이포로 정리한다. 가격·할인·수치는 사진에 적혀 있지 않은 한 절대 임의로 만들지 않는다.",
          opts,
        ),
    },
  ],
  stay: [
    {
      id: "stay-space-editorial",
      industry: "stay",
      label: "공간 화보",
      desc: "잡지 화보처럼 — 공간을 주인공으로 + 큰 헤드라인",
      prompt: (opts) =>
        build(
          "이 공간 사진을 고급 숙소 잡지 화보 포스터로 재구성한다. 공간(객실·라운지·풍경)을 주인공으로 크게 살리고, 큰 세리프 헤드라인과 작은 부제를 화보 레이아웃으로 배치한다. 차분한 화이트 톤과 넉넉한 여백.",
          opts,
        ),
    },
    {
      id: "stay-amenity-infographic",
      industry: "stay",
      label: "어메니티 콜아웃 인포그래픽",
      desc: "흰 배경 · 공간 디테일 확대 콜아웃 + 연결선",
      prompt: (opts) =>
        build(
          "이 공간 사진을 흰 배경의 에디토리얼 인포그래픽 포스터로 재구성한다. 공간을 중심에 두고, 어메니티·뷰·디테일을 확대한 작은 콜아웃 박스를 얇은 연결선으로 해당 위치와 잇는다. 라벨은 미니멀 타이포로. 없는 시설은 절대 만들지 않는다.",
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
      prompt: (opts) =>
        build(
          "이 제품(의류·소품) 사진을 흰 배경의 룩북 플랫레이 에디토리얼 포스터로 재구성한다. 제품을 위에서 내려다본 플랫레이로 두고, 원단 질감·실루엣·디테일을 확대한 작은 콜아웃 박스를 얇은 연결선으로 잇는다. 라벨은 미니멀 타이포로.",
          opts,
        ),
    },
    {
      id: "local-product-card",
      industry: "local",
      label: "미니멀 프로덕트 카드",
      desc: "제품 카드형 — 이름 + 가는 구분선",
      prompt: (opts) =>
        build(
          "이 제품 사진을 미니멀한 프로덕트 카드 포스터로 재구성한다. 제품을 단정하게 배치하고 제품명과 짧은 설명을 가는 헤어라인 구분선과 함께 타이포로 정리한다. 가격·수치는 임의로 지어내지 않는다.",
          opts,
        ),
    },
  ],
};

/** 업종별 포스터 스타일 목록(기준). 대표 스타일이 항상 첫 번째. */
export function getPosterStyles(industry: Industry): PosterStyle[] {
  return STYLES[industry] ?? STYLES.restaurant;
}
