
// src/app/admin/events/view/[id]/page.tsx
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
import { Loader2, AlertCircle, ArrowLeft, CalendarDays, FileText, Edit, Users } from "lucide-react" // Added Users icon
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

export default function ViewEventPage() {
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
          if (fetchedEvent) {
            setEvent(fetchedEvent);
          } else {
            setError("Event not found.");
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
        <main className="flex-1 p-4 md:p-6 space-y-6">
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
              <Skeleton className="h-48 w-full rounded-md" /> 
              <div className="space-y-1">
                 <Skeleton className="h-4 w-1/3" />
                 <Skeleton className="h-6 w-2/3" />
              </div>
              <Skeleton className="h-6 w-1/4" /> {/* For participant count skeleton */}
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-32" />
            </CardFooter>
          </Card>
        </main>
      </AppShell>
    );
  }

  if (error || !event) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>{error ? "Error Loading Event" : "Event Not Found"}</ShadCNAlertTitle>
            <AlertDescription>{error || "The event you are looking for does not exist."}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/admin/events')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events List
          </Button>
        </main>
      </AppShell>
    );
  }
  
  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/events')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events List
        </Button>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader className="bg-muted/30 p-4 md:p-6 border-b">
            <CardTitle className="text-2xl font-headline">{event.title}</CardTitle>
            <CardDescription>Detailed view of the upcoming event.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            {event.imageUrl ? (
              <div className="relative aspect-[16/9] w-full rounded-md overflow-hidden border">
                <Image 
                    src={event.imageUrl} 
                    alt={event.title} 
                    layout="fill" 
                    objectFit="cover" 
                    data-ai-hint="event poster conference" 
                    priority
                />
              </div>
            ) : (
              <div className="aspect-[16/9] w-full rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                <CalendarDays className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Participants:
                  </div>
                  <p className="text-lg font-semibold text-foreground">{event.participantCount || 0}</p>
                </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="h-4 w-4 mr-2 text-primary" />
                Event Details:
              </div>
              <p className="text-foreground whitespace-pre-line text-sm leading-relaxed p-3 bg-muted/20 rounded-md border">
                {event.details}
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 p-4 md:p-6 border-t">
            <Button onClick={() => router.push(`/admin/events/edit/${eventId}`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Event
            </Button>
          </CardFooter>
        </Card>
      </main>
    </AppShell>
  )
}

