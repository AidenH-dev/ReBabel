import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

interface SetData {
  entity_id: string;
  data: {
    owner: string;
    title: string;
    item_num?: number;
    srs_enabled?: string;
    [key: string]: any;
  };
}

interface DashboardStats {
  totalSets: number;
  totalItems: number;
  activeSrsItems: number;
}

interface ApiResponse {
  success: boolean;
  data?: DashboardStats;
  error?: string;
}

async function handleGET(req: NextApiRequest, res: NextApiResponse<ApiResponse>, userId: string) {
  try {
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

    // Calculate total sets
    const totalSets = setsArray.length;

    // Fetch items from all sets to get accurate counts
    let totalItems = 0;
    let activeSrsItems = 0;

    for (const set of setsArray) {
      const setId = set.entity_id;
      const isSrsEnabled = set.data?.srs_enabled === 'true';

      // Use get_set_with_items_v2 to get all items in the set
      const { data: setData, error: setError } = await supabase
        .schema('v1_kvs_rebabel')
        .rpc('get_set_with_items_v2', {
          set_entity_id: setId
        });

      if (setError) {
        console.error(`Error fetching set ${setId}:`, setError);
        continue;
      }

      // Parse the data if needed
      let parsedData = setData;
      if (typeof setData === 'string') {
        try {
          parsedData = JSON.parse(setData);
        } catch {
          continue;
        }
      }

      if (parsedData && parsedData.items && Array.isArray(parsedData.items)) {
        // Count total items
        totalItems += parsedData.items.length;

        // Count active SRS items only for SRS-enabled sets
        if (isSrsEnabled) {
          // Fetch SRS status for this set
          const { data: srsData, error: srsError } = await supabase
            .schema('v1_kvs_rebabel')
            .rpc('get_set_items_srs_status_full', {
              set_id: setId
            });

          if (!srsError && srsData && srsData.items && Array.isArray(srsData.items)) {
            const activeItems = srsData.items.filter((item: any) =>
              item.srs && typeof item.srs.srs_level === 'number' && item.srs.srs_level > 0
            );
            activeSrsItems += activeItems.length;
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        totalSets,
        totalItems,
        activeSrsItems
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
