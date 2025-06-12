
// src/app/upcoming-events/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarCheck2, Construction } from "lucide-react";

export default function UpcomingEventsPage() {
  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CalendarCheck2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Upcoming Events</h1>
              <p className="text-muted-foreground text-sm">
                Discover and join our upcoming events.
              </p>
            </div>
          </div>
        </div>

         <Alert>
          <Construction className="h-4 w-4" />
          <AlertTitle>Under Construction</AlertTitle>
          <AlertDescription>
            The list of upcoming events will be displayed here. This feature is currently under development.
          </AlertDescription>
        </Alert>

        {/* Placeholder for event listing */}
        <div className="border rounded-lg p-6 bg-card text-card-foreground">
            <p className="text-muted-foreground">Upcoming events list will appear here.</p>
        </div>

      </main>
    </AppShell>
  );
}
