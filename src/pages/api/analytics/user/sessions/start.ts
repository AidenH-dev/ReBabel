import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';

interface ApiResponse {
  success: boolean;
  entity_id?: string;
  start_time?: string;
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

  try {
    const { sessionType = 'translate' } = req.body || {};

    const supabase = createClient(
      process.env.NEXT_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('start_user_stat_session', {
        p_owner: session.user.sub,
        p_session_type: sessionType,
      });

    if (error) {
      console.error('Failed to start session:', error);
      return res.status(500).json({ success: false, error: 'Failed to start session' });
    }

    return res.status(200).json({
      success: true,
      entity_id: data.entity_id,
      start_time: data.start_time,
    });
  } catch (error) {
    console.error('Start session error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);
