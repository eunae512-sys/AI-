import { Topbar } from "@/components/layout/Topbar";
import { ReelsScreen } from "@/components/reels/ReelsScreen";

export const metadata = { title: "BRIQ · AI 릴스" };

export default function ReelsPage() {
  return (
    <>
      <Topbar title="AI 릴스" breadcrumb="자동 편집 스튜디오" />
      <ReelsScreen />
    </>
  );
}
