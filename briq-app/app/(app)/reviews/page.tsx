import { Topbar } from "@/components/layout/Topbar";
import { ReviewsScreen } from "@/components/reviews/ReviewsScreen";

export const metadata = { title: "BRIQ · 리뷰 답변" };

export default function ReviewsPage() {
  return (
    <>
      <Topbar title="리뷰 자동 답변" breadcrumb="전 채널 통합" />
      <ReviewsScreen />
    </>
  );
}
