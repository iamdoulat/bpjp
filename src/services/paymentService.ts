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
        console.error(`[paymentService.getPaymentTransactions] FIREBASE PERMISSION_DENIED: Firestore security rules for collection '${PAYMENT_TRANSACTIONS_COLLECTION}' do not allow read access for the current user (${auth.currentUser?.email || 'unauthenticated'}). Please check your Firebase console.`);
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

export interface DonorInfo {
  userId: string;
  name: string;
  avatarUrl?: string | null;
}

export async function getDonorsForCampaign(campaignId: string): Promise<DonorInfo[]> {
  if (!campaignId) {
    console.warn("[paymentService.getDonorsForCampaign] Campaign ID is missing.");
    return [];
  }
  try {
    const paymentTransactionsRef = collection(db, PAYMENT_TRANSACTIONS_COLLECTION);
    const q = query(
      paymentTransactionsRef,
      where("campaignId", "==", campaignId),
      where("status", "==", "Succeeded"),
      orderBy("date", "desc") // Get most recent donations first
    );

    const querySnapshot = await getDocs(q);
    const uniqueUserIds = new Set<string>();
    querySnapshot.forEach((docSnap) => {
      uniqueUserIds.add(docSnap.data().userId);
    });

    const donorPromises = Array.from(uniqueUserIds).map(async (userId) => {
      const userProfile = await getUserProfile(userId);
      return {
        userId: userId,
        name: userProfile?.displayName || "Anonymous Donor",
        avatarUrl: userProfile?.photoURL || null,
      };
    });

    const donors = await Promise.all(donorPromises);
    return donors;
  } catch (error) {
    console.error(`[paymentService.getDonorsForCampaign] Error fetching donors for campaign ${campaignId}:`, error);
    if (error instanceof Error && error.message.toLowerCase().includes("query requires an index")) {
        console.error(`Firestore index required for getDonorsForCampaign. Please create a composite index on 'paymentTransactions' collection for fields: campaignId (asc), status (asc), date (desc).`);
    }
    // Don't throw, just return empty array for UI robustness
    return [];
  }
}
```></content>
  </change>
  <change>
    <file>/src/app/campaigns/view/[id]/page.tsx</file>
    <content><![CDATA[
// src/app/campaigns/view/[id]/page.tsx
"use client"

import * as React from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert"
import { getCampaignById, type CampaignData } from '@/services/campaignService';
import { Loader2, AlertCircle, ArrowLeft, CalendarDays, Users, DollarSign, Target as TargetIcon, HeartHandshake, Phone, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext";
import { addPaymentTransaction, type NewPaymentTransactionInput, getDonorsForCampaign, type DonorInfo } from "@/services/paymentService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "BDT" });
}

function formatDisplayDate(date: Date | undefined, options?: Intl.DateTimeFormatOptions) {
  if (!date) return "N/A";
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Intl.DateTimeFormat("en-US", { ...defaultOptions, ...options }).format(new Date(date));
}

const getStatusBadgeVariant = (status?: CampaignData["initialStatus"]) => {
  if (!status) return "secondary";
  switch (status) {
    case "active": return "default";
    case "upcoming": return "secondary";
    case "draft": return "outline"; // Should not be visible publicly
    case "completed": return "default";
    default: return "secondary";
  }
};

const getStatusBadgeClassName = (status?: CampaignData["initialStatus"]) => {
  if (status === "completed") return "bg-green-600 hover:bg-green-700 text-white border-green-600";
  if (status === "active") return "bg-blue-600 hover:bg-blue-700 text-white border-blue-600";
  return "";
};

function getInitials(name?: string): string {
  if (!name) return "D";
  const parts = name.split(" ");
  if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}


export default function PublicViewCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { user } = useAuth();
  const { toast } = useToast();

  const [campaign, setCampaign] = React.useState<CampaignData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [donors, setDonors] = React.useState<DonorInfo[]>([]);
  const [isLoadingDonors, setIsLoadingDonors] = React.useState(true);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [donationAmount, setDonationAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<"BKash" | "Wallet">("BKash");
  const [lastFourDigits, setLastFourDigits] = React.useState("");
  const [receiverBkashNo, setReceiverBkashNo] = React.useState("");
  const [isSubmittingDonation, setIsSubmittingDonation] = React.useState(false);


  React.useEffect(() => {
    if (campaignId) {
      async function fetchCampaignAndDonors() {
        setIsLoading(true);
        setIsLoadingDonors(true);
        setError(null);
        try {
          const [fetchedCampaign, fetchedDonors] = await Promise.all([
             getCampaignById(campaignId),
             getDonorsForCampaign(campaignId)
          ]);

          if (fetchedCampaign && (fetchedCampaign.initialStatus === 'active' || fetchedCampaign.initialStatus === 'upcoming' || fetchedCampaign.initialStatus === 'completed')) {
            setCampaign(fetchedCampaign);
          } else if (fetchedCampaign && fetchedCampaign.initialStatus === 'draft') {
            setError("This campaign is currently a draft and not publicly viewable.");
          }
           else {
            setError("Campaign not found or is not available for public view.");
          }

          setDonors(fetchedDonors);

        } catch (e) {
          console.error("Failed to fetch campaign or donor data:", e);
          setError(e instanceof Error ? e.message : "An unknown error occurred while fetching campaign data.");
        } finally {
          setIsLoading(false);
          setIsLoadingDonors(false);
        }
      }
      fetchCampaignAndDonors();
    }
  }, [campaignId]);

  const handleDonationSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a donation.",
        variant: "destructive",
      });
      setIsDialogOpen(false);
      router.push("/login");
      return;
    }

    if (!donationAmount || isNaN(parseFloat(donationAmount)) || parseFloat(donationAmount) <= 0) {
        toast({ title: "Invalid Amount", description: "Please enter a valid donation amount.", variant: "destructive" });
        return;
    }

    const transactionInput: NewPaymentTransactionInput = {
        userId: user.uid,
        userEmail: user.email || undefined,
        campaignId: campaign!.id!, // campaign is checked before this function is called
        campaignName: campaign!.campaignTitle,
        amount: parseFloat(donationAmount),
        paymentMethod: paymentMethod,
    };

    if (paymentMethod === "BKash") {
      if (!lastFourDigits || !receiverBkashNo) {
        toast({ title: "Missing Information", description: "For BKash, please enter last 4 digits and Receiver Bkash No.", variant: "destructive" });
        return;
      }
      if (lastFourDigits.length !== 4 || !/^\d{4}$/.test(lastFourDigits)) {
          toast({ title: "Invalid Last 4 Digits", description: "Please enter exactly 4 digits for BKash.", variant: "destructive" });
          return;
      }
      if (!/^01[3-9]\d{8}$/.test(receiverBkashNo)) {
          toast({ title: "Invalid Bkash Number", description: "Please enter a valid 11-digit Bkash number.", variant: "destructive" });
          return;
      }
      transactionInput.lastFourDigits = lastFourDigits;
      transactionInput.receiverBkashNo = receiverBkashNo;
    }
    // No specific fields for Wallet for now, but could add wallet ID or similar later

    setIsSubmittingDonation(true);
    
    try {
        await addPaymentTransaction(transactionInput);
        toast({
          title: paymentMethod === "Wallet" ? "Donation Successful!" : "Donation Submitted!",
          description: paymentMethod === "Wallet" 
            ? "Thank you for your generous contribution via Wallet!" 
            : "Your BKash donation is pending verification. Thank you!",
        });
        // Reset form fields
        setDonationAmount("");
        setLastFourDigits("");
        setReceiverBkashNo("");
        setPaymentMethod("BKash"); // Reset to default
        setIsDialogOpen(false);

        // Refetch campaign data to show updated raised amount if it was a wallet payment
        if (paymentMethod === "Wallet" && campaignId) {
          const updatedCampaign = await getCampaignById(campaignId);
          if (updatedCampaign) setCampaign(updatedCampaign);
        }
        
        // Refetch donors list to include the new donor immediately
        const updatedDonors = await getDonorsForCampaign(campaignId);
        setDonors(updatedDonors);


    } catch (e) {
        console.error("Failed to submit donation:", e);
        toast({
            title: "Donation Failed",
            description: (e instanceof Error ? e.message : "Could not submit donation. Please try again."),
            variant: "destructive",
        });
    } finally {
        setIsSubmittingDonation(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-auto">
            <Button variant="outline" size="sm" className="mb-4" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </Button>
            <Card className="shadow-lg">
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/4" />
              </CardHeader>
              <CardContent className="space-y-6">
                <Skeleton className="h-64 w-full rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-6 w-2/3" />
                    </div>
                  ))}
                </div>
                <div>
                    <Skeleton className="h-4 w-1/4 mb-1" />
                    <Skeleton className="h-6 w-full" />
                </div>
              </CardContent>
               <CardFooter>
                <Skeleton className="h-12 w-48" />
              </CardFooter>
            </Card>
        </main>
      </AppShell>
    );
  }

  if (error || !campaign) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center">
          <Alert variant={error ? "destructive" : "default"} className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>{error ? "Error Loading Campaign" : "Campaign Not Found"}</ShadCNAlertTitle>
            <AlertDescription>{error || "The campaign you are looking for does not exist or could not be loaded."}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/campaigns')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </main>
      </AppShell>
    );
  }

  const progressValue = campaign.goalAmount > 0 ? (campaign.raisedAmount / campaign.goalAmount) * 100 : 0;

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-auto pb-20 md:pb-8">
          <Button variant="outline" size="sm" onClick={() => router.push('/campaigns')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Campaigns
          </Button>
          <Card className="shadow-lg overflow-hidden">
            <CardHeader className="bg-card p-4 md:p-6 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <CardTitle className="text-2xl font-headline">{campaign.campaignTitle}</CardTitle>
                <Badge
                  variant={getStatusBadgeVariant(campaign.initialStatus)}
                  className={cn("text-sm px-3 py-1", getStatusBadgeClassName(campaign.initialStatus))}
                >
                  {campaign.initialStatus.charAt(0).toUpperCase() + campaign.initialStatus.slice(1)}
                </Badge>
              </div>
              {campaign.organizerName && (
                <CardDescription className="text-sm mt-1">
                  Organized by: <span className="font-semibold">{campaign.organizerName}</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-8">
              {campaign.campaignImageUrl && (
                <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border shadow-inner">
                  <Image
                    src={campaign.campaignImageUrl || `https://placehold.co/800x450.png`}
                    alt={campaign.campaignTitle}
                    layout="fill"
                    objectFit="cover"
                    priority
                    data-ai-hint="campaign event"
                  />
                </div>
              )}

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground border-b pb-2">About this Campaign</h3>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{campaign.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6 bg-muted/30 p-6 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <TargetIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Goal Amount</p>
                    <p className="text-xl font-semibold">{formatCurrency(campaign.goalAmount)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Raised</p>
                    <p className="text-xl font-semibold">{formatCurrency(campaign.raisedAmount)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CalendarDays className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="text-lg font-semibold">{formatDisplayDate(new Date(campaign.startDate as Date))}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                   <CalendarDays className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="text-lg font-semibold">{formatDisplayDate(new Date(campaign.endDate as Date))}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Campaign Progress</h3>
                <Progress value={progressValue} aria-label={`${progressValue.toFixed(0)}% raised`} className="h-4 rounded-full" />
                <p className="text-sm text-muted-foreground mt-2 text-right">{progressValue.toFixed(0)}% of goal raised</p>
              </div>

              <div className="mt-6">
                <h3 className="text-md font-semibold text-foreground mb-3">
                  Our Valued Donors
                </h3>
                {isLoadingDonors ? (
                  <div className="flex -space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-10 rounded-full border-2 border-background" />
                    ))}
                  </div>
                ) : donors.length > 0 ? (
                  <TooltipProvider delayDuration={100}>
                    <div className="flex -space-x-2 overflow-hidden p-1">
                      {donors.slice(0, 15).map((donor) => (
                        <Tooltip key={donor.userId}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-10 w-10 border-2 border-background hover:ring-2 hover:ring-primary transition-all cursor-pointer">
                              <AvatarImage src={donor.avatarUrl || `https://placehold.co/40x40.png?text=${getInitials(donor.name)}`} alt={donor.name} data-ai-hint="profile person"/>
                              <AvatarFallback>{getInitials(donor.name)}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{donor.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {donors.length > 15 && (
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <Avatar className="h-10 w-10 border-2 border-background">
                                      <AvatarFallback>+{donors.length - 15}</AvatarFallback>
                                  </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>and {donors.length - 15} more donors</p>
                              </TooltipContent>
                          </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                ) : (
                  <p className="text-sm text-muted-foreground">Be the first to donate and get featured here!</p>
                )}
              </div>

            </CardContent>
             <CardFooter className="bg-card p-4 md:p-6 border-t flex justify-center">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                        size="lg" 
                        className="w-full sm:w-auto text-lg py-3 px-8 bg-green-600 hover:bg-green-700 text-white"
                        disabled={campaign.initialStatus !== 'active'} // Disable if campaign is not active
                    >
                      <HeartHandshake className="mr-2 h-5 w-5" /> Donate Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Make a Donation</DialogTitle>
                      <DialogDescription>
                        Support "{campaign.campaignTitle}". Choose your payment method and enter the amount.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div>
                        <Label className="mb-2 block">Payment Method</Label>
                        <RadioGroup defaultValue="BKash" value={paymentMethod} onValueChange={(value: "BKash" | "Wallet") => setPaymentMethod(value)}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="BKash" id={`bkash-view-${campaign.id}`} />
                            <Label htmlFor={`bkash-view-${campaign.id}`} className="font-normal">BKash Payment</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Wallet" id={`wallet-view-${campaign.id}`} />
                            <Label htmlFor={`wallet-view-${campaign.id}`} className="font-normal">Wallet Payment</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right col-span-1">
                          Amount
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                          className="col-span-3"
                          placeholder="BDT"
                          disabled={isSubmittingDonation}
                        />
                      </div>
                      {paymentMethod === "BKash" && (
                        <>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="lastFour" className="text-right col-span-1">
                              Last 4 Digits
                            </Label>
                            <Input
                              id="lastFour"
                              value={lastFourDigits}
                              onChange={(e) => setLastFourDigits(e.target.value)}
                              className="col-span-3"
                              placeholder="Transaction last 4 digits"
                              maxLength={4}
                              disabled={isSubmittingDonation}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="bkashNo" className="text-right col-span-1">
                              Bkash No.
                            </Label>
                            <Input
                              id="bkashNo"
                              value={receiverBkashNo}
                              onChange={(e) => setReceiverBkashNo(e.target.value)}
                              className="col-span-3"
                              placeholder="Receiver's Bkash No."
                              maxLength={11}
                              disabled={isSubmittingDonation}
                            />
                          </div>
                        </>
                      )}
                       {paymentMethod === "Wallet" && (
                        <Alert variant="default" className="col-span-4">
                            <Wallet className="h-4 w-4" />
                            <ShadCNAlertTitle>Pay from Wallet</ShadCNAlertTitle>
                            <AlertDescription>
                                The donation amount will be deducted from your available wallet balance. Wallet balance check and deduction will be implemented in a future update.
                            </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isSubmittingDonation}>
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button 
                        type="button" 
                        onClick={handleDonationSubmit} 
                        disabled={isSubmittingDonation || !donationAmount || (paymentMethod === "BKash" && (!lastFourDigits || lastFourDigits.length !== 4 || !receiverBkashNo))}
                      >
                        {isSubmittingDonation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Donation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
            </CardFooter>
          </Card>
      </main>
    </AppShell>
  )
}
