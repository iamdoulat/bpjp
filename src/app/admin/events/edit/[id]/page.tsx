
// src/app/admin/events/edit/[id]/page.tsx
"use client";

import * as React from "react";
import Image from 'next/image';
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
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCNCardDescription } from "@/components/ui/card";
import { Alert, AlertTitle as ShadCNAlertTitle, AlertDescription as ShadCNAlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Edit3, AlertCircle, X, ArrowLeft } from "lucide-react"; 
import { getEventById, updateEvent, type EventData, type UpdateEventInput } from "@/services/eventService";
import ImageCropDialog from "@/components/ui/image-crop-dialog";
import { Timestamp } from "firebase/firestore";

const editEventFormSchema = z.object({
  title: z.string().min(5, { message: "Event title must be at least 5 characters." }).max(150),
  details: z.string().min(20, { message: "Details must be at least 20 characters." }).max(5000),
  eventDate: z.date({ required_error: "An event date is required." }),
  eventHour: z.string().regex(/^([01]\d|2[0-3])$/, { message: "Please select a valid hour (00-23)."}),
  eventMinute: z.string().regex(/^[0-5]\d$/, { message: "Please select a valid minute (00-59)."}),
  attachmentFile: z.instanceof(File).optional().nullable(), 
});

type EditEventFormValues = z.infer<typeof editEventFormSchema>;

