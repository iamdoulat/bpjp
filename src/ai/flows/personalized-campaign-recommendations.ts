// src/ai/flows/personalized-campaign-recommendations.ts
'use server';

/**
 * @fileOverview Personalized campaign recommendations based on donation history and preferences.
 *
 * - personalizedCampaignRecommendations - A function that handles the personalized campaign recommendation process.
 * - PersonalizedCampaignRecommendationsInput - The input type for the personalizedCampaignRecommendations function.
 * - PersonalizedCampaignRecommendationsOutput - The return type for the personalizedCampaignRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedCampaignRecommendationsInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  donationHistory: z.array(z.string()).describe('List of campaign IDs the user has donated to.'),
  preferences: z.string().describe('User preferences for campaigns (e.g., environment, education).'),
});
export type PersonalizedCampaignRecommendationsInput = z.infer<typeof PersonalizedCampaignRecommendationsInputSchema>;

const CampaignSchema = z.object({
  campaignId: z.string().describe('The ID of the campaign.'),
  name: z.string().describe('The name of the campaign.'),
  description: z.string().describe('A short description of the campaign.'),
  category: z.string().describe('The category of the campaign (e.g., environment, education).'),
  imageUrl: z.string().url().optional().describe('URL of the campaign image.'),
});

const PersonalizedCampaignRecommendationsOutputSchema = z.array(CampaignSchema).describe('A list of recommended campaigns.');
export type PersonalizedCampaignRecommendationsOutput = z.infer<typeof PersonalizedCampaignRecommendationsOutputSchema>;

export async function personalizedCampaignRecommendations(
  input: PersonalizedCampaignRecommendationsInput
): Promise<PersonalizedCampaignRecommendationsOutput> {
  return personalizedCampaignRecommendationsFlow(input);
}

const getCampaigns = ai.defineTool({
  name: 'getCampaigns',
  description: 'Retrieves a list of campaigns based on user preferences and donation history.',
  inputSchema: z.object({
    preferences: z.string().describe('User preferences for campaigns.'),
    donationHistory: z.array(z.string()).describe('List of campaign IDs the user has donated to.'),
  }),
  outputSchema: z.array(CampaignSchema),
},
async (input) => {
  // In a real application, this would call a database or service to retrieve campaigns.
  // This is a placeholder implementation.
  const campaigns = [
    { campaignId: '1', name: 'Save the Rainforest', description: 'Protect the Amazon rainforest.', category: 'environment', imageUrl: 'https://placehold.co/600x400.png?text=Rainforest' },
    { campaignId: '2', name: 'Educate a Child', description: 'Provide education to underprivileged children.', category: 'education', imageUrl: 'https://placehold.co/600x400.png?text=Education' },
    { campaignId: '3', name: 'Clean Water Project', description: 'Provide clean water to communities in need.', category: 'water', imageUrl: 'https://placehold.co/600x400.png?text=Water' },
    { campaignId: '4', name: 'Animal Shelter Support', description: 'Help local animal shelters provide care.', category: 'animals', imageUrl: 'https://placehold.co/600x400.png?text=Animals' },
    { campaignId: '5', name: 'Tech for Good', description: 'Support initiatives using technology for social impact.', category: 'technology', imageUrl: 'https://placehold.co/600x400.png?text=Tech' },

  ];

  // Filter campaigns based on user preferences (simplified).
  const filteredCampaigns = campaigns.filter(campaign => {
    return input.preferences.toLowerCase().includes(campaign.category.toLowerCase());
  });

  return filteredCampaigns;
});

const prompt = ai.definePrompt({
  name: 'personalizedCampaignRecommendationsPrompt',
  input: {
    schema: PersonalizedCampaignRecommendationsInputSchema,
  },
  output: {
    schema: PersonalizedCampaignRecommendationsOutputSchema,
  },
  tools: [getCampaigns],
  prompt: `Based on the user's donation history of the following campaign IDs: {{{donationHistory}}},
  and preferences: {{{preferences}}},
  recommend campaigns that align with their interests using the getCampaigns tool. Return an array of
campaigns that the user may be interested in.
`,
});

const personalizedCampaignRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedCampaignRecommendationsFlow',
    inputSchema: PersonalizedCampaignRecommendationsInputSchema,
    outputSchema: PersonalizedCampaignRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
