
// src/app/our-mission/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { getMissionData, type MissionData } from "@/services/missionService";
import { Target, AlertCircle } from "lucide-react";

export default function OurMissionPage() {
  const [missionData, setMissionData] = React.useState<MissionData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchMission() {
      setLoading(true);
      setError(null);
      try {
        const data = await getMissionData();
        setMissionData(data);
      } catch (e) {
        console.error("Failed to fetch mission data:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
        // Set default mission data on error to avoid null state issues
        setMissionData({ 
            title: "Error Loading Mission", 
            content: "Could not retrieve mission content. Please try again later.",
            id: "errorState"
        });
      } finally {
        setLoading(false);
      }
    }
    fetchMission();
  }, []);

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 overflow-auto pb-20 md:pb-8">
        <div className="flex items-center gap-3 mb-4">
          <Target className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-headline font-bold">
              {loading ? <Skeleton className="h-8 w-48" /> : missionData?.title || "Our Mission"}
            </h1>
            <p className="text-muted-foreground text-md">
            আমাদের সংস্থাকে চালিত করা মূল মূল্যবোধ এবং উদ্দেশ্যগুলো আবিষ্কার করুন।
            </p>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">
              {loading ? <Skeleton className="h-7 w-1/2" /> : missionData?.title || "Mission Statement"}
            </CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full mt-4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <ShadCNAlertTitle>Error</ShadCNAlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : missionData?.content ? (
              // Ensure content is sanitized if it's HTML from a rich text editor
              // For now, assuming content is safe or plain text.
              <div dangerouslySetInnerHTML={{ __html: missionData.content.replace(/\n/g, '<br />') }} />
            ) : (
              <p>The mission content has not been set yet. Please check back later.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
