import { LandingNav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import {
  ProblemSection,
  ReelsFeature,
  ToneFeature,
  CalendarFeature,
  CasesSection,
  FAQSection,
  FinalCTA,
  LandingFooter,
} from "@/components/landing/Sections";

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      {/* 매거진 페이퍼 워시 — Hero 부터 Footer 위까지 한 결로 흐름 */}
      <main style={{ background: "#FAF7EE" }}>
        <Hero />
        <ProblemSection />
        <ReelsFeature />
        <ToneFeature />
        <CalendarFeature />
        <CasesSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </>
  );
}
