import type { NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseKvs } from '@/lib/supabaseKvs';
import { withLogger, type LoggedRequest } from '@/lib/withLogger';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

async function handleGET(req: LoggedRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const { setId } = req.query;

    if (!setId || typeof setId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing setId parameter'
      });
    }

    const { data, error } = await supabaseKvs
      .rpc('get_set_items_srs_status_full', {
        set_id: setId
      });

    if (error) {
      req.log.error('rpc.failed', { fn: 'get_set_items_srs_status_full', error: error.message, code: error.code });
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      data
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
  // Verify authentication
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - authentication required'
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  return handleGET(req, res);
}))
