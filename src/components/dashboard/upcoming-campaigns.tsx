
// src/components/dashboard/upcoming-campaigns.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CampaignCard } from './campaign-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, ChevronLeft, ChevronRight, CalendarCheck2, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getCampaigns, type CampaignData } from '@/services/campaignService';

const CAMPAIGNS_PER_PAGE = 2; // Show fewer on the dashboard for this section

export function UpcomingCampaigns() {
  const [allUpcomingCampaigns, setAllUpcomingCampaigns] = useState<CampaignData[]>([]);
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
        const upcoming = fetchedCampaigns.filter(campaign => campaign.initialStatus === 'upcoming')
                                        .sort((a,b) => {
                                            const dateA = a.startDate instanceof Date ? a.startDate.getTime() : (a.startDate as any)?.toMillis() || 0;
                                            const dateB = b.startDate instanceof Date ? b.startDate.getTime() : (b.startDate as any)?.toMillis() || 0;
                                            return dateA - dateB; // Sort by soonest start date
                                        });
        
        setAllUpcomingCampaigns(upcoming);
        setTotalPages(Math.ceil(upcoming.length / CAMPAIGNS_PER_PAGE));

      } catch (e) {
        console.error("Failed to fetch upcoming campaigns:", e);
        setError(e instanceof Error ? e.message : "Could not load upcoming campaigns. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchCampaignsData();
  }, []);

  useEffect(() => {
    const startIndex = (currentPage - 1) * CAMPAIGNS_PER_PAGE;
    const endIndex = startIndex + CAMPAIGNS_PER_PAGE;
    setDisplayedCampaigns(allUpcomingCampaigns.slice(startIndex, endIndex));
  }, [allUpcomingCampaigns, currentPage]);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-2">
        <CalendarCheck2 className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-headline font-semibold text-foreground">
          Upcoming Campaigns
        </h2>
      </div>
      <p className="text-muted-foreground mb-6 ml-8">
      শীঘ্রই শুরু হতে যাওয়া এই উদ্যোগগুলো সমর্থন করার জন্য প্রস্তুত হোন।
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
              <CampaignCard key={campaign.id || campaign.campaignTitle} campaign={campaign} isPublicView={true} />
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
        </>
      )}

      {!loading && !error && allUpcomingCampaigns.length === 0 && (
         <Alert className="bg-card">
           <CalendarCheck2 className="h-5 w-5 text-muted-foreground mr-2" />
           <AlertTitle>No Upcoming Campaigns</AlertTitle>
           <AlertDescription>
             There are no campaigns scheduled to start soon. Check back later!
           </AlertDescription>
         </Alert>
      )}
      
      {(allUpcomingCampaigns.length > 0 || !loading && !error) && (
          <div className="mt-8 flex justify-center">
            <Button asChild variant="default" size="lg">
              <Link href="/campaigns">
                <Search className="mr-2 h-5 w-5" />
                Explore All Campaigns
              </Link>
            </Button>
          </div>
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
