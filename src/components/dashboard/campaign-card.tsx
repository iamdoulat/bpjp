
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CampaignData } from '@/services/campaignService'; // Updated import

interface CampaignCardProps {
  campaign: CampaignData; // Changed to CampaignData
}

// Updated to use campaignTitle or description
function getCampaignImageHint(title: string, description: string): string {
  const combinedText = `${title.toLowerCase()} ${description.toLowerCase()}`;
  if (combinedText.includes('environment') || combinedText.includes('forest') || combinedText.includes('nature')) return 'forest nature';
  if (combinedText.includes('education') || combinedText.includes('child') || combinedText.includes('school')) return 'children study';
  if (combinedText.includes('water') || combinedText.includes('well')) return 'water well';
  if (combinedText.includes('animal') || combinedText.includes('shelter')) return 'animal shelter';
  if (combinedText.includes('health') || combinedText.includes('medical')) return 'medical health';
  return 'community help'; // Default hint
}


export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="relative aspect-[3/2] w-full mb-4 rounded-md overflow-hidden border">
          <Image
            src={campaign.campaignImageUrl || `https://placehold.co/300x200.png`} // Use actual image URL or placeholder
            alt={campaign.campaignTitle}
            layout="fill"
            objectFit="cover"
            data-ai-hint={getCampaignImageHint(campaign.campaignTitle, campaign.description)}
          />
        </div>
        <CardTitle className="font-headline text-lg">{campaign.campaignTitle}</CardTitle>
        {/* Category removed as it's not in CampaignData directly */}
        {/* <CardDescription className="text-xs text-muted-foreground uppercase tracking-wider">{campaign.category}</CardDescription> */}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-foreground/80 line-clamp-3">{campaign.description}</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Learn More & Donate
        </Button>
      </CardFooter>
    </Card>
  );
}
