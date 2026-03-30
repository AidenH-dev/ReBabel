import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ApiResponse {
  success: boolean;
  state?: Record<string, unknown>;
  items?: unknown[];
  questions?: unknown[];
  error?: string;
}

async function handler(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return res.status(400).json({ success: false, error: 'Invalid session ID' });
  }

  try {
    const { data, error } = await supabaseKvs.rpc('get_session_state', {
      p_owner: req.userId,
      p_entity_id: id,
    });

    if (error) {
      req.log.error('rpc.failed', { fn: 'get_session_state', error: error.message, code: error.code });
      return res.status(500).json({ success: false, error: 'Failed to get session state' });
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    return res.status(200).json({
      success: true,
      state: data.state,
      items: data.items,
      questions: data.questions,
    });
  } catch (error: any) {
    req.log.error('session_state.get_failed', { error: error?.message || String(error) });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withAuth(handler);
