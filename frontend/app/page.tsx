import { Suspense } from "react";
import { DynamicHeroSection } from "@/components/dynamic-hero-section";
import { GuideListingsSection } from "@/components/guide-listings-section";
import { HowItWorks } from "@/components/how-it-works";
import { FeaturedTours } from "@/components/featured-tours";
import { FeaturedToursSkeleton } from "@/components/featured-tours-skeleton";
import { WhyUs } from "@/components/why-us";
import { SampleItinerary } from "@/components/sample-itinerary";
import { CTASection } from "@/components/cta-section";

export default function HomePage() {
  return (
    <>
      <DynamicHeroSection />
      <GuideListingsSection />
      <HowItWorks />
      <Suspense fallback={<FeaturedToursSkeleton />}>
        <FeaturedTours />
      </Suspense>
      <WhyUs />
      <SampleItinerary />
      <CTASection />
    </>
  );
}
