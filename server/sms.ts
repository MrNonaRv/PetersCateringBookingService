const IPROGSMS_API_URL = 'https://www.iprogsms.com/api/v1/sms_messages';

function getSmsConfig() {
  return {
    apiToken: process.env.IPROGSMS_API_TOKEN,
    senderName: process.env.IPROGSMS_SENDER_NAME || 'IPROGSMS'
  };
}

export function isSMSConfigured(): boolean {
  return !!process.env.IPROGSMS_API_TOKEN;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  const { apiToken, senderName } = getSmsConfig();

  if (!apiToken) {
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
        api_token: apiToken,
        phone_number: formattedNumber,
        message: message,
        sender_name: senderName,
      }),
    });

    const data = await response.json();
    console.log('iProgSMS response:', data);

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
  // First, keep the + if it exists to check the prefix, but actually the cleaned version is easier
  let cleaned = phone.replace(/\D/g, '');

  // If it starts with 63, replace with 0
  if (cleaned.startsWith('63') && (cleaned.length === 12)) {
    cleaned = '0' + cleaned.substring(2);
  } 
  // If it starts with 9 and has 10 digits, add 0
  else if (cleaned.startsWith('9') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }
  // If it's already 09..., it's correct
  
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
  let message = `Hi ${params.customerName}, booking ${params.bookingReference} is APPROVED. To pay the deposit, please visit our website and enter code: ${params.bookingReference}. - Peters Catering`;

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
