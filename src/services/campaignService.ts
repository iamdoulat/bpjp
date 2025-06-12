
// src/services/campaignService.ts
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, Timestamp, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';

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

// Type for data being updated in Firestore
export interface CampaignUpdateData {
  campaignTitle: string;
  description: string;
  goalAmount: number;
  startDate: Date;
  endDate: Date;
  campaignImageUrl?: string;
  organizerName?: string;
  initialStatus: "draft" | "upcoming" | "active" | "completed"; // Allow setting to completed during edit
}


export async function addCampaign(campaignData: NewCampaignInputData): Promise<string> {
  try {
    const dataWithTimestampAndRaised: Omit<CampaignData, 'id' | 'startDate' | 'endDate'> & { startDate: Timestamp, endDate: Timestamp, initialStatus: NewCampaignInputData["initialStatus"] } = {
      ...campaignData,
      startDate: Timestamp.fromDate(campaignData.startDate),
      endDate: Timestamp.fromDate(campaignData.endDate),
      raisedAmount: 0, // Default raised amount to 0 on creation
      createdAt: Timestamp.now(),
      initialStatus: campaignData.initialStatus,
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
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
        campaignImageUrl: data.campaignImageUrl,
        organizerName: data.organizerName,
        initialStatus: data.initialStatus as "draft" | "upcoming" | "active" | "completed",
        createdAt: data.createdAt as Timestamp,
        raisedAmount: data.raisedAmount || 0,
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

// Function to fetch a single campaign by ID
export async function getCampaignById(id: string): Promise<CampaignData | null> {
  try {
    const docRef = doc(db, "campaigns", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        campaignTitle: data.campaignTitle,
        description: data.description,
        goalAmount: data.goalAmount,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
        campaignImageUrl: data.campaignImageUrl,
        organizerName: data.organizerName,
        initialStatus: data.initialStatus as "draft" | "upcoming" | "active" | "completed",
        createdAt: data.createdAt as Timestamp,
        raisedAmount: data.raisedAmount || 0,
      };
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching campaign by ID from Firestore: ", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch campaign: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching the campaign.');
  }
}

// Function to update an existing campaign
export async function updateCampaign(id: string, campaignData: CampaignUpdateData): Promise<void> {
  try {
    const docRef = doc(db, "campaigns", id);
    // Convert JS Dates back to Firestore Timestamps for updating
    const dataToUpdate = {
      ...campaignData,
      startDate: Timestamp.fromDate(campaignData.startDate),
      endDate: Timestamp.fromDate(campaignData.endDate),
    };
    // Log the data being sent to Firestore for debugging
    console.log(`[campaignService.updateCampaign] Attempting to update campaign ${id} with data:`, JSON.parse(JSON.stringify(dataToUpdate)));
    await updateDoc(docRef, dataToUpdate);
    console.log(`[campaignService.updateCampaign] Successfully updated campaign ${id}.`);
  } catch (error) {
    console.error(`[campaignService.updateCampaign] Error updating campaign ${id}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to update campaign ${id}: ${error.message}`);
    }
    throw new Error(`An unknown error occurred while updating campaign ${id}.`);
  }
}

