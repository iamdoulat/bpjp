
"use client";

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { CampaignData, ReactionType } from '@/services/campaignService';
import { cn } from '@/lib/utils';
import { Heart, ThumbsUp, Eye, HeartHandshake, Loader2, Phone, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { addPaymentTransaction, type NewPaymentTransactionInput } from "@/services/paymentService";
import { toggleCampaignReaction, getUserReactionsForCampaign, getCampaignById } from '@/services/campaignService';
import { useRouter } from 'next/navigation';

interface CampaignCardProps {
  campaign: CampaignData;
  isPublicView?: boolean;
  onDonationSuccess?: (campaignId: string) => void; // Callback for successful donation
}

function getCampaignImageHint(title: string, description: string): string {
  const combinedText = `${title.toLowerCase()} ${description.toLowerCase()}`;
  if (combinedText.includes('environment') || combinedText.includes('forest') || combinedText.includes('nature')) return 'forest nature';
  if (combinedText.includes('education') || combinedText.includes('child') || combinedText.includes('school')) return 'children study';
  if (combinedText.includes('water') || combinedText.includes('well')) return 'water well';
  if (combinedText.includes('animal') || combinedText.includes('shelter')) return 'animal shelter';
  if (combinedText.includes('health') || combinedText.includes('medical')) return 'medical health';
  return 'community help';
}

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

export function CampaignCard({ campaign: initialCampaign, isPublicView = false, onDonationSuccess }: CampaignCardProps) {
  const [campaign, setCampaign] = React.useState<CampaignData>(initialCampaign);
  
  const progressPercentage = campaign.goalAmount > 0 ? (campaign.raisedAmount / campaign.goalAmount) * 100 : 0;
  
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [donationAmount, setDonationAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<"BKash" | "Wallet">("BKash");
  const [lastFourDigits, setLastFourDigits] = React.useState("");
  const [receiverBkashNo, setReceiverBkashNo] = React.useState("");
  const [isSubmittingDonation, setIsSubmittingDonation] = React.useState(false);

  const [likeCount, setLikeCount] = React.useState(campaign.likeCount || 0);
  const [supportCount, setSupportCount] = React.useState(campaign.supportCount || 0);
  const [userLiked, setUserLiked] = React.useState(false);
  const [userSupported, setUserSupported] = React.useState(false);
  const [loadingReactions, setLoadingReactions] = React.useState(true);
  const [isTogglingReaction, setIsTogglingReaction] = React.useState(false);
  
  React.useEffect(() => {
    setCampaign(initialCampaign); // Update local campaign state if prop changes
    setLikeCount(initialCampaign.likeCount || 0);
    setSupportCount(initialCampaign.supportCount || 0);
  }, [initialCampaign]);


  React.useEffect(() => {
    if (user && campaign.id) {
      setLoadingReactions(true);
      getUserReactionsForCampaign(campaign.id, user.uid)
        .then(reactions => {
          setUserLiked(reactions.liked);
          setUserSupported(reactions.supported);
        })
        .catch(error => console.error("Error fetching user reactions:", error))
        .finally(() => setLoadingReactions(false));
    } else {
      setLoadingReactions(false);
      setUserLiked(false);
      setUserSupported(false);
    }
  }, [campaign.id, user]);


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
        campaignId: campaign.id!,
        campaignName: campaign.campaignTitle,
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

    setIsSubmittingDonation(true);
    
    try {
        await addPaymentTransaction(transactionInput);
        toast({
          title: paymentMethod === "Wallet" ? "Donation Successful!" : "Donation Submitted!",
          description: paymentMethod === "Wallet" 
            ? "Thank you for your generous contribution via Wallet!" 
            : "Your BKash donation is pending verification. Thank you!",
        });
        setDonationAmount("");
        setLastFourDigits("");
        setReceiverBkashNo("");
        setPaymentMethod("BKash");
        setIsDialogOpen(false);

        // Refetch campaign data to update raised amount if Wallet payment or call callback
        if (paymentMethod === "Wallet" && campaign.id) {
          if (onDonationSuccess) {
            onDonationSuccess(campaign.id);
          } else { // Fallback if no callback provided
            const updatedCampaignData = await getCampaignById(campaign.id);
            if (updatedCampaignData) setCampaign(updatedCampaignData);
          }
        }

    } catch (e) {
        console.error("Failed to submit donation from card:", e);
        toast({
            title: "Donation Failed",
            description: (e instanceof Error ? e.message : "Could not submit donation. Please try again."),
            variant: "destructive",
        });
    } finally {
        setIsSubmittingDonation(false);
    }
  };

  const handleReactionToggle = async (reactionType: ReactionType) => {
    if (authLoading || !user || !campaign.id) {
      toast({ title: "Login Required", description: "Please log in to react.", variant: "destructive" });
      return;
    }
    if (isTogglingReaction) return;

    setIsTogglingReaction(true);

    const oldLiked = userLiked;
    const oldSupported = userSupported;
    const oldLikeCount = likeCount;
    const oldSupportCount = supportCount;

    if (reactionType === 'like') {
      setLikeCount(prev => userLiked ? prev - 1 : prev + 1);
      setUserLiked(prev => !prev);
    } else if (reactionType === 'support') {
      setSupportCount(prev => userSupported ? prev - 1 : prev + 1);
      setUserSupported(prev => !prev);
    }

    try {
      const { newCount, userHasReacted } = await toggleCampaignReaction(campaign.id, user.uid, reactionType);
      if (reactionType === 'like') {
        setLikeCount(newCount);
        setUserLiked(userHasReacted);
      } else if (reactionType === 'support') {
        setSupportCount(newCount);
        setUserSupported(userHasReacted);
      }
    } catch (error) {
      console.error(`Error toggling ${reactionType}:`, error);
      toast({ title: "Error", description: `Could not record ${reactionType}.`, variant: "destructive" });
      // Revert optimistic update on error
      if (reactionType === 'like') {
        setLikeCount(oldLikeCount);
        setUserLiked(oldLiked);
      } else if (reactionType === 'support') {
        setSupportCount(oldSupportCount);
        setUserSupported(oldSupported);
      }
    } finally {
      setIsTogglingReaction(false);
    }
  };


  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden rounded-lg">
      <div className="relative aspect-[3/2] w-full">
        <Image
          src={campaign.campaignImageUrl || `https://placehold.co/600x400.png`}
          alt={campaign.campaignTitle}
          layout="fill"
          objectFit="cover"
          data-ai-hint={getCampaignImageHint(campaign.campaignTitle, campaign.description)}
        />
      </div>
      <div className="p-4 bg-card flex flex-col flex-grow">
        <CardTitle className="font-headline text-sm md:text-base mb-3 leading-tight truncate">
          {campaign.campaignTitle}
        </CardTitle>
        <div className="my-2 space-y-1">
          <Progress value={progressPercentage} className="h-2 rounded-full" />
          <p className="text-xs text-muted-foreground">{progressPercentage > 100 ? '100+' : progressPercentage.toFixed(0)}% funded</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              className={cn(
                "w-full mt-auto text-sm py-2 h-auto",
                "bg-green-600 hover:bg-green-700 text-white"
              )}
              disabled={campaign.initialStatus !== 'active'} // Disable if campaign is not active
            >
              <HeartHandshake className="mr-2 h-4 w-4" /> Donate Now
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
                    <RadioGroupItem value="BKash" id={`bkash-card-${campaign.id}`} />
                    <Label htmlFor={`bkash-card-${campaign.id}`} className="font-normal">BKash Payment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Wallet" id={`wallet-card-${campaign.id}`} />
                    <Label htmlFor={`wallet-card-${campaign.id}`} className="font-normal">Wallet Payment</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={`amount-${campaign.id}`} className="text-right col-span-1">
                  Amount
                </Label>
                <Input
                  id={`amount-${campaign.id}`}
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="col-span-3"
                  placeholder="BDT"
                  disabled={isSubmittingDonation}
                />
              </div>
              {paymentMethod === "BKash" && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`lastFour-${campaign.id}`} className="text-right col-span-1">
                      Last 4 Digits
                    </Label>
                    <Input
                      id={`lastFour-${campaign.id}`}
                      value={lastFourDigits}
                      onChange={(e) => setLastFourDigits(e.target.value)}
                      className="col-span-3"
                      placeholder="Transaction last 4 digits"
                      maxLength={4}
                      disabled={isSubmittingDonation}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`bkashNo-${campaign.id}`} className="text-right col-span-1">
                      Bkash No.
                    </Label>
                    <Input
                      id={`bkashNo-${campaign.id}`}
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

      </div>
      {(isPublicView || !campaign.id?.startsWith('admin_preview')) && (
        <CardFooter className="p-3 bg-muted/20 border-t flex items-center justify-between">
          <Button variant="outline" size="sm" asChild className="text-xs h-auto py-1.5 px-3">
            <Link href={`/campaigns/view/${campaign.id}`}>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View
            </Link>
          </Button>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", userLiked ? "text-blue-500 hover:text-blue-600" : "text-muted-foreground hover:text-rose-500")}
              onClick={() => handleReactionToggle('like')}
              disabled={isTogglingReaction || authLoading || loadingReactions}
              aria-label="Like campaign"
            >
              {isTogglingReaction || loadingReactions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
            </Button>
            <span className="text-xs text-muted-foreground">{formatCount(likeCount)}</span>
            
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", userSupported ? "text-blue-500 hover:text-blue-600" : "text-muted-foreground hover:text-primary")}
              onClick={() => handleReactionToggle('support')}
              disabled={isTogglingReaction || authLoading || loadingReactions}
              aria-label="Support campaign"
            >
               {isTogglingReaction || loadingReactions ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
            </Button>
            <span className="text-xs text-muted-foreground">{formatCount(supportCount)}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
