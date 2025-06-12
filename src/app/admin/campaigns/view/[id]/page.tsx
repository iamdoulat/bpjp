
"use client"

import * as React from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert"
import { getCampaignById, type CampaignData } from '@/services/campaignService';
import { Loader2, AlertCircle, ArrowLeft, CalendarDays, Users, DollarSign, Target as TargetIcon, Edit } from "lucide-react"
import { cn } from "@/lib/utils"

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDisplayDate(date: Date | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!date) return "N/A";
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Intl.DateTimeFormat("en-US", { ...defaultOptions, ...options }).format(new Date(date));
}

const getStatusBadgeVariant = (status?: CampaignData["initialStatus"]) => {
  if (!status) return "secondary";
  switch (status) {
    case "active": return "default";
    case "upcoming": return "secondary";
    case "draft": return "outline";
    case "completed": return "default";
    default: return "secondary";
  }
};

const getStatusBadgeClassName = (status?: CampaignData["initialStatus"]) => {
  if (status === "completed") return "bg-green-600 hover:bg-green-700 text-white border-green-600";
  if (status === "active") return "bg-blue-600 hover:bg-blue-700 text-white border-blue-600";
  return "";
};


export default function ViewCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = React.useState<CampaignData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (campaignId) {
      async function fetchCampaign() {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedCampaign = await getCampaignById(campaignId);
          if (fetchedCampaign) {
            setCampaign(fetchedCampaign);
          } else {
            setError("Campaign not found.");
          }
        } catch (e) {
          console.error("Failed to fetch campaign:", e);
          setError(e instanceof Error ? e.message : "An unknown error occurred while fetching campaign data.");
        } finally {
          setIsLoading(false);
        }
      }
      fetchCampaign();
    }
  }, [campaignId]);

  if (isLoading) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
          {/* Removed max-w-3xl mx-auto from this div */}
          <div>
            <Button variant="outline" size="sm" className="mb-4" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </Button>
            <Card className="shadow-lg max-w-3xl mx-auto">
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/4" />
              </CardHeader>
              <CardContent className="space-y-6">
                <Skeleton className="h-48 w-full rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-6 w-2/3" />
                    </div>
                  ))}
                </div>
                <div>
                    <Skeleton className="h-4 w-1/4 mb-1" />
                    <Skeleton className="h-6 w-full" />
                </div>
              </CardContent>
               <CardFooter>
                <Skeleton className="h-10 w-36" />
              </CardFooter>
            </Card>
          </div>
        </main>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>Error Loading Campaign</ShadCNAlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/admin/campaigns')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </main>
      </AppShell>
    );
  }

  if (!campaign) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>Campaign Not Found</ShadCNAlertTitle>
            <AlertDescription>The campaign you are looking for does not exist or could not be loaded.</AlertDescription>
          </Alert>
           <Button onClick={() => router.push('/admin/campaigns')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </main>
      </AppShell>
    );
  }

  const progressValue = campaign.goalAmount > 0 ? (campaign.raisedAmount / campaign.goalAmount) * 100 : 0;

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        {/* Removed max-w-3xl mx-auto from this div */}
        <div> 
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/campaigns')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Manage Campaigns
          </Button>
          <Card className="shadow-lg overflow-hidden max-w-3xl mx-auto">
            <CardHeader className="bg-muted/30 p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <CardTitle className="text-2xl font-headline">{campaign.campaignTitle}</CardTitle>
                <Badge 
                  variant={getStatusBadgeVariant(campaign.initialStatus)}
                  className={cn("text-sm px-3 py-1", getStatusBadgeClassName(campaign.initialStatus))}
                >
                  {campaign.initialStatus.charAt(0).toUpperCase() + campaign.initialStatus.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-6">
              {campaign.campaignImageUrl && (
                <div className="relative aspect-[16/9] w-full rounded-md overflow-hidden border">
                  <Image
                    src={campaign.campaignImageUrl || `https://placehold.co/600x400.png`}
                    alt={campaign.campaignTitle}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="campaign event"
                  />
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-semibold mb-2 text-primary">Campaign Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">{campaign.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex items-center space-x-3">
                  <TargetIcon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Goal Amount</p>
                    <p className="font-semibold">{formatCurrency(campaign.goalAmount)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Amount Raised</p>
                    <p className="font-semibold">{formatCurrency(campaign.raisedAmount)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-semibold">{formatDisplayDate(new Date(campaign.startDate as Date))}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                   <CalendarDays className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="font-semibold">{formatDisplayDate(new Date(campaign.endDate as Date))}</p>
                  </div>
                </div>
                {campaign.organizerName && (
                  <div className="flex items-center space-x-3 md:col-span-2">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Organizer</p>
                      <p className="font-semibold">{campaign.organizerName}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Progress</h3>
                <Progress value={progressValue} aria-label={`${progressValue.toFixed(0)}% raised`} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1 text-right">{progressValue.toFixed(0)}% of goal raised</p>
              </div>

            </CardContent>
             <CardFooter className="bg-muted/30 p-4 md:p-6">
                <Button onClick={() => router.push(`/admin/campaigns/edit/${campaignId}`)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Campaign
                </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </AppShell>
  )
}


      
