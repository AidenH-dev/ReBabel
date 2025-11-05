import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

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

// SRS level time factors in milliseconds
const SRS_TIME_FACTORS: Record<number, number> = {
  1: 10 * 60 * 1000,        // 10 minutes
  2: 1 * 24 * 60 * 60 * 1000,   // 1 day
  3: 3 * 24 * 60 * 60 * 1000,   // 3 days
  4: 7 * 24 * 60 * 60 * 1000,   // 7 days
  5: 14 * 24 * 60 * 60 * 1000,  // 14 days
  6: 30 * 24 * 60 * 60 * 1000,  // 30 days
  7: 60 * 24 * 60 * 60 * 1000,  // 60 days
  8: 120 * 24 * 60 * 60 * 1000, // 120 days
  9: 180 * 24 * 60 * 60 * 1000, // 180 days (6 months)
};

/**
 * Determines if an item is due for review based on its SRS level and time since last review
 * @param item - The item to check
 * @returns true if the item is due for review, false otherwise
 */
function isItemDue(item: Item): boolean {
  // Exclude items without SRS data
  if (!item.srs) {
    return false;
  }

  const { srs_level, time_created } = item.srs;

  // Exclude items with missing or invalid SRS data
  if (srs_level == null || !time_created) {
    return false;
  }

  // Exclude items with invalid SRS levels
  if (srs_level < 1 || srs_level > 9) {
    return false;
  }

  // Calculate elapsed time since last review
  const currentTime = Date.now();
  const lastReviewTime = new Date(time_created).getTime();

  // Exclude items with future timestamps (invalid data)
  if (lastReviewTime > currentTime) {
    return false;
  }

  const elapsedTime = currentTime - lastReviewTime;

  // Get the time factor for this SRS level
  const timeFactor = SRS_TIME_FACTORS[srs_level];

  // Item is due if elapsed time is greater than or equal to the time factor
  return elapsedTime >= timeFactor;
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

    // Filter items to only include those that are due for review
    if (data && data.items && Array.isArray(data.items)) {
      const dueItems = data.items.filter(isItemDue);

      return res.status(200).json({
        success: true,
        data: {
          ...data,
          items: dueItems
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  return handleGET(req, res);
}
