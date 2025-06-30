// src/app/admin/members/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Users, PlusCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";

export default function ManageMembersPage() {

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Manage Members</h1>
              <p className="text-muted-foreground text-sm">
                View, edit, and manage member accounts and profiles.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
        </div>

        <Alert>
          <Users className="h-4 w-4" />
          <ShadCNAlertTitle>Under Construction</ShadCNAlertTitle>
          <AlertDescription>
            This page is for managing members. The functionality to display and manage members will be implemented here.
          </AlertDescription>
        </Alert>
        
      </main>
    </AppShell>
  );
}
