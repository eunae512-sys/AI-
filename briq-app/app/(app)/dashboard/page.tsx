import { Topbar } from "@/components/layout/Topbar";
import { DashboardScreen } from "@/components/dashboard/Dashboard";

export const metadata = { title: "BRIQ · 홈" };

export default function DashboardPage() {
  return (
    <>
      <Topbar title="홈" breadcrumb="오늘의 추천" />
      <DashboardScreen />
    </>
  );
}
