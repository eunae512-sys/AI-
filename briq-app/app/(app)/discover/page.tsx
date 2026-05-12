import { Topbar } from "@/components/layout/Topbar";
import { DiscoverScreen } from "@/components/discover/DiscoverScreen";

export const metadata = { title: "BRIQ · 검색·AI 노출" };

export default function DiscoverPage() {
  return (
    <>
      <Topbar title="검색·AI 노출" breadcrumb="SEO + GEO 추천" />
      <DiscoverScreen />
    </>
  );
}
