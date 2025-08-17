// src/components/landing/AdvisoryBoardSection.tsx
"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAdvisoryBoardMembers, type AdvisoryBoardMemberData } from '@/services/advisoryBoardService';
import { Users } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AdvisoryBoardSection() {
  const [members, setMembers] = useState<AdvisoryBoardMemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdvisoryBoardMembers();
        setMembers(data);
      } catch (e) {
        console.error("Failed to fetch advisory board data:", e);
        setError(e instanceof Error ? e.message : "Could not load advisory board members.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <section id="advisory-board" className="py-5 bg-card">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="inline-block rounded-lg bg-green-600 text-white px-3 py-1 text-3xl font-bold">Advisory Board</div>
            <span className="text-3xl font-bold">-</span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-black dark:text-foreground">Guiding Our Path</h2>
          </div>
          <p className="mt-4 text-lg text-black dark:text-muted-foreground">
            Meet the experienced leaders providing strategic advice and direction to our organization.
          </p>
        </div>
        <div className="mt-12">
          {loading ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(5)].map((_, i) => <MemberCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Error Loading Members</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : members.length > 0 ? (
             <Carousel opts={{ align: "start", loop: members.length > 4 }} className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-5xl mx-auto">
              <CarouselContent className="-ml-4">
                {members.map((member) => (
                  <CarouselItem key={member.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <div className="p-1 h-full">
                      <MemberCard member={member} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {members.length > 1 && (
                <>
                  <CarouselPrevious className="absolute left-[-15px] sm:left-[-25px] top-1/2 -translate-y-1/2 hidden md:flex" />
                  <CarouselNext className="absolute right-[-15px] sm:right-[-25px] top-1/2 -translate-y-1/2 hidden md:flex" />
                </>
              )}
            </Carousel>
          ) : (
             <Alert>
              <AlertTitle>No Members Found</AlertTitle>
              <AlertDescription>Advisory board members will be listed here soon.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </section>
  );
}


function MemberCard({ member }: { member: AdvisoryBoardMemberData }) {
  return (
    <Card className="shadow-md h-full flex flex-col bg-background hover:shadow-lg transition-shadow">
      <CardContent className="flex flex-col items-center justify-start p-6 flex-grow">
        <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40 shadow-sm">
          <Image
            src={member.imageUrl || `https://placehold.co/150x150.png?text=${member.name ? member.name.charAt(0) : 'A'}`}
            alt={member.name || 'Advisory Member'}
            layout="fill"
            objectFit="cover"
            data-ai-hint="person portrait"
          />
        </div>
        <p className="text-lg font-semibold text-center text-black dark:text-foreground">{member.name}</p>
        <p className="text-sm text-center mt-1 text-black dark:text-muted-foreground">{member.title}</p>
      </CardContent>
    </Card>
  );
}

function MemberCardSkeleton() {
    return (
        <Card className="shadow-md h-full flex flex-col bg-background">
            <CardContent className="flex flex-col items-center justify-start p-6 flex-grow">
                <Skeleton className="w-28 h-28 mb-4 rounded-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
            </CardContent>
        </Card>
    );
}
