import { DynamicHeroSection } from "@/components/dynamic-hero-section";
import { GuideListingsSection } from "@/components/guide-listings-section";
import { HowItWorks } from "@/components/how-it-works";
import { WhyUs } from "@/components/why-us";
import { SampleItinerary } from "@/components/sample-itinerary";
import { CTASection } from "@/components/cta-section";

export default function HomePage() {
  return (
    <>
      <DynamicHeroSection />
      <GuideListingsSection />
      <HowItWorks />
      <WhyUs />
      <SampleItinerary />
      <CTASection />
    </>
  );
}
