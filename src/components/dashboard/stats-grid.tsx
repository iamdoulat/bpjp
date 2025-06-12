
// src/components/dashboard/stats-grid.tsx
"use client";

import { useEffect, useState } from 'react';
import { StatsCard } from './stats-card';
import { DollarSign, Target, CalendarClock, Landmark, ListChecks, HeartPulse } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCampaigns, type CampaignData } from '@/services/campaignService';
import { Skeleton } from '@/components/ui/skeleton';

interface PlatformStats {
  totalDonations: number;
  activeCampaigns: number;
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function StatsGrid() {
  const { user } = useAuth();
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null); // Keep for future error handling

  useEffect(() => {
    async function fetchPlatformStats() {
      try {
        setLoading(true);
        setError(null);
        const campaigns = await getCampaigns();
        
        const totalDonations = campaigns.reduce((sum, campaign) => sum + (campaign.raisedAmount || 0), 0);
        const activeCampaigns = campaigns.filter(campaign => campaign.initialStatus === 'active').length;
        
        setPlatformStats({ totalDonations, activeCampaigns });
      } catch (e) {
        console.error("Failed to fetch platform stats:", e);
        setError(e instanceof Error ? e.message : "Could not load platform statistics.");
      } finally {
        setLoading(false);
      }
    }
    fetchPlatformStats();
  }, []);

  // Placeholder user-specific stats
  const userSpecificStats = [
    { title: "Your Total Donations", value: "$0", subtitle: "Track your contributions (coming soon!).", icon: <DollarSign className="h-5 w-5" /> },
    { title: "Campaigns You Support", value: "0", subtitle: "Impact you're making (coming soon!).", icon: <HeartPulse className="h-5 w-5" /> },
    { title: "Your Upcoming Events", value: "0", subtitle: "Stay involved (coming soon!).", icon: <CalendarClock className="h-5 w-5" /> },
  ];

  const baseStats = [
    { 
      title: "Platform Donations", 
      value: platformStats ? formatCurrency(platformStats.totalDonations) : <Skeleton className="h-7 w-24 inline-block" />,
      subtitle: "Total funds raised for causes.", 
      icon: <Landmark className="h-5 w-5" />,
      isLoading: loading && !platformStats
    },
    { 
      title: "Active Campaigns", 
      value: platformStats ? platformStats.activeCampaigns.toString() : <Skeleton className="h-7 w-12 inline-block" />, 
      subtitle: "Opportunities to make an impact.", 
      icon: <ListChecks className="h-5 w-5" />,
      isLoading: loading && !platformStats
    },
  ];

  const statsToDisplay = user ? [...userSpecificStats, ...baseStats] : baseStats;


  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {statsToDisplay.map((stat) => (
         stat.isLoading ? (
          <CardSkeleton key={stat.title} />
        ) : (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={typeof stat.value === 'string' || typeof stat.value === 'number' ? String(stat.value) : stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
          />
        )
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="p-4 bg-card rounded-lg shadow-md space-y-2">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-5" />
      </div>
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}
