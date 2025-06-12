
// src/app/donors-list/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, Construction } from "lucide-react";

export default function DonorsListPage() {
  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Our Valued Donors</h1>
              <p className="text-muted-foreground text-sm">
                A list recognizing the generous individuals and organizations supporting our causes.
              </p>
            </div>
          </div>
        </div>

         <Alert>
          <Construction className="h-4 w-4" />
          <AlertTitle>Under Construction</AlertTitle>
          <AlertDescription>
            The Donors List page is currently under development. Soon, you'll be able to see a list of our contributors here.
          </AlertDescription>
        </Alert>

        {/* Placeholder for donors list/grid */}
        <div className="border rounded-lg p-6 bg-card text-card-foreground">
            <p className="text-muted-foreground">Information about donors will be displayed here.</p>
        </div>
      </main>
    </AppShell>
  );
}
