import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseKvs } from '@/lib/supabaseKvs';
import { resolveUserId } from '@/lib/resolveUserId';
import { createRateLimiter } from '@/lib/rateLimit';
import { withLogger } from '@/lib/withLogger';

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    if (!session?.user?.sub) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!limiter.check(session.user.sub)) {
      return res
        .status(429)
        .json({ error: 'Too many requests. Please try again later.' });
    }

    const userId = await resolveUserId(session.user.sub);

    const { deviceToken, platform = 'ios' } = req.body;

    if (!deviceToken) {
      return res.status(400).json({ error: 'Device token is required' });
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
      return res.status(500).json({ error: 'Failed to register device token' });
    }

    return res.status(200).json({ success: true, id: data });
  } catch (error) {
    req.log.error('register_token.error', {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return res.status(500).json({ error: 'Failed to register device token' });
  }
}

export default withApiAuthRequired(withLogger(handler));
