// Implements SPEC-LLM-002
// GET /api/analytics/user/dashboard?timezone=America/Los_Angeles
import { NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseKvs } from '@/lib/supabaseKvs';
import { resolveUserId } from '@/lib/resolveUserId';
import { withLogger } from '@/lib/withLogger';
import type { LoggedRequest } from '@/lib/withLogger';

interface ApiResponse {
  message?: unknown;
  error?: string;
}

async function handler(req: LoggedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await resolveUserId(session.user.sub);

  // Validate timezone param
  const rawTimezone = req.query.timezone;
  let timezone = 'UTC';
  if (rawTimezone !== undefined) {
    if (typeof rawTimezone !== 'string' || rawTimezone.length === 0 || rawTimezone.length > 64) {
      return res.status(400).json({ error: 'timezone must be a non-empty string of at most 64 characters' });
    }
    timezone = rawTimezone;
  }

  try {
    const { data, error } = await supabaseKvs
      .rpc('get_user_dashboard_stats', {
        p_owner: userId,
        p_timezone: timezone,
      });

    if (error) {
      req.log.error('rpc.failed', { fn: 'get_user_dashboard_stats', error: error.message, code: error.code });
      return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }

    return res.status(200).json({ message: data });
  } catch (error: any) {
    req.log.error('dashboard.stats_failed', { error: error?.message || String(error), stack: error?.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withApiAuthRequired(withLogger(handler));
