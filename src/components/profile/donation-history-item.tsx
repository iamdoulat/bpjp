
// src/components/profile/donation-history-item.tsx
"use client";

import type { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Keep for potential future use, though View Receipt is removed
import { cn } from '@/lib/utils';
import type { PaymentTransaction } from '@/services/paymentService'; // Import actual type

// Simplified Donation interface, aligning with what PaymentTransaction offers for display
// Date will be a Date object, status includes 'Refunded'
export interface DonationDisplayItem {
  id: string;
  campaignName?: string; // Campaign name can be optional
  amount: number;
  date: Date; // Expect a Date object
  status: "Succeeded" | "Pending" | "Failed" | "Refunded";
  // receiptUrl?: string; // Removed as it's not in PaymentTransaction
}

interface DonationHistoryItemProps {
  donation: DonationDisplayItem;
}

const DonationHistoryItem: FC<DonationHistoryItemProps> = ({ donation }) => {
  const getStatusBadgeVariant = (status: DonationDisplayItem['status']) => {
    switch (status) {
      case 'Succeeded':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Failed':
        return 'destructive';
      case 'Refunded':
        return 'outline'; // Keep outline for refunded, can be styled distinctly
      default:
        return 'outline';
    }
  };

  const getStatusBadgeClassName = (status: DonationDisplayItem['status']) => {
    switch (status) {
      case 'Succeeded':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
      case 'Pending':
        return 'bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500';
      case 'Failed':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
      case 'Refunded':
        return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500';
      default:
        return '';
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
    return amount.toLocaleString("en-US", { style: "currency", currency: "BDT" });
  };


  return (
    <div className="flex items-center justify-between p-4 border-b border-border last:border-b-0 bg-card hover:bg-muted/50 transition-colors duration-150">
      <div className="flex-1">
        <h4 className="font-semibold text-sm md:text-base">{donation.campaignName || "General Donation"}</h4>
        <p className="text-xs md:text-sm text-muted-foreground">
          Donated {formatCurrency(donation.amount)} on {formatDate(donation.date)}
        </p>
      </div>
      <div className="flex items-center space-x-3 md:space-x-4 ml-4">
        <Badge 
          variant={getStatusBadgeVariant(donation.status)} 
          className={cn("text-xs px-2 py-0.5 md:px-2.5 md:py-1", getStatusBadgeClassName(donation.status))}
        >
          {donation.status}
        </Badge>
        {/* {donation.receiptUrl && ( // Removed as receiptUrl is not available
          <Button variant="link" size="sm" className="p-0 h-auto text-xs md:text-sm" asChild>
            <a href={donation.receiptUrl} target="_blank" rel="noopener noreferrer">
              View Receipt
            </a>
          </Button>
        )} */}
      </div>
    </div>
  );
};

export default DonationHistoryItem;
