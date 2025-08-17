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
    <section id="mission" className="bg-card">
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
              <div className="max-w-3xl mx-auto text-left space-y-4">
                <p>
                  আমরা বিশ্বাস করি—মানুষ মানুষের জন্য। মানবতার মহান ব্রত নিয়ে আমরা এগিয়ে চলেছি সমাজের অসহায়, দুঃস্থ ও সুবিধাবঞ্চিত মানুষের পাশে দাঁড়ানোর প্রত্যয়ে। আমাদের এই ক্ষুদ্র প্রয়াসের মাধ্যমে আমরা প্রবাসীদের সহযোগিতায় গড়ে তুলতে চাই একটি মানবিক সমাজ, যেখানে বিপদে-আপদে আমরা একে অপরের সহায় হই।
                </p>
                <p className="font-semibold text-foreground">
                  আসুন, একসাথে কাজ করি সুন্দর আগামীর জন্য।
                </p>
                <h3 className="text-xl font-bold text-foreground pt-4">আমাদের কার্যক্রম</h3>
                <p>
                  ভূজপুর প্রবাসী যুব কল্যাণ পরিষদ (Bhujpur Probashi Jubokallan Porisod) হলো ভূজপুর এলাকার একটি প্রবাসী যুব সংগঠন। এটি ২০১৮ সালে প্রতিষ্ঠিত হয় এবং বিভিন্ন মানবিক কাজে সহায়তা প্রদান করে আসছে, যেমন বিবাহ, শিক্ষা, চিকিৎসা, বন্যা ও দুর্যোগ মোকাবিলা।
                </p>
                <ul className="list-disc list-inside space-y-2">
                    <li>বিয়ে, শিক্ষা, চিকিৎসা এবং দুর্যোগ মোকাবিলায় সহায়তা করা।</li>
                    <li>দরিদ্র ও অসহায় মানুষের মাঝে ত্রাণ সামগ্রী, নগদ অর্থ, শীতবস্ত্র, ও ঈদ বস্ত্র বিতরণ করা।</li>
                    <li>ভূজপুর এলাকার উন্নয়নে বিভিন্ন কার্যক্রম পরিচালনা করা।</li>
                </ul>
                <p>
                  বছরব্যাপী এ সংগঠনের কর্মসূচীর মধ্যে রমজান মাসে ইফতার সামগ্রী, ঈদে ঈদ বস্ত্র, শীতে শীত বস্ত্র, বন্যার সময় জরুরী ত্রাণ সামগ্রী বিতরণ সহ অসহায় অসুস্থ মানুষদের অনুদান, গৃহহীন মানুষের ঘর নির্মাণ, এবং করোনার সময় ফ্রি অক্সিজেন সাপ্লাই ও খাদ্য সামগ্রী বিতরণ উল্লেখযোগ্য।
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
