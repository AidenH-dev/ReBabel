import type { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

async function handleGET(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
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

export default withAuth(async function handler(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  return handleGET(req, res);
})
