
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { CampaignData } from '@/services/campaignService';
import { cn } from '@/lib/utils';
import { Heart, ThumbsUp, Eye } from 'lucide-react';

interface CampaignCardProps {
  campaign: CampaignData;
  isPublicView?: boolean; // To differentiate if it's shown on public browse page
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

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden rounded-lg">
      {/* Image Section */}
      <div className="relative aspect-[3/2] w-full">
        <Image
          src={campaign.campaignImageUrl || `https://placehold.co/600x400.png`}
          alt={campaign.campaignTitle}
          layout="fill"
          objectFit="cover"
          data-ai-hint={getCampaignImageHint(campaign.campaignTitle, campaign.description)}
        />
      </div>
      {/* Content Section */}
      <div className="p-4 bg-card flex flex-col flex-grow">
        <CardTitle className="font-headline text-sm md:text-base mb-3 leading-tight truncate">
          {campaign.campaignTitle}
        </CardTitle>
        <div className="my-2 space-y-1">
          <Progress value={progressPercentage} className="h-2 rounded-full" />
          <p className="text-xs text-muted-foreground">{progressPercentage > 100 ? '100+' : progressPercentage.toFixed(0)}% funded</p>
        </div>
        <Button
          variant="default"
          className={cn(
            "w-full mt-auto text-sm py-2 h-auto",
            "bg-accent hover:bg-accent/90 text-accent-foreground dark:bg-accent dark:hover:bg-accent/90 dark:text-accent-foreground"
          )}
          // onClick={() => { /* Implement donation logic later */ }}
        >
          Donate Now
        </Button>
      </div>
      {/* Footer for View Details and Reactions - only if isPublicView is true or for general cards */}
      {(isPublicView || !campaign.id?.startsWith('admin_preview')) && ( // Example conditional rendering
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
