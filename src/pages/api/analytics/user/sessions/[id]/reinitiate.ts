import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ERROR_STATUS_MAP: Record<string, number> = {
  session_not_found: 404,
  session_already_finished: 409,
};

interface ApiResponse {
  success: boolean;
  error?: string;
}

async function handler(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return res.status(400).json({ success: false, error: 'Invalid session ID' });
  }

  try {
    // Verify ownership: fetch analytics session and compare owner
    const { data: session, error: fetchError } = await supabaseKvs.rpc('get_user_stat_session', {
      p_entity_id: id,
    });

    if (fetchError) {
      req.log.error('rpc.failed', { fn: 'get_user_stat_session', error: fetchError.message, code: fetchError.code });
      return res.status(500).json({ success: false, error: 'Failed to verify session ownership' });
    }

    if (!session || session.owner !== req.userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // Reinitiate the session
    const { data, error } = await supabaseKvs.rpc('reinitiate_session', {
      p_entity_id: id,
      p_owner: req.userId,
    });

    if (error) {
      req.log.error('rpc.failed', { fn: 'reinitiate_session', error: error.message, code: error.code });
      return res.status(500).json({ success: false, error: 'Failed to reinitiate session' });
    }

    if (!data.success) {
      const status = ERROR_STATUS_MAP[data.error] || 500;
      return res.status(status).json({ success: false, error: data.error });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    req.log.error('session.reinitiate_failed', { error: error?.message || String(error) });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withAuth(handler);
