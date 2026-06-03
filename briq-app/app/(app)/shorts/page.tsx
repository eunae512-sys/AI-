import { Topbar } from "@/components/layout/Topbar";
import { ShortsScreen } from "@/components/shorts/ShortsScreen";

export const metadata = {
  title: "BRIQ · AI 자동 홍보 (멀티 플랫폼 카피)",
  description: "사진 한 장으로 인스타 릴스·틱톡·유튜브 쇼츠·네이버 플레이스 홍보글을 동시에 생성합니다.",
};

export default function ShortsPage() {
  return (
    <>
      <Topbar title="AI 자동 홍보" breadcrumb="사진 한 장 → 플랫폼별 홍보 카피 한 번에" />
      <ShortsScreen />
    </>
  );
}
