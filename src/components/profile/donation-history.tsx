
// src/components/profile/donation-history.tsx
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, ChevronLeft, ChevronRight } from 'lucide-react';
import DonationHistoryItem, { type Donation } from './donation-history-item';

const mockDonations: Donation[] = [
  { id: '1', campaignName: 'School Supplies Drive', amount: 50.00, date: '2024-06-15', status: 'Succeeded', receiptUrl: '#' },
  { id: '2', campaignName: 'Community Kitchen Fund', amount: 100.00, date: '2024-05-20', status: 'Succeeded', receiptUrl: '#' },
  { id: '3', campaignName: 'Tech for Kids', amount: 75.00, date: '2024-04-10', status: 'Pending' },
  { id: '4', campaignName: 'Park Renovation', amount: 25.00, date: '2024-03-05', status: 'Failed', receiptUrl: '#' },
  { id: '5', campaignName: 'Food Bank Support', amount: 150.00, date: '2024-02-12', status: 'Succeeded', receiptUrl: '#' },
  { id: '6', campaignName: 'Animal Shelter Aid', amount: 60.00, date: '2024-01-20', status: 'Succeeded' },
  { id: '7', campaignName: 'Clean Water Initiative', amount: 200.00, date: '2023-12-10', status: 'Pending', receiptUrl: '#' },
  { id: '8', campaignName: 'Disaster Relief Fund', amount: 90.00, date: '2023-11-01', status: 'Succeeded' },
];

const ITEMS_PER_PAGE = 5;

const DonationHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState(1);
  // In a real app, this data would come from a context, props, or an API call
  const [donations] = React.useState<Donation[]>(mockDonations); 

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

  if (donations.length === 0) {
    return (
      <Card className="shadow-lg mt-8 w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <List className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl font-headline">Donation History</CardTitle>
          </div>
          <CardDescription>Your contributions and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You haven&apos;t made any donations yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg mt-8 w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <List className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl font-headline">Donation History</CardTitle>
        </div>
        <CardDescription>Your contributions and their status.</CardDescription>
      </CardHeader>
      <CardContent className="p-0"> {/* Remove padding from CardContent to allow items to go edge-to-edge */}
        <div className="divide-y divide-border"> {/* Use this if you want lines only between items */}
          {currentDonations.map((donation) => (
            <DonationHistoryItem key={donation.id} donation={donation} />
          ))}
        </div>
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex items-center justify-between pt-6">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
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
