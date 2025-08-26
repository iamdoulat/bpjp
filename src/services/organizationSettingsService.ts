// src/services/organizationSettingsService.ts
import { db, storage, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { User as AuthUser } from 'firebase/auth';
import { getUserProfile } from './userService';

export interface OrganizationSettingsData {
  id?: string; // Document ID, usually 'organizationDetails'
  organizationName: string;
  address: string;
  registrationNumber?: string | null;
  establishedYear?: string | null; // Added establishedYear
  committeePeriod?: string | null;
  contactPersonName: string;
  contactPersonCell?: string | null;
  contactEmail: string;
  presidentName: string;
  presidentMobileNumber?: string | null;
  presidentImageURL?: string | null;
  presidentImagePath?: string | null; // For storage path
  secretaryName: string;
  secretaryMobileNumber?: string | null;
  secretaryImageURL?: string | null;
  secretaryImagePath?: string | null; // For storage path
  appName: string;
  lastUpdated?: Timestamp;
  coverImageUrl?: string | null; // For the About Us page banner
  coverImagePath?: string | null; // For storage path
  importantAlert?: string | null; // For global site alert
}

const SETTINGS_DOC_ID = 'organizationDetails';
const SITE_CONTENT_COLLECTION = 'siteContent';

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

async function uploadImage(file: File, path: string): Promise<{ imageUrl: string, imagePath: string }> {
  const storageRef = ref(storage, path);
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(snapshot.ref);
    return { imageUrl, imagePath: path };
  } catch (uploadError: any) {
    console.error("[organizationSettingsService.uploadImage] Error uploading image: ", uploadError);
    if (uploadError.code === 'storage/unauthorized' || (uploadError.message && uploadError.message.includes('storage/unauthorized'))) {
        throw new Error(`Failed to upload organization image: Firebase Storage permission denied. Please verify admin role and Storage security rules for '${path.substring(0, path.lastIndexOf('/'))}/'. Path: ${uploadError.metadata?.fullPath || 'unknown'}`);
    }
    throw new Error(`Failed to upload organization image: ${uploadError.message || 'Unknown storage error'}`);
  }
}

async function deleteImage(imagePath?: string | null) {
    if (imagePath) {
        try {
            const imageRef = ref(storage, imagePath);
            await deleteObject(imageRef);
        } catch (error: any) {
            if (error.code === 'storage/object-not-found') {
                console.warn(`[organizationSettingsService.deleteImage] Image not found, skipping deletion: ${imagePath}`);
            } else {
                console.error(`[organizationSettingsService.deleteImage] Error deleting image ${imagePath}:`, error);
            }
        }
    }
}


export async function getOrganizationSettings(): Promise<OrganizationSettingsData | null> {
  try {
    const docRef = doc(db, SITE_CONTENT_COLLECTION, SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        organizationName: data.organizationName || "BPJP Default Org Name",
        address: data.address || "Default Address",
        contactPersonName: data.contactPersonName || "Default Contact Person",
        contactEmail: data.contactEmail || "default@example.com",
        presidentName: data.presidentName || "Default President",
        presidentMobileNumber: data.presidentMobileNumber || null,
        presidentImageURL: data.presidentImageURL || null,
        presidentImagePath: data.presidentImagePath || null,
        secretaryName: data.secretaryName || "Default Secretary",
        secretaryMobileNumber: data.secretaryMobileNumber || null,
        secretaryImageURL: data.secretaryImageURL || null,
        secretaryImagePath: data.secretaryImagePath || null,
        appName: data.appName || process.env.NEXT_PUBLIC_APP_NAME || "BPJP",
        registrationNumber: data.registrationNumber || null,
        establishedYear: data.establishedYear || null,
        committeePeriod: data.committeePeriod || null,
        contactPersonCell: data.contactPersonCell || null,
        coverImageUrl: data.coverImageUrl || null,
        coverImagePath: data.coverImagePath || null,
        importantAlert: data.importantAlert || null,
        lastUpdated: data.lastUpdated as Timestamp,
      } as OrganizationSettingsData;
    }
    return {
      id: SETTINGS_DOC_ID,
      organizationName: "BPJP Default Org Name",
      address: "123 Main Street, Anytown, USA",
      registrationNumber: null,
      establishedYear: null,
      committeePeriod: null,
      contactPersonName: "John Doe",
      contactPersonCell: null,
      contactEmail: "contact@example.com",
      presidentName: "Alice President",
      presidentMobileNumber: null,
      presidentImageURL: null,
      presidentImagePath: null,
      secretaryName: "Bob Secretary",
      secretaryMobileNumber: null,
      secretaryImageURL: null,
      secretaryImagePath: null,
      appName: process.env.NEXT_PUBLIC_APP_NAME || "BPJP",
      coverImageUrl: null,
      coverImagePath: null,
      importantAlert: null,
      lastUpdated: undefined,
    };
  } catch (error) {
    console.error("[organizationSettingsService.getOrganizationSettings] Error fetching organization settings:", error);
    if (error instanceof Error) {
      if (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied") {
        throw new Error(`Failed to fetch organization settings: Firestore permission denied. Ensure public read access to 'siteContent/${SETTINGS_DOC_ID}'.`);
      }
      throw new Error(`Failed to fetch organization settings: ${error.message}`);
    }
    return {
      id: SETTINGS_DOC_ID,
      organizationName: "Error Loading Name",
      address: "Error Loading Address",
      appName: process.env.NEXT_PUBLIC_APP_NAME || "BPJP Error",
      contactPersonName: "Error",
      contactEmail: "error@example.com",
      presidentName: "Error",
      presidentMobileNumber: null,
      secretaryName: "Error",
      secretaryMobileNumber: null,
      lastUpdated: undefined,
      registrationNumber: null,
      establishedYear: null,
      committeePeriod: null,
      contactPersonCell: null,
      presidentImageURL: null,
      presidentImagePath: null,
      secretaryImageURL: null,
      secretaryImagePath: null,
      coverImageUrl: null,
      coverImagePath: null,
      importantAlert: null,
    };
  }
}

