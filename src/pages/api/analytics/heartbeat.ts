// Implements SPEC-DB-003 (client caller)
// POST /api/analytics/heartbeat
// Called once per app load from _app.js to record a platform visit event.
import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

interface ApiResponse {
  message?: unknown;
  error?: string;
}

async function handler(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.userId;

  try {
    const { data, error } = await supabaseKvs
      .rpc('record_platform_event', { p_user_id: userId });

    if (error) {
      req.log.error('rpc.failed', { fn: 'record_platform_event', error: error.message, code: error.code });
      return res.status(500).json({ error: 'Failed to record platform event' });
    }

    return res.status(200).json({ message: data });
  } catch (error: any) {
    req.log.error('heartbeat.failed', { error: error?.message || String(error), stack: error?.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);
