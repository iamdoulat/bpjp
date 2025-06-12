
// src/components/stats/platform-donations-card.tsx
"use client";

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Landmark } from 'lucide-react';
import { getCampaigns } from '@/services/campaignService';
import { Skeleton } from '@/components/ui/skeleton';

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function PlatformDonationsCard() {
  const [totalDonations, setTotalDonations] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlatformDonations() {
      try {
        setLoading(true);
        setError(null);
        const campaigns = await getCampaigns();
        const sum = campaigns.reduce((acc, campaign) => acc + (campaign.raisedAmount || 0), 0);
        setTotalDonations(sum);
      } catch (e) {
        console.error("Failed to fetch platform donations:", e);
        setError(e instanceof Error ? e.message : "Could not load platform donation statistics.");
        setTotalDonations(0); // Display $0 on error
      } finally {
        setLoading(false);
      }
    }
    fetchPlatformDonations();
  }, []);

  if (loading) {
    return (
      <StatsCard
        title="Platform Donations"
        value={<Skeleton className="h-7 w-24 inline-block" />}
        subtitle="Total funds raised across all campaigns."
        icon={<Landmark className="h-5 w-5" />}
      />
    );
  }

  return (
    <StatsCard
      title="Platform Donations"
      value={formatCurrency(totalDonations ?? 0)}
      subtitle="Total funds raised across all campaigns."
      icon={<Landmark className="h-5 w-5" />}
    />
  );
}
