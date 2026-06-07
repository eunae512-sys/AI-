"use client";

import * as React from "react";
import { brands, getBrand } from "@/lib/dummy/brands";
import {
  loadUserBrand,
  loadUserBrands,
  addUserBrand,
  toBrand,
  type UserBrandData,
} from "@/lib/brand/user-brand";
import type { Brand } from "@/types";

type Ctx = {
  brand: Brand;
  brandId: string;
  setBrandId: (id: string) => void;
  allBrands: Brand[];
  // 사용자가 온보딩으로 만든 브랜드 (있으면) — 하위 호환: 첫 브랜드
  userBrand: UserBrandData | null;
  // 사용자 브랜드 새로고침 (온보딩 직후 호출용)
  refreshUserBrand: () => void;
  // 다중 브랜드
  userBrands: UserBrandData[];
  /** 실사용자 브랜드 2개 이상 (더미 제외) */
  isAgency: boolean;
  /** 온보딩 ?add=1 에서 신규 브랜드를 목록에 추가·활성화 */
  addBrand: (data: UserBrandData) => void;
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
  const [userBrands, setUserBrands] = React.useState<UserBrandData[]>([]);

  const refreshUserBrand = React.useCallback(() => {
    const list = loadUserBrands();
    setUserBrands(list);
    const primary = list[0] ?? null;
    setUserBrand(primary); // 기존 단일 userBrand 호환 유지 (= 첫 브랜드)

    // active 자동 활성화: 저장된 active 가 없거나 더미 기본이고 실브랜드가 있으면 첫 실브랜드로
    if (primary && typeof window !== "undefined") {
      const savedActive = localStorage.getItem(STORAGE_KEY);
      if (
        !savedActive ||
        savedActive === DEFAULT_ID ||
        (!getBrand(savedActive) && !list.some((b) => b.id === savedActive))
      ) {
        setBrandIdState(primary.id);
        try {
          localStorage.setItem(STORAGE_KEY, primary.id);
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
      const list = loadUserBrands();
      if (list.some((b) => b.id === saved)) {
        setBrandIdState(saved);
      } else if (getBrand(saved)) {
        setBrandIdState(saved);
      }
    }
  }, [refreshUserBrand]);

  // 같은 탭에서 다른 컴포넌트가 user-brand 를 저장하면 동기화
  React.useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "briq:user-brand" || e.key === "briq:user-brands") {
        refreshUserBrand();
      }
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
      // 사용자 브랜드 목록 또는 더미에서 찾기
      const isUser = userBrands.some((b) => b.id === id);
      if (!isUser && !getBrand(id)) return;
      setBrandIdState(id);
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
    },
    [userBrands],
  );

  // allBrands: 실사용자 브랜드 있으면 자기 브랜드만 (더미 제외), 없으면 데모 더미 7개
  const allBrands: Brand[] = React.useMemo(() => {
    if (userBrands.length > 0) return userBrands.map(toBrand);
    return brands;
  }, [userBrands]);

  const brand = React.useMemo<Brand>(() => {
    const u = userBrands.find((b) => b.id === brandId);
    if (u) return toBrand(u);
    return getBrand(brandId) ?? (userBrands[0] ? toBrand(userBrands[0]) : brands[0]);
  }, [brandId, userBrands]);

  // 실사용자 브랜드 2개 이상이면 대행사
  const isAgency = userBrands.length >= 2;

  const addBrand = React.useCallback(
    (data: UserBrandData) => {
      addUserBrand(data); // 영속화 (목록 upsert)
      refreshUserBrand(); // userBrands/userBrand 재로드
      setBrandIdState(data.id); // 신규를 active 로
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, data.id);
        window.dispatchEvent(new Event("briq:user-brand-updated"));
      }
    },
    [refreshUserBrand],
  );

  // SSR-safe: 클라이언트 마운트 전엔 기본 브랜드로 렌더해서 hydration mismatch 방지
  const value: Ctx = {
    brand: mounted ? brand : brands[0],
    brandId: mounted ? brandId : DEFAULT_ID,
    setBrandId,
    allBrands: mounted ? allBrands : brands,
    userBrand: mounted ? userBrand : null,
    refreshUserBrand,
    userBrands: mounted ? userBrands : [],
    isAgency: mounted ? isAgency : false,
    addBrand,
  };

  return <BrandCtx.Provider value={value}>{children}</BrandCtx.Provider>;
}
