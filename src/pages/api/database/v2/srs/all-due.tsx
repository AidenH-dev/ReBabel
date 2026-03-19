import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

async function handleGET(req: NextApiRequest, res: NextApiResponse<ApiResponse>, userId: string) {
  try {
    const { countOnly } = req.query;

    const { data, error } = await supabaseAdmin
      .schema('v1_kvs_rebabel')
      .rpc('get_all_due_items', {
        p_owner: userId.trim(),
        p_count_only: countOnly === 'true'
      });

    if (error) {
      console.error('Error fetching due items:', error);
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

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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
      error: 'Unauthorized - authentication required'
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
