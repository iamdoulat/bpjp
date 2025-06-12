
"use client";

import * as React from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClipboardList, Search, PlusCircle, MoreHorizontal, AlertCircle, Edit, Eye } from "lucide-react";
import { getCampaigns, type CampaignData } from "@/services/campaignService";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDisplayDate(date: Date | undefined) {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);
}


export default function ManageCampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<CampaignData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const router = useRouter(); // Initialize router

  React.useEffect(() => {
    async function fetchCampaigns() {
      try {
        setLoading(true);
        setError(null);
        const fetchedCampaigns = await getCampaigns();
        setCampaigns(fetchedCampaigns);
      } catch (e) {
        console.error("Failed to fetch campaigns:", e);
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.campaignTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: CampaignData["initialStatus"]) => {
    switch (status) {
      case "active":
        return "default";
      case "upcoming":
        return "secondary";
      case "draft":
        return "outline";
      case "completed":
        return "default"; // Will be styled with custom class
      default:
        return "secondary";
    }
  };

  const getStatusBadgeClassName = (status: CampaignData["initialStatus"]) => {
    if (status === "completed") {
      return "bg-green-600 hover:bg-green-700 text-white border-green-600";
    }
    return "";
  };


  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Manage Campaigns</h1>
              <p className="text-muted-foreground text-sm">
                Oversee all donation campaigns, edit details, and track progress.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search campaigns..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href="/new-campaign">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Campaign
              </Link>
            </Button>
          </div>
        </div>

        {loading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Fetching Campaigns</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && filteredCampaigns.length === 0 && (
          <Alert>
             <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Campaigns Found</AlertTitle>
            <AlertDescription>
              {searchTerm ? "No campaigns match your search term." : "There are no campaigns to display yet. Try creating one!"}
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && filteredCampaigns.length > 0 && (
          <div className="border rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Title</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Raised</TableHead>
                  <TableHead className="w-[150px]">Progress</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => {
                  const progressValue = campaign.goalAmount > 0 ? (campaign.raisedAmount / campaign.goalAmount) * 100 : 0;
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.campaignTitle}</TableCell>
                      <TableCell>{formatCurrency(campaign.goalAmount)}</TableCell>
                      <TableCell>{formatCurrency(campaign.raisedAmount)}</TableCell>
                      <TableCell>
                        <Progress value={progressValue} aria-label={`${progressValue.toFixed(0)}% raised`} className="h-2" />
                      </TableCell>
                      <TableCell>{formatDisplayDate(campaign.endDate as Date)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(campaign.initialStatus)} className={cn(getStatusBadgeClassName(campaign.initialStatus))}>
                          {campaign.initialStatus.charAt(0).toUpperCase() + campaign.initialStatus.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Campaign actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => router.push(`/admin/campaigns/view/${campaign.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => router.push(`/admin/campaigns/edit/${campaign.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => alert(`Delete ${campaign.campaignTitle}`)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </AppShell>
  );
}
