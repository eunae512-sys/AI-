// 카드뉴스 레이아웃 프리셋 — 브랜드 일관성 보장.
//
// 브랜드 매니저가 한 번 설정해두면 모든 캠페인이 같은 컴포지션 시퀀스로 발행된다.
// → 인스타 피드를 멀리서 봐도 "이 브랜드 결" 이 보이게.

import type { SlideComposition } from "@/components/campaigns/types";
import type { Industry } from "@/types";

export type LayoutPresetId = "auto" | "editorial" | "minimal" | "magazine" | "modern-card";

export type LayoutPreset = {
  id: LayoutPresetId;
  label: string;
  description: string;
  /** 7장 슬라이드 각각의 컴포지션 — index 0 = 1번 슬라이드 */
  sequence: SlideComposition[];
};

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: "auto",
    label: "자동",
    description: "브랜드·주제마다 결을 자동으로 바꿔 짭니다.",
    sequence: ["masthead", "pillar-left", "paper-split", "overlay-card", "pillar-left", "type-hero", "masthead"],
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "매거진 결 · 컴포지션 혼합. 표지 + 필러 + 페이퍼 + 오버레이를 섞어 한 권의 매거진 한 호처럼.",
    sequence: ["masthead", "pillar-left", "paper-split", "overlay-card", "pillar-left", "type-hero", "masthead"],
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "이미지 풀블리드 중심. 페이퍼 패널 없이 좌측 세로선 + 챕터 글리프만으로. 사진 강한 브랜드에.",
    sequence: ["masthead", "pillar-left", "pillar-left", "pillar-left", "pillar-left", "type-hero", "masthead"],
  },
  {
    id: "magazine",
    label: "Magazine",
    description: "페이퍼 매거진 결. 슬라이드 대부분이 좌측 페이퍼 패널 + 우측 이미지. 한정식 · 한옥스테이 · 디저트.",
    sequence: ["masthead", "paper-split", "paper-split", "paper-split", "paper-split", "type-hero", "masthead"],
  },
  {
    id: "modern-card",
    label: "Modern Card",
    description: "이미지 + 페이퍼 카드 오버레이. 인쇄물 결. 카페 · 패션 · 모던 브랜드.",
    sequence: ["masthead", "overlay-card", "overlay-card", "overlay-card", "overlay-card", "type-hero", "masthead"],
  },
];

export const DEFAULT_PRESET_ID: LayoutPresetId = "auto";

const KEY = (brandId: string) => `briq:layout-preset:${brandId}`;

export function loadLayoutPreset(brandId: string): LayoutPresetId {
  if (typeof window === "undefined") return DEFAULT_PRESET_ID;
  try {
    const v = localStorage.getItem(KEY(brandId));
    if (v && LAYOUT_PRESETS.some((p) => p.id === v)) return v as LayoutPresetId;
  } catch {
    // 무시
  }
  return DEFAULT_PRESET_ID;
}

export function saveLayoutPreset(brandId: string, id: LayoutPresetId) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY(brandId), id);
    window.dispatchEvent(new CustomEvent("briq:layout-preset-updated", { detail: { brandId, id } }));
  } catch {
    // 무시
  }
}

export function getPreset(id: LayoutPresetId): LayoutPreset {
  return LAYOUT_PRESETS.find((p) => p.id === id) ?? LAYOUT_PRESETS[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// auto 시퀀스 — 업종 편향 + (brand,topic,kind) 시드로 중간 슬라이드만 결정론 변주.
//   앵커 고정: [0]=masthead(표지) · [5]=type-hero(증거) · [6]=masthead(CTA)
//   중간 [1..4] 만 MID 팔레트에서 변주. Math.random 금지 — seed 산술만 (브라우저/노드 안전).
// ─────────────────────────────────────────────────────────────────────────────

/** 중간 슬롯에 쓰는 팔레트 (CLAUDE.md: 기존 5종 외 추가 금지 — masthead/type-hero 는 앵커 전용). */
const MID_PALETTE: SlideComposition[] = ["pillar-left", "paper-split", "overlay-card"];

/** 업종별 우세(편향) 컴포지션 — 중간 4슬롯 중 정확히 2회 등장. */
const INDUSTRY_BIAS: Record<Industry, SlideComposition> = {
  restaurant: "paper-split",
  dessert: "paper-split",
  stay: "paper-split",
  cafe: "overlay-card",
  local: "overlay-card",
  beauty: "pillar-left",
};

/** 작은 결정론 해시 — kind 문자열을 정수로 (seed 와 섞어 토픽/종류별 변주). */
function strHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

/**
 * 7장 컴포지션 시퀀스를 반환한다.
 * 앵커 [0]/[5]/[6] 고정, 중간 [1..4] 만 업종 편향 + 시드로 변주.
 * 보장: bias 정확히 2슬롯 + 비-bias fill 2슬롯 → 항상 최소 2종, 같은 값 3연속 불가능.
 * 결정론: 같은 (industry, kind, seed) → 같은 출력.
 */
export function buildAutoSequence(
  industry: Industry,
  kind: string,
  seed: number,
): SlideComposition[] {
  const bias = INDUSTRY_BIAS[industry] ?? "paper-split";
  // seed 와 kind 를 섞은 변주 시드 — 같은 브랜드라도 토픽/종류마다 다른 배열.
  const s = (seed ^ strHash(kind)) >>> 0;

  // bias 를 박을 위치쌍 — 모두 비인접쌍이라 bias 2개가 절대 연속되지 않는다.
  //   → 중간 4슬롯에 같은 값 3연속이 구조적으로 불가능.
  const biasPairs: [number, number][] = [
    [0, 2],
    [1, 3],
    [0, 3],
  ];
  const [bA, bB] = biasPairs[s % biasPairs.length];

  // bias 를 뺀 나머지 2종 — 비-bias 슬롯 2개를 채운다 (서로 다른 값으로 → 최소 2종 보장 강화).
  const rest = MID_PALETTE.filter((c) => c !== bias); // 항상 길이 2
  const nonBias: number[] = [0, 1, 2, 3].filter((i) => i !== bA && i !== bB); // 항상 길이 2

  // 두 비-bias 슬롯에 rest[0]/rest[1] 을 시드로 순서만 바꿔 배정.
  const flip = (s >>> 3) % 2; // 0 또는 1
  const fill0 = rest[flip];
  const fill1 = rest[1 - flip];

  const mid: SlideComposition[] = [bias, bias, bias, bias];
  mid[nonBias[0]] = fill0;
  mid[nonBias[1]] = fill1;

  return ["masthead", mid[0], mid[1], mid[2], mid[3], "type-hero", "masthead"];
}
