// src/components/landing/EventsSection.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, CalendarClock, Eye, UserPlus, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getEvents, type EventData, registerForEvent, checkIfUserRegistered } from '@/services/eventService';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getUserProfile, type UserProfileData } from "@/services/userService";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";


function formatDisplayDate(date: Timestamp | Date | undefined) {
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

const registrationFormSchema = z.object({
  mobileNumber: z.string().regex(/^[+]?[0-9\s-()]{7,20}$/, "Invalid mobile number format."),
});
type RegistrationFormValues = z.infer<typeof registrationFormSchema>;


export function EventsSection() {
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEventsData() {
      try {
        setLoading(true);
        setError(null);
        const fetchedEvents = await getEvents('asc'); // Fetch sorted by soonest
        const upcoming = fetchedEvents
          .filter(event => event.eventStatus === 'Planned' || event.eventStatus === 'Confirmed')
          .slice(0, 4); // Get top 4 upcoming events
        setUpcomingEvents(upcoming);
      } catch (e) {
        console.error("Failed to fetch events for landing page:", e);
        setError(e instanceof Error ? e.message : "Could not load events.");
      } finally {
        setLoading(false);
      }
    }
    fetchEventsData();
  }, []);

  return (
    <section id="events" className="py-5 bg-background">
      <div className="container">
        <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-center sm:text-4xl text-black dark:text-foreground mb-4">
            Upcoming{' '}
            <span className="inline-block rounded-lg bg-green-600 text-white px-3 py-1">
              Events
            </span>
          </h2>
        </div>
        <p className="mt-4 text-center text-lg text-black dark:text-muted-foreground">
          Join our community gatherings and make memories with us.
        </p>
        <div className="mt-12">
          {loading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <EventCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <ServerCrash className="h-5 w-5" />
              <ShadCNAlertTitle>Error Loading Events</ShadCNAlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : upcomingEvents.length > 0 ? (
            <Carousel
              opts={{
                align: "center",
                loop: upcomingEvents.length > 3,
              }}
              className="w-full px-[25px] m-[35px]"
            >
              <CarouselContent className="-ml-4">
                {upcomingEvents.map((event) => (
                  <CarouselItem key={event.id} className="pl-4 basis-full md:basis-1/2 lg:basis-[31%]">
                    <div className="p-1 h-full">
                      <EventCard event={event} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-[-15px] sm:left-[-25px] top-1/2 -translate-y-1/2 hidden lg:flex" />
              <CarouselNext className="absolute right-[-15px] sm:right-[-25px] top-1/2 -translate-y-1/2 hidden lg:flex" />
            </Carousel>
          ) : (
            <Alert>
              <AlertTitle>No Upcoming Events</AlertTitle>
              <AlertDescription>There are no events scheduled at the moment. Please check back soon!</AlertDescription>
            </Alert>
          )}
        </div>
        <div className="mt-12 text-center">
          <Button size="lg" asChild variant="default">
            <Link href="/upcoming-events">View All Events</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function EventCardSkeleton() {
  return (
    <Card className="flex flex-col h-full shadow-md overflow-hidden rounded-lg">
      <Skeleton className="aspect-[16/9] w-full" />
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-1" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex-grow">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
      <CardFooter className="flex gap-2">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-9 w-1/2" />
      </CardFooter>
    </Card>
  );
}

function EventCard({ event }: { event: EventData }) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  
  const registrationForm = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: { mobileNumber: "" },
  });

  useEffect(() => {
    if (user && event.id) {
      setCheckingRegistration(true);
      checkIfUserRegistered(event.id, user.uid)
        .then(setIsRegistered)
        .catch(err => console.error("Error checking registration status:", err))
        .finally(() => setCheckingRegistration(false));
    } else {
      setCheckingRegistration(false);
      setIsRegistered(false);
    }
  }, [user, event.id]);

  const handleJoinClick = () => {
    if (authLoading) return;

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to register for this event.",
        variant: "default"
      });
      router.push('/login');
    } else {
      setIsRegistrationDialogOpen(true);
    }
  };

  useEffect(() => {
    if (user && isRegistrationDialogOpen) {
      getUserProfile(user.uid).then(profile => {
        if (profile) {
          setProfileData(profile);
          registrationForm.reset({ mobileNumber: profile.mobileNumber || "" });
        }
      }).catch(err => console.error("Failed to prefill profile data:", err));
    }
  }, [user, isRegistrationDialogOpen, registrationForm]);


  const handleRegistrationSubmit = async (data: RegistrationFormValues) => {
    if (!user || !event.id) return;
    setIsSubmitting(true);
    const nameToSubmit = profileData?.displayName || user.displayName || "Registered User";
    const wardNoToSubmit = profileData?.wardNo || "Not Provided";

    try {
      await registerForEvent(event.id, user.uid, {
        name: nameToSubmit,
        mobileNumber: data.mobileNumber,
        wardNo: wardNoToSubmit,
        userEmail: user.email || undefined,
      });
      toast({
        title: "Registration Successful!",
        description: `You are now registered for "${event.title}".`,
      });
      setIsRegistered(true);
      setIsRegistrationDialogOpen(false);
    } catch (e) {
      toast({
        title: "Registration Failed",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="relative aspect-[16/9] w-full bg-muted">
        {event.imageUrl ? (
          <Image src={event.imageUrl} alt={event.title} layout="fill" objectFit="cover" data-ai-hint="event poster conference" />
        ) : (
          <div className="flex h-full items-center justify-center"><CalendarClock className="h-16 w-16 text-muted-foreground" /></div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="font-headline text-lg leading-tight truncate">{event.title}</CardTitle>
        <p className="text-sm text-muted-foreground pt-1">{formatDisplayDate(event.eventDate)}</p>
      </CardHeader>
      <CardContent className="flex-grow text-sm text-muted-foreground">
        <p className="line-clamp-3">{event.details}</p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/upcoming-events/view/${event.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
            </Link>
        </Button>
        <Dialog open={isRegistrationDialogOpen} onOpenChange={setIsRegistrationDialogOpen}>
          <DialogTrigger asChild>
             <Button 
                variant="default" 
                size="sm" 
                className="w-full bg-green-600 hover:bg-green-700 text-white" 
                onClick={handleJoinClick}
                disabled={authLoading || checkingRegistration || isRegistered}
              >
               {checkingRegistration ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : isRegistered ? <CheckCircle className="mr-2 h-4 w-4"/> : <UserPlus className="mr-2 h-4 w-4" />}
               {isRegistered ? "Joined" : "Join"}
              </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register for: {event.title}</DialogTitle>
              <DialogDescription>Confirm your details to join this event.</DialogDescription>
            </DialogHeader>
             <Form {...registrationForm}>
                <form id={`event-reg-form-${event.id}`} onSubmit={registrationForm.handleSubmit(handleRegistrationSubmit)} className="space-y-4 pt-4">
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl><Input value={profileData?.displayName || user?.displayName || ""} disabled /></FormControl>
                  </FormItem>
                   <FormItem>
                    <FormLabel>Ward No.</FormLabel>
                    <FormControl><Input value={profileData?.wardNo || "Not Set"} disabled /></FormControl>
                  </FormItem>
                  <FormField
                    control={registrationForm.control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl><Input type="tel" placeholder="Your contact number" {...field} disabled={isSubmitting} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
             </Form>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" type="button" disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" form={`event-reg-form-${event.id}`} disabled={isSubmitting || !registrationForm.formState.isValid}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Confirm Registration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
