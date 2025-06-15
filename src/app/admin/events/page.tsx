// src/app/admin/events/page.tsx
"use client";

import * as React from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CalendarDays, Search, PlusCircle, MoreHorizontal, Eye, Edit, Trash2, AlertCircle, Loader2, Users } from "lucide-react";
import { getEvents, deleteEvent, type EventData } from "@/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function formatDisplayDate(date: Timestamp | Date | undefined) {
  if (!date) return "N/A";
  const jsDate = date instanceof Timestamp ? date.toDate() : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(jsDate);
}

export default function ManageEventsPage() {
  const [events, setEvents] = React.useState<EventData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [eventToDelete, setEventToDelete] = React.useState<EventData | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchEventsData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedEvents = await getEvents('asc'); 
      setEvents(fetchedEvents);
    } catch (e) {
      console.error("Failed to fetch events:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEventsData();
  }, [fetchEventsData]);

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteConfirmation = (event: EventData) => {
    setEventToDelete(event);
  };

  const executeDeleteEvent = async () => {
    if (!eventToDelete || !eventToDelete.id) return;
    setIsDeleting(true);
    try {
      await deleteEvent(eventToDelete.id);
      toast({
        title: "Event Deleted",
        description: `Event "${eventToDelete.title}" has been successfully deleted.`,
      });
      setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
      setEventToDelete(null);
    } catch (e) {
      console.error("Failed to delete event:", e);
      toast({
        title: "Error Deleting Event",
        description: e instanceof Error ? e.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Manage Upcoming Events</h1>
              <p className="text-muted-foreground text-sm">
                Oversee all upcoming events, view details, and manage entries.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search events..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href="/admin/events/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Event
              </Link>
            </Button>
          </div>
        </div>

        {loading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-[minmax(250px,1fr)_150px_100px_100px] items-center gap-x-4 p-3 border-b border-border last:border-b-0 bg-card rounded-md">
                    <Skeleton className="h-4 w-3/4" /> {/* Title */}
                    <Skeleton className="h-4 w-full" /> {/* Date */}
                    <Skeleton className="h-4 w-12 justify-self-center" /> {/* Participants */}
                    <Skeleton className="h-6 w-8 rounded-md justify-self-end" /> {/* Actions */}
                </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>Error Fetching Events</ShadCNAlertTitle>
            <AlertDescription>
              {error}
              {(error.toLowerCase().includes("missing or insufficient permissions") || error.toUpperCase().includes("PERMISSION_DENIED")) && (
                <p className="mt-2 text-xs font-medium">
                  <strong>Suggestion:</strong> This error often indicates a problem with your Firestore security rules.
                  Please ensure that the user ({user?.email || 'current user'}) has
                  read permissions for the 'events' collection in your Firebase project.
                  You can refer to the `example.firestore.rules` file in your project root for guidance on rule structure.
                </p>
              )}
               {(error.toLowerCase().includes("query requires an index") || error.toLowerCase().includes("the query requires an index")) && (
                 <p className="mt-2 text-xs font-medium">
                   <strong>Suggestion:</strong> A Firestore index is required for this query. Please check the browser console for a link to create it in your Firebase console.
                 </p>
               )}
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && filteredEvents.length === 0 && (
          <Alert>
             <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>No Events Found</ShadCNAlertTitle>
            <AlertDescription>
              {searchTerm ? "No events match your search term." : "There are no events to display yet. Try creating one!"}
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && filteredEvents.length > 0 && (
          <div className="border rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px] md:w-[400px]">Event Title</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead className="text-center w-[120px]">Participants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium truncate max-w-[250px] md:max-w-none">{event.title}</TableCell>
                    <TableCell>{formatDisplayDate(event.eventDate)}</TableCell>
                    <TableCell className="text-center">
                      {event.id ? (
                         <Link href={`/admin/events/${event.id}/registrations`} className="text-primary hover:underline">
                          {event.participantCount || 0}
                         </Link>
                       ) : (
                         <span>{event.participantCount || 0}</span>
                       )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Event actions for {event.title}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => router.push(`/admin/events/view/${event.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => router.push(`/admin/events/edit/${event.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Event
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onSelect={() => handleDeleteConfirmation(event)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             <div className="p-4 text-sm text-muted-foreground">
              Showing {filteredEvents.length} event(s).
            </div>
          </div>
        )}
      </main>
      {eventToDelete && (
        <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this event?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the event
                <span className="font-semibold"> "{eventToDelete.title}"</span>.
                Any associated image will also be removed from storage.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setEventToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={executeDeleteEvent}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AppShell>
  );
}
