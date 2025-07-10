// src/services/noticeService.ts
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  query,
  orderBy,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

const NOTICES_COLLECTION = 'notices';

export interface NoticeData {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  link?: string | null;
  createdAt: Timestamp;
  lastUpdated: Timestamp;
}

export interface NewNoticeInput {
  title: string;
  content: string;
  isActive: boolean;
  link?: string;
}

export interface UpdateNoticeInput {
  title?: string;
  content?: string;
  isActive?: boolean;
  link?: string;
}

export async function addNotice(data: NewNoticeInput): Promise<string> {
  try {
    const noticeData = {
      ...data,
      link: data.link || null,
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

export async function getNotices(): Promise<NoticeData[]> {
  try {
    const q = query(collection(db, NOTICES_COLLECTION), orderBy("lastUpdated", "desc"));
    const querySnapshot = await getDocs(q);
    const notices: NoticeData[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data();
      notices.push({
        id: docSnap.id,
        title: data.title,
        content: data.content,
        isActive: data.isActive,
        link: data.link || null,
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
    const dataToUpdate = {
      ...updates,
      link: updates.link || null,
      lastUpdated: serverTimestamp() as Timestamp,
    };
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
