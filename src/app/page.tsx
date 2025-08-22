// src/app/page.tsx
"use client";

import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { CampaignsSection } from "@/components/landing/CampaignsSection";
import { EventsSection } from "@/components/landing/EventsSection";
import { MissionSection } from "@/components/landing/MissionSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { CommitteeSection } from "@/components/landing/CommitteeSection";
import { Footer } from "@/components/landing/Footer";
import { AdvisoryBoardSection } from "@/components/landing/AdvisoryBoardSection";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#EEEEEE] dark:bg-background">
      <LandingNavbar />
      <div className="px-4 sm:px-6 lg:px-8">
        <main className="flex-1 max-w-7xl mx-auto">
          <HeroSection />
          <div className="mt-5">
            <CampaignsSection />
          </div>
          <div className="mt-5">
            <EventsSection />
          </div>
          <div className="mt-5">
            <MissionSection />
          </div>
          <div className="mt-5">
            <AboutSection />
          </div>
          <div className="mt-5">
            <CommitteeSection />
          </div>
          <div className="mt-5 mb-5">
            <AdvisoryBoardSection />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
