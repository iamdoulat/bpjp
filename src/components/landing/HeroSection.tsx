// src/components/landing/HeroSection.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/AppContext";
import { UserPlus } from "lucide-react";

export function HeroSection() {
  const { organizationSettings } = useAppContext();
  // Use the cover image from settings, with a fallback
  const heroImageUrl = organizationSettings?.coverImageUrl || "https://placehold.co/1200x500.png";

  const address = organizationSettings?.address || "ভূজপুর থানা, ফটিকছড়ি, চট্টগ্রাম।";
  const regNumber = organizationSettings?.registrationNumber || "২০১৮/এ";
  const established = organizationSettings?.establishedYear || "২০১৮";

  return (
    <section id="home" className="relative w-full h-[500px] rounded-[10px] overflow-hidden mt-5">
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
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
          ভূজপুর প্রবাসী যুব কল্যাণ পরিষদ <br /> এ আপনাকে স্বাগতম
        </h1>
        <div className="mt-4 max-w-3xl text-lg text-gray-300 md:text-xl">
          <p>ঠিকানা : {address}</p>
          <p>রেজিঃ নং- {regNumber}, স্থাপিত: {established} ইংরেজি</p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="#about">বিস্তারিত</Link>
          </Button>
          <Button size="lg" asChild variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/signup"><UserPlus className="mr-2 h-5 w-5" /> Sign Up</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
