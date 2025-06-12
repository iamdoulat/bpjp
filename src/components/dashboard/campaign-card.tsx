import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PersonalizedCampaignRecommendationsOutput } from '@/ai/flows/personalized-campaign-recommendations';

interface CampaignCardProps {
  campaign: PersonalizedCampaignRecommendationsOutput[0];
}

function getCampaignImageHint(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('environment') || cat.includes('rainforest')) return 'forest nature';
  if (cat.includes('education') || cat.includes('child')) return 'children study';
  if (cat.includes('water')) return 'water well';
  return 'community help';
}


export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="relative aspect-[3/2] w-full mb-4 rounded-md overflow-hidden">
          <Image
            src={`https://placehold.co/300x200.png`}
            alt={campaign.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={getCampaignImageHint(campaign.category)}
          />
        </div>
        <CardTitle className="font-headline text-lg">{campaign.name}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground uppercase tracking-wider">{campaign.category}</CardDescription>
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
