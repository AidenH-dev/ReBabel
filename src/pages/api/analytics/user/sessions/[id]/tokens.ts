import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

interface ApiResponse {
  success: boolean;
  tokens_used?: number;
  error?: string;
}

async function handler(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const userId = req.userId;

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Session ID required' });
  }

  const { tokens } = req.body || {};
  if (typeof tokens !== 'number' || tokens < 0) {
    return res.status(400).json({ success: false, error: 'Valid token count required' });
  }

  try {
    // First verify the session belongs to this user
    const { data: sessionData } = await supabaseKvs
      .rpc('get_user_stat_session', { p_entity_id: id });

    if (!sessionData || sessionData.owner !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { data, error } = await supabaseKvs
      .rpc('append_session_tokens', {
        p_entity_id: id,
        p_tokens_to_add: tokens,
      });

    if (error) {
      req.log.error('rpc.failed', { fn: 'append_session_tokens', error: error.message, code: error.code });
      return res.status(500).json({ success: false, error: 'Failed to append tokens' });
    }

    if (!data.success) {
      return res.status(400).json({ success: false, error: data.error || 'Failed to append tokens' });
    }

    return res.status(200).json({
      success: true,
      tokens_used: data.tokens_used,
    });
  } catch (error: any) {
    req.log.error('session.tokens_append_failed', { error: error?.message || String(error), stack: error?.stack });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withAuth(handler);
