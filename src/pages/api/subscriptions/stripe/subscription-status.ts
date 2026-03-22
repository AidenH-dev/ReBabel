import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

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

  // True when DB status === 'active' (includes grace period since Stripe keeps status active until period ends)
  isPremium: boolean;

  // True when subscription is active but won't renew (cancel_at_period_end is true)
  isGracePeriod: boolean;

  accessLevel: 'premium' | 'free';
  error?: string;
}

async function handler(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
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

  const userId = req.userId;

  try {
    const { data, error } = await supabaseKvs
      .rpc('get_subscription_by_user', { user_id: userId });

    if (error) throw error;

    const subscription = (data as SubscriptionData | null) ?? null;

    const isPremium = !!subscription && subscription.status === 'active';

    // Grace period: subscription is still active but won't renew
    const isGracePeriod =
      !!subscription &&
      subscription.status === 'active' &&
      subscription.cancel_at_period_end === 'true';

    return res.status(200).json({
      success: true,
      subscription,
      isPremium,
      isGracePeriod,
      accessLevel: isPremium ? 'premium' : 'free',
    });
  } catch (error) {
    req.log.error('subscription.status_failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
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

export default withAuth(handler);
