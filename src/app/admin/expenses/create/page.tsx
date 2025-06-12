// src/app/admin/expenses/create/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FilePlus2, Construction } from "lucide-react";
// Potentially import form components later: Button, Input, Form, etc.

export default function CreateExpensePage() {
  // Add admin check here if necessary, though routing should protect it
  // const { user } = useAuth();
  // const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  // if (!user || user.email !== adminEmail) {
  //   return <AppShell><main className="flex-1 p-6">Access Denied.</main></AppShell>;
  // }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FilePlus2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Create New Expense</h1>
              <p className="text-muted-foreground text-sm">
                Record a new expense for a campaign or operational cost. (Admin Only)
              </p>
            </div>
          </div>
        </div>

         <Alert>
          <Construction className="h-4 w-4" />
          <AlertTitle>Under Construction</AlertTitle>
          <AlertDescription>
            The form to create new expenses will be available here. This feature is currently under development.
          </AlertDescription>
        </Alert>

        {/* Placeholder for expense creation form */}
        <div className="border rounded-lg p-6 bg-card text-card-foreground max-w-2xl mx-auto">
            <p className="text-muted-foreground">Expense creation form will appear here.</p>
            {/* Example of what might be here:
            <Form>
                <FormField name="expenseTitle" render={...} />
                <FormField name="amount" render={...} />
                <FormField name="date" render={...} />
                <FormField name="category" render={...} />
                <FormField name="description" render={...} />
                <Button type="submit">Submit Expense</Button>
            </Form>
            */}
        </div>

      </main>
    </AppShell>
  );
}
