import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';

interface SubscriptionData {
  owner?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status?: string; // expects 'active' for access
  price_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: string; // "true" | "false"
}

interface ApiResponse {
  success: boolean;
  subscription: SubscriptionData | null;

  // Now defined strictly off DB status === 'active'
  isPremium: boolean;

  // Keep in response if you want UI messaging, but it does NOT grant access anymore
  isGracePeriod: boolean;

  accessLevel: 'premium' | 'free';
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      subscription: null,
      isPremium: false,
      isGracePeriod: false,
      accessLevel: 'free',
      error: 'Method not allowed',
    });
  }

  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({
      success: false,
      subscription: null,
      isPremium: false,
      isGracePeriod: false,
      accessLevel: 'free',
      error: 'Unauthorized',
    });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_subscription_by_user', { user_id: session.user.sub });

    if (error) throw error;

    const subscription = (data as SubscriptionData | null) ?? null;

    // ✅ Source of truth: DB only
    const isPremium = !!subscription && subscription.status === 'active';

    // Optional: still compute grace period for messaging ONLY
    const now = new Date();
    const endsAt =
      subscription?.current_period_end ? new Date(subscription.current_period_end) : null;

    const isGracePeriod =
      !!subscription &&
      subscription.status !== 'active' &&
      subscription.cancel_at_period_end === 'true' &&
      !!endsAt &&
      endsAt > now;

    return res.status(200).json({
      success: true,
      subscription,
      isPremium,
      isGracePeriod,
      accessLevel: isPremium ? 'premium' : 'free',
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return res.status(500).json({
      success: false,
      subscription: null,
      isPremium: false,
      isGracePeriod: false,
      accessLevel: 'free',
      error: 'Failed to fetch subscription status',
    });
  }
}

export default withApiAuthRequired(handler);
