// src/components/dashboard/stats-grid.tsx
"use client";

import { useEffect, useState } from 'react';
import { StatsCard } from './stats-card';
import { DollarSign, CalendarClock, Landmark, ListChecks, HeartPulse } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCampaigns, type CampaignData } from '@/services/campaignService';
import { getSucceededPlatformDonationsTotal, getUniqueCampaignsSupportedByUser, getTotalDonationsByUser } from '@/services/paymentService'; 
import { Skeleton } from '@/components/ui/skeleton';

interface PlatformStats {
  totalSucceededDonations: number;
  activeCampaigns: number;
  upcomingCampaigns: number;
}

interface UserFetchedStats {
  campaignsSupportedCount: number | null;
  totalDonatedByUser: number | null;
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function StatsGrid() {
  const { user } = useAuth();
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [userFetchedStats, setUserFetchedStats] = useState<UserFetchedStats>({ campaignsSupportedCount: null, totalDonatedByUser: null });
  
  const [loadingPlatformStats, setLoadingPlatformStats] = useState(true);
  const [loadingUserStats, setLoadingUserStats] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null); 

  useEffect(() => {
    async function fetchAllStats() {
      setLoadingPlatformStats(true);
      try {
        const succeededDonationsTotal = await getSucceededPlatformDonationsTotal();
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
        setPlatformStats({ totalSucceededDonations: 0, activeCampaigns: 0, upcomingCampaigns: 0 });
      } finally {
        setLoadingPlatformStats(false);
      }

      if (user) {
        setLoadingUserStats(true);
        try {
          const campaignsSupported = await getUniqueCampaignsSupportedByUser(user.uid);
          const userTotalDonations = await getTotalDonationsByUser(user.uid);
          setUserFetchedStats(prev => ({ 
            ...prev, 
            campaignsSupportedCount: campaignsSupported,
            totalDonatedByUser: userTotalDonations,
          }));
        } catch (e) {
          console.error("Failed to fetch user-specific stats:", e);
          setUserFetchedStats(prev => ({ ...prev, campaignsSupportedCount: 0, totalDonatedByUser: 0 }));
        } finally {
          setLoadingUserStats(false);
        }
      } else {
        // Reset user stats if no user or user logs out
        setUserFetchedStats({ campaignsSupportedCount: null, totalDonatedByUser: null });
        setLoadingUserStats(false);
      }
    }
    fetchAllStats();
  }, [user]); // Rerun effect if user changes

  const userSpecificStats = user ? [
    { 
      title: "Your Total Donations", 
      value: loadingUserStats || userFetchedStats.totalDonatedByUser === null ? <Skeleton className="h-7 w-16 inline-block" /> : formatCurrency(userFetchedStats.totalDonatedByUser),
      subtitle: "Total amount of your successful donations.", 
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      isLoading: loadingUserStats
    },
    { 
      title: "Campaigns You Support", 
      value: loadingUserStats || userFetchedStats.campaignsSupportedCount === null ? <Skeleton className="h-7 w-10 inline-block" /> : (userFetchedStats.campaignsSupportedCount?.toString() ?? "0"),
      subtitle: "Unique campaigns with successful donations.", 
      icon: <HeartPulse className="h-5 w-5 text-green-600" />,
      isLoading: loadingUserStats
    },
  ] : [];

  const baseStats = [
    { 
      title: "Platform Donations", 
      value: loadingPlatformStats || !platformStats ? <Skeleton className="h-7 w-24 inline-block" /> : formatCurrency(platformStats.totalSucceededDonations),
      subtitle: "Total Succeeded Donations.", 
      icon: <Landmark className="h-5 w-5 text-green-600" />,
      isLoading: loadingPlatformStats || !platformStats
    },
    { 
      title: "Active Campaigns", 
      value: loadingPlatformStats || !platformStats ? <Skeleton className="h-7 w-12 inline-block" /> : platformStats.activeCampaigns.toString(), 
      subtitle: "Opportunities to make an impact.", 
      icon: <ListChecks className="h-5 w-5 text-green-600" />,
      isLoading: loadingPlatformStats || !platformStats
    },
    { 
      title: "Upcoming Campaigns", 
      value: loadingPlatformStats || !platformStats ? <Skeleton className="h-7 w-12 inline-block" /> : platformStats.upcomingCampaigns.toString(), 
      subtitle: "Get ready for these causes.", 
      icon: <CalendarClock className="h-5 w-5 text-green-600" />,
      isLoading: loadingPlatformStats || !platformStats
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
            value={stat.value}
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
