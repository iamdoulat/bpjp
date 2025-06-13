
// src/app/admin/events/create/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Construction } from "lucide-react";

export default function CreateEventPage() {
  // Admin check should be handled by routing/AppShell, but good to keep in mind
  // const { user, isAdmin } = useAuth();
  // if (!isAdmin) return <AppShell>Access Denied</AppShell>;

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CalendarPlus className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Create Upcoming Event</h1>
              <p className="text-muted-foreground text-sm">
                Add a new event to the upcoming events list. (Admin Only)
              </p>
            </div>
          </div>
        </div>

         <Alert>
          <Construction className="h-4 w-4" />
          <AlertTitle>Under Construction</AlertTitle>
          <AlertDescription>
            The form to create new events will be available here. This feature is currently under development.
          </AlertDescription>
        </Alert>

        <div className="border rounded-lg p-6 bg-card text-card-foreground max-w-2xl mx-auto">
            <p className="text-muted-foreground mb-4">Event creation form will appear here.</p>
            <Button disabled>
                <CalendarPlus className="mr-2 h-4 w-4" /> Create Event (Disabled)
            </Button>
        </div>
      </main>
    </AppShell>
  );
}
