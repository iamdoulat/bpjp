
// src/app/upcoming-events/view/[id]/page.tsx
"use client"

import * as React from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert"
import { getEventById, type EventData, registerForEvent, checkIfUserRegistered } from '@/services/eventService';
import { Loader2, AlertCircle, ArrowLeft, CalendarDays, FileText, Users, CheckCircle, XCircle } from "lucide-react"
import { Timestamp } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useForm } from "react-hook-form"; // Added this import
import { getUserProfile } from "@/services/userService"

const registrationFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(100),
  mobileNumber: z.string().regex(/^[+]?[0-9\s-()]{7,20}$/, "Invalid mobile number format."),
  wardNo: z.string().min(1, "Ward No. is required.").max(20, "Ward No. cannot exceed 20 characters."),
});

type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

function formatDisplayDateTime(date: Timestamp | Date | undefined): string {
  if (!date) return "N/A";
  const jsDate = date instanceof Timestamp ? date.toDate() : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(jsDate);
}

export default function PublicViewEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = React.useState<EventData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = React.useState(false);
  const [confirmJoin, setConfirmJoin] = React.useState<"yes" | "no" | undefined>(undefined);
  const [isSubmittingRegistration, setIsSubmittingRegistration] = React.useState(false);
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [checkingRegistration, setCheckingRegistration] = React.useState(true);

  const registrationForm = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      name: "",
      mobileNumber: "",
      wardNo: "",
    },
  });

  const fetchEventDetails = React.useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedEvent = await getEventById(eventId);
      if (fetchedEvent) {
        setEvent(fetchedEvent);
      } else {
        setError("Event not found or is no longer available.");
      }
    } catch (e) {
      console.error("Failed to fetch event details:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  React.useEffect(() => {
    if (user && eventId && !authLoading) {
      setCheckingRegistration(true);
      checkIfUserRegistered(eventId, user.uid)
        .then(setIsRegistered)
        .catch(err => console.error("Error checking registration status:", err))
        .finally(() => setCheckingRegistration(false));
    } else if (!user && !authLoading) {
      setIsRegistered(false);
      setCheckingRegistration(false);
    }
  }, [user, eventId, authLoading]);


  React.useEffect(() => {
    if (user && isRegistrationDialogOpen) {
      getUserProfile(user.uid).then(profile => {
        if (profile) {
          registrationForm.reset({
            name: profile.displayName || user.displayName || "",
            mobileNumber: profile.mobileNumber || "",
            wardNo: "",
          });
        } else {
           registrationForm.reset({
            name: user.displayName || "",
            mobileNumber: "",
            wardNo: "",
          });
        }
      });
    }
  }, [user, isRegistrationDialogOpen, registrationForm]);

  const handleRegistrationSubmit = async (data: RegistrationFormValues) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to register.", variant: "destructive" });
      setIsRegistrationDialogOpen(false);
      router.push('/login');
      return;
    }
    if (!event || !event.id) {
      toast({ title: "Error", description: "Event details are missing.", variant: "destructive" });
      return;
    }

    setIsSubmittingRegistration(true);
    try {
      await registerForEvent(event.id, user.uid, {
        name: data.name,
        mobileNumber: data.mobileNumber,
        wardNo: data.wardNo,
        userEmail: user.email || undefined,
      });
      toast({
        title: "Registration Successful!",
        description: `You have successfully registered for "${event.title}".`,
        variant: "default",
      });
      setIsRegistrationDialogOpen(false);
      setConfirmJoin(undefined);
      registrationForm.reset();
      setIsRegistered(true); // Assume registration successful, update UI
      // Refetch event data to update participant count
      fetchEventDetails();
    } catch (e) {
      console.error("Registration failed:", e);
      toast({
        title: "Registration Failed",
        description: (e instanceof Error ? e.message : "Could not complete registration."),
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRegistration(false);
    }
  };
  
  const isEventPast = event && (event.eventDate instanceof Timestamp ? event.eventDate.toDate() : event.eventDate) < new Date();

  if (isLoading || authLoading || checkingRegistration) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-auto">
          <Button variant="outline" size="sm" className="mb-4" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
          </Button>
          <Card className="shadow-lg max-w-2xl mx-auto">
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-6 w-1/2 mb-1" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-64 w-full rounded-md" />
              <div className="space-y-1">
                 <Skeleton className="h-4 w-1/3" />
                 <Skeleton className="h-6 w-2/3" />
              </div>
              <Skeleton className="h-6 w-1/4" />
            </CardContent>
             <CardFooter className="bg-muted/30 p-4 md:p-6 border-t flex justify-center">
                <Skeleton className="h-12 w-48" />
           </CardFooter>
          </Card>
        </main>
      </AppShell>
    );
  }

  if (error || !event) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>{error ? "Error Loading Event" : "Event Not Found"}</ShadCNAlertTitle>
            <AlertDescription>{error || "The event you are looking for does not exist or could not be loaded."}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/upcoming-events')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Upcoming Events
          </Button>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-auto pb-20 md:pb-8">
        <Button variant="outline" size="sm" onClick={() => router.push('/upcoming-events')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Upcoming Events
        </Button>
        <Card className="shadow-xl max-w-3xl mx-auto">
          <CardHeader className="bg-muted/30 p-4 md:p-6 border-b">
            <CardTitle className="text-2xl md:text-3xl font-headline">{event.title}</CardTitle>
            <CardDescription className="text-sm md:text-base">Event Details</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            {event.imageUrl ? (
              <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border shadow-inner">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  layout="fill"
                  objectFit="cover"
                  priority
                  data-ai-hint="event poster conference"
                />
              </div>
            ) : (
              <div className="aspect-[16/9] w-full rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                <CalendarDays className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 mr-2 text-green-600" />
                    Event Date & Time:
                  </div>
                  <p className="text-lg font-semibold text-foreground">{formatDisplayDateTime(event.eventDate)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2 text-green-600" />
                    Participants Registered:
                  </div>
                  <p className="text-lg font-semibold text-foreground">{event.participantCount || 0}</p>
                </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-md font-semibold text-foreground">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Event Details:
              </div>
              <p className="text-foreground whitespace-pre-line text-sm leading-relaxed p-3 bg-muted/20 rounded-md border">
                {event.details}
              </p>
            </div>
          </CardContent>
           <CardFooter className="bg-muted/30 p-4 md:p-6 border-t flex justify-center">
                {isRegistered ? (
                  <Button variant="default" size="lg" className="bg-green-600 hover:bg-green-700 text-white" disabled>
                    <CheckCircle className="mr-2 h-5 w-5" /> You are Registered!
                  </Button>
                ) : isEventPast ? (
                  <Button variant="outline" size="lg" disabled>
                     Event has passed
                  </Button>
                ) : (
                  <Dialog open={isRegistrationDialogOpen} onOpenChange={(open) => {
                    setIsRegistrationDialogOpen(open);
                    if (!open) {
                      setConfirmJoin(undefined); // Reset confirmation on dialog close
                      registrationForm.reset();
                    }
                  }}>
                    <DialogTrigger asChild>
                        <Button variant="default" size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                            Register for this Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Event Registration</DialogTitle>
                        <DialogDescription>
                          Confirm your participation for "{event.title}".
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <Label>Are you sure you want to join this event?</Label>
                        <RadioGroup value={confirmJoin} onValueChange={(value: "yes" | "no") => setConfirmJoin(value)}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id={`confirm-yes-${event.id}`} />
                            <Label htmlFor={`confirm-yes-${event.id}`} className="font-normal">Yes, I want to join</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id={`confirm-no-${event.id}`} />
                            <Label htmlFor={`confirm-no-${event.id}`} className="font-normal">No, not at this time</Label>
                          </div>
                        </RadioGroup>

                        {confirmJoin === "yes" && (
                          <Form {...registrationForm}>
                            <form onSubmit={registrationForm.handleSubmit(handleRegistrationSubmit)} id="event-registration-form" className="space-y-4 pt-4">
                              <FormField
                                control={registrationForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Your Name</FormLabel>
                                    <FormControl><Input placeholder="Full Name" {...field} disabled={isSubmittingRegistration} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={registrationForm.control}
                                name="mobileNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Mobile Number</FormLabel>
                                    <FormControl><Input type="tel" placeholder="e.g., +1234567890" {...field} disabled={isSubmittingRegistration} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={registrationForm.control}
                                name="wardNo"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Ward No.</FormLabel>
                                    <FormControl><Input placeholder="Your Ward Number" {...field} disabled={isSubmittingRegistration} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </form>
                          </Form>
                        )}
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline" disabled={isSubmittingRegistration}>
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                          type="submit"
                          form="event-registration-form"
                          disabled={isSubmittingRegistration || confirmJoin !== "yes" || !registrationForm.formState.isValid}
                        >
                          {isSubmittingRegistration && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Submit Registration
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
           </CardFooter>
        </Card>
      </main>
    </AppShell>
  )
}

