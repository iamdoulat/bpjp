
// src/services/paymentService.ts
import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp, type DocumentData, type QueryDocumentSnapshot, orderBy, query } from 'firebase/firestore';

// This interface should match the one in src/app/admin/payments/page.tsx
export interface PaymentTransaction {
  id: string;
  userId: string;
  date: Date;
  method: "Card" | "PayPal" | "Bank Transfer" | string;
  amount: number;
  status: "Succeeded" | "Pending" | "Failed" | "Refunded";
  campaignId?: string;
  campaignName?: string;
}

const PAYMENT_TRANSACTIONS_COLLECTION = 'paymentTransactions'; // Define collection name

export async function getPaymentTransactions(): Promise<PaymentTransaction[]> {
  try {
    const paymentTransactionsRef = collection(db, PAYMENT_TRANSACTIONS_COLLECTION);
    // Order by date descending, assuming 'date' is a Timestamp field in Firestore
    const q = query(paymentTransactionsRef, orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);

    const transactions: PaymentTransaction[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data();
      transactions.push({
        id: docSnap.id,
        userId: data.userId || 'N/A',
        date: (data.date as Timestamp)?.toDate() || new Date(), // Ensure date is a JS Date
        method: data.method || 'Unknown',
        amount: data.amount || 0,
        status: data.status || 'Pending',
        campaignId: data.campaignId,
        campaignName: data.campaignName,
      } as PaymentTransaction);
    });
    return transactions;
  } catch (error) {
    console.error("Error fetching payment transactions from Firestore: ", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch payment transactions: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching payment transactions.');
  }
}

// Future functions like addPaymentTransaction, updatePaymentTransactionStatus, etc. can be added here.
