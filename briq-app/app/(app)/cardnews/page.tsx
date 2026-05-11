import { Topbar } from "@/components/layout/Topbar";
import { CardnewsScreen } from "@/components/cardnews/CardnewsScreen";

export const metadata = { title: "BRIQ · 카드뉴스" };

export default function CardnewsPage() {
  return (
    <>
      <Topbar title="카드뉴스" breadcrumb="6장 자동 생성" />
      <CardnewsScreen />
    </>
  );
}
