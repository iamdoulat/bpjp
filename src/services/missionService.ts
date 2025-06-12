
// src/services/missionService.ts
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';

export interface MissionData {
  id?: string; // document ID, usually 'ourMissionContent'
  title: string;
  content: string; // HTML content or Markdown
  lastUpdated?: Timestamp;
}

const MISSION_DOC_ID = 'ourMissionContent';
const SITE_CONTENT_COLLECTION = 'siteContent';

export async function getMissionData(): Promise<MissionData | null> {
  try {
    const docRef = doc(db, SITE_CONTENT_COLLECTION, MISSION_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || "Our Mission", // Default title if not set
        content: data.content || "Mission content will be displayed here once set by an administrator.", // Default content
        lastUpdated: data.lastUpdated as Timestamp,
      } as MissionData;
    }
    // If document doesn't exist, return default structure for initial setup
    return {
        id: MISSION_DOC_ID,
        title: "Our Mission",
        content: "Mission content has not been set up yet. Please check back later.",
        lastUpdated: undefined,
    };
  } catch (error) {
    console.error("Error fetching mission data:", error);
    // Return default structure on error as well to prevent page crash
     return {
        id: MISSION_DOC_ID,
        title: "Error Loading Mission",
        content: "Could not load mission content due to an error.",
        lastUpdated: undefined,
    };
  }
}

export async function saveMissionData(title: string, content: string): Promise<void> {
  try {
    const docRef = doc(db, SITE_CONTENT_COLLECTION, MISSION_DOC_ID);
    await setDoc(docRef, {
      title,
      content,
      lastUpdated: serverTimestamp(),
    }, { merge: true }); // Use merge to create if not exists, or update if it does
  } catch (error) {
    console.error("Error saving mission data:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to save mission data: ${error.message}`);
    }
    throw new Error('An unknown error occurred while saving mission data.');
  }
}
