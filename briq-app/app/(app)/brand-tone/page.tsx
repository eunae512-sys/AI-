import { Topbar } from "@/components/layout/Topbar";
import { BrandToneScreen } from "@/components/brand-tone/BrandToneScreen";

export const metadata = { title: "BRIQ · 브랜드 톤" };

export default function BrandTonePage() {
  return (
    <>
      <Topbar title="브랜드 톤 메모리" breadcrumb="감성 · 금지어 · 가이드라인" />
      <BrandToneScreen />
    </>
  );
}
