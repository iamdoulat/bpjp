// src/services/notificationService.ts
'use server';

import { Timestamp } from 'firebase/firestore';

/**
 * Generic function to send a WhatsApp message using the BIPSMS API.
 * This is a fire-and-forget function; it logs errors but does not throw them,
 * to avoid interrupting the user-facing flow.
 *
 * @param recipientNumber The phone number to send the message to (including country code).
 * @param message The text message to be sent.
 */
async function sendWhatsAppMessage(
  recipientNumber: string,
  message: string
): Promise<void> {
  const apiSecret = process.env.BIPSMS_API_SECRET;
  const accountId = process.env.BIPSMS_ACCOUNT_ID;
  const url = "https://app.bipsms.com/api/send/whatsapp";

  if (!apiSecret || !accountId) {
    console.warn("[notificationService] WhatsApp API credentials are not set in .env. Skipping notification.");
    return;
  }

  if (!recipientNumber) {
    console.warn("[notificationService] Recipient phone number is missing. Skipping notification.");
    return;
  }

  const params = new URLSearchParams();
  params.append('secret', apiSecret);
  params.append('account', accountId);
  params.append('recipient', recipientNumber);
  params.append('type', 'text');
  params.append('message', message);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(
        `[notificationService] Error sending WhatsApp notification to ${recipientNumber}. Status: ${response.status}, Data:`,
        responseData
      );
    } else {
      console.log(`[notificationService] WhatsApp notification sent successfully to ${recipientNumber}. Response:`, responseData);
    }
  } catch (error: any) {
    console.error(
      `[notificationService] Network or parsing error sending WhatsApp notification to ${recipientNumber}:`,
      error.message
    );
    // We don't re-throw the error to prevent it from blocking the main process flow.
  }
}

/**
 * Sends a detailed WhatsApp confirmation message for a new donation submission.
 * This is a fire-and-forget function.
 *
 * @param recipientNumber The phone number to send the message to.
 * @param userName The name of the user to address in the message.
 * @param paymentDetails An object containing the payment details.
 */
export async function sendWhatsAppConfirmation(
  recipientNumber: string,
  userName: string,
  paymentDetails: {
    amount: number;
    campaignName?: string;
    date: Date;
    method: string;
    lastFourDigits?: string;
    status: string; // Will typically be 'Pending' here
  }
): Promise<void> {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  }).format(paymentDetails.date);
  
  const message = `প্রিয় ${userName},
দান করার জন্য আপনাকে ধন্যবাদ। আমরা আপনার মেসেজ পেয়েছি। যত দ্রুত সম্ভব আমরা কনর্ফাম করছি।

*Amount:* BDT ${paymentDetails.amount.toFixed(2)},
*Campaign:* ${paymentDetails.campaignName || 'General Donation'},
*Date:* ${formattedDate},
*Method:* ${paymentDetails.method},
*Last 4 Digits:* ${paymentDetails.lastFourDigits || 'N/A'},
*Current Status:* ${paymentDetails.status}`;

  await sendWhatsAppMessage(recipientNumber, message);
}


/**
 * Sends a detailed WhatsApp status update message for a payment transaction.
 * This is a fire-and-forget function.
 * @param recipientNumber The phone number to send the message to.
 * @param userName The name of the user to address in the message.
 * @param paymentDetails An object containing the payment details.
 */
export async function sendWhatsAppStatusUpdate(
  recipientNumber: string,
  userName: string,
  paymentDetails: {
    amount: number;
    campaignName?: string;
    date: Date;
    method: string;
    lastFourDigits?: string;
    status: string;
  }
): Promise<void> {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  }).format(paymentDetails.date);
  
  const message = `প্রিয় ${userName},
ভূজপুর প্রবাসী যুব কল্যাণ পরিষদ থেকে আপনাকে স্বাগতম।

*Amount:* BDT ${paymentDetails.amount.toFixed(2)},
*Campaign:* ${paymentDetails.campaignName || 'General Donation'},
*Date:* ${formattedDate},
*Method:* ${paymentDetails.method},
*Last 4 Digits:* ${paymentDetails.lastFourDigits || 'N/A'},
*Current Status:* ${paymentDetails.status},

দান করার জন্য আপনাকে ধন্যবাদ`;

  await sendWhatsAppMessage(recipientNumber, message);
}

/**
 * Sends a WhatsApp confirmation for a successful event registration.
 * This is a fire-and-forget function.
 *
 * @param recipientNumber The phone number of the registered user.
 * @param userName The name of the user.
 * @param wardNo The user's ward number.
 * @param eventTitle The title of the event.
 * @param registrationDate The date and time of the registration.
 */
export async function sendWhatsAppEventRegistrationConfirmation(
  recipientNumber: string,
  userName: string,
  wardNo: string,
  eventTitle: string,
  registrationDate: Date | Timestamp
): Promise<void> {
  const jsRegistrationDate = registrationDate instanceof Timestamp ? registrationDate.toDate() : registrationDate;

  const formattedRegistrationDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: 'short',
    timeStyle: 'short',
    hour12: true,
  }).format(jsRegistrationDate);

  const message = `প্রিয় ${userName} 
ভূজপুর প্রবাসী যুব কল্যাণ পরিষদ থেকে আপনাকে স্বাগতম।

আপনার রেজিষ্টেশন সফল হয়েছে।,
ইভেন্ট এ রেজিষ্টেশন করার জন্য আপনাকে ধন্যবাদ।,

*Date:* ${formattedRegistrationDate},
*Registered Participants for:* ${eventTitle},
*Ward No.*- ${wardNo},
*Mobile No. :* ${recipientNumber},`;

  await sendWhatsAppMessage(recipientNumber, message);
}

/**
 * Sends a WhatsApp confirmation for a successful vote.
 * This is a fire-and-forget function.
 *
 * @param recipientNumber The phone number of the registered user.
 * @param userName The name of the user.
 * @param candidateName The name of the candidate voted for.
 * @param candidateSymbol The symbol of the candidate.
 * @param position The position voted for ('President' or 'GeneralSecretary').
 */
export async function sendWhatsAppVoteConfirmation(
  recipientNumber: string,
  userName: string,
  candidateName: string,
  candidateSymbol: string,
  position: 'President' | 'GeneralSecretary'
): Promise<void> {
  const voteDate = new Date();
  const formattedVoteDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: 'short',
    timeStyle: 'short',
    hour12: true,
  }).format(voteDate);

  const positionText = position === 'President'
    ? 'President Candidate Nominations'
    : 'General Secretary Candidate Nominations';

  const message = `প্রিয় ${userName},
ভূজপুর প্রবাসী যুব কল্যাণ পরিষদ থেকে আপনাকে স্বাগতম।

আপনি সফলভাবে ভোট প্রদান করেছেন। আপনি ভোট দিয়েছেন-

Date: ${formattedVoteDate}
Candidate Name: ${candidateName}
Symbol: ${candidateSymbol}
${positionText}`;

  await sendWhatsAppMessage(recipientNumber, message);
}
