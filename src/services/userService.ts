
// src/services/userService.ts
import { db, auth, storage } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { updateProfile as updateAuthProfile, type User as AuthUser } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface UserProfileData {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  mobileNumber?: string | null;
  photoURL?: string | null;
  role?: 'admin' | 'user'; // Lowercase as typically stored in Firestore
  status?: 'Active' | 'Suspended' | 'Pending Verification';
  joinedDate?: Timestamp | null; // Firestore Timestamp
  lastLoginDate?: Timestamp | null; // Firestore Timestamp
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
        email: data.email || null,
        mobileNumber: data.mobileNumber || null,
        photoURL: data.photoURL || null,
        role: data.role || 'user',
        status: data.status || 'Active',
        joinedDate: data.joinedDate || null,
        lastLoginDate: data.lastLoginDate || null,
        lastUpdated: data.lastUpdated || null,
      } as UserProfileData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

// Function to fetch all user profiles from Firestore
export async function getAllUserProfiles(): Promise<UserProfileData[]> {
  try {
    const usersCollectionRef = collection(db, 'userProfiles');
    const querySnapshot = await getDocs(usersCollectionRef);
    const profiles: UserProfileData[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data();
      profiles.push({
        uid: docSnap.id,
        displayName: data.displayName || null,
        email: data.email || null,
        mobileNumber: data.mobileNumber || null,
        photoURL: data.photoURL || null,
        role: data.role || 'user',
        status: data.status || 'Active',
        // Convert Timestamps to JS Dates directly in the service if needed by components,
        // but UserProfileData keeps them as Timestamps for consistency with Firestore model
        joinedDate: data.joinedDate as Timestamp || null,
        lastLoginDate: data.lastLoginDate as Timestamp || null,
        lastUpdated: data.lastUpdated as Timestamp || null,
      });
    });
    return profiles;
  } catch (error) {
    console.error("Error fetching all user profiles:", error);
    if (error instanceof Error && (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied")) {
        console.error("[userService.getAllUserProfiles] PERMISSION DENIED. Check Firestore security rules for reading 'userProfiles' collection by admin.");
    }
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
    email: authUser.email, 
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
      dataToStore.joinedDate = authUser.metadata.creationTime ? Timestamp.fromDate(new Date(authUser.metadata.creationTime)) : serverTimestamp() as Timestamp;
      // Also store lastSignInTime as lastLoginDate
      dataToStore.lastLoginDate = authUser.metadata.lastSignInTime ? Timestamp.fromDate(new Date(authUser.metadata.lastSignInTime)) : serverTimestamp() as Timestamp;
      dataToStore.photoURL = authUser.photoURL; 
      dataToStore.role = authUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : 'user'; // Set role on creation
      dataToStore.status = 'Active'; // Default status
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
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    await updateAuthProfile(authUser, { photoURL: downloadURL });

    const userDocRef = doc(db, 'userProfiles', authUser.uid);
    const currentProfile = await getUserProfile(authUser.uid);
    const dataToUpdate: Partial<UserProfileData> = {
        photoURL: downloadURL,
        lastUpdated: serverTimestamp() as Timestamp,
    };

    if (currentProfile) {
        await updateDoc(userDocRef, dataToUpdate);
    } else {
        dataToUpdate.uid = authUser.uid;
        dataToUpdate.email = authUser.email;
        dataToUpdate.displayName = authUser.displayName;
        dataToUpdate.joinedDate = authUser.metadata.creationTime ? Timestamp.fromDate(new Date(authUser.metadata.creationTime)) : serverTimestamp() as Timestamp;
        dataToUpdate.lastLoginDate = authUser.metadata.lastSignInTime ? Timestamp.fromDate(new Date(authUser.metadata.lastSignInTime)) : serverTimestamp() as Timestamp;
        dataToUpdate.role = authUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : 'user';
        dataToUpdate.status = 'Active';
        await setDoc(userDocRef, dataToUpdate);
    }

    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
}
