
// src/app/election-vote/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Vote, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";

export default function ElectionVotePage() {
  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 overflow-auto pb-20 md:pb-8">
        <div className="flex items-center gap-3 mb-4">
          <Vote className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-headline font-bold">Election & Voting Portal</h1>
            <p className="text-muted-foreground text-md">
              Participate in organizational elections and cast your vote.
            </p>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Current & Upcoming Elections</CardTitle>
            <CardDescription>
              Information about ongoing or upcoming election events will be displayed here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <ShadCNAlertTitle>No Active Elections</ShadCNAlertTitle>
              <AlertDescription>
                There are currently no active elections or voting periods open. Please check back later for updates.
                Details about candidate nominations, election timelines, and voting procedures will be provided here when an election is announced.
              </AlertDescription>
            </Alert>
            {/* Placeholder for election listings or voting interface */}
            <div className="p-6 border rounded-lg bg-muted/20 text-center">
              <p className="text-muted-foreground">Election details will appear here.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
