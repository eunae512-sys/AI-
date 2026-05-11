"use client";

import * as React from "react";
import { brands, getBrand } from "@/lib/dummy/brands";
import type { Brand } from "@/types";

type Ctx = {
  brand: Brand;
  brandId: string;
  setBrandId: (id: string) => void;
  allBrands: Brand[];
};

const BrandCtx = React.createContext<Ctx | null>(null);

export function useBrand() {
  const c = React.useContext(BrandCtx);
  if (!c) throw new Error("useBrand must be used within BrandProvider");
  return c;
}

const STORAGE_KEY = "briq-active-brand";
const DEFAULT_ID = brands[0]?.id ?? "miokdang";

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brandId, setBrandIdState] = React.useState<string>(DEFAULT_ID);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved && getBrand(saved)) setBrandIdState(saved);
  }, []);

  const setBrandId = React.useCallback((id: string) => {
    if (!getBrand(id)) return;
    setBrandIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const brand = getBrand(brandId) ?? brands[0];

  // SSR-safe: 클라이언트 마운트 전엔 기본 브랜드로 렌더해서 hydration mismatch 방지
  const value: Ctx = {
    brand: mounted ? brand : brands[0],
    brandId: mounted ? brandId : DEFAULT_ID,
    setBrandId,
    allBrands: brands,
  };

  return <BrandCtx.Provider value={value}>{children}</BrandCtx.Provider>;
}
