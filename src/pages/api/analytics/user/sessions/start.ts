import { NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';
import { resolveUserId } from '@/lib/resolveUserId';
import { withLogger } from '@/lib/withLogger';
import type { LoggedRequest } from '@/lib/withLogger';

interface ApiResponse {
  success: boolean;
  entity_id?: string;
  start_time?: string;
  error?: string;
}

async function handler(req: LoggedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userId = await resolveUserId(session.user.sub);

  try {
    const { sessionType = 'translate' } = req.body || {};

    const supabase = createClient(
      process.env.NEXT_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('start_user_stat_session', {
        p_owner: userId,
        p_session_type: sessionType,
      });

    if (error) {
      req.log.error('rpc.failed', { fn: 'start_user_stat_session', error: error.message, code: error.code });
      return res.status(500).json({ success: false, error: 'Failed to start session' });
    }

    return res.status(200).json({
      success: true,
      entity_id: data.entity_id,
      start_time: data.start_time,
    });
  } catch (error: any) {
    req.log.error('session.start_failed', { error: error?.message || String(error), stack: error?.stack });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withApiAuthRequired(withLogger(handler));
