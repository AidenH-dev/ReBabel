import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

interface ApiResponse {
  success: boolean;
  active?: boolean;
  state?: Record<string, unknown>;
  error?: string;
}

async function handler(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { sessionType, setId } = req.query;

    const { data, error } = await supabaseKvs.rpc('get_active_session_state', {
      p_owner: req.userId,
      p_source_set_id: (typeof setId === 'string' && setId) ? setId : null,
      p_session_type: (typeof sessionType === 'string' && sessionType) ? sessionType : null,
    });

    if (error) {
      req.log.error('rpc.failed', { fn: 'get_active_session_state', error: error.message, code: error.code });
      return res.status(500).json({ success: false, error: 'Failed to check active session' });
    }

    if (!data) {
      return res.status(200).json({ success: true, active: false });
    }

    return res.status(200).json({ success: true, active: true, state: data });
  } catch (error: any) {
    req.log.error('session_state.active_failed', { error: error?.message || String(error) });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withAuth(handler);
