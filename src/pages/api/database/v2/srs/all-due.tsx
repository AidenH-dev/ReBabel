import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

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

interface SetData {
  entity_id: string;
  data: {
    owner: string;
    title: string;
    description: string;
    srs_enabled: string;
    [key: string]: any;
  };
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

// SRS level time factors in milliseconds
const SRS_TIME_FACTORS: Record<number, number> = {
  1: 10 * 60 * 1000,              // 10 minutes
  2: 1 * 24 * 60 * 60 * 1000,     // 1 day
  3: 3 * 24 * 60 * 60 * 1000,     // 3 days
  4: 7 * 24 * 60 * 60 * 1000,     // 7 days
  5: 14 * 24 * 60 * 60 * 1000,    // 14 days
  6: 30 * 24 * 60 * 60 * 1000,    // 30 days
  7: 60 * 24 * 60 * 60 * 1000,    // 60 days
  8: 120 * 24 * 60 * 60 * 1000,   // 120 days
  9: 180 * 24 * 60 * 60 * 1000,   // 180 days (6 months)
};

/**
 * Determines if an item is due for review based on its SRS level and time since last review
 */
function isItemDue(item: Item): boolean {
  if (!item.srs) {
    return false;
  }

  const { srs_level, time_created } = item.srs;

  if (srs_level == null || !time_created) {
    return false;
  }

  if (srs_level < 1 || srs_level > 9) {
    return false;
  }

  const currentTime = Date.now();
  const lastReviewTime = new Date(time_created).getTime();

  if (lastReviewTime > currentTime) {
    return false;
  }

  const elapsedTime = currentTime - lastReviewTime;
  const timeFactor = SRS_TIME_FACTORS[srs_level];

  return elapsedTime >= timeFactor;
}

async function handleGET(req: NextApiRequest, res: NextApiResponse<ApiResponse>, userId: string) {
  try {
    const { countOnly } = req.query;

    const SUPABASE_URL = process.env.NEXT_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all user sets
    const { data: setsData, error: setsError } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_user_sets', {
        user_id: userId.trim()
      });

    if (setsError) {
      console.error('Error fetching user sets:', setsError);
      return res.status(500).json({
        success: false,
        error: `Database error: ${setsError.message}`
      });
    }

    // Parse sets data
    let setsArray: SetData[] = [];
    if (typeof setsData === 'string') {
      try {
        setsArray = JSON.parse(setsData);
      } catch {
        setsArray = Array.isArray(setsData) ? setsData : [];
      }
    } else if (Array.isArray(setsData)) {
      setsArray = setsData;
    }

    // Filter to SRS-enabled sets only
    const srsEnabledSets = setsArray.filter(
      (set) => set.data?.srs_enabled === 'true'
    );

    if (srsEnabledSets.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          metadata: {
            totalDueItems: 0,
            setBreakdown: []
          }
        }
      });
    }

    // Fetch due items from each SRS-enabled set
    const allDueItems: Array<Item & { setId: string; setTitle: string }> = [];
    const setBreakdown: SetBreakdown[] = [];

    for (const set of srsEnabledSets) {
      const setId = set.entity_id;
      const setTitle = set.data?.title || 'Untitled Set';

      const { data: setData, error: setError } = await supabase
        .schema('v1_kvs_rebabel')
        .rpc('get_set_items_srs_status_full', {
          set_id: setId
        });

      if (setError) {
        console.error(`Error fetching set ${setId}:`, setError);
        continue;
      }

      if (setData && setData.items && Array.isArray(setData.items)) {
        const dueItems = setData.items.filter(isItemDue);

        if (dueItems.length > 0) {
          // Add set context to each item
          const itemsWithSetContext = dueItems.map((item: Item) => ({
            ...item,
            setId,
            setTitle
          }));

          allDueItems.push(...itemsWithSetContext);

          setBreakdown.push({
            setId,
            setTitle,
            dueCount: dueItems.length
          });
        }
      }
    }

    // If countOnly, return just the metadata
    if (countOnly === 'true') {
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          metadata: {
            totalDueItems: allDueItems.length,
            setBreakdown
          }
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        items: allDueItems,
        metadata: {
          totalDueItems: allDueItems.length,
          setBreakdown
        }
      }
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
