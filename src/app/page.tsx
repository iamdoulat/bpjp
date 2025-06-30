// src/app/page.tsx
"use client";

import { useEffect } from 'react'; // Added useEffect
import { AppShell } from '@/components/layout/app-shell';
import { UserInfo } from '@/components/dashboard/user-info';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { FeaturedCampaigns } from '@/components/dashboard/featured-campaigns';
import { UpcomingCampaigns } from '@/components/dashboard/upcoming-campaigns';
import { CompletedCampaignsDashboardSection } from '@/components/dashboard/completed-campaigns-dashboard'; // Added import
import { useAuth } from '@/contexts/AuthContext';
// Button and Link are not used when redirecting unauthenticated users from root
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Added useRouter

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter(); // Initialize router

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]); // Add dependencies

  // Show loader if auth state is loading OR if user is not authenticated (while redirect is in progress)
  if (loading || (!user && !loading)) { 
    return (
      <AppShell>
        <main className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
      </AppShell>
    );
  }

  // If we reach here, user is loaded and authenticated
  return (
    <AppShell>
      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8 space-y-8 overflow-auto pb-20 md:pb-6 animate-zoom-in">
        <UserInfo />
        <StatsGrid />
        <FeaturedCampaigns />
        <UpcomingCampaigns />
        <CompletedCampaignsDashboardSection /> {/* Added new section */}
      </main>
    </AppShell>
  );
}
