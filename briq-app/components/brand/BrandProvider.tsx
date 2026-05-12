"use client";

import * as React from "react";
import { brands, getBrand } from "@/lib/dummy/brands";
import { loadUserBrand, toBrand, type UserBrandData } from "@/lib/brand/user-brand";
import type { Brand } from "@/types";

type Ctx = {
  brand: Brand;
  brandId: string;
  setBrandId: (id: string) => void;
  allBrands: Brand[];
  // 사용자가 온보딩으로 만든 브랜드 (있으면)
  userBrand: UserBrandData | null;
  // 사용자 브랜드 새로고침 (온보딩 직후 호출용)
  refreshUserBrand: () => void;
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
  const [userBrand, setUserBrand] = React.useState<UserBrandData | null>(null);

  const refreshUserBrand = React.useCallback(() => {
    const u = loadUserBrand();
    setUserBrand(u);
    // 새 사용자 브랜드 발견 시 자동 활성화 (저장된 active-brand가 더미일 때만)
    if (u && typeof window !== "undefined") {
      const savedActive = localStorage.getItem(STORAGE_KEY);
      if (!savedActive || savedActive === DEFAULT_ID || !getBrand(savedActive)) {
        setBrandIdState(u.id);
        try {
          localStorage.setItem(STORAGE_KEY, u.id);
        } catch {
          // 무시
        }
      }
    }
  }, []);

  React.useEffect(() => {
    setMounted(true);
    refreshUserBrand();
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      const u = loadUserBrand();
      if (u && u.id === saved) {
        setBrandIdState(saved);
      } else if (getBrand(saved)) {
        setBrandIdState(saved);
      }
    }
  }, [refreshUserBrand]);

  // 같은 탭에서 다른 컴포넌트가 user-brand 를 저장하면 동기화
  React.useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "briq:user-brand") refreshUserBrand();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handler);
      window.addEventListener("briq:user-brand-updated", refreshUserBrand as EventListener);
      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener("briq:user-brand-updated", refreshUserBrand as EventListener);
      };
    }
  }, [refreshUserBrand]);

  const setBrandId = React.useCallback(
    (id: string) => {
      // 사용자 브랜드면 그것을 선택, 아니면 더미 목록에서 찾기
      const isUserBrand = userBrand?.id === id;
      if (!isUserBrand && !getBrand(id)) return;
      setBrandIdState(id);
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
    },
    [userBrand?.id],
  );

  // allBrands: 사용자 브랜드를 맨 앞에 (있으면)
  const allBrands: Brand[] = React.useMemo(() => {
    if (!userBrand) return brands;
    return [toBrand(userBrand), ...brands];
  }, [userBrand]);

  const brand = React.useMemo<Brand>(() => {
    if (userBrand && brandId === userBrand.id) return toBrand(userBrand);
    return getBrand(brandId) ?? brands[0];
  }, [brandId, userBrand]);

  // SSR-safe: 클라이언트 마운트 전엔 기본 브랜드로 렌더해서 hydration mismatch 방지
  const value: Ctx = {
    brand: mounted ? brand : brands[0],
    brandId: mounted ? brandId : DEFAULT_ID,
    setBrandId,
    allBrands: mounted ? allBrands : brands,
    userBrand: mounted ? userBrand : null,
    refreshUserBrand,
  };

  return <BrandCtx.Provider value={value}>{children}</BrandCtx.Provider>;
}
