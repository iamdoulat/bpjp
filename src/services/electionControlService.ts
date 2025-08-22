// src/services/electionControlService.ts
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getUserProfile } from './userService';

const ELECTION_CONTROL_COLLECTION = 'electionControl';
const MAIN_ELECTION_DOC_ID = 'mainElection';

export interface ElectionControlSettings {
  resultsPublished: boolean;
  votingClosed: boolean;
  voteInstructions?: string | null; // Added voteInstructions
  lastUpdated?: Timestamp;
}

async function verifyAdminRole(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Authentication required. Please log in.");
  }
  const userProfile = await getUserProfile(user.uid);
  if (userProfile?.role !== 'admin') {
    throw new Error("Permission denied. You must be an administrator to perform this action.");
  }
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
        voteInstructions: data.voteInstructions || null, // Fetch instructions
        lastUpdated: data.lastUpdated as Timestamp,
      };
    }
    console.warn(`[electionControlService.getElectionControlSettings] Document '${ELECTION_CONTROL_COLLECTION}/${MAIN_ELECTION_DOC_ID}' not found. Returning default settings. Ensure this document is initialized if needed.`);
    return { resultsPublished: false, votingClosed: false, voteInstructions: null };
  } catch (error) {
    console.error("[electionControlService.getElectionControlSettings] Error fetching settings:", error);
    if (error instanceof Error && (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied")) {
        throw new Error(`Failed to fetch election settings: Firestore permission denied for '${ELECTION_CONTROL_COLLECTION}/${MAIN_ELECTION_DOC_ID}'. Ensure public read access or appropriate admin rules.`);
    }
    return { resultsPublished: false, votingClosed: false, voteInstructions: null };
  }
}

// Sets the results published status. Publishing results also closes voting.
export async function setResultsPublished(isPublic: boolean): Promise<void> {
  await verifyAdminRole();
  try {
    const docRef = doc(db, ELECTION_CONTROL_COLLECTION, MAIN_ELECTION_DOC_ID);
    await setDoc(docRef, {
      resultsPublished: isPublic,
      votingClosed: isPublic, // When results go public, voting is automatically closed.
      lastUpdated: serverTimestamp(),
    }, { merge: true });
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

// Function to update specific election control settings, including vote instructions
export async function updateElectionControlSettings(updates: Partial<ElectionControlSettings>): Promise<void> {
  await verifyAdminRole();
  try {
    const docRef = doc(db, ELECTION_CONTROL_COLLECTION, MAIN_ELECTION_DOC_ID);
    const dataToUpdate = {
      ...updates,
      lastUpdated: serverTimestamp(),
    };
    await setDoc(docRef, dataToUpdate, { merge: true });
  } catch (error) {
    console.error("[electionControlService.updateElectionControlSettings] Error updating settings:", error);
    if (error instanceof Error) {
      if (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied") {
        throw new Error(`Failed to update election control settings: Firestore permission denied. Ensure admin user has write access to '${ELECTION_CONTROL_COLLECTION}/${MAIN_ELECTION_DOC_ID}'.`);
      }
      throw new Error(`Failed to update election control settings: ${error.message}`);
    }
    throw new Error('An unknown error occurred while updating election control settings.');
  }
}
