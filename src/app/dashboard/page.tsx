// src/app/dashboard/page.tsx
"use client";

import { useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { UserInfo } from '@/components/dashboard/user-info';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { FeaturedCampaigns } from '@/components/dashboard/featured-campaigns';
import { UpcomingCampaigns } from '@/components/dashboard/upcoming-campaigns';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MonthlySummaryChart } from '@/components/dashboard/monthly-summary-chart';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || (!user && !loading)) { 
    return (
      <AppShell>
        <main className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 overflow-auto pb-20 md:pb-6">
        <UserInfo />
        <StatsGrid />
        <MonthlySummaryChart />
        <FeaturedCampaigns />
        <UpcomingCampaigns />
      </main>
    </AppShell>
  );
}
