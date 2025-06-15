
// src/services/eventService.ts
import { db, storage, auth } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, Timestamp, serverTimestamp, query, orderBy, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface EventData {
  id?: string;
  title: string;
  details: string;
  eventDate: Timestamp;
  imageUrl?: string | null;
  imagePath?: string | null; // To help with potential future deletion/updates
  createdAt: Timestamp;
}

export interface NewEventInput {
  title: string;
  details: string;
  eventDate: Date;
  attachmentFile?: File | null;
}

export async function addEvent(eventInput: NewEventInput): Promise<string> {
  let imageUrl: string | undefined = undefined;
  let imagePath: string | undefined = undefined;

  if (eventInput.attachmentFile) {
    try {
      const timestamp = new Date().getTime();
      const uniqueFileName = `event_${timestamp}_${eventInput.attachmentFile.name.replace(/\s+/g, '_')}`;
      const storagePath = `event_attachments/${uniqueFileName}`;
      const storageRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(storageRef, eventInput.attachmentFile);
      imageUrl = await getDownloadURL(snapshot.ref);
      imagePath = storagePath;
    } catch (uploadError: any) {
      if (uploadError.code === 'storage/unauthorized' || (uploadError.message && uploadError.message.includes('storage/unauthorized'))) {
        console.warn(`[eventService.addEvent] Storage permission denied for event attachment: ${uploadError.message}. The event will be created without this attachment. Please check your Firebase Storage security rules to allow writes to 'event_attachments/'.`);
      } else {
        console.error("[eventService.addEvent] Error uploading event attachment, this is not a permission issue: ", uploadError);
        throw new Error(`Failed to add event: Firebase Storage permission denied. Please check your Storage security rules to allow writes to 'event_attachments/'. Original error: ${uploadError.message}`);
      }
    }
  }

  try {
    const dataToSave: Omit<EventData, 'id' | 'createdAt' | 'eventDate'> & { createdAt: Timestamp, eventDate: Timestamp } = {
      title: eventInput.title,
      details: eventInput.details,
      eventDate: Timestamp.fromDate(eventInput.eventDate),
      imageUrl: imageUrl || null,
      imagePath: imagePath || null,
      createdAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(collection(db, 'events'), dataToSave);
    return docRef.id;
  } catch (error) {
    console.error("[eventService.addEvent] Error adding event to Firestore (after attachment handling): ", error);
    if (error instanceof Error) {
      throw new Error(`Failed to add event: ${error.message}`);
    }
    throw new Error('An unknown error occurred while adding the event.');
  }
}

export async function getEvents(order: 'asc' | 'desc' = 'asc'): Promise<EventData[]> {
  try {
    const eventsCollectionRef = collection(db, "events");
    const q = query(eventsCollectionRef, orderBy("eventDate", order), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const events: EventData[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data();
      events.push({
        id: docSnap.id,
        title: data.title,
        details: data.details,
        eventDate: data.eventDate as Timestamp,
        imageUrl: data.imageUrl || null,
        imagePath: data.imagePath || null,
        createdAt: data.createdAt as Timestamp,
      });
    });
    return events;
  } catch (error) {
    console.error("[eventService.getEvents] Error fetching events from Firestore: ", error);
    if (error instanceof Error) {
      if (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied") {
        console.error(`[eventService.getEvents] FIREBASE PERMISSION_DENIED: User ${auth.currentUser?.email || '(unknown user)'} does not have permission to read the 'events' collection. Please check Firestore security rules.`);
      } else if (error.message.toLowerCase().includes("query requires an index") || error.message.toLowerCase().includes("the query requires an index")) {
        const indexCreationLinkMatch = error.message.match(/(https?:\/\/[^\s]+)/);
        const indexLink = indexCreationLinkMatch ? indexCreationLinkMatch[0] : "No link provided in error message.";
        console.error(`[eventService.getEvents] FIRESTORE_INDEX_REQUIRED: The query on 'events' collection (ordered by eventDate ${order}, createdAt desc) requires a composite index. Please create it in your Firebase console. Link from error: ${indexLink}`);
      }
      throw new Error(`Failed to fetch events: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching events.');
  }
}

export async function getEventById(id: string): Promise<EventData | null> {
  try {
    const docRef = doc(db, "events", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        details: data.details,
        eventDate: data.eventDate as Timestamp,
        imageUrl: data.imageUrl || null,
        imagePath: data.imagePath || null,
        createdAt: data.createdAt as Timestamp,
      } as EventData;
    } else {
      console.log(`No event document found with ID: ${id}`);
      return null;
    }
  } catch (error) {
    console.error(`[eventService.getEventById] Error fetching event by ID (${id}) from Firestore: `, error);
    if (error instanceof Error) {
       if (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied") {
        console.error(`[eventService.getEventById] FIREBASE PERMISSION_DENIED: User ${auth.currentUser?.email || '(unknown user)'} does not have permission to read 'events/${id}'. Please check Firestore security rules.`);
      }
      throw new Error(`Failed to fetch event: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching the event.');
  }
}

