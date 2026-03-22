import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabaseKvs } from '@/lib/supabaseKvs';
import { notifySubscription, notifyError } from '@/lib/webhooks/peko';
import { notifySlackSubscription, notifySlackError } from '@/lib/webhooks/slack';
import { resolveUserId } from '@/lib/resolveUserId';
import { withLogger } from '@/lib/withLogger';
import { log } from '@/lib/logger';

function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// Disable body parser for webhook signature verification
export const config = {
  api: { bodyParser: false },
};

export default withLogger(async function handler(req, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const buf = await getRawBody(req);
  const sig = req.headers['stripe-signature']!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    req.log.error('webhook.signature_failed', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
    return res.status(400).json({ success: false, error: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await handleSubscriptionUpdate(subscription, event.id);
          req.log.info('subscription.state_change', { event: event.type, userId: subscription.metadata.rebabel_user_id || subscription.metadata.auth0_user_id });
          const subData = {
            userId: subscription.metadata.auth0_user_id,
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            priceId: subscription.items.data[0]?.price.id,
            eventId: event.id,
          };
          notifySubscription('created', subData);
          notifySlackSubscription('created', subData);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, event.id);
        req.log.info('subscription.state_change', { event: event.type, userId: subscription.metadata.rebabel_user_id || subscription.metadata.auth0_user_id });
        const notifyType = event.type === 'customer.subscription.created' ? 'created' : 'updated' as const;
        const subEventData = {
          userId: subscription.metadata.auth0_user_id,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          priceId: subscription.items.data[0]?.price.id,
          eventId: event.id,
        };
        notifySubscription(notifyType, subEventData);
        notifySlackSubscription(notifyType, subEventData);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription, event.id);
        req.log.info('subscription.state_change', { event: event.type, userId: subscription.metadata.rebabel_user_id || subscription.metadata.auth0_user_id });
        const cancelData = {
          userId: subscription.metadata.auth0_user_id,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          status: 'canceled',
          eventId: event.id,
        };
        notifySubscription('canceled', cancelData);
        notifySlackSubscription('canceled', cancelData);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const inv = invoice as any;
        if (inv.subscription) {
          const sub = await stripe.subscriptions.retrieve(inv.subscription as string);
          req.log.info('subscription.state_change', { event: event.type, userId: sub.metadata.rebabel_user_id || sub.metadata.auth0_user_id });
          const failData = {
            userId: sub.metadata.auth0_user_id,
            stripeSubscriptionId: inv.subscription as string,
            status: 'past_due',
            eventId: event.id,
          };
          notifySubscription('payment_failed', failData);
          notifySlackSubscription('payment_failed', failData);
        }
        await handlePaymentFailed(invoice, event.id);
        break;
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    req.log.error('webhook.handler_error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    const err = error instanceof Error ? error : new Error(String(error));
    const errCtx = { context: 'stripe_webhook', endpoint: '/api/subscriptions/stripe/webhook' };
    notifyError(err, errCtx);
    notifySlackError(err, errCtx);
    return res.status(500).json({ success: false, error: 'Webhook handler failed' });
  }
});

async function handleSubscriptionUpdate(subscription: Stripe.Subscription, eventId: string) {
  // Resolve from rebabel_user_id (preferred) or auth0_user_id (legacy)
  const rebabelUserId = subscription.metadata.rebabel_user_id;
  const auth0UserId = subscription.metadata.auth0_user_id;

  let ownerId: string;
  if (rebabelUserId) {
    ownerId = rebabelUserId;
  } else if (auth0UserId) {
    ownerId = await resolveUserId(auth0UserId);
  } else {
    log.error('subscription.no_user_id', { subscriptionId: subscription.id });
    return;
  }

  // Access subscription properties (cast to any for API version compatibility)
  const sub = subscription as any;

  // Get period dates - check nested object format (newer API) and flat format (older API)
  const itemData = sub.items?.data?.[0] || {};
  const periodStart = sub.current_period?.start || itemData.current_period_start || sub.current_period_start || Math.floor(Date.now() / 1000);
  const periodEnd = sub.current_period?.end || itemData.current_period_end || sub.current_period_end || Math.floor(Date.now() / 1000);

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

  const { error } = await supabaseKvs
    .rpc('upsert_subscription', { json_input: subscriptionData });

  if (error) {
    log.error('rpc.failed', { fn: 'upsert_subscription', error: error?.message || String(error) });
    throw error;
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription, eventId: string) {
  const sub = subscription as any;
  const rebabelUserId = subscription.metadata.rebabel_user_id;
  const auth0UserId = subscription.metadata.auth0_user_id;
  const ownerId = rebabelUserId || (auth0UserId ? await resolveUserId(auth0UserId) : null);

  const periodEnd = sub.current_period?.end || sub.current_period_end || 0;

  const subscriptionData = {
    TYPE: 'subscription',
    owner: ownerId,
    stripe_subscription_id: subscription.id,
    stripe_event_id: eventId,
    status: 'canceled',
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : new Date().toISOString(),
    cancel_at_period_end: 'false',
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseKvs
    .rpc('upsert_subscription', { json_input: subscriptionData });

  if (error) {
    log.error('rpc.failed', { fn: 'upsert_subscription', error: error?.message || String(error) });
    throw error;
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, eventId: string) {
  const inv = invoice as any;
  if (inv.subscription) {
    // Get subscription to find owner
    const subscription = await stripe.subscriptions.retrieve(inv.subscription as string);
    const rebabelUserId = subscription.metadata.rebabel_user_id;
    const auth0UserId = subscription.metadata.auth0_user_id;
    const ownerId = rebabelUserId || (auth0UserId ? await resolveUserId(auth0UserId) : null);

    const subscriptionData = {
      TYPE: 'subscription',
      owner: ownerId,
      stripe_subscription_id: inv.subscription as string,
      stripe_event_id: eventId,
      status: 'past_due',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseKvs
      .rpc('upsert_subscription', { json_input: subscriptionData });

    if (error) {
      log.error('rpc.failed', { fn: 'upsert_subscription', error: error?.message || String(error) });
      throw error;
    }
  }
}
