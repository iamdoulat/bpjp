// src/components/dashboard/featured-campaigns.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CampaignCard } from './campaign-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, ChevronLeft, ChevronRight, Search, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { getCampaigns, type CampaignData } from '@/services/campaignService';

const CAMPAIGNS_PER_PAGE = 4;

export function FeaturedCampaigns() {
  const { user } = useAuth();
  const [allCampaigns, setAllCampaigns] = useState<CampaignData[]>([]);
  const [displayedCampaigns, setDisplayedCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    async function fetchCampaignsData() {
      try {
        setLoading(true);
        setError(null);
        
        const fetchedCampaigns = await getCampaigns();
        // Filter for only active campaigns
        const activeCampaigns = fetchedCampaigns.filter(
          campaign => campaign.initialStatus === 'active'
        );

        // Sort active campaigns by newest first
        const sortedCampaigns = [...activeCampaigns].sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.toMillis();
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.toMillis();
            return dateB - dateA; // Most recent first
        });
        
        setAllCampaigns(sortedCampaigns);
        setTotalPages(Math.ceil(sortedCampaigns.length / CAMPAIGNS_PER_PAGE));

      } catch (e) {
        console.error("Failed to fetch campaigns:", e);
        setError(e instanceof Error ? e.message : "Could not load campaigns. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchCampaignsData();
  }, []);

  useEffect(() => {
    const startIndex = (currentPage - 1) * CAMPAIGNS_PER_PAGE;
    const endIndex = startIndex + CAMPAIGNS_PER_PAGE;
    setDisplayedCampaigns(allCampaigns.slice(startIndex, endIndex));
  }, [allCampaigns, currentPage]);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-6 w-6 text-orange-500" />
        <h2 className="text-2xl font-headline font-semibold text-foreground">
          Active Campaigns
        </h2>
      </div>
      <p className="text-muted-foreground mb-6 ml-8">
        আপনি যেসব ক্যাম্পেইন দান করতে চান তা এখনই দেখুন
      </p>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(CAMPAIGNS_PER_PAGE)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && !loading && (
        <Alert variant="destructive" className="bg-destructive/10">
          <ServerCrash className="h-5 w-5 text-destructive" />
          <AlertTitle>Error Loading Campaigns</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && displayedCampaigns.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id || campaign.campaignTitle} campaign={campaign} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prev
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <Button asChild variant="default" size="lg">
              <Link href="/campaigns">
                <Search className="mr-2 h-5 w-5" />
                Explore All Campaigns
              </Link>
            </Button>
          </div>
        </>
      )}

      {!loading && !error && allCampaigns.length === 0 && (
         <Alert className="bg-card">
           <AlertTitle>No Active Campaigns Found</AlertTitle>
           <AlertDescription>
             No active featured campaigns available at the moment. Please check back later or create a new campaign!
           </AlertDescription>
         </Alert>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-4 bg-card rounded-lg shadow-md overflow-hidden">
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
