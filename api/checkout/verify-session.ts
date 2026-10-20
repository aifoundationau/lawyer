import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionId = req.query?.sessionId || req.query?.session_id || req.body?.sessionId || req.body?.session_id;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Missing sessionId parameter' });
  }

  // If no Stripe secret key configured on server, report status for local/dev fallback
  if (!stripeSecret) {
    return res.status(200).json({
      verified: true,
      mode: 'mock_local',
      sessionId,
    });
  }

  try {
    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2024-12-18.acacia' as any,
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const isPaid = session.payment_status === 'paid' || session.status === 'complete';
    if (!isPaid) {
      return res.status(400).json({
        verified: false,
        error: `Checkout session status is ${session.status} (payment_status: ${session.payment_status})`,
      });
    }

    const { caseId, lawyerId, lawyerName } = session.metadata || {};

    return res.status(200).json({
      verified: true,
      sessionId: session.id,
      caseId: caseId || null,
      lawyerId: lawyerId || null,
      lawyerName: lawyerName || null,
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (err: any) {
    console.error('Error verifying Stripe session:', err);
    return res.status(500).json({
      verified: false,
      error: err.message || 'Failed to verify session with Stripe',
    });
  }
}
