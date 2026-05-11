import { Topbar } from "@/components/layout/Topbar";
import { CalendarScreen } from "@/components/calendar/CalendarScreen";

export const metadata = { title: "BRIQ · 콘텐츠 캘린더" };

export default function CalendarPage() {
  return (
    <>
      <Topbar title="콘텐츠 캘린더" breadcrumb="2026년 5월" />
      <CalendarScreen />
    </>
  );
}