export async function saveOrganizationSettings(
  settingsData: Omit<OrganizationSettingsData, 'id' | 'lastUpdated' | 'presidentImageURL' | 'secretaryImageURL' | 'coverImageUrl' | 'presidentImagePath' | 'secretaryImagePath' | 'coverImagePath'> & { importantAlert?: string | null },
  presidentImageFile?: File | null, // Changed to allow null
  secretaryImageFile?: File | null, // Changed to allow null
  coverImageFile?: File | null // Changed to allow null
): Promise<void> {
  await verifyAdminRole();
  try {
    const docRef = doc(db, SITE_CONTENT_COLLECTION, SETTINGS_DOC_ID);
    const currentSettingsSnap = await getDoc(docRef);

    const dataToSave: Partial<OrganizationSettingsData> = {
      ...settingsData,
      lastUpdated: serverTimestamp() as Timestamp,
    };
    
    // Handle image file updates
    const handleImageUpdate = async (file: File | null | undefined, fieldName: 'president' | 'secretary' | 'cover') => {
        const urlField = `${fieldName}ImageURL`;
        const pathField = `${fieldName}ImagePath`;
        
        if (file) { // New file provided
            if (currentSettingsSnap.exists() && currentSettingsSnap.data()?.[pathField]) {
                await deleteImage(currentSettingsSnap.data()?.[pathField]);
            }
            const imgDetails = await uploadImage(file, `organization/${SETTINGS_DOC_ID}/${fieldName}_image.${file.name.split('.').pop()}`);
            (dataToSave as any)[urlField] = imgDetails.imageUrl;
            (dataToSave as any)[pathField] = imgDetails.imagePath;
        } else if (file === null) { // Explicitly told to remove the image
            if (currentSettingsSnap.exists() && currentSettingsSnap.data()?.[pathField]) {
                await deleteImage(currentSettingsSnap.data()?.[pathField]);
            }
            (dataToSave as any)[urlField] = null;
            (dataToSave as any)[pathField] = null;
        }
        // If file is undefined, do nothing to the image fields
    };

    await handleImageUpdate(presidentImageFile, 'president');
    await handleImageUpdate(secretaryImageFile, 'secretary');
    await handleImageUpdate(coverImageFile, 'cover');

    // Make sure we don't try to save undefined file objects to Firestore
    delete (dataToSave as any).presidentImageFile;
    delete (dataToSave as any).secretaryImageFile;
    delete (dataToSave as any).coverImageFile;

    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    console.error("[organizationSettingsService.saveOrganizationSettings] Error saving organization settings:", error);
    if (error instanceof Error) {
      if (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied") {
        throw new Error(`Failed to save organization settings: Firestore permission denied. Ensure admin user has write access to 'siteContent/${SETTINGS_DOC_ID}'. Also, check Storage rules for 'organization/' path if image upload fails.`);
      }
      throw new Error(`Failed to save organization settings: ${error.message}`);
    }
    throw new Error('An unknown error occurred while saving organization settings.');
  }
}
