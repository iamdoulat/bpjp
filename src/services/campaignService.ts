
// src/services/campaignService.ts
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import type { z } from 'zod';

// Assuming newCampaignFormSchema is defined similarly in the page,
// we create a type for the data structure expected by Firestore.
// The actual Zod schema is in the component, so we define a compatible type here.
export interface CampaignData {
  campaignTitle: string;
  description: string;
  goalAmount: number;
  startDate: Date; // Will be converted to Timestamp by Firestore
  endDate: Date;   // Will be converted to Timestamp by Firestore
  campaignImageUrl?: string;
  organizerName?: string;
  initialStatus: "draft" | "upcoming" | "active";
  createdAt: Timestamp;
}

export async function addCampaign(campaignData: Omit<CampaignData, 'createdAt'>): Promise<string> {
  try {
    const dataWithTimestamp: CampaignData = {
      ...campaignData,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'campaigns'), dataWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document to Firestore: ", error);
    if (error instanceof Error) {
      throw new Error(`Failed to add campaign: ${error.message}`);
    }
    throw new Error('An unknown error occurred while adding the campaign.');
  }
}
