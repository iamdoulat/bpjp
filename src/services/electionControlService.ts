
// src/services/electionControlService.ts
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

const ELECTION_CONTROL_COLLECTION = 'electionControl';
const MAIN_ELECTION_DOC_ID = 'mainElection';

export interface ElectionControlSettings {
  resultsPublished: boolean;
  votingClosed: boolean;
  lastUpdated?: Timestamp;
}

// Gets the current election control settings. Defaults if not found.
export async function getElectionControlSettings(): Promise<ElectionControlSettings> {
  try {
    const docRef = doc(db, ELECTION_CONTROL_COLLECTION, MAIN_ELECTION_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        resultsPublished: data.resultsPublished || false,
        votingClosed: data.votingClosed || false,
        lastUpdated: data.lastUpdated as Timestamp,
      };
    }
    // Default settings if document doesn't exist
    console.warn(`[electionControlService.getElectionControlSettings] Document '${ELECTION_CONTROL_COLLECTION}/${MAIN_ELECTION_DOC_ID}' not found. Returning default settings. Ensure this document is initialized if needed.`);
    return { resultsPublished: false, votingClosed: false };
  } catch (error) {
    console.error("[electionControlService.getElectionControlSettings] Error fetching settings:", error);
    if (error instanceof Error && (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied")) {
        throw new Error(`Failed to fetch election settings: Firestore permission denied for '${ELECTION_CONTROL_COLLECTION}/${MAIN_ELECTION_DOC_ID}'. Ensure this document is readable by users (e.g., via 'allow read: if true;' or 'allow read: if request.auth != null;').`);
    }
    // Fallback to default on other errors to prevent page crashes, but log the error.
    return { resultsPublished: false, votingClosed: false };
  }
}

// Sets the results published status. Publishing results also closes voting.
export async function setResultsPublished(isPublic: boolean): Promise<void> {
  try {
    const docRef = doc(db, ELECTION_CONTROL_COLLECTION, MAIN_ELECTION_DOC_ID);
    await setDoc(docRef, {
      resultsPublished: isPublic,
      votingClosed: isPublic, // When results go public, voting is automatically closed.
      lastUpdated: serverTimestamp(),
    }, { merge: true }); // Use merge to create if not exists, or update if it does
  } catch (error) {
    console.error("[electionControlService.setResultsPublished] Error setting results status:", error);
    if (error instanceof Error) {
        if (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied") {
            throw new Error(`Failed to update election settings: Firestore permission denied. Ensure admin user has write access to '${ELECTION_CONTROL_COLLECTION}/${MAIN_ELECTION_DOC_ID}'.`);
        }
        throw new Error(`Failed to update election settings: ${error.message}`);
    }
    throw new Error('An unknown error occurred while updating election settings.');
  }
}

