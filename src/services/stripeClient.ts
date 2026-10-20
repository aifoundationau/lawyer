import { loadStripe } from '@stripe/stripe-js';

const publishableKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) ||
  "pk_test_51UKnKUI8bClhBF4Pl59doST5JkSHIg47DaHs5bicuWUEM0iuyT6BtcVV2zlvZUAAL5HjnRNt5PAzJQETRIckLarb00o6jAlzpi";

export const stripePromise = loadStripe(publishableKey);

export interface CheckoutResult {
  success: boolean;
  sessionId?: string;
  checkoutUrl?: string;
  error?: string;
}

export async function initiateLeadPurchaseCheckout(
  caseId: string,
  caseTitle: string,
  lawyerId: string,
  lawyerName: string,
  lawyerEmail: string
): Promise<CheckoutResult> {
  try {
    const response = await fetch('/api/checkout/purchase-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId,
        caseTitle,
        lawyerId,
        lawyerName,
        lawyerEmail,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        sessionId: data.sessionId,
        checkoutUrl: data.checkoutUrl,
      };
    } else {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Checkout API returned status ${response.status}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unable to connect to payment server',
    };
  }
}