const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export default function EditEventPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = React.useState<EventData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [currentAttachmentPreview, setCurrentAttachmentPreview] = React.useState<string | null>(null);
  const [newCroppedImagePreview, setNewCroppedImagePreview] = React.useState<string | null>(null);
  const [imageToCropSrc, setImageToCropSrc] = React.useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = React.useState(false);
  const [removeExistingAttachment, setRemoveExistingAttachment] = React.useState(false);


  const form = useForm<EditEventFormValues>({
    resolver: zodResolver(editEventFormSchema),
    mode: "onChange",
  });

  React.useEffect(() => {
    if (eventId) {
      async function fetchEvent() {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedEvent = await getEventById(eventId);
          if (fetchedEvent) {
            setEvent(fetchedEvent);
            const eventDateObj = fetchedEvent.eventDate instanceof Timestamp 
              ? fetchedEvent.eventDate.toDate() 
              : new Date(fetchedEvent.eventDate);

            form.reset({
              title: fetchedEvent.title,
              details: fetchedEvent.details,
              eventDate: eventDateObj,
              eventHour: String(eventDateObj.getHours()).padStart(2, '0'),
              eventMinute: String(eventDateObj.getMinutes()).padStart(2, '0'),
              attachmentFile: undefined,
            });
            setCurrentAttachmentPreview(fetchedEvent.imageUrl || null);
            setNewCroppedImagePreview(null);
            setRemoveExistingAttachment(false);
          } else {
            setError("Event not found.");
          }
        } catch (e) {
          console.error("Failed to fetch event for editing:", e);
          setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
          setIsLoading(false);
        }
      }
      fetchEvent();
    }
  }, [eventId, form]);

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
    setNewCroppedImagePreview(URL.createObjectURL(croppedBlob));
    setCurrentAttachmentPreview(null); 
    setRemoveExistingAttachment(false); 
    setIsCropDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveExistingAttachment = () => {
    setRemoveExistingAttachment(true);
    setCurrentAttachmentPreview(null);
    setNewCroppedImagePreview(null);
    form.setValue("attachmentFile", null, { shouldValidate: true, shouldDirty: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  async function onSubmit(data: EditEventFormValues) {
    if (!event || !event.id) {
        toast({ title: "Error", description: "Event data is missing.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
      const combinedDateTime = new Date(data.eventDate);
      combinedDateTime.setHours(parseInt(data.eventHour, 10), parseInt(data.eventMinute, 10), 0, 0);

      const updateInput: UpdateEventInput = {
        title: data.title,
        details: data.details,
        eventDate: combinedDateTime,
      };

      if (removeExistingAttachment) {
        updateInput.attachmentFile = null; 
      } else if (data.attachmentFile) {
        updateInput.attachmentFile = data.attachmentFile; 
      }
      
      await updateEvent(event.id, updateInput, event);
      
      toast({
        title: "Event Updated!",
        description: `Event "${data.title}" has been successfully updated.`,
      });
      router.push("/admin/events");
    } catch (error) {
      console.error("Failed to update event:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
         if (errorMessage.includes("Firebase Storage permission denied")) {
           errorMessage = "Failed to update event image due to Firebase Storage permission issues. Please check your Storage security rules to allow writes to 'event_attachments/'.";
        }
      }
      toast({
        title: "Error Updating Event",
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
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Card className="shadow-lg max-w-2xl mx-auto">
            <CardHeader><Skeleton className="h-8 w-3/5" /><Skeleton className="h-4 w-4/5 mt-1" /></CardHeader>
            <CardContent className="space-y-8 pt-6">
              {[...Array(5)].map((_, i) => ( // Adjusted skeleton items
                <div key={i} className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
              ))}
              <Skeleton className="h-24 w-full" /> 
              <Skeleton className="h-10 w-28 mt-4" />
            </CardContent>
          </Card>
        </main>
      </AppShell>
    );
  }

  if (error && !event) {
     return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" /><ShadCNAlertTitle>Error Loading Data</ShadCNAlertTitle><ShadCNAlertDescription>{error}</ShadCNAlertDescription>
             <Button onClick={() => router.push('/admin/events')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
             </Button>
          </Alert>
        </main>
      </AppShell>
    );
  }
  
  if (!event) {
     return (
        <AppShell>
            <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center">
              <Alert variant="default" className="max-w-md">
                <AlertCircle className="h-4 w-4" /><ShadCNAlertTitle>Event Not Found</ShadCNAlertTitle><ShadCNAlertDescription>The event data could not be loaded or does not exist.</ShadCNAlertDescription>
              </Alert>
              <Button onClick={() => router.push('/admin/events')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
              </Button>
            </main>
         </AppShell>
    );
  }

  const imagePreviewToShow = newCroppedImagePreview || currentAttachmentPreview;

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Edit3 className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-headline font-semibold">Edit Event</h1>
            <p className="text-muted-foreground text-sm">
              Modify the details for event: {event.title}
            </p>
          </div>
        </div>

        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Update Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Event Title</FormLabel><FormControl><Input placeholder="E.g., Annual Charity Gala" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="details" render={({ field }) => (
                  <FormItem><FormLabel>Event Details</FormLabel><FormControl><Textarea placeholder="Describe the event..." className="resize-y min-h-[150px]" {...field} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="eventDate" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Event Date</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      placeholder="Select event date"
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today || isSubmitting;
                      }}
                    />
                     <FormDescription>Select the date of the event.</FormDescription>
                  <FormMessage /></FormItem>
                )}/>

                <div className="space-y-2">
                  <FormLabel>Event Time</FormLabel>
                  <div className="flex items-start gap-4">
                    <FormField
                      control={form.control}
                      name="eventHour"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                           <FormLabel htmlFor="eventHourSelectEdit" className="text-xs text-muted-foreground">Hour (24h)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger id="eventHourSelectEdit">
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
                           <FormLabel htmlFor="eventMinuteSelectEdit" className="text-xs text-muted-foreground">Minute</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger id="eventMinuteSelectEdit">
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
                  <FormLabel>Event Image/Attachment</FormLabel>
                  <div className="space-y-2">
                    {imagePreviewToShow && !removeExistingAttachment && (
                      <div className="mt-2 relative w-full aspect-[16/9] max-w-md mx-auto border rounded-md overflow-hidden">
                        <Image src={imagePreviewToShow} alt="Event image preview" layout="fill" objectFit="contain" data-ai-hint="event poster conference"/>
                      </div>
                    )}
                    {removeExistingAttachment && <p className="text-sm text-muted-foreground">Current image will be removed.</p>}
                    
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
                     {currentAttachmentPreview && !newCroppedImagePreview && !removeExistingAttachment && (
                        <Button variant="outline" size="sm" type="button" onClick={handleRemoveExistingAttachment} disabled={isSubmitting}>
                            <X className="mr-1.5 h-4 w-4"/> Remove Current Image
                        </Button>
                    )}
                  </div>
                  <FormDescription>Upload a new image to replace the existing one, or remove the current image (16:9 aspect ratio recommended).</FormDescription>
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

