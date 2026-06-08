// 업종별 포스터 레이아웃 모델 + 사진 전용 AI 프롬프트(기준).
//
// ★ 아키텍처 원칙: AI = 이미지 소재만. 앱 = 모든 디자인·타이포·레이아웃.
//
// AI 이미지 모델은 (1)한글을 정확히 못 쓰고 (2)자기가 그린 박스/요소 위치를
// 앱에 못 알려준다. 그래서 AI 에게 콜아웃·글자를 그리게 하면 깨진 글자(이전) 또는
// 빈 박스(현재)가 나온다. → 여기서는 AI 에게 "깨끗한 사진 소재"만 요청하고,
// 앱 canvas 합성기(poster-compositor.ts)가 레이아웃·콜아웃·라벨·타이포 전부를
// 결정론적으로 그린다. 결과: 텍스트 항상 정확·위치 통제·온브랜드·정직.
//
// 정직성(CLAUDE.md #7): 프롬프트는 "실제 사진을 살려 다듬는" 편집 지시다.
//   없는 메뉴·허위 정보·가짜 수치·가짜 후기 텍스트는 절대 넣지 않는다.

import type { Industry } from "@/lib/ai-gen/model-scenes";

export type PosterStyleOpts = {
  /** 강조 색상(예: "딥 그린", "#4F5F4B", "테라코타") — 포스터 액센트 톤(색감만, 글자 아님) */
  accentColor?: string;
};

/**
 * 앱 합성기가 그리는 3종 레이아웃.
 * - callout: 앱이 라벨 칩 + 연결선 + 인셋을 직접 그림(빈 박스/깨진 글자 0)
 * - cover: 풀블리드 히어로 + 하단 스크림 + 큰 헤드라인
 * - menu: 상단 사진 + 하단 구조화 메뉴 리스트
 */
export type PosterLayout = "callout" | "cover" | "menu";

export type PosterStyle = {
  id: string;
  industry: Industry;
  /** UI 라벨 (한글) */
  label: string;
  /** 한 줄 설명 */
  desc: string;
  /** 앱 합성기가 사용할 레이아웃 엔진 */
  layout: PosterLayout;
  /** 옵션을 받아 완성된 사진 전용 프롬프트(영문 + 한국어 가드)를 만든다 */
  prompt: (opts?: PosterStyleOpts) => string;
};

// 모든 포스터 소재 생성에 공통으로 붙는 꼬리 지시.
// 핵심: 글자·박스·선·그래픽을 일절 그리지 않는다 — 앱이 전부 그린다.
const COMMON_PHOTO_TAIL =
  "Clean, premium editorial photograph of the real subject. True-to-life colors, soft natural light, decluttered and recomposed for a magazine. ABSOLUTELY NO text, letters, numbers, words, captions, logos, watermarks, boxes, lines, frames, borders, callouts, charts, arrows, or any graphic overlay — render ONLY the photographed subject itself. 이미지 안에 한국어·영문 글자, 박스, 선, 도형, 로고를 일절 그리지 않는다(앱이 모든 텍스트·레이아웃을 따로 그린다). 실제로 보이는 피사체만 살려 다듬고, 없는 요소·허위 정보·과장 문구는 절대 넣지 않는다. 9:16 vertical.";

// callout/menu 레이아웃 — 피사체를 깨끗한 오프화이트 배경에 중앙 배치, 넉넉한 여백.
const CLEAN_BG_TAIL =
  "Place the subject centered on a clean, seamless off-white (#FAF7EE warm paper tone) background with generous, even margins on all sides (the app overlays its layout onto that empty margin). No props clutter, no extra objects.";

// cover 레이아웃 — 피사체가 프레임을 가득 채우는 히어로 컷.
const HERO_TAIL =
  "The subject fills the frame as a full-bleed hero shot, editorial magazine-cover quality, dramatic but natural lighting, shallow depth of field.";

// 옵션 → 추가 지시 조각(색감 힌트만, 글자 아님).
function optTail(opts?: PosterStyleOpts): string {
  if (!opts) return "";
  const parts: string[] = [];
  if (opts.accentColor && opts.accentColor.trim()) {
    parts.push(`강조 색상은 ${opts.accentColor.trim()} 톤으로 절제해서 쓴다(색감만, 글자 아님).`);
  }
  return parts.length ? " " + parts.join(" ") : "";
}

// 프롬프트 빌더 — 피사체 본문 + 배경 지시 + 옵션 + 공통 꼬리.
function build(body: string, bgTail: string, opts?: PosterStyleOpts): string {
  return `${body} ${bgTail}${optTail(opts)} ${COMMON_PHOTO_TAIL}`;
}

// ── 공통 푸드 스타일(restaurant/cafe/dessert 가 공유) ──────────────────────
function foodEditorialInfographic(industry: Industry): PosterStyle {
  return {
    id: `${industry}-editorial-infographic`,
    industry,
    label: "에디토리얼 인포그래픽",
    desc: "흰 배경 · 앱이 라벨 칩 + 연결선 + 디테일 인셋을 그림",
    layout: "callout",
    prompt: (opts) =>
      build(
        "Recompose this food photo into a single hero subject: the dish styled cleanly, appetizing, sharp focus.",
        CLEAN_BG_TAIL,
        opts,
      ),
  };
}

