// src/components/landing/MissionSection.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getMissionData, type MissionData } from '@/services/missionService';
import { Target } from 'lucide-react';

export function MissionSection() {
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMission() {
      setLoading(true);
      try {
        const data = await getMissionData();
        setMissionData(data);
      } catch (e) {
        console.error("Failed to fetch mission data for landing page:", e);
        setMissionData({ title: "Our Mission", content: "Could not load mission content." });
      } finally {
        setLoading(false);
      }
    }
    fetchMission();
  }, []);

  return (
    <section id="mission" className="py-5 bg-card">
      <div className="container">
        <Card className="w-full border-2 border-primary/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center mb-4">
                <Target className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold sm:text-4xl">
                {loading ? <Skeleton className="h-9 w-48 mx-auto" /> : missionData?.title || "Our Mission"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground md:text-lg">
            {loading ? (
              <div className="space-y-2 max-w-2xl mx-auto">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <p className="max-w-3xl mx-auto">
                {missionData?.content ? (
                  <span dangerouslySetInnerHTML={{ __html: missionData.content.replace(/\n/g, '<br />') }} />
                ) : (
                  "Our mission content has not been set yet."
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
