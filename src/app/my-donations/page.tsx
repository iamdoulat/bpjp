
// src/app/my-donations/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ListFilter, ChevronLeft, ChevronRight, History, ServerCrash, ShoppingCart } from "lucide-react"; // Added ServerCrash, ShoppingCart
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getPaymentTransactionsByUserId, type PaymentTransaction } from "@/services/paymentService";

// Interface for donation entries displayed on this page
export interface UserDonationEntry {
  id: string;
  date: Date;
  campaignName?: string; // Campaign name can be optional
  amount: number;
  status: "Succeeded" | "Pending" | "Failed" | "Refunded";
  method: string;
}

const ITEMS_PER_PAGE = 10;

export default function MyDonationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [donations, setDonations] = React.useState<UserDonationEntry[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    if (authLoading) { // Wait for auth state to be determined
      setLoadingData(true);
      return;
    }
    if (!user) {
      setLoadingData(false);
      // setError("Please log in to view your donation history."); // Optional: show error or let AppShell handle
      return;
    }

    async function fetchUserDonations() {
      setLoadingData(true);
      setError(null);
      try {
        const fetchedTransactions: PaymentTransaction[] = await getPaymentTransactionsByUserId(user.uid);
        const mappedDonations: UserDonationEntry[] = fetchedTransactions.map(tx => ({
          id: tx.id,
          date: tx.date instanceof Date ? tx.date : new Date(), // Ensure date is a Date object
          campaignName: tx.campaignName,
          amount: tx.amount,
          status: tx.status,
          method: tx.method,
        }));
        // Sort by date descending
        setDonations(mappedDonations.sort((a, b) => b.date.getTime() - a.date.getTime()));
      } catch (e) {
        console.error("Error fetching user donations:", e);
        setError(e instanceof Error ? e.message : "Could not load your donations.");
      } finally {
        setLoadingData(false);
      }
    }

    fetchUserDonations();
  }, [user, authLoading]);

  const totalPages = Math.ceil(donations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentDonations = donations.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const getStatusBadgeVariant = (status: UserDonationEntry["status"]) => {
    switch (status) {
      case "Succeeded": return "default";
      case "Pending": return "secondary";
      case "Failed": return "destructive";
      case "Refunded": return "outline"; // Use outline for refunded, can be styled distinctly
      default: return "outline";
    }
  };

  const getStatusBadgeClassName = (status: UserDonationEntry["status"]) => {
    switch (status) {
      case "Succeeded": return "bg-green-600 hover:bg-green-700 text-primary-foreground border-green-600";
      case "Pending": return "bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500";
      case "Failed": return "bg-red-600 hover:bg-red-700 text-destructive-foreground border-red-600";
      case "Refunded": return "bg-blue-500 hover:bg-blue-600 text-white border-blue-500"; // Example styling for Refunded
      default: return "";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
  };


  if (authLoading || loadingData) {
    return (
      <AppShell>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-6 overflow-auto pb-20 md:pb-6">
           <div className="flex items-center gap-3 mb-6">
             <History className="h-8 w-8 text-green-600" />
             <div>
                <Skeleton className="h-7 w-64 mb-1" />
                <Skeleton className="h-4 w-80" />
             </div>
           </div>
           <Skeleton className="h-10 w-24 self-end mb-4" />
           <div className="border rounded-lg shadow-sm">
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <div key={i} className="grid grid-cols-5 items-center gap-4 p-4 border-b last:border-b-0">
                <Skeleton className="h-4 w-3/4" /> {/* Date */}
                <Skeleton className="h-4 w-full" /> {/* Campaign */}
                <Skeleton className="h-4 w-3/4 justify-self-end" /> {/* Amount */}
                <Skeleton className="h-4 w-full" /> {/* Method */}
                <Skeleton className="h-6 w-20 rounded-full justify-self-center" /> {/* Status */}
              </div>
            ))}
           </div>
           <div className="flex justify-between items-center mt-6">
             <Skeleton className="h-4 w-1/4" />
             <div className="flex gap-2">
               <Skeleton className="h-9 w-20" />
               <Skeleton className="h-9 w-20" />
             </div>
           </div>
        </main>
      </AppShell>
    );
  }

  if (!user && !authLoading) {
     return (
      <AppShell>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 md:py-6 flex items-center justify-center">
            <Alert>
                <ShoppingCart className="h-4 w-4"/>
                <AlertTitle>Login Required</AlertTitle>
                <AlertDescription>Please log in to view your donation history.</AlertDescription>
            </Alert>
        </main>
      </AppShell>
     )
  }

  return (
    <AppShell>
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">My Donation History</h1>
              <p className="text-muted-foreground text-sm">
                Track all your contributions and their status.
              </p>
            </div>
          </div>
          <Button variant="outline">
            <ListFilter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <ServerCrash className="h-4 w-4" />
            <AlertTitle>Error Loading Donations</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!error && donations.length === 0 && (
          <Alert>
            <ShoppingCart className="h-4 w-4" />
            <AlertTitle>No Donations Yet</AlertTitle>
            <AlertDescription>You haven&apos;t made any donations. Explore campaigns to get started!</AlertDescription>
          </Alert>
        )}

        {!error && donations.length > 0 && (
          <div className="border rounded-lg shadow-sm overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px] text-xs">Date</TableHead>
                  <TableHead className="text-xs">Campaign</TableHead>
                  <TableHead className="text-right w-[100px] text-xs">Amount</TableHead>
                  <TableHead className="text-center w-[120px] text-xs">Method</TableHead>
                  <TableHead className="text-center w-[120px] text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDonations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell className="text-xs">{formatDate(donation.date)}</TableCell>
                    <TableCell className="font-medium text-xs truncate max-w-[150px] md:max-w-xs">{donation.campaignName || "N/A"}</TableCell>
                    <TableCell className="text-right text-xs">{formatCurrency(donation.amount)}</TableCell>
                    <TableCell className="text-center text-xs">{donation.method}</TableCell>
                    <TableCell className="text-center text-xs">
                      <Badge
                        variant={getStatusBadgeVariant(donation.status)}
                        className={cn("text-xs px-2 py-0.5", getStatusBadgeClassName(donation.status))}
                      >
                        {donation.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && !error && donations.length > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">
            <div className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}. Showing {currentDonations.length} of {donations.length} donations.
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="text-xs"
              >
                <ChevronLeft className="mr-1 h-3 w-3" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="text-xs"
              >
                Next
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
