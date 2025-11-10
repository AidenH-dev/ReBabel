import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

const supabase = createClient(
  process.env.NEXT_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DayLimitData {
  learned_today_count: number;
  daily_limit: number;
  remaining: number;
  limit_reached: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: DayLimitData;
  error?: string;
}

/**
 * Validates if a string is a valid UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Extracts and validates a date from various formats
 * Accepts: YYYY-MM-DD or ISO timestamp formats
 * Returns the date portion in YYYY-MM-DD format
 */
function extractAndValidateDate(dateString: string): string | null {
  // Try to match YYYY-MM-DD format first
  const dateOnlyRegex = /^(\d{4}-\d{2}-\d{2})/;
  const match = dateString.match(dateOnlyRegex);

  if (!match) {
    return null;
  }

  const extractedDate = match[1];
  const date = new Date(extractedDate);

  if (date instanceof Date && !isNaN(date.getTime())) {
    return extractedDate;
  }

  return null;
}

/**
 * Converts a local date string (YYYY-MM-DD) to UTC start and end timestamps
 * This assumes the dateString represents the user's local date and converts it
 * to the UTC equivalent for database filtering
 */
function getUTCDateRange(dateString: string): { startUTC: string; endUTC: string } {
  // Parse the local date
  const [year, month, day] = dateString.split('-').map(Number);
  const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);

  // Get the start of the day in local time, then convert to UTC
  // We need to account for timezone offset
  const offset = localDate.getTimezoneOffset() * 60 * 1000; // Convert minutes to milliseconds
  const startLocal = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
  const startUTC = new Date(startLocal + offset);

  // Get the end of the day (23:59:59.999)
  const endLocal = new Date(year, month - 1, day + 1, 0, 0, 0, 0).getTime() - 1;
  const endUTC = new Date(endLocal + offset);

  // Return ISO strings for comparison with PostgreSQL TIMESTAMPTZ
  return {
    startUTC: startUTC.toISOString(),
    endUTC: endUTC.toISOString()
  };
}

/**
 * Checks if a timestamp falls within the given UTC date range
 */
function isWithinDateRange(timestamp: string, startUTC: string, endUTC: string): boolean {
  const timestampMs = new Date(timestamp).getTime();
  const startMs = new Date(startUTC).getTime();
  const endMs = new Date(endUTC).getTime();
  return timestampMs >= startMs && timestampMs <= endMs;
}

interface SRSItem {
  id: string;
  srs: {
    scope: string;
    srs_level: number;
    time_created: string;
  } | null;
  [key: string]: any;
}

interface SetData {
  set: any;
  items: SRSItem[];
}

async function handleGET(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const { setId, currentDate, limit } = req.query;

    // Validate setId
    if (!setId || typeof setId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing setId parameter'
      });
    }

    if (!isValidUUID(setId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid setId format - must be a valid UUID'
      });
    }

    // Validate and extract currentDate
    if (!currentDate || typeof currentDate !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing currentDate parameter'
      });
    }

    const extractedDate = extractAndValidateDate(currentDate);
    if (!extractedDate) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currentDate format - must be YYYY-MM-DD or ISO timestamp'
      });
    }

    // Parse and validate limit
    let dailyLimit = 10; // Default daily limit
    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      if (isNaN(limitNum) || limitNum <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid limit parameter - must be a positive integer'
        });
      }
      dailyLimit = limitNum;
    }

    // Call RPC to get all set items with SRS data
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

    const setData: SetData = data;

    // Get UTC date range for filtering
    const { startUTC, endUTC } = getUTCDateRange(extractedDate);

    // Filter items that were newly learned today
    // Criteria:
    // 1. Item has SRS data (srs is not null)
    // 2. scope is 'set_srs_flow_learn_new' (indicates newly learned in this session)
    // 3. srs_level is 1 (first learning level)
    // 4. time_created falls within today's UTC date range
    const learnedTodayItems = setData.items.filter((item) => {
      if (!item.srs) {
        return false;
      }

      const { scope, srs_level, time_created } = item.srs;
      const isNewlyLearned = scope === 'set_srs_flow_learn_new' && srs_level === 1;
      const isWithinToday = isWithinDateRange(time_created, startUTC, endUTC);

      return isNewlyLearned && isWithinToday;
    });

    const learnedTodayCount = learnedTodayItems.length;
    const remaining = Math.max(0, dailyLimit - learnedTodayCount);
    const limitReached = learnedTodayCount >= dailyLimit;

    return res.status(200).json({
      success: true,
      data: {
        learned_today_count: learnedTodayCount,
        daily_limit: dailyLimit,
        remaining,
        limit_reached: limitReached
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
