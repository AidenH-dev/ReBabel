import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

interface ApiResponse {
  success: boolean;
  count?: number;
  error?: string;
}

async function handleGET(req: AuthedRequest, res: NextApiResponse<ApiResponse>, userId: string) {
  try {
    // Get user sets and count those with srs_enabled = 'true'
    const { data, error } = await supabaseKvs
      .rpc('get_user_sets', {
        user_id: userId.trim()
      });

    if (error) {
      (req as any).log?.error('rpc.failed', { fn: 'get_user_sets', error: error.message, code: error.code });
      return res.status(500).json({
        success: false,
        error: `Database error: ${error.message}`
      });
    }

    // Parse the data if needed
    let setsArray = [];
    if (typeof data === 'string') {
      try {
        setsArray = JSON.parse(data);
      } catch {
        setsArray = Array.isArray(data) ? data : [];
      }
    } else if (Array.isArray(data)) {
      setsArray = data;
    }

    // Count sets with SRS enabled
    const srsEnabledCount = setsArray.filter(
      (set: { data?: { srs_enabled?: string } }) =>
        set.data?.srs_enabled === 'true'
    ).length;

    return res.status(200).json({
      success: true,
      count: srsEnabledCount
    });
  } catch (error) {
    (req as any).log?.error('handler.failed', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export default withAuth(async function handler(
  req: AuthedRequest,
  res: NextApiResponse
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
