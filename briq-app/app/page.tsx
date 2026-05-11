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
      <main>
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
