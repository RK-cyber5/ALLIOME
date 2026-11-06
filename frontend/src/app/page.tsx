import { LandingNavbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import {
  Capabilities,
  FinalCta,
  HowItWorks,
  IntelligencePreview,
  LandingFooter,
} from "@/components/landing/sections";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNavbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Capabilities />
        <IntelligencePreview />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
