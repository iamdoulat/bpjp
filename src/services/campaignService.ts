
// src/services/campaignService.ts
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, Timestamp, type DocumentData, type QueryDocumentSnapshot, runTransaction, deleteDoc, writeBatch } from 'firebase/firestore';
import { deleteImageFromStorage } from '@/lib/firebase'; // Import deleteImageFromStorage

// Extended CampaignData to include raisedAmount, id, likeCount, and supportCount for display purposes
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
  raisedAmount: number;
  likeCount: number; // New field for like count
  supportCount: number; // New field for support count
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
    const dataWithTimestampAndCounters: Omit<CampaignData, 'id' | 'startDate' | 'endDate'> & { startDate: Timestamp, endDate: Timestamp, initialStatus: NewCampaignInputData["initialStatus"] } = {
      ...campaignData,
      startDate: Timestamp.fromDate(campaignData.startDate),
      endDate: Timestamp.fromDate(campaignData.endDate),
      raisedAmount: 0,
      likeCount: 0, // Initialize likeCount
      supportCount: 0, // Initialize supportCount
      createdAt: Timestamp.now(),
      initialStatus: campaignData.initialStatus,
    };
    const docRef = await addDoc(collection(db, 'campaigns'), dataWithTimestampAndCounters);
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
        likeCount: data.likeCount || 0, // Retrieve likeCount, default to 0
        supportCount: data.supportCount || 0, // Retrieve supportCount, default to 0
      });
    });
    return campaigns;
  } catch (error) {
    console.error("[campaignService.getCampaigns] Error fetching campaigns from Firestore: ", error);
    if (error instanceof Error) {
      if (error.message.includes("Missing or insufficient permissions")) {
        console.error("[campaignService.getCampaigns] FIREBASE PERMISSION_DENIED: Check Firestore security rules for the 'campaigns' collection to allow read access.");
      }
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
        likeCount: data.likeCount || 0, // Retrieve likeCount, default to 0
        supportCount: data.supportCount || 0, // Retrieve supportCount, default to 0
      };
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching campaign by ID from Firestore: ", error);
    if (error instanceof Error) {
      if (error.message.includes("Missing or insufficient permissions")) {
        console.error(`[campaignService.getCampaignById] FIREBASE PERMISSION_DENIED: Check Firestore security rules for reading document from 'campaigns/${id}'.`);
      }
      throw new Error(`Failed to fetch campaign: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching the campaign.');
  }
}

// Function to update an existing campaign
export async function updateCampaign(id: string, campaignData: CampaignUpdateData): Promise<void> {
  try {
    const docRef = doc(db, "campaigns", id);
    const dataToUpdate = {
      ...campaignData,
      startDate: Timestamp.fromDate(campaignData.startDate),
      endDate: Timestamp.fromDate(campaignData.endDate),
    };
    await updateDoc(docRef, dataToUpdate);
  } catch (error) {
    console.error(`Error updating campaign ${id}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to update campaign ${id}: ${error.message}`);
    }
    throw new Error(`An unknown error occurred while updating campaign ${id}.`);
  }
}

// Function to delete a campaign
export async function deleteCampaign(campaignId: string): Promise<void> {
  if (!campaignId) {
    throw new Error("Campaign ID is required to delete a campaign.");
  }
  const campaignDocRef = doc(db, "campaigns", campaignId);
  try {
    const campaignSnap = await getDoc(campaignDocRef);
    if (!campaignSnap.exists()) {
      console.warn(`Campaign ${campaignId} not found. Skipping deletion.`);
      return;
    }
    const campaignData = campaignSnap.data() as CampaignData;

    // Delete associated image from Firebase Storage if it exists
    if (campaignData.campaignImageUrl && !campaignData.campaignImageUrl.includes('placehold.co')) {
      // The deleteImageFromStorage function in firebase.ts handles checks for valid Firebase Storage URLs.
      await deleteImageFromStorage(campaignData.campaignImageUrl);
    }

    // Delete the campaign document from Firestore
    await deleteDoc(campaignDocRef);
    console.log(`Campaign ${campaignId} and its associated image (if any) deleted successfully.`);

    // Optionally, delete related subcollections like 'likes' and 'supports'
    const likesColRef = collection(db, "campaigns", campaignId, "likes");
    const supportsColRef = collection(db, "campaigns", campaignId, "supports");

    const batch = writeBatch(db);
    const likesSnapshot = await getDocs(likesColRef);
    likesSnapshot.forEach(doc => batch.delete(doc.ref));

    const supportsSnapshot = await getDocs(supportsColRef);
    supportsSnapshot.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
    console.log(`Subcollections for campaign ${campaignId} (likes, supports) also deleted.`);

  } catch (error) {
    console.error(`Error deleting campaign ${campaignId}:`, error);
    if (error instanceof Error) {
      if (error.message.includes("Missing or insufficient permissions")) {
         console.error(`[campaignService.deleteCampaign] FIREBASE PERMISSION_DENIED: Check Firestore security rules for deleting document 'campaigns/${campaignId}' and its subcollections/storage objects.`);
      }
      throw new Error(`Failed to delete campaign: ${error.message}`);
    }
    throw new Error('An unknown error occurred while deleting the campaign.');
  }
}


// Type for reaction
export type ReactionType = 'like' | 'support';

// Function to get user's reactions for a specific campaign
export async function getUserReactionsForCampaign(campaignId: string, userId: string): Promise<{ liked: boolean; supported: boolean }> {
  if (!userId) return { liked: false, supported: false };
  try {
    const likeDocRef = doc(db, "campaigns", campaignId, "likes", userId);
    const supportDocRef = doc(db, "campaigns", campaignId, "supports", userId);

    const [likeSnap, supportSnap] = await Promise.all([
      getDoc(likeDocRef),
      getDoc(supportDocRef)
    ]);

    return {
      liked: likeSnap.exists(),
      supported: supportSnap.exists(),
    };
  } catch (error) {
    console.error(`Error fetching user reactions for campaign ${campaignId}, user ${userId}:`, error);
    return { liked: false, supported: false }; // Default to false on error
  }
}

// Function to toggle a reaction (like or support)
export async function toggleCampaignReaction(campaignId: string, userId: string, reactionType: ReactionType): Promise<{ newCount: number; userHasReacted: boolean }> {
  if (!userId) throw new Error("User ID is required to react.");

  const campaignDocRef = doc(db, "campaigns", campaignId);
  const reactionSubcollectionName = reactionType === 'like' ? 'likes' : 'supports';
  const countFieldName = reactionType === 'like' ? 'likeCount' : 'supportCount';
  const userReactionDocRef = doc(db, "campaigns", campaignId, reactionSubcollectionName, userId);

  try {
    let newCount = 0;
    let userHasReacted = false;

    await runTransaction(db, async (transaction) => {
      const campaignSnap = await transaction.get(campaignDocRef);
      if (!campaignSnap.exists()) {
        throw new Error(`Campaign ${campaignId} not found.`);
      }
      const campaignData = campaignSnap.data() as CampaignData;
      const currentCount = campaignData[countFieldName] || 0;
      const userReactionSnap = await transaction.get(userReactionDocRef);

      if (userReactionSnap.exists()) {
        // User is removing their reaction
        transaction.delete(userReactionDocRef);
        newCount = Math.max(0, currentCount - 1);
        userHasReacted = false;
      } else {
        // User is adding their reaction
        transaction.set(userReactionDocRef, { reactedAt: Timestamp.now() }); // Store a timestamp or empty object
        newCount = currentCount + 1;
        userHasReacted = true;
      }
      transaction.update(campaignDocRef, { [countFieldName]: newCount });
    });

    return { newCount, userHasReacted };
  } catch (error) {
    console.error(`Error toggling ${reactionType} for campaign ${campaignId} by user ${userId}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to toggle ${reactionType}: ${error.message}`);
    }
    throw new Error(`An unknown error occurred while toggling ${reactionType}.`);
  }
}

