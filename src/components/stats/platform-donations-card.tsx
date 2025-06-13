
// src/components/stats/platform-donations-card.tsx
"use client";

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Landmark } from 'lucide-react';
import { getSucceededPlatformDonationsTotal } from '@/services/paymentService'; // Updated import
import { Skeleton } from '@/components/ui/skeleton';

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function PlatformDonationsCard() {
  const [totalSucceededDonations, setTotalSucceededDonations] = useState<number | null>(null); // Renamed for clarity
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlatformSucceededDonations() {
      try {
        setLoading(true);
        setError(null);
        const sum = await getSucceededPlatformDonationsTotal(); // Use the new service function
        setTotalSucceededDonations(sum);
      } catch (e) {
        console.error("Failed to fetch platform succeeded donations:", e);
        setError(e instanceof Error ? e.message : "Could not load platform donation statistics.");
        setTotalSucceededDonations(0); // Display $0 on error
      } finally {
        setLoading(false);
      }
    }
    fetchPlatformSucceededDonations();
  }, []);

  if (loading) {
    return (
      <StatsCard
        title="Platform Donations"
        value={<Skeleton className="h-7 w-24 inline-block" />}
        subtitle="Total Succeeded Donations." // Updated subtitle
        icon={<Landmark className="h-5 w-5" />}
      />
    );
  }

  return (
    <StatsCard
      title="Platform Donations"
      value={formatCurrency(totalSucceededDonations ?? 0)}
      subtitle="Total Succeeded Donations." // Updated subtitle
      icon={<Landmark className="h-5 w-5" />}
    />
  );
}
