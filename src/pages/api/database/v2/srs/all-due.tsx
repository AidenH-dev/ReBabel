import type { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

interface SrsData {
  scope: string;
  srs_level: number;
  time_created: string;
}

interface Item {
  id: string;
  type: string;
  srs?: SrsData;
  [key: string]: any;
}

interface SetBreakdown {
  setId: string;
  setTitle: string;
  dueCount: number;
}

interface ApiResponse {
  success: boolean;
  data?: {
    items: Array<Item & { setId: string; setTitle: string }>;
    metadata: {
      totalDueItems: number;
      setBreakdown: SetBreakdown[];
    };
  };
  error?: string;
}

async function handleGET(req: AuthedRequest, res: NextApiResponse<ApiResponse>, userId: string) {
  try {
    const { countOnly } = req.query;

    const { data, error } = await supabaseKvs
      .rpc('get_all_due_items', {
        p_owner: userId.trim(),
        p_count_only: countOnly === 'true'
      });

    if (error) {
      req.log.error('rpc.failed', { fn: 'get_all_due_items', error: error.message, code: error.code });
      return res.status(500).json({
        success: false,
        error: `Database error: ${error.message}`
      });
    }

    // RPC returns JSON in the exact response shape
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error: any) {
    req.log.error('handler.failed', { error: error?.message || String(error), stack: error?.stack });
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAuth(async function handler(
  req: AuthedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const userId = req.userId;

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  return handleGET(req, res, userId);
});
