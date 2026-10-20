import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripeSecret) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not configured in server environment' });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: '2024-12-18.acacia' as any,
  });

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      const rawBody = await getRawBody(req);
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // In development / testing mode
      event = req.body;
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const { caseId, lawyerId, lawyerName } = session.metadata || {};

    console.log(`[#lawyerselect] Case lead #${caseId} unlocked by lawyer #${lawyerId} (${lawyerName}) for $20 AUD.`);
  }

  return res.status(200).json({ received: true });
}

function getRawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
