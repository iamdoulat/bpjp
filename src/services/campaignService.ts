
// src/services/campaignService.ts
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, Timestamp, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';

// Extended CampaignData to include raisedAmount and id for display purposes
export interface CampaignData {
  id?: string; // Optional because it's not present when creating, but is when fetching
  campaignTitle: string;
  description: string;
  goalAmount: number;
  startDate: Date | Timestamp; // Allow Timestamp when fetching
  endDate: Date | Timestamp;   // Allow Timestamp when fetching
  campaignImageUrl?: string;
  organizerName?: string;
  initialStatus: "draft" | "upcoming" | "active" | "completed"; // Added completed
  createdAt: Timestamp;
  raisedAmount: number; // New field for amount raised
}

// Type for data being added to Firestore (Dates are JS Dates)
export interface NewCampaignInputData {
  campaignTitle: string;
  description: string;
  goalAmount: number;
  startDate: Date;
  endDate: Date;
  campaignImageUrl?: string;
  organizerName?: string;
  initialStatus: "draft" | "upcoming" | "active"; // "completed" is not an initial status
}


export async function addCampaign(campaignData: NewCampaignInputData): Promise<string> {
  try {
    const dataWithTimestampAndRaised: Omit<CampaignData, 'id' | 'startDate' | 'endDate'> & { startDate: Timestamp, endDate: Timestamp } = {
      ...campaignData,
      startDate: Timestamp.fromDate(campaignData.startDate),
      endDate: Timestamp.fromDate(campaignData.endDate),
      raisedAmount: 0, // Default raised amount to 0 on creation
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'campaigns'), dataWithTimestampAndRaised);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document to Firestore: ", error);
    if (error instanceof Error) {
      throw new Error(`Failed to add campaign: ${error.message}`);
    }
    throw new Error('An unknown error occurred while adding the campaign.');
  }
}

// Function to fetch all campaigns
export async function getCampaigns(): Promise<CampaignData[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "campaigns"));
    const campaigns: CampaignData[] = [];
    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      campaigns.push({
        id: doc.id,
        campaignTitle: data.campaignTitle,
        description: data.description,
        goalAmount: data.goalAmount,
        // Convert Firestore Timestamps to JS Dates
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
        campaignImageUrl: data.campaignImageUrl,
        organizerName: data.organizerName,
        initialStatus: data.initialStatus as "draft" | "upcoming" | "active" | "completed",
        createdAt: data.createdAt as Timestamp, // Keep as Timestamp or convert if needed
        raisedAmount: data.raisedAmount || 0, // Ensure raisedAmount is present
      });
    });
    return campaigns;
  } catch (error) {
    console.error("Error fetching campaigns from Firestore: ", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching campaigns.');
  }
}
