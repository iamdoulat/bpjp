
// src/app/admin/events/[eventId]/registrations/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { getEventById, getEventRegistrationsWithDetails, type EventData, type EnrichedEventRegistrationData } from '@/services/eventService';
import { Loader2, AlertCircle, ArrowLeft, Users, CalendarDays, Mail, Phone, MapPin, Download } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ITEMS_PER_PAGE = 20;

function formatDisplayDateTime(date: Timestamp | Date | undefined, forPDF: boolean = false): string {
  if (!date) return "N/A";
  const jsDate = date instanceof Timestamp ? date.toDate() : date;
  if (forPDF) {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(jsDate);
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(jsDate);
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return "U";
}


export default function EventRegistrationsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = React.useState<EventData | null>(null);
  const [registrations, setRegistrations] = React.useState<EnrichedEventRegistrationData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    if (eventId) {
      async function fetchData() {
        setIsLoading(true);
        setError(null);
        try {
          const [fetchedEvent, fetchedRegistrations] = await Promise.all([
            getEventById(eventId),
            getEventRegistrationsWithDetails(eventId)
          ]);

          if (fetchedEvent) {
            setEvent(fetchedEvent);
          } else {
            setError("Event not found.");
          }
          setRegistrations(fetchedRegistrations);
        } catch (e) {
          console.error("Failed to fetch event or registration data:", e);
          setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
          setIsLoading(false);
        }
      }
      fetchData();
    }
  }, [eventId]);
  
  const totalPages = Math.ceil(registrations.length / ITEMS_PER_PAGE);
  const paginatedRegistrations = registrations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDownloadPdf = () => {
    if (!event || registrations.length === 0) return;

    const doc = new jsPDF();
    const tableColumn = ["#", "Participant Name", "Email", "Registered At", "Mobile No.", "Ward No."];
    const tableRows: (string | null | undefined)[][] = [];

    registrations.forEach((reg, index) => {
      const rowData = [
        (index + 1).toString(),
        reg.name,
        reg.userEmail || "N/A",
        formatDisplayDateTime(reg.registeredAt, true),
        reg.mobileNumber,
        reg.wardNo,
      ];
      tableRows.push(rowData);
    });

    doc.setFontSize(18);
    doc.text(`Registered Participants: ${event.title}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Event Date: ${formatDisplayDateTime(event.eventDate, true)} | Total Registered: ${event.participantCount}`, 14, 30);

    (doc as any).autoTable({
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] }, // Example primary color
      styles: { fontSize: 8 },
    });
    
    doc.setFontSize(10);
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
    }

    doc.save(`event_${eventId}_participants.pdf`);
  };


  if (isLoading) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Button variant="outline" size="sm" className="mb-4" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
          </Button>
          <Card className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-7 w-3/4 mb-1" />
              <Skeleton className="h-5 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-3 border-b">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/5" />
                  </div>
                ))}
              </div>
            </CardContent>
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
            <ShadCNAlertTitle>{error ? "Error Loading Data" : "Event Not Found"}</ShadCNAlertTitle>
            <AlertDescription>{error || "The event data could not be loaded."}</AlertDescription>
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

        <Card className="shadow-lg">
          <CardHeader className="bg-muted/30 p-4 md:p-6 border-b">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-xl md:text-2xl font-headline">
                  Registered Participants for: {event.title}
                </CardTitle>
                <CardDescription className="text-sm md:text-base mt-1">
                  Event Date: {formatDisplayDateTime(event.eventDate)} | Total Registered: {event.participantCount}
                </CardDescription>
              </div>
              <Button onClick={handleDownloadPdf} variant="outline" size="sm" disabled={registrations.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {registrations.length === 0 ? (
              <Alert className="m-4">
                <Users className="h-4 w-4" />
                <ShadCNAlertTitle>No Participants Yet</ShadCNAlertTitle>
                <AlertDescription>No one has registered for this event yet.</AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead className="min-w-[250px]">Participant</TableHead>
                      <TableHead>Registered At</TableHead>
                      <TableHead>Mobile No.</TableHead>
                      <TableHead>Ward No.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRegistrations.map((reg, index) => (
                      <TableRow key={reg.id || reg.userId}>
                        <TableCell className="text-xs">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage 
                                src={reg.userProfileAvatarUrl || `https://placehold.co/40x40.png?text=${getInitials(reg.name, reg.userEmail)}`} 
                                alt={reg.name} 
                                data-ai-hint="profile person"
                              />
                              <AvatarFallback>{getInitials(reg.name, reg.userEmail)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium truncate block text-sm">{reg.name}</span>
                              {reg.userEmail && <span className="text-xs text-muted-foreground block truncate max-w-[180px]">{reg.userEmail}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{formatDisplayDateTime(reg.registeredAt)}</TableCell>
                        <TableCell className="text-xs">{reg.mobileNumber}</TableCell>
                        <TableCell className="text-xs">{reg.wardNo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
           {totalPages > 1 && registrations.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages} ({registrations.length} total registrations)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </AppShell>
  );
}

