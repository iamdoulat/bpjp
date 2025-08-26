// src/components/landing/AboutSection.tsx
"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getOrganizationSettings, type OrganizationSettingsData } from '@/services/organizationSettingsService';
import { Building, Info, CheckCircle } from 'lucide-react';

export function AboutSection() {
  const [settings, setSettings] = useState<OrganizationSettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getOrganizationSettings();
        setSettings(data);
      } catch (e) {
        console.error("Failed to fetch about data:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <section id="about" className="py-5 bg-background px-[25px]">
      <div className="container">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div className="space-y-4 pl-[10px]">
            <div className="inline-block rounded-lg bg-green-600 text-white px-3 py-1 text-2xl font-bold">About Us</div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-black dark:text-foreground">
              {loading ? <Skeleton className="h-9 w-3/4" /> : settings?.organizationName || "Our Organization"}
            </h2>
            <div className="text-black dark:text-muted-foreground space-y-3">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <>
                  <p>
                    ২০১৮ সালে প্রতিষ্ঠিত, আমরা একটি অলাভজনক প্রতিষ্ঠান (নিবন্ধন নং: ২০১৮/এ)। আমাদের প্রধান কার্যালয় অবস্থিত — কাজির হাট, থানা: ভূজপুর, উপজেলা: ফটিকছড়ি, জেলা: চট্টগ্রাম-৪৩৫০, বাংলাদেশ।
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p>যা সত্যিই গুরুত্বপূর্ণ, সেটির পাশে দাঁড়ান—আপনার সহযোগিতায় বদলাবে জীবন —এখনই এগিয়ে আসুন।</p>
                    </div>
                    <div className="flex items-start gap-2">
                       <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                       <p>মানবতার পথে আপনার অবদানই হোক আলোর দিশারি। সামান্য সহায়তাই বদলে দিতে পারে কারও ভবিষ্যৎ।</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="relative h-80 w-full overflow-hidden rounded-xl">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <Image
                src={settings?.coverImageUrl || "https://placehold.co/600x400.png"}
                alt="Organization building or event"
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 hover:scale-105"
                data-ai-hint="organization building event"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
