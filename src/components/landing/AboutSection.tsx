// src/components/landing/AboutSection.tsx
"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getOrganizationSettings, type OrganizationSettingsData } from '@/services/organizationSettingsService';
import { Building, Info } from 'lucide-react';

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
    <section id="about" className="pt-5 pb-16 md:py-24 bg-background">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">About Us</div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {loading ? <Skeleton className="h-9 w-3/4" /> : settings?.organizationName || "Our Organization"}
            </h2>
            <div className="text-muted-foreground">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <p>
                  Established in {settings?.establishedYear || 'recent years'}, we are a non-profit organization with registration number {settings?.registrationNumber || 'N/A'}. Our main office is located at {settings?.address || 'our community center'}.
                </p>
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
