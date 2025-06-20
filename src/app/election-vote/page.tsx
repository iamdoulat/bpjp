
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
import { Gavel, ListChecks, Info, Shield, Award, Vote as VoteIcon, CheckCircle2, Loader2, UserX, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getCandidatesByPosition, recordVote, getUserVotes, type ElectionCandidateData, type CandidatePosition, type UserVoteData } from "@/services/electionCandidateService";

interface CandidateCardProps {
  candidate: ElectionCandidateData;
  onVote: (candidateId: string, candidateName: string, position: CandidatePosition) => void;
  isVotedFor: boolean;
  canVote: boolean;
  isVoting: boolean;
  isLoggedIn: boolean;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onVote, isVotedFor, canVote, isVoting, isLoggedIn }) => {
  const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : "C";

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow flex flex-col", isVotedFor && "border-2 border-green-500 ring-2 ring-green-500/50")}>
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
        <CardDescription className="text-xs">Votes: {candidate.voteCount || 0}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-end justify-center p-4">
        <Button
          className={cn(
            "w-full font-bold text-base py-3",
            isVotedFor ? "bg-green-600 hover:bg-green-700 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
          onClick={() => onVote(candidate.id, candidate.name, candidate.position)}
          disabled={!isLoggedIn || isVotedFor || !canVote || isVoting}
        >
          {isVoting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : isVotedFor ? <CheckCircle2 className="mr-2 h-5 w-5" /> : <VoteIcon className="mr-2 h-5 w-5" />}
          {isVoting ? "Voting..." : isVotedFor ? "Voted" : "Vote"}
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
      <Skeleton className="h-3 w-1/4" />
    </CardHeader>
    <CardContent className="flex-grow flex items-end justify-center p-4">
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);

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

  React.useEffect(() => {
    async function fetchData() {
      setLoadingCandidates(true);
      setErrorCandidates(null);
      try {
        const [pres, sec] = await Promise.all([
          getCandidatesByPosition("President"),
          getCandidatesByPosition("GeneralSecretary")
        ]);
        setPresidentCandidates(pres);
        setSecretaryCandidates(sec);
      } catch (e) {
        console.error("Failed to fetch candidates:", e);
        setErrorCandidates(e instanceof Error ? e.message : "Could not load candidates.");
      } finally {
        setLoadingCandidates(false);
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
      toast({ title: "Voting Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsVotingState(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const isLoadingPage = loadingCandidates || authLoading || loadingUserVotes;

  const renderCandidateSection = (
    title: string,
    candidates: ElectionCandidateData[],
    position: CandidatePosition,
    icon: React.ElementType
  ) => {
    const IconComponent = icon;
    const votedCandidateId = position === 'President' ? userVotes?.presidentCandidateId : userVotes?.generalSecretaryCandidateId;
    const canVoteForPosition = !votedCandidateId;

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
                isVotedFor={candidate.id === votedCandidateId}
                canVote={canVoteForPosition}
                isVoting={isVotingState[candidate.id] || false}
                isLoggedIn={!!user}
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
  
  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Gavel className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Election & Voting Portal</h1>
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
              {(userVotesError.includes("permission denied") || userVotesError.includes("PERMISSION_DENIED")) && (
                <p className="mt-2 text-xs font-medium">
                  This might be due to a permission issue. Please ensure your Firestore security rules allow you to read your own vote document from the &apos;electionVotes&apos; collection (e.g., `match /electionVotes/{'{userId}'} {'{ allow read: if request.auth.uid == userId; }'}`).
                </p>
              )}
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

        <section className="space-y-8 mt-8">
          {renderCandidateSection("President Candidate Nominations", presidentCandidates, "President", Shield)}
          {renderCandidateSection("General Secretary Candidate Nominations", secretaryCandidates, "GeneralSecretary", Award)}
        </section>
      </main>
    </AppShell>
  );
}
