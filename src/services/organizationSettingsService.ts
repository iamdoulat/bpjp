
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
  committeePeriod?: string | null;
  contactPersonName: string;
  contactPersonCell?: string | null;
  contactEmail: string;
  presidentName: string;
  presidentImageURL?: string | null;
  secretaryName: string;
  secretaryImageURL?: string | null;
  appName: string;
  lastUpdated?: Timestamp;
  coverImageUrl?: string | null; // For the About Us page banner
}

const SETTINGS_DOC_ID = 'organizationDetails';
const SITE_CONTENT_COLLECTION = 'siteContent'; // Using the same collection as missionService for consistency

async function uploadImage(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

async function deleteImage(imageUrl?: string | null) {
    if (imageUrl) {
        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        } catch (error: any) {
            if (error.code === 'storage/object-not-found') {
                console.warn(`Image not found, skipping deletion: ${imageUrl}`);
            } else {
                console.error(`Error deleting image ${imageUrl}:`, error);
                // Optionally re-throw or handle as critical
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
        // Ensure all fields are correctly mapped and defaults provided if necessary
        organizationName: data.organizationName || "BPJP Default Org Name",
        address: data.address || "Default Address",
        contactPersonName: data.contactPersonName || "Default Contact Person",
        contactEmail: data.contactEmail || "default@example.com",
        presidentName: data.presidentName || "Default President",
        secretaryName: data.secretaryName || "Default Secretary",
        appName: data.appName || process.env.NEXT_PUBLIC_APP_NAME || "BPJP",
        registrationNumber: data.registrationNumber || null,
        committeePeriod: data.committeePeriod || null,
        contactPersonCell: data.contactPersonCell || null,
        presidentImageURL: data.presidentImageURL || null,
        secretaryImageURL: data.secretaryImageURL || null,
        coverImageUrl: data.coverImageUrl || null,
        lastUpdated: data.lastUpdated as Timestamp,
      } as OrganizationSettingsData;
    }
    // Return a default structure if the document doesn't exist, for initial setup
    return {
      id: SETTINGS_DOC_ID,
      organizationName: "BPJP Default Org Name",
      address: "123 Main Street, Anytown, USA",
      registrationNumber: null,
      committeePeriod: null,
      contactPersonName: "John Doe",
      contactPersonCell: null,
      contactEmail: "contact@example.com",
      presidentName: "Alice President",
      presidentImageURL: null,
      secretaryName: "Bob Secretary",
      secretaryImageURL: null,
      appName: process.env.NEXT_PUBLIC_APP_NAME || "BPJP",
      coverImageUrl: null,
      lastUpdated: undefined,
    };
  } catch (error) {
    console.error("Error fetching organization settings:", error);
    // Return default structure on error to prevent app crash
    return {
      id: SETTINGS_DOC_ID,
      organizationName: "Error Loading Name",
      address: "Error Loading Address",
      appName: process.env.NEXT_PUBLIC_APP_NAME || "BPJP Error",
      contactPersonName: "Error",
      contactEmail: "error@example.com",
      presidentName: "Error",
      secretaryName: "Error",
      lastUpdated: undefined,
      // ensure all required fields are present
      registrationNumber: null,
      committeePeriod: null,
      contactPersonCell: null,
      presidentImageURL: null,
      secretaryImageURL: null,
      coverImageUrl: null,
    };
  }
}

export async function saveOrganizationSettings(
  settingsData: Omit<OrganizationSettingsData, 'id' | 'lastUpdated' | 'presidentImageURL' | 'secretaryImageURL'>,
  presidentImageFile?: File,
  secretaryImageFile?: File,
  coverImageFile?: File // Added coverImageFile
): Promise<void> {
  try {
    const docRef = doc(db, SITE_CONTENT_COLLECTION, SETTINGS_DOC_ID);
    const currentSettings = await getOrganizationSettings(); // Fetch current settings to get existing image URLs

    const dataToSave: Partial<OrganizationSettingsData> = {
      ...settingsData,
      lastUpdated: serverTimestamp() as Timestamp,
    };

    if (presidentImageFile) {
      if (currentSettings?.presidentImageURL) {
        await deleteImage(currentSettings.presidentImageURL);
      }
      dataToSave.presidentImageURL = await uploadImage(presidentImageFile, `organization/${SETTINGS_DOC_ID}/president_image.${presidentImageFile.name.split('.').pop()}`);
    }

    if (secretaryImageFile) {
      if (currentSettings?.secretaryImageURL) {
        await deleteImage(currentSettings.secretaryImageURL);
      }
      dataToSave.secretaryImageURL = await uploadImage(secretaryImageFile, `organization/${SETTINGS_DOC_ID}/secretary_image.${secretaryImageFile.name.split('.').pop()}`);
    }
    
    if (coverImageFile) { // Handle cover image upload
      if (currentSettings?.coverImageUrl) {
        await deleteImage(currentSettings.coverImageUrl);
      }
      dataToSave.coverImageUrl = await uploadImage(coverImageFile, `organization/${SETTINGS_DOC_ID}/cover_image.${coverImageFile.name.split('.').pop()}`);
    }


    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    console.error("Error saving organization settings:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to save organization settings: ${error.message}`);
    }
    throw new Error('An unknown error occurred while saving organization settings.');
  }
}
