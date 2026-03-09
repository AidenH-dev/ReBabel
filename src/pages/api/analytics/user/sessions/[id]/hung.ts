// POST /api/analytics/user/sessions/[id]/hung
// Marks an initiated session as hung (abandoned).
// Called via sendBeacon on tab close or intentional exit.
import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';

interface ApiResponse {
  success: boolean;
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Session ID required' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify session belongs to this user
    const { data: sessionData } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_user_stat_session', { p_entity_id: id });

    if (!sessionData || sessionData.owner !== session.user.sub) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('mark_session_hung', { p_entity_id: id });

    if (error) {
      console.error('Failed to mark session hung:', error);
      return res.status(500).json({ success: false, error: 'Failed to mark session hung' });
    }

    if (!data.success) {
      // Session already closed — not an error, just a no-op
      return res.status(200).json({ success: true });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mark session hung error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);
