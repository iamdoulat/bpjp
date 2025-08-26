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
import { Timestamp } from 'firebase/firestore';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
          .sort((a, b) => {
              const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : (a.createdAt as unknown as Date).getTime();
              const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : (b.createdAt as unknown as Date).getTime();
              return dateB - dateA;
          })
          .slice(0, 4); // Get top 4 most recent active campaigns
        
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
          <span className="bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            Active Campaigns
          </span>
        </h2>
        <p className="mt-4 text-center text-lg text-black dark:text-muted-foreground">
          আপনার সমর্থনেই জন্ম নেয় আশা। পাশে থাকুন একটি মহৎ উদ্দেশ্যে।
        </p>
        <div className="mt-12 flex justify-center">
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
             <Carousel
              opts={{
                align: "center",
                loop: activeCampaigns.length > 3,
              }}
              className="w-full px-[35px] my-[5px] mx-[20px]"
            >
              <CarouselContent className="-ml-4">
                {activeCampaigns.map((campaign) => (
                  <CarouselItem key={campaign.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                    <div className="p-1 h-full">
                      <CampaignCard campaign={campaign} isPublicView={true} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-[-5px] sm:left-[-5px] top-1/2 -translate-y-1/2 hidden lg:flex" />
              <CarouselNext className="absolute right-[-5px] sm:right-[-5px] top-1/2 -translate-y-1/2 hidden lg:flex" />
            </Carousel>
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
