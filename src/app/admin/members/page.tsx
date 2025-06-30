// src/app/admin/members/page.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCNCardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, AlertCircle, Users } from "lucide-react";
import { getExecutiveCommitteeData, saveExecutiveCommitteeData } from "@/services/executiveCommitteeService";
import { Skeleton } from "@/components/ui/skeleton";

const committeeFormSchema = z.object({
  content: z.string().min(10, { message: "Content must be at least 10 characters." }).max(20000, { message: "Content must be at most 20,000 characters."}),
});

type CommitteeFormValues = z.infer<typeof committeeFormSchema>;

export default function ManageMembersPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<CommitteeFormValues>({
    resolver: zodResolver(committeeFormSchema),
    defaultValues: {
      content: "",
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    async function fetchCurrentData() {
      setIsLoading(true);
      setError(null);
      try {
        const currentData = await getExecutiveCommitteeData();
        if (currentData) {
          form.reset({
            content: currentData.content,
          });
        }
      } catch (e) {
        console.error("Failed to fetch committee data for editing:", e);
        const errorMessage = e instanceof Error ? e.message : "Could not load current committee data.";
        setError(errorMessage);
        form.reset({
            content: `Error loading content: ${errorMessage}`,
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchCurrentData();
  }, [form]);

  async function onSubmit(data: CommitteeFormValues) {
    setIsSubmitting(true);
    try {
      await saveExecutiveCommitteeData(data.content);
      toast({
        title: "Content Updated!",
        description: "The Executive Committee page content has been successfully saved.",
        variant: "default",
      });
      form.reset(data); // Reset to the new saved data to clear the dirty state
    } catch (e) {
      console.error("Failed to save committee data:", e);
      toast({
        title: "Error Saving Content",
        description: e instanceof Error ? e.message : "An unexpected error occurred.",
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
          <Users className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-headline font-semibold">Manage Executive Committee</h1>
            <p className="text-muted-foreground text-sm">
              Update the content for the public "Executive Committee" page.
            </p>
          </div>
        </div>

        <Card className="shadow-lg max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Committee Details</CardTitle>
            <ShadCNCardDescription>
              Enter the information that will be displayed on the page. You can use Markdown for formatting.
            </ShadCNCardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-10 w-28 mt-4" />
                </div>
            ) : error ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <ShadCNAlertTitle>Error Loading Data</ShadCNAlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Committee Content</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Describe the committee members, their roles, and other relevant information..."
                            className="resize-y min-h-[400px]"
                            {...field}
                            disabled={isSubmitting || isLoading}
                            />
                        </FormControl>
                        <FormDescription>
                            This content will be displayed on the public page. Markdown is supported for styling.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || isLoading || !form.formState.isDirty || !form.formState.isValid}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSubmitting ? "Saving..." : "Save Content"}
                    </Button>
                </form>
                </Form>
            )}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
