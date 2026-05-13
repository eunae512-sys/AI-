// 카드뉴스 페이지별 레이아웃 라이브러리
// 한 카드뉴스 = 6장 슬라이드 + 각 슬라이드별 다른 레이아웃 (cover/quote/list/process/hero/cta)
// GPT 는 slide 각각에 layoutId 와 그에 맞는 copy field 를 결정

export type LayoutId = "cover" | "quote" | "list" | "process" | "hero" | "cta";

export type SlideCopy = {
  label: string;     // 좌상단 카테고리·번호
  title: string;     // 헤드라인
  sub: string;       // 보조 라인
  body?: string;     // 긴 인용·설명 (quote, hero 에서 사용)
  items?: string[];  // 리스트 항목 (list, process 에서 사용)
  footer?: string;   // 우하단 작은 정보 (cta 에서 사용)
};

export type LayoutSpec = {
  id: LayoutId;
  label: string;          // 한국어 라벨
  desc: string;           // GPT 가 어떤 슬라이드에 이 레이아웃을 선택할지 결정용 가이드
  bgKind: "image" | "solid" | "gradient" | "image-tinted";
  // 텍스트 배치 — 화면 비주얼 기준
  textPosition: "center" | "top" | "bottom" | "bottom-left" | "split";
  titleScale: "xl" | "lg" | "md";  // 헤드라인 크기 등급
  typography: "serif" | "sans" | "display";
  // GPT 출력 시 어떤 copy field 를 채워야 하는지
  requiredFields: ("title" | "sub" | "body" | "items" | "footer")[];
  // 이 레이아웃이 적합한 role (cover 는 title 슬라이드, list 는 menu 슬라이드 등)
  fitsRoles: string[];
};

export const LAYOUT_SPECS: Record<LayoutId, LayoutSpec> = {
  cover: {
    id: "cover",
    label: "표지",
    desc: "큰 제목 중앙 배치. 캠페인 첫 슬라이드. 짧고 강한 한 줄.",
    bgKind: "image-tinted",
    textPosition: "center",
    titleScale: "xl",
    typography: "display",
    requiredFields: ["title", "sub"],
    fitsRoles: ["title", "cover"],
  },
  quote: {
    id: "quote",
    label: "인용",
    desc: "큰따옴표 인용문 + em-dash 발언 주체. 후크·감성 슬라이드에 적합.",
    bgKind: "image-tinted",
    textPosition: "center",
    titleScale: "lg",
    typography: "serif",
    requiredFields: ["body", "footer"],
    fitsRoles: ["hook", "story"],
  },
  list: {
    id: "list",
    label: "리스트",
    desc: "3~5개 항목 세로 나열 (메뉴/구성/베스트). 숫자 또는 · 마커.",
    bgKind: "image-tinted",
    textPosition: "top",
    titleScale: "md",
    typography: "sans",
    requiredFields: ["title", "items"],
    fitsRoles: ["menu", "detail"],
  },
  process: {
    id: "process",
    label: "단계",
    desc: "1 → 2 → 3 가로 단계. 과정·시간 흐름 설명.",
    bgKind: "image-tinted",
    textPosition: "top",
    titleScale: "md",
    typography: "sans",
    requiredFields: ["title", "items"],
    fitsRoles: ["story", "detail"],
  },
  hero: {
    id: "hero",
    label: "히어로",
    desc: "사진 강조 + 한 줄 캡션 하단. 분위기·디테일 컷.",
    bgKind: "image",
    textPosition: "bottom-left",
    titleScale: "md",
    typography: "sans",
    requiredFields: ["title"],
    fitsRoles: ["detail", "hook"],
  },
  cta: {
    id: "cta",
    label: "행동 유도",
    desc: "마지막 슬라이드. 큰 행동 유도 + 운영 정보 (예약·지도·시간).",
    bgKind: "image-tinted",
    textPosition: "bottom",
    titleScale: "lg",
    typography: "display",
    requiredFields: ["title", "sub", "footer"],
    fitsRoles: ["cta"],
  },
};

// 6장 자동 추천 시퀀스 — role-aware 한 GPT 가 선택할 기본 시퀀스
export const DEFAULT_LAYOUT_SEQUENCE: LayoutId[] = [
  "cover",   // 1. 표지
  "quote",   // 2. 후크 인용
  "hero",    // 3. 분위기·디테일
  "list",    // 4. 메뉴/구성
  "process", // 5. 단계·이야기
  "cta",     // 6. 행동 유도
];

// 텍스트 길이 기준 검증 — GPT 출력이 레이아웃에 맞는지
export function isCopyValid(layoutId: LayoutId, copy: SlideCopy): boolean {
  const spec = LAYOUT_SPECS[layoutId];
  for (const field of spec.requiredFields) {
    const v = copy[field];
    if (field === "items") {
      if (!Array.isArray(v) || v.length < 2) return false;
    } else {
      if (typeof v !== "string" || v.trim().length < 2) return false;
    }
  }
  return true;
}

// Tailwind 클래스 매핑 — 슬라이드 렌더링 시 사용
export function getTitleClass(layoutId: LayoutId): string {
  const spec = LAYOUT_SPECS[layoutId];
  const sizeBase =
    spec.titleScale === "xl"
      ? "text-[28px] sm:text-[34px] md:text-[40px]"
      : spec.titleScale === "lg"
        ? "text-[22px] sm:text-[26px] md:text-[30px]"
        : "text-[18px] sm:text-[20px] md:text-[22px]";
  const fontFamily =
    spec.typography === "serif"
      ? "font-serif"
      : spec.typography === "display"
        ? "font-bold tracking-tight"
        : "font-semibold";
  return `${sizeBase} ${fontFamily} leading-[1.1]`;
}

export function getContainerClass(layoutId: LayoutId): string {
  const spec = LAYOUT_SPECS[layoutId];
  switch (spec.textPosition) {
    case "center":
      return "inset-0 flex flex-col items-center justify-center text-center px-5";
    case "top":
      return "inset-x-0 top-0 px-4 pt-6 sm:pt-8 text-left";
    case "bottom":
      return "inset-x-0 bottom-0 px-4 pb-5 sm:pb-6 text-center";
    case "bottom-left":
      return "left-3 right-3 bottom-3";
    case "split":
      return "inset-0 flex flex-col justify-between px-4 py-5";
  }
}
