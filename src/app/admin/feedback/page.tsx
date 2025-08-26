// src/app/admin/feedback/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
import { MessageSquare, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { getFeedback, deleteFeedback, type FeedbackData } from "@/services/feedbackService";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Timestamp } from "firebase/firestore";

function formatDisplayDateTime(date: Timestamp | undefined): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date.toDate());
}

export default function ManageFeedbackPage() {
  const [feedbackList, setFeedbackList] = React.useState<FeedbackData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [feedbackToDelete, setFeedbackToDelete] = React.useState<FeedbackData | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();

  const fetchFeedback = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFeedback();
      setFeedbackList(data);
    } catch (e) {
      console.error("Failed to fetch feedback:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleDeleteFeedback = async () => {
    if (!feedbackToDelete || !feedbackToDelete.id) return;
    setIsDeleting(true);
    try {
      await deleteFeedback(feedbackToDelete.id);
      toast({
        title: "Feedback Deleted",
        description: `The feedback entry from "${feedbackToDelete.name}" has been deleted.`,
      });
      setFeedbackList(prev => prev.filter(f => f.id !== feedbackToDelete.id));
      setFeedbackToDelete(null);
    } catch (e) {
      toast({
        title: "Error Deleting Feedback",
        description: e instanceof Error ? e.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-headline font-semibold">Complaints & Feedback</h1>
            <p className="text-muted-foreground text-sm">
              Review and manage user-submitted complaints and suggestions.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>Error Fetching Feedback</ShadCNAlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : feedbackList.length === 0 ? (
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <ShadCNAlertTitle>No Feedback Found</ShadCNAlertTitle>
            <AlertDescription>There are no feedback entries to display yet.</AlertDescription>
          </Alert>
        ) : (
          <div className="border rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date</TableHead>
                  <TableHead className="w-[150px]">Name</TableHead>
                  <TableHead className="w-[150px]">Mobile Number</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbackList.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell className="text-xs">{formatDisplayDateTime(feedback.createdAt)}</TableCell>
                    <TableCell className="font-medium text-sm">{feedback.name}</TableCell>
                    <TableCell className="text-sm">{feedback.mobileNumber}</TableCell>
                    <TableCell className="text-sm whitespace-pre-line break-words max-w-md">{feedback.message}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setFeedbackToDelete(feedback)}
                        disabled={isDeleting}
                        aria-label={`Delete feedback from ${feedback.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      {feedbackToDelete && (
        <AlertDialog open={!!feedbackToDelete} onOpenChange={(open) => !open && setFeedbackToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this feedback?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the feedback from
                <span className="font-semibold"> "{feedbackToDelete.name}"</span> submitted on {formatDisplayDateTime(feedbackToDelete.createdAt)}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setFeedbackToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFeedback}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AppShell>
  );
}
