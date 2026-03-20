// Implements SPEC-DB-010 — User Preferences API
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { resolveUserId } from '@/lib/resolveUserId';
import { createRateLimiter } from '@/lib/rateLimit';

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

export default withApiAuthRequired(async function handler(req, res) {
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

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .schema('v1_kvs_rebabel')
        .rpc('get_user_preferences', { p_user_id: userId });

      if (error) throw error;

      return res.status(200).json({ success: true, data: data || {} });
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { preferences } = req.body;

    if (
      !preferences ||
      typeof preferences !== 'object' ||
      Object.keys(preferences).length === 0
    ) {
      return res.status(400).json({ error: 'preferences object is required' });
    }

    try {
      const { data, error } = await supabaseAdmin
        .schema('v1_kvs_rebabel')
        .rpc('upsert_user_preferences', {
          p_user_id: userId,
          p_prefs: preferences,
        });

      if (error) throw error;

      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('Error saving user preferences:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
