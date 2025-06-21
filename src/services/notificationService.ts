// src/services/notificationService.ts
'use server';

import axios from 'axios';
import FormData from 'form-data';

/**
 * Sends a WhatsApp confirmation message using the BIPSMS API.
 * This is a fire-and-forget function; it logs errors but does not throw them,
 * to avoid interrupting the user-facing flow (like donation submission).
 *
 * @param recipientNumber The phone number to send the message to (including country code).
 * @param userName The name of the user to address in the message.
 */
export async function sendWhatsAppConfirmation(
  recipientNumber: string,
  userName: string
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
  const message = `Dear ${userName},\nThank you for your donation. We are working on it. You will receive confirmation soon.`;

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
