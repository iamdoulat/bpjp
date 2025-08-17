// src/components/landing/EventsSection.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, ServerCrash, CalendarClock, Eye, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getEvents, type EventData } from '@/services/eventService';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
          .slice(0, 3); // Get top 3 upcoming events
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
        <h2 className="text-3xl font-bold tracking-tight text-center sm:text-4xl">Upcoming Events</h2>
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
              <AlertTitle>Error Loading Events</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
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

  const handleRegisterClick = () => {
    if (authLoading) return;

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to register for this event.",
        variant: "default"
      });
      router.push('/login');
    } else {
      router.push(`/upcoming-events/view/${event.id}`);
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
        <Button variant="default" size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleRegisterClick}>
            <UserPlus className="mr-2 h-4 w-4" /> Join
        </Button>
      </CardFooter>
    </Card>
  );
}
