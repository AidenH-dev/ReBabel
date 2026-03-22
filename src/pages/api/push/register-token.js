import { withAuth } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';
import { createRateLimiter } from '@/lib/rateLimit';

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  }

  try {
    if (!limiter.check(req.auth0Sub)) {
      return res
        .status(429)
        .json({
          success: false,
          error: 'Too many requests. Please try again later.',
        });
    }

    const userId = req.userId;

    const { deviceToken, platform = 'ios' } = req.body;

    if (!deviceToken) {
      return res
        .status(400)
        .json({ success: false, error: 'Device token is required' });
    }

    const { data, error } = await supabaseKvs.rpc('register_device_token', {
      p_user_id: userId,
      p_token: deviceToken,
      p_platform: platform,
    });

    if (error) {
      req.log.error('rpc.failed', {
        fn: 'register_device_token',
        error: error.message,
        code: error.code,
      });
      return res
        .status(500)
        .json({ success: false, error: 'Failed to register device token' });
    }

    return res.status(200).json({ success: true, id: data });
  } catch (error) {
    req.log.error('register_token.error', {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return res
      .status(500)
      .json({ success: false, error: 'Failed to register device token' });
  }
}

export default withAuth(handler);
