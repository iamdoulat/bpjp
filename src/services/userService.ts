// src/services/userService.ts
import { db, auth, storage } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp, type QueryDocumentSnapshot, type DocumentData, deleteDoc } from 'firebase/firestore';
import { updateProfile as updateAuthProfile, type User as AuthUser } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface UserProfileData {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  mobileNumber?: string | null;
  whatsAppNumber?: string | null; 
  wardNo?: string | null;
  photoURL?: string | null;
  role?: 'admin' | 'user';
  status?: 'Active' | 'Suspended' | 'Pending Verification';
  joinedDate?: Timestamp | null;
  lastLoginDate?: Timestamp | null;
  lastUpdated?: Timestamp;
  walletBalance?: number;
}

export interface NewUserProfileFirestoreData {
  email: string | null;
  displayName: string | null;
  mobileNumber?: string | null; // This will be populated by the signup form
  whatsAppNumber?: string | null; // Remains optional, will be null from signup form
  wardNo?: string | null;
  role: 'admin' | 'user';
  status: 'Active' | 'Suspended' | 'Pending Verification';
  joinedDate: Timestamp;
  lastLoginDate?: Timestamp | null;
  photoURL?: string | null;
  walletBalance?: number;
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
        whatsAppNumber: data.whatsAppNumber || null, 
        wardNo: data.wardNo || null,
        photoURL: data.photoURL || null,
        role: data.role || 'user',
        status: data.status || 'Active',
        joinedDate: data.joinedDate || null,
        lastLoginDate: data.lastLoginDate || null,
        lastUpdated: data.lastUpdated || null,
        walletBalance: data.walletBalance !== undefined ? data.walletBalance : 0,
      } as UserProfileData;
    }
    return {
      uid,
      email: auth.currentUser?.email || null,
      displayName: auth.currentUser?.displayName || null,
      walletBalance: 0,
      role: 'user',
      status: 'Active',
      mobileNumber: null, // Default for new/non-existent profile
      whatsAppNumber: null, 
      wardNo: null,
    };
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
        whatsAppNumber: data.whatsAppNumber || null, 
        wardNo: data.wardNo || null,
        photoURL: data.photoURL || null,
        role: data.role || 'user',
        status: data.status || 'Active',
        joinedDate: data.joinedDate as Timestamp || null,
        lastLoginDate: data.lastLoginDate as Timestamp || null,
        lastUpdated: data.lastUpdated as Timestamp || null,
        walletBalance: data.walletBalance !== undefined ? data.walletBalance : 0,
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


// Function for a user to update their own profile
export async function updateUserProfileService(
  authUser: AuthUser,
  profileUpdates: Partial<Pick<UserProfileData, 'displayName' | 'mobileNumber' | 'whatsAppNumber' | 'wardNo'>>
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
  if (profileUpdates.whatsAppNumber !== undefined) {
    dataToStore.whatsAppNumber = profileUpdates.whatsAppNumber;
  }
  if (profileUpdates.wardNo !== undefined) { 
    dataToStore.wardNo = profileUpdates.wardNo;
  }


  try {
    if (profileUpdates.displayName !== undefined && profileUpdates.displayName !== authUser.displayName) {
      await updateAuthProfile(authUser, { displayName: profileUpdates.displayName });
    }

    if (currentProfile) {
      await updateDoc(userDocRef, dataToStore);
    } else {
      dataToStore.joinedDate = authUser.metadata.creationTime ? Timestamp.fromDate(new Date(authUser.metadata.creationTime)) : serverTimestamp() as Timestamp;
      dataToStore.lastLoginDate = authUser.metadata.lastSignInTime ? Timestamp.fromDate(new Date(authUser.metadata.lastSignInTime)) : serverTimestamp() as Timestamp;
      dataToStore.photoURL = authUser.photoURL;
      dataToStore.role = authUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : 'user';
      dataToStore.status = 'Active';
      dataToStore.walletBalance = 0;
      await setDoc(userDocRef, {
        ...dataToStore,
        displayName: dataToStore.displayName || authUser.displayName,
      });
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

// Function for an admin to update any user's profile in Firestore
export async function updateUserProfileAdmin(
  userId: string,
  profileUpdates: Partial<Pick<UserProfileData, 'displayName' | 'mobileNumber' | 'role' | 'status' | 'walletBalance' | 'whatsAppNumber' | 'wardNo'>>
): Promise<void> {
  if (!userId) throw new Error("User ID is required.");
  const userDocRef = doc(db, 'userProfiles', userId);
  const dataToUpdate: Partial<UserProfileData> & { lastUpdated: Timestamp } = {
    ...profileUpdates,
    lastUpdated: serverTimestamp() as Timestamp,
  };

  try {
    await updateDoc(userDocRef, dataToUpdate);
  } catch (error) {
    console.error(`Error updating profile for user ${userId}:`, error);
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
        dataToUpdate.walletBalance = 0;
        dataToUpdate.mobileNumber = currentProfile?.mobileNumber || null; // Keep existing mobile number
        dataToUpdate.whatsAppNumber = currentProfile?.whatsAppNumber || null;
        dataToUpdate.wardNo = currentProfile?.wardNo || null;
        await setDoc(userDocRef, dataToUpdate);
    }

    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
}

// Function to delete a user's profile document from Firestore
export async function deleteUserProfileDocument(userId: string): Promise<void> {
  if (!userId) throw new Error("User ID is required for deletion.");
  try {
    const userDocRef = doc(db, 'userProfiles', userId);
    await deleteDoc(userDocRef);
  } catch (error) {
    console.error(`Error deleting Firestore profile for user ${userId}:`, error);
    throw error;
  }
}

// Function to create the Firestore user profile document for a new user
export async function createUserProfileDocument(
  uid: string,
  profileData: NewUserProfileFirestoreData
): Promise<void> {
  try {
    const userDocRef = doc(db, 'userProfiles', uid);
    await setDoc(userDocRef, {
      uid,
      ...profileData, // Spread all received profile data
      walletBalance: profileData.walletBalance || 0,
      lastUpdated: serverTimestamp() as Timestamp,
    });
  } catch (error) {
    console.error("Error creating user profile document:", error);
    throw error;
  }
}
