
// src/app/donors-list/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Medal, ServerCrash, Search } from "lucide-react";
import { getAllUserProfiles, type UserProfileData } from "@/services/userService";
import { getPaymentTransactions, type PaymentTransaction } from "@/services/paymentService";
import { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface DonorDisplayData {
  rank: number;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  mobileNumber?: string | null;
  joinedDate?: Date;
  campaignsSupported: number;
  totalDonation: number;
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDisplayDate(date?: Date): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function getInitials(name?: string | null, email?: string): string {
  if (name) {
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[parts.length -1]) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return "U";
}

export default function DonorsListPage() {
  const [donorsList, setDonorsList] = React.useState<DonorDisplayData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchAndProcessDonors() {
      setLoading(true);
      setError(null);
      try {
        const [profiles, transactions] = await Promise.all([
          getAllUserProfiles(),
          getPaymentTransactions()
        ]);

        const profilesMap = new Map<string, UserProfileData>(profiles.map(p => [p.uid, p]));
        const succeededTransactions = transactions.filter(tx => tx.status === "Succeeded");

        const userDonationStats: Record<string, { totalDonation: number; campaignIds: Set<string> }> = {};

        succeededTransactions.forEach(tx => {
          if (!tx.userId) return;
          if (!userDonationStats[tx.userId]) {
            userDonationStats[tx.userId] = { totalDonation: 0, campaignIds: new Set() };
          }
          userDonationStats[tx.userId].totalDonation += tx.amount;
          if (tx.campaignId) {
            userDonationStats[tx.userId].campaignIds.add(tx.campaignId);
          }
        });

        const enrichedDonors = Object.entries(userDonationStats)
          .map(([userId, stats]) => {
            const profile = profilesMap.get(userId);
            // If no profile, we might still want to show the donor if they have significant donations,
            // or filter them out. For now, let's use available info or placeholders.
            const displayName = profile?.displayName || userId;
            const email = profile?.email || "N/A";
            const joined = profile?.joinedDate instanceof Timestamp ? profile.joinedDate.toDate() : undefined;

            return {
              rank: 0, // Placeholder, will be assigned after sorting
              userId: userId,
              name: displayName,
              email: email,
              avatarUrl: profile?.photoURL,
              mobileNumber: profile?.mobileNumber,
              joinedDate: joined,
              campaignsSupported: stats.campaignIds.size,
              totalDonation: stats.totalDonation,
            };
          })
          .sort((a, b) => b.totalDonation - a.totalDonation) // Sort by total donation descending
          .slice(0, 10) // Get top 10
          .map((donor, index) => ({
            ...donor,
            rank: index + 1, // Assign rank
          }));
        
        setDonorsList(enrichedDonors);

      } catch (e) {
        console.error("Failed to fetch or process donor data:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred while loading donor information.");
      } finally {
        setLoading(false);
      }
    }

    fetchAndProcessDonors();
  }, []);

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Medal className="h-8 w-8 text-amber-500" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Top Donors</h1>
              <p className="text-muted-foreground text-sm">
                Recognizing our most generous supporters who make a difference.
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="border rounded-lg shadow-sm overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Rank</TableHead>
                  <TableHead className="min-w-[200px]">User</TableHead>
                  <TableHead className="min-w-[180px]">Email Id</TableHead>
                  <TableHead className="w-[120px]">Joined</TableHead>
                  <TableHead className="w-[100px] text-center">Campaigns</TableHead>
                  <TableHead className="w-[150px] text-right">Total Donated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive">
            <ServerCrash className="h-4 w-4" />
            <AlertTitle>Error Loading Donors</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && donorsList.length === 0 && (
          <Alert>
            <Search className="h-4 w-4" />
            <AlertTitle>No Donors Yet</AlertTitle>
            <AlertDescription>
              There are no donor records to display at the moment. Be the first to contribute!
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && donorsList.length > 0 && (
          <div className="border rounded-lg shadow-sm overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-xs">Rank</TableHead>
                  <TableHead className="min-w-[200px] text-xs">User</TableHead>
                  <TableHead className="min-w-[180px] text-xs">Email ID</TableHead>
                  <TableHead className="w-[120px] text-xs">Joined</TableHead>
                  <TableHead className="w-[100px] text-center text-xs">Campaigns Supported</TableHead>
                  <TableHead className="w-[150px] text-right text-xs">Total Donation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donorsList.map((donor) => (
                  <TableRow key={donor.userId}>
                    <TableCell className="font-medium text-center text-sm">
                       <span className={cn(
                        "inline-block px-2 py-0.5 rounded-full text-xs font-semibold",
                        donor.rank === 1 && "bg-amber-500 text-white",
                        donor.rank === 2 && "bg-slate-400 text-white",
                        donor.rank === 3 && "bg-orange-400 text-white",
                        donor.rank > 3 && "bg-muted text-muted-foreground"
                       )}>
                        {donor.rank}
                       </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={donor.avatarUrl || `https://placehold.co/40x40.png?text=${getInitials(donor.name, donor.email)}`} alt={donor.name} data-ai-hint="profile person" />
                          <AvatarFallback>{getInitials(donor.name, donor.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium truncate block text-sm">{donor.name}</span>
                          {donor.mobileNumber && <span className="text-xs text-muted-foreground block">Mobile: {donor.mobileNumber}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs truncate max-w-[180px]">{donor.email}</TableCell>
                    <TableCell className="text-xs">{formatDisplayDate(donor.joinedDate)}</TableCell>
                    <TableCell className="text-center text-xs">{donor.campaignsSupported}</TableCell>
                    <TableCell className="text-right font-semibold text-sm">{formatCurrency(donor.totalDonation)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             <div className="p-4 text-xs text-muted-foreground">
              Showing top {donorsList.length} donor(s).
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
