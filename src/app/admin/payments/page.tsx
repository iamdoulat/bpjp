
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DollarSign, Search, ListFilter, MoreHorizontal, Eye, RefreshCw, AlertCircle, UserCircle, Loader2, Save, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getPaymentTransactions, updatePaymentTransactionStatus, type PaymentTransaction } from "@/services/paymentService";
import { auth } from '@/lib/firebase';

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDisplayDateTime(date: Date | undefined) {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(new Date(date));
}

function getInitials(email?: string, userId?: string): string {
  if (email) {
    const namePart = email.split('@')[0];
    return namePart.substring(0, 2).toUpperCase();
  }
  if (userId) {
    return userId.substring(0, 2).toUpperCase();
  }
  return "U";
}


export default function PaymentTrackingPage() {
  const [payments, setPayments] = React.useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  const [paymentToViewOrUpdate, setPaymentToViewOrUpdate] = React.useState<PaymentTransaction | null>(null);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = React.useState(false);
  const [selectedNewStatusForUpdate, setSelectedNewStatusForUpdate] = React.useState<PaymentTransaction['status'] | ''>('');
  const [isSubmittingStatusUpdate, setIsSubmittingStatusUpdate] = React.useState(false);

  React.useEffect(() => {
    async function fetchPayments() {
      console.log("[PaymentTrackingPage] Current auth user email:", auth.currentUser?.email);
      console.log("[PaymentTrackingPage] Attempting to fetch payments...");
      setLoading(true);
      setError(null);
      try {
        const fetchedPayments = await getPaymentTransactions();
        console.log("[PaymentTrackingPage] Fetched payments from service:", fetchedPayments.length);
        setPayments(fetchedPayments);
      } catch (e) {
        console.error("[PaymentTrackingPage] Error caught in page while fetching payments:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred while fetching payments.");
      } finally {
        setLoading(false);
        console.log("[PaymentTrackingPage] Fetching complete. Loading set to false.");
      }
    }
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(payment =>
    payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.userEmail && payment.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (payment.campaignName && payment.campaignName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (payment.method && payment.method.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (payment.status && payment.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (payment.receiverBkashNo && payment.receiverBkashNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadgeVariant = (status?: PaymentTransaction["status"]) => {
    if (!status) return "secondary";
    switch (status) {
      case "Succeeded": return "default";
      case "Pending": return "secondary";
      case "Failed": return "destructive";
      case "Refunded": return "outline";
      default: return "secondary";
    }
  };

  const getStatusBadgeClassName = (status?: PaymentTransaction["status"]) => {
    if (!status) return "";
    if (status === "Succeeded") return "bg-green-500 hover:bg-green-600 border-green-500 text-white";
    if (status === "Pending") return "bg-yellow-400 hover:bg-yellow-500 border-yellow-400 text-black";
    if (status === "Failed") return "bg-red-500 hover:bg-red-600 border-red-500 text-white";
    if (status === "Refunded") return "bg-blue-500 hover:bg-blue-600 border-blue-500 text-white";
    return "";
  };

  const handleOpenViewDetailsModal = (payment: PaymentTransaction) => {
    setPaymentToViewOrUpdate(payment);
    setSelectedNewStatusForUpdate(payment.status); // Pre-fill select with current status
    setIsViewDetailsModalOpen(true);
  };

  const handleProcessRefund = (paymentId: string) => {
    // This can be a specific action or integrated into status change to "Refunded"
    toast({ title: "Process Refund (Action)", description: `Initiating refund process for payment ID: ${paymentId}. This is a placeholder.` });
  };

  const handleSaveStatusUpdate = async () => {
    if (!paymentToViewOrUpdate || !selectedNewStatusForUpdate) return;

    setIsSubmittingStatusUpdate(true);
    try {
      await updatePaymentTransactionStatus(paymentToViewOrUpdate.id, selectedNewStatusForUpdate);
      setPayments(prevPayments =>
        prevPayments.map(p =>
          p.id === paymentToViewOrUpdate.id ? { ...p, status: selectedNewStatusForUpdate } : p
        )
      );
      toast({
        title: "Status Updated",
        description: `Payment status for ${paymentToViewOrUpdate.id} changed to ${selectedNewStatusForUpdate}.`,
      });
      setIsViewDetailsModalOpen(false);
    } catch (e) {
      console.error("Failed to update payment status:", e);
      toast({
        title: "Update Failed",
        description: e instanceof Error ? e.message : "Could not update payment status.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingStatusUpdate(false);
    }
  };
  
  const paymentStatusOptions: PaymentTransaction['status'][] = ["Pending", "Succeeded", "Failed", "Refunded"];


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
               <div key={i} className="flex items-center space-x-4 p-3 border-b border-border last:border-b-0 bg-card rounded-md">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-1/4" /> 
                  <Skeleton className="h-3 w-2/4" /> 
                </div>
                <Skeleton className="h-4 w-1/12" /> 
                <Skeleton className="h-4 w-1/12" /> 
                <Skeleton className="h-4 w-1/12" /> 
                <Skeleton className="h-6 w-20 rounded-full" /> 
                <Skeleton className="h-6 w-8 rounded-md" /> 
              </div>
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
              {searchTerm ? "No transactions match your search term." : "There are no payment transactions to display yet. Ensure the 'paymentTransactions' collection exists in Firestore with data and appropriate security rules."}
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && filteredPayments.length > 0 && (
          <div className="border rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">User</TableHead>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="w-[100px]">Last 4</TableHead>
                  <TableHead className="w-[120px]">Method</TableHead>
                  <TableHead className="text-right w-[100px]">Amount</TableHead>
                  <TableHead className="text-center w-[100px]">Status</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={undefined} alt={payment.userEmail || payment.userId} data-ai-hint="profile person"/>
                          <AvatarFallback>{getInitials(payment.userEmail, payment.userId)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium truncate">{payment.userEmail || payment.userId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{formatDisplayDateTime(payment.date as Date)}</TableCell>
                    <TableCell className="text-xs font-medium truncate max-w-[150px]">{payment.campaignName || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{payment.lastFourDigits || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{payment.method}</TableCell>
                    <TableCell className="text-xs text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={getStatusBadgeVariant(payment.status)} 
                        className={cn("text-xs px-2 py-0.5", getStatusBadgeClassName(payment.status))}
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
                          <DropdownMenuItem onSelect={() => handleOpenViewDetailsModal(payment)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details / Change Status
                          </DropdownMenuItem>
                          {(payment.status === "Succeeded" || payment.status === "Pending") && (
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

      {paymentToViewOrUpdate && (
        <Dialog open={isViewDetailsModalOpen} onOpenChange={setIsViewDetailsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Transaction Details: {paymentToViewOrUpdate.id}</DialogTitle>
              <DialogDescription>
                View details and update the status of this payment transaction.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-sm text-muted-foreground col-span-1">User:</Label>
                <p className="text-sm col-span-2">{paymentToViewOrUpdate.userEmail || paymentToViewOrUpdate.userId}</p>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-sm text-muted-foreground col-span-1">Amount:</Label>
                <p className="text-sm col-span-2 font-semibold">{formatCurrency(paymentToViewOrUpdate.amount)}</p>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-sm text-muted-foreground col-span-1">Campaign:</Label>
                <p className="text-sm col-span-2">{paymentToViewOrUpdate.campaignName || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-sm text-muted-foreground col-span-1">Date:</Label>
                <p className="text-sm col-span-2">{formatDisplayDateTime(paymentToViewOrUpdate.date as Date)}</p>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-sm text-muted-foreground col-span-1">Method:</Label>
                <p className="text-sm col-span-2">{paymentToViewOrUpdate.method}</p>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label className="text-sm text-muted-foreground col-span-1">Last 4 Digits:</Label>
                <p className="text-sm col-span-2">{paymentToViewOrUpdate.lastFourDigits || 'N/A'}</p>
              </div>
              {paymentToViewOrUpdate.receiverBkashNo && (
                <div className="grid grid-cols-3 items-center gap-2">
                  <Label className="text-sm text-muted-foreground col-span-1">Bkash No.:</Label>
                  <p className="text-sm col-span-2">{paymentToViewOrUpdate.receiverBkashNo}</p>
                </div>
              )}
               <div className="grid grid-cols-3 items-center gap-2">
                <Label htmlFor="status-select" className="text-sm text-muted-foreground col-span-1">Current Status:</Label>
                 <Badge 
                    variant={getStatusBadgeVariant(paymentToViewOrUpdate.status)} 
                    className={cn("text-xs px-2 py-0.5 col-span-2 justify-self-start", getStatusBadgeClassName(paymentToViewOrUpdate.status))}
                  >
                   {paymentToViewOrUpdate.status}
                 </Badge>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label htmlFor="status-select" className="text-sm font-medium col-span-1 self-center">Change Status:</Label>
                <Select
                  value={selectedNewStatusForUpdate}
                  onValueChange={(value) => setSelectedNewStatusForUpdate(value as PaymentTransaction['status'])}
                  disabled={isSubmittingStatusUpdate}
                >
                  <SelectTrigger id="status-select" className="col-span-2">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatusOptions.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmittingStatusUpdate}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={handleSaveStatusUpdate}
                disabled={isSubmittingStatusUpdate || selectedNewStatusForUpdate === paymentToViewOrUpdate.status || !selectedNewStatusForUpdate}
              >
                {isSubmittingStatusUpdate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}

