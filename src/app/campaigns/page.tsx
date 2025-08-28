
// src/app/campaigns/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { CampaignCard } from "@/components/dashboard/campaign-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCampaigns, type CampaignData } from "@/services/campaignService";
import { Megaphone, ChevronLeft, ChevronRight, ServerCrash, CheckCircle2 } from "lucide-react"; // Added CheckCircle2 for completed
import { Timestamp } from "firebase/firestore";

const CAMPAIGNS_PER_PAGE = 6; // Adjust as needed

export default function BrowseCampaignsPage() {
  const [ongoingCampaigns, setOngoingCampaigns] = React.useState<CampaignData[]>([]);
  const [upcomingCampaigns, setUpcomingCampaigns] = React.useState<CampaignData[]>([]);
  const [completedCampaigns, setCompletedCampaigns] = React.useState<CampaignData[]>([]); // New state for completed campaigns
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [currentOngoingPage, setCurrentOngoingPage] = React.useState(1);
  const [currentUpcomingPage, setCurrentUpcomingPage] = React.useState(1);
  const [currentCompletedPage, setCurrentCompletedPage] = React.useState(1); // New state for completed campaigns pagination

  React.useEffect(() => {
    async function fetchAllCampaigns() {
      setLoading(true);
      setError(null);
      try {
        const fetchedCampaigns = await getCampaigns();
        const active = fetchedCampaigns.filter(c => c.initialStatus === 'active')
                                     .sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        const upcoming = fetchedCampaigns.filter(c => c.initialStatus === 'upcoming')
                                     .sort((a,b) => (a.startDate instanceof Date ? a.startDate.getTime() : (a.startDate as Timestamp)?.toMillis() || 0) - (b.startDate instanceof Date ? b.startDate.getTime() : (b.startDate as Timestamp)?.toMillis() || 0));
        const completed = fetchedCampaigns.filter(c => c.initialStatus === 'completed')
                                     .sort((a,b) => (b.endDate instanceof Date ? b.endDate.getTime() : (b.endDate as Timestamp)?.toMillis() || 0) - (a.endDate instanceof Date ? a.endDate.getTime() : (a.endDate as Timestamp)?.toMillis() || 0)); // Sort by newest end date


        setOngoingCampaigns(active);
        setUpcomingCampaigns(upcoming);
        setCompletedCampaigns(completed); // Set completed campaigns
      } catch (e) {
        console.error("Failed to fetch campaigns:", e);
        setError(e instanceof Error ? e.message : "Could not load campaigns. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchAllCampaigns();
  }, []);

  const paginateCampaigns = (campaigns: CampaignData[], currentPage: number) => {
    const totalPages = Math.ceil(campaigns.length / CAMPAIGNS_PER_PAGE);
    const startIndex = (currentPage - 1) * CAMPAIGNS_PER_PAGE;
    const endIndex = startIndex + CAMPAIGNS_PER_PAGE;
    return {
      paginatedItems: campaigns.slice(startIndex, endIndex),
      totalPages,
    };
  };

  const { paginatedItems: displayedOngoing, totalPages: totalOngoingPages } = paginateCampaigns(ongoingCampaigns, currentOngoingPage);
  const { paginatedItems: displayedUpcoming, totalPages: totalUpcomingPages } = paginateCampaigns(upcomingCampaigns, currentUpcomingPage);
  const { paginatedItems: displayedCompleted, totalPages: totalCompletedPages } = paginateCampaigns(completedCampaigns, currentCompletedPage); // Paginate completed campaigns

  const renderCampaignSection = (
    title: string,
    campaignsToShow: CampaignData[],
    currentPage: number,
    setCurrentPage: (page: number) => void,
    totalPages: number,
    emptyMessage: string,
    icon?: React.ElementType
  ) => {
    const IconComponent = icon || Megaphone; // Default to Megaphone if no icon is provided
    return (
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-2">
            <IconComponent className="h-7 w-7 text-green-600" />
            <h2 className="text-xl font-headline font-semibold text-foreground">{title}</h2>
        </div>
        <p className="text-muted-foreground mb-6 ml-9"> {/* Indent description to align with title */}
          {title === "Active Campaigns" ? "এই চলমান উদ্যোগগুলো আজই সমর্থন করুন।" :
           title === "Upcoming Campaigns" ? "আগামী উদ্যোগগুলো সমর্থনের জন্য প্রস্তুত থাকুন।" :
           "সফলভাবে শেষ হওয়া ক্যাম্পেইনসমূহ পর্যালোচনা করুন।"}
        </p>
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[...Array(2)].map((_, i) => <CampaignCardSkeleton key={i} />)}
          </div>
        ) : error ? (
           <Alert variant="destructive" className="bg-destructive/10">
            <ServerCrash className="h-5 w-5 text-destructive" />
            <AlertTitle>Error Loading Campaigns</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : campaignsToShow.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6">
              {campaignsToShow.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} isPublicView={true} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Alert>
            <AlertTitle>No Campaigns Found</AlertTitle>
            <AlertDescription>{emptyMessage}</AlertDescription>
          </Alert>
        )}
      </section>
    );
  };


  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 overflow-auto pb-20 md:pb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Megaphone className="h-10 w-10 text-green-600" />
            <div>
              <h1 className="text-2xl font-headline font-bold">চলমান কিছু সক্রিয় ক্যাম্পেইন</h1>
              <p className="text-muted-foreground text-md">
                ভালো কাজের পাশে থাকুন, পরিবর্তনের শক্তি হোন।
              </p>
            </div>
          </div>
        </div>

        {renderCampaignSection(
          "Active Campaigns",
          displayedOngoing,
          currentOngoingPage,
          setCurrentOngoingPage,
          totalOngoingPages,
          "No active campaigns at the moment. Check back soon!"
        )}

        {renderCampaignSection(
          "Upcoming Campaigns",
          displayedUpcoming,
          currentUpcomingPage,
          setCurrentUpcomingPage,
          totalUpcomingPages,
          "No upcoming campaigns scheduled yet. Stay tuned!"
        )}

        {renderCampaignSection(
          "Completed Campaigns",
          displayedCompleted,
          currentCompletedPage,
          setCurrentCompletedPage,
          totalCompletedPages,
          "No campaigns have been completed yet.",
          CheckCircle2 // Icon for completed campaigns
        )}

      </main>
    </AppShell>
  );
}

function CampaignCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-0 bg-card rounded-lg shadow-md overflow-hidden">
      <Skeleton className="aspect-[3/2] w-full rounded-t-md" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="p-3 bg-muted/20 border-t flex items-center justify-between">
        <Skeleton className="h-8 w-20" />
        <div className="flex space-x-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-7 w-7 rounded-full" />
        </div>
      </div>
    </div>
  );
}
