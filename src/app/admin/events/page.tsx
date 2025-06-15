
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
} from "@/components/ui/dropdown-menu";
import { CalendarDays, Search, PlusCircle, MoreHorizontal, Eye, AlertCircle } from "lucide-react";
import { getEvents, type EventData } from "@/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth(); // Get user from auth context

  React.useEffect(() => {
    async function fetchEventsData() {
      try {
        setLoading(true);
        setError(null);
        // Fetch events, order by eventDate ascending for upcoming first
        const fetchedEvents = await getEvents('asc'); 
        setEvents(fetchedEvents);
      } catch (e) {
        console.error("Failed to fetch events:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchEventsData();
  }, []);

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Skeleton key={i} className="h-16 w-full rounded-md" />
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium truncate max-w-[250px] md:max-w-none">{event.title}</TableCell>
                    <TableCell>{formatDisplayDate(event.eventDate)}</TableCell>
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
                          {/* Add Edit/Delete options here later if needed */}
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
    </AppShell>
  );
}

