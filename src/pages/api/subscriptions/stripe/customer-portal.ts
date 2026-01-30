import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

interface ApiResponse {
  success: boolean;
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

  try {
    const supabase = createClient(
      process.env.NEXT_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: customerId } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_customer_id_by_user', { user_id: session.user.sub });

    if (!customerId) {
      return res.status(400).json({ success: false, error: 'No subscription found' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin}/learn/subscription`,
    });

    return res.status(200).json({ success: true, url: portalSession.url });
  } catch (error) {
    console.error('Customer portal error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create portal session' });
  }
}

export default withApiAuthRequired(handler);
