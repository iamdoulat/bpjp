
// src/services/expenseService.ts
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, Timestamp, serverTimestamp, query, orderBy, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export interface ExpenseData {
  id?: string;
  name: string;
  details: string;
  attachmentUrl?: string | null;
  attachmentPath?: string | null; // To store the full path in Firebase Storage for deletion
  createdAt: Timestamp;
  createdBy?: string; // Optional: UID of the user who created it
}

export interface NewExpenseInput {
  name: string;
  details: string;
  attachmentFile?: File | null;
  userId?: string; // UID of the user creating the expense
}

export async function addExpense(expenseInput: NewExpenseInput): Promise<string> {
  try {
    let attachmentUrl: string | undefined = undefined;
    let attachmentPath: string | undefined = undefined;

    if (expenseInput.attachmentFile) {
      const timestamp = new Date().getTime();
      const uniqueFileName = `${timestamp}_${expenseInput.attachmentFile.name.replace(/\s+/g, '_')}`;
      const storagePath = `expense_attachments/${uniqueFileName}`;
      const storageRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(storageRef, expenseInput.attachmentFile);
      attachmentUrl = await getDownloadURL(snapshot.ref);
      attachmentPath = storagePath; // Store the full path
    }

    const dataToSave: Omit<ExpenseData, 'id' | 'createdAt'> & { createdAt: Timestamp } = {
      name: expenseInput.name,
      details: expenseInput.details,
      attachmentUrl: attachmentUrl || null,
      attachmentPath: attachmentPath || null,
      createdAt: serverTimestamp() as Timestamp,
    };
    if (expenseInput.userId) {
        dataToSave.createdBy = expenseInput.userId;
    }

    const docRef = await addDoc(collection(db, 'expenses'), dataToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error adding expense to Firestore: ", error);
    if (error instanceof Error) {
      throw new Error(`Failed to add expense: ${error.message}`);
    }
    throw new Error('An unknown error occurred while adding the expense.');
  }
}

export async function getExpenses(): Promise<ExpenseData[]> {
  try {
    const expensesCollectionRef = collection(db, "expenses");
    const q = query(expensesCollectionRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const expenses: ExpenseData[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data();
      expenses.push({
        id: docSnap.id,
        name: data.name,
        details: data.details,
        attachmentUrl: data.attachmentUrl || null,
        attachmentPath: data.attachmentPath || null,
        createdAt: data.createdAt as Timestamp,
        createdBy: data.createdBy,
      });
    });
    return expenses;
  } catch (error) {
    console.error("Error fetching expenses from Firestore: ", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch expenses: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching expenses.');
  }
}

export async function getExpenseById(id: string): Promise<ExpenseData | null> {
  try {
    const docRef = doc(db, "expenses", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        details: data.details,
        attachmentUrl: data.attachmentUrl || null,
        attachmentPath: data.attachmentPath || null,
        createdAt: data.createdAt as Timestamp,
        createdBy: data.createdBy,
      } as ExpenseData;
    } else {
      console.log(`No expense document found with ID: ${id}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching expense by ID (${id}) from Firestore: `, error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch expense: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching the expense.');
  }
}

export async function deleteExpenseAttachment(filePath: string): Promise<void> {
  if (!filePath) {
    console.warn("No attachment path provided for deletion.");
    return;
  }
  const storageRef = ref(storage, filePath);
  try {
    await deleteObject(storageRef);
    console.log(`Successfully deleted attachment: ${filePath}`);
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.warn(`Attachment not found in storage, skipping deletion: ${filePath}`);
    } else {
      console.error(`Error deleting attachment ${filePath} from storage:`, error);
      // Optionally re-throw or handle as critical if deletion failure is critical
    }
  }
}

// Future functions: deleteExpense, updateExpense
// async function deleteExpense(expenseId: string): Promise<void> { ... }
// async function updateExpense(expenseId: string, updates: Partial<ExpenseData>): Promise<void> { ... }
    