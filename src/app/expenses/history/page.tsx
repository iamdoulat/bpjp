
// src/app/expenses/history/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReceiptText, Construction } from "lucide-react";
import { PlatformDonationsCard } from "@/components/stats/platform-donations-card";

export default function ExpensesHistoryPage() {
  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-grow">
            <ReceiptText className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Expenses History</h1>
              <p className="text-muted-foreground text-sm">
                View all recorded expenses for campaigns and operations.
              </p>
            </div>
          </div>
          <div className="w-full md:w-auto md:min-w-[280px] md:max-w-xs mt-4 md:mt-0"> {/* Container for the card */}
            <PlatformDonationsCard />
          </div>
        </div>

        <Alert>
          <Construction className="h-4 w-4" />
          <AlertTitle>Under Construction</AlertTitle>
          <AlertDescription>
            This page is currently under development. Please check back later for full functionality.
            You will be able to view detailed expense records here.
          </AlertDescription>
        </Alert>

        {/* Placeholder for table or list of expenses */}
        <div className="border rounded-lg p-6 bg-card text-card-foreground">
            <p className="text-muted-foreground">Expense data will be displayed here in a table format.</p>
        </div>
      </main>
    </AppShell>
  );
}

