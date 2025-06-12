
// src/app/page.tsx
"use client";

import { AppShell } from '@/components/layout/app-shell';
import { UserInfo } from '@/components/dashboard/user-info';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { FeaturedCampaigns } from '@/components/dashboard/featured-campaigns';
import { UpcomingCampaigns } from '@/components/dashboard/upcoming-campaigns'; // Added import
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <AppShell>
        <main className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell> {/* AppShell will show login/signup in header */}
        <main className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <h1 className="text-3xl font-headline font-semibold">Welcome to BPJP</h1>
          <p className="text-muted-foreground max-w-md">
            Your platform for discovering and supporting impactful campaigns. Please log in or sign up to access your dashboard and manage your contributions.
          </p>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
          <div className="mt-8 w-full max-w-4xl"> {/* Ensure content width is managed */}
            <FeaturedCampaigns /> {/* Publicly viewable featured campaigns */}
            <UpcomingCampaigns /> {/* Publicly viewable upcoming campaigns */}
          </div>
        </main>
      </AppShell>
    );
  }

  // User is logged in
  return (
    <AppShell>
      <main className="flex-1 p-6 space-y-8 overflow-auto pb-20 md:pb-6">
        <UserInfo />
        <StatsGrid />
        <FeaturedCampaigns />
        <UpcomingCampaigns /> {/* Added Upcoming Campaigns section */}
      </main>
    </AppShell>
  );
}
