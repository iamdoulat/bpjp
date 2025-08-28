
// src/components/dashboard/completed-campaigns-dashboard.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CampaignCard } from './campaign-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, ChevronLeft, ChevronRight, CheckCircle2, Search } from 'lucide-react'; // Changed icon to CheckCircle2
import { Skeleton } from '@/components/ui/skeleton';
import { getCampaigns, type CampaignData } from '@/services/campaignService';
import { Timestamp } from 'firebase/firestore';

const CAMPAIGNS_PER_PAGE = 2; // Show fewer on the dashboard for this section

export function CompletedCampaignsDashboardSection() {
  const [allCompletedCampaigns, setAllCompletedCampaigns] = useState<CampaignData[]>([]);
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
        const completed = fetchedCampaigns.filter(campaign => campaign.initialStatus === 'completed')
                                        .sort((a,b) => {
                                            // Sort by end date descending, then by creation date descending as a fallback
                                            const dateA = a.endDate instanceof Date ? a.endDate.getTime() : (a.endDate as Timestamp)?.toMillis() || 0;
                                            const dateB = b.endDate instanceof Date ? b.endDate.getTime() : (b.endDate as Timestamp)?.toMillis() || 0;
                                            if (dateB !== dateA) return dateB - dateA;
                                            const createdAtA = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.toMillis();
                                            const createdAtB = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.toMillis();
                                            return createdAtB - createdAtA;
                                        });
        
        setAllCompletedCampaigns(completed);
        setTotalPages(Math.ceil(completed.length / CAMPAIGNS_PER_PAGE));

      } catch (e) {
        console.error("Failed to fetch completed campaigns:", e);
        setError(e instanceof Error ? e.message : "Could not load completed campaigns. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchCampaignsData();
  }, []);

  useEffect(() => {
    const startIndex = (currentPage - 1) * CAMPAIGNS_PER_PAGE;
    const endIndex = startIndex + CAMPAIGNS_PER_PAGE;
    setDisplayedCampaigns(allCompletedCampaigns.slice(startIndex, endIndex));
  }, [allCompletedCampaigns, currentPage]);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  // Callback function to refetch and update a specific campaign in the list
  const handleDonationSuccessForCard = async (campaignId: string) => {
    try {
      const updatedCampaign = await getCampaignById(campaignId);
      if (updatedCampaign) {
        // Update the specific campaign in allCampaigns list
        setAllCompletedCampaigns(prevCampaigns =>
          prevCampaigns.map(c => (c.id === campaignId ? updatedCampaign : c))
        );
        // Update the specific campaign in displayedCampaigns list as well
        setDisplayedCampaigns(prevCampaigns =>
          prevCampaigns.map(c => (c.id === campaignId ? updatedCampaign : c))
        );
      }
    } catch (error) {
      console.error("Failed to refetch campaign after donation:", error);
    }
  };


  return (
    <div className="mt-10">
      <h2 className="text-2xl font-headline font-semibold mb-2 dark:text-white">
        Completed Campaigns
      </h2>
      <p className="text-muted-foreground mb-6">
      সফলভাবে সমাপ্ত উদ্যোগগুলো পর্যালোচনা করুন।
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
              <CampaignCard 
                key={campaign.id || campaign.campaignTitle} 
                campaign={campaign} 
                isPublicView={true}
                onDonationSuccess={handleDonationSuccessForCard}
              />
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

      {!loading && !error && allCompletedCampaigns.length === 0 && (
         <Alert className="bg-card">
           <CheckCircle2 className="h-5 w-5 text-muted-foreground mr-2" />
           <AlertTitle>No Completed Campaigns</AlertTitle>
           <AlertDescription>
             No campaigns have been marked as completed yet.
           </AlertDescription>
         </Alert>
      )}
      
      {(allCompletedCampaigns.length > 0 || !loading && !error) && (
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

// Helper function to get campaign by ID, needed for onDonationSuccess callback
async function getCampaignById(id: string): Promise<CampaignData | null> {
  const fetchedCampaigns = await getCampaigns(); // Re-uses existing service
  return fetchedCampaigns.find(c => c.id === id) || null;
}
