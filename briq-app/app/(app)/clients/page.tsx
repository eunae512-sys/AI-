import { Topbar } from "@/components/layout/Topbar";
import { ClientsScreen } from "@/components/clients/ClientsScreen";

export const metadata = { title: "BRIQ · 클라이언트" };

export default function ClientsPage() {
  return (
    <>
      <Topbar title="클라이언트" breadcrumb="전체 브랜드" />
      <ClientsScreen />
    </>
  );
}