function foodMagazineCover(industry: Industry): PosterStyle {
  return {
    id: `${industry}-magazine-cover`,
    industry,
    label: "감성 매거진 커버",
    desc: "풀블리드 히어로 — 앱이 하단 헤드라인을 얹음",
    layout: "cover",
    prompt: (opts) =>
      build(
        "Recompose this food photo as a luxury food-magazine cover hero: the dish as the dramatic centerpiece, rich textures.",
        HERO_TAIL,
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
      desc: "사진 + 앱이 그리는 메뉴 리스트",
      layout: "menu",
      prompt: (opts) =>
        build(
          "Recompose this food photo cleanly as a single appetizing dish, neatly plated, top portion of frame.",
          CLEAN_BG_TAIL,
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
      desc: "흰 배경 · 앱이 라벨 칩 + 연결선을 그림",
      layout: "callout",
      prompt: (opts) =>
        build(
          "Recompose this drink/coffee photo into a single clean hero: the cup or drink styled beautifully, sharp focus, visible texture (foam, layers, beans).",
          CLEAN_BG_TAIL,
          opts,
        ),
    },
    {
      id: "cafe-minimal-menu",
      industry: "cafe",
      label: "미니멀 메뉴판",
      desc: "음료 사진 + 앱이 그리는 메뉴 리스트",
      layout: "menu",
      prompt: (opts) =>
        build(
          "Recompose this drink photo cleanly as a single styled beverage, top portion of frame.",
          CLEAN_BG_TAIL,
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
      desc: "디저트 사진 + 앱이 그리는 메뉴 리스트",
      layout: "menu",
      prompt: (opts) =>
        build(
          "Recompose this dessert photo cleanly as a single styled dessert, neat and appetizing, top portion of frame.",
          CLEAN_BG_TAIL,
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
      desc: "흰 배경 · 앱이 라벨 칩 + 연결선을 그림",
      layout: "callout",
      prompt: (opts) =>
        build(
          "Recompose this beauty/treatment-result photo into a single clean hero: the result (hair, nails, skin) as the centered subject, soft even light, true texture. If a face is visible keep it natural and unexaggerated.",
          CLEAN_BG_TAIL,
          opts,
        ),
    },
    {
      id: "beauty-minimal-pricecard",
      industry: "beauty",
      label: "미니멀 시술 카드",
      desc: "사진 + 앱이 그리는 시술 리스트 (수치 임의 생성 금지)",
      layout: "menu",
      prompt: (opts) =>
        build(
          "Recompose this beauty photo cleanly as a single styled result, top portion of frame.",
          CLEAN_BG_TAIL,
          opts,
        ),
    },
  ],
  stay: [
    {
      id: "stay-space-editorial",
      industry: "stay",
      label: "공간 화보",
      desc: "풀블리드 히어로 — 앱이 하단 헤드라인을 얹음",
      layout: "cover",
      prompt: (opts) =>
        build(
          "Recompose this space photo as a luxury stay magazine spread hero: the room or view as the dramatic centerpiece, inviting and serene.",
          HERO_TAIL,
          opts,
        ),
    },
    {
      id: "stay-amenity-infographic",
      industry: "stay",
      label: "어메니티 콜아웃 인포그래픽",
      desc: "흰 배경 · 앱이 라벨 칩 + 연결선을 그림",
      layout: "callout",
      prompt: (opts) =>
        build(
          "Recompose this space photo into a single clean hero: the room or amenity centered as the subject, calm light, inviting. Show only what is really there.",
          CLEAN_BG_TAIL,
          opts,
        ),
    },
  ],
  local: [
    {
      id: "local-lookbook-flatlay",
      industry: "local",
      label: "룩북 플랫레이",
      desc: "흰 배경 플랫레이 · 앱이 라벨 칩 + 연결선을 그림",
      layout: "callout",
      prompt: (opts) =>
        build(
          "Recompose this product (apparel/goods) photo into a clean top-down flat-lay hero: the product centered, fabric texture and silhouette clearly visible, sharp focus.",
          CLEAN_BG_TAIL,
          opts,
        ),
    },
    {
      id: "local-product-card",
      industry: "local",
      label: "미니멀 프로덕트 카드",
      desc: "제품 사진 + 앱이 그리는 제품 리스트",
      layout: "menu",
      prompt: (opts) =>
        build(
          "Recompose this product photo cleanly as a single styled product, top portion of frame.",
          CLEAN_BG_TAIL,
          opts,
        ),
    },
  ],
};

/** 업종별 포스터 스타일 목록(기준). 대표 스타일이 항상 첫 번째. */
export function getPosterStyles(industry: Industry): PosterStyle[] {
  return STYLES[industry] ?? STYLES.restaurant;
}
