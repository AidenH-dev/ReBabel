import { NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';
import { resolveUserId } from '@/lib/resolveUserId';
import { withLogger } from '@/lib/withLogger';
import type { LoggedRequest } from '@/lib/withLogger';

interface ApiResponse {
  success: boolean;
  tokens_used?: number;
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

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Session ID required' });
  }

  const { tokens } = req.body || {};
  if (typeof tokens !== 'number' || tokens < 0) {
    return res.status(400).json({ success: false, error: 'Valid token count required' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First verify the session belongs to this user
    const { data: sessionData } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_user_stat_session', { p_entity_id: id });

    if (!sessionData || sessionData.owner !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
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

export default withApiAuthRequired(withLogger(handler));
