import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { resolveUserId } from '@/lib/resolveUserId';
import { withLogger } from '@/lib/withLogger';

interface ApiResponse {
  success: boolean;
  count?: number;
  error?: string;
}

async function handleGET(req: NextApiRequest, res: NextApiResponse<ApiResponse>, userId: string) {
  try {
    const SUPABASE_URL = process.env.NEXT_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      (req as any).log?.error('config.missing', { error: 'Missing Supabase environment variables' });
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user sets and count those with srs_enabled = 'true'
    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
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

export default withApiAuthRequired(withLogger(async function handler(
  req,
  res
) {
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
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
