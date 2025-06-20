
// src/app/election-vote/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // For results display
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // For results display
import { Gavel, ListChecks, Info, Shield, Award, Vote as VoteIcon, CheckCircle2, Loader2, UserX, AlertTriangle, CheckIcon, BarChart3 } from "lucide-react"; // Added BarChart3
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getCandidatesByPosition, recordVote, getUserVotes, type ElectionCandidateData, type CandidatePosition, type UserVoteData } from "@/services/electionCandidateService";
import { getElectionControlSettings, type ElectionControlSettings } from "@/services/electionControlService"; // Import election control

// Helper function moved to module scope
const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : "C";

interface CandidateCardProps {
  candidate: ElectionCandidateData;
  onVote: (candidateId: string, candidateName: string, position: CandidatePosition) => void;
  isVotedForThisCandidate: boolean;
  canVoteForPosition: boolean;
  isVoting: boolean;
  isLoggedIn: boolean;
  votingClosed: boolean;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onVote, isVotedForThisCandidate, canVoteForPosition, isVoting, isLoggedIn, votingClosed }) => {
  // getInitials is now accessible from module scope, no need to redefine here.

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow flex flex-col", isVotedForThisCandidate && "border-2 border-green-500 ring-2 ring-green-500/50")}>
      <CardHeader className="items-center text-center">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50 mb-3 shadow-md">
          <Image
            src={candidate.imageUrl || `https://placehold.co/150x150.png?text=${getInitials(candidate.name)}`}
            alt={candidate.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint="person portrait"
          />
        </div>
        <CardTitle className="text-lg">{candidate.name}</CardTitle>
        <CardDescription>Symbol: {candidate.electionSymbol}</CardDescription>
        {isVotedForThisCandidate && (
          <div className="flex items-center justify-center text-sm text-green-600 mt-1">
            <CheckIcon className="h-4 w-4 mr-1" />
            Your vote has been Recorded
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow flex items-end justify-center p-4">
        <Button
          className={cn(
            "w-full font-bold text-base py-3",
            isVotedForThisCandidate ? "bg-green-600 hover:bg-green-700 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
          onClick={() => onVote(candidate.id, candidate.name, candidate.position)}
          disabled={!isLoggedIn || isVotedForThisCandidate || !canVoteForPosition || isVoting || votingClosed}
        >
          {isVoting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : isVotedForThisCandidate ? <CheckCircle2 className="mr-2 h-5 w-5" /> : <VoteIcon className="mr-2 h-5 w-5" />}
          {isVoting ? "Voting..." : isVotedForThisCandidate ? "Voted" : votingClosed ? "Voting Closed" : "Vote"}
        </Button>
      </CardContent>
    </Card>
  );
};

const CandidateCardSkeleton = () => (
  <Card className="shadow-lg flex flex-col">
    <CardHeader className="items-center text-center">
      <Skeleton className="w-24 h-24 rounded-full mb-3" />
      <Skeleton className="h-5 w-3/4 mb-1" />
      <Skeleton className="h-4 w-1/2 mb-1" />
    </CardHeader>
    <CardContent className="flex-grow flex items-end justify-center p-4">
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);

interface CandidateResult extends ElectionCandidateData { // For results display
  percentageOfTotalVotes?: number;
}

export default function ElectionVotePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [presidentCandidates, setPresidentCandidates] = React.useState<ElectionCandidateData[]>([]);
  const [secretaryCandidates, setSecretaryCandidates] = React.useState<ElectionCandidateData[]>([]);
  const [loadingCandidates, setLoadingCandidates] = React.useState(true);
  const [errorCandidates, setErrorCandidates] = React.useState<string | null>(null);

  const [userVotes, setUserVotes] = React.useState<UserVoteData | null>(null);
  const [loadingUserVotes, setLoadingUserVotes] = React.useState(true);
  const [userVotesError, setUserVotesError] = React.useState<string | null>(null);

  const [isVotingState, setIsVotingState] = React.useState<{ [candidateId: string]: boolean }>({});

  const [electionSettings, setElectionSettings] = React.useState<ElectionControlSettings>({ resultsPublished: false, votingClosed: false });
  const [loadingElectionSettings, setLoadingElectionSettings] = React.useState(true);

  // States for displaying public results
  const [publicPresidentResults, setPublicPresidentResults] = React.useState<CandidateResult[]>([]);
  const [publicSecretaryResults, setPublicSecretaryResults] = React.useState<CandidateResult[]>([]);


  React.useEffect(() => {
    async function fetchData() {
      setLoadingCandidates(true);
      setLoadingElectionSettings(true);
      setErrorCandidates(null);
      try {
        const [pres, sec, settings] = await Promise.all([
          getCandidatesByPosition("President"),
          getCandidatesByPosition("GeneralSecretary"),
          getElectionControlSettings()
        ]);
        setPresidentCandidates(pres);
        setSecretaryCandidates(sec);
        setElectionSettings(settings);

        if (settings.resultsPublished) {
          // Process and set results for public display
          const processResults = (candidates: ElectionCandidateData[]): CandidateResult[] => {
            const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);
            return candidates
              .map(c => ({ ...c, percentageOfTotalVotes: totalVotes > 0 ? ((c.voteCount || 0) / totalVotes) * 100 : 0 }))
              .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
          };
          setPublicPresidentResults(processResults(pres));
          setPublicSecretaryResults(processResults(sec));
        }

      } catch (e) {
        console.error("Failed to fetch initial data:", e);
        setErrorCandidates(e instanceof Error ? e.message : "Could not load election data.");
      } finally {
        setLoadingCandidates(false);
        setLoadingElectionSettings(false);
      }
    }
    fetchData();
  }, []);

  React.useEffect(() => {
    if (user && !authLoading) {
      setLoadingUserVotes(true);
      setUserVotesError(null);
      getUserVotes(user.uid)
        .then(votes => setUserVotes(votes))
        .catch(err => {
          console.error("Error fetching user votes:", err);
          let detailedErrorMessage = "An unknown error occurred while fetching your vote status.";
          if (err instanceof Error) {
            detailedErrorMessage = err.message;
             if (err.message.includes("permission denied")) {
                detailedErrorMessage = `Failed to fetch user votes: Firestore permission denied for 'electionVotes/${user.uid}'. Please check security rules.`;
            }
          }
          setUserVotesError(detailedErrorMessage);
        })
        .finally(() => setLoadingUserVotes(false));
    } else if (!user && !authLoading) {
      setLoadingUserVotes(false);
      setUserVotes(null);
      setUserVotesError(null);
    }
  }, [user, authLoading]);

  const handleVote = async (candidateId: string, candidateName: string, position: CandidatePosition) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to cast your vote.", variant: "destructive" });
      router.push("/login");
      return;
    }
    if (isVotingState[candidateId]) return;

    if (electionSettings.votingClosed) {
      toast({ title: "Voting Closed", description: "Voting time end. Sorry you are late.", variant: "destructive"});
      return;
    }

    setIsVotingState(prev => ({ ...prev, [candidateId]: true }));

    try {
      await recordVote(user.uid, candidateId, candidateName, position);
      toast({ title: "Vote Cast!", description: `Your vote for ${candidateName} as ${position} has been recorded.`, variant: "default" });

      setUserVotes(prev => ({
        ...(prev || { userId: user.uid }),
        [position === 'President' ? 'presidentCandidateId' : 'generalSecretaryCandidateId']: candidateId,
      }));

       const updateLocalCandidates = (prevCandidates: ElectionCandidateData[]) =>
         prevCandidates.map(c => c.id === candidateId ? { ...c, voteCount: (c.voteCount || 0) + 1 } : c);

       if (position === 'President') {
         setPresidentCandidates(updateLocalCandidates);
       } else {
         setSecretaryCandidates(updateLocalCandidates);
       }

    } catch (e) {
      console.error("Voting failed:", e);
      let voteErrorMessage = "Could not record your vote.";
      if (e instanceof Error) {
        voteErrorMessage = e.message;
      }
      toast({ title: "Voting Failed", description: voteErrorMessage, variant: "destructive" });
    } finally {
      setIsVotingState(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const isLoadingPage = loadingCandidates || authLoading || loadingUserVotes || loadingElectionSettings;

  const renderCandidateSection = (
    title: string,
    candidates: ElectionCandidateData[],
    position: CandidatePosition,
    icon: React.ElementType
  ) => {
    const IconComponent = icon;
    const votedCandidateIdInPosition = position === 'President' ? userVotes?.presidentCandidateId : userVotes?.generalSecretaryCandidateId;
    const canVoteForPosition = !votedCandidateIdInPosition;

    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <IconComponent className="h-7 w-7 text-green-600" />
          <h2 className="text-xl font-headline font-semibold text-foreground">{title}</h2>
        </div>
        {loadingCandidates ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(2)].map((_, i) => <CandidateCardSkeleton key={`${title}-skeleton-${i}`} />)}
          </div>
        ) : errorCandidates ? (
          <Alert variant="destructive"><ShadCNAlertTitle>Error Loading Candidates</ShadCNAlertTitle><AlertDescription>{errorCandidates}</AlertDescription></Alert>
        ) : candidates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onVote={handleVote}
                isVotedForThisCandidate={candidate.id === votedCandidateIdInPosition}
                canVoteForPosition={canVoteForPosition}
                isVoting={isVotingState[candidate.id] || false}
                isLoggedIn={!!user}
                votingClosed={electionSettings.votingClosed} // Pass votingClosed status
              />
            ))}
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <ShadCNAlertTitle>No {position} Candidates</ShadCNAlertTitle>
            <AlertDescription>{position} candidate nominations are not yet available.</AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const PublicResultTable = ({ title, results, icon: Icon }: { title: string; results: CandidateResult[]; icon: React.ElementType }) => (
    <Card className="shadow-md mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">{title} Results</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {results.length === 0 && (
          <Alert>
            <ShadCNAlertTitle>No Results Available</ShadCNAlertTitle>
            <AlertDescription>No candidates or votes recorded for this position yet.</AlertDescription>
          </Alert>
        )}
        {results.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">Rank</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead className="text-center">Symbol</TableHead>
                <TableHead className="text-right">Votes</TableHead>
                <TableHead className="text-right w-[100px]">Vote %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((candidate, index) => (
                <TableRow key={candidate.id} className={cn(index === 0 && "bg-green-500/10 hover:bg-green-500/20")}>
                  <TableCell className="text-center font-medium">
                    {index + 1}
                    {index === 0 && <span className="ml-1">🏆</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={candidate.imageUrl || `https://placehold.co/40x40.png?text=${getInitials(candidate.name)}`} alt={candidate.name} data-ai-hint="person portrait"/>
                        <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{candidate.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">{candidate.electionSymbol}</TableCell>
                  <TableCell className="text-right font-semibold">{candidate.voteCount || 0}</TableCell>
                  <TableCell className="text-right">{candidate.percentageOfTotalVotes?.toFixed(1) || "0.0"}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
  
  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Gavel className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Election &amp; Voting Portal</h1>
              <p className="text-muted-foreground text-sm">
                Participate in organizational elections by casting your vote.
              </p>
            </div>
          </div>
        </div>

        {userVotesError && !loadingUserVotes && (
          <Alert variant="destructive" className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <ShadCNAlertTitle>Error Loading Your Vote Status</ShadCNAlertTitle>
            <AlertDescription>
              {userVotesError}
            </AlertDescription>
          </Alert>
        )}
        
        {!user && !isLoadingPage && (
          <Alert variant="default" className="mt-6">
             <UserX className="h-4 w-4"/>
            <ShadCNAlertTitle>Login to Vote</ShadCNAlertTitle>
            <AlertDescription>
                You must be logged in to cast your vote. Please <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/login')}>login</Button> or <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/signup')}>sign up</Button>.
            </AlertDescription>
          </Alert>
        )}

        {electionSettings.votingClosed && !electionSettings.resultsPublished && !isLoadingPage && (
             <Alert variant="destructive" className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <ShadCNAlertTitle>Voting Has Closed</ShadCNAlertTitle>
                <AlertDescription>
                    The voting period for this election has ended. Results are not yet public.
                </AlertDescription>
            </Alert>
        )}

        {!electionSettings.votingClosed && (
             <section className="space-y-8 mt-8">
                {renderCandidateSection("President Candidate Nominations", presidentCandidates, "President", Shield)}
                {renderCandidateSection("General Secretary Candidate Nominations", secretaryCandidates, "GeneralSecretary", Award)}
            </section>
        )}
        
        {electionSettings.resultsPublished && !isLoadingPage && (
          <section className="mt-12 pt-8 border-t">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-2xl font-headline font-semibold">Official Election Results</h2>
                <p className="text-muted-foreground text-sm">
                  The voting period has ended. Here are the official results.
                </p>
              </div>
            </div>
            <div className="space-y-8">
              <PublicResultTable title="President" results={publicPresidentResults} icon={Shield} />
              <PublicResultTable title="General Secretary" results={publicSecretaryResults} icon={Award} />
            </div>
          </section>
        )}

      </main>
    </AppShell>
  );
}

