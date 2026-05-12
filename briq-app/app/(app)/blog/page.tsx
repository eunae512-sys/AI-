import { Topbar } from "@/components/layout/Topbar";
import { BlogScreen } from "@/components/blog/BlogScreen";

export const metadata = { title: "BRIQ · 네이버 블로그" };

export default function BlogPage() {
  return (
    <>
      <Topbar title="네이버 블로그" breadcrumb="본문 자동 작성" />
      <BlogScreen />
    </>
  );
}
