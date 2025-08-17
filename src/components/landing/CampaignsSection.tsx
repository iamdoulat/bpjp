// src/components/landing/CampaignsSection.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CampaignCard } from '@/components/dashboard/campaign-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getCampaigns, type CampaignData } from '@/services/campaignService';

export function CampaignsSection() {
  const [activeCampaigns, setActiveCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCampaignsData() {
      try {
        setLoading(true);
        setError(null);
        
        const fetchedCampaigns = await getCampaigns();
        const active = fetchedCampaigns
          .filter(campaign => campaign.initialStatus === 'active')
          .sort((a, b) => (b.createdAt.toMillis() - a.createdAt.toMillis()))
          .slice(0, 3); // Get top 3 most recent active campaigns
        
        setActiveCampaigns(active);
      } catch (e) {
        console.error("Failed to fetch campaigns for landing page:", e);
        setError(e instanceof Error ? e.message : "Could not load campaigns.");
      } finally {
        setLoading(false);
      }
    }
    fetchCampaignsData();
  }, []);

  return (
    <section id="campaigns" className="pt-8 pb-5 md:pb-6 bg-card">
      <div className="container">
        <h2 className="text-3xl font-bold tracking-tight text-center sm:text-4xl text-black dark:text-foreground">
            Active{' '}
            <span className="inline-block rounded-lg bg-green-600 text-white px-3 py-1">
              Campaigns
            </span>
        </h2>
        <p className="mt-4 text-center text-lg text-black dark:text-muted-foreground">
          Join us in making a difference. Support a cause that matters to you.
        </p>
        <div className="mt-12">
          {loading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <ServerCrash className="h-5 w-5" />
              <AlertTitle>Error Loading Campaigns</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : activeCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {activeCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} isPublicView={true} />
              ))}
            </div>
          ) : (
            <Alert>
              <AlertTitle>No Active Campaigns</AlertTitle>
              <AlertDescription>There are no active campaigns at the moment. Please check back soon!</AlertDescription>
            </Alert>
          )}
        </div>
        <div className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link href="/campaigns">
              <Search className="mr-2 h-5 w-5" />
              Explore All Campaigns
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-4 bg-background rounded-lg shadow-md overflow-hidden">
      <Skeleton className="aspect-[3/2] w-full rounded-t-md" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-2 w-full mt-2" />
        <Skeleton className="h-3 w-1/4 mt-1" />
        <Skeleton className="h-10 w-full mt-4" />
      </div>
    </div>
  );
}
