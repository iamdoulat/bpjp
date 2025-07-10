// src/services/noticeService.ts
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
  query,
  orderBy,
  where,
  limit, // Import limit
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const NOTICES_COLLECTION = 'notices';

export interface NoticeData {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  isPopup: boolean; // New field for popup functionality
  link?: string | null;
  imageUrl?: string | null;
  imagePath?: string | null;
  createdAt: Timestamp;
  lastUpdated: Timestamp;
}

export interface NewNoticeInput {
  title: string;
  content: string;
  isActive: boolean;
  isPopup: boolean; // New field
  link?: string;
  imageFile?: File | null;
}

export interface UpdateNoticeInput {
  title?: string;
  content?: string;
  isActive?: boolean;
  isPopup?: boolean; // New field
  link?: string;
  imageFile?: File | null; // For new/replacement image
  removeCurrentImage?: boolean; // To explicitly remove image
}

async function uploadNoticeImage(file: File, noticeId?: string): Promise<{ imageUrl: string, imagePath: string }> {
  const timestamp = new Date().getTime();
  const uniqueFileName = `notice_${noticeId || timestamp}_${file.name.replace(/\s+/g, '_')}`;
  const storagePath = `notice_images/${uniqueFileName}`;
  const storageRef = ref(storage, storagePath);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    return { imageUrl: await getDownloadURL(snapshot.ref), imagePath: storagePath };
  } catch (error: any) {
    console.error("[noticeService.uploadNoticeImage] Error:", error);
    throw new Error(`Failed to upload notice image: ${error.message}`);
  }
}

async function deleteNoticeImage(imagePath?: string | null) {
  if (!imagePath) return;
  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.warn(`[noticeService.deleteNoticeImage] Image not found: ${imagePath}`);
    } else {
      console.error(`[noticeService.deleteNoticeImage] Error deleting image ${imagePath}:`, error);
    }
  }
}

export async function addNotice(data: NewNoticeInput): Promise<string> {
  try {
    let imageDetails: { imageUrl: string, imagePath: string } | undefined;
    if (data.imageFile) {
      imageDetails = await uploadNoticeImage(data.imageFile);
    }

    const noticeData = {
      title: data.title,
      content: data.content,
      isActive: data.isActive,
      isPopup: data.isPopup, // Save the new field
      link: data.link || null,
      imageUrl: imageDetails?.imageUrl || null,
      imagePath: imageDetails?.imagePath || null,
      createdAt: serverTimestamp() as Timestamp,
      lastUpdated: serverTimestamp() as Timestamp,
    };
    const docRef = await addDoc(collection(db, NOTICES_COLLECTION), noticeData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding notice:", error);
    if (error instanceof Error) {
      if (error.message.includes("permission-denied")) {
        throw new Error("Permission denied. You are not authorized to add notices.");
      }
      throw new Error(`Failed to add notice: ${error.message}`);
    }
    throw new Error('An unknown error occurred while adding the notice.');
  }
}

export async function getNotices(onlyActive: boolean = false): Promise<NoticeData[]> {
  try {
    let q;
    const noticesCollectionRef = collection(db, NOTICES_COLLECTION);
    if (onlyActive) {
      q = query(noticesCollectionRef, where("isActive", "==", true), orderBy("lastUpdated", "desc"));
    } else {
      q = query(noticesCollectionRef, orderBy("lastUpdated", "desc"));
    }
    
    const querySnapshot = await getDocs(q);
    const notices: NoticeData[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data();
      notices.push({
        id: docSnap.id,
        title: data.title,
        content: data.content,
        isActive: data.isActive,
        isPopup: data.isPopup || false, // Default to false if not present
        link: data.link || null,
        imageUrl: data.imageUrl || null,
        imagePath: data.imagePath || null,
        createdAt: data.createdAt as Timestamp,
        lastUpdated: data.lastUpdated as Timestamp,
      });
    });
    return notices;
  } catch (error) {
    console.error("Error fetching notices:", error);
    if (error instanceof Error) {
       if (error.message.includes("permission-denied")) {
        throw new Error("Permission denied. You are not authorized to view notices.");
      }
      throw new Error(`Failed to fetch notices: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching notices.');
  }
}


export async function updateNotice(noticeId: string, updates: UpdateNoticeInput): Promise<void> {
  try {
    const noticeDocRef = doc(db, NOTICES_COLLECTION, noticeId);
    const dataToUpdate: Partial<NoticeData> = {
      lastUpdated: serverTimestamp() as Timestamp,
    };

    // Add only the fields that are being updated
    if (updates.title !== undefined) dataToUpdate.title = updates.title;
    if (updates.content !== undefined) dataToUpdate.content = updates.content;
    if (updates.isActive !== undefined) dataToUpdate.isActive = updates.isActive;
    if (updates.isPopup !== undefined) dataToUpdate.isPopup = updates.isPopup; // Update isPopup field
    dataToUpdate.link = updates.link || null;
    
    const currentNoticeSnap = await getDoc(noticeDocRef);
    const currentNoticeData = currentNoticeSnap.data() as NoticeData | undefined;

    if (updates.removeCurrentImage) {
      await deleteNoticeImage(currentNoticeData?.imagePath);
      dataToUpdate.imageUrl = null;
      dataToUpdate.imagePath = null;
    } else if (updates.imageFile) {
      await deleteNoticeImage(currentNoticeData?.imagePath);
      const imageDetails = await uploadNoticeImage(updates.imageFile, noticeId);
      dataToUpdate.imageUrl = imageDetails.imageUrl;
      dataToUpdate.imagePath = imageDetails.imagePath;
    }

    await updateDoc(noticeDocRef, dataToUpdate);
  } catch (error) {
    console.error(`Error updating notice ${noticeId}:`, error);
    if (error instanceof Error) {
      if (error.message.includes("permission-denied")) {
        throw new Error("Permission denied. You are not authorized to update notices.");
      }
      throw new Error(`Failed to update notice: ${error.message}`);
    }
    throw new Error('An unknown error occurred while updating the notice.');
  }
}

export async function deleteNotice(noticeId: string): Promise<void> {
  try {
    const noticeDocRef = doc(db, NOTICES_COLLECTION, noticeId);
    const noticeSnap = await getDoc(noticeDocRef);
    if (noticeSnap.exists()) {
      await deleteNoticeImage(noticeSnap.data().imagePath);
    }
    await deleteDoc(noticeDocRef);
  } catch (error) {
    console.error(`Error deleting notice ${noticeId}:`, error);
    if (error instanceof Error) {
      if (error.message.includes("permission-denied")) {
        throw new Error("Permission denied. You are not authorized to delete notices.");
      }
      throw new Error(`Failed to delete notice: ${error.message}`);
    }
    throw new Error('An unknown error occurred while deleting the notice.');
  }
}

// New function to get the single active popup notice
export async function getActivePopupNotice(): Promise<NoticeData | null> {
  try {
    const q = query(
      collection(db, NOTICES_COLLECTION),
      where("isActive", "==", true),
      where("isPopup", "==", true),
      orderBy("lastUpdated", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        content: data.content,
        isActive: data.isActive,
        isPopup: data.isPopup,
        link: data.link || null,
        imageUrl: data.imageUrl || null,
        imagePath: data.imagePath || null,
        createdAt: data.createdAt as Timestamp,
        lastUpdated: data.lastUpdated as Timestamp,
      };
    }
    return null; // No active popup notice found
  } catch (error) {
    console.error("Error fetching active popup notice:", error);
    // Don't throw error to prevent crashing the app, just return null
    return null;
  }
}
