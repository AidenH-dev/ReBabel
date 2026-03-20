// Implements SPEC-DB-003 (client caller)
// POST /api/analytics/heartbeat
// Called once per app load from _app.js to record a platform visit event.
import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';
import { resolveUserId } from '@/lib/resolveUserId';

interface ApiResponse {
  message?: unknown;
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await resolveUserId(session.user.sub);

  try {
    const supabase = createClient(
      process.env.NEXT_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('record_platform_event', { p_user_id: userId });

    if (error) {
      console.error('Failed to record platform event:', error);
      return res.status(500).json({ error: 'Failed to record platform event' });
    }

    return res.status(200).json({ message: data });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);
