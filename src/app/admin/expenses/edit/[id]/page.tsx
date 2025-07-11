
// src/app/admin/expenses/edit/[id]/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCNCardDescription } from "@/components/ui/card";
import { Alert, AlertTitle as ShadCNAlertTitle, AlertDescription as ShadCNAlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, FileEdit, AlertCircle, X, Download, FileText, ArrowLeft } from "lucide-react"; // Ensure FileText and ArrowLeft are imported
import { getExpenseById, updateExpense, type ExpenseData, type UpdateExpenseInput } from "@/services/expenseService";
import { useAuth } from "@/contexts/AuthContext";

const editExpenseFormSchema = z.object({
  name: z.string().min(3, { message: "Expense name must be at least 3 characters." }).max(150),
  details: z.string().min(10, { message: "Details must be at least 10 characters." }).max(5000),
  amount: z.preprocess(
    (val) => Number(String(val).replace(/[^0-9.-]+/g, "")),
    z.number().min(0.01, { message: "Expense amount must be at least $0.01." })
  ),
  attachmentFile: z.instanceof(File).optional().nullable(), // For new attachment
});

type EditExpenseFormValues = z.infer<typeof editExpenseFormSchema>;

export default function EditExpensePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const expenseId = params.id as string;

  const [expense, setExpense] = React.useState<ExpenseData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [currentAttachmentPreview, setCurrentAttachmentPreview] = React.useState<string | null>(null);
  const [newAttachmentPreview, setNewAttachmentPreview] = React.useState<string | null>(null);
  const [removeExistingAttachment, setRemoveExistingAttachment] = React.useState(false);

  const form = useForm<EditExpenseFormValues>({
    resolver: zodResolver(editExpenseFormSchema),
    mode: "onChange",
  });

  React.useEffect(() => {
    if (expenseId) {
      async function fetchExpense() {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedExpense = await getExpenseById(expenseId);
          if (fetchedExpense) {
            setExpense(fetchedExpense);
            form.reset({
              name: fetchedExpense.name,
              details: fetchedExpense.details,
              amount: fetchedExpense.amount,
              attachmentFile: undefined, // Initialize as undefined
            });
            if (fetchedExpense.attachmentUrl && /\.(jpg|jpeg|png|gif)$/i.test(fetchedExpense.attachmentUrl)) {
                setCurrentAttachmentPreview(fetchedExpense.attachmentUrl);
            } else if (fetchedExpense.attachmentUrl) {
                 // For non-image files, just indicate existence
                setCurrentAttachmentPreview("file_exists"); 
            } else {
                setCurrentAttachmentPreview(null);
            }
            setNewAttachmentPreview(null);
            setRemoveExistingAttachment(false);
          } else {
            setError("Expense not found.");
          }
        } catch (e) {
          console.error("Failed to fetch expense for editing:", e);
          setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
          setIsLoading(false);
        }
      }
      fetchExpense();
    }
  }, [expenseId, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("attachmentFile", file, { shouldValidate: true, shouldDirty: true });
      setRemoveExistingAttachment(false); // If new file is selected, don't remove existing unless "Remove" is clicked again
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewAttachmentPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setNewAttachmentPreview("file_selected"); // Indicate a non-image file is selected
      }
    } else {
      // If file input is cleared by user (e.g. selecting then cancelling)
      form.setValue("attachmentFile", null);
      setNewAttachmentPreview(null);
    }
  };
  
  const handleRemoveExistingAttachment = () => {
    setRemoveExistingAttachment(true);
    setCurrentAttachmentPreview(null); // Remove current preview
    form.setValue("attachmentFile", null, { shouldDirty: true }); // Explicitly set to null for update logic
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear file input
    }
    setNewAttachmentPreview(null); // Clear new file preview
  };


  async function onSubmit(data: EditExpenseFormValues) {
    if (!user || !expense || !expense.id) {
        toast({ title: "Error", description: "User or expense data is missing.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
      const updateInput: UpdateExpenseInput = {
        name: data.name,
        details: data.details,
        amount: data.amount,
        attachmentFile: removeExistingAttachment ? null : data.attachmentFile, // Send null if remove is true
      };
      
      await updateExpense(expense.id, updateInput, expense.attachmentPath);
      
      toast({
        title: "Expense Updated!",
        description: `Expense "${data.name}" has been successfully updated.`,
      });
      router.push("/expenses/history");
    } catch (error) {
      console.error("Failed to update expense:", error);
      toast({
        title: "Error Updating Expense",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Card className="shadow-lg">
            <CardHeader><Skeleton className="h-8 w-3/5" /><Skeleton className="h-4 w-4/5 mt-1" /></CardHeader>
            <CardContent className="space-y-8 pt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
              ))}
              <Skeleton className="h-10 w-28 mt-4" />
            </CardContent>
          </Card>
        </main>
      </AppShell>
    );
  }

  if (error && !expense) {
     return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" /><ShadCNAlertTitle>Error Loading Data</ShadCNAlertTitle><ShadCNAlertDescription>{error}</ShadCNAlertDescription>
             <Button onClick={() => router.push('/expenses/history')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
             </Button>
          </Alert>
        </main>
      </AppShell>
    );
  }
  
  if (!expense) {
     return (
        <AppShell>
            <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center">
              <Alert variant="default" className="max-w-md">
                <AlertCircle className="h-4 w-4" /><ShadCNAlertTitle>Expense Not Found</ShadCNAlertTitle><ShadCNAlertDescription>The expense data could not be loaded or does not exist.</ShadCNAlertDescription>
              </Alert>
              <Button onClick={() => router.push('/expenses/history')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
              </Button>
            </main>
         </AppShell>
    );
  }
  
  const currentAttachmentName = expense.attachmentUrl?.split('/').pop()?.split('?')[0].substring(14) || "File";


  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex items-center gap-3 mb-6">
          <FileEdit className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-headline font-semibold">Edit Expense</h1>
            <p className="text-muted-foreground text-sm">
              Modify the details for expense: {expense.name}
            </p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Update Expense Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Expense Name / Title</FormLabel><FormControl><Input placeholder="E.g., Office Rent Q1" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="details" render={({ field }) => (
                  <FormItem><FormLabel>Expense Details</FormLabel><FormControl><Textarea placeholder="Describe the expense..." className="resize-y min-h-[150px]" {...field} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Expense Amount ($)</FormLabel><FormControl><Input type="number" placeholder="100.00" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )}/>
                
                <FormItem>
                  <FormLabel>Attachment</FormLabel>
                  {currentAttachmentPreview && !newAttachmentPreview && !removeExistingAttachment && (
                    <div className="mt-2 p-3 border rounded-md space-y-2">
                      <p className="text-sm font-medium">Current Attachment:</p>
                      {currentAttachmentPreview === "file_exists" || !/\.(jpg|jpeg|png|gif)$/i.test(expense.attachmentUrl || "") ? (
                         <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" /> 
                            <span>{currentAttachmentName}</span>
                            <Button variant="outline" size="icon" className="h-6 w-6" asChild>
                                <a href={expense.attachmentUrl!} target="_blank" rel="noopener noreferrer" title="Download Current Attachment"><Download className="h-3 w-3"/></a>
                            </Button>
                         </div>
                      ) : (
                        <div className="relative w-full max-w-xs aspect-video rounded-md overflow-hidden">
                           <Image src={currentAttachmentPreview} alt="Current attachment preview" layout="fill" objectFit="contain" data-ai-hint="document invoice receipt"/>
                        </div>
                      )}
                      <Button variant="outline" size="sm" type="button" onClick={handleRemoveExistingAttachment} disabled={isSubmitting}>
                        <X className="mr-1.5 h-4 w-4"/> Remove Current Attachment
                      </Button>
                    </div>
                  )}

                  {newAttachmentPreview && (
                    <div className="mt-4 border rounded-md p-2">
                      <p className="text-sm font-medium mb-2">New Attachment Preview:</p>
                      {newAttachmentPreview === "file_selected" || !/\.(jpg|jpeg|png|gif)$/i.test(form.getValues("attachmentFile")?.name || "") ? (
                        <p className="text-sm text-muted-foreground">File: {form.getValues("attachmentFile")?.name}</p>
                      ) : (
                         <img src={newAttachmentPreview} alt="New attachment preview" className="max-w-full max-h-60 rounded-md object-contain" data-ai-hint="document invoice receipt"/>
                      )}
                    </div>
                  )}
                  
                  <FormControl>
                    <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="mt-2 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSubmitting}/>
                  </FormControl>
                  <FormDescription>Upload a new file to replace the existing one, or remove the current attachment.</FormDescription>
                  <FormMessage>{form.formState.errors.attachmentFile?.message as React.ReactNode}</FormMessage>
                </FormItem>

                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || !form.formState.isDirty || !form.formState.isValid}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
