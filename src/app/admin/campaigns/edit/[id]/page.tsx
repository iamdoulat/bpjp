
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCNCardDescription } from "@/components/ui/card"
import { getCampaignById, updateCampaign, type CampaignUpdateData, type CampaignData } from '@/services/campaignService';
import { Loader2, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert"

const editCampaignFormSchema = z.object({
  campaignTitle: z.string().min(5, {
    message: "Campaign title must be at least 5 characters.",
  }).max(100, { message: "Campaign title must be at most 100 characters."}),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters.",
  }).max(5000, { message: "Description must be at most 5000 characters."}),
  goalAmount: z.preprocess(
    (val) => Number(String(val).replace(/[^0-9.-]+/g, "")),
    z.number().min(1, { message: "Goal amount must be at least $1." })
  ),
  startDate: z.date({
    required_error: "A start date is required.",
  }),
  endDate: z.date({
    required_error: "An end date is required.",
  }),
  campaignImageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  organizerName: z.string().max(100, { message: "Organizer name must be at most 100 characters."}).optional().or(z.literal('')),
  initialStatus: z.enum(["draft", "upcoming", "active", "completed"]), // Added "completed"
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type EditCampaignFormValues = z.infer<typeof editCampaignFormSchema>

export default function EditCampaignPage() {
  const { toast } = useToast()
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = React.useState<CampaignData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<EditCampaignFormValues>({
    resolver: zodResolver(editCampaignFormSchema),
    mode: "onChange",
  });

  React.useEffect(() => {
    if (campaignId) {
      async function fetchCampaign() {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedCampaign = await getCampaignById(campaignId);
          if (fetchedCampaign) {
            setCampaign(fetchedCampaign);
            // Pre-fill form
            form.reset({
              campaignTitle: fetchedCampaign.campaignTitle,
              description: fetchedCampaign.description,
              goalAmount: fetchedCampaign.goalAmount,
              startDate: new Date(fetchedCampaign.startDate as Date), // Ensure it's a Date object
              endDate: new Date(fetchedCampaign.endDate as Date),     // Ensure it's a Date object
              campaignImageUrl: fetchedCampaign.campaignImageUrl || "",
              organizerName: fetchedCampaign.organizerName || "",
              initialStatus: fetchedCampaign.initialStatus,
            });
          } else {
            setError("Campaign not found.");
          }
        } catch (e) {
          console.error("Failed to fetch campaign:", e);
          setError(e instanceof Error ? e.message : "An unknown error occurred while fetching campaign data.");
        } finally {
          setIsLoading(false);
        }
      }
      fetchCampaign();
    }
  }, [campaignId, form]);

  const watchedStartDate = form.watch("startDate");
  const watchedEndDate = form.watch("endDate");

  async function onSubmit(data: EditCampaignFormValues) {
    if (!campaignId) return;
    setIsSubmitting(true);
    try {
      const campaignInput: CampaignUpdateData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      };
      await updateCampaign(campaignId, campaignInput);
      toast({
        title: "Campaign Updated!",
        description: `Campaign "${data.campaignTitle}" has been successfully updated.`,
        variant: "default",
      });
      router.push("/admin/campaigns"); // Navigate back to manage campaigns page
    } catch (error) {
      console.error("Failed to update campaign:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Error Updating Campaign",
        description: errorMessage,
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
          {/* Removed max-w-3xl mx-auto from this div */}
          <div>
            <Card className="shadow-lg max-w-3xl mx-auto">
              <CardHeader>
                <Skeleton className="h-8 w-3/5" />
                <Skeleton className="h-4 w-4/5" />
              </CardHeader>
              <CardContent className="space-y-8">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          </div>
        </main>
      </AppShell>
    );
  }

  if (error && !campaign) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>Error</ShadCNAlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
      </AppShell>
    );
  }
  
  if (!campaign) { // Should be covered by error state if not found, but good fallback
    return (
         <AppShell>
            <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
             <p>Campaign not found or could not be loaded.</p>
            </main>
         </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        {/* Removed max-w-3xl mx-auto from this div */}
        <div> 
          <Card className="shadow-lg max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Edit Campaign: {campaign.campaignTitle}</CardTitle>
              <ShadCNCardDescription>
                Modify the details of your campaign.
              </ShadCNCardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="campaignTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Title</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Support Local Animal Shelter" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormDescription>
                          A catchy and descriptive title for your campaign.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us more about your campaign, its goals, and impact..."
                            className="resize-y min-h-[100px]"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed explanation of the campaign.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="goalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goal Amount ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1000" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} disabled={isSubmitting} />
                        </FormControl>
                        <FormDescription>
                          The target amount you aim to raise.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          placeholder="Select campaign start date"
                           disabled={(date) => {
                            if (isSubmitting) return true;
                            // Allow past dates for editing, but not if it's after endDate
                            if (watchedEndDate && date > watchedEndDate) return true;
                            return false;
                          }}
                        />
                        <FormDescription>
                          When the campaign will officially start.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          placeholder="Select campaign end date"
                          disabled={(date) => {
                            if (isSubmitting) return true;
                            // Allow past dates for editing, but not if it's before startDate
                            if (watchedStartDate && date < watchedStartDate) return true;
                            return false;
                          }}
                        />
                        <FormDescription>
                          When the campaign will officially end.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="campaignImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Image URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://placehold.co/600x400.png" {...field} value={field.value ?? ""} disabled={isSubmitting} />
                        </FormControl>
                        <FormDescription>
                          Provide a URL for the campaign image. Use a placeholder like https://placehold.co/600x400.png if needed.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="organizerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organizer Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Organization or Name" {...field} value={field.value ?? ""} disabled={isSubmitting}/>
                        </FormControl>
                        <FormDescription>
                          Name of the individual or group running the campaign.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="initialStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Set the campaign status.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || !form.formState.isValid || isLoading}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  )
}
