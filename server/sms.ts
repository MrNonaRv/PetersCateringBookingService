const IPROGSMS_API_TOKEN = process.env.IPROGSMS_API_TOKEN;
const IPROGSMS_API_URL = 'https://www.iprogsms.com/api/v1/sms_messages';
const IPROGSMS_SENDER_NAME = process.env.IPROGSMS_SENDER_NAME;
const DEFAULT_SENDER_NAME = process.env.IPROGSMS_SENDER_NAME;

export function isSMSConfigured(): boolean {
  return !!IPROGSMS_API_TOKEN;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  if (!IPROGSMS_API_TOKEN) {
    console.warn('iProgSMS not configured. Skipping SMS:', { to, message: message.substring(0, 50) + '...' });
    return { success: false, error: 'iProgSMS API token not configured' };
  }

  try {
    const formattedNumber = formatPhoneNumber(to);
    console.log('Sending SMS to:', formattedNumber, 'Original:', to);
    console.log('Message:', message);

    const response = await fetch(IPROGSMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_token: IPROGSMS_API_TOKEN,
        phone_number: formattedNumber,
        message: message,
        sender_name: IPROGSMS_SENDER_NAME || DEFAULT_SENDER_NAME,
      }),
    });

    const data = await response.json();

    if (data.status === 200) {
      console.log('SMS sent successfully:', data.message_id);
      return { success: true, messageId: data.message_id };
    } else {
      console.error('Failed to send SMS:', data);
      const providerError = data.message || 'Failed to send SMS';
      return { success: false, error: providerError };
    }
  } catch (error: any) {
    console.error('Failed to send SMS:', error.message);
    return { success: false, error: error.message };
  }
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('+63')) {
    cleaned = '0' + cleaned.substring(3);
  } else if (cleaned.startsWith('63') && cleaned.length === 12) {
    cleaned = '0' + cleaned.substring(2);
  } else if (cleaned.startsWith('9') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

export async function sendBookingConfirmation(params: {
  customerPhone: string;
  customerName: string;
  bookingReference: string;
  eventDate: string;
  eventType: string;
  totalPrice: number;
}): Promise<SMSResult> {
  const message = `Hi ${params.customerName}! Your catering request ${params.bookingReference} for ${params.eventType} on ${params.eventDate} has been received. We will call you shortly. - Peters Creation Catering`;

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
  const message = `Hi ${params.customerName}, update received for ${params.bookingReference}. Your date is secured. - Peters Catering`;

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
  const message = `Hi ${params.customerName}! Reminder: Your catering event is tomorrow at ${params.eventTime}. We look forward to serving you! Ref: ${params.bookingReference} - Peters Creation Catering`;

  return sendSMS(params.customerPhone, message);
}

export async function sendBookingCancelled(params: {
  customerPhone: string;
  customerName: string;
  bookingReference: string;
}): Promise<SMSResult> {
  const message = `Hi ${params.customerName}, your reservation ${params.bookingReference} has been cancelled. Please contact us if you have questions or want to rebook. - Peters Creation Catering`;

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
  isSMSConfigured,
  sendBookingConfirmation,
  sendBookingApproved,
  sendDepositReceived,
  sendPaymentReminder,
  sendEventReminder,
  sendBookingCancelled,
  sendCustomMessage
};
