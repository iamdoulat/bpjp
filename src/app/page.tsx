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

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingNavbar />
      <div className="px-[5%]">
        <main className="flex-1">
          <HeroSection />
          <CampaignsSection />
          <EventsSection />
          <MissionSection />
          <AboutSection />
          <CommitteeSection />
        </main>
      </div>
      <Footer />
    </div>
  );
}
