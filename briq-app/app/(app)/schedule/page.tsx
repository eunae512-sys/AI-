import { Topbar } from "@/components/layout/Topbar";
import { ScheduleScreen } from "@/components/schedule/ScheduleScreen";

export const metadata = { title: "BRIQ · 업로드 예약" };

export default function SchedulePage() {
  return (
    <>
      <Topbar title="업로드 예약" breadcrumb="멀티채널 큐" />
      <ScheduleScreen />
    </>
  );
}
