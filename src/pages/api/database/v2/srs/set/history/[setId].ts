import type { NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { resolveUserId } from '@/lib/resolveUserId';
import { supabaseKvs } from '@/lib/supabaseKvs';
import { withLogger, type LoggedRequest } from '@/lib/withLogger';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

async function handleGET(req: LoggedRequest, res: NextApiResponse<ApiResponse>, userId: string) {
  try {
    const { setId } = req.query;

    if (!setId || typeof setId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing setId parameter'
      });
    }

    // Verify the authenticated user owns this set before returning its history
    const { data: setData, error: setError } = await supabaseKvs
      .rpc('get_set_with_items_v2', { set_entity_id: setId });

    if (setError || !setData) {
      return res.status(404).json({
        success: false,
        error: 'Set not found'
      });
    }

    const parsed = typeof setData === 'string' ? JSON.parse(setData) : setData;
    if (parsed?.set?.owner !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden - you do not own this set'
      });
    }

    const { data, error } = await supabaseKvs
      .rpc('get_set_srs_activity_log', {
        set_id: setId
      });

    if (error) {
      req.log.error('rpc.failed', { fn: 'get_set_srs_activity_log', error: error.message, code: error.code });
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      data: data || []
    });

  } catch (error: any) {
    req.log.error('handler.failed', { error: error?.message || String(error), stack: error?.stack });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withApiAuthRequired(withLogger(async function handler(req: LoggedRequest, res: NextApiResponse<ApiResponse>) {
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - authentication required'
    });
  }

  const userId = await resolveUserId(session.user.sub);

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  return handleGET(req, res, userId);
}));
