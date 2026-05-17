// 브랜드 마크 (로고 + 워드마크) 영구 저장 — localStorage 기반.
//
// 카드뉴스 슬라이드의 마스트헤드 / 코너에 들어가는 브랜드 표시.
// 파일 업로드는 data URL 로 저장 (Postgres 마이그레이션 시 Supabase Storage 로 옮기기 쉽게).

import type { BrandMarkConfig } from "@/components/campaigns/types";

const KEY = (brandId: string) => `briq:brand-mark:${brandId}`;

export function loadBrandMark(brandId: string): BrandMarkConfig {
  if (typeof window === "undefined") return DEFAULT_MARK;
  try {
    const raw = localStorage.getItem(KEY(brandId));
    if (!raw) return DEFAULT_MARK;
    const parsed = JSON.parse(raw) as Partial<BrandMarkConfig>;
    return {
      logoDataUrl: parsed.logoDataUrl,
      position: parsed.position ?? "top-center",
      showOnInner: parsed.showOnInner ?? true,
    };
  } catch {
    return DEFAULT_MARK;
  }
}

export function saveBrandMark(brandId: string, mark: BrandMarkConfig) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY(brandId), JSON.stringify(mark));
    window.dispatchEvent(new CustomEvent("briq:brand-mark-updated", { detail: { brandId } }));
  } catch {
    // localStorage 쿼터 초과 등 — 조용히 무시
  }
}

export const DEFAULT_MARK: BrandMarkConfig = {
  logoDataUrl: undefined,
  position: "top-center",
  showOnInner: true,
};
