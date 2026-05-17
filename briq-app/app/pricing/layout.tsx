import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "요금제 — BRIQ",
  description:
    "디자이너 외주 1편 비용으로 한 달 무한 발행. Pro ₩49,000/월 · Studio ₩149,000/월. 신용카드 없이 14일 무료 체험 후 결정하세요.",
  openGraph: {
    title: "BRIQ 요금제 — 디자이너 외주 1편 비용으로 한 달 무한 발행",
    description: "Free / Pro ₩49,000 / Studio ₩149,000 — 14일 무료 체험.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BRIQ 요금제",
    description: "Pro ₩49,000/월 — 카드뉴스 무제한 + 8 채널 자동 변환",
  },
  alternates: { canonical: "/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
