// src/services/notificationService.ts
'use server';

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
