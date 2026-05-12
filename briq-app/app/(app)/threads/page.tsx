import { Topbar } from "@/components/layout/Topbar";
import { ThreadsScreen } from "@/components/threads/ThreadsScreen";

export const metadata = { title: "BRIQ · 쓰레드" };

export default function ThreadsPage() {
  return (
    <>
      <Topbar title="쓰레드" breadcrumb="텍스트 한 줄" />
      <ThreadsScreen />
    </>
  );
}
