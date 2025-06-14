
// src/app/admin/overview/page.tsx
"use client";

import * as React from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  DollarSign,
  ListChecks,
  AlertTriangle,
  PlusCircle,
  BarChart3,
  Wand2,
  ShieldCheck,
  RefreshCw,
  FileText,
  AlertCircle as AlertIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllUserProfiles, type UserProfileData } from "@/services/userService";
import { getNetPlatformFundsAvailable, getPendingPaymentsCount } from "@/services/paymentService"; // Updated to use net funds
import { getCampaigns, type CampaignData } from "@/services/campaignService";
import { Alert, AlertTitle as ShadCNAlertTitle, AlertDescription as ShadCNAlertDescription } from "@/components/ui/alert";

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface AdminStatsData {
  totalUsers: number;
  netPlatformFunds: number; // Changed from totalDonations
  activeCampaigns: number;
  pendingPayments: number;
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [stats, setStats] = React.useState<AdminStatsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchAdminStats() {
      setLoading(true);
      setError(null);
      try {
        const [userProfiles, netFunds, allCampaigns, pendingCount] = await Promise.all([
          getAllUserProfiles(),
          getNetPlatformFundsAvailable(), // Fetch net funds
          getCampaigns(),
          getPendingPaymentsCount(),
        ]);

        const activeCampaignsCount = allCampaigns.filter(c => c.initialStatus === 'active').length;

        setStats({
          totalUsers: userProfiles.length,
          netPlatformFunds: netFunds, // Store net funds
          activeCampaigns: activeCampaignsCount,
          pendingPayments: pendingCount,
        });

      } catch (e) {
        console.error("Failed to fetch admin overview stats:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred while fetching statistics.");
      } finally {
        setLoading(false);
      }
    }
    fetchAdminStats();
  }, []);

  const handleQuickAction = (actionName: string, path?: string) => {
    if (path) {
      router.push(path);
    } else {
      toast({
        title: "Action Clicked",
        description: `${actionName} clicked. Functionality to be implemented.`,
      });
    }
  };

  if (error) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-lg">
            <AlertIcon className="h-4 w-4" />
            <ShadCNAlertTitle>Error Loading Statistics</ShadCNAlertTitle>
            <ShadCNAlertDescription>
              {error}
              <br />
              Please check the console for more details and ensure Firestore security rules allow admin access.
            </ShadCNAlertDescription>
             <Button onClick={() => window.location.reload()} className="mt-4">Refresh Page</Button>
          </Alert>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-card rounded-lg shadow">
          <div>
            <h1 className="text-2xl font-headline font-semibold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Overview of platform activity and management tools.
            </p>
          </div>
          <Button asChild>
            <Link href="/new-campaign">
              <PlusCircle className="mr-2 h-4 w-4" />
              Launch New Campaign
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading || !stats ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton variant="destructive" />
            </>
          ) : (
            <>
              <StatsCard
                title="Total Users"
                value={stats.totalUsers.toLocaleString()}
                subtitle="Manage users"
                icon={<Users className="h-5 w-5 text-green-600" />}
              />
              <StatsCard
                title="Platform Net Funds" // Updated title
                value={formatCurrency(stats.netPlatformFunds)} // Use net funds
                subtitle="Net funds after expenses" // Updated subtitle
                icon={<DollarSign className="h-5 w-5 text-green-600" />}
              />
              <StatsCard
                title="Active Campaigns"
                value={stats.activeCampaigns.toString()}
                subtitle="Manage campaigns"
                icon={<ListChecks className="h-5 w-5 text-green-600" />}
              />
              <Card className={cn("shadow-lg", stats.pendingPayments > 0 ? "border-destructive border-2" : "")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={cn("text-sm font-medium font-headline", stats.pendingPayments > 0 ? "text-destructive-foreground" : "")}>Pending Payments</CardTitle>
                  <AlertTriangle className={cn("h-5 w-5", stats.pendingPayments > 0 ? "text-destructive" : "text-muted-foreground")} />
                </CardHeader>
                <CardContent>
                  <div className={cn("text-3xl font-bold font-headline", stats.pendingPayments > 0 ? "text-destructive" : "")}>{stats.pendingPayments}</div>
                  <p className={cn("text-xs pt-1", stats.pendingPayments > 0 ? "text-destructive/80" : "text-muted-foreground")}>
                    {stats.pendingPayments > 0 ? "Review pending payments" : "No pending payments"}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <CardTitle className="font-headline">Platform Analytics</CardTitle>
              </div>
              <CardDescription>Key performance indicators and trends.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] md:h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
              {loading ? <Skeleton className="h-full w-full" /> : <p className="text-muted-foreground">Analytics chart will be displayed here.</p>}
            </CardContent>
            <div className="p-4 border-t">
              <Button variant="outline" onClick={() => handleQuickAction("View Detailed Reports")} disabled={loading}>
                View Detailed Reports
              </Button>
            </div>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
               <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-green-600" />
                <CardTitle className="font-headline">Quick Actions</CardTitle>
              </div>
              <CardDescription>Common administrative tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => handleQuickAction("Manage User Roles", "/admin/users")} disabled={loading}>
                <Users className="mr-3 h-5 w-5" />
                Manage User Roles
              </Button>
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => handleQuickAction("Moderate Campaigns", "/admin/campaigns")} disabled={loading}>
                <ShieldCheck className="mr-3 h-5 w-5" />
                Moderate Campaigns
              </Button>
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => handleQuickAction("Process Refunds", "/admin/payments")} disabled={loading}>
                <RefreshCw className="mr-3 h-5 w-5" />
                Process Refunds
              </Button>
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => handleQuickAction("View System Logs")} disabled={loading}>
                <FileText className="mr-3 h-5 w-5" />
                View System Logs
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}

function StatsCardSkeleton({ variant }: { variant?: "destructive" }) {
  return (
    <Card className={cn("shadow-lg", variant === "destructive" ? "border-destructive border-2" : "")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-12 mb-1" />
        <Skeleton className="h-3 w-28" />
      </CardContent>
    </Card>
  );
}
