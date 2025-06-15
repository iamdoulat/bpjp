
// src/app/expenses/history-list/page.tsx
"use client";

import * as React from "react";
import Link from 'next/link'; // Added Link import
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ListChecks, MoreHorizontal, Eye, Edit, Trash2, ServerCrash, Search, FileText, Download, Loader2, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react"; // Changed icon & Added PlusCircle
import { PlatformDonationsCard } from "@/components/stats/platform-donations-card";
import { getExpenses, deleteExpense, type ExpenseData } from "@/services/expenseService";
import { Timestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
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

const ITEMS_PER_PAGE = 20; // Updated to 20 items per page

export default function ExpensesHistoryListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [expenses, setExpenses] = React.useState<ExpenseData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expenseToDelete, setExpenseToDelete] = React.useState<ExpenseData | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
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


  const handleDeleteExpense = async () => {
    if (!expenseToDelete || !expenseToDelete.id) return;
    setIsDeleting(true);
    try {
      await deleteExpense(expenseToDelete.id);
      toast({
        title: "Expense Deleted",
        description: `Expense "${expenseToDelete.name}" has been successfully deleted. Platform funds will reflect this change.`,
      });
      setExpenses(prev => prev.filter(exp => exp.id !== expenseToDelete.id));
      setExpenseToDelete(null);
      if (paginatedExpenses.length === 1 && currentPage > 1 && (filteredExpenses.length -1) % ITEMS_PER_PAGE === 0) {
        setCurrentPage(currentPage - 1);
      }
    } catch (e) {
      console.error("Failed to delete expense:", e);
      toast({
        title: "Error Deleting Expense",
        description: e instanceof Error ? e.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleViewDetails = (expenseId?: string) => {
    if (!expenseId) return;
    router.push(`/admin/expenses/view/${expenseId}`);
  };
  
  const handleEditExpense = (expenseId?: string) => {
    if (!expenseId) return;
    router.push(`/admin/expenses/edit/${expenseId}`);
  };


  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-grow">
            <ListChecks className="h-8 w-8 text-green-600" /> 
            <div>
              <h1 className="text-2xl font-headline font-semibold">Expenses History List</h1>
              <p className="text-muted-foreground text-sm">
                View all recorded expenses. These amounts are deducted from platform funds.
              </p>
            </div>
          </div>
          <div className="w-full md:w-auto md:min-w-[280px] md:max-w-xs mt-4 md:mt-0">
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
          <Button asChild>
            <Link href="/admin/expenses/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Expense
            </Link>
          </Button>
        </div>


        {loading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
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
                  <TableHead className="w-[60px]">No.</TableHead>
                  <TableHead className="min-w-[150px]">Expense Name</TableHead>
                  <TableHead className="min-w-[250px]">Details (Excerpt)</TableHead>
                  <TableHead className="w-[120px] text-right">Amount</TableHead>
                  <TableHead className="w-[180px]">Date Recorded</TableHead>
                  <TableHead className="w-[100px] text-center">Attachment</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExpenses.map((expense, index) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-xs">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell className="font-medium text-sm truncate max-w-[150px]">{expense.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[250px]">
                      {expense.details.substring(0, 60)}{expense.details.length > 60 ? "..." : ""}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">{formatCurrency(expense.amount)}</TableCell>
                    <TableCell className="text-xs">{formatDisplayDateTime(expense.createdAt)}</TableCell>
                    <TableCell className="text-center">
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
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(expense.id)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditExpense(expense.id)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => setExpenseToDelete(expense)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
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

      {expenseToDelete && (
        <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this expense?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the expense:
                <span className="font-semibold"> "{expenseToDelete.name}"</span> for {formatCurrency(expenseToDelete.amount)}.
                The expense amount will be effectively added back to the platform's net funds.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setExpenseToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteExpense}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Expense
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AppShell>
  );
}
