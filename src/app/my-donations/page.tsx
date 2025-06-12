
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
import { ListFilter, ChevronLeft, ChevronRight, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext"; // To get user for potential filtering
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the Donation interface for this page
export interface Donation {
  id: string;
  date: Date;
  campaignName: string;
  amount: number;
  status: "Succeeded" | "Pending" | "Failed";
  receiptUrl?: string;
}

// Mock data - replace with Firestore fetching later
const mockDonations: Donation[] = [
  { id: "1", date: new Date("2024-07-15"), campaignName: "Clean Water Initiative", amount: 75.00, status: "Succeeded", receiptUrl: "#" },
  { id: "2", date: new Date("2024-07-14"), campaignName: "Education for All", amount: 120.50, status: "Succeeded", receiptUrl: "#" },
  { id: "3", date: new Date("2024-07-13"), campaignName: "Animal Shelter Support", amount: 30.00, status: "Pending" },
  { id: "4", date: new Date("2024-07-12"), campaignName: "Disaster Relief Fund", amount: 200.00, status: "Failed", receiptUrl: "#" },
  { id: "5", date: new Date("2024-07-11"), campaignName: "Community Garden", amount: 50.00, status: "Succeeded" },
  { id: "6", date: new Date("2024-07-10"), campaignName: "Youth Sports Program", amount: 60.00, status: "Succeeded", receiptUrl: "#" },
  { id: "7", date: new Date("2024-07-09"), campaignName: "Senior Care Packages", amount: 85.00, status: "Succeeded" },
  { id: "8", date: new Date("2024-07-08"), campaignName: "Local Library Books", amount: 40.00, status: "Succeeded", receiptUrl: "#" },
  { id: "9", date: new Date("2024-07-07"), campaignName: "Environmental Cleanup", amount: 100.00, status: "Pending" },
  { id: "10", date: new Date("2024-07-07"), campaignName: "Homeless Shelter Meals", amount: 150.00, status: "Succeeded", receiptUrl: "#" },
  { id: "11", date: new Date("2024-06-20"), campaignName: "Art Supplies for Kids", amount: 25.00, status: "Succeeded" },
  { id: "12", date: new Date("2024-06-15"), campaignName: "Tech Hub Launch", amount: 500.00, status: "Pending", receiptUrl: "#" },
];

const ITEMS_PER_PAGE = 10;

export default function MyDonationsPage() {
  const { user, loading: authLoading } = useAuth(); // User might be needed for actual data fetching
  const [donations, setDonations] = React.useState<Donation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    // Simulate data fetching
    setLoading(true);
    setError(null);
    setTimeout(() => {
      // Sort mock donations by date descending before setting
      const sortedDonations = [...mockDonations].sort((a, b) => b.date.getTime() - a.date.getTime());
      setDonations(sortedDonations);
      setLoading(false);
    }, 500); // Simulate network delay
  }, []);

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

  const getStatusBadgeVariant = (status: Donation["status"]) => {
    switch (status) {
      case "Succeeded": return "default";
      case "Pending": return "secondary";
      case "Failed": return "destructive";
      default: return "outline";
    }
  };

  const getStatusBadgeClassName = (status: Donation["status"]) => {
    switch (status) {
      case "Succeeded": return "bg-green-600 hover:bg-green-700 text-primary-foreground border-green-600";
      case "Pending": return "bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500";
      case "Failed": return "bg-red-600 hover:bg-red-700 text-destructive-foreground border-red-600";
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


  if (authLoading) {
    return (
      <AppShell>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-6 overflow-auto pb-20 md:pb-6">
           <Skeleton className="h-8 w-1/4 mb-2" />
           <Skeleton className="h-4 w-1/2 mb-6" />
           <Skeleton className="h-10 w-24 self-end mb-4" />
           <div className="border rounded-lg shadow-sm">
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <div key={i} className="flex justify-between items-center p-4 border-b">
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-4 w-2/6" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-12" />
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

  return (
    <AppShell>
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 md:py-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
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

        {loading && (
           <div className="border rounded-lg shadow-sm">
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <div key={i} className="flex justify-between items-center p-4 border-b last:border-b-0">
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-4 w-2/6" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
           </div>
        )}

        {error && !loading && (
          <Alert variant="destructive">
            <AlertTitle>Error Loading Donations</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && donations.length === 0 && (
          <Alert>
            <AlertTitle>No Donations Yet</AlertTitle>
            <AlertDescription>You haven't made any donations. Explore campaigns to get started!</AlertDescription>
          </Alert>
        )}

        {!loading && !error && donations.length > 0 && (
          <div className="border rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right w-[120px]">Amount</TableHead>
                  <TableHead className="text-center w-[120px]">Status</TableHead>
                  <TableHead className="text-right w-[100px]">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentDonations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell>{formatDate(donation.date)}</TableCell>
                    <TableCell className="font-medium">{donation.campaignName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(donation.amount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={getStatusBadgeVariant(donation.status)}
                        className={cn("text-xs", getStatusBadgeClassName(donation.status))}
                      >
                        {donation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {donation.receiptUrl ? (
                        <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary">
                          <a href={donation.receiptUrl} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && !loading && !error && donations.length > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}. Showing {currentDonations.length} of {donations.length} donations.
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

