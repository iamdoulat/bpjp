
// src/components/profile/donation-history-item.tsx
"use client";

import type { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Donation {
  id: string;
  campaignName: string;
  amount: number;
  date: string; // Should be a Date object in a real scenario
  status: 'Succeeded' | 'Pending' | 'Failed';
  receiptUrl?: string; // Optional
}

interface DonationHistoryItemProps {
  donation: Donation;
}

const DonationHistoryItem: FC<DonationHistoryItemProps> = ({ donation }) => {
  const getStatusBadgeVariant = (status: Donation['status']) => {
    switch (status) {
      case 'Succeeded':
        return 'default'; // Will be styled green
      case 'Pending':
        return 'secondary'; // Will be styled yellow/orange
      case 'Failed':
        return 'destructive'; // Will be styled red
      default:
        return 'outline';
    }
  };

  const getStatusBadgeClassName = (status: Donation['status']) => {
    switch (status) {
      case 'Succeeded':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
      case 'Pending':
        return 'bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500'; // Darker text for yellow
      case 'Failed':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-border last:border-b-0">
      <div className="flex-1">
        <h4 className="font-semibold text-sm md:text-base">{donation.campaignName}</h4>
        <p className="text-xs md:text-sm text-muted-foreground">
          Donated ${donation.amount.toFixed(2)} on {new Date(donation.date).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center space-x-3 md:space-x-4 ml-4">
        <Badge 
          variant={getStatusBadgeVariant(donation.status)} 
          className={cn("text-xs px-2 py-0.5 md:px-2.5 md:py-1", getStatusBadgeClassName(donation.status))}
        >
          {donation.status}
        </Badge>
        {donation.receiptUrl && (
          <Button variant="link" size="sm" className="p-0 h-auto text-xs md:text-sm" asChild>
            <a href={donation.receiptUrl} target="_blank" rel="noopener noreferrer">
              View Receipt
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};

export default DonationHistoryItem;
