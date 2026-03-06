// Implements SPEC-LLM-002
// GET /api/analytics/user/dashboard?timezone=America/Los_Angeles
import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';

interface ApiResponse {
  message?: unknown;
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
    const supabase = createClient(
      process.env.NEXT_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_user_dashboard_stats', {
        p_owner: session.user.sub,
        p_timezone: timezone,
      });

    if (error) {
      console.error('Failed to fetch dashboard stats:', error);
      return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }

    return res.status(200).json({ message: data });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);
