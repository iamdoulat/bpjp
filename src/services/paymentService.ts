
// src/services/paymentService.ts
import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp, type DocumentData, type QueryDocumentSnapshot, orderBy, query, addDoc } from 'firebase/firestore';

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
      console.log(`[paymentService.getPaymentTransactions] Processing document ID: ${docSnap.id}, Data:`, JSON.parse(JSON.stringify(data)));
      try {
        const transaction: PaymentTransaction = {
          id: docSnap.id,
          userId: data.userId || 'N/A', // Default to 'N/A' if userId is missing
          userEmail: data.userEmail,
          date: data.date ? (data.date as Timestamp).toDate() : new Date(0), // Default to epoch if date is missing
          method: data.method || 'Unknown', // Default if method is missing
          amount: data.amount || 0, // Default if amount is missing
          status: data.status || 'Pending', // Default if status is missing
          campaignId: data.campaignId,
          campaignName: data.campaignName,
          lastFourDigits: data.lastFourDigits,
          transactionReference: data.transactionReference,
        };
        transactions.push(transaction);
        console.log(`[paymentService.getPaymentTransactions] Successfully mapped document ID: ${docSnap.id}`);
      } catch (mappingError) {
        console.error(`[paymentService.getPaymentTransactions] Error mapping document ID ${docSnap.id}:`, mappingError, "Raw data:", JSON.parse(JSON.stringify(data)));
        // Optionally, you could push a partially mapped object or skip it
      }
    });
    console.log('[paymentService.getPaymentTransactions] Returning transactions:', transactions);
    return transactions;
  } catch (error) {
    console.error("[paymentService.getPaymentTransactions] Error fetching payment transactions from Firestore: ", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch payment transactions: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching payment transactions.');
  }
}

// Future functions like updatePaymentTransactionStatus, etc. can be added here.
