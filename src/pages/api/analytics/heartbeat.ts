// Implements SPEC-DB-003 (client caller)
// POST /api/analytics/heartbeat
// Called once per app load from _app.js to record a platform visit event.
import { NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseKvs } from '@/lib/supabaseKvs';
import { resolveUserId } from '@/lib/resolveUserId';
import { withLogger } from '@/lib/withLogger';
import type { LoggedRequest } from '@/lib/withLogger';

interface ApiResponse {
  message?: unknown;
  error?: string;
}

async function handler(req: LoggedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await resolveUserId(session.user.sub);

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

export default withApiAuthRequired(withLogger(handler));
