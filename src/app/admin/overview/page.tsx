
// src/app/admin/overview/page.tsx
"use client";

import * as React from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card"; // Reusing StatsCard
import { Skeleton } from "@/components/ui/skeleton"; // For chart placeholder
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  DollarSign,
  ListChecks,
  AlertTriangle,
  PlusCircle,
  BarChart3,
  Wand2, // Or Settings
  ShieldCheck, // For Moderate Campaigns
  RefreshCw, // For Process Refunds
  FileText,  // For View System Logs
  LineChart // Alternative for analytics
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data - replace with actual data fetching
const adminStats = {
  totalUsers: 1250,
  totalDonations: 75800,
  activeCampaigns: 15,
  pendingPayments: 5,
};

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const { toast } = useToast();

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

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        {/* Header Section */}
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

        {/* Stats Cards Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={adminStats.totalUsers.toLocaleString()}
            subtitle="Manage users"
            icon={<Users className="h-5 w-5 text-green-500" />}
          />
          <StatsCard
            title="Total Donations"
            value={formatCurrency(adminStats.totalDonations)}
            subtitle="View payment history"
            icon={<DollarSign className="h-5 w-5 text-green-500" />}
          />
          <StatsCard
            title="Active Campaigns"
            value={adminStats.activeCampaigns.toString()}
            subtitle="Manage campaigns"
            icon={<ListChecks className="h-5 w-5 text-blue-500" />}
          />
          <Card className="shadow-lg border-destructive border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-headline text-destructive-foreground">Pending Payments</CardTitle>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-headline text-destructive">{adminStats.pendingPayments}</div>
              <p className="text-xs text-destructive/80 pt-1">Review pending payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Analytics and Quick Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Analytics Card */}
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <CardTitle className="font-headline">Platform Analytics</CardTitle>
              </div>
              <CardDescription>Key performance indicators and trends.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] md:h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
              <p className="text-muted-foreground">Analytics chart will be displayed here.</p>
              {/* Placeholder for chart component */}
            </CardContent>
            <div className="p-4 border-t">
              <Button variant="outline" onClick={() => handleQuickAction("View Detailed Reports")}>
                View Detailed Reports
              </Button>
            </div>
          </Card>

          {/* Quick Actions Card */}
          <Card className="shadow-lg">
            <CardHeader>
               <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-green-600" />
                <CardTitle className="font-headline">Quick Actions</CardTitle>
              </div>
              <CardDescription>Common administrative tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => handleQuickAction("Manage User Roles", "/admin/users")}>
                <Users className="mr-3 h-5 w-5" />
                Manage User Roles
              </Button>
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => handleQuickAction("Moderate Campaigns", "/admin/campaigns")}>
                <ShieldCheck className="mr-3 h-5 w-5" />
                Moderate Campaigns
              </Button>
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => handleQuickAction("Process Refunds", "/admin/payments")}>
                <RefreshCw className="mr-3 h-5 w-5" />
                Process Refunds
              </Button>
              <Button variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => handleQuickAction("View System Logs")}>
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

