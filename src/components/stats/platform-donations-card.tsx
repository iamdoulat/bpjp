
// src/components/stats/platform-donations-card.tsx
"use client";

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Landmark } from 'lucide-react';
import { getNetPlatformFundsAvailable } from '@/services/paymentService'; // Updated to use net funds
import { Skeleton } from '@/components/ui/skeleton';

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function PlatformDonationsCard() {
  const [netPlatformFunds, setNetPlatformFunds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNetPlatformFunds() {
      try {
        setLoading(true);
        setError(null);
        const netFunds = await getNetPlatformFundsAvailable();
        setNetPlatformFunds(netFunds);
      } catch (e) {
        console.error("Failed to fetch net platform funds:", e);
        setError(e instanceof Error ? e.message : "Could not load platform financial statistics.");
        setNetPlatformFunds(0); // Display $0 on error
      } finally {
        setLoading(false);
      }
    }
    fetchNetPlatformFunds();
  }, []);

  if (loading) {
    return (
      <StatsCard
        title="Platform Net Funds"
        value={<Skeleton className="h-7 w-24 inline-block" />}
        subtitle="Net funds after expenses."
        icon={<Landmark className="h-5 w-5 text-green-600" />}
      />
    );
  }

  return (
    <StatsCard
      title="Platform Net Funds"
      value={formatCurrency(netPlatformFunds ?? 0)}
      subtitle="Total Succeeded Donations minus Expenses."
      icon={<Landmark className="h-5 w-5 text-green-600" />}
    />
  );
}
