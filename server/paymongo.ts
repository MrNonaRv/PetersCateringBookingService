import axios, { AxiosInstance } from 'axios';

let paymongoApi: AxiosInstance | null = null;

function getPaymongoApi(): AxiosInstance {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Paymongo is not configured. PAYMONGO_SECRET_KEY is missing.');
  }
  
  if (!paymongoApi) {
    paymongoApi = axios.create({
      baseURL: 'https://api.paymongo.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
      }
    });
  }
  
  return paymongoApi;
}

export function isPaymongoConfigured(): boolean {
  return !!process.env.PAYMONGO_SECRET_KEY;
}

export function getPaymongoPublicKey(): string | null {
  return process.env.PAYMONGO_PUBLIC_KEY || null;
}

export interface CreateCheckoutSessionParams {
  amount: number; // in centavos (PHP)
  description: string;
  bookingReference: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  paymentType: 'deposit' | 'balance' | 'full';
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  id: string;
  checkoutUrl: string;
  paymentIntentId: string | null;
  status: string;
}

export interface PaymentDetails {
  id: string;
  status: string;
  amount: number;
  paymentMethod: string;
  paidAt: string | null;
}

/**
 * Create a Paymongo Checkout Session
 * Supports: GCash, PayMaya, Card, GrabPay, and other Philippine payment methods
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSession> {
  const {
    amount,
    description,
    bookingReference,
    customerEmail,
    customerName,
    customerPhone,
    paymentType,
    successUrl,
    cancelUrl
  } = params;

  try {
    const api = getPaymongoApi();
    const response = await api.post('/checkout_sessions', {
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              currency: 'PHP',
              amount: amount, // Paymongo expects amount in centavos
              description: description,
              name: `Catering ${paymentType === 'deposit' ? 'Deposit' : paymentType === 'balance' ? 'Balance Payment' : 'Full Payment'}`,
              quantity: 1
            }
          ],
          payment_method_types: [
            'gcash',
            'paymaya',
            'card',
            'grab_pay',
            'billease'
          ],
          description: `${description} - Ref: ${bookingReference}`,
          reference_number: bookingReference,
          success_url: successUrl,
          cancel_url: cancelUrl,
          billing: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone || undefined
          },
          metadata: {
            booking_reference: bookingReference,
            payment_type: paymentType
          }
        }
      }
    });

    const checkoutData = response.data.data;
    
    return {
      id: checkoutData.id,
      checkoutUrl: checkoutData.attributes.checkout_url,
      paymentIntentId: checkoutData.attributes.payment_intent?.id || null,
      status: checkoutData.attributes.status
    };
  } catch (error: any) {
    console.error('Paymongo checkout session error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errors?.[0]?.detail || 'Failed to create checkout session');
  }
}

/**
 * Retrieve a checkout session to check payment status
 */
export async function getCheckoutSession(checkoutId: string): Promise<CheckoutSession & { payments: PaymentDetails[] }> {
  try {
    const api = getPaymongoApi();
    const response = await api.get(`/checkout_sessions/${checkoutId}`);
    const data = response.data.data;
    
    const payments: PaymentDetails[] = (data.attributes.payments || []).map((payment: any) => ({
      id: payment.id,
      status: payment.attributes.status,
      amount: payment.attributes.amount,
      paymentMethod: payment.attributes.source?.type || 'unknown',
      paidAt: payment.attributes.paid_at
    }));

    return {
      id: data.id,
      checkoutUrl: data.attributes.checkout_url,
      paymentIntentId: data.attributes.payment_intent?.id || null,
      status: data.attributes.status,
      payments
    };
  } catch (error: any) {
    console.error('Paymongo get checkout session error:', error.response?.data || error.message);
    throw new Error('Failed to retrieve checkout session');
  }
}

/**
 * Create a payment link (reusable link for fixed amounts)
 */
export async function createPaymentLink(params: {
  amount: number;
  description: string;
  remarks?: string;
}): Promise<{ id: string; url: string; referenceNumber: string }> {
  try {
    const api = getPaymongoApi();
    const response = await api.post('/links', {
      data: {
        attributes: {
          amount: params.amount,
          description: params.description,
          remarks: params.remarks || ''
        }
      }
    });

    const linkData = response.data.data;
    
    return {
      id: linkData.id,
      url: linkData.attributes.checkout_url,
      referenceNumber: linkData.attributes.reference_number
    };
  } catch (error: any) {
    console.error('Paymongo create link error:', error.response?.data || error.message);
    throw new Error('Failed to create payment link');
  }
}

/**
 * Verify webhook signature for Paymongo webhooks
 */
export function verifyWebhookSignature(payload: string, signature: string, webhookSecretKey: string): boolean {
  const crypto = require('crypto');
  
  // Parse the signature header
  const parts = signature.split(',');
  const timestamp = parts.find((p: string) => p.startsWith('t='))?.split('=')[1];
  const signatureValue = parts.find((p: string) => p.startsWith('te='))?.split('=')[1];
  
  if (!timestamp || !signatureValue) {
    return false;
  }
  
  // Compute the expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecretKey)
    .update(signedPayload)
    .digest('hex');
  
  return expectedSignature === signatureValue;
}

export default {
  createCheckoutSession,
  getCheckoutSession,
  createPaymentLink,
  verifyWebhookSignature,
  isPaymongoConfigured
};
