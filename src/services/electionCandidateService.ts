// src/services/electionCandidateService.ts
import { db, storage, auth } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  orderBy,
  query,
  where,
  runTransaction,
  increment,
  getDoc,
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export type CandidatePosition = 'President' | 'GeneralSecretary';

export interface ElectionCandidateData {
  id: string; // Firestore document ID
  name: string;
  electionSymbol: string;
  position: CandidatePosition;
  imageUrl?: string | null;
  imagePath?: string | null; // For Firebase Storage path
  createdAt: Timestamp;
  lastUpdated?: Timestamp; 
  voteCount: number;
}

export interface NewCandidateInput {
  name: string;
  electionSymbol: string;
  position: CandidatePosition;
  imageFile?: File | null;
}

export interface UpdateCandidateInput {
  name?: string;
  electionSymbol?: string;
}


const ELECTION_CANDIDATES_COLLECTION = 'electionCandidates';
const ELECTION_VOTES_COLLECTION = 'electionVotes';
const CANDIDATE_IMAGE_STORAGE_PATH = 'election_candidates';


async function uploadCandidateImage(file: File, position: CandidatePosition, candidateDocId: string): Promise<{ imageUrl: string, imagePath: string }> {
  const timestamp = new Date().getTime();
  const uniqueFileName = `${candidateDocId}_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
  const storagePath = `${CANDIDATE_IMAGE_STORAGE_PATH}/${position}/${uniqueFileName}`;
  const imageStorageRef = ref(storage, storagePath);

  try {
    const snapshot = await uploadBytes(imageStorageRef, file);
    const imageUrl = await getDownloadURL(snapshot.ref);
    return { imageUrl, imagePath: storagePath };
  } catch (uploadError: any) {
    console.error("[electionCandidateService.uploadCandidateImage] Error uploading image: ", uploadError);
    if (uploadError.code === 'storage/unauthorized') {
        throw new Error(`Failed to upload candidate image: Firebase Storage permission denied. Path: ${storagePath}`);
    }
    throw new Error(`Failed to upload candidate image: ${uploadError.message || 'Unknown storage error'}`);
  }
}

async function deleteCandidateImage(imagePath?: string | null): Promise<void> {
  if (!imagePath) return;
  const imageRef = ref(storage, imagePath);
  try {
    await deleteObject(imageRef);
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.warn(`[electionCandidateService.deleteCandidateImage] Image not found, skipping deletion: ${imagePath}`);
    } else {
      console.error(`[electionCandidateService.deleteCandidateImage] Error deleting image ${imagePath}:`, error);
    }
  }
}

export async function addCandidate(data: NewCandidateInput): Promise<string> {
  if (!auth.currentUser) {
    throw new Error("User must be authenticated to add a candidate.");
  }
  try {
    const candidateDataForFirestore: Omit<ElectionCandidateData, 'id' | 'imageUrl' | 'imagePath' | 'createdAt' | 'lastUpdated'> & { createdAt: Timestamp, imageUrl?: null, imagePath?: null, lastUpdated?: Timestamp } = {
      name: data.name,
      electionSymbol: data.electionSymbol,
      position: data.position,
      voteCount: 0,
      createdAt: serverTimestamp() as Timestamp,
      lastUpdated: serverTimestamp() as Timestamp,
      imageUrl: null,
      imagePath: null,
    };
    const candidateDocRef = await addDoc(collection(db, ELECTION_CANDIDATES_COLLECTION), candidateDataForFirestore);
    const candidateId = candidateDocRef.id;

    let imageDetails: { imageUrl: string, imagePath: string } | undefined;
    if (data.imageFile) {
      imageDetails = await uploadCandidateImage(data.imageFile, data.position, candidateId);
      await updateDoc(candidateDocRef, {
        imageUrl: imageDetails.imageUrl,
        imagePath: imageDetails.imagePath,
      });
    }
    return candidateId;

  } catch (error) {
    console.error("[electionCandidateService.addCandidate] Error:", error);
    if (error instanceof Error) {
      if (error.message.includes("Missing or insufficient permissions")) {
        throw new Error(`Failed to add candidate: Firestore permission denied for collection '${ELECTION_CANDIDATES_COLLECTION}'.`);
      }
      if (error.message.startsWith("Failed to upload candidate image:")) {
        throw error;
      }
      throw new Error(`Failed to add candidate: ${error.message}`);
    }
    throw new Error('An unknown error occurred while adding the candidate.');
  }
}


export async function getCandidatesByPosition(position: CandidatePosition): Promise<ElectionCandidateData[]> {
  try {
    const candidatesCollectionRef = collection(db, ELECTION_CANDIDATES_COLLECTION);
    const q = query(candidatesCollectionRef, where("position", "==", position), orderBy("createdAt", "asc"));
    const querySnapshot = await getDocs(q);
    const candidates: ElectionCandidateData[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data();
      candidates.push({
        id: docSnap.id,
        name: data.name,
        electionSymbol: data.electionSymbol,
        position: data.position as CandidatePosition,
        imageUrl: data.imageUrl || null,
        imagePath: data.imagePath || null,
        createdAt: data.createdAt as Timestamp,
        lastUpdated: data.lastUpdated as Timestamp,
        voteCount: data.voteCount || 0,
      });
    });
    return candidates;
  } catch (error) {
    console.error(`[electionCandidateService.getCandidatesByPosition] Error fetching candidates for ${position}:`, error);
     if (error instanceof Error) {
       if (error.message.includes("Missing or insufficient permissions")) {
        throw new Error(`Failed to fetch candidates: Firestore permission denied for collection '${ELECTION_CANDIDATES_COLLECTION}' with position filter.`);
      }
       if (error.message.toLowerCase().includes("query requires an index") || error.message.toLowerCase().includes("the query requires an index")) {
        const indexCreationLinkMatch = error.message.match(/(https?:\/\/[^\s]+)/);
        const indexLink = indexCreationLinkMatch ? indexCreationLinkMatch[0] : "Please check the Firebase console.";
        throw new Error(`Failed to fetch candidates: The query on '${ELECTION_CANDIDATES_COLLECTION}' requires a composite index for 'position' (asc) and 'createdAt' (asc). You might need to create it in your Firebase console. Link from error (if available): ${indexLink}`);
      }
      throw new Error(`Failed to fetch candidates: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching candidates.');
  }
}

