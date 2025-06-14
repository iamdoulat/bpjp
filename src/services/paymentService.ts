
// src/services/paymentService.ts
import { db, auth } from '@/lib/firebase'; // Added auth
import { collection, getDocs, Timestamp, type DocumentData, type QueryDocumentSnapshot, orderBy, query, addDoc, doc, updateDoc, where, deleteDoc, getDoc,getCountFromServer, runTransaction, type DocumentSnapshot } from 'firebase/firestore'; // Added runTransaction and DocumentSnapshot
import type { UserProfileData } from './userService'; // Import UserProfileData

// Interface for data stored and retrieved from Firestore
export interface PaymentTransaction {
  id: string; // Firestore document ID
  userId: string;
  userEmail?: string; // Good to store for easier display if needed
  date: Date | Timestamp; // JS Date for input, Firestore Timestamp for storage/output
  method: "BKash" | "Wallet" | "Manual Verification" | string; // More specific types + string for legacy
  amount: number;
  status: "Succeeded" | "Pending" | "Failed" | "Refunded";
  campaignId?: string;
  campaignName?: string;
  lastFourDigits?: string; // For verification, primarily for BKash
  receiverBkashNo?: string; // Specific to BKash
  transactionReference?: string; // Optional field for a full reference if available
}

// Data for creating a new transaction via the UI
export interface NewPaymentTransactionInput {
  userId: string;
  userEmail?: string;
  campaignId: string;
  campaignName: string;
  amount: number;
  paymentMethod: "BKash" | "Wallet"; // Explicit payment method
  // Fields specific to BKash
  lastFourDigits?: string;
  receiverBkashNo?: string;
}


const PAYMENT_TRANSACTIONS_COLLECTION = 'paymentTransactions';
const CAMPAIGNS_COLLECTION = 'campaigns';
const USER_PROFILES_COLLECTION = 'userProfiles';

export async function addPaymentTransaction(transactionInput: NewPaymentTransactionInput): Promise<string> {
  const paymentDocRef = doc(collection(db, PAYMENT_TRANSACTIONS_COLLECTION));
  const campaignDocRef = doc(db, CAMPAIGNS_COLLECTION, transactionInput.campaignId);
  const userProfileDocRef = doc(db, USER_PROFILES_COLLECTION, transactionInput.userId);

  try {
    await runTransaction(db, async (transaction) => {
      let initialStatus: "Succeeded" | "Pending";
      let campaignSnap: DocumentSnapshot<DocumentData> | null = null;
      let userProfileSnap: DocumentSnapshot<DocumentData> | null = null;

      // --- READ PHASE ---
      campaignSnap = await transaction.get(campaignDocRef);
      if (!campaignSnap.exists()) {
        throw new Error(`Campaign ${transactionInput.campaignId} not found.`);
      }

      if (transactionInput.paymentMethod === "Wallet") {
        userProfileSnap = await transaction.get(userProfileDocRef);
        if (!userProfileSnap.exists()) {
          throw new Error(`User profile ${transactionInput.userId} not found.`);
        }
      }

      // --- LOGIC & PREPARATION PHASE ---
      const campaignDataFromSnap = campaignSnap.data(); // campaignSnap is guaranteed to exist here
      let newWalletBalance: number | undefined = undefined;

      if (transactionInput.paymentMethod === "Wallet") {
        const userProfileData = userProfileSnap!.data() as UserProfileData; 
        const currentWalletBalance = userProfileData.walletBalance || 0;

        if (currentWalletBalance < transactionInput.amount) {
          throw new Error("Insufficient wallet balance.");
        }
        newWalletBalance = currentWalletBalance - transactionInput.amount;
        initialStatus = "Succeeded" as const;
      } else {
        initialStatus = "Pending" as const;
      }

      const dataToSave: Omit<PaymentTransaction, 'id' | 'date'> & { date: Timestamp; status: "Succeeded" | "Pending" } = {
        userId: transactionInput.userId,
        userEmail: transactionInput.userEmail,
        campaignId: transactionInput.campaignId,
        campaignName: transactionInput.campaignName,
        amount: transactionInput.amount,
        date: Timestamp.now(),
        status: initialStatus,
        method: transactionInput.paymentMethod,
      };

      if (transactionInput.paymentMethod === "BKash") {
        if (transactionInput.lastFourDigits) dataToSave.lastFourDigits = transactionInput.lastFourDigits;
        if (transactionInput.receiverBkashNo) dataToSave.receiverBkashNo = transactionInput.receiverBkashNo;
      }


      // --- WRITE PHASE ---
      transaction.set(paymentDocRef, dataToSave);

      if (initialStatus === "Succeeded") { 
        // Update campaign's raisedAmount
        const currentRaisedAmount = campaignDataFromSnap.raisedAmount || 0;
        const newRaisedAmount = currentRaisedAmount + transactionInput.amount;
        transaction.update(campaignDocRef, { raisedAmount: newRaisedAmount });

        // Update user's wallet balance if it was a wallet payment
        if (transactionInput.paymentMethod === "Wallet" && newWalletBalance !== undefined) {
          transaction.update(userProfileDocRef, { walletBalance: newWalletBalance });
        }
      }
    });

    console.log('[paymentService.addPaymentTransaction] Transaction saved with ID:', paymentDocRef.id);
    return paymentDocRef.id;

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
  const transactionDocRef = doc(db, PAYMENT_TRANSACTIONS_COLLECTION, transactionId);
  
  try {
    await runTransaction(db, async (transaction) => {
      const transactionSnap = await transaction.get(transactionDocRef);
      if (!transactionSnap.exists()) {
        throw new Error(`Transaction ${transactionId} not found.`);
      }
      const currentTransactionData = transactionSnap.data() as Omit<PaymentTransaction, 'id' | 'date'> & { date: Timestamp };
      
      const oldStatus = currentTransactionData.status;
      const amount = currentTransactionData.amount;
      const campaignId = currentTransactionData.campaignId;
      const userId = currentTransactionData.userId; // Get userId for wallet operations

      // Update campaign's raisedAmount if status change affects it
      if (campaignId && typeof amount === 'number' && amount > 0) {
        const campaignDocRef = doc(db, CAMPAIGNS_COLLECTION, campaignId);
        const campaignSnap = await transaction.get(campaignDocRef);

        if (campaignSnap.exists()) {
          let currentRaisedAmount = campaignSnap.data().raisedAmount || 0;
          let newRaisedAmount = currentRaisedAmount;
          let campaignUpdateNeeded = false;

          if (newStatus === "Succeeded" && oldStatus !== "Succeeded") {
            newRaisedAmount = currentRaisedAmount + amount;
            campaignUpdateNeeded = true;
          } else if (oldStatus === "Succeeded" && newStatus !== "Succeeded") {
            newRaisedAmount = Math.max(0, currentRaisedAmount - amount);
            campaignUpdateNeeded = true;
          }

          if (campaignUpdateNeeded) {
            transaction.update(campaignDocRef, { raisedAmount: newRaisedAmount });
          }
        } else {
          console.warn(`[paymentService.updatePaymentTransactionStatus] Campaign ${campaignId} not found. Cannot update raisedAmount.`);
        }
      }

      // Wallet balance adjustment logic for Refunds
      if (newStatus === "Refunded" && oldStatus === "Succeeded" && userId && typeof amount === 'number' && amount > 0) {
        const userProfileDocRef = doc(db, USER_PROFILES_COLLECTION, userId);
        const userProfileSnap = await transaction.get(userProfileDocRef);
        if (userProfileSnap.exists()) {
          const userProfileData = userProfileSnap.data() as UserProfileData;
          const currentWalletBalance = userProfileData.walletBalance || 0;
          const updatedWalletBalance = currentWalletBalance + amount;
          transaction.update(userProfileDocRef, { walletBalance: updatedWalletBalance });
          console.log(`[paymentService.updatePaymentTransactionStatus] User ${userId} wallet credited with ${amount} due to refund. New balance: ${updatedWalletBalance}`);
        } else {
           console.warn(`[paymentService.updatePaymentTransactionStatus] User profile ${userId} not found for refund. Wallet not credited.`);
        }
      }


      // Now update the payment transaction status
      transaction.update(transactionDocRef, {
        status: newStatus,
        lastUpdated: Timestamp.now(), 
      });
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


export async function deletePaymentTransaction(transactionId: string): Promise<void> {
  const transactionDocRef = doc(db, PAYMENT_TRANSACTIONS_COLLECTION, transactionId);
  try {
    await runTransaction(db, async (transaction) => {
      const transactionSnap = await transaction.get(transactionDocRef);
      if (!transactionSnap.exists()) {
        console.warn(`[paymentService.deletePaymentTransaction] Transaction ${transactionId} not found for deletion.`);
        return; 
      }
      const transactionData = transactionSnap.data() as Omit<PaymentTransaction, 'id' | 'date'> & { date: Timestamp };

      if (transactionData.status === "Succeeded" && transactionData.campaignId && typeof transactionData.amount === 'number' && transactionData.amount > 0) {
        const campaignDocRef = doc(db, CAMPAIGNS_COLLECTION, transactionData.campaignId);
        const campaignSnap = await transaction.get(campaignDocRef);
        if (campaignSnap.exists()) {
          let currentRaisedAmount = campaignSnap.data().raisedAmount || 0;
          let newRaisedAmount = Math.max(0, currentRaisedAmount - transactionData.amount);
          transaction.update(campaignDocRef, { raisedAmount: newRaisedAmount });
        } else {
           console.warn(`[paymentService.deletePaymentTransaction] Campaign ${transactionData.campaignId} not found. Cannot adjust raisedAmount.`);
        }
      }
      // Note: Deleting a transaction does not automatically refund to wallet here. Refunds are explicit status changes.
      transaction.delete(transactionDocRef);
    });
    console.log(`[paymentService.deletePaymentTransaction] Successfully deleted transaction ${transactionId}.`);
  } catch (error) {
    console.error(`[paymentService.deletePaymentTransaction] Error deleting transaction ${transactionId}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to delete payment transaction: ${error.message}`);
    }
    throw new Error('An unknown error occurred while deleting the payment transaction.');
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
    if (error instanceof Error && (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied")) {
        console.error("[paymentService.getSucceededPlatformDonationsTotal] PERMISSION DENIED. Check Firestore security rules for reading 'paymentTransactions' collection, especially for admins performing collection queries.");
    }
    return 0;
  }
}

export async function getUniqueCampaignsSupportedByUser(userId: string): Promise<number> {
  if (!userId) {
    console.log('[paymentService.getUniqueCampaignsSupportedByUser] No userId provided, returning 0.');
    return 0;
  }
  console.log(`[paymentService.getUniqueCampaignsSupportedByUser] Fetching campaigns supported by user: ${userId}`);
  try {
    const paymentTransactionsRef = collection(db, PAYMENT_TRANSACTIONS_COLLECTION);
    const q = query(
      paymentTransactionsRef,
      where("userId", "==", userId),
      where("status", "==", "Succeeded")
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`[paymentService.getUniqueCampaignsSupportedByUser] No "Succeeded" transactions found for user ${userId}.`);
      return 0;
    }

    const supportedCampaignIds = new Set<string>();
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.campaignId) {
        supportedCampaignIds.add(data.campaignId);
      }
    });

    console.log(`[paymentService.getUniqueCampaignsSupportedByUser] User ${userId} supported ${supportedCampaignIds.size} unique campaigns.`);
    return supportedCampaignIds.size;
  } catch (error) {
    console.error(`[paymentService.getUniqueCampaignsSupportedByUser] Error fetching campaigns supported by user ${userId}:`, error);
    if (error instanceof Error && (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied")) {
        console.error(`[paymentService.getUniqueCampaignsSupportedByUser] PERMISSION DENIED. Check Firestore security rules for querying 'paymentTransactions' collection by userId and status.`);
    }
    return 0; // Return 0 on error or if permissions fail
  }
}

export async function getTotalDonationsByUser(userId: string): Promise<number> {
  if (!userId) {
    console.log('[paymentService.getTotalDonationsByUser] No userId provided, returning 0.');
    return 0;
  }
  console.log(`[paymentService.getTotalDonationsByUser] Fetching total succeeded donations for user: ${userId}`);
  try {
    const paymentTransactionsRef = collection(db, PAYMENT_TRANSACTIONS_COLLECTION);
    const q = query(
      paymentTransactionsRef,
      where("userId", "==", userId),
      where("status", "==", "Succeeded")
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`[paymentService.getTotalDonationsByUser] No "Succeeded" transactions found for user ${userId}.`);
      return 0;
    }

    let totalUserDonations = 0;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.amount && typeof data.amount === 'number') {
        totalUserDonations += data.amount;
      }
    });

    console.log(`[paymentService.getTotalDonationsByUser] User ${userId} total succeeded donations: ${totalUserDonations}.`);
    return totalUserDonations;
  } catch (error) {
    console.error(`[paymentService.getTotalDonationsByUser] Error fetching total donations for user ${userId}:`, error);
     if (error instanceof Error && (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied")) {
        console.error(`[paymentService.getTotalDonationsByUser] PERMISSION DENIED. Check Firestore security rules for querying 'paymentTransactions' collection by userId and status.`);
    }
    return 0; 
  }
}

export async function getTotalRefundedByUser(userId: string): Promise<number> {
  if (!userId) {
    console.log('[paymentService.getTotalRefundedByUser] No userId provided, returning 0.');
    return 0;
  }
  console.log(`[paymentService.getTotalRefundedByUser] Fetching total refunded donations for user: ${userId}`);
  try {
    const paymentTransactionsRef = collection(db, PAYMENT_TRANSACTIONS_COLLECTION);
    const q = query(
      paymentTransactionsRef,
      where("userId", "==", userId),
      where("status", "==", "Refunded")
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`[paymentService.getTotalRefundedByUser] No "Refunded" transactions found for user ${userId}.`);
      return 0;
    }

    let totalUserRefunds = 0;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.amount && typeof data.amount === 'number') {
        totalUserRefunds += data.amount;
      }
    });

    console.log(`[paymentService.getTotalRefundedByUser] User ${userId} total refunded donations: ${totalUserRefunds}.`);
    return totalUserRefunds;
  } catch (error) {
    console.error(`[paymentService.getTotalRefundedByUser] Error fetching total refunded for user ${userId}:`, error);
    if (error instanceof Error && (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied")) {
        console.error(`[paymentService.getTotalRefundedByUser] PERMISSION DENIED. Check Firestore security rules for querying 'paymentTransactions' collection by userId and status.`);
    }
    return 0; 
  }
}

export async function getPendingPaymentsCount(): Promise<number> {
  console.log('[paymentService.getPendingPaymentsCount] Attempting to count Pending payments.');
  try {
    const paymentTransactionsRef = collection(db, PAYMENT_TRANSACTIONS_COLLECTION);
    const q = query(paymentTransactionsRef, where("status", "==", "Pending"));
    const snapshot = await getCountFromServer(q);
    const count = snapshot.data().count;
    console.log(`[paymentService.getPendingPaymentsCount] Found ${count} pending payments.`);
    return count;
  } catch (error) {
    console.error("[paymentService.getPendingPaymentsCount] Error counting pending payments:", error);
    if (error instanceof Error && (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied")) {
        console.error("[paymentService.getPendingPaymentsCount] PERMISSION DENIED. Check Firestore security rules.");
    }
    return 0; // Return 0 on error
  }
}

// New function to credit wallet (e.g., admin manually adds funds or system processes a refund)
export async function creditWallet(userId: string, amount: number): Promise<void> {
  if (!userId) throw new Error("User ID is required.");
  if (amount <= 0) throw new Error("Credit amount must be positive.");

  const userProfileDocRef = doc(db, USER_PROFILES_COLLECTION, userId);
  try {
    await runTransaction(db, async (transaction) => {
      const userProfileSnap = await transaction.get(userProfileDocRef);
      if (!userProfileSnap.exists()) {
        throw new Error(`User profile ${userId} not found.`);
      }
      const userProfileData = userProfileSnap.data() as UserProfileData;
      const currentWalletBalance = userProfileData.walletBalance || 0;
      const newWalletBalance = currentWalletBalance + amount;
      transaction.update(userProfileDocRef, { walletBalance: newWalletBalance });
    });
    console.log(`[paymentService.creditWallet] User ${userId} wallet credited with ${amount}.`);
  } catch (error) {
    console.error(`[paymentService.creditWallet] Error crediting wallet for user ${userId}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to credit wallet: ${error.message}`);
    }
    throw new Error('An unknown error occurred while crediting wallet.');
  }
}

// New function for admin to debit wallet (e.g. manual adjustment)
export async function debitWallet(userId: string, amount: number): Promise<void> {
  if (!userId) throw new Error("User ID is required.");
  if (amount <= 0) throw new Error("Debit amount must be positive.");

  const userProfileDocRef = doc(db, USER_PROFILES_COLLECTION, userId);
  try {
    await runTransaction(db, async (transaction) => {
      const userProfileSnap = await transaction.get(userProfileDocRef);
      if (!userProfileSnap.exists()) {
        throw new Error(`User profile ${userId} not found.`);
      }
      const userProfileData = userProfileSnap.data() as UserProfileData;
      const currentWalletBalance = userProfileData.walletBalance || 0;
      if (currentWalletBalance < amount) {
        throw new Error("Insufficient wallet balance for debit.");
      }
      const newWalletBalance = currentWalletBalance - amount;
      transaction.update(userProfileDocRef, { walletBalance: newWalletBalance });
    });
    console.log(`[paymentService.debitWallet] User ${userId} wallet debited by ${amount}.`);
  } catch (error) {
    console.error(`[paymentService.debitWallet] Error debiting wallet for user ${userId}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to debit wallet: ${error.message}`);
    }
    throw new Error('An unknown error occurred while debiting wallet.');
  }
}

// When a payment status changes to "Refunded" (and was previously "Succeeded"),
// the user's wallet should be credited with the donation amount.
// This is now handled within updatePaymentTransactionStatus.
// Note: If a "Pending" or "Failed" payment is marked as "Refunded", 
// it implies an administrative action and might not involve wallet crediting
// unless money was actually collected and then returned. The current logic in
// updatePaymentTransactionStatus credits wallet only if changing from Succeeded to Refunded.

