import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

interface ApiResponse {
  success: boolean;
  synced?: boolean;
  error?: string;
}

// This endpoint syncs subscription data directly from Stripe
// Use this as a fallback when webhooks aren't available
async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userId = session.user.sub;

  try {
    // Find customer by metadata
    const customers = await stripe.customers.search({
      query: `metadata['auth0_user_id']:'${userId}'`,
    });

    if (customers.data.length === 0) {
      return res.status(200).json({ success: true, synced: false });
    }

    const customer = customers.data[0];

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.status(200).json({ success: true, synced: false });
    }

    const subscription = subscriptions.data[0] as any;

    // Debug: log the subscription to see the actual structure
    console.log('Stripe subscription:', JSON.stringify(subscription, null, 2));

    const supabase = createClient(
      process.env.NEXT_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Handle both old format (current_period_start) and new format (current_period.start)
    const periodStart = subscription.current_period?.start
      || subscription.current_period_start
      || Math.floor(Date.now() / 1000);
    const periodEnd = subscription.current_period?.end
      || subscription.current_period_end
      || Math.floor(Date.now() / 1000);

    const subscriptionData = {
      TYPE: 'subscription',
      owner: userId,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      price_id: subscription.items.data[0]?.price.id || '',
      current_period_start: new Date(periodStart * 1000).toISOString(),
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      cancel_at_period_end: (subscription.cancel_at_period_end ?? false).toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };


    const { error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('upsert_subscription', { json_input: subscriptionData });

    if (error) {
      console.error('Failed to sync subscription:', error);
      return res.status(500).json({ success: false, error: 'Failed to sync subscription' });
    }

    return res.status(200).json({ success: true, synced: true });
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ success: false, error: 'Failed to sync subscription' });
  }
}

export default withApiAuthRequired(handler);
