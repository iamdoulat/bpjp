
// src/app/election-vote/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { Gavel, PlusCircle, Settings, ListChecks, Info, Users, Vote as VoteIcon, Shield, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ManageElectionVotePage() {
  const router = useRouter();

  // Placeholder for actual candidates; replace with fetched data
  const presidentCandidates = [
    { id: "p1", name: "Candidate P-Alpha", symbol: "Eagle", imageUrl: "https://placehold.co/150x150.png?text=P1" },
    { id: "p2", name: "Candidate P-Beta", symbol: "Lion", imageUrl: "https://placehold.co/150x150.png?text=P2" },
  ];
  const secretaryCandidates = [
    { id: "s1", name: "Candidate S-Gamma", symbol: "Book", imageUrl: "https://placehold.co/150x150.png?text=S1" },
    { id: "s2", name: "Candidate S-Delta", symbol: "Star", imageUrl: "https://placehold.co/150x150.png?text=S2" },
  ];

  const handleVote = (candidateName: string, position: string) => {
    alert(`Voted for ${candidateName} for ${position}. (Voting functionality under development)`);
    // Later, integrate with a real voting service
  };

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Gavel className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Election & Voting Portal</h1>
              <p className="text-muted-foreground text-sm">
                Participate in organizational elections by casting your vote.
              </p>
            </div>
          </div>
          {/* Removed "Create New Election" button to focus on voting for now */}
        </div>

        {/* Candidate Nomination Sections */}
        <section className="space-y-8 mt-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-7 w-7 text-green-600" />
              <h2 className="text-xl font-headline font-semibold text-foreground">President Candidate Nominations</h2>
            </div>
            {presidentCandidates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {presidentCandidates.map((candidate) => (
                  <Card key={candidate.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                    <CardHeader className="items-center text-center">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50 mb-3">
                        <img src={candidate.imageUrl} alt={candidate.name} className="object-cover w-full h-full" data-ai-hint="person portrait" />
                      </div>
                      <CardTitle className="text-lg">{candidate.name}</CardTitle>
                      <CardDescription>Symbol: {candidate.symbol}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-end justify-center p-4">
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-base py-3"
                        onClick={() => handleVote(candidate.name, "President")}
                      >
                        <VoteIcon className="mr-2 h-5 w-5" /> Vote
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <ShadCNAlertTitle>No President Candidates</ShadCNAlertTitle>
                <AlertDescription>President candidate nominations are not yet available.</AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-7 w-7 text-green-600" />
              <h2 className="text-xl font-headline font-semibold text-foreground">General Secretary Candidate Nominations</h2>
            </div>
            {secretaryCandidates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {secretaryCandidates.map((candidate) => (
                  <Card key={candidate.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                     <CardHeader className="items-center text-center">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50 mb-3">
                        <img src={candidate.imageUrl} alt={candidate.name} className="object-cover w-full h-full" data-ai-hint="person portrait" />
                      </div>
                      <CardTitle className="text-lg">{candidate.name}</CardTitle>
                      <CardDescription>Symbol: {candidate.symbol}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-end justify-center p-4">
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-base py-3"
                        onClick={() => handleVote(candidate.name, "General Secretary")}
                      >
                         <VoteIcon className="mr-2 h-5 w-5" /> Vote
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <ShadCNAlertTitle>No General Secretary Candidates</ShadCNAlertTitle>
                <AlertDescription>General Secretary candidate nominations are not yet available.</AlertDescription>
              </Alert>
            )}
          </div>
        </section>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 pt-6 border-t">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Election Configuration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                View election periods, defined positions, and voting rules (Admin Only).
              </CardDescription>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/admin/election-vote")}>
                Go to Admin Panel
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Candidate Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage candidate nominations, applications, and approvals (Admin Only).
              </CardDescription>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/admin/election-vote/candidate-management")}>
                Manage Candidates
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Voting Results</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor voting progress and view final election results (Admin Only).
              </CardDescription>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/admin/election-vote")}>
                 View Results
              </Button>
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-8">
            <Info className="h-4 w-4" />
            <ShadCNAlertTitle>Feature Under Development</ShadCNAlertTitle>
            <AlertDescription>
                The full election and voting process, including secure vote casting and result tallying, is currently under development.
                The candidate lists and vote buttons above are for demonstration purposes.
            </AlertDescription>
        </Alert>

      </main>
    </AppShell>
  );
}

    