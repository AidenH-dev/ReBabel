import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';

interface ApiResponse {
  success: boolean;
  tokens_used?: number;
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

    if (!sessionData || sessionData.owner !== session.user.sub) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('append_session_tokens', {
        p_entity_id: id,
        p_tokens_to_add: tokens,
      });

    if (error) {
      console.error('Failed to append tokens:', error);
      return res.status(500).json({ success: false, error: 'Failed to append tokens' });
    }

    if (!data.success) {
      return res.status(400).json({ success: false, error: data.error || 'Failed to append tokens' });
    }

    return res.status(200).json({
      success: true,
      tokens_used: data.tokens_used,
    });
  } catch (error) {
    console.error('Append tokens error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);
