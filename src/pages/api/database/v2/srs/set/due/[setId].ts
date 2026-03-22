import type { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';
import { SRS_INTERVALS } from '@/lib/srs/constants';

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

  // Get the interval for this SRS level
  const interval = SRS_INTERVALS[srs_level];

  // Item is due if elapsed time is greater than or equal to the interval
  return elapsedTime >= interval;
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
