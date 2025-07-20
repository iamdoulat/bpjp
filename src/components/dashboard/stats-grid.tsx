// src/components/dashboard/stats-grid.tsx
"use client";

import { useEffect, useState } from 'react';
import { StatsCard } from './stats-card';
import { DollarSign, CalendarClock, Landmark, ListChecks, HeartPulse, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCampaigns, type CampaignData } from '@/services/campaignService';
import { getNetPlatformFundsAvailable, getUniqueCampaignsSupportedByUser, getTotalDonationsByUser } from '@/services/paymentService';
import { Skeleton } from '@/components/ui/skeleton';

interface PlatformStats {
  netPlatformFunds: number;
  activeCampaigns: number;
  upcomingCampaigns: number;
  completedCampaigns: number; // New field for completed campaigns
}

interface UserFetchedStats {
  campaignsSupportedCount: number | null;
  totalDonatedByUser: number | null;
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "BDT", minimumFractionDigits: 0, maximumFractionDigits: 0 });
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
        const netFunds = await getNetPlatformFundsAvailable();
        const campaigns = await getCampaigns();
        const activeCampaigns = campaigns.filter(campaign => campaign.initialStatus === 'active').length;
        const upcomingCampaigns = campaigns.filter(campaign => campaign.initialStatus === 'upcoming').length;
        const completedCampaigns = campaigns.filter(campaign => campaign.initialStatus === 'completed').length; // Count completed
        setPlatformStats({ 
          netPlatformFunds: netFunds,
          activeCampaigns, 
          upcomingCampaigns,
          completedCampaigns, // Add to state
        });
      } catch (e) {
        console.error("Failed to fetch platform stats:", e);
        setError(e instanceof Error ? e.message : "Could not load platform statistics.");
        setPlatformStats({ netPlatformFunds: 0, activeCampaigns: 0, upcomingCampaigns: 0, completedCampaigns: 0 }); // Include completed in error state
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
        setUserFetchedStats({ campaignsSupportedCount: null, totalDonatedByUser: null });
        setLoadingUserStats(false);
      }
    }
    fetchAllStats();
  }, [user]);

  const userSpecificStats = user ? [
    { 
      title: "Your Total Donations", 
      value: loadingUserStats || userFetchedStats.totalDonatedByUser === null ? <Skeleton className="h-7 w-20 bg-white/30" /> : formatCurrency(userFetchedStats.totalDonatedByUser),
      subtitle: "Successful donations", 
      icon: <DollarSign className="h-6 w-6" />,
      color: "green",
      isLoading: loadingUserStats
    },
    { 
      title: "Campaigns You Support", 
      value: loadingUserStats || userFetchedStats.campaignsSupportedCount === null ? <Skeleton className="h-7 w-12 bg-white/30" /> : (userFetchedStats.campaignsSupportedCount?.toString() ?? "0"),
      subtitle: "Unique campaigns supported", 
      icon: <HeartPulse className="h-6 w-6" />,
      color: "purple",
      isLoading: loadingUserStats
    },
  ] : [];

  const baseStats = [
    { 
      title: "Platform Net Funds", 
      value: loadingPlatformStats || !platformStats ? <Skeleton className="h-7 w-24 bg-white/30" /> : formatCurrency(platformStats.netPlatformFunds),
      subtitle: "After operational expenses", 
      icon: <Landmark className="h-6 w-6" />,
      color: "blue",
      isLoading: loadingPlatformStats || !platformStats
    },
    { 
      title: "Active Campaigns", 
      value: loadingPlatformStats || !platformStats ? <Skeleton className="h-7 w-12 bg-white/30" /> : platformStats.activeCampaigns.toString(), 
      subtitle: "Opportunities to give", 
      icon: <ListChecks className="h-6 w-6" />,
      color: "orange",
      isLoading: loadingPlatformStats || !platformStats
    },
    { 
      title: "Upcoming Campaigns", 
      value: loadingPlatformStats || !platformStats ? <Skeleton className="h-7 w-12 bg-white/30" /> : platformStats.upcomingCampaigns.toString(), 
      subtitle: "Get ready for these causes", 
      icon: <CalendarClock className="h-6 w-6" />,
      color: "green",
      isLoading: loadingPlatformStats || !platformStats
    },
    { 
      title: "Completed Campaigns", 
      value: loadingPlatformStats || !platformStats ? <Skeleton className="h-7 w-12 bg-white/30" /> : platformStats.completedCampaigns.toString(), 
      subtitle: "Successfully concluded", 
      icon: <CheckCircle2 className="h-6 w-6" />, // New card for completed
      color: "purple",
      isLoading: loadingPlatformStats || !platformStats
    },
  ];

  // Adjust display logic based on user authentication
  // If user is logged in, show their two stats first, then two platform stats
  // If not logged in, show all four platform stats
  const statsToDisplay = user 
    ? [...userSpecificStats, baseStats[0], baseStats[1]] 
    : baseStats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsToDisplay.map((stat) => (
         stat.isLoading ? (
          <CardSkeleton key={stat.title} color={stat.color as any} />
        ) : (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            icon={stat.icon}
            color={stat.color as any}
          />
        )
      ))}
    </div>
  );
}

const customColorClasses: Record<string, string> = {
  blue: 'bg-[hsl(var(--stats-card-blue))]',
  green: 'bg-[hsl(var(--stats-card-green))]',
  purple: 'bg-[hsl(var(--stats-card-purple))]',
  orange: 'bg-[hsl(var(--stats-card-orange))]',
  red: 'bg-[hsl(var(--stats-card-red))]',
};

function CardSkeleton({ color = 'blue' }: { color?: string }) {
  return (
    <div className={`p-5 rounded-lg flex justify-between items-center ${customColorClasses[color]} opacity-70`}>
      <div className="flex flex-col space-y-2">
        <Skeleton className="h-4 w-24 bg-white/30" />
        <Skeleton className="h-8 w-16 bg-white/30" />
        <Skeleton className="h-3 w-28 bg-white/30" />
      </div>
      <div className="p-3 bg-black/20 rounded-lg">
        <Skeleton className="h-6 w-6 bg-white/30" />
      </div>
    </div>
  );
}
