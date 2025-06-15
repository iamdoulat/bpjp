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
import { getEventById, type EventData } from '@/services/eventService';
import { Loader2, AlertCircle, ArrowLeft, CalendarDays, FileText, Users } from "lucide-react"
import { Timestamp } from "firebase/firestore"

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

  const [event, setEvent] = React.useState<EventData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (eventId) {
      async function fetchEventDetails() {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedEvent = await getEventById(eventId);
          // For public view, allow viewing if event data is fetched, regardless of status (status check in list page)
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
      }
      fetchEventDetails();
    }
  }, [eventId]);

  if (isLoading) {
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
            {/* No footer skeleton for public view initially */}
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
            {event.imageUrl && (
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
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 mr-2 text-primary" />
                    Event Date & Time:
                  </div>
                  <p className="text-lg font-semibold text-foreground">{formatDisplayDateTime(event.eventDate)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2 text-primary" />
                    Participants Expected:
                  </div>
                  {/* Participant count might not be public, or could be displayed as "Registrations: Open/Closed" */}
                  <p className="text-lg font-semibold text-foreground">{event.participantCount > 0 ? `${event.participantCount} registered` : "To be announced"}</p>
                </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-md font-semibold text-foreground">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Event Details:
              </div>
              <p className="text-foreground whitespace-pre-line text-sm leading-relaxed p-3 bg-muted/20 rounded-md border">
                {event.details}
              </p>
            </div>
          </CardContent>
          {/* CardFooter can be used for actions like "Register" or "Share" in the future */}
           <CardFooter className="bg-muted/30 p-4 md:p-6 border-t flex justify-center">
                <Button variant="default" size="lg" className="bg-green-600 hover:bg-green-700 text-white" disabled> {/* Registration not yet implemented */}
                    Register for Event (Coming Soon)
                </Button>
           </CardFooter>
        </Card>
      </main>
    </AppShell>
  )
}
