import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

type SupabaseClientAny = SupabaseClient<any, any, any>;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// Disable body parser for webhook signature verification
export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  const supabase = createClient(
    process.env.NEXT_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await handleSubscriptionUpdate(supabase, subscription, event.id);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabase, subscription, event.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(supabase, subscription, event.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice, event.id);
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleSubscriptionUpdate(supabase: SupabaseClientAny, subscription: Stripe.Subscription, eventId: string) {
  const ownerId = subscription.metadata.auth0_user_id;

  if (!ownerId) {
    console.error('No auth0_user_id in subscription metadata');
    return;
  }

  // Access subscription properties (cast to any for API version compatibility)
  const sub = subscription as any;

  // Get period dates from subscription items (where Stripe stores them in newer API)
  const itemData = sub.items?.data?.[0] || {};
  const periodStart = itemData.current_period_start || sub.current_period_start || Math.floor(Date.now() / 1000);
  const periodEnd = itemData.current_period_end || sub.current_period_end || Math.floor(Date.now() / 1000);

  const subscriptionData = {
    TYPE: 'subscription',
    owner: ownerId,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    stripe_event_id: eventId,
    status: subscription.status,
    price_id: subscription.items.data[0]?.price.id || '',
    current_period_start: new Date(periodStart * 1000).toISOString(),
    current_period_end: new Date(periodEnd * 1000).toISOString(),
    cancel_at_period_end: (sub.cancel_at_period_end ?? false).toString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .schema('v1_kvs_rebabel')
    .rpc('upsert_subscription', { json_input: subscriptionData });

  if (error) {
    console.error('Failed to upsert subscription:', error);
    throw error;
  }
}

async function handleSubscriptionCanceled(supabase: SupabaseClientAny, subscription: Stripe.Subscription, eventId: string) {
  const sub = subscription as any;
  const ownerId = subscription.metadata.auth0_user_id;

  const subscriptionData = {
    TYPE: 'subscription',
    owner: ownerId,
    stripe_subscription_id: subscription.id,
    stripe_event_id: eventId,
    status: 'canceled',
    current_period_end: new Date((sub.current_period_end || 0) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .schema('v1_kvs_rebabel')
    .rpc('upsert_subscription', { json_input: subscriptionData });

  if (error) {
    console.error('Failed to update subscription status:', error);
    throw error;
  }
}

async function handlePaymentFailed(supabase: SupabaseClientAny, invoice: Stripe.Invoice, eventId: string) {
  const inv = invoice as any;
  if (inv.subscription) {
    // Get subscription to find owner
    const subscription = await stripe.subscriptions.retrieve(inv.subscription as string);
    const ownerId = subscription.metadata.auth0_user_id;

    const subscriptionData = {
      TYPE: 'subscription',
      owner: ownerId,
      stripe_subscription_id: inv.subscription as string,
      stripe_event_id: eventId,
      status: 'past_due',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('upsert_subscription', { json_input: subscriptionData });

    if (error) {
      console.error('Failed to update subscription status:', error);
      throw error;
    }
  }
}
