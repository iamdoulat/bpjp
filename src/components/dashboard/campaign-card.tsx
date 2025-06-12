
import Image from 'next/image';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { CampaignData } from '@/services/campaignService';
import { cn } from '@/lib/utils';

interface CampaignCardProps {
  campaign: CampaignData;
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


export function CampaignCard({ campaign }: CampaignCardProps) {
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
        <CardTitle className="font-headline text-lg mb-3 leading-tight HIDE_TEXT_AFTER_TWO_LINES"> {/* Adjusted mb */}
          {campaign.campaignTitle}
        </CardTitle>
        <div className="my-2 space-y-1"> {/* Adjusted my and added space-y */}
          <Progress value={progressPercentage} className="h-2 rounded-full" />
          <p className="text-xs text-muted-foreground">{progressPercentage > 100 ? '100+' : progressPercentage.toFixed(0)}% funded</p>
        </div>
        <Button 
          variant="default" 
          className={cn(
            "w-full mt-auto text-sm py-2 h-auto", // Ensure button takes available space, adjust padding
            "bg-accent hover:bg-accent/90 text-accent-foreground dark:bg-accent dark:hover:bg-accent/90 dark:text-accent-foreground" // Explicit dark theme styling
          )}
        >
          Donate Now
        </Button>
      </div>
      <style jsx>{`
        .HIDE_TEXT_AFTER_TWO_LINES {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: 2.5em; /* Approximate height for 2 lines, adjust as needed */
        }
      `}</style>
    </Card>
  );
}

