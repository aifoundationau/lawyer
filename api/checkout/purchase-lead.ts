import type { IncomingMessage, ServerResponse } from 'http';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || "sk_test_51UKnKUI8bClhBF4PaZh92nVzBDUZLhvrD3Po8YzvEuYDsApZuGHCTTcPPDTlY2UBrmLcMBJjoMGP8Dmx10c9GBPj00F4dYp8ZZ";
const stripe = new Stripe(stripeSecret, {
  apiVersion: '2024-12-18.acacia' as any,
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { caseId, caseTitle, lawyerId, lawyerName, lawyerEmail } = req.body || {};

    if (!caseId || !lawyerId) {
      return res.status(400).json({ error: 'Missing required caseId or lawyerId' });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create standard Stripe Checkout Session for $20.00 AUD flat fee
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: `Legal Case Lead: ${caseTitle || 'Qualified Client Dispute'}`,
              description: `Lawyer Select (#lawyerselect) Flat-Fee Lead Acquisition for Case #${caseId}`,
              metadata: {
                tag: 'lawyerselect',
                caseId: caseId,
                lawyerId: lawyerId,
              },
            },
            unit_amount: 2000, // $20.00 AUD
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: lawyerEmail || undefined,
      metadata: {
        tag: 'lawyerselect',
        caseId: caseId,
        lawyerId: lawyerId,
        lawyerName: lawyerName || '',
      },
      success_url: `${appUrl}/?payment_success=true&case_id=${caseId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?payment_cancelled=true&case_id=${caseId}`,
    });

    return res.status(200).json({
      sessionId: session.id,
      checkoutUrl: session.url,
      amount: 2000,
      currency: 'aud',
    });
  } catch (err: any) {
    console.error('Stripe Checkout creation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
}
