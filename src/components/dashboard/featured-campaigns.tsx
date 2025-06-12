
// src/components/dashboard/featured-campaigns.tsx
"use client";

import { useEffect, useState } from 'react';
import { CampaignCard } from './campaign-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ServerCrash } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { getCampaigns, type CampaignData } from '@/services/campaignService'; // Updated imports

const MAX_FEATURED_CAMPAIGNS = 3;

export function FeaturedCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCampaignsData() {
      try {
        setLoading(true);
        setError(null);
        
        const allCampaigns = await getCampaigns();
        // Simple logic for "featured": take the most recent ones or just the first few active ones.
        // For now, just take the first few active, then upcoming, then draft.
        const sortedCampaigns = [...allCampaigns].sort((a, b) => {
            const statusOrder = { active: 0, upcoming: 1, draft: 2, completed: 3 };
            const statusDiff = statusOrder[a.initialStatus] - statusOrder[b.initialStatus];
            if (statusDiff !== 0) return statusDiff;
            // If status is the same, sort by most recently created (assuming createdAt is a Timestamp)
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.toMillis();
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.toMillis();
            return dateB - dateA;
        });
        
        setCampaigns(sortedCampaigns.slice(0, MAX_FEATURED_CAMPAIGNS));

      } catch (e) {
        console.error("Failed to fetch campaigns:", e);
        setError(e instanceof Error ? e.message : "Could not load campaigns. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchCampaignsData();
  }, []); // Fetch once on mount

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-headline font-semibold mb-2">
        {user ? "Recommended Campaigns" : "Featured Campaigns"}
      </h2>
      <p className="text-muted-foreground mb-6">
        {user ? "Discover campaigns relevant to you." : "Explore popular campaigns you can support."}
      </p>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(MAX_FEATURED_CAMPAIGNS)].map((_, i) => (
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

      {!loading && !error && campaigns && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id || campaign.campaignTitle} campaign={campaign} />
          ))}
        </div>
      )}

      {!loading && !error && campaigns && campaigns.length === 0 && (
         <Alert className="bg-card">
           <AlertTitle>No Campaigns Found</AlertTitle>
           <AlertDescription>
             No featured campaigns available at the moment. Please check back later or create a new campaign!
           </AlertDescription>
         </Alert>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-4 bg-card rounded-lg shadow-md">
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
      <Skeleton className="h-8 w-full mt-auto" />
    </div>
  );
}
