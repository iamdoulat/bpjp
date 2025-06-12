
// src/services/userService.ts
import { db, auth, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, type Timestamp } from 'firebase/firestore'; // Added Timestamp here
import { updateProfile as updateAuthProfile, type User as AuthUser } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface UserProfileData {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  mobileNumber?: string | null;
  photoURL?: string | null;
  role?: 'admin' | 'user';
  joinedDate?: Date | Timestamp | null;
  lastUpdated?: Timestamp;
}

// Function to get user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfileData | null> {
  try {
    const userDocRef = doc(db, 'userProfiles', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        uid,
        displayName: data.displayName || null,
        email: data.email || null, // Email is usually from Auth, but can be stored
        mobileNumber: data.mobileNumber || null,
        photoURL: data.photoURL || null,
        role: data.role || 'user',
        joinedDate: data.joinedDate ? (data.joinedDate as Timestamp).toDate() : null,
        lastUpdated: data.lastUpdated || null,
      } as UserProfileData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

// Function to create or update user profile in Firestore and Firebase Auth
export async function updateUserProfileService(
  authUser: AuthUser,
  profileUpdates: Partial<Pick<UserProfileData, 'displayName' | 'mobileNumber'>>
): Promise<void> {
  if (!authUser) throw new Error("User not authenticated.");

  const userDocRef = doc(db, 'userProfiles', authUser.uid);
  const currentProfile = await getUserProfile(authUser.uid);

  const dataToStore: Partial<UserProfileData> = {
    uid: authUser.uid,
    email: authUser.email, // Store email for consistency if needed
    lastUpdated: serverTimestamp() as Timestamp,
  };

  if (profileUpdates.displayName !== undefined) {
    dataToStore.displayName = profileUpdates.displayName;
  }
  if (profileUpdates.mobileNumber !== undefined) {
    dataToStore.mobileNumber = profileUpdates.mobileNumber;
  }

  try {
    // Update Firebase Auth profile (displayName)
    if (profileUpdates.displayName !== undefined && profileUpdates.displayName !== authUser.displayName) {
      await updateAuthProfile(authUser, { displayName: profileUpdates.displayName });
    }

    // Update Firestore document
    if (currentProfile) {
      await updateDoc(userDocRef, dataToStore);
    } else {
      // If profile doesn't exist, create it including joinedDate
      dataToStore.joinedDate = authUser.metadata.creationTime ? Timestamp.fromDate(new Date(authUser.metadata.creationTime)) : serverTimestamp();
      dataToStore.photoURL = authUser.photoURL; // Initial photoURL from auth
      await setDoc(userDocRef, dataToStore);
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

// Function to upload profile picture and update Auth & Firestore
export async function uploadProfilePictureAndUpdate(
  authUser: AuthUser,
  file: File
): Promise<string> {
  if (!authUser) throw new Error("User not authenticated.");
  if (!file) throw new Error("No file selected.");

  const filePath = `profile-images/${authUser.uid}/${file.name}`;
  const storageRef = ref(storage, filePath);

  try {
    // Upload file to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Update Firebase Auth profile
    await updateAuthProfile(authUser, { photoURL: downloadURL });

    // Update Firestore document
    const userDocRef = doc(db, 'userProfiles', authUser.uid);
    const currentProfile = await getUserProfile(authUser.uid);
    const dataToUpdate: Partial<UserProfileData> = {
        photoURL: downloadURL,
        lastUpdated: serverTimestamp() as Timestamp,
    };

    if (currentProfile) {
        await updateDoc(userDocRef, dataToUpdate);
    } else {
        // If profile doesn't exist, create it
        dataToUpdate.uid = authUser.uid;
        dataToUpdate.email = authUser.email;
        dataToUpdate.displayName = authUser.displayName;
        dataToUpdate.joinedDate = authUser.metadata.creationTime ? Timestamp.fromDate(new Date(authUser.metadata.creationTime)) : serverTimestamp(); // Use imported Timestamp
        await setDoc(userDocRef, dataToUpdate);
    }

    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
}

