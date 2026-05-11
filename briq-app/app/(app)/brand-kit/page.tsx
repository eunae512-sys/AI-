import { Topbar } from "@/components/layout/Topbar";
import { BrandKitScreen } from "@/components/brand-kit/BrandKitScreen";

export const metadata = { title: "BRIQ · 브랜드 키트" };

export default function BrandKitPage() {
  return (
    <>
      <Topbar title="브랜드 키트" breadcrumb="자동 추출 · 컬러 · 폰트 · 템플릿" />
      <BrandKitScreen />
    </>
  );
}
