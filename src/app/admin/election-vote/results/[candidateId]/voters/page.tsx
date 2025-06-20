
// src/app/admin/election-vote/results/[candidateId]/voters/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { getCandidateById, getVotersForCandidate, type ElectionCandidateData, type VoterInfo } from "@/services/electionCandidateService";
import { ArrowLeft, Users, Info, ServerCrash, Clock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

function formatDisplayDateTime(timestamp?: Timestamp): string {
  if (!timestamp) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(timestamp.toDate());
}

const getInitials = (name?: string | null): string => {
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function CandidateVotersListPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.candidateId as string;

  const [candidate, setCandidate] = React.useState<ElectionCandidateData | null>(null);
  const [voters, setVoters] = React.useState<VoterInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    if (candidateId) {
      async function fetchData() {
        setLoading(true);
        setError(null);
        try {
          const [fetchedCandidate, fetchedVoters] = await Promise.all([
            getCandidateById(candidateId),
            getVotersForCandidate(candidateId)
          ]);

          if (fetchedCandidate) {
            setCandidate(fetchedCandidate);
          } else {
            setError(`Candidate with ID ${candidateId} not found.`);
          }
          setVoters(fetchedVoters);
        } catch (e) {
          console.error("Failed to fetch candidate voters data:", e);
          setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }
  }, [candidateId]);

  const totalPages = Math.ceil(voters.length / ITEMS_PER_PAGE);
  const paginatedVoters = voters.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Skeleton className="h-10 w-40 mb-4" />
          <Card className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-7 w-3/5 mb-1" />
              <Skeleton className="h-5 w-2/5" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 border-b">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </AppShell>
    );
  }

  if (error || !candidate) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <ServerCrash className="h-4 w-4" />
            <ShadCNAlertTitle>{error ? "Error Loading Data" : "Candidate Not Found"}</ShadCNAlertTitle>
            <AlertDescription>{error || `The candidate data could not be loaded for ID: ${candidateId}.`}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/admin/election-vote/results')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Election Results
          </Button>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/election-vote/results')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Election Results
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="bg-muted/30 p-4 md:p-6 border-b">
            <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border">
                    <AvatarImage src={candidate.imageUrl || `https://placehold.co/60x60.png?text=${getInitials(candidate.name)}`} alt={candidate.name} data-ai-hint="person portrait"/>
                    <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-xl md:text-2xl font-headline">
                    Voters for: {candidate.name}
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base mt-1">
                    Symbol: {candidate.electionSymbol} | Total Votes: {candidate.voteCount}
                    </CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {voters.length === 0 ? (
              <Alert className="m-4">
                <Info className="h-4 w-4" />
                <ShadCNAlertTitle>No Voters Yet</ShadCNAlertTitle>
                <AlertDescription>This candidate has not received any votes yet.</AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead className="min-w-[200px]">Voter</TableHead>
                      <TableHead className="w-[120px]">Ward No.</TableHead>
                      <TableHead className="w-[180px]">Vote Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedVoters.map((voter, index) => (
                      <TableRow key={voter.userId}>
                        <TableCell className="text-xs">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={voter.userAvatarUrl || `https://placehold.co/40x40.png?text=${getInitials(voter.userName)}`} alt={voter.userName || 'Voter'} data-ai-hint="profile person"/>
                              <AvatarFallback>{getInitials(voter.userName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm truncate max-w-[150px]">{voter.userName}</p>
                              {voter.userMobileNumber && voter.userMobileNumber !== "N/A" && (
                                <p className="text-xs text-muted-foreground">{voter.userMobileNumber}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{voter.userWardNo || "N/A"}</TableCell>
                        <TableCell className="text-xs">{formatDisplayDateTime(voter.votedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          {totalPages > 1 && voters.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages} ({voters.length} total voters)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-3 w-3 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </AppShell>
  );
}

