
// src/services/advisoryBoardService.ts
import { db, storage, auth } from '@/lib/firebase';
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
const ORGANIZATION_DETAILS_DOC_ID = 'organizationDetails';
const ADVISORY_BOARD_SUBCOLLECTION = 'advisoryBoardMembers';

export interface AdvisoryBoardMemberData {
  id: string;
  name: string;
  title: string;
  imageUrl?: string | null;
  imagePath?: string | null; // For Firebase Storage path
  createdAt: Timestamp;
  lastUpdated?: Timestamp;
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

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(snapshot.ref);
    return { imageUrl, imagePath: storagePath };
  } catch (uploadError: any) {
    console.error("[advisoryBoardService.uploadAdvisoryImage] Error uploading image: ", uploadError);
    if (uploadError.code === 'storage/unauthorized' || (uploadError.message && uploadError.message.includes('storage/unauthorized'))) {
        throw new Error(`Failed to upload advisory member image: Firebase Storage permission denied. Please verify admin role and Storage security rules for 'advisory_board_images/'. Path: ${uploadError.metadata?.fullPath || 'unknown'}`);
    }
    throw new Error(`Failed to upload advisory member image: ${uploadError.message || 'Unknown storage error'}`);
  }
}

async function deleteAdvisoryImage(imagePath?: string | null) {
  if (imagePath) {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        console.warn(`[advisoryBoardService.deleteAdvisoryImage] Image not found, skipping deletion: ${imagePath}`);
      } else {
        console.error(`[advisoryBoardService.deleteAdvisoryImage] Error deleting image ${imagePath}:`, error);
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
      imageDetails = await uploadAdvisoryImage(imageFile);
    }

    const membersCollectionRef = collection(db, SITE_CONTENT_COLLECTION, ORGANIZATION_DETAILS_DOC_ID, ADVISORY_BOARD_SUBCOLLECTION);
    const docRef = await addDoc(membersCollectionRef, {
      ...data,
      imageUrl: imageDetails?.imageUrl || null,
      imagePath: imageDetails?.imagePath || null,
      createdAt: serverTimestamp() as Timestamp,
      lastUpdated: serverTimestamp() as Timestamp,
    });
    return docRef.id;
  } catch (error) {
    console.error("[advisoryBoardService.addAdvisoryBoardMember] Error:", error);
    if (error instanceof Error) {
      if (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied") {
        throw new Error(`Failed to add advisory member: Firestore permission denied. Ensure admin user has write access to 'siteContent/${ORGANIZATION_DETAILS_DOC_ID}/${ADVISORY_BOARD_SUBCOLLECTION}'.`);
      }
      throw new Error(`Failed to add advisory member: ${error.message}`);
    }
    throw new Error('An unknown error occurred while adding advisory member.');
  }
}

export async function getAdvisoryBoardMembers(): Promise<AdvisoryBoardMemberData[]> {
  try {
    const membersCollectionRef = collection(db, SITE_CONTENT_COLLECTION, ORGANIZATION_DETAILS_DOC_ID, ADVISORY_BOARD_SUBCOLLECTION);
    const q = query(membersCollectionRef, orderBy("createdAt", "asc"));
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
        lastUpdated: data.lastUpdated as Timestamp,
      });
    });
    return members;
  } catch (error) {
    console.error("[advisoryBoardService.getAdvisoryBoardMembers] Error fetching members:", error);
    if (error instanceof Error) {
       if (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied") {
        throw new Error(`Failed to fetch advisory members: Firestore permission denied. Ensure public read/list access OR admin read/list access to 'siteContent/${ORGANIZATION_DETAILS_DOC_ID}/${ADVISORY_BOARD_SUBCOLLECTION}'.`);
      }
      throw new Error(`Failed to fetch advisory members: ${error.message}`);
    }
    return [];
  }
}

export async function updateAdvisoryBoardMember(
  memberId: string,
  updates: UpdateAdvisoryBoardMemberInput,
  newImageFile?: File | null
): Promise<void> {
  try {
    const memberDocRef = doc(db, SITE_CONTENT_COLLECTION, ORGANIZATION_DETAILS_DOC_ID, ADVISORY_BOARD_SUBCOLLECTION, memberId);
    const dataToUpdate: Partial<Omit<AdvisoryBoardMemberData, 'id' | 'createdAt'>> & { lastUpdated?: Timestamp } = {
      ...updates,
      lastUpdated: serverTimestamp() as Timestamp,
    };

    const currentMemberSnap = await getDoc(memberDocRef);
    const currentMemberData = currentMemberSnap.data() as AdvisoryBoardMemberData | undefined;

    if (newImageFile === null) {
      if (currentMemberData?.imagePath) {
        await deleteAdvisoryImage(currentMemberData.imagePath);
      }
      dataToUpdate.imageUrl = null;
      dataToUpdate.imagePath = null;
    } else if (newImageFile) {
      if (currentMemberData?.imagePath) {
        await deleteAdvisoryImage(currentMemberData.imagePath);
      }
      const imageDetails = await uploadAdvisoryImage(newImageFile, memberId);
      dataToUpdate.imageUrl = imageDetails.imageUrl;
      dataToUpdate.imagePath = imageDetails.imagePath;
    }

    await updateDoc(memberDocRef, dataToUpdate);
  } catch (error) {
    console.error(`[advisoryBoardService.updateAdvisoryBoardMember] Error updating member ${memberId}:`, error);
    if (error instanceof Error) {
      if (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied") {
        throw new Error(`Failed to update advisory member: Firestore permission denied. Ensure admin user has write access to 'siteContent/${ORGANIZATION_DETAILS_DOC_ID}/${ADVISORY_BOARD_SUBCOLLECTION}/${memberId}'.`);
      }
      throw new Error(`Failed to update advisory member: ${error.message}`);
    }
    throw new Error('An unknown error occurred while updating advisory member.');
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
    console.error(`[advisoryBoardService.deleteAdvisoryBoardMember] Error deleting member ${memberId}:`, error);
    if (error instanceof Error) {
       if (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied") {
        throw new Error(`Failed to delete advisory member: Firestore permission denied. Ensure admin user has delete access to 'siteContent/${ORGANIZATION_DETAILS_DOC_ID}/${ADVISORY_BOARD_SUBCOLLECTION}/${memberId}'.`);
      }
      throw new Error(`Failed to delete advisory member: ${error.message}`);
    }
    throw new Error('An unknown error occurred while deleting advisory member.');
  }
}
