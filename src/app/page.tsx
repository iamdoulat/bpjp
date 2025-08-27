// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { CampaignsSection } from "@/components/landing/CampaignsSection";
import { EventsSection } from "@/components/landing/EventsSection";
import { MissionSection } from "@/components/landing/MissionSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { CommitteeSection } from "@/components/landing/CommitteeSection";
import { Footer } from "@/components/landing/Footer";
import { AdvisoryBoardSection } from "@/components/landing/AdvisoryBoardSection";
import { NewsTicker } from "@/components/landing/NewsTicker";
import { NextSeo } from "next-seo";
import { Loader2 } from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <NextSeo
        title="ভূজপুর প্রবাসী যুব কল্যাণ পরিষদ"
        description="২০১৮ সালে প্রতিষ্ঠিত, এটি একটি অলাভজনক প্রতিষ্ঠান (নিবন্ধন নং: ২০১৮/এ)। আমাদের প্রধান কার্যালয় অবস্থিত — কাজির হাট, থানা: ভূজপুর, উপজেলা: ফটিকছড়ি, জেলা: চট্টগ্রাম-৪৩৫০, বাংলাদেশ।"
        openGraph={{
          url: "bpjp.vercel.app",
          title: "ভূজপুর প্রবাসী যুব কল্যাণ পরিষদ",
          description: "২০১৮ সালে প্রতিষ্ঠিত, এটি একটি অলাভজনক প্রতিষ্ঠান (নিবন্ধন নং: ২০১৮/এ)। আমাদের প্রধান কার্যালয় অবস্থিত — কাজির হাট, থানা: ভূজপুর, উপজেলা: ফটিকছড়ি, জেলা: চট্টগ্রাম-৪৩৫০, বাংলাদেশ।",
          images: [{ url: "/_next/image?url=https%3A%2F%2Ffirebasestorage.googleapis.com%2Fv0%2Fb%2Fimpactboard-opo8r.firebasestorage.app%2Fo%2Flogo%252Fbpjp-logo.jpg%3Falt%3Dmedia%26token%3De2e5e262-9340-4e34-89da-1d486a5b9399&w=32&q=75", alt: "My Site" }],
          site_name: "ভূজপুর প্রবাসী যুব কল্যাণ পরিষদ",
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "ভূজপুর প্রবাসী যুব কল্যাণ পরিষদ",
            url: "https://bpjp.vercel.app",
          }),
        }}
      />
      <div className="flex flex-col min-h-screen bg-[#EEEEEE] dark:bg-background">
        <LandingNavbar />
        <NewsTicker />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
