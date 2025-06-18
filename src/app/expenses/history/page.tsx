
// src/app/expenses/history/page.tsx
"use client";

import * as React from "react";
import { useRouter } from 'next/navigation';
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ReceiptText, Eye, Edit, Trash2, ServerCrash, Search, FileText, Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { PlatformDonationsCard } from "@/components/stats/platform-donations-card";
import { getExpenses, deleteExpense, type ExpenseData } from "@/services/expenseService";
import { Timestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "BDT" });
}

function formatDisplayDateTime(date: Date | Timestamp | undefined): string {
  if (!date) return "N/A";
  const jsDate = date instanceof Timestamp ? date.toDate() : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(jsDate);
}

const ITEMS_PER_PAGE = 10;

export default function ExpensesHistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [expenses, setExpenses] = React.useState<ExpenseData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  const fetchExpensesData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedExpenses = await getExpenses();
      setExpenses(fetchedExpenses);
    } catch (e) {
      console.error("Failed to fetch expenses:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchExpensesData();
  }, [fetchExpensesData]);

  const filteredExpenses = expenses.filter(expense =>
    expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.createdBy && typeof expense.createdBy === 'string' && expense.createdBy.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-grow">
            <ReceiptText className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Expenses History</h1>
              <p className="text-muted-foreground text-sm">
                View all recorded expenses. These amounts are deducted from platform funds.
              </p>
            </div>
          </div>
          <div className="w-full md:w-auto mt-4 md:mt-0">
            <PlatformDonationsCard />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 mb-4">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search expenses by name, details..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}}
            />
          </div>
        </div>


        {loading && (
          <div className="space-y-2">
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive">
            <ServerCrash className="h-4 w-4" />
            <ShadCNAlertTitle>Error Loading Expenses</ShadCNAlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && paginatedExpenses.length === 0 && (
          <Alert>
            <FileText className="h-4 w-4" />
            <ShadCNAlertTitle>No Expenses Found</ShadCNAlertTitle>
            <AlertDescription>
              {searchTerm ? "No expenses match your search term." : "There are no expenses recorded yet."}
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && paginatedExpenses.length > 0 && (
          <div className="border rounded-lg shadow-sm overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-xs px-2 sm:px-4 py-3">No.</TableHead>
                  <TableHead className="text-xs px-2 sm:px-4 py-3">Expense Name</TableHead>
                  <TableHead className="text-right text-xs px-2 sm:px-4 py-3">Amount</TableHead>
                  <TableHead className="text-xs px-2 sm:px-4 py-3">Date Recorded</TableHead>
                  <TableHead className="w-24 text-center text-xs px-2 sm:px-4 py-3">Attachment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExpenses.map((expense, index) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-xs px-2 sm:px-4 py-3">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell className="font-medium text-sm truncate max-w-xs sm:max-w-sm md:max-w-md px-2 sm:px-4 py-3">{expense.name}</TableCell>
                    <TableCell className="text-right font-medium text-sm px-2 sm:px-4 py-3">{formatCurrency(expense.amount)}</TableCell>
                    <TableCell className="text-xs px-2 sm:px-4 py-3">{formatDisplayDateTime(expense.createdAt)}</TableCell>
                    <TableCell className="text-center px-2 sm:px-4 py-3">
                      {expense.attachmentUrl ? (
                        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                          <a href={expense.attachmentUrl} target="_blank" rel="noopener noreferrer" title="Download Attachment">
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-4 sm:gap-2">
                    <p className="text-xs text-muted-foreground">
                        Page {currentPage} of {totalPages} ({filteredExpenses.length} total expenses)
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-3 w-3 mr-1" /> Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}

