
// src/app/admin/payments/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DollarSign, Search, ListFilter, MoreHorizontal, Eye, RefreshCw, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Define the PaymentTransaction interface based on the design
export interface PaymentTransaction {
  id: string; // Transaction ID
  userId: string;
  date: Date;
  method: "Card" | "PayPal" | "Bank Transfer" | string; // Allow other string for flexibility
  amount: number;
  status: "Succeeded" | "Pending" | "Failed" | "Refunded";
  // Optional campaign context
  campaignId?: string;
  campaignName?: string;
}

// Mock data for initial UI development - replace with Firestore fetching
const mockPayments: PaymentTransaction[] = [
  { id: "pay_1", userId: "usr_1", date: new Date("2024-07-15T10:30:00"), method: "Card", amount: 75.00, status: "Succeeded" },
  { id: "pay_2", userId: "usr_2", date: new Date("2024-06-20T14:00:00"), method: "PayPal", amount: 120.50, status: "Succeeded" },
  { id: "pay_3", userId: "usr_3", date: new Date("2024-05-01T09:15:00"), method: "Card", amount: 30.00, status: "Pending" },
  { id: "pay_4", userId: "usr_4", date: new Date("2024-03-10T17:45:00"), method: "Card", amount: 200.00, status: "Failed" },
  { id: "pay_5", userId: "usr_5", date: new Date("2024-02-28T11:00:00"), method: "Card", amount: 50.00, status: "Refunded" },
  { id: "pay_6", userId: "usr_1", date: new Date("2024-07-18T16:20:00"), method: "Card", amount: 25.00, status: "Succeeded" },
  { id: "pay_7", userId: "usr_6", date: new Date("2024-07-19T09:00:00"), method: "Bank Transfer", amount: 500.00, status: "Pending" },
  { id: "pay_8", userId: "usr_7", date: new Date("2024-07-01T12:00:00"), method: "PayPal", amount: 15.00, status: "Succeeded" },
];

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDisplayDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
}

export default function PaymentTrackingPage() {
  const [payments, setPayments] = React.useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  // Simulate fetching data
  React.useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setPayments(mockPayments.sort((a,b) => b.date.getTime() - a.date.getTime())); // Sort by most recent
      setLoading(false);
    }, 1000); // Simulate network delay
  }, []);

  const filteredPayments = payments.filter(payment =>
    payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: PaymentTransaction["status"]) => {
    switch (status) {
      case "Succeeded": return "default";
      case "Pending": return "secondary";
      case "Failed": return "destructive";
      case "Refunded": return "outline"; // Using outline for refunded, can be customized
      default: return "secondary";
    }
  };

  const getStatusBadgeClassName = (status: PaymentTransaction["status"]) => {
    // Custom background colors for badges matching the design
    if (status === "Succeeded") return "bg-green-500 hover:bg-green-600 border-green-500 text-white";
    if (status === "Pending") return "bg-yellow-400 hover:bg-yellow-500 border-yellow-400 text-black"; // Darker text for yellow
    if (status === "Failed") return "bg-red-500 hover:bg-red-600 border-red-500 text-white";
    if (status === "Refunded") return "bg-blue-500 hover:bg-blue-600 border-blue-500 text-white";
    return "";
  };

  const handleViewDetails = (paymentId: string) => {
    toast({ title: "View Details", description: `Viewing details for payment ID: ${paymentId}` });
    // Placeholder: Implement actual view details logic (e.g., open a modal or navigate to a details page)
  };

  const handleProcessRefund = (paymentId: string) => {
    toast({ title: "Process Refund", description: `Processing refund for payment ID: ${paymentId}` });
    // Placeholder: Implement actual refund processing logic
  };

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Payment Tracking</h1>
              <p className="text-muted-foreground text-sm">
                Monitor all financial transactions and their statuses.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search transactions..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <ListFilter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        {loading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>Error Fetching Payments</ShadCNAlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && filteredPayments.length === 0 && (
          <Alert>
             <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>No Transactions Found</ShadCNAlertTitle>
            <AlertDescription>
              {searchTerm ? "No transactions match your search term." : "There are no payment transactions to display yet."}
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && filteredPayments.length > 0 && (
          <div className="border rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Transaction ID</TableHead>
                  <TableHead className="w-[100px]">User ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                    <TableCell className="font-mono text-xs">{payment.userId}</TableCell>
                    <TableCell className="text-sm">{formatDisplayDateTime(payment.date)}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={getStatusBadgeVariant(payment.status)} 
                        className={cn("text-xs px-2 py-1", getStatusBadgeClassName(payment.status))}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Transaction actions for {payment.id}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleViewDetails(payment.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {(payment.status === "Succeeded" || payment.status === "Pending") && ( // Only allow refund for certain statuses
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => handleProcessRefund(payment.id)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Process Refund
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             <div className="p-4 text-sm text-muted-foreground">
              Showing {filteredPayments.length} of {payments.length} transaction(s).
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

