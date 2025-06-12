"use client";

import { useEffect, useState } from 'react';
import { personalizedCampaignRecommendations, type PersonalizedCampaignRecommendationsOutput, type PersonalizedCampaignRecommendationsInput } from '@/ai/flows/personalized-campaign-recommendations';
import { CampaignCard } from './campaign-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ServerCrash } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function FeaturedCampaigns() {
  const [campaigns, setCampaigns] = useState<PersonalizedCampaignRecommendationsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        setLoading(true);
        setError(null);
        // Mock user data for the AI flow
        const input: PersonalizedCampaignRecommendationsInput = {
          userId: 'user123',
          donationHistory: ['campaignA', 'campaignB'], // Example history
          preferences: 'environment, education', // Example preferences
        };
        const recommendedCampaigns = await personalizedCampaignRecommendations(input);
        setCampaigns(recommendedCampaigns);
      } catch (e) {
        console.error("Failed to fetch campaign recommendations:", e);
        setError("Could not load campaign recommendations. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-headline font-semibold mb-2">Featured Campaigns</h2>
      <p className="text-muted-foreground mb-6">Discover campaigns you can support, tailored to your interests.</p>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
            <CampaignCard key={campaign.campaignId} campaign={campaign} />
          ))}
        </div>
      )}

      {!loading && !error && campaigns && campaigns.length === 0 && (
         <Alert className="bg-card">
           <AlertTitle>No Campaigns Found</AlertTitle>
           <AlertDescription>We couldn't find any campaigns matching your profile right now. Please check back later!</AlertDescription>
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
