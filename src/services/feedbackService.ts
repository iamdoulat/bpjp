// src/services/feedbackService.ts
import { db, auth } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import { getUserProfile } from './userService';

const FEEDBACK_COLLECTION = 'feedback';

export interface FeedbackData {
  id: string;
  name: string;
  mobileNumber: string;
  message: string;
  createdAt?: Timestamp;
}

export interface NewFeedbackInput {
  name: string;
  mobileNumber: string;
  message: string;
}

// Function to add new feedback. No auth check needed as it's for public use.
export async function addFeedback(data: NewFeedbackInput): Promise<string> {
  try {
    const feedbackCollectionRef = collection(db, FEEDBACK_COLLECTION);
    const docRef = await addDoc(feedbackCollectionRef, {
      ...data,
      createdAt: serverTimestamp() as Timestamp,
    });
    return docRef.id;
  } catch (error) {
    console.error("[feedbackService.addFeedback] Error:", error);
    if (error instanceof Error && (error.message.includes("permission-denied"))) {
        throw new Error("Failed to submit feedback: Permission to write to the database was denied. This is likely a Firestore security rule issue.");
    }
    throw new Error("An unexpected error occurred while submitting feedback.");
  }
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

// Function to get all feedback for admin view.
export async function getFeedback(): Promise<FeedbackData[]> {
  await verifyAdminRole();
  try {
    const feedbackCollectionRef = collection(db, FEEDBACK_COLLECTION);
    const q = query(feedbackCollectionRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const feedbackList: FeedbackData[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data();
      feedbackList.push({
        id: docSnap.id,
        name: data.name,
        mobileNumber: data.mobileNumber,
        message: data.message,
        createdAt: data.createdAt as Timestamp,
      });
    });
    return feedbackList;
  } catch (error) {
    console.error("[feedbackService.getFeedback] Error fetching feedback:", error);
    if (error instanceof Error && (error.message.includes("permission-denied") || error.message.includes("Missing or insufficient permissions"))) {
        throw new Error("Permission denied. You are not authorized to view feedback. This is a Firestore security rule issue.");
    }
    throw new Error("An unexpected error occurred while fetching feedback.");
  }
}

// Function to delete feedback.
export async function deleteFeedback(feedbackId: string): Promise<void> {
  await verifyAdminRole();
  try {
    const feedbackDocRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    await deleteDoc(feedbackDocRef);
  } catch (error) {
    console.error(`[feedbackService.deleteFeedback] Error deleting feedback ${feedbackId}:`, error);
    if (error instanceof Error && (error.message.includes("permission-denied") || error.message.includes("Missing or insufficient permissions"))) {
        throw new Error("Permission denied. You are not authorized to delete feedback.");
    }
    throw new Error("An unexpected error occurred while deleting feedback.");
  }
}

    