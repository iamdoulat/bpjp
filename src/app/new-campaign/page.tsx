
"use client"

import * as React from "react"
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

const newCampaignFormSchema = z.object({
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
  initialStatus: z.enum(["draft", "upcoming", "active"]),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type NewCampaignFormValues = z.infer<typeof newCampaignFormSchema>

const defaultValues: Partial<NewCampaignFormValues> = {
  campaignTitle: "",
  description: "",
  goalAmount: 1000,
  startDate: undefined,
  endDate: undefined,
  campaignImageUrl: "",
  organizerName: "",
  initialStatus: "draft",
}

export default function NewCampaignPage() {
  const { toast } = useToast()
  const form = useForm<NewCampaignFormValues>({
    resolver: zodResolver(newCampaignFormSchema),
    defaultValues,
    mode: "onChange",
  })

  const watchedStartDate = form.watch("startDate");
  const watchedEndDate = form.watch("endDate");

  function onSubmit(data: NewCampaignFormValues) {
    console.log(data)
    toast({
      title: "Campaign Created!",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
    // form.reset(); // Optionally reset form after submission
  }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Create New Campaign</CardTitle>
              <ShadCNCardDescription>
                Fill in the details to launch a new donation campaign.
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
                          <Input placeholder="E.g., Support Local Animal Shelter" {...field} />
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
                          <Input type="number" placeholder="1000" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            if (date < today) return true;
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
                            const today = new Date();
                            today.setHours(0,0,0,0);
                             // If no start date, disable only past dates
                            if (!watchedStartDate && date < today) return true;
                            // If start date exists, disable dates before start date OR past dates
                            if (watchedStartDate && (date < watchedStartDate || date < today)) return true;
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
                          <Input placeholder="https://placehold.co/600x400.png" {...field} />
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
                          <Input placeholder="Your Organization or Name" {...field} />
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
                        <FormLabel>Initial Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select initial status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Set the initial status. 'Draft' keeps it hidden, 'Upcoming' shows it as planned, 'Active' makes it live.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full md:w-auto">Create Campaign</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  )
}
