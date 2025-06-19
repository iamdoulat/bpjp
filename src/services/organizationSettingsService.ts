
// src/services/organizationSettingsService.ts
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type { User as AuthUser } from 'firebase/auth';

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
}

const SETTINGS_DOC_ID = 'organizationDetails';
const SITE_CONTENT_COLLECTION = 'siteContent';

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
    };
  }
}

export async function saveOrganizationSettings(
  settingsData: Omit<OrganizationSettingsData, 'id' | 'lastUpdated' | 'presidentImageURL' | 'secretaryImageURL' | 'coverImageUrl' | 'presidentImagePath' | 'secretaryImagePath' | 'coverImagePath'>,
  presidentImageFile?: File,
  secretaryImageFile?: File,
  coverImageFile?: File
): Promise<void> {
  try {
    const docRef = doc(db, SITE_CONTENT_COLLECTION, SETTINGS_DOC_ID);
    const currentSettings = await getDoc(docRef); // Fetch current doc to get existing image paths

    const dataToSave: Partial<OrganizationSettingsData> = {
      ...settingsData,
      lastUpdated: serverTimestamp() as Timestamp,
    };

    if (presidentImageFile) {
      if (currentSettings.exists() && currentSettings.data()?.presidentImagePath) {
        await deleteImage(currentSettings.data()?.presidentImagePath);
      }
      const presImgDetails = await uploadImage(presidentImageFile, `organization/${SETTINGS_DOC_ID}/president_image.${presidentImageFile.name.split('.').pop()}`);
      dataToSave.presidentImageURL = presImgDetails.imageUrl;
      dataToSave.presidentImagePath = presImgDetails.imagePath;
    }

    if (secretaryImageFile) {
      if (currentSettings.exists() && currentSettings.data()?.secretaryImagePath) {
        await deleteImage(currentSettings.data()?.secretaryImagePath);
      }
      const secImgDetails = await uploadImage(secretaryImageFile, `organization/${SETTINGS_DOC_ID}/secretary_image.${secretaryImageFile.name.split('.').pop()}`);
      dataToSave.secretaryImageURL = secImgDetails.imageUrl;
      dataToSave.secretaryImagePath = secImgDetails.imagePath;
    }

    if (coverImageFile) {
      if (currentSettings.exists() && currentSettings.data()?.coverImagePath) {
        await deleteImage(currentSettings.data()?.coverImagePath);
      }
      const coverImgDetails = await uploadImage(coverImageFile, `organization/${SETTINGS_DOC_ID}/cover_image.${coverImageFile.name.split('.').pop()}`);
      dataToSave.coverImageUrl = coverImgDetails.imageUrl;
      dataToSave.coverImagePath = coverImgDetails.imagePath;
    }

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

    