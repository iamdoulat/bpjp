// src/services/paymentService.ts
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, Timestamp, type DocumentData, type QueryDocumentSnapshot, orderBy, query, addDoc, doc, updateDoc, where, deleteDoc, getDoc,getCountFromServer, runTransaction, type DocumentSnapshot } from 'firebase/firestore';
import type { UserProfileData } from './userService';
import { getApprovedExpensesTotal } from './expenseService'; // Import expense total
import { sendWhatsAppConfirmation } from './notificationService';
import { getUserProfile } from './userService';

export interface PaymentTransaction {
  id: string;
  userId: string;
  userEmail?: string;
  date: Date | Timestamp;
  method: "BKash" | "Wallet" | "Manual Verification" | string;
  amount: number;
  status: "Succeeded" | "Pending" | "Failed" | "Refunded";
  campaignId?: string;
  campaignName?: string;
  lastFourDigits?: string;
  receiverBkashNo?: string;
  transactionReference?: string;
}

export interface NewPaymentTransactionInput {
  userId: string;
  userEmail?: string;
  campaignId: string;
  campaignName: string;
  amount: number;
  paymentMethod: "BKash" | "Wallet";
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
    let initialStatus: "Succeeded" | "Pending" = "Pending";
    await runTransaction(db, async (transaction) => {
      let readCampaignRaisedAmount: number;
      let readUserProfileWalletBalance: number | undefined;

      const campaignSnap = await transaction.get(campaignDocRef);
      if (!campaignSnap.exists()) {
        throw new Error(`Campaign ${transactionInput.campaignId} not found.`);
      }
      const campaignDataFromSnap = campaignSnap.data();
      readCampaignRaisedAmount = campaignDataFromSnap.raisedAmount || 0;

      if (transactionInput.paymentMethod === "Wallet") {
        const userProfileSnap = await transaction.get(userProfileDocRef);
        if (!userProfileSnap.exists()) {
          throw new Error(`User profile ${transactionInput.userId} not found.`);
        }
        const userProfileData = userProfileSnap!.data() as UserProfileData;
        readUserProfileWalletBalance = userProfileData.walletBalance || 0;
      }

      let newWalletBalance: number | undefined = undefined;

      if (transactionInput.paymentMethod === "Wallet") {
        if (readUserProfileWalletBalance! < transactionInput.amount) {
          throw new Error("Insufficient wallet balance.");
        }
        newWalletBalance = readUserProfileWalletBalance! - transactionInput.amount;
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
        if (transactionInput.lastFourDigits && transactionInput.lastFourDigits.trim() !== "") {
            dataToSave.lastFourDigits = transactionInput.lastFourDigits;
        }
        if (transactionInput.receiverBkashNo && transactionInput.receiverBkashNo.trim() !== "") {
            dataToSave.receiverBkashNo = transactionInput.receiverBkashNo;
        }
      }
      
      transaction.set(paymentDocRef, dataToSave);

      if (initialStatus === "Succeeded") {
        const newRaisedAmount = readCampaignRaisedAmount + transactionInput.amount;
        transaction.update(campaignDocRef, { raisedAmount: newRaisedAmount });
      }

      if (transactionInput.paymentMethod === "Wallet" && newWalletBalance !== undefined) {
        transaction.update(userProfileDocRef, { walletBalance: newWalletBalance });
      }
    });

    console.log('[paymentService.addPaymentTransaction] Transaction saved with ID:', paymentDocRef.id);
    
    // Fire-and-forget WhatsApp notification
    try {
        const userProfile = await getUserProfile(transactionInput.userId);
        if (userProfile && userProfile.mobileNumber) {
            const paymentDetailsForMsg = {
                amount: transactionInput.amount,
                campaignName: transactionInput.campaignName,
                date: new Date(), // Use current date for notification
                method: transactionInput.paymentMethod,
                lastFourDigits: transactionInput.lastFourDigits, // Pass this along
                status: initialStatus,
            };
            await sendWhatsAppConfirmation(userProfile.mobileNumber, userProfile.displayName || 'Valued Donor', paymentDetailsForMsg);
        } else {
            console.warn(`[paymentService.addPaymentTransaction] Could not send WhatsApp notification for user ${transactionInput.userId}: mobile number not found.`);
        }
    } catch (notificationError) {
        console.error(`[paymentService.addPaymentTransaction] Failed to send WhatsApp notification for transaction ${paymentDocRef.id}:`, notificationError);
        // Do not throw error, as the main transaction was successful.
    }
    
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
      if (error.message.includes("Missing or insufficient permissions") || (error as any).code === "permission-denied") {
        console.error(`[paymentService.getPaymentTransactions] FIREBASE PERMISSION_DENIED: Firestore security rules for collection '${PAYMENT_TRANSACTIONS_COLlection}' do not allow read access for the current user (${auth.currentUser?.email || 'unauthenticated'}). Please check your Firebase console.`);
      }
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
      const userId = currentTransactionData.userId;

      let newWalletBalance: number | undefined;
      let userProfileDocRef: any;
      if (newStatus === "Refunded" && oldStatus === "Succeeded" && userId && typeof amount === 'number' && amount > 0) {
        userProfileDocRef = doc(db, USER_PROFILES_COLLECTION, userId);
        const userProfileSnap = await transaction.get(userProfileDocRef);
        if (userProfileSnap.exists()) {
          const userProfileData = userProfileSnap.data() as UserProfileData;
          const currentWalletBalance = userProfileData.walletBalance || 0;
          newWalletBalance = currentWalletBalance + amount;
        } else {
           console.warn(`[paymentService.updatePaymentTransactionStatus] User profile ${userId} not found for refund. Wallet not credited.`);
        }
      }

      let newRaisedAmount: number | undefined;
      let campaignUpdateNeeded = false;
      let campaignDocRefToUpdate: any;

      if (campaignId && typeof amount === 'number' && amount > 0) {
        campaignDocRefToUpdate = doc(db, CAMPAIGNS_COLLECTION, campaignId);
        const campaignSnap = await transaction.get(campaignDocRefToUpdate);

        if (campaignSnap.exists()) {
          let currentRaisedAmount = campaignSnap.data().raisedAmount || 0;
          
          if (newStatus === "Succeeded" && oldStatus !== "Succeeded") {
            newRaisedAmount = currentRaisedAmount + amount;
            campaignUpdateNeeded = true;
          } else if (oldStatus === "Succeeded" && newStatus !== "Succeeded") {
            newRaisedAmount = Math.max(0, currentRaisedAmount - amount);
            campaignUpdateNeeded = true;
          }
        } else {
          console.warn(`[paymentService.updatePaymentTransactionStatus] Campaign ${campaignId} not found. Cannot update raisedAmount.`);
        }
      }
      
      transaction.update(transactionDocRef, {
        status: newStatus,
        lastUpdated: Timestamp.now(), 
      });

      if (campaignUpdateNeeded && newRaisedAmount !== undefined && campaignDocRefToUpdate) {
        transaction.update(campaignDocRefToUpdate, { raisedAmount: newRaisedAmount });
      }
      
      if (newWalletBalance !== undefined && userProfileDocRef) {
         transaction.update(userProfileDocRef, { walletBalance: newWalletBalance });
         console.log(`[paymentService.updatePaymentTransactionStatus] User ${userId} wallet credited with ${amount} due to refund. New balance: ${newWalletBalance}`);
      }
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

      let campaignDocRefToUpdate: any;
      let newRaisedAmountOnDelete: number | undefined;

      if (transactionData.status === "Succeeded" && transactionData.campaignId && typeof transactionData.amount === 'number' && transactionData.amount > 0) {
        campaignDocRefToUpdate = doc(db, CAMPAIGNS_COLLECTION, transactionData.campaignId);
        const campaignSnap = await transaction.get(campaignDocRefToUpdate);
        if (campaignSnap.exists()) {
          let currentRaisedAmount = campaignSnap.data().raisedAmount || 0;
          newRaisedAmountOnDelete = Math.max(0, currentRaisedAmount - transactionData.amount);
        } else {
           console.warn(`[paymentService.deletePaymentTransaction] Campaign ${transactionData.campaignId} not found. Cannot adjust raisedAmount.`);
        }
      }
      
      if (newRaisedAmountOnDelete !== undefined && campaignDocRefToUpdate) {
        transaction.update(campaignDocRefToUpdate, { raisedAmount: newRaisedAmountOnDelete });
      }
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

export async function getTotalSucceededPaymentTransactions(): Promise<number> {
  console.log('[paymentService.getTotalSucceededPaymentTransactions] Attempting to fetch total for Succeeded donations.');
  try {
    const paymentTransactionsRef = collection(db, PAYMENT_TRANSACTIONS_COLLECTION);
    const q = query(paymentTransactionsRef, where("status", "==", "Succeeded"));
    const querySnapshot = await getDocs(q);

    let total = 0;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.amount && typeof data.amount === 'number') {
        total += data.amount;
      }
    });
    console.log(`[paymentService.getTotalSucceededPaymentTransactions] Final calculated total for Succeeded payments: ${total}`);
    return total;
  } catch (error) {
    console.error("[paymentService.getTotalSucceededPaymentTransactions] Error fetching total succeeded payments:", error);
    return 0;
  }
}

export async function getNetPlatformFundsAvailable(): Promise<number> {
  console.log('[paymentService.getNetPlatformFundsAvailable] Calculating net platform funds.');
  try {
    const totalSucceededPayments = await getTotalSucceededPaymentTransactions();
    const totalExpenses = await getApprovedExpensesTotal(); // From expenseService
    const netFunds = totalSucceededPayments - totalExpenses;
    console.log(`[paymentService.getNetPlatformFundsAvailable] Total Payments: ${totalSucceededPayments}, Total Expenses: ${totalExpenses}, Net Funds: ${netFunds}`);
    return netFunds;
  } catch (error) {
    console.error("[paymentService.getNetPlatformFundsAvailable] Error calculating net platform funds:", error);
    return 0; // Return 0 on error, or consider more specific error handling
  }
}


export async function getUniqueCampaignsSupportedByUser(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const paymentTransactionsRef = collection(db, PAYMENT_TRANSACTIONS_COLLECTION);
    const q = query(
      paymentTransactionsRef,
      where("userId", "==", userId),
      where("status", "==", "Succeeded")
    );
    const querySnapshot = await getDocs(q);
    const supportedCampaignIds = new Set<string>();
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.campaignId) {
        supportedCampaignIds.add(data.campaignId);
      }
    });
    return supportedCampaignIds.size;
  } catch (error) {
    console.error(`[paymentService.getUniqueCampaignsSupportedByUser] Error for user ${userId}:`, error);
    return 0;
  }
}

export async function getTotalDonationsByUser(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const paymentTransactionsRef = collection(db, PAYMENT_TRANSACTIONS_COLLECTION);
    const q = query(
      paymentTransactionsRef,
      where("userId", "==", userId),
      where("status", "==", "Succeeded")
    );
    const querySnapshot = await getDocs(q);
    let totalUserDonations = 0;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.amount && typeof data.amount === 'number') {
        totalUserDonations += data.amount;
      }
    });
    return totalUserDonations;
  } catch (error) {
    console.error(`[paymentService.getTotalDonationsByUser] Error for user ${userId}:`, error);
    return 0; 
  }
}

export async function getTotalRefundedByUser(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const paymentTransactionsRef = collection(db, PAYMENT_TRANSACTIONS_COLLECTION);
    const q = query(
      paymentTransactionsRef,
      where("userId", "==", userId),
      where("status", "==", "Refunded")
    );
    const querySnapshot = await getDocs(q);
    let totalUserRefunds = 0;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.amount && typeof data.amount === 'number') {
        totalUserRefunds += data.amount;
      }
    });
    return totalUserRefunds;
  } catch (error) {
    console.error(`[paymentService.getTotalRefundedByUser] Error for user ${userId}:`, error);
    return 0; 
  }
}

export async function getPendingPaymentsCount(): Promise<number> {
  try {
    const paymentTransactionsRef = collection(db, PAYMENT_TRANSACTIONS_COLLECTION);
    const q = query(paymentTransactionsRef, where("status", "==", "Pending"));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error("[paymentService.getPendingPaymentsCount] Error counting pending payments:", error);
    return 0;
  }
}

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
