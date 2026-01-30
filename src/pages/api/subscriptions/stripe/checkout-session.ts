import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

interface ApiResponse {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userId = session.user.sub;
  const userEmail = session.user.email;

  try {
    const supabase = createClient(
      process.env.NEXT_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if customer already exists
    const { data: existingCustomerId } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_customer_id_by_user', { user_id: userId });

    let customerId = existingCustomerId;

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { auth0_user_id: userId },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/learn/subscription?success=true`,
      cancel_url: `${req.headers.origin}/learn/subscription?canceled=true`,
      subscription_data: {
        metadata: { auth0_user_id: userId },
      },
      metadata: { auth0_user_id: userId },
    });

    return res.status(200).json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url || undefined,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
    });
  }
}

export default withApiAuthRequired(handler);
