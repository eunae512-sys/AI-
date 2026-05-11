import { Topbar } from "@/components/layout/Topbar";
import { ReviewQueueScreen } from "@/components/review-queue/ReviewQueueScreen";

export const metadata = { title: "BRIQ · 검토 큐" };

export default function ReviewQueuePage() {
  return (
    <>
      <Topbar title="검토 큐" breadcrumb="발행 전 자동 검수" />
      <ReviewQueueScreen />
    </>
  );
}
