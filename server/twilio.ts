import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio | null {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn('Twilio credentials not configured. SMS notifications disabled.');
    return null;
  }

  if (!client) {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  return client;
}

export function isTwilioConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
}

export interface SMSResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  const twilioClient = getClient();

  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    console.warn('Twilio not configured. Skipping SMS:', { to, message: message.substring(0, 50) + '...' });
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    // Format phone number for Philippines if needed
    const formattedNumber = formatPhoneNumber(to);

    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });

    console.log('SMS sent successfully:', result.sid);
    return { success: true, messageSid: result.sid };
  } catch (error: any) {
    console.error('Failed to send SMS:', error.message);

    // Provide more helpful error messages for common issues
    let errorMessage = error.message;
    if (error.message.includes("combination of 'To' and/or 'From'")) {
      errorMessage = "Your Twilio number cannot send SMS to Philippine numbers. Please upgrade to a paid Twilio account and get a Philippine-enabled number, or use a different SMS provider.";
    } else if (error.code === 21211) {
      errorMessage = "Invalid phone number format. Please check the customer's phone number.";
    } else if (error.code === 21614) {
      errorMessage = "The phone number is not a valid mobile number.";
    }

    return { success: false, error: errorMessage };
  }
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Handle Philippine numbers
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    // Convert 09xxxxxxxxx to +639xxxxxxxxx
    cleaned = '63' + cleaned.substring(1);
  } else if (cleaned.startsWith('9') && cleaned.length === 10) {
    // Convert 9xxxxxxxxx to +639xxxxxxxxx
    cleaned = '63' + cleaned;
  } else if (!cleaned.startsWith('63') && cleaned.length === 10) {
    // Assume Philippine number if 10 digits
    cleaned = '63' + cleaned;
  }

  // Add + prefix if not present
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

// SMS Templates for different events

export async function sendBookingConfirmation(params: {
  customerPhone: string;
  customerName: string;
  bookingReference: string;
  eventDate: string;
  eventType: string;
  totalPrice: number;
}): Promise<SMSResult> {
  const message = `Hi ${params.customerName}! Your catering booking request (${params.bookingReference}) has been received. Event: ${params.eventType} on ${params.eventDate}. Total: PHP ${(params.totalPrice / 100).toLocaleString()}. We'll contact you shortly to confirm. - Peter's Creation Catering`;

  return sendSMS(params.customerPhone, message);
}

export async function sendBookingApproved(params: {
  customerPhone: string;
  customerName: string;
  bookingReference: string;
  depositAmount: number;
  paymentLink?: string;
}): Promise<SMSResult> {
  let message = `Hi ${params.customerName}, booking ${params.bookingReference} is approved. Please check details: ${params.paymentLink || 'online'}. - Peters Catering`;

  return sendSMS(params.customerPhone, message);
}

export async function sendDepositReceived(params: {
  customerPhone: string;
  customerName: string;
  bookingReference: string;
  amountPaid: number;
  remainingBalance: number;
}): Promise<SMSResult> {
  const message = `Hi ${params.customerName}, payment received: PHP ${(params.amountPaid / 100).toLocaleString()} for booking ${params.bookingReference}. Event confirmed. - Peters Catering`;

  return sendSMS(params.customerPhone, message);
}

export async function sendPaymentReminder(params: {
  customerPhone: string;
  customerName: string;
  bookingReference: string;
  balanceAmount: number;
  eventDate: string;
  daysUntilEvent: number;
}): Promise<SMSResult> {
  const message = `Hi ${params.customerName}, upcoming event on ${params.eventDate}. Ref: ${params.bookingReference}. See you soon! - Peters Catering`;

  return sendSMS(params.customerPhone, message);
}

export async function sendEventReminder(params: {
  customerPhone: string;
  customerName: string;
  bookingReference: string;
  eventDate: string;
  eventTime: string;
  venueAddress: string;
}): Promise<SMSResult> {
  const message = `Hi ${params.customerName}! Reminder: Your catering event is tomorrow (${params.eventDate}) at ${params.eventTime}. Venue: ${params.venueAddress}. We look forward to serving you! Ref: ${params.bookingReference} - Peter's Creation Catering`;

  return sendSMS(params.customerPhone, message);
}

export async function sendBookingCancelled(params: {
  customerPhone: string;
  customerName: string;
  bookingReference: string;
}): Promise<SMSResult> {
  const message = `Hi ${params.customerName}, your booking (${params.bookingReference}) has been cancelled as requested. If you have any questions or would like to rebook, please contact us. - Peter's Creation Catering`;

  return sendSMS(params.customerPhone, message);
}

export async function sendCustomMessage(params: {
  customerPhone: string;
  message: string;
}): Promise<SMSResult> {
  return sendSMS(params.customerPhone, params.message);
}

export default {
  sendSMS,
  isTwilioConfigured,
  sendBookingConfirmation,
  sendBookingApproved,
  sendDepositReceived,
  sendPaymentReminder,
  sendEventReminder,
  sendBookingCancelled,
  sendCustomMessage
};
