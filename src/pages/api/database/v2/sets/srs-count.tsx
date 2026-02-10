import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

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
      console.error('Missing Supabase environment variables');
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
      console.error('Supabase RPC error:', error);
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
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  return handleGET(req, res, session.user.sub);
});
