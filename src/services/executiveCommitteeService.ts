// src/services/executiveCommitteeService.ts
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';

export interface ExecutiveCommitteeData {
  id?: string; // document ID, usually 'mainContent'
  content: string; // HTML content or Markdown
  lastUpdated?: Timestamp;
}

const COMMITTEE_DOC_ID = 'mainContent'; // Storing content under a generic ID
const SITE_CONTENT_COLLECTION = 'executiveCommittee'; // A dedicated collection for this

export async function getExecutiveCommitteeData(): Promise<ExecutiveCommitteeData | null> {
  try {
    const docRef = doc(db, SITE_CONTENT_COLLECTION, COMMITTEE_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        content: data.content || "",
        lastUpdated: data.lastUpdated as Timestamp,
      } as ExecutiveCommitteeData;
    }
    // If document doesn't exist, return default structure for initial setup
    return {
        id: COMMITTEE_DOC_ID,
        content: "",
        lastUpdated: undefined,
    };
  } catch (error) {
    console.error("Error fetching executive committee data:", error);
    if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
        throw new Error(`Failed to fetch committee data: Firestore permission denied for '${SITE_CONTENT_COLLECTION}/${COMMITTEE_DOC_ID}'.`);
    }
     // Return default structure on error to prevent page crash
     return {
        id: COMMITTEE_DOC_ID,
        content: "Could not load content due to an error.",
        lastUpdated: undefined,
    };
  }
}

export async function saveExecutiveCommitteeData(content: string): Promise<void> {
  try {
    const docRef = doc(db, SITE_CONTENT_COLLECTION, COMMITTEE_DOC_ID);
    await setDoc(docRef, {
      content,
      lastUpdated: serverTimestamp(),
    }, { merge: true }); // Use merge to create if not exists, or update if it does
  } catch (error) {
    console.error("Error saving executive committee data:", error);
    if (error instanceof Error) {
        if (error.message.includes("Missing or insufficient permissions")) {
          throw new Error(`Failed to save committee data: Firestore permission denied. Ensure admin has write access to '${SITE_CONTENT_COLLECTION}/${COMMITTEE_DOC_ID}'.`);
        }
        throw new Error(`Failed to save committee data: ${error.message}`);
    }
    throw new Error('An unknown error occurred while saving executive committee data.');
  }
}
