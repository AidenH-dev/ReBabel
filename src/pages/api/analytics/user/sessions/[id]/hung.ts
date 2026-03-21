// POST /api/analytics/user/sessions/[id]/hung
// Marks an initiated session as hung (abandoned).
// Called via sendBeacon on tab close or intentional exit.
//
// Not wrapped with withApiAuthRequired because sendBeacon may not
// reliably carry auth cookies during page teardown. Instead, we
// verify ownership server-side: the session entity ID is a UUID
// (unguessable), and we confirm the session exists and is still
// in 'initiated' state before marking it hung. The RPC itself
// rejects any session not in 'initiated' state.
import { NextApiResponse } from 'next';
import { getSession } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';
import { resolveUserId } from '@/lib/resolveUserId';
import { withLogger } from '@/lib/withLogger';
import type { LoggedRequest } from '@/lib/withLogger';

interface ApiResponse {
  success: boolean;
  error?: string;
}

export default withLogger(async function handler(req: LoggedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Session ID required' });
  }

  // Validate UUID format to prevent injection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ success: false, error: 'Invalid session ID' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Attempt auth check — if session cookie is present, verify ownership.
    // If cookie is missing (sendBeacon teardown), skip auth and rely on
    // UUID unguessability + RPC state check.
    const session = await getSession(req, res).catch(() => null);
    if (session?.user?.sub) {
      const userId = await resolveUserId(session.user.sub);
      const { data: sessionData } = await supabase
        .schema('v1_kvs_rebabel')
        .rpc('get_user_stat_session', { p_entity_id: id });

      if (sessionData && sessionData.owner !== userId) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
    }

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('mark_session_hung', { p_entity_id: id });

    if (error) {
      req.log.error('rpc.failed', { fn: 'mark_session_hung', error: error.message, code: error.code });
      return res.status(500).json({ success: false, error: 'Failed to mark session hung' });
    }

    if (!data.success) {
      // Session already closed or not found — not an error, just a no-op
      return res.status(200).json({ success: true });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    req.log.error('session.hung_failed', { error: error?.message || String(error), stack: error?.stack });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
