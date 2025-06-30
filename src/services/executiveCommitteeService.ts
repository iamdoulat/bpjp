// src/services/executiveCommitteeService.ts
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, addDoc, getDocs, updateDoc, deleteDoc, Timestamp, serverTimestamp, query, orderBy, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';

export interface ExecutiveCommitteeContentData {
  id?: string; // document ID, usually 'mainContent'
  content: string; // HTML content or Markdown
  membersContent?: string;
  lastUpdated?: Timestamp;
}

export type CommitteeType = 'কার্যকরী কমিটি' | 'কার্যনির্বাহী কমিটি';

export interface ExecutiveMemberData {
    id: string;
    name: string;
    designation: string;
    cellNumber: string;
    committeeType: CommitteeType;
    createdAt: Timestamp;
}

const COMMITTEE_CONTENT_DOC_ID = 'mainContent';
const COMMITTEE_COLLECTION = 'executiveCommittee';
const MEMBERS_SUBCOLLECTION = 'members';

// --- Functions for Main Page Content ---

export async function getExecutiveCommitteeData(): Promise<ExecutiveCommitteeContentData | null> {
  try {
    const docRef = doc(db, COMMITTEE_COLLECTION, COMMITTEE_CONTENT_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        content: data.content || "",
        membersContent: data.membersContent || "",
        lastUpdated: data.lastUpdated as Timestamp,
      } as ExecutiveCommitteeContentData;
    }
    return {
        id: COMMITTEE_CONTENT_DOC_ID,
        content: "",
        membersContent: "",
        lastUpdated: undefined,
    };
  } catch (error) {
    console.error("Error fetching executive committee content:", error);
    if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
        throw new Error(`Failed to fetch committee content: Firestore permission denied.`);
    }
     return {
        id: COMMITTEE_CONTENT_DOC_ID,
        content: "Could not load content due to an error.",
        membersContent: "Could not load content due to an error.",
        lastUpdated: undefined,
    };
  }
}

export async function saveExecutiveCommitteeData(data: { content: string, membersContent: string }): Promise<void> {
  try {
    const docRef = doc(db, COMMITTEE_COLLECTION, COMMITTEE_CONTENT_DOC_ID);
    await setDoc(docRef, {
      content: data.content,
      membersContent: data.membersContent,
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Error saving executive committee content:", error);
    if (error instanceof Error) {
        if (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied") {
          throw new Error(`Failed to save content: Permission denied. Please ensure you are logged in as an admin and your Firestore security rules allow admin writes to the '${COMMITTEE_COLLECTION}/${COMMITTEE_CONTENT_DOC_ID}' document.`);
        }
        throw new Error(`Failed to save committee content: ${error.message}`);
    }
    throw new Error('An unknown error occurred while saving committee content.');
  }
}

// --- Functions for Managing Members ---

export async function addExecutiveMember(member: Omit<ExecutiveMemberData, 'id' | 'createdAt'>): Promise<string> {
    try {
        const membersCollectionRef = collection(db, COMMITTEE_COLLECTION, COMMITTEE_CONTENT_DOC_ID, MEMBERS_SUBCOLLECTION);
        const docRef = await addDoc(membersCollectionRef, {
            ...member,
            createdAt: serverTimestamp() as Timestamp,
        });
        return docRef.id;
    } catch(error) {
        console.error("Error adding executive member:", error);
        if (error instanceof Error && (error.message.includes("permission-denied") || error.message.includes("Missing or insufficient permissions"))) {
            throw new Error("Failed to add member: Firestore permission denied. Check security rules for the executiveCommittee members subcollection.");
        }
        throw new Error("An unexpected error occurred while adding the member.");
    }
}

export async function getExecutiveMembers(): Promise<ExecutiveMemberData[]> {
    try {
        const membersCollectionRef = collection(db, COMMITTEE_COLLECTION, COMMITTEE_CONTENT_DOC_ID, MEMBERS_SUBCOLLECTION);
        const q = query(membersCollectionRef, orderBy("createdAt", "asc"));
        const querySnapshot = await getDocs(q);
        const members: ExecutiveMemberData[] = [];
        querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
            const data = docSnap.data();
            members.push({
                id: docSnap.id,
                name: data.name,
                designation: data.designation,
                cellNumber: data.cellNumber,
                committeeType: data.committeeType || 'কার্যকরী কমিটি', // Default value if not set
                createdAt: data.createdAt as Timestamp,
            });
        });
        return members;
    } catch(error) {
        console.error("Error fetching executive members:", error);
        if (error instanceof Error && (error.message.includes("permission-denied") || error.message.includes("Missing or insufficient permissions"))) {
            throw new Error("You do not have permission to view members.");
        }
        throw new Error("An unexpected error occurred while fetching members.");
    }
}

export async function updateExecutiveMember(memberId: string, updates: Partial<Omit<ExecutiveMemberData, 'id' | 'createdAt'>>): Promise<void> {
    try {
        const memberDocRef = doc(db, COMMITTEE_COLLECTION, COMMITTEE_CONTENT_DOC_ID, MEMBERS_SUBCOLLECTION, memberId);
        await updateDoc(memberDocRef, updates);
    } catch(error) {
        console.error("Error updating executive member:", error);
        if (error instanceof Error && (error.message.includes("permission-denied") || error.message.includes("Missing or insufficient permissions"))) {
            throw new Error("Failed to update member: Firestore permission denied.");
        }
        throw new Error("An unexpected error occurred while updating the member.");
    }
}

export async function deleteExecutiveMember(memberId: string): Promise<void> {
    try {
        const memberDocRef = doc(db, COMMITTEE_COLLECTION, COMMITTEE_CONTENT_DOC_ID, MEMBERS_SUBCOLLECTION, memberId);
        await deleteDoc(memberDocRef);
    } catch(error) {
        console.error("Error deleting executive member:", error);
        if (error instanceof Error && (error.message.includes("permission-denied") || error.message.includes("Missing or insufficient permissions"))) {
            throw new Error("Failed to delete member: Firestore permission denied.");
        }
        throw new Error("An unexpected error occurred while deleting the member.");
    }
}
