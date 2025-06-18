
// src/services/advisoryBoardService.ts
import { db, storage } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const SITE_CONTENT_COLLECTION = 'siteContent';
const ORGANIZATION_DETAILS_DOC_ID = 'organizationDetails'; // Assuming settings are stored here
const ADVISORY_BOARD_SUBCOLLECTION = 'advisoryBoardMembers';

export interface AdvisoryBoardMemberData {
  id: string;
  name: string;
  title: string;
  imageUrl?: string | null;
  imagePath?: string | null; // For Firebase Storage path
  createdAt: Timestamp;
}

export interface NewAdvisoryBoardMemberInput {
  name: string;
  title: string;
}

export interface UpdateAdvisoryBoardMemberInput {
  name?: string;
  title?: string;
}

async function uploadAdvisoryImage(file: File, memberId?: string): Promise<{ imageUrl: string, imagePath: string }> {
  const timestamp = new Date().getTime();
  const uniqueFileName = `member_${memberId || timestamp}_${file.name.replace(/\s+/g, '_')}`;
  const storagePath = `advisory_board_images/${uniqueFileName}`;
  const storageRef = ref(storage, storagePath);

  const snapshot = await uploadBytes(storageRef, file);
  const imageUrl = await getDownloadURL(snapshot.ref);
  return { imageUrl, imagePath: storagePath };
}

async function deleteAdvisoryImage(imagePath?: string | null) {
  if (imagePath) {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        console.warn(`Advisory image not found, skipping deletion: ${imagePath}`);
      } else {
        console.error(`Error deleting advisory image ${imagePath}:`, error);
      }
    }
  }
}

export async function addAdvisoryBoardMember(
  data: NewAdvisoryBoardMemberInput,
  imageFile?: File
): Promise<string> {
  try {
    let imageDetails: { imageUrl: string, imagePath: string } | undefined;
    if (imageFile) {
      // Upload first to get URL, memberId can be undefined here, so storage path uses timestamp
      imageDetails = await uploadAdvisoryImage(imageFile);
    }

    const membersCollectionRef = collection(db, SITE_CONTENT_COLLECTION, ORGANIZATION_DETAILS_DOC_ID, ADVISORY_BOARD_SUBCOLLECTION);
    const docRef = await addDoc(membersCollectionRef, {
      ...data,
      imageUrl: imageDetails?.imageUrl || null,
      imagePath: imageDetails?.imagePath || null,
      createdAt: serverTimestamp() as Timestamp,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding advisory board member:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to add advisory member: ${error.message}`);
    }
    throw new Error('An unknown error occurred.');
  }
}

export async function getAdvisoryBoardMembers(): Promise<AdvisoryBoardMemberData[]> {
  try {
    const membersCollectionRef = collection(db, SITE_CONTENT_COLLECTION, ORGANIZATION_DETAILS_DOC_ID, ADVISORY_BOARD_SUBCOLLECTION);
    const q = query(membersCollectionRef, orderBy("createdAt", "asc")); // Or "asc" if older members first
    const querySnapshot = await getDocs(q);
    const members: AdvisoryBoardMemberData[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data();
      members.push({
        id: docSnap.id,
        name: data.name,
        title: data.title,
        imageUrl: data.imageUrl || null,
        imagePath: data.imagePath || null,
        createdAt: data.createdAt as Timestamp,
      });
    });
    return members;
  } catch (error) {
    console.error("Error fetching advisory board members:", error);
    if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
        console.warn("Ensure Firestore rules allow reading the 'advisoryBoardMembers' subcollection.");
    }
    return []; // Return empty array on error to prevent page crashes
  }
}

export async function updateAdvisoryBoardMember(
  memberId: string,
  updates: UpdateAdvisoryBoardMemberInput,
  newImageFile?: File | null // null means remove existing image, undefined means no change to image
): Promise<void> {
  try {
    const memberDocRef = doc(db, SITE_CONTENT_COLLECTION, ORGANIZATION_DETAILS_DOC_ID, ADVISORY_BOARD_SUBCOLLECTION, memberId);
    const dataToUpdate: Partial<Omit<AdvisoryBoardMemberData, 'id' | 'createdAt'>> & { lastUpdated?: Timestamp } = {
      ...updates,
      lastUpdated: serverTimestamp() as Timestamp,
    };

    const currentMemberSnap = await getDoc(memberDocRef);
    const currentMemberData = currentMemberSnap.data() as AdvisoryBoardMemberData | undefined;

    if (newImageFile === null) { // Explicit request to remove image
      if (currentMemberData?.imagePath) {
        await deleteAdvisoryImage(currentMemberData.imagePath);
      }
      dataToUpdate.imageUrl = null;
      dataToUpdate.imagePath = null;
    } else if (newImageFile) { // New image provided
      if (currentMemberData?.imagePath) {
        await deleteAdvisoryImage(currentMemberData.imagePath);
      }
      const imageDetails = await uploadAdvisoryImage(newImageFile, memberId);
      dataToUpdate.imageUrl = imageDetails.imageUrl;
      dataToUpdate.imagePath = imageDetails.imagePath;
    }
    // If newImageFile is undefined, no change to image fields

    await updateDoc(memberDocRef, dataToUpdate);
  } catch (error) {
    console.error(`Error updating advisory member ${memberId}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to update advisory member: ${error.message}`);
    }
    throw new Error('An unknown error occurred.');
  }
}

export async function deleteAdvisoryBoardMember(memberId: string): Promise<void> {
  try {
    const memberDocRef = doc(db, SITE_CONTENT_COLLECTION, ORGANIZATION_DETAILS_DOC_ID, ADVISORY_BOARD_SUBCOLLECTION, memberId);
    const memberSnap = await getDoc(memberDocRef);
    if (memberSnap.exists()) {
      const memberData = memberSnap.data() as AdvisoryBoardMemberData;
      if (memberData.imagePath) {
        await deleteAdvisoryImage(memberData.imagePath);
      }
    }
    await deleteDoc(memberDocRef);
  } catch (error) {
    console.error(`Error deleting advisory member ${memberId}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete advisory member: ${error.message}`);
    }
    throw new Error('An unknown error occurred.');
  }
}
