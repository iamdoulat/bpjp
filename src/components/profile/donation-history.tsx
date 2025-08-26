
// src/components/profile/donation-history.tsx
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, ChevronLeft, ChevronRight, ServerCrash, ShoppingCart } from 'lucide-react';
import DonationHistoryItem, { type DonationDisplayItem } from './donation-history-item';
import { useAuth } from '@/contexts/AuthContext';
import { getPaymentTransactionsByUserId, type PaymentTransaction } from '@/services/paymentService';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from '@/components/ui/alert';

const ITEMS_PER_PAGE = 5;

const DonationHistory: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [donations, setDonations] = React.useState<DonationDisplayItem[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    if (authLoading) {
      setIsLoadingData(true);
      return;
    }
    if (!user) {
      setIsLoadingData(false);
      // User not logged in, can optionally set an error or just show empty state
      // setError("Please log in to view your donation history.");
      setDonations([]); // Clear any existing donations
      return;
    }

    async function fetchUserDonations() {
      setIsLoadingData(true);
      setError(null);
      try {
        const fetchedTransactions: PaymentTransaction[] = await getPaymentTransactionsByUserId(user.uid);
        const mappedDonations: DonationDisplayItem[] = fetchedTransactions.map(tx => ({
          id: tx.id,
          campaignName: tx.campaignName,
          amount: tx.amount,
          date: tx.date instanceof Date ? tx.date : new Date(), // Ensure date is a Date object
          status: tx.status,
        }));
        setDonations(mappedDonations.sort((a, b) => b.date.getTime() - a.date.getTime()));
      } catch (e) {
        console.error("Error fetching user donations for profile:", e);
        setError(e instanceof Error ? e.message : "Could not load your donations.");
      } finally {
        setIsLoadingData(false);
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

  if (authLoading || isLoadingData) {
    return (
      <Card className="shadow-lg mt-8 w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <List className="h-6 w-6 text-green-600" />
            <CardTitle className="text-xl font-headline">Donation History</CardTitle>
          </div>
          <CardDescription>Your contributions and their status.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
         <CardFooter className="flex items-center justify-between pt-6">
          <Skeleton className="h-4 w-1/4" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </CardFooter>
      </Card>
    );
  }
  
  if (!user && !authLoading) {
     return (
      <Card className="shadow-lg mt-8 w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <List className="h-6 w-6 text-green-600" />
            <CardTitle className="text-xl font-headline">Donation History</CardTitle>
          </div>
          <CardDescription>আপনার দান এবং বর্তমান অবস্থা।</CardDescription>
        </CardHeader>
        <CardContent>
             <Alert variant="default" className="mt-0">
                <ShoppingCart className="h-4 w-4"/>
                <ShadCNAlertTitle>Login Required</ShadCNAlertTitle>
                <AlertDescription>Please log in to view your donation history.</AlertDescription>
            </Alert>
        </CardContent>
      </Card>
     )
  }


  return (
    <Card className="shadow-lg mt-8 w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <List className="h-6 w-6 text-green-600" />
          <CardTitle className="text-xl font-headline">Donation History</CardTitle>
        </div>
        <CardDescription>আপনার দান এবং বর্তমান অবস্থা।</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <ServerCrash className="h-4 w-4" />
              <ShadCNAlertTitle>Error Loading Donations</ShadCNAlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
        {!error && donations.length === 0 && (
           <div className="p-4">
            <Alert>
                <ShoppingCart className="h-4 w-4" />
                <ShadCNAlertTitle>No Donations Yet</ShadCNAlertTitle>
                <AlertDescription>You haven&apos;t made any donations. Explore campaigns to get started!</AlertDescription>
            </Alert>
           </div>
        )}
        {!error && donations.length > 0 && (
          <div className="divide-y divide-border">
            {currentDonations.map((donation) => (
              <DonationHistoryItem key={donation.id} donation={donation} />
            ))}
          </div>
        )}
      </CardContent>
      {!error && totalPages > 1 && donations.length > 0 && (
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}. Showing {currentDonations.length} of {donations.length} donations.
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Prev
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
        </CardFooter>
      )}
    </Card>
  );
};

export default DonationHistory;


