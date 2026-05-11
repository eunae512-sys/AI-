import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "요금제",
  description:
    "BRIQ 요금제 — FREE는 신용카드 없이, PRO는 ₩99,000/월. 무제한 콘텐츠, 브랜드 톤 학습, 발행 전 자동검수. 부담 없이 시작하고 필요할 때만 결제.",
  openGraph: {
    title: "BRIQ 요금제 — 소상공인이 부담 없이 시작하는 가격",
    description: "FREE 시작 · PRO ₩99,000/월 · 카드 없이 가입.",
  },
  alternates: { canonical: "/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
