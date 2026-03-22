// Implements SPEC-DB-010 — User Preferences API
import { withAuth } from '@/lib/withAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createRateLimiter } from '@/lib/rateLimit';

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

export default withAuth(async function handler(req, res) {
  if (!limiter.check(req.auth0Sub)) {
    return res
      .status(429)
      .json({ error: 'Too many requests. Please try again later.' });
  }

  const userId = req.userId;

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .schema('v1_kvs_rebabel')
        .rpc('get_user_preferences', { p_user_id: userId });

      if (error) throw error;

      return res.status(200).json({ success: true, data: data || {} });
    } catch (err) {
      req.log.error('preferences.fetch_failed', {
        error: err?.message || String(err),
        stack: err?.stack,
      });
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
      req.log.error('preferences.save_failed', {
        error: err?.message || String(err),
        stack: err?.stack,
      });
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
