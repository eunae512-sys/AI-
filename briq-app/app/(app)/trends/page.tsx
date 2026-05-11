import { Topbar } from "@/components/layout/Topbar";
import { TrendsScreen } from "@/components/trends/TrendsScreen";

export const metadata = { title: "BRIQ · 지역 트렌드" };

export default function TrendsPage() {
  return (
    <>
      <Topbar title="지역 트렌드" breadcrumb="동네 1km 분석" />
      <TrendsScreen />
    </>
  );
}
