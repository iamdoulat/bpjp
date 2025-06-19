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
}

export interface NewCandidateInput {
  name: string;
  electionSymbol: string;
  position: CandidatePosition;
  imageFile?: File | null;
}

// For now, update and new are similar; can be expanded later
export interface UpdateCandidateInput extends Partial<NewCandidateInput> {}

const ELECTION_CANDIDATES_COLLECTION = 'electionCandidates';
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
    // Create an initial document to get an ID
    const candidateDataForId: Omit<ElectionCandidateData, 'id' | 'imageUrl' | 'imagePath' | 'createdAt'> & { createdAt: Timestamp, imageUrl?: null, imagePath?: null } = {
      name: data.name,
      electionSymbol: data.electionSymbol,
      position: data.position,
      createdAt: serverTimestamp() as Timestamp,
      imageUrl: null,
      imagePath: null,
    };
    const candidateDocRef = await addDoc(collection(db, ELECTION_CANDIDATES_COLLECTION), candidateDataForId);
    const candidateId = candidateDocRef.id;

    let imageDetails: { imageUrl: string, imagePath: string } | undefined;
    if (data.imageFile) {
      imageDetails = await uploadCandidateImage(data.imageFile, data.position, candidateId);
      // Update the document with image details
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
        throw new Error(`Failed to fetch candidates: The query on '${ELECTION_CANDIDATES_COLLECTION}' requires a composite index for 'position' (asc) and 'createdAt' (asc). Create it here: ${indexLink} (Link may also be in browser console).`);
      }
      throw new Error(`Failed to fetch candidates: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching candidates.');
  }
}
// Placeholder for updateCandidate - to be implemented later
export async function updateCandidate(candidateId: string, updates: UpdateCandidateInput, newImageFile?: File | null): Promise<void> {
    console.log("updateCandidate called with:", candidateId, updates, newImageFile);
    // Similar logic to addCandidate: handle image upload/deletion, then update Firestore doc.
    // Fetch current candidate doc to get existing imagePath if needed for deletion.
    throw new Error("Update candidate functionality not yet implemented.");
}

// Placeholder for deleteCandidate - to be implemented later
export async function deleteCandidate(candidateId: string): Promise<void> {
    console.log("deleteCandidate called with:", candidateId);
    // Fetch candidate doc to get imagePath for deletion from Storage.
    // Delete image from Storage.
    // Delete document from Firestore.
    throw new Error("Delete candidate functionality not yet implemented.");
}
