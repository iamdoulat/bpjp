
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let db: Firestore;
let authInstance: Auth; // Renamed to avoid conflict
let storageInstance: FirebaseStorage; // Renamed to avoid conflict

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);
authInstance = getAuth(app);
storageInstance = getStorage(app);

export async function uploadImageToStorage(file: Blob | File, path: string): Promise<string> {
  const storageRef = ref(storageInstance, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export async function deleteImageFromStorage(imageUrl: string): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith('gs://') && !imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
    console.warn("Invalid or non-Firebase Storage URL provided for deletion:", imageUrl);
    return;
  }
  try {
    const imageRef = ref(storageInstance, imageUrl);
    await deleteObject(imageRef);
    console.log("Successfully deleted image from storage:", imageUrl);
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.warn(`Image not found in storage, skipping deletion: ${imageUrl}`);
    } else {
      console.error(`Error deleting image ${imageUrl} from storage:`, error);
      // Optionally re-throw or handle as critical if deletion failure is critical
      // throw new Error(`Failed to delete image from storage: ${error.message}`);
    }
  }
}

// Export aliased instances
export { app, db, authInstance as auth, storageInstance as storage };
