
"use client";

import * as React from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ClipboardList, Search, PlusCircle, MoreHorizontal, AlertCircle, Edit, Eye, Trash2 } from "lucide-react";
import { getCampaigns, type CampaignData } from "@/services/campaignService"; // Assuming deleteCampaign will be added here
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
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
  }).format(new Date(date)); // Ensure it's a Date object
}


export default function ManageCampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<CampaignData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [campaignToDelete, setCampaignToDelete] = React.useState<CampaignData | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchCampaignsData = React.useCallback(async () => {
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
  }, []);

  React.useEffect(() => {
    fetchCampaignsData();
  }, [fetchCampaignsData]);

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
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusBadgeClassName = (status: CampaignData["initialStatus"]) => {
    if (status === "completed") {
      return "bg-green-600 hover:bg-green-700 text-white border-green-600";
    }
    if (status === "active") {
        return "bg-blue-600 hover:bg-blue-700 text-white border-blue-600";
    }
    return "";
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete || !campaignToDelete.id) return;
    try {
      // Placeholder for actual delete logic
      // await deleteCampaign(campaignToDelete.id); 
      toast({
        title: "Campaign Deleted (Simulated)",
        description: `Campaign "${campaignToDelete.campaignTitle}" would have been deleted.`,
      });
      setCampaigns(prev => prev.filter(c => c.id !== campaignToDelete.id)); // Optimistic UI update
      setCampaignToDelete(null);
    } catch (e) {
      console.error("Failed to delete campaign:", e);
      toast({
        title: "Error Deleting Campaign",
        description: e instanceof Error ? e.message : "An unknown error occurred.",
        variant: "destructive",
      });
      setCampaignToDelete(null);
    }
  };


  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-green-600" />
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
            <ShadCNAlertTitle>Error Fetching Campaigns</ShadCNAlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && filteredCampaigns.length === 0 && (
          <Alert>
             <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>No Campaigns Found</ShadCNAlertTitle>
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
                  <TableHead className="w-[200px] md:w-[250px]">Title</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Raised</TableHead>
                  <TableHead className="w-[100px] md:w-[150px]">Progress</TableHead>
                  <TableHead>Start Date</TableHead>
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
                      <TableCell className="font-medium truncate max-w-[150px] md:max-w-none">{campaign.campaignTitle}</TableCell>
                      <TableCell>{formatCurrency(campaign.goalAmount)}</TableCell>
                      <TableCell>{formatCurrency(campaign.raisedAmount)}</TableCell>
                      <TableCell>
                        <Progress value={progressValue} aria-label={`${progressValue.toFixed(0)}% raised`} className="h-2" />
                      </TableCell>
                      <TableCell>{formatDisplayDate(campaign.startDate as Date)}</TableCell>
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
                              <span className="sr-only">Campaign actions for {campaign.campaignTitle}</span>
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10" 
                              onSelect={() => setCampaignToDelete(campaign)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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

      {campaignToDelete && (
        <AlertDialog open={!!campaignToDelete} onOpenChange={(open) => !open && setCampaignToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this campaign?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the campaign
                <span className="font-semibold"> "{campaignToDelete.campaignTitle}"</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCampaignToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCampaign}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AppShell>
  );
}
