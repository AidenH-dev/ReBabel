import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

interface ApiResponse {
  success: boolean;
  entity_id?: string;
  start_time?: string;
  error?: string;
}

async function handler(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const userId = req.userId;

  try {
    const { sessionType = 'translate' } = req.body || {};

    const { data, error } = await supabaseKvs
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

export default withAuth(handler);
