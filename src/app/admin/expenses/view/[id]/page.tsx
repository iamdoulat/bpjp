
// src/app/admin/expenses/view/[id]/page.tsx
"use client"

import * as React from "react"
import Image from "next/image" // If you plan to preview image attachments
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert"
import { getExpenseById, type ExpenseData } from '@/services/expenseService';
import { Loader2, AlertCircle, ArrowLeft, Edit, CalendarDays, FileText, DollarSign, Download, UserCircle } from "lucide-react"
import { Timestamp } from "firebase/firestore"

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "BDT" });
}

function formatDisplayDateTime(date: Date | Timestamp | undefined): string {
  if (!date) return "N/A";
  const jsDate = date instanceof Timestamp ? date.toDate() : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(jsDate);
}

export default function ViewExpensePage() {
  const params = useParams();
  const router = useRouter();
  const expenseId = params.id as string;

  const [expense, setExpense] = React.useState<ExpenseData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (expenseId) {
      async function fetchExpenseDetails() {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedExpense = await getExpenseById(expenseId);
          if (fetchedExpense) {
            setExpense(fetchedExpense);
          } else {
            setError("Expense not found.");
          }
        } catch (e) {
          console.error("Failed to fetch expense details:", e);
          setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
          setIsLoading(false);
        }
      }
      fetchExpenseDetails();
    }
  }, [expenseId]);

  if (isLoading) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Button variant="outline" size="sm" className="mb-4" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
          </Button>
          <Card className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-6 w-1/2 mb-1" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-20 w-full rounded-md" /> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-32" />
            </CardFooter>
          </Card>
        </main>
      </AppShell>
    );
  }

  if (error || !expense) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>{error ? "Error Loading Expense" : "Expense Not Found"}</ShadCNAlertTitle>
            <AlertDescription>{error || "The expense you are looking for does not exist."}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/expenses/history')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Expenses History
          </Button>
        </main>
      </AppShell>
    );
  }
  
  const isImageAttachment = expense.attachmentUrl && /\.(jpg|jpeg|png|gif)$/i.test(expense.attachmentUrl);

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/expenses/history')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Expenses History
        </Button>
        <Card className="shadow-lg">
          <CardHeader className="bg-muted/30 p-4 md:p-6 border-b">
            <CardTitle className="text-2xl font-headline">{expense.name}</CardTitle>
            <CardDescription>Detailed view of the recorded expense.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4 mr-2 text-primary" />
                Amount:
              </div>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(expense.amount)}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 mr-2 text-primary" />
                Date Recorded:
              </div>
              <p className="text-foreground">{formatDisplayDateTime(expense.createdAt)}</p>
            </div>
            
            {expense.createdBy && ( // Assuming createdBy stores user ID, you might want to fetch user details
                <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <UserCircle className="h-4 w-4 mr-2 text-primary" />
                        Recorded By:
                    </div>
                    <p className="text-foreground">{expense.createdBy}</p> {/* Replace with user's name if fetched */}
                </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="h-4 w-4 mr-2 text-primary" />
                Details:
              </div>
              <p className="text-foreground whitespace-pre-line text-sm leading-relaxed p-3 bg-muted/20 rounded-md border">
                {expense.details}
              </p>
            </div>

            {expense.attachmentUrl && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Attachment:</p>
                {isImageAttachment ? (
                  <div className="relative w-full max-w-md aspect-video rounded-md overflow-hidden border">
                    <Image src={expense.attachmentUrl} alt="Expense Attachment Preview" layout="fill" objectFit="contain" data-ai-hint="document invoice receipt"/>
                  </div>
                ) : (
                    <p className="text-sm text-foreground">Attachment: <span className="font-medium">{expense.attachmentUrl.split('/').pop()?.split('?')[0].substring(14) || "File"}</span></p>
                )}
                <Button variant="outline" size="sm" asChild>
                  <a href={expense.attachmentUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" /> Download Attachment
                  </a>
                </Button>
              </div>
            )}
            {!expense.attachmentUrl && (
                 <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Attachment:</p>
                    <p className="text-foreground text-sm">No attachment provided.</p>
                 </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 p-4 md:p-6 border-t">
            <Button onClick={() => router.push(`/admin/expenses/edit/${expenseId}`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Expense
            </Button>
          </CardFooter>
        </Card>
      </main>
    </AppShell>
  )
}
