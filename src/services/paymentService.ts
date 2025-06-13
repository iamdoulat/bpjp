
// src/services/paymentService.ts
import { db, auth } from '@/lib/firebase'; // Added auth
import { collection, getDocs, Timestamp, type DocumentData, type QueryDocumentSnapshot, orderBy, query, addDoc, doc, updateDoc, where } from 'firebase/firestore'; // Added doc, updateDoc, where

// Interface for data stored and retrieved from Firestore
export interface PaymentTransaction {
  id: string; // Firestore document ID
  userId: string;
  userEmail?: string; // Good to store for easier display if needed
  date: Date | Timestamp; // JS Date for input, Firestore Timestamp for storage/output
  method: string; // e.g., "Card", "PayPal", "Manual Verification"
  amount: number;
  status: "Succeeded" | "Pending" | "Failed" | "Refunded";
  campaignId?: string;
  campaignName?: string;
  lastFourDigits?: string; // For verification
  receiverBkashNo?: string;
  transactionReference?: string; // Optional field for a full reference if available
}

// Data for creating a new transaction via the UI
export interface NewPaymentTransactionInput {
  userId: string;
  userEmail?: string; // Optional, can be fetched if user is logged in
  campaignId: string;
  campaignName: string;
  amount: number;
  lastFourDigits: string;
  receiverBkashNo?: string;
}


const PAYMENT_TRANSACTIONS_COLLECTION = 'paymentTransactions';

