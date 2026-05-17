// 카드뉴스 레이아웃 프리셋 — 브랜드 일관성 보장.
//
// 브랜드 매니저가 한 번 설정해두면 모든 캠페인이 같은 컴포지션 시퀀스로 발행된다.
// → 인스타 피드를 멀리서 봐도 "이 브랜드 결" 이 보이게.

import type { SlideComposition } from "@/components/campaigns/types";

export type LayoutPresetId = "editorial" | "minimal" | "magazine" | "modern-card";

export type LayoutPreset = {
  id: LayoutPresetId;
  label: string;
  description: string;
  /** 7장 슬라이드 각각의 컴포지션 — index 0 = 1번 슬라이드 */
  sequence: SlideComposition[];
};

export const LAYOUT_PRESETS: LayoutPreset[] = [
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

export const DEFAULT_PRESET_ID: LayoutPresetId = "editorial";

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
