import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';

interface ApiResponse {
  success: boolean;
  session?: Record<string, string>;
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
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

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_user_stat_session', { p_entity_id: id });

    if (error) {
      console.error('Failed to get session:', error);
      return res.status(500).json({ success: false, error: 'Failed to get session' });
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Verify the session belongs to this user
    if (data.owner !== session.user.sub) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return res.status(200).json({ success: true, session: data });
  } catch (error) {
    console.error('Get session error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);
