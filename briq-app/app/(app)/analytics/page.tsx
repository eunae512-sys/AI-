import { Topbar } from "@/components/layout/Topbar";
import { AnalyticsScreen } from "@/components/analytics/AnalyticsScreen";

export const metadata = { title: "BRIQ · 성과 분석" };

export default function AnalyticsPage() {
  return (
    <>
      <Topbar title="성과 분석" breadcrumb="브랜드별 ROI" />
      <AnalyticsScreen />
    </>
  );
}