export interface UserVoteData {
  userId: string;
  presidentCandidateId?: string | null;
  generalSecretaryCandidateId?: string | null;
  lastVotedAt?: Timestamp;
}

export async function getUserVotes(userId: string): Promise<UserVoteData | null> {
  if (!userId) return null;
  try {
    const voteDocRef = doc(db, ELECTION_VOTES_COLLECTION, userId);
    const docSnap = await getDoc(voteDocRef);
    if (docSnap.exists()) {
      return { userId, ...(docSnap.data() as Omit<UserVoteData, 'userId'>) };
    }
    return null;
  } catch (error) {
    console.error(`[electionCandidateService.getUserVotes] Error fetching votes for user ${userId}:`, error);
    if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
        throw new Error(`Failed to fetch user votes: Firestore permission denied for 'electionVotes/${userId}'.`);
    }
    throw error;
  }
}

export async function recordVote(
  userId: string,
  candidateId: string,
  candidateName: string,
  position: CandidatePosition
): Promise<void> {
  if (!userId) throw new Error("User ID is required to record a vote.");
  if (!candidateId) throw new Error("Candidate ID is required.");
  if (!position) throw new Error("Candidate position is required.");

  const userVoteDocRef = doc(db, ELECTION_VOTES_COLLECTION, userId);
  const candidateDocRef = doc(db, ELECTION_CANDIDATES_COLLECTION, candidateId);

  try {
    await runTransaction(db, async (transaction) => {
      const userVoteSnap = await transaction.get(userVoteDocRef);
      const candidateSnap = await transaction.get(candidateDocRef);

      if (!candidateSnap.exists()) {
        throw new Error(`Candidate ${candidateId} not found.`);
      }
      const candidateData = candidateSnap.data() as ElectionCandidateData;
      if (candidateData.position !== position) {
          throw new Error(`Candidate ${candidateName} is not running for the ${position} position.`);
      }

      const userVoteData = userVoteSnap.exists() ? userVoteSnap.data() as UserVoteData : { userId };
      
      const voteField = position === 'President' ? 'presidentCandidateId' : 'generalSecretaryCandidateId';

      if (userVoteData[voteField]) {
        throw new Error(`You have already cast your vote for ${position}.`);
      }

      const updatedVoteData: UserVoteData = {
        ...userVoteData,
        [voteField]: candidateId,
        lastVotedAt: serverTimestamp() as Timestamp,
      };
      transaction.set(userVoteDocRef, updatedVoteData, { merge: true });
      transaction.update(candidateDocRef, { voteCount: increment(1) });
    });
    console.log(`[electionCandidateService.recordVote] Vote by ${userId} for ${candidateName} (${candidateId}) for ${position} recorded.`);
  } catch (error) {
    console.error(`[electionCandidateService.recordVote] Error recording vote:`, error);
    if (error instanceof Error) {
        if (error.message.includes("Missing or insufficient permissions")) {
            throw new Error(`Failed to record vote: Firestore permission denied. Check rules for '${ELECTION_VOTES_COLLECTION}/${userId}' and '${ELECTION_CANDIDATES_COLLECTION}/${candidateId}'.`);
        }
        throw error;
    }
    throw new Error('An unknown error occurred while recording the vote.');
  }
}


