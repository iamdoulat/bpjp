// src/services/notificationService.ts
'use server';

import axios from 'axios';
import FormData from 'form-data';

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

  const form = new FormData();
  form.append('secret', apiSecret);
  form.append('account', accountId);
  form.append('recipient', recipientNumber);
  form.append('type', 'text');
  form.append('message', message);

  try {
    const response = await axios.post(url, form, {
      headers: form.getHeaders(),
    });
    console.log(`[notificationService] WhatsApp notification sent successfully to ${recipientNumber}. Response:`, response.data);
  } catch (error: any) {
    if (error.response) {
      console.error(
        `[notificationService] Error sending WhatsApp notification to ${recipientNumber}. Status: ${error.response.status}, Data:`,
        error.response.data
      );
    } else {
      console.error(
        `[notificationService] Error sending WhatsApp notification to ${recipientNumber}:`,
        error.message
      );
    }
    // We don't re-throw the error to prevent it from blocking the main process flow.
  }
}

/**
 * Sends a WhatsApp confirmation message for a new donation submission.
 * This is a fire-and-forget function.
 *
 * @param recipientNumber The phone number to send the message to.
 * @param userName The name of the user to address in the message.
 */
export async function sendWhatsAppConfirmation(
  recipientNumber: string,
  userName: string
): Promise<void> {
  const message = `Dear ${userName},\nThank you for your donation. We are working on it. You will receive confirmation soon.`;
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
