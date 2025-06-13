
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
import { Loader2, AlertCircle, ArrowLeft, CalendarDays, Users, DollarSign, Target as TargetIcon, HeartHandshake, Phone, Wallet } from "lucide-react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext";
import { addPaymentTransaction, type NewPaymentTransactionInput } from "@/services/paymentService";

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
  const { user } = useAuth();
  const { toast } = useToast();

  const [campaign, setCampaign] = React.useState<CampaignData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [donationAmount, setDonationAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<"BKash" | "Wallet">("BKash");
  const [lastFourDigits, setLastFourDigits] = React.useState("");
  const [receiverBkashNo, setReceiverBkashNo] = React.useState("");
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
      setIsDialogOpen(false);
      router.push("/login");
      return;
    }

    if (!donationAmount || isNaN(parseFloat(donationAmount)) || parseFloat(donationAmount) <= 0) {
        toast({ title: "Invalid Amount", description: "Please enter a valid donation amount.", variant: "destructive" });
        return;
    }

    const transactionInput: NewPaymentTransactionInput = {
        userId: user.uid,
        userEmail: user.email || undefined,
        campaignId: campaign!.id!, // campaign is checked before this function is called
        campaignName: campaign!.campaignTitle,
        amount: parseFloat(donationAmount),
        paymentMethod: paymentMethod,
    };

    if (paymentMethod === "BKash") {
      if (!lastFourDigits || !receiverBkashNo) {
        toast({ title: "Missing Information", description: "For BKash, please enter last 4 digits and Receiver Bkash No.", variant: "destructive" });
        return;
      }
      if (lastFourDigits.length !== 4 || !/^\d{4}$/.test(lastFourDigits)) {
          toast({ title: "Invalid Last 4 Digits", description: "Please enter exactly 4 digits for BKash.", variant: "destructive" });
          return;
      }
      if (!/^01[3-9]\d{8}$/.test(receiverBkashNo)) {
          toast({ title: "Invalid Bkash Number", description: "Please enter a valid 11-digit Bkash number.", variant: "destructive" });
          return;
      }
      transactionInput.lastFourDigits = lastFourDigits;
      transactionInput.receiverBkashNo = receiverBkashNo;
    }
    // No specific fields for Wallet for now, but could add wallet ID or similar later

    setIsSubmittingDonation(true);
    
    try {
        await addPaymentTransaction(transactionInput);
        toast({
          title: paymentMethod === "Wallet" ? "Donation Successful!" : "Donation Submitted!",
          description: paymentMethod === "Wallet" 
            ? "Thank you for your generous contribution via Wallet!" 
            : "Your BKash donation is pending verification. Thank you!",
        });
        // Reset form fields
        setDonationAmount("");
        setLastFourDigits("");
        setReceiverBkashNo("");
        setPaymentMethod("BKash"); // Reset to default
        setIsDialogOpen(false);

        // Refetch campaign data to show updated raised amount if it was a wallet payment
        if (paymentMethod === "Wallet" && campaignId) {
          const updatedCampaign = await getCampaignById(campaignId);
          if (updatedCampaign) setCampaign(updatedCampaign);
        }

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
                        disabled={campaign.initialStatus !== 'active'} // Disable if campaign is not active
                    >
                      <HeartHandshake className="mr-2 h-5 w-5" /> Donate Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Make a Donation</DialogTitle>
                      <DialogDescription>
                        Support "{campaign.campaignTitle}". Choose your payment method and enter the amount.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div>
                        <Label className="mb-2 block">Payment Method</Label>
                        <RadioGroup defaultValue="BKash" value={paymentMethod} onValueChange={(value: "BKash" | "Wallet") => setPaymentMethod(value)}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="BKash" id={`bkash-view-${campaign.id}`} />
                            <Label htmlFor={`bkash-view-${campaign.id}`} className="font-normal">BKash Payment</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Wallet" id={`wallet-view-${campaign.id}`} />
                            <Label htmlFor={`wallet-view-${campaign.id}`} className="font-normal">Wallet Payment</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right col-span-1">
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
                      {paymentMethod === "BKash" && (
                        <>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="lastFour" className="text-right col-span-1">
                              Last 4 Digits
                            </Label>
                            <Input
                              id="lastFour"
                              value={lastFourDigits}
                              onChange={(e) => setLastFourDigits(e.target.value)}
                              className="col-span-3"
                              placeholder="Transaction last 4 digits"
                              maxLength={4}
                              disabled={isSubmittingDonation}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="bkashNo" className="text-right col-span-1">
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
                        </>
                      )}
                       {paymentMethod === "Wallet" && (
                        <Alert variant="default" className="col-span-4">
                            <Wallet className="h-4 w-4" />
                            <ShadCNAlertTitle>Pay from Wallet</ShadCNAlertTitle>
                            <AlertDescription>
                                The donation amount will be deducted from your available wallet balance. Wallet balance check and deduction will be implemented in a future update.
                            </AlertDescription>
                        </Alert>
                      )}
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
                        disabled={isSubmittingDonation || !donationAmount || (paymentMethod === "BKash" && (!lastFourDigits || lastFourDigits.length !== 4 || !receiverBkashNo))}
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

