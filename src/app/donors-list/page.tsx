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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Medal, ServerCrash, Search, ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
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
  wardNo?: string | null; // Added wardNo
  joinedDate?: Date;
  campaignsSupported: number;
  totalDonation: number;
}

interface AllDonorsTransactionEntry {
  id: string; // Transaction ID for key
  itemNo: number;
  userName: string;
  userAvatarUrl?: string | null;
  userMobileNumber?: string | null;
  userWardNo?: string | null; // Added userWardNo
  userEmail: string;
  transactionDate: Date;
  campaignNameForTransaction?: string;
  donationAmountForTransaction: number;
  totalCampaignsSupportedByUser: number;
  totalDonationByUser: number;
}

const TOP_DONORS_COUNT = 10;
const ITEMS_PER_PAGE_ALL_DONORS = 20;

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "BDT", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDisplayDate(date?: Date): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatDisplayDateTime(date?: Date): string {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("en-US", { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
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
  const [topDonorsList, setTopDonorsList] = React.useState<DonorDisplayData[]>([]);
  const [allTransactionsList, setAllTransactionsList] = React.useState<AllDonorsTransactionEntry[]>([]);
  
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const [currentPageAllDonors, setCurrentPageAllDonors] = React.useState(1);

  React.useEffect(() => {
    async function fetchAndProcessData() {
      setLoading(true);
      setError(null);
      try {
        const [profiles, transactions] = await Promise.all([
          getAllUserProfiles(),
          getPaymentTransactions() // Assuming this fetches all transactions
        ]);

        const profilesMap = new Map<string, UserProfileData>(profiles.map(p => [p.uid, p]));
        const succeededTransactions = transactions.filter(tx => tx.status === "Succeeded");

        // --- Process for Top Donors ---
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

        const enrichedTopDonors = Object.entries(userDonationStats)
          .map(([userId, stats]) => {
            const profile = profilesMap.get(userId);
            const displayName = profile?.displayName || userId;
            const email = profile?.email || "N/A";
            const joined = profile?.joinedDate instanceof Timestamp ? profile.joinedDate.toDate() : undefined;
            return {
              rank: 0,
              userId: userId,
              name: displayName,
              email: email,
              avatarUrl: profile?.photoURL,
              mobileNumber: profile?.mobileNumber,
              wardNo: profile?.wardNo || null, // Include wardNo
              joinedDate: joined,
              campaignsSupported: stats.campaignIds.size,
              totalDonation: stats.totalDonation,
            };
          })
          .sort((a, b) => b.totalDonation - a.totalDonation)
          .slice(0, TOP_DONORS_COUNT)
          .map((donor, index) => ({ ...donor, rank: index + 1 }));
        setTopDonorsList(enrichedTopDonors);

        // --- Process for All Valued Donors List (Individual Transactions) ---
        const processedTransactions: AllDonorsTransactionEntry[] = succeededTransactions
          .sort((a,b) => (b.date instanceof Date ? b.date.getTime() : (b.date as Timestamp).toMillis()) - (a.date instanceof Date ? a.date.getTime() : (a.date as Timestamp).toMillis())) // Sort by date desc
          .map((tx, index) => {
            const profile = profilesMap.get(tx.userId);
            const userStats = userDonationStats[tx.userId];
            return {
              id: tx.id,
              itemNo: index + 1,
              userName: profile?.displayName || tx.userId,
              userAvatarUrl: profile?.photoURL,
              userMobileNumber: profile?.mobileNumber,
              userWardNo: profile?.wardNo || null, // Include userWardNo
              userEmail: profile?.email || tx.userEmail || "N/A",
              transactionDate: tx.date instanceof Date ? tx.date : (tx.date as Timestamp).toDate(),
              campaignNameForTransaction: tx.campaignName || "N/A",
              donationAmountForTransaction: tx.amount,
              totalCampaignsSupportedByUser: userStats?.campaignIds.size || 0,
              totalDonationByUser: userStats?.totalDonation || 0,
            };
          });
        setAllTransactionsList(processedTransactions);

      } catch (e) {
        console.error("Failed to fetch or process donor data:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred while loading donor information.");
      } finally {
        setLoading(false);
      }
    }
    fetchAndProcessData();
  }, []);

  // Pagination for All Valued Donors List
  const totalPagesAllDonors = Math.ceil(allTransactionsList.length / ITEMS_PER_PAGE_ALL_DONORS);
  const startIndexAllDonors = (currentPageAllDonors - 1) * ITEMS_PER_PAGE_ALL_DONORS;
  const endIndexAllDonors = startIndexAllDonors + ITEMS_PER_PAGE_ALL_DONORS;
  const currentAllDonorsTransactions = allTransactionsList.slice(startIndexAllDonors, endIndexAllDonors);

  const handleNextPageAllDonors = () => setCurrentPageAllDonors(prev => Math.min(prev + 1, totalPagesAllDonors));
  const handlePrevPageAllDonors = () => setCurrentPageAllDonors(prev => Math.max(prev - 1, 1));


  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-8 overflow-auto pb-20 md:pb-6">
        {/* Top Donors Section */}
        <section>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Medal className="h-8 w-8 text-amber-500" />
              <div>
                <h1 className="text-2xl font-headline font-semibold"> শীর্ষ ১০ জন সম্মানিত দাতা</h1>
                <p className="text-muted-foreground text-sm">
                  সবচেয়ে উদার সমর্থকদের প্রতি আমাদের কৃতজ্ঞতা।
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
                    <TableHead className="w-[100px]">Ward No.</TableHead> {/* Added Ward No. skeleton header */}
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
                          <div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20" /></div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell> {/* Ward No. skeleton cell */}
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
              <AlertTitle>Error Loading Top Donors</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && topDonorsList.length === 0 && (
            <Alert>
              <Search className="h-4 w-4" />
              <AlertTitle>No Donors Yet</AlertTitle>
              <AlertDescription>There are no donor records for the Top Donors list yet.</AlertDescription>
            </Alert>
          )}

          {!loading && !error && topDonorsList.length > 0 && (
            <div className="border rounded-lg shadow-sm overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] text-xs">Rank</TableHead>
                    <TableHead className="min-w-[200px] text-xs">User</TableHead>
                    <TableHead className="min-w-[180px] text-xs">Email ID</TableHead>
                    <TableHead className="w-[100px] text-xs">Ward No.</TableHead>
                    <TableHead className="w-[120px] text-xs">Joined</TableHead>
                    <TableHead className="w-[100px] text-center text-xs">Campaigns Supported</TableHead>
                    <TableHead className="w-[150px] text-right text-xs">Total Donation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topDonorsList.map((donor) => (
                    <TableRow key={donor.userId}>
                      <TableCell className="font-medium text-center text-sm">
                        <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-semibold", donor.rank === 1 && "bg-amber-500 text-white", donor.rank === 2 && "bg-slate-400 text-white", donor.rank === 3 && "bg-orange-400 text-white", donor.rank > 3 && "bg-muted text-muted-foreground")}>{donor.rank}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9"><AvatarImage src={donor.avatarUrl || `https://placehold.co/40x40.png?text=${getInitials(donor.name, donor.email)}`} alt={donor.name} data-ai-hint="profile person" /><AvatarFallback>{getInitials(donor.name, donor.email)}</AvatarFallback></Avatar>
                          <div><span className="font-medium truncate block text-sm">{donor.name}</span>{donor.mobileNumber && <span className="text-xs text-muted-foreground block">Mobile: {donor.mobileNumber}</span>}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs truncate max-w-[180px]">{donor.email}</TableCell>
                      <TableCell className="text-xs">{donor.wardNo || "N/A"}</TableCell> {/* Display Ward No. */}
                      <TableCell className="text-xs">{formatDisplayDate(donor.joinedDate)}</TableCell>
                      <TableCell className="text-center text-xs">{donor.campaignsSupported}</TableCell>
                      <TableCell className="text-right font-semibold text-sm">{formatCurrency(donor.totalDonation)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 text-xs text-muted-foreground">Showing top {topDonorsList.length} donor(s).</div>
            </div>
          )}
        </section>

        {/* All Valued Donors List (Individual Transactions) Section */}
        <section className="mt-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <ListChecks className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-headline font-semibold">All Valued Donors List</h1>
                <p className="text-muted-foreground text-sm">
                  A detailed list of all successful donations.
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="border rounded-lg shadow-sm overflow-hidden bg-card">
               <Table>
                <TableHeader><TableRow><TableHead className="w-[50px]">No</TableHead><TableHead className="min-w-[200px]">User</TableHead><TableHead className="min-w-[150px]">Email</TableHead><TableHead className="w-[100px]">Ward No.</TableHead><TableHead className="w-[140px]">Transaction Date</TableHead><TableHead className="min-w-[150px]">Campaign</TableHead><TableHead className="w-[100px] text-right">Donation</TableHead><TableHead className="w-[100px] text-center">Total Supported</TableHead><TableHead className="w-[150px] text-right">User Total</TableHead></TableRow></TableHeader>
                <TableBody>
                    {[...Array(5)].map((_,i) => (
                        <TableRow key={i}><TableCell><Skeleton className="h-4 w-6" /></TableCell>
                        <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-16" /></div></div></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell> {/* Ward No. skeleton cell */}
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell><TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell><TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
               </Table>
            </div>
          )}

          {error && !loading && (
            <Alert variant="destructive">
              <ServerCrash className="h-4 w-4" />
              <AlertTitle>Error Loading Transactions</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && allTransactionsList.length === 0 && (
            <Alert>
              <Search className="h-4 w-4" />
              <AlertTitle>No Transactions Found</AlertTitle>
              <AlertDescription>There are no successful donation transactions to display.</AlertDescription>
            </Alert>
          )}

          {!loading && !error && allTransactionsList.length > 0 && (
            <>
              <div className="border rounded-lg shadow-sm overflow-hidden bg-card">
                <Table>
                  <TableHeader><TableRow><TableHead className="w-[50px] text-xs">No</TableHead><TableHead className="min-w-[200px] text-xs">User</TableHead><TableHead className="min-w-[150px] text-xs">Email ID</TableHead><TableHead className="w-[100px] text-xs">Ward No.</TableHead><TableHead className="w-[140px] text-xs">Transaction Date</TableHead><TableHead className="min-w-[150px] text-xs">Campaigns Name</TableHead><TableHead className="w-[100px] text-right text-xs">Donation</TableHead><TableHead className="w-[100px] text-center text-xs">Campaigns Supported</TableHead><TableHead className="w-[150px] text-right text-xs">Total Donation</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {currentAllDonorsTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs font-medium">{(startIndexAllDonors + currentAllDonorsTransactions.indexOf(tx) + 1)}</TableCell><TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9"><AvatarImage src={tx.userAvatarUrl || `https://placehold.co/40x40.png?text=${getInitials(tx.userName, tx.userEmail)}`} alt={tx.userName} data-ai-hint="profile person" /><AvatarFallback>{getInitials(tx.userName, tx.userEmail)}</AvatarFallback></Avatar>
                            <div><span className="font-medium truncate block text-sm">{tx.userName}</span>{tx.userMobileNumber && <span className="text-xs text-muted-foreground block">Mobile: {tx.userMobileNumber}</span>}</div>
                          </div>
                        </TableCell><TableCell className="text-xs truncate max-w-[150px]">{tx.userEmail}</TableCell><TableCell className="text-xs">{tx.userWardNo || "N/A"}</TableCell><TableCell className="text-xs">{formatDisplayDateTime(tx.transactionDate)}</TableCell><TableCell className="text-xs truncate max-w-[150px]">{tx.campaignNameForTransaction}</TableCell><TableCell className="text-right text-xs font-medium">{formatCurrency(tx.donationAmountForTransaction)}</TableCell><TableCell className="text-center text-xs">{tx.totalCampaignsSupportedByUser}</TableCell><TableCell className="text-right text-xs font-semibold">{formatCurrency(tx.totalDonationByUser)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPagesAllDonors > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                  <div className="text-xs text-muted-foreground">
                    Page {currentPageAllDonors} of {totalPagesAllDonors}. Showing {currentAllDonorsTransactions.length} of {allTransactionsList.length} transactions.
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevPageAllDonors} disabled={currentPageAllDonors === 1} className="text-xs"><ChevronLeft className="mr-1 h-3 w-3" />Previous</Button>
                    <Button variant="outline" size="sm" onClick={handleNextPageAllDonors} disabled={currentPageAllDonors === totalPagesAllDonors} className="text-xs">Next<ChevronRight className="ml-1 h-3 w-3" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </AppShell>
  );
}
