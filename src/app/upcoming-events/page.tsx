
// src/app/upcoming-events/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link"; // Import Link
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck2, ServerCrash, Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { getEvents, type EventData } from "@/services/eventService";
import { Timestamp } from "firebase/firestore";

const EVENTS_PER_PAGE = 6;

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

export default function UpcomingEventsPage() {
  const [events, setEvents] = React.useState<EventData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    async function fetchUpcomingEvents() {
      setLoading(true);
      setError(null);
      try {
        const fetchedEvents = await getEvents('asc'); // Fetch events sorted by date ascending
        const now = new Date();
        // Filter for events whose eventDate is in the future or today
        const futureEvents = fetchedEvents.filter(event => {
            const eventDate = event.eventDate instanceof Timestamp ? event.eventDate.toDate() : event.eventDate;
            // Compare dates without time for "today"
            const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
            const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return eventDateOnly >= todayOnly;
        });
        setEvents(futureEvents);
      } catch (e) {
        console.error("Failed to fetch upcoming events:", e);
        setError(e instanceof Error ? e.message : "Could not load events.");
      } finally {
        setLoading(false);
      }
    }
    fetchUpcomingEvents();
  }, []);

  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
  const endIndex = startIndex + EVENTS_PER_PAGE;
  const currentEvents = events.slice(startIndex, endIndex);

  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 overflow-auto pb-20 md:pb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <CalendarCheck2 className="h-10 w-10 text-green-600" />
            <div>
              <h1 className="text-2xl font-headline font-bold">Upcoming Events</h1>
              <p className="text-muted-foreground text-md">
                Discover and join our scheduled events.
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        )}

        {error && !loading && (
           <Alert variant="destructive" className="bg-destructive/10">
            <ServerCrash className="h-5 w-5 text-destructive" />
            <AlertTitle>Error Loading Events</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && events.length === 0 && (
          <Alert>
            <Search className="h-4 w-4" />
            <AlertTitle>No Upcoming Events</AlertTitle>
            <AlertDescription>There are no events scheduled at the moment. Please check back later!</AlertDescription>
          </Alert>
        )}

        {!loading && !error && events.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {currentEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}

function EventCardSkeleton() {
  return (
    <Card className="flex flex-col h-full shadow-md overflow-hidden rounded-lg">
      <Skeleton className="aspect-[16/9] w-full rounded-t-md" />
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-3/4 mb-1" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex-grow">
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-24" />
      </CardFooter>
    </Card>
  );
}

interface EventCardProps {
  event: EventData;
}

function EventCard({ event }: EventCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden rounded-lg">
      <div className="relative aspect-[16/9] w-full bg-muted">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            layout="fill"
            objectFit="cover"
            data-ai-hint="event poster conference"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <CalendarCheck2 className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="font-headline text-lg leading-tight truncate pt-[5px]">{event.title}</CardTitle>
        <p className="text-sm text-muted-foreground pt-1">{formatDisplayDate(event.eventDate)}</p>
      </CardHeader>
      <CardContent className="flex-grow text-sm text-muted-foreground">
        <p className="line-clamp-3">{event.details}</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/upcoming-events/view/${event.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

