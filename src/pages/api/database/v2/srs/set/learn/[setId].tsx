import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SrsData {
  scope: string;
  srs_level: number;
  time_created: string;
}

interface Item {
  id: string;
  srs?: SrsData;
  [key: string]: any;
}

interface SetData {
  owner: string;
  title: string;
  description: string;
  date_created: string;
  updated_at: string;
  last_studied: string;
  srs_enabled: string;
  tags: any[];
}

interface ApiResponseData {
  set: SetData;
  items: Item[];
}

interface ApiResponse {
  success: boolean;
  data?: ApiResponseData;
  error?: string;
}

/**
 * Determines if an item is not yet in the SRS cycle (ready to learn for the first time)
 * @param item - The item to check
 * @returns true if the item is not in the SRS cycle, false otherwise
 */
function isItemNotInSrsCycle(item: Item): boolean {
  // Item has no SRS data at all - not in cycle
  if (!item.srs) {
    return true;
  }

  // Item has SRS data but level is 0 - not yet started
  if (item.srs.srs_level === 0) {
    return true;
  }

  // Item is already in the SRS cycle
  return false;
}

async function handleGET(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const { setId, limit } = req.query;

    // Validate setId parameter
    if (!setId || typeof setId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing setId parameter'
      });
    }

    // Validate limit parameter is provided
    if (!limit) {
      return res.status(400).json({
        success: false,
        error: 'Missing limit parameter'
      });
    }

    // Validate limit is a valid number
    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter - must be a positive integer'
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

    // Filter items to only include those not yet in the SRS cycle and apply limit
    if (data && data.items && Array.isArray(data.items)) {
      const notInCycleItems = data.items.filter(isItemNotInSrsCycle);
      const limitedItems = notInCycleItems.slice(0, limitNum);

      return res.status(200).json({
        success: true,
        data: {
          ...data,
          items: limitedItems
        }
      });
    }

    // If data structure is unexpected, return as-is
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

export default withApiAuthRequired(async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
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
})
