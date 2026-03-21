import { NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseKvs } from '@/lib/supabaseKvs';
import { resolveUserId } from '@/lib/resolveUserId';
import { withLogger } from '@/lib/withLogger';
import type { LoggedRequest } from '@/lib/withLogger';

interface ApiResponse {
  success: boolean;
  session?: Record<string, string>;
  error?: string;
}

async function handler(req: LoggedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userId = await resolveUserId(session.user.sub);

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Session ID required' });
  }

  try {
    const { data, error } = await supabaseKvs
      .rpc('get_user_stat_session', { p_entity_id: id });

    if (error) {
      req.log.error('rpc.failed', { fn: 'get_user_stat_session', error: error.message, code: error.code });
      return res.status(500).json({ success: false, error: 'Failed to get session' });
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Verify the session belongs to this user
    if (data.owner !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return res.status(200).json({ success: true, session: data });
  } catch (error: any) {
    req.log.error('session.get_failed', { error: error?.message || String(error), stack: error?.stack });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withApiAuthRequired(withLogger(handler));
