
// src/app/admin/events/create/page.tsx
"use client";

import * as React from "react";
import Image from 'next/image';
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
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCNCardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarPlus, UploadCloud } from "lucide-react";
import { addEvent, type NewEventInput } from "@/services/eventService";
import ImageCropDialog from "@/components/ui/image-crop-dialog";

const eventFormSchema = z.object({
  title: z.string().min(5, { message: "Event title must be at least 5 characters." }).max(150),
  details: z.string().min(20, { message: "Details must be at least 20 characters." }).max(5000),
  eventDate: z.date({ required_error: "An event date is required." }),
  eventHour: z.string().regex(/^([01]\d|2[0-3])$/, { message: "Please select a valid hour (00-23)."}),
  eventMinute: z.string().regex(/^[0-5]\d$/, { message: "Please select a valid minute (00-59)."}),
  attachmentFile: z.instanceof(File).optional().nullable(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const defaultValues: EventFormValues = {
  title: "",
  details: "",
  eventDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Default to tomorrow
  eventHour: "09", // Default to 09 AM
  eventMinute: "00", // Default to 00 minutes
  attachmentFile: null,
};

const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export default function CreateEventPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [imageToCropSrc, setImageToCropSrc] = React.useState<string | null>(null);
  const [croppedImagePreview, setCroppedImagePreview] = React.useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = React.useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCropSrc(reader.result as string);
        setIsCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "event_attachment_cropped.png", { type: "image/png" });
    form.setValue("attachmentFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    setCroppedImagePreview(URL.createObjectURL(croppedBlob));
    setIsCropDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function onSubmit(data: EventFormValues) {
    setIsSubmitting(true);
    try {
      const combinedDateTime = new Date(data.eventDate);
      combinedDateTime.setHours(parseInt(data.eventHour, 10), parseInt(data.eventMinute, 10), 0, 0);

      const eventInput: NewEventInput = {
        title: data.title,
        details: data.details,
        eventDate: combinedDateTime,
        attachmentFile: data.attachmentFile,
      };
      const eventId = await addEvent(eventInput);
      toast({
        title: "Event Created!",
        description: `Event "${data.title}" (ID: ${eventId}) has been successfully saved.`,
      });
      form.reset(defaultValues);
      setCroppedImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to save event:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes("Firebase Storage permission denied")) {
          errorMessage = "Failed to upload event image due to Firebase Storage permission issues. Please check your Storage security rules to allow writes to 'event_attachments/'.";
        }
      }
      toast({
        title: "Error Creating Event",
        description: errorMessage,
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
          <CalendarPlus className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-headline font-semibold">Create Upcoming Event</h1>
            <p className="text-muted-foreground text-sm">
              Add a new event to the upcoming events list.
            </p>
          </div>
        </div>

        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <ShadCNCardDescription>
              Fill in the information below to create a new event.
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
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Annual Charity Gala" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the event, including purpose, venue, schedule, etc..."
                          className="resize-y min-h-[150px]"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Event Date</FormLabel>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        placeholder="Select event date"
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0); // Compare dates without time
                          return date < today || isSubmitting;
                        }}
                      />
                       <FormDescription>
                        Select the date of the event.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Event Time</FormLabel>
                  <div className="flex items-start gap-4">
                    <FormField
                      control={form.control}
                      name="eventHour"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel htmlFor="eventHourSelect" className="text-xs text-muted-foreground">Hour (24h)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger id="eventHourSelect">
                                <SelectValue placeholder="HH" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {hourOptions.map(hour => (
                                <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="eventMinute"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel htmlFor="eventMinuteSelect" className="text-xs text-muted-foreground">Minute</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger id="eventMinuteSelect">
                                <SelectValue placeholder="MM" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {minuteOptions.map(minute => (
                                <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormDescription>Select the hour and minute for the event.</FormDescription>
                </div>


                <FormItem>
                  <FormLabel>Event Image/Attachment (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png, image/jpeg, image/gif"
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  {croppedImagePreview && (
                    <div className="mt-4 relative w-full aspect-[16/9] max-w-md mx-auto border rounded-md overflow-hidden">
                       <Image src={croppedImagePreview} alt="Event image preview" layout="fill" objectFit="contain" data-ai-hint="event poster" />
                    </div>
                  )}
                  <FormDescription>Upload an image for the event (e.g., poster, banner - 16:9 aspect ratio recommended).</FormDescription>
                  <FormMessage>{form.formState.errors.attachmentFile?.message as React.ReactNode}</FormMessage>
                </FormItem>

                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || !form.formState.isValid}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
                  {isSubmitting ? "Saving..." : "Create Event"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        {imageToCropSrc && (
          <ImageCropDialog
            isOpen={isCropDialogOpen}
            onClose={() => {
              setIsCropDialogOpen(false);
              setImageToCropSrc(null); 
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            imageSrc={imageToCropSrc}
            onCropComplete={handleCropComplete}
            aspectRatio={16 / 9} 
            targetWidth={800} 
            targetHeight={450} 
          />
        )}
      </main>
    </AppShell>
  );
}

