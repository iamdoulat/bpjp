
import { AppShell } from '@/components/layout/app-shell';
import { UserInfo } from '@/components/dashboard/user-info';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { FeaturedCampaigns } from '@/components/dashboard/featured-campaigns';

export default function DashboardPage() {
  return (
    <AppShell>
      <main className="flex-1 p-6 space-y-8 overflow-auto pb-20 md:pb-6">
        <UserInfo />
        <StatsGrid />
        <FeaturedCampaigns />
      </main>
    </AppShell>
  );
}
