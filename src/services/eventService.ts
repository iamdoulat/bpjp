
// src/services/eventService.ts
import { db, storage } from '@/lib/firebase';
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
      // Check if it's a Firebase Storage permission error specifically for the attachment
      if (uploadError.code === 'storage/unauthorized' || (uploadError.message && uploadError.message.includes('storage/unauthorized'))) {
        console.warn(`Storage permission denied for event attachment: ${uploadError.message}. The event will be created without this attachment. Please check your Firebase Storage security rules to allow writes to 'event_attachments/'.`);
        // imageUrl and imagePath will remain undefined/null, so the event is saved without them.
      } else {
        // If it's a different upload error, re-throw it to fail the whole event creation.
        console.error("Error uploading event attachment, this is not a permission issue: ", uploadError);
        // This specific error will be caught by the outer try-catch block
        throw new Error(`Failed to upload event attachment: ${uploadError.message}`);
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
    console.error("Error adding event to Firestore (after attachment handling): ", error);
    if (error instanceof Error) {
      // The specific permission error for attachment is handled above.
      // This will catch errors from Firestore save or other attachment upload errors.
      throw new Error(`Failed to add event: ${error.message}`);
    }
    throw new Error('An unknown error occurred while adding the event.');
  }
}

export async function getEvents(order: 'asc' | 'desc' = 'asc'): Promise<EventData[]> {
  try {
    const eventsCollectionRef = collection(db, "events");
    // Order by eventDate to show upcoming events first, then by createdAt for same-day events
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
    console.error("Error fetching events from Firestore: ", error);
    if (error instanceof Error) {
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
    console.error(`Error fetching event by ID (${id}) from Firestore: `, error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch event: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching the event.');
  }
}