export async function updateCandidate(
  candidateId: string,
  updates: UpdateCandidateInput,
  newImageFile?: File | null,
  currentImagePath?: string | null
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error("User must be authenticated to update a candidate.");
  }
  const candidateDocRef = doc(db, ELECTION_CANDIDATES_COLLECTION, candidateId);
  const dataToUpdate: Partial<Omit<ElectionCandidateData, 'id' | 'createdAt' | 'position' | 'voteCount'>> & { lastUpdated: Timestamp } = {
    ...updates,
    lastUpdated: serverTimestamp() as Timestamp,
  };

  try {
    const currentCandidateSnap = await getDoc(candidateDocRef);
    if (!currentCandidateSnap.exists()) {
      throw new Error("Candidate not found for update.");
    }
    const currentCandidateData = currentCandidateSnap.data() as ElectionCandidateData;

    if (newImageFile === null) { 
      if (currentCandidateData.imagePath) {
        await deleteCandidateImage(currentCandidateData.imagePath);
      }
      dataToUpdate.imageUrl = null;
      dataToUpdate.imagePath = null;
    } else if (newImageFile instanceof File) { 
      if (currentCandidateData.imagePath) {
        await deleteCandidateImage(currentCandidateData.imagePath);
      }
      const imageDetails = await uploadCandidateImage(newImageFile, currentCandidateData.position, candidateId);
      dataToUpdate.imageUrl = imageDetails.imageUrl;
      dataToUpdate.imagePath = imageDetails.imagePath;
    }

    await updateDoc(candidateDocRef, dataToUpdate);
  } catch (error) {
    console.error(`[electionCandidateService.updateCandidate] Error updating candidate ${candidateId}:`, error);
    if (error instanceof Error) {
      if (error.message.includes("Missing or insufficient permissions")) {
        throw new Error(`Failed to update candidate: Firestore/Storage permission denied for candidate '${candidateId}'.`);
      }
      if (error.message.startsWith("Failed to upload candidate image:")) { 
        throw error;
      }
      throw new Error(`Failed to update candidate: ${error.message}`);
    }
    throw new Error('An unknown error occurred while updating the candidate.');
  }
}

export async function deleteCandidate(candidateId: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error("User must be authenticated to delete a candidate.");
  }
  const candidateDocRef = doc(db, ELECTION_CANDIDATES_COLLECTION, candidateId);
  try {
    const candidateSnap = await getDoc(candidateDocRef);
    if (candidateSnap.exists()) {
      const candidateData = candidateSnap.data() as ElectionCandidateData;
      if (candidateData.imagePath) {
        await deleteCandidateImage(candidateData.imagePath);
      }
      await deleteDoc(candidateDocRef);
    } else {
      console.warn(`[electionCandidateService.deleteCandidate] Candidate ${candidateId} not found. Skipping deletion.`);
    }
  } catch (error) {
    console.error(`[electionCandidateService.deleteCandidate] Error deleting candidate ${candidateId}:`, error);
    if (error instanceof Error) {
      if (error.message.includes("Missing or insufficient permissions")) {
        throw new Error(`Failed to delete candidate: Firestore/Storage permission denied for candidate '${candidateId}'.`);
      }
      throw new Error(`Failed to delete candidate: ${error.message}`);
    }
    throw new Error('An unknown error occurred while deleting the candidate.');
  }
}
