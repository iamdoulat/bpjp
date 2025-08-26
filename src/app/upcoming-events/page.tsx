
// src/app/upcoming-events/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, ServerCrash, Search, ChevronLeft, ChevronRight, Eye, Activity, CheckCircle2 } from "lucide-react";
import { getEvents, type EventData } from "@/services/eventService";
import { Timestamp } from "firebase/firestore";

const EVENTS_PER_PAGE = 3;

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

export default function EventsPage() {
  const [activeEvents, setActiveEvents] = React.useState<EventData[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<EventData[]>([]);
  const [completedEvents, setCompletedEvents] = React.useState<EventData[]>([]);
  
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [currentActivePage, setCurrentActivePage] = React.useState(1);
  const [currentUpcomingPage, setCurrentUpcomingPage] = React.useState(1);
  const [currentCompletedPage, setCurrentCompletedPage] = React.useState(1);

  React.useEffect(() => {
    async function fetchAndCategorizeEvents() {
      setLoading(true);
      setError(null);
      try {
        const fetchedEvents = await getEvents('desc'); // Fetch all events

        const active: EventData[] = [];
        const upcoming: EventData[] = [];
        const completed: EventData[] = [];

        fetchedEvents.forEach(event => {
          if (event.eventStatus === 'Confirmed') {
            active.push(event);
          } else if (event.eventStatus === 'Planned' || event.eventStatus === 'Postponed') {
            upcoming.push(event);
          } else if (event.eventStatus === 'Completed' || event.eventStatus === 'Cancelled') {
            completed.push(event);
          }
          // Events with other statuses or no status will be ignored by this logic.
        });

        // Sort upcoming events by soonest first
        upcoming.sort((a, b) => {
            const dateA = a.eventDate instanceof Timestamp ? a.eventDate.toMillis() : a.eventDate.getTime();
            const dateB = b.eventDate instanceof Timestamp ? b.eventDate.toMillis() : b.eventDate.getTime();
            return dateA - dateB;
        });
        // Sort active events by most recent (if multiple on same day, createdAt could be a secondary sort)
        active.sort((a, b) => {
            const dateA = a.eventDate instanceof Timestamp ? a.eventDate.toMillis() : a.eventDate.getTime();
            const dateB = b.eventDate instanceof Timestamp ? b.eventDate.toMillis() : b.eventDate.getTime();
            if (dateB !== dateA) return dateB - dateA; // Sort by event date first
            const createdAtA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : (a.createdAt as Date).getTime(); // Handle if createdAt is Date
            const createdAtB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : (b.createdAt as Date).getTime(); // Handle if createdAt is Date
            return createdAtB - createdAtA; // Then by creation date
        });
        // Sort completed events by most recent end/event date
        completed.sort((a, b) => {
            const dateA = a.eventDate instanceof Timestamp ? a.eventDate.toMillis() : a.eventDate.getTime();
            const dateB = b.eventDate instanceof Timestamp ? b.eventDate.toMillis() : b.eventDate.getTime();
            return dateB - dateA;
        });


        setActiveEvents(active);
        setUpcomingEvents(upcoming);
        setCompletedEvents(completed);

      } catch (e) {
        console.error("Failed to fetch events:", e);
        setError(e instanceof Error ? e.message : "Could not load events.");
      } finally {
        setLoading(false);
      }
    }
    fetchAndCategorizeEvents();
  }, []);

  const paginateEvents = (eventsList: EventData[], currentPage: number) => {
    const totalPages = Math.ceil(eventsList.length / EVENTS_PER_PAGE);
    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    const endIndex = startIndex + EVENTS_PER_PAGE;
    return {
      paginatedItems: eventsList.slice(startIndex, endIndex),
      totalPages,
    };
  };

  const { paginatedItems: displayedActive, totalPages: totalActivePages } = paginateEvents(activeEvents, currentActivePage);
  const { paginatedItems: displayedUpcoming, totalPages: totalUpcomingPages } = paginateEvents(upcomingEvents, currentUpcomingPage);
  const { paginatedItems: displayedCompleted, totalPages: totalCompletedPages } = paginateEvents(completedEvents, currentCompletedPage);

  const renderEventSection = (
    title: string,
    eventsToShow: EventData[],
    currentPage: number,
    setCurrentPage: (page: number) => void,
    totalPages: number,
    emptyMessage: string,
    sectionDescription: string,
    IconComponent: React.ElementType
  ) => {
    return (
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-2">
            <IconComponent className="h-7 w-7 text-green-600" />
            <h2 className="text-xl font-headline font-semibold text-foreground">{title}</h2>
        </div>
        <p className="text-muted-foreground mb-6 ml-9">
          {sectionDescription}
        </p>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(Math.min(EVENTS_PER_PAGE,3))].map((_, i) => <EventCardSkeleton key={`${title}-skel-${i}`} />)}
          </div>
        ) : error ? (
           <Alert variant="destructive" className="bg-destructive/10">
            <ServerCrash className="h-5 w-5 text-destructive" />
            <AlertTitle>Error Loading Events</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : eventsToShow.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {eventsToShow.map(event => (
                <EventCard key={event.id || event.title} event={event} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Alert>
            <IconComponent className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{emptyMessage}</AlertDescription>
          </Alert>
        )}
      </section>
    );
  };

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 overflow-auto pb-20 md:pb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-10 w-10 text-green-600" />
            <div>
              <h1 className="text-2xl font-headline font-bold">ইভেন্টসমূহ</h1>
              <p className="text-muted-foreground text-md">
              আমাদের সক্রিয় ইভেন্টে যোগ দিন, আগামি ইভেন্টগুলো দেখুন বা পূর্ববর্তী উদ্যোগসমূহ পর্যালোচনা করুন।
              </p>
            </div>
          </div>
        </div>

        {renderEventSection(
          "Active Events",
          displayedActive,
          currentActivePage,
          setCurrentActivePage,
          totalActivePages,
          "No events are currently active.",
          "চলমান ইভেন্টগুলোতে অংশ নিন।",
          Activity
        )}

        {renderEventSection(
          "Upcoming Events",
          displayedUpcoming,
          currentUpcomingPage,
          setCurrentUpcomingPage,
          totalUpcomingPages,
          "No upcoming events scheduled yet. Stay tuned!",
          "এই আসন্ন ইভেন্টগুলোর জন্য প্রস্তুতি নিন।",
          CalendarClock
        )}
        
        {renderEventSection(
          "Completed & Past Events",
          displayedCompleted,
          currentCompletedPage,
          setCurrentCompletedPage,
          totalCompletedPages,
          "No events have been completed or archived yet.",
          "পুরনো বা সমাপ্ত ইভেন্ট পর্যালোচনা করুন।",
          CheckCircle2
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
            <CalendarClock className="w-16 h-16 text-muted-foreground" />
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

