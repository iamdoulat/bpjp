
"use client"; // Required for useState, useEffect, and event handlers

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { CampaignData } from '@/services/campaignService';
import { cn } from '@/lib/utils';
import { Heart, ThumbsUp, Eye, HeartHandshake, Loader2, Phone } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext"; // Added useAuth
import { addPaymentTransaction, type NewPaymentTransactionInput } from "@/services/paymentService"; // Added payment service
import { useRouter } from 'next/navigation';


interface CampaignCardProps {
  campaign: CampaignData;
  isPublicView?: boolean;
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

export function CampaignCard({ campaign, isPublicView = false }: CampaignCardProps) {
  const progressPercentage = campaign.goalAmount > 0 ? (campaign.raisedAmount / campaign.goalAmount) * 100 : 0;
  
  const { user } = useAuth(); // Get user from AuthContext
  const { toast } = useToast();
  const router = useRouter();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [donationAmount, setDonationAmount] = React.useState("");
  const [lastFourDigits, setLastFourDigits] = React.useState("");
  const [receiverBkashNo, setReceiverBkashNo] = React.useState(""); // New state
  const [isSubmittingDonation, setIsSubmittingDonation] = React.useState(false);

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
                "bg-accent hover:bg-accent/90 text-accent-foreground dark:bg-accent dark:hover:bg-accent/90 dark:text-accent-foreground"
              )}
            >
              <HeartHandshake className="mr-2 h-4 w-4" /> Donate Now
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
                <Label htmlFor={`amount-${campaign.id}`} className="text-right">
                  Amount
                </Label>
                <Input
                  id={`amount-${campaign.id}`}
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="col-span-3"
                  placeholder="USD"
                  disabled={isSubmittingDonation}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={`lastFour-${campaign.id}`} className="text-right">
                  Last 4 Digits
                </Label>
                <Input
                  id={`lastFour-${campaign.id}`}
                  value={lastFourDigits}
                  onChange={(e) => setLastFourDigits(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., 1234 (from transaction)"
                  maxLength={4}
                  disabled={isSubmittingDonation}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={`bkashNo-${campaign.id}`} className="text-right">
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
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-rose-500">
              <Heart className="h-4 w-4" />
              <span className="sr-only">Like campaign</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
              <ThumbsUp className="h-4 w-4" />
              <span className="sr-only">Support campaign</span>
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

