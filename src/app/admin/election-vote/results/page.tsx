
// src/app/admin/election-vote/results/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link"; // Import Link
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart3, Shield, Award, Loader2, ServerCrash, ArrowLeft, Users, CheckIcon, Settings, EyeOff, EyeIcon } from "lucide-react"; // Changed CheckboxIcon to CheckIcon
import { getCandidatesByPosition, type ElectionCandidateData, type CandidatePosition } from "@/services/electionCandidateService";
import { getElectionControlSettings, setResultsPublished, type ElectionControlSettings } from "@/services/electionControlService"; // Import election control
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface CandidateResult extends ElectionCandidateData { // For results display
  percentageOfTotalVotes?: number;
}

const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : "C";


export default function ElectionResultsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [presidentResults, setPresidentResults] = React.useState<CandidateResult[]>([]);
  const [secretaryResults, setSecretaryResults] = React.useState<CandidateResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [electionSettings, setElectionSettings] = React.useState<ElectionControlSettings>({ resultsPublished: false, votingClosed: false });
  const [loadingSettings, setLoadingSettings] = React.useState(true);
  const [isUpdatingSettings, setIsUpdatingSettings] = React.useState(false);


  const fetchAndProcessResults = React.useCallback(async (position: CandidatePosition, setter: React.Dispatch<React.SetStateAction<CandidateResult[]>>) => {
    try {
      const candidates = await getCandidatesByPosition(position);
      const totalVotesForPosition = candidates.reduce((sum, candidate) => sum + (candidate.voteCount || 0), 0);

      const resultsWithPercentage = candidates
        .map(candidate => ({
          ...candidate,
          percentageOfTotalVotes: totalVotesForPosition > 0 ? ((candidate.voteCount || 0) / totalVotesForPosition) * 100 : 0,
        }))
        .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

      setter(resultsWithPercentage);
    } catch (e) {
      console.error(`Error fetching results for ${position}:`, e);
      throw e; // Re-throw to be caught by loadAllData
    }
  }, []);

  const fetchElectionSettings = React.useCallback(async () => {
    setLoadingSettings(true);
    try {
      const settings = await getElectionControlSettings();
      setElectionSettings(settings);
    } catch (e) {
      toast({ title: "Error Loading Settings", description: (e as Error).message, variant: "destructive"});
      // Set default values if settings fetch fails to avoid undefined errors
      setElectionSettings({ resultsPublished: false, votingClosed: false });
    } finally {
      setLoadingSettings(false);
    }
  }, [toast]);


  React.useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchAndProcessResults("President", setPresidentResults),
          fetchAndProcessResults("GeneralSecretary", setSecretaryResults),
          fetchElectionSettings()
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred while loading election results or settings.");
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, [fetchAndProcessResults, fetchElectionSettings]);

  const handlePublishChange = async (isPublic: boolean) => {
    setIsUpdatingSettings(true);
    try {
      await setResultsPublished(isPublic);
      setElectionSettings(prev => ({ ...prev, resultsPublished: isPublic, votingClosed: isPublic })); // Update local state
      toast({
        title: "Settings Updated",
        description: `Election results are now ${isPublic ? 'publicly visible and voting is closed' : 'private and voting may be open'}.`,
      });
    } catch (e) {
      toast({ title: "Error Updating Settings", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsUpdatingSettings(false);
    }
  };


  const ResultTable = ({ title, results, icon: Icon }: { title: string; results: CandidateResult[]; icon: React.ElementType }) => (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">{title} Results</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {results.length === 0 && !loading && ( // Check loading state here too
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
                  <TableCell className="text-right font-semibold">
                    {(candidate.voteCount || 0) > 0 ? (
                       <Button 
                        asChild 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-primary-foreground px-2.5 py-1 text-xs h-auto"
                       >
                        <Link href={`/admin/election-vote/results/${candidate.id}/voters`}>
                          {candidate.voteCount || 0}
                        </Link>
                      </Button>
                    ) : (
                      candidate.voteCount || 0
                    )}
                  </TableCell>
                  <TableCell className="text-right">{candidate.percentageOfTotalVotes?.toFixed(1) || "0.0"}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64 mt-1" /></div>
          </div>
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                <CardContent className="space-y-2">
                  {[...Array(2)].map((_, j) => <Skeleton key={j} className="h-10 w-full" />)}
                </CardContent>
              </Card>
            ))}
            <Skeleton className="h-12 w-full rounded-md mt-6"/>
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
            <ShadCNAlertTitle>Error Loading Results</ShadCNAlertTitle>
            <AlertDescription>
              {error}
              <br />
              Please ensure candidates are managed and Firestore rules permit access.
            </AlertDescription>
            <Button onClick={() => router.back()} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4"/> Go Back
            </Button>
          </Alert>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Election Results</h1>
              <p className="text-muted-foreground text-sm">
                Current vote counts for nominated candidates.
              </p>
            </div>
          </div>
           <Button variant="outline" onClick={() => router.push("/admin/election-vote")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Election Management
          </Button>
        </div>

        <div className="space-y-8">
          <ResultTable title="President" results={presidentResults} icon={Shield} />
          <ResultTable title="General Secretary" results={secretaryResults} icon={Award} />
        </div>

        {presidentResults.length === 0 && secretaryResults.length === 0 && !loading && (
             <Alert className="mt-8">
                <Users className="h-4 w-4"/>
                <ShadCNAlertTitle>No Results to Display</ShadCNAlertTitle>
                <AlertDescription>
                    There are no candidates or votes recorded yet for either position. Manage candidates and encourage voting to see results here.
                </AlertDescription>
            </Alert>
        )}

        <Card className="mt-8 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Election Control</CardTitle>
            </div>
            <CardDescription>Manage the visibility of results and voting status.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSettings ? (
              <Skeleton className="h-10 w-1/2" />
            ) : (
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="publish-results"
                  checked={electionSettings.resultsPublished}
                  onCheckedChange={(checked) => handlePublishChange(checked as boolean)}
                  disabled={isUpdatingSettings}
                />
                <Label htmlFor="publish-results" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Publish Results Publicly &amp; Close Voting
                </Label>
                {isUpdatingSettings && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              If checked, results will be shown on the public voting page, and all voting will be closed.
              If unchecked, results are private, and voting may remain open (unless manually closed elsewhere).
            </p>
            <div className="mt-3 flex items-center text-sm">
                {electionSettings.resultsPublished ? <EyeIcon className="h-4 w-4 mr-1.5 text-green-600"/> : <EyeOff className="h-4 w-4 mr-1.5 text-orange-500"/>}
                Results are currently: <strong className={cn(electionSettings.resultsPublished ? "text-green-600" : "text-orange-500")}>
                    {electionSettings.resultsPublished ? "Public" : "Private"}
                </strong>
            </div>
             <div className="mt-1 flex items-center text-sm">
                {electionSettings.votingClosed ? <CheckIcon className="h-4 w-4 mr-1.5 text-red-500"/> : <CheckIcon className="h-4 w-4 mr-1.5 text-green-600"/>}
                Voting is currently: <strong className={cn(electionSettings.votingClosed ? "text-red-500" : "text-green-600")}>
                    {electionSettings.votingClosed ? "Closed" : "Open"}
                </strong>
            </div>
          </CardContent>
        </Card>

      </main>
    </AppShell>
  );
}

