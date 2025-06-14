
// src/app/admin/expenses/create/page.tsx
"use client";

import * as React from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, FilePlus2, UploadCloud } from "lucide-react";
import { addExpense, type NewExpenseInput } from "@/services/expenseService";
import { useAuth } from "@/contexts/AuthContext";

const expenseFormSchema = z.object({
  name: z.string().min(3, { message: "Expense name must be at least 3 characters." }).max(150),
  details: z.string().min(10, { message: "Details must be at least 10 characters." }).max(5000),
  attachmentFile: z.instanceof(File).optional().nullable(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

const defaultValues: ExpenseFormValues = {
  name: "",
  details: "",
  attachmentFile: null,
};

export default function CreateExpensePage() {
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [attachmentPreview, setAttachmentPreview] = React.useState<string | null>(null);


  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("attachmentFile", file, { shouldValidate: true, shouldDirty: true });
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachmentPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null); // Clear preview if not an image
      }
    } else {
      form.setValue("attachmentFile", null);
      setAttachmentPreview(null);
    }
  };

  async function onSubmit(data: ExpenseFormValues) {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in to create an expense.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
      const expenseInput: NewExpenseInput = {
        name: data.name,
        details: data.details,
        attachmentFile: data.attachmentFile,
        userId: user.uid, // Add user ID
      };
      const expenseId = await addExpense(expenseInput);
      toast({
        title: "Expense Recorded!",
        description: `Expense "${data.name}" (ID: ${expenseId}) has been successfully saved.`,
      });
      form.reset(defaultValues);
      setAttachmentPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to save expense:", error);
      toast({
        title: "Error Recording Expense",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex items-center gap-3 mb-6">
          <FilePlus2 className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-headline font-semibold">Record New Expense</h1>
            <p className="text-muted-foreground text-sm">
              Enter details for a new expense. (Admin Only Context)
            </p>
          </div>
        </div>

        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
            <ShadCNCardDescription>
              Fill in the information below to record an expense.
            </ShadCNCardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expense Name / Title</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Office Rent Q1" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>A concise name for the expense.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expense Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the expense, including purpose, vendor, etc..."
                          className="resize-y min-h-[150px]"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>Provide a comprehensive description.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Attachment (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  {attachmentPreview && (
                    <div className="mt-4 border rounded-md p-2">
                      <p className="text-sm font-medium mb-2">Image Preview:</p>
                      <img src={attachmentPreview} alt="Attachment preview" className="max-w-full max-h-60 rounded-md object-contain" />
                    </div>
                  )}
                   {form.getValues("attachmentFile") && !attachmentPreview && (
                     <p className="text-sm text-muted-foreground mt-2">File selected: {form.getValues("attachmentFile")?.name}</p>
                   )}
                  <FormDescription>Upload a supporting document or image (e.g., invoice, receipt).</FormDescription>
                  <FormMessage>{form.formState.errors.attachmentFile?.message}</FormMessage>
                </FormItem>

                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || !form.formState.isValid}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}
                  {isSubmitting ? "Saving..." : "Record Expense"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
    