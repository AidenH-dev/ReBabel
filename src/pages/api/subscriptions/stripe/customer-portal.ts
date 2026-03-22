import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import Stripe from 'stripe';
import { supabaseKvs } from '@/lib/supabaseKvs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

interface ApiResponse {
  success: boolean;
  url?: string;
  error?: string;
}

async function handler(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const userId = req.userId;

  try {
    const { data: customerId } = await supabaseKvs
      .rpc('get_customer_id_by_user', { user_id: userId });

    if (!customerId) {
      return res.status(400).json({ success: false, error: 'No subscription found' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin}/learn/account/subscription`,
    });

    return res.status(200).json({ success: true, url: portalSession.url });
  } catch (error) {
    req.log.error('customer_portal.failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    return res.status(500).json({ success: false, error: 'Failed to create portal session' });
  }
}

export default withAuth(handler);
