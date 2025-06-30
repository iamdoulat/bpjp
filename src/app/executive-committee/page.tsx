// src/app/executive-committee/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { getExecutiveCommitteeData, getExecutiveMembers, type ExecutiveCommitteeContentData, type ExecutiveMemberData } from "@/services/executiveCommitteeService";
import { Users, ServerCrash } from "lucide-react";

export default function ExecutiveCommitteePage() {
  const [contentData, setContentData] = React.useState<ExecutiveCommitteeContentData | null>(null);
  const [karjokoriMembers, setKarjokoriMembers] = React.useState<ExecutiveMemberData[]>([]);
  const [karjonirbahiMembers, setKarjonirbahiMembers] = React.useState<ExecutiveMemberData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [fetchedContent, fetchedMembers] = await Promise.all([
          getExecutiveCommitteeData(),
          getExecutiveMembers()
        ]);

        setContentData(fetchedContent);
        
        const karjokori = fetchedMembers.filter(m => m.committeeType === 'কার্যকরী কমিটি');
        const karjonirbahi = fetchedMembers.filter(m => m.committeeType === 'কার্যনির্বাহী কমিটি');
        
        setKarjokoriMembers(karjokori);
        setKarjonirbahiMembers(karjonirbahi);

      } catch (e) {
        console.error("Failed to fetch executive committee data:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const renderMemberTable = (members: ExecutiveMemberData[]) => {
    if (members.length === 0) {
        return <p className="text-muted-foreground text-center p-4">No members listed for this committee.</p>;
    }
    return (
        <div className="border rounded-md overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60px]">No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Cell Number</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.map((member, index) => (
                        <TableRow key={member.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{member.name}</TableCell>
                            <TableCell>{member.designation}</TableCell>
                            <TableCell className="text-muted-foreground">{member.cellNumber || 'N/A'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
  };
  
  if (loading) {
    return (
        <AppShell>
            <main className="flex-1 p-4 md:p-6 space-y-8">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-7 w-64" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                    <CardContent><Skeleton className="h-20 w-full" /></CardContent>
                </Card>
                 <Card>
                    <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                           {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    </CardContent>
                </Card>
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
                    <ShadCNAlertTitle>Error Loading Data</ShadCNAlertTitle>
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
          <Users className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-headline font-bold">Executive Committee</h1>
            <p className="text-muted-foreground text-md">Meet the dedicated members of our committee.</p>
          </div>
        </div>
                
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>কার্যকরী কমিটি সদস্য</CardTitle>
                <CardDescription>ভূজপুর প্রবাসী যুব কল্যাণ পরিষদের ২০২৫-২৭ সেশনে কার্যকরী কমিটি</CardDescription>
            </CardHeader>
            <CardContent>
                {renderMemberTable(karjokoriMembers)}
            </CardContent>
        </Card>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>কার্যনির্বাহী কমিটি সদস্য</CardTitle>
                <CardDescription>ভূজপুর প্রবাসী যুব কল্যাণ পরিষদের ২০২৫-২৭ সেশনে কার্যনির্বাহী কমিটি</CardDescription>
            </CardHeader>
            <CardContent>
                {renderMemberTable(karjonirbahiMembers)}
            </CardContent>
        </Card>

      </main>
    </AppShell>
  );
}
