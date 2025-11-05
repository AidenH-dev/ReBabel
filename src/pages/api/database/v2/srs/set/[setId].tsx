import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

async function handleGET(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const { setId } = req.query;

    if (!setId || typeof setId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing setId parameter'
      });
    }

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_set_items_srs_status_full', {
        set_id: setId
      });

    if (error) {
      console.error('Supabase RPC error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  return handleGET(req, res);
}
