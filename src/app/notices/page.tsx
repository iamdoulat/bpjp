// src/app/notices/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText as NoticeIcon, ServerCrash, Search, Link as LinkIcon, Megaphone } from "lucide-react";
import { getNotices, type NoticeData } from "@/services/noticeService";
import { Timestamp } from "firebase/firestore";
import { useAppContext } from "@/contexts/AppContext"; // Import the App Context

function formatDisplayDate(date: Timestamp | Date | undefined) {
  if (!date) return "N/A";
  const jsDate = date instanceof Timestamp ? date.toDate() : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(jsDate);
}

export default function NoticesPage() {
  const [notices, setNotices] = React.useState<NoticeData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { organizationSettings, isLoadingAppSettings } = useAppContext(); // Get settings from context

  React.useEffect(() => {
    async function fetchActiveNotices() {
      setLoading(true);
      setError(null);
      try {
        const activeNotices = await getNotices(true); // Fetch only active notices
        setNotices(activeNotices);
      } catch (e) {
        console.error("Failed to fetch notices:", e);
        setError(e instanceof Error ? e.message : "Could not load notices.");
      } finally {
        setLoading(false);
      }
    }
    fetchActiveNotices();
  }, []);

  const isLoadingPage = loading || isLoadingAppSettings;
  const alertText = organizationSettings?.importantAlert;

  if (isLoadingPage) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-24 w-full" /> {/* Skeleton for alert */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <NoticeCardSkeleton key={i} />)}
          </div>
        </main>
      </AppShell>
    );
  }

  if (error) {
     return (
        <AppShell>
            <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
                 <Alert variant="destructive" className="max-w-lg">
                    <ServerCrash className="h-5 w-5" />
                    <ShadCNAlertTitle>Error Loading Notices</ShadCNAlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </main>
        </AppShell>
     )
  }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 overflow-auto pb-20 md:pb-8">
        <div className="flex items-center gap-3 mb-4">
          <NoticeIcon className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-headline font-bold">নোটিশ</h1>
            <p className="text-muted-foreground text-md">গুরুত্বপূর্ণ ঘোষণা ও আপডেটসমূহ।</p>
          </div>
        </div>

        {alertText && (
          <Alert className="bg-primary/10 border-primary/20">
            <Megaphone className="h-5 w-5 text-primary" />
            <ShadCNAlertTitle className="font-semibold text-primary">Important Alert</ShadCNAlertTitle>
            <AlertDescription>
              <div
                className="prose prose-sm dark:prose-invert max-w-none [&_strong]:text-primary"
                dangerouslySetInnerHTML={{ __html: alertText }}
              />
            </AlertDescription>
          </Alert>
        )}

        {notices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {notices.map(notice => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>
        ) : (
          <Alert>
            <Search className="h-4 w-4" />
            <ShadCNAlertTitle>No Active Notices</ShadCNAlertTitle>
            <AlertDescription>There are currently no active notices to display. Please check back later.</AlertDescription>
          </Alert>
        )}
      </main>
    </AppShell>
  );
}

function NoticeCardSkeleton() {
  return (
    <Card className="flex flex-col h-full shadow-md overflow-hidden rounded-lg">
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-1" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
       <Skeleton className="aspect-video w-full" />
      <CardContent className="flex-grow pt-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-24" />
      </CardFooter>
    </Card>
  );
}

interface NoticeCardProps {
  notice: NoticeData;
}

function NoticeCard({ notice }: NoticeCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden rounded-lg">
      <CardHeader>
        <CardTitle className="font-headline text-lg leading-tight truncate">{notice.title}</CardTitle>
        <CardDescription className="text-xs">{formatDisplayDate(notice.lastUpdated)}</CardDescription>
      </CardHeader>
      {notice.imageUrl && (
        <div className="relative aspect-video w-full bg-muted">
          <Image
            src={notice.imageUrl}
            alt={notice.title}
            layout="fill"
            objectFit="cover"
            data-ai-hint="notice announcement"
          />
        </div>
      )}
      <CardContent className="flex-grow pt-4">
        <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{notice.content}</p>
      </CardContent>
      {notice.link && (
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={notice.link} target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="mr-2 h-4 w-4" /> Learn More
              </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
