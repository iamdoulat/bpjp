// src/components/landing/CommitteeSection.tsx
"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getOrganizationSettings, type OrganizationSettingsData } from '@/services/organizationSettingsService';
import { Users, Phone } from 'lucide-react';

export function CommitteeSection() {
  const [settings, setSettings] = useState<OrganizationSettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getOrganizationSettings();
        setSettings(data);
      } catch (e) {
        console.error("Failed to fetch committee data:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <section id="committee" className="py-16 md:py-24 bg-card">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm mb-4">Leadership</div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Meet Our Committee</h2>
            <div className="mt-4 text-lg text-muted-foreground">
                <span>The driving force behind our mission. Committee Period: {loading ? <Skeleton className="h-5 w-24 inline-block" /> : settings?.committeePeriod || 'N/A'}.</span>
            </div>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-2">
            {loading ? (
                <>
                    <LeadershipCardSkeleton />
                    <LeadershipCardSkeleton />
                </>
            ) : (
                <>
                    <LeadershipCard
                        name={settings?.presidentName || "President"}
                        title="President"
                        imageUrl={settings?.presidentImageURL}
                        mobileNumber={settings?.presidentMobileNumber}
                    />
                    <LeadershipCard
                        name={settings?.secretaryName || "General Secretary"}
                        title="General Secretary"
                        imageUrl={settings?.secretaryImageURL}
                        mobileNumber={settings?.secretaryMobileNumber}
                    />
                </>
            )}
        </div>
      </div>
    </section>
  );
}

interface LeadershipCardProps {
    name: string;
    title: string;
    imageUrl?: string | null;
    mobileNumber?: string | null;
}

function LeadershipCard({ name, title, imageUrl, mobileNumber }: LeadershipCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-primary/20 shadow-lg">
        <Image
          src={imageUrl || "https://placehold.co/160x160.png"}
          alt={`Portrait of ${name}`}
          layout="fill"
          objectFit="cover"
          data-ai-hint="person portrait"
        />
      </div>
      <div className="mt-6">
        <h3 className="text-xl font-bold">{name}</h3>
        <p className="text-muted-foreground">{title}</p>
        {mobileNumber && (
            <div className="flex items-center justify-center mt-2 text-sm text-muted-foreground">
                <Phone className="mr-2 h-4 w-4" />
                <span>{mobileNumber}</span>
            </div>
        )}
      </div>
    </div>
  );
}

function LeadershipCardSkeleton() {
    return (
        <div className="flex flex-col items-center text-center">
            <Skeleton className="h-40 w-40 rounded-full" />
            <div className="mt-6 space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
            </div>
        </div>
    );
}