export async function addPaymentTransaction(transactionInput: NewPaymentTransactionInput): Promise<string> {
  try {
    const dataToSave = {
      ...transactionInput,
      date: Timestamp.now(),
      status: "Pending" as const, // Default status
      method: "Manual Verification", // Default method for popup submissions
    };
    console.log('[paymentService.addPaymentTransaction] Saving transaction:', dataToSave);
    const docRef = await addDoc(collection(db, PAYMENT_TRANSACTIONS_COLLECTION), dataToSave);
    console.log('[paymentService.addPaymentTransaction] Transaction saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("[paymentService.addPaymentTransaction] Error adding payment transaction to Firestore: ", error);
    if (error instanceof Error) {
      throw new Error(`Failed to add payment transaction: ${error.message}`);
    }
    throw new Error('An unknown error occurred while adding the payment transaction.');
  }
}


export async function getPaymentTransactions(): Promise<PaymentTransaction[]> {
  console.log(`[paymentService.getPaymentTransactions] Current auth.currentUser from SDK:`, auth.currentUser);
  console.log(`[paymentService.getPaymentTransactions] User Email from SDK: ${auth.currentUser?.email}`);
  console.log(`[paymentService.getPaymentTransactions] Fetching from collection: ${PAYMENT_TRANSACTIONS_COLLECTION}`);
  try {
    const paymentTransactionsRef = collection(db, PAYMENT_TRANSACTIONS_COLLECTION);
    const q = query(paymentTransactionsRef, orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);

    console.log(`[paymentService.getPaymentTransactions] Query snapshot size: ${querySnapshot.size}`);
    if (querySnapshot.empty) {
      console.log('[paymentService.getPaymentTransactions] No documents found in paymentTransactions collection.');
    }

    const transactions: PaymentTransaction[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data();
      try {
        const transaction: PaymentTransaction = {
          id: docSnap.id,
          userId: data.userId || 'N/A',
          userEmail: data.userEmail,
          date: data.date ? (data.date as Timestamp).toDate() : new Date(0),
          method: data.method || 'Unknown',
          amount: data.amount || 0,
          status: data.status || 'Pending',
          campaignId: data.campaignId,
          campaignName: data.campaignName,
          lastFourDigits: data.lastFourDigits,
          receiverBkashNo: data.receiverBkashNo,
          transactionReference: data.transactionReference,
        };
        transactions.push(transaction);
      } catch (mappingError) {
        console.error(`[paymentService.getPaymentTransactions] Error mapping document ID ${docSnap.id}:`, mappingError, "Raw data:", JSON.parse(JSON.stringify(data)));
      }
    });
    console.log('[paymentService.getPaymentTransactions] Returning transactions:', transactions.length);
    return transactions;
  } catch (error) {
    console.error("[paymentService.getPaymentTransactions] Error fetching payment transactions from Firestore: ", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch payment transactions: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching payment transactions.');
  }
}

export async function updatePaymentTransactionStatus(
  transactionId: string,
  newStatus: PaymentTransaction["status"]
): Promise<void> {
  try {
    const transactionDocRef = doc(db, PAYMENT_TRANSACTIONS_COLLECTION, transactionId);
    await updateDoc(transactionDocRef, {
      status: newStatus,
      lastUpdated: Timestamp.now(), // Optional: track when the status was last updated
    });
    console.log(`[paymentService.updatePaymentTransactionStatus] Successfully updated status for transaction ${transactionId} to ${newStatus}.`);
  } catch (error) {
    console.error(`[paymentService.updatePaymentTransactionStatus] Error updating status for transaction ${transactionId}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
    throw new Error('An unknown error occurred while updating payment status.');
  }
}

export async function getPaymentTransactionsByUserId(userId: string): Promise<PaymentTransaction[]> {
  try {
    const paymentTransactionsRef = collection(db, PAYMENT_TRANSACTIONS_COLLECTION);
    const q = query(
      paymentTransactionsRef,
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    const transactions: PaymentTransaction[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      transactions.push({
        id: docSnap.id,
        userId: data.userId,
        userEmail: data.userEmail,
        date: (data.date as Timestamp).toDate(),
        method: data.method,
        amount: data.amount,
        status: data.status as PaymentTransaction["status"],
        campaignId: data.campaignId,
        campaignName: data.campaignName,
        lastFourDigits: data.lastFourDigits,
        receiverBkashNo: data.receiverBkashNo,
        transactionReference: data.transactionReference,
      });
    });
    return transactions;
  } catch (error) {
    console.error(`[paymentService.getPaymentTransactionsByUserId] Error fetching transactions for user ${userId}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch transactions for user ${userId}: ${error.message}`);
    }
    throw new Error(`An unknown error occurred while fetching transactions for user ${userId}.`);
  }
}

export async function getSucceededPlatformDonationsTotal(): Promise<number> {
  console.log('[paymentService.getSucceededPlatformDonationsTotal] Attempting to fetch total for Succeeded donations.');
  console.log(`[paymentService.getSucceededPlatformDonationsTotal] Current auth user for query: ${auth.currentUser?.email} (UID: ${auth.currentUser?.uid})`);
  try {
    const paymentTransactionsRef = collection(db, PAYMENT_TRANSACTIONS_COLLECTION);
    const q = query(paymentTransactionsRef, where("status", "==", "Succeeded"));
    const querySnapshot = await getDocs(q);

    console.log(`[paymentService.getSucceededPlatformDonationsTotal] Query for 'Succeeded' status returned ${querySnapshot.size} documents.`);
    if (querySnapshot.empty) {
      console.log('[paymentService.getSucceededPlatformDonationsTotal] No "Succeeded" transactions found.');
    }

    let total = 0;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      console.log(`[paymentService.getSucceededPlatformDonationsTotal] Processing doc ID ${docSnap.id}:`, data);
      if (data.amount && typeof data.amount === 'number') {
        total += data.amount;
        console.log(`[paymentService.getSucceededPlatformDonationsTotal] Added ${data.amount} to total. Current total: ${total}`);
      } else {
        console.warn(`[paymentService.getSucceededPlatformDonationsTotal] Document ID ${docSnap.id} has missing or invalid amount:`, data.amount);
      }
    });
    console.log(`[paymentService.getSucceededPlatformDonationsTotal] Final calculated total for Succeeded donations: ${total}`);
    return total;
  } catch (error) {
    console.error("[paymentService.getSucceededPlatformDonationsTotal] Error fetching total succeeded donations:", error);
    // It's crucial to understand the type of error. If it's a permission error, the rules are the problem.
    if (error instanceof Error && (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied")) {
        console.error("[paymentService.getSucceededPlatformDonationsTotal] PERMISSION DENIED. Check Firestore security rules for reading 'paymentTransactions' collection, especially for admins performing collection queries.");
    }
    return 0;
  }
}
