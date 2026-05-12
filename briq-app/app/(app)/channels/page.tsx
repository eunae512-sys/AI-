import { Topbar } from "@/components/layout/Topbar";
import { ChannelsScreen } from "@/components/channels/ChannelsScreen";

export const metadata = { title: "BRIQ · SNS 채널" };

export default function ChannelsPage() {
  return (
    <>
      <Topbar title="SNS 채널" breadcrumb="연결 · 동기화" />
      <ChannelsScreen />
    </>
  );
}
