
// src/app/admin/mission/edit/page.tsx
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
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileEdit, Save, Construction, AlertCircle } from "lucide-react";
import { getMissionData, saveMissionData, type MissionData } from "@/services/missionService";
import { Skeleton } from "@/components/ui/skeleton";

const missionFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }).max(150, { message: "Title must be at most 150 characters."}),
  content: z.string().min(20, { message: "Content must be at least 20 characters." }).max(10000, { message: "Content must be at most 10,000 characters."}),
});

type MissionFormValues = z.infer<typeof missionFormSchema>;

export default function EditMissionPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    async function fetchCurrentMissionData() {
      setIsLoading(true);
      setError(null);
      try {
        const currentData = await getMissionData();
        if (currentData) {
          form.reset({
            title: currentData.title,
            content: currentData.content,
          });
        }
      } catch (e) {
        console.error("Failed to fetch mission data for editing:", e);
        setError(e instanceof Error ? e.message : "Could not load current mission data.");
         form.reset({
            title: "Error Loading Title",
            content: "Error loading content. Please try refreshing.",
          });
      } finally {
        setIsLoading(false);
      }
    }
    fetchCurrentMissionData();
  }, [form]);

  async function onSubmit(data: MissionFormValues) {
    setIsSubmitting(true);
    try {
      await saveMissionData(data.title, data.content);
      toast({
        title: "Mission Content Updated!",
        description: "The 'Our Mission' page content has been successfully saved.",
        variant: "default",
      });
    } catch (e) {
      console.error("Failed to save mission data:", e);
      toast({
        title: "Error Saving Mission Content",
        description: e instanceof Error ? e.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (isLoading) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
          <Card className="shadow-lg max-w-3xl mx-auto">
            <CardHeader>
              <Skeleton className="h-8 w-3/5" />
              <Skeleton className="h-4 w-4/5" />
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-32 w-full" />
              </div>
               <Skeleton className="h-10 w-28 mt-4" />
            </CardContent>
          </Card>
        </main>
      </AppShell>
    );
  }

  if (error && !form.getValues("title")) { // Show critical error if initial load failed badly
     return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>Error Loading Data</ShadCNAlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
      </AppShell>
    );
  }


  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex items-center gap-3 mb-6">
          <FileEdit className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-headline font-semibold">Edit Mission Page Content</h1>
            <p className="text-muted-foreground text-sm">
              Update the title and details for the public "Our Mission" page.
            </p>
          </div>
        </div>

        <Card className="shadow-lg max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Mission Details</CardTitle>
            <ShadCNCardDescription>
              Enter the information that will be displayed on the "Our Mission" page.
            </ShadCNCardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mission Title</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Our Commitment to Change" {...field} disabled={isSubmitting || isLoading} />
                      </FormControl>
                      <FormDescription>
                        The main title for the "Our Mission" page.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mission Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your organization's mission, values, and goals..."
                          className="resize-y min-h-[200px]"
                          {...field}
                          disabled={isSubmitting || isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        This content will be displayed on the "Our Mission" page. You can use basic HTML tags if needed for simple formatting.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert className="mt-6">
                  <Construction className="h-4 w-4" />
                  <ShadCNAlertTitle>Advanced Editor Coming Soon!</ShadCNAlertTitle>
                  <AlertDescription>
                    Full rich text editing capabilities (bold, italics, lists, media embedding, etc.) for the mission details will be added in a future update.
                  </AlertDescription>
                </Alert>

                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || isLoading || !form.formState.isValid || !form.formState.isDirty}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting ? "Saving..." : "Save Mission Content"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
