// src/components/dashboard/stats-grid.tsx
"use client";

import { useEffect, useState } from 'react';
import { StatsCard } from './stats-card';
import { DollarSign, CalendarClock, Landmark, ListChecks, HeartPulse } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCampaigns, type CampaignData } from '@/services/campaignService';
import { getSucceededPlatformDonationsTotal } from '@/services/paymentService'; // Added import
import { Skeleton } from '@/components/ui/skeleton';

interface PlatformStats {
  totalSucceededDonations: number; // Renamed for clarity
  activeCampaigns: number;
  upcomingCampaigns: number;
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function StatsGrid() {
  const { user } = useAuth();
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null); 

  useEffect(() => {
    async function fetchPlatformStats() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch total succeeded donations from paymentTransactions
        const succeededDonationsTotal = await getSucceededPlatformDonationsTotal();
        
        // Fetch campaign counts
        const campaigns = await getCampaigns();
        const activeCampaigns = campaigns.filter(campaign => campaign.initialStatus === 'active').length;
        const upcomingCampaigns = campaigns.filter(campaign => campaign.initialStatus === 'upcoming').length;
        
        setPlatformStats({ 
          totalSucceededDonations: succeededDonationsTotal, 
          activeCampaigns, 
          upcomingCampaigns 
        });
      } catch (e) {
        console.error("Failed to fetch platform stats:", e);
        setError(e instanceof Error ? e.message : "Could not load platform statistics.");
        // Set defaults in case of error to avoid breaking UI
        setPlatformStats({ totalSucceededDonations: 0, activeCampaigns: 0, upcomingCampaigns: 0 });
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
  ];

  const baseStats = [
    { 
      title: "Platform Donations", 
      value: platformStats ? formatCurrency(platformStats.totalSucceededDonations) : <Skeleton className="h-7 w-24 inline-block" />,
      subtitle: "Total Succeeded Donations.", 
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
    { 
      title: "Upcoming Campaigns", 
      value: platformStats ? platformStats.upcomingCampaigns.toString() : <Skeleton className="h-7 w-12 inline-block" />, 
      subtitle: "Get ready for these causes.", 
      icon: <CalendarClock className="h-5 w-5" />,
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
