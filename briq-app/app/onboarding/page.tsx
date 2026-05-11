import type { Metadata } from "next";
import { Onboarding } from "@/components/onboarding/Onboarding";

export const metadata: Metadata = {
  title: "시작하기",
  description: "3분이면 끝나는 BRIQ 온보딩. 브랜드 정보·톤·연결 채널만 알려주시면 BRIQ가 운영을 시작합니다.",
  alternates: { canonical: "/onboarding" },
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return <Onboarding />;
}
