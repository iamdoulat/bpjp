// src/app/campaigns/view/[id]/page.tsx
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
import { Loader2, AlertCircle, ArrowLeft, CalendarDays, Users, DollarSign, Target as TargetIcon, HeartHandshake, Phone } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"; // Added useAuth
import { addPaymentTransaction, type NewPaymentTransactionInput } from "@/services/paymentService"; // Added payment service

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
    case "draft": return "outline"; // Should not be visible publicly
    case "completed": return "default";
    default: return "secondary";
  }
};

const getStatusBadgeClassName = (status?: CampaignData["initialStatus"]) => {
  if (status === "completed") return "bg-green-600 hover:bg-green-700 text-white border-green-600";
  if (status === "active") return "bg-blue-600 hover:bg-blue-700 text-white border-blue-600";
  return "";
};


export default function PublicViewCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { user } = useAuth(); // Get user from AuthContext
  const { toast } = useToast();

  const [campaign, setCampaign] = React.useState<CampaignData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [donationAmount, setDonationAmount] = React.useState("");
  const [lastFourDigits, setLastFourDigits] = React.useState("");
  const [receiverBkashNo, setReceiverBkashNo] = React.useState(""); // New state
  const [isSubmittingDonation, setIsSubmittingDonation] = React.useState(false);


  React.useEffect(() => {
    if (campaignId) {
      async function fetchCampaign() {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedCampaign = await getCampaignById(campaignId);
          if (fetchedCampaign && (fetchedCampaign.initialStatus === 'active' || fetchedCampaign.initialStatus === 'upcoming' || fetchedCampaign.initialStatus === 'completed')) {
            setCampaign(fetchedCampaign);
          } else if (fetchedCampaign && fetchedCampaign.initialStatus === 'draft') {
            setError("This campaign is currently a draft and not publicly viewable.");
          }
           else {
            setError("Campaign not found or is not available for public view.");
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

  const handleDonationSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a donation.",
        variant: "destructive",
      });
      setIsDialogOpen(false); // Close dialog if user not logged in
      router.push("/login"); // Redirect to login
      return;
    }

    if (!donationAmount || !lastFourDigits || !receiverBkashNo) {
      toast({
        title: "Missing Information",
        description: "Please enter amount, last 4 digits, and Receiver Bkash No.",
        variant: "destructive",
      });
      return;
    }
    if (isNaN(parseFloat(donationAmount)) || parseFloat(donationAmount) <= 0) {
        toast({
            title: "Invalid Amount",
            description: "Please enter a valid donation amount.",
            variant: "destructive",
        });
        return;
    }
    if (lastFourDigits.length !== 4 || !/^\d{4}$/.test(lastFourDigits)) {
        toast({
            title: "Invalid Last 4 Digits",
            description: "Please enter exactly 4 digits.",
            variant: "destructive",
        });
        return;
    }
     // Basic Bkash number validation (example: starts with 01 and is 11 digits)
    if (!/^01[3-9]\d{8}$/.test(receiverBkashNo)) {
        toast({
            title: "Invalid Bkash Number",
            description: "Please enter a valid 11-digit Bkash number starting with 01.",
            variant: "destructive",
        });
        return;
    }


    setIsSubmittingDonation(true);
    
    if (!campaign || !campaign.id) {
        toast({
            title: "Error",
            description: "Campaign details are missing. Cannot process donation.",
            variant: "destructive",
        });
        setIsSubmittingDonation(false);
        return;
    }

    const transactionInput: NewPaymentTransactionInput = {
        userId: user.uid,
        userEmail: user.email || undefined,
        campaignId: campaign.id,
        campaignName: campaign.campaignTitle,
        amount: parseFloat(donationAmount),
        lastFourDigits: lastFourDigits,
        receiverBkashNo: receiverBkashNo, // Include Bkash number
    };

    try {
        await addPaymentTransaction(transactionInput);
        toast({
          title: "Donation Submitted!",
          description: "Your donation is pending verification by an admin. Thank you for your support!",
        });
        setDonationAmount("");
        setLastFourDigits("");
        setReceiverBkashNo(""); // Clear Bkash number field
        setIsDialogOpen(false);
    } catch (e) {
        console.error("Failed to submit donation:", e);
        toast({
            title: "Donation Failed",
            description: (e instanceof Error ? e.message : "Could not submit donation. Please try again."),
            variant: "destructive",
        });
    } finally {
        setIsSubmittingDonation(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-auto">
            <Button variant="outline" size="sm" className="mb-4" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </Button>
            <Card className="shadow-lg">
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/4" />
              </CardHeader>
              <CardContent className="space-y-6">
                <Skeleton className="h-64 w-full rounded-md" />
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
                <Skeleton className="h-12 w-48" />
              </CardFooter>
            </Card>
        </main>
      </AppShell>
    );
  }

  if (error || !campaign) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center">
          <Alert variant={error ? "destructive" : "default"} className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>{error ? "Error Loading Campaign" : "Campaign Not Found"}</ShadCNAlertTitle>
            <AlertDescription>{error || "The campaign you are looking for does not exist or could not be loaded."}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/campaigns')} className="mt-6">
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
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-auto pb-20 md:pb-8">
          <Button variant="outline" size="sm" onClick={() => router.push('/campaigns')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Campaigns
          </Button>
          <Card className="shadow-lg overflow-hidden">
            <CardHeader className="bg-card p-4 md:p-6 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <CardTitle className="text-3xl font-headline">{campaign.campaignTitle}</CardTitle>
                <Badge
                  variant={getStatusBadgeVariant(campaign.initialStatus)}
                  className={cn("text-base px-4 py-1.5", getStatusBadgeClassName(campaign.initialStatus))}
                >
                  {campaign.initialStatus.charAt(0).toUpperCase() + campaign.initialStatus.slice(1)}
                </Badge>
              </div>
              {campaign.organizerName && (
                <CardDescription className="text-md mt-1">
                  Organized by: <span className="font-semibold">{campaign.organizerName}</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-8">
              {campaign.campaignImageUrl && (
                <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border shadow-inner">
                  <Image
                    src={campaign.campaignImageUrl || `https://placehold.co/800x450.png`}
                    alt={campaign.campaignTitle}
                    layout="fill"
                    objectFit="cover"
                    priority
                    data-ai-hint="campaign event"
                  />
                </div>
              )}

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground border-b pb-2">About this Campaign</h3>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{campaign.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 bg-muted/30 p-6 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <TargetIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Goal Amount</p>
                    <p className="text-xl font-semibold">{formatCurrency(campaign.goalAmount)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Raised</p>
                    <p className="text-xl font-semibold">{formatCurrency(campaign.raisedAmount)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CalendarDays className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="text-lg font-semibold">{formatDisplayDate(new Date(campaign.startDate as Date))}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                   <CalendarDays className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="text-lg font-semibold">{formatDisplayDate(new Date(campaign.endDate as Date))}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Campaign Progress</h3>
                <Progress value={progressValue} aria-label={`${progressValue.toFixed(0)}% raised`} className="h-4 rounded-full" />
                <p className="text-sm text-muted-foreground mt-2 text-right">{progressValue.toFixed(0)}% of goal raised</p>
              </div>

            </CardContent>
             <CardFooter className="bg-card p-4 md:p-6 border-t flex justify-center">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                        size="lg" 
                        className="w-full sm:w-auto text-lg py-3 px-8 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <HeartHandshake className="mr-2 h-5 w-5" /> Donate Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Make a Donation</DialogTitle>
                      <DialogDescription>
                        Support "{campaign.campaignTitle}". Enter amount, last 4 transaction digits, and Receiver Bkash No.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                          Amount
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                          className="col-span-3"
                          placeholder="USD"
                          disabled={isSubmittingDonation}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lastFour" className="text-right">
                          Last 4 Digits
                        </Label>
                        <Input
                          id="lastFour"
                          value={lastFourDigits}
                          onChange={(e) => setLastFourDigits(e.target.value)}
                          className="col-span-3"
                          placeholder="e.g., 1234 (from transaction)"
                          maxLength={4}
                          disabled={isSubmittingDonation}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bkashNo" className="text-right">
                          Bkash No.
                        </Label>
                        <Input
                          id="bkashNo"
                          value={receiverBkashNo}
                          onChange={(e) => setReceiverBkashNo(e.target.value)}
                          className="col-span-3"
                          placeholder="Receiver's Bkash No."
                          maxLength={11}
                          disabled={isSubmittingDonation}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isSubmittingDonation}>
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button 
                        type="button" 
                        onClick={handleDonationSubmit} 
                        disabled={isSubmittingDonation || !donationAmount || !lastFourDigits || lastFourDigits.length !== 4 || !receiverBkashNo}
                      >
                        {isSubmittingDonation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Donation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
            </CardFooter>
          </Card>
      </main>
    </AppShell>
  )
}

