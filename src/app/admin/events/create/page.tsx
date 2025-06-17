
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
import { Loader2, CalendarPlus, UploadCloud, Trash2, Users, Gift } from "lucide-react";
import { addEvent, type NewEventInput, type TokenDistributionEntry } from "@/services/eventService";
import ImageCropDialog from "@/components/ui/image-crop-dialog";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { getAllUserProfiles, type UserProfileData } from "@/services/userService";

const eventFormSchema = z.object({
  title: z.string().min(5, { message: "Event title must be at least 5 characters." }).max(150),
  details: z.string().min(20, { message: "Details must be at least 20 characters." }).max(5000),
  eventDate: z.date({ required_error: "An event date is required." }),
  eventHour: z.string().regex(/^([01]\d|2[0-3])$/, { message: "Please select a valid hour (00-23)."}),
  eventMinute: z.string().regex(/^[0-5]\d$/, { message: "Please select a valid minute (00-59)."}),
  attachmentFile: z.instanceof(File).optional().nullable(),
  // Token distribution is not directly part of form values managed by RHF in this setup,
  // but is handled by local state `tokenAssignments` and then added to `eventInput` on submit.
  // If complex validation per item were needed, useFieldArray would be better.
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const defaultValues: EventFormValues = {
  title: "",
  details: "",
  eventDate: new Date(new Date().setDate(new Date().getDate() + 1)),
  eventHour: "09",
  eventMinute: "00",
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

  const [allUsers, setAllUsers] = React.useState<UserProfileData[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);
  const [tokenAssignments, setTokenAssignments] = React.useState<TokenDistributionEntry[]>([]);
  const [selectedUserIdForToken, setSelectedUserIdForToken] = React.useState<string>("");
  const [currentTokenQty, setCurrentTokenQty] = React.useState<string>("");

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
    mode: "onChange",
  });

  React.useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const users = await getAllUserProfiles();
        setAllUsers(users.filter(u => u.status === 'Active')); // Only active users
      } catch (err) {
        console.error("Failed to fetch users for token assignment:", err);
        toast({ title: "Error", description: "Could not load users for token assignment.", variant: "destructive" });
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, [toast]);

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

  const handleAddTokenAssignment = () => {
    if (!selectedUserIdForToken || !currentTokenQty) {
      toast({ title: "Missing Info", description: "Please select a user and enter token quantity.", variant: "destructive" });
      return;
    }
    const qty = parseInt(currentTokenQty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Invalid Quantity", description: "Token quantity must be a positive number.", variant: "destructive" });
      return;
    }
    if (tokenAssignments.some(a => a.userId === selectedUserIdForToken)) {
      toast({ title: "User Already Added", description: "This user has already been assigned tokens for this event.", variant: "destructive" });
      return;
    }
    const user = allUsers.find(u => u.uid === selectedUserIdForToken);
    if (!user) {
      toast({ title: "User Not Found", description: "Selected user could not be found.", variant: "destructive" });
      return;
    }
    setTokenAssignments(prev => [...prev, { userId: user.uid, userName: user.displayName || user.email || user.uid, tokenQty: qty }]);
    setSelectedUserIdForToken("");
    setCurrentTokenQty("");
  };

  const handleRemoveTokenAssignment = (userIdToRemove: string) => {
    setTokenAssignments(prev => prev.filter(a => a.userId !== userIdToRemove));
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
        tokenDistribution: tokenAssignments,
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
      setTokenAssignments([]);
    } catch (error) {
      console.error("Failed to save event:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
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
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Event Title</FormLabel><FormControl><Input placeholder="E.g., Annual Charity Gala" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="details" render={({ field }) => (
                  <FormItem><FormLabel>Event Details</FormLabel><FormControl><Textarea placeholder="Describe the event, including purpose, venue, schedule, etc..." className="resize-y min-h-[150px]" {...field} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="eventDate" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Event Date</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      placeholder="Select event date"
                      disabled={(date) => { const today = new Date(); today.setHours(0, 0, 0, 0); return date < today || isSubmitting; }}
                    />
                    <FormDescription>Select the date of the event.</FormDescription><FormMessage />
                  </FormItem>
                )}/>

                <div className="space-y-2">
                  <FormLabel>Event Time</FormLabel>
                  <div className="flex items-start gap-4">
                    <FormField control={form.control} name="eventHour" render={({ field }) => (
                      <FormItem className="flex-1"><FormLabel htmlFor="eventHourSelect" className="text-xs text-muted-foreground">Hour (24h)</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}><FormControl><SelectTrigger id="eventHourSelect"><SelectValue placeholder="HH" /></SelectTrigger></FormControl><SelectContent>{hourOptions.map(hour => (<SelectItem key={hour} value={hour}>{hour}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="eventMinute" render={({ field }) => (
                      <FormItem className="flex-1"><FormLabel htmlFor="eventMinuteSelect" className="text-xs text-muted-foreground">Minute</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}><FormControl><SelectTrigger id="eventMinuteSelect"><SelectValue placeholder="MM" /></SelectTrigger></FormControl><SelectContent>{minuteOptions.map(minute => (<SelectItem key={minute} value={minute}>{minute}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                    )}/>
                  </div>
                  <FormDescription>Select the hour and minute for the event.</FormDescription>
                </div>

                <FormItem>
                  <FormLabel>Event Image/Attachment (Optional)</FormLabel>
                  <FormControl><Input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSubmitting}/></FormControl>
                  {croppedImagePreview && (<div className="mt-4 relative w-full aspect-[16/9] max-w-md mx-auto border rounded-md overflow-hidden"><Image src={croppedImagePreview} alt="Event image preview" layout="fill" objectFit="contain" data-ai-hint="event poster" /></div>)}
                  <FormDescription>Upload an image for the event (e.g., poster, banner - 16:9 aspect ratio recommended).</FormDescription>
                  <FormMessage>{form.formState.errors.attachmentFile?.message as React.ReactNode}</FormMessage>
                </FormItem>

                {/* Token Distribution Section */}
                <div className="space-y-4 p-4 border rounded-md shadow-sm bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium text-foreground">Token Distribution (Optional)</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_auto] gap-3 items-end">
                    <FormItem className="flex-grow min-w-0"> {/* Added min-w-0 */}
                      <FormLabel htmlFor="selectUserToken" className="text-sm">Select User</FormLabel>
                      <Select
                        value={selectedUserIdForToken}
                        onValueChange={setSelectedUserIdForToken}
                        disabled={loadingUsers || isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger id="selectUserToken">
                            <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select a user"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {!loadingUsers && allUsers.filter(u => !tokenAssignments.some(ta => ta.userId === u.uid)).map(user => (
                            <SelectItem key={user.uid} value={user.uid}>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{user.displayName || user.email} ({user.role})</span>
                              </div>
                            </SelectItem>
                          ))}
                           {loadingUsers && <SelectItem value="loading" disabled>Loading users...</SelectItem>}
                           {!loadingUsers && allUsers.filter(u => !tokenAssignments.some(ta => ta.userId === u.uid)).length === 0 && <SelectItem value="nousers" disabled>No available users</SelectItem>}
                        </SelectContent>
                      </Select>
                    </FormItem>
                    <FormItem>
                      <FormLabel htmlFor="tokenQty" className="text-sm">Token Qty</FormLabel>
                      <FormControl>
                        <Input
                          id="tokenQty"
                          type="number"
                          placeholder="Qty"
                          value={currentTokenQty}
                          onChange={(e) => setCurrentTokenQty(e.target.value)}
                          className="w-full"
                          disabled={isSubmitting}
                          min="1"
                        />
                      </FormControl>
                    </FormItem>
                    <Button type="button" onClick={handleAddTokenAssignment} disabled={isSubmitting || !selectedUserIdForToken || !currentTokenQty || loadingUsers} className="self-end h-10">
                      Add
                    </Button>
                  </div>
                  {tokenAssignments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <FormLabel className="text-sm font-medium text-foreground">Assigned Tokens:</FormLabel>
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader><TableRow><TableHead className="text-xs">User</TableHead><TableHead className="text-xs text-center">Quantity</TableHead><TableHead className="text-right w-[50px]"></TableHead></TableRow></TableHeader>
                          <TableBody>
                            {tokenAssignments.map((assignment) => (
                              <TableRow key={assignment.userId}>
                                <TableCell className="text-xs py-2">{assignment.userName}</TableCell>
                                <TableCell className="text-xs text-center py-2">{assignment.tokenQty}</TableCell>
                                <TableCell className="text-right py-2">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveTokenAssignment(assignment.userId)} disabled={isSubmitting}>
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                  <FormDescription className="text-xs">Assign tokens to specific users for this event. Users with assigned tokens can participate in event-specific activities or redemptions.</FormDescription>
                </div>


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
            onClose={() => {setIsCropDialogOpen(false); setImageToCropSrc(null); if (fileInputRef.current) {fileInputRef.current.value = "";}}}
            imageSrc={imageToCropSrc}
            onCropComplete={handleCropComplete}
            aspectRatio={16 / 9} targetWidth={800} targetHeight={450}
          />
        )}
      </main>
    </AppShell>
  );
}
