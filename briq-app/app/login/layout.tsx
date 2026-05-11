import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인",
  description: "BRIQ에 로그인하고 브랜드 운영을 자동화하세요.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
