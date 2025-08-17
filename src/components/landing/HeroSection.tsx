// src/components/landing/HeroSection.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/AppContext";

export function HeroSection() {
  const { organizationSettings } = useAppContext();
  // Use the cover image from settings, with a fallback
  const heroImageUrl = organizationSettings?.coverImageUrl || "https://placehold.co/1920x1080.png";

  return (
    <section id="home" className="relative w-full h-[80vh] min-h-[600px]">
      <Image
        src={heroImageUrl}
        alt="Community working together"
        layout="fill"
        objectFit="cover"
        className="brightness-50"
        priority
        data-ai-hint="community charity event"
      />
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          ভূজপুর প্রবাসী যুব কল্যাণ পরিষদ এ আপনাকে স্বাগতম
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-gray-300 md:text-xl">
          ভূজপুর থানা, ফটিকছড়ি, চট্টগ্রাম। রেজিঃ নং- ২০১৮/এ, স্থাপিত: ২০১৮ ইংরেজি
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="#campaigns">Explore Campaigns</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="#about">Learn More</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
