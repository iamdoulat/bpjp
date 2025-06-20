// src/app/admin/election-vote/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation"; 
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { Gavel, PlusCircle, Settings, ListChecks, Info, Users } from "lucide-react";

export default function ManageElectionVotePage() {
  const router = useRouter(); 

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Gavel className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Manage Election & Voting</h1>
              <p className="text-muted-foreground text-sm">
                Oversee election setup, candidate management, and voting results.
              </p>
            </div>
          </div>
          <Button onClick={() => alert("Navigate to Create New Election Page (to be implemented)")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Election
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Candidate Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage candidate nominations, applications, and approvals.
              </CardDescription>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/admin/election-vote/candidate-management")}>
                View Candidates
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Voting Results</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor voting progress and view final election results.
              </CardDescription>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/admin/election-vote/results")}>
                View Results
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
