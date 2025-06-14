
// src/services/expenseService.ts
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, Timestamp, serverTimestamp, query, orderBy, type DocumentData, type QueryDocumentSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export interface ExpenseData {
  id?: string;
  name: string;
  details: string;
  amount: number; // Added amount
  attachmentUrl?: string | null;
  attachmentPath?: string | null;
  createdAt: Timestamp;
  createdBy?: string;
}

export interface NewExpenseInput {
  name: string;
  details: string;
  amount: number; // Added amount
  attachmentFile?: File | null;
  userId?: string;
}

export interface UpdateExpenseInput {
    name?: string;
    details?: string;
    amount?: number;
    attachmentFile?: File | null; // For new/replacement attachment
    // attachmentUrl and attachmentPath will be handled internally if attachmentFile is present
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
      attachmentPath = storagePath;
    }

    const dataToSave: Omit<ExpenseData, 'id' | 'createdAt'> & { createdAt: Timestamp } = {
      name: expenseInput.name,
      details: expenseInput.details,
      amount: expenseInput.amount, // Save amount
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
        amount: data.amount || 0, // Get amount, default to 0
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
        amount: data.amount || 0,
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


export async function getApprovedExpensesTotal(): Promise<number> {
  try {
    const expensesCollectionRef = collection(db, "expenses");
    // Assuming all expenses are "approved" for now.
    // If an approval status is added, query 'where("status", "==", "approved")'
    const querySnapshot = await getDocs(expensesCollectionRef);
    let totalExpenses = 0;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.amount && typeof data.amount === 'number') {
        totalExpenses += data.amount;
      }
    });
    return totalExpenses;
  } catch (error) {
    console.error("Error fetching total approved expenses:", error);
    return 0; // Return 0 on error
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
    }
  }
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const expenseDocRef = doc(db, "expenses", expenseId);
  try {
    const expenseSnap = await getDoc(expenseDocRef);
    if (!expenseSnap.exists()) {
      throw new Error("Expense not found for deletion.");
    }
    const expenseData = expenseSnap.data() as ExpenseData;

    // Delete attachment if it exists
    if (expenseData.attachmentPath) {
      await deleteExpenseAttachment(expenseData.attachmentPath);
    }

    // Delete the expense document
    await deleteDoc(expenseDocRef);
    console.log(`Expense ${expenseId} deleted successfully.`);
    // The platform total will reflect this change upon next fetch by display components.
  } catch (error) {
    console.error(`Error deleting expense ${expenseId}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete expense: ${error.message}`);
    }
    throw new Error('An unknown error occurred while deleting the expense.');
  }
}

export async function updateExpense(expenseId: string, updates: UpdateExpenseInput, existingAttachmentPath?: string | null): Promise<void> {
    const expenseDocRef = doc(db, "expenses", expenseId);
    const dataToUpdate: Partial<ExpenseData> = { ...updates }; // remove attachmentFile

    delete (dataToUpdate as any).attachmentFile; // remove from data to be saved directly

    try {
        if (updates.attachmentFile) {
            // If there's an old attachment, delete it
            if (existingAttachmentPath) {
                await deleteExpenseAttachment(existingAttachmentPath);
            }
            // Upload new attachment
            const timestamp = new Date().getTime();
            const uniqueFileName = `${timestamp}_${updates.attachmentFile.name.replace(/\s+/g, '_')}`;
            const storagePath = `expense_attachments/${uniqueFileName}`;
            const storageRef = ref(storage, storagePath);
            
            const snapshot = await uploadBytes(storageRef, updates.attachmentFile);
            dataToUpdate.attachmentUrl = await getDownloadURL(snapshot.ref);
            dataToUpdate.attachmentPath = storagePath;
        } else if (updates.attachmentFile === null && existingAttachmentPath) {
            // If attachmentFile is explicitly set to null (meaning remove existing attachment without new one)
            await deleteExpenseAttachment(existingAttachmentPath);
            dataToUpdate.attachmentUrl = null;
            dataToUpdate.attachmentPath = null;
        }


        dataToUpdate.lastUpdated = serverTimestamp() as Timestamp;
        await updateDoc(expenseDocRef, dataToUpdate);
        console.log(`Expense ${expenseId} updated successfully.`);
    } catch (error) {
        console.error(`Error updating expense ${expenseId}:`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to update expense: ${error.message}`);
        }
        throw new Error('An unknown error occurred while updating the expense.');
    }
}
