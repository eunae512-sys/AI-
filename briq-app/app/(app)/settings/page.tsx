import { Topbar } from "@/components/layout/Topbar";
import { SettingsScreen } from "@/components/settings/SettingsScreen";

export const metadata = { title: "BRIQ · 설정" };

export default function SettingsPage() {
  return (
    <>
      <Topbar title="설정" breadcrumb="계정 · 결제 · 연결" />
      <SettingsScreen />
    </>
  );
}
