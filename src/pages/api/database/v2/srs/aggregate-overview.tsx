import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { resolveUserId } from '@/lib/resolveUserId';

interface SetData {
  entity_id: string;
  data: {
    owner: string;
    title: string;
    description: string;
    srs_enabled: string;
    set_type?: string;
    [key: string]: any;
  };
}

interface SrsData {
  srs_level: number;
  time_created: string;
}

interface Item {
  id: string;
  srs?: SrsData;
  [key: string]: any;
}

// SRS level time factors in milliseconds
const SRS_TIME_FACTORS: Record<number, number> = {
  1: 10 * 60 * 1000,
  2: 1 * 24 * 60 * 60 * 1000,
  3: 3 * 24 * 60 * 60 * 1000,
  4: 7 * 24 * 60 * 60 * 1000,
  5: 14 * 24 * 60 * 60 * 1000,
  6: 30 * 24 * 60 * 60 * 1000,
  7: 60 * 24 * 60 * 60 * 1000,
  8: 120 * 24 * 60 * 60 * 1000,
  9: 180 * 24 * 60 * 60 * 1000,
};

function isItemDue(item: Item): boolean {
  if (!item.srs) return false;
  const { srs_level, time_created } = item.srs;
  if (srs_level == null || !time_created) return false;
  if (srs_level < 1 || srs_level > 9) return false;

  const currentTime = Date.now();
  const lastReviewTime = new Date(time_created).getTime();
  if (lastReviewTime > currentTime) return false;

  return (currentTime - lastReviewTime) >= SRS_TIME_FACTORS[srs_level];
}

function toDateString(date: Date, timeZone: string): string {
  return date.toLocaleDateString('en-CA', { timeZone });
}

async function handleGET(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const rawTimezone = req.query.timezone;
  let timezone = 'UTC';
  if (rawTimezone !== undefined) {
    if (typeof rawTimezone !== 'string' || rawTimezone.length === 0 || rawTimezone.length > 64) {
      return res.status(400).json({ success: false, error: 'Invalid timezone' });
    }
    timezone = rawTimezone;
  }

  try {
    const SUPABASE_URL = process.env.NEXT_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all user sets
    const { data: setsData, error: setsError } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_user_sets', { user_id: userId.trim() });

    if (setsError) {
      console.error('Error fetching user sets:', setsError);
      return res.status(500).json({ success: false, error: `Database error: ${setsError.message}` });
    }

    let setsArray: SetData[] = [];
    if (typeof setsData === 'string') {
      try { setsArray = JSON.parse(setsData); } catch { setsArray = Array.isArray(setsData) ? setsData : []; }
    } else if (Array.isArray(setsData)) {
      setsArray = setsData;
    }

    // Filter to SRS-enabled sets
    const srsEnabledSets = setsArray.filter((set) => set.data?.srs_enabled === 'true');

    if (srsEnabledSets.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          sets: [],
          aggregate: {
            totalItems: 0,
            levelCounts: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
            totalDue: 0,
            srsEnabledSets: 0,
          },
          loadChart: [],
        },
      });
    }

    const sets: any[] = [];
    const aggregateLevelCounts: Record<number, number> = {};
    for (let i = 0; i <= 9; i++) aggregateLevelCounts[i] = 0;
    let aggregateTotalItems = 0;
    let aggregateTotalDue = 0;

    // Collect review timestamps + next-due dates for load chart
    const reviewDates: string[] = [];
    const futureDues: { date: string }[] = [];

    for (const set of srsEnabledSets) {
      const setId = set.entity_id;
      const setTitle = set.data?.title || 'Untitled Set';
      const setType = set.data?.set_type || null;

      const { data: setData, error: setError } = await supabase
        .schema('v1_kvs_rebabel')
        .rpc('get_set_items_srs_status_full', { set_id: setId });

      if (setError) {
        console.error(`Error fetching set ${setId}:`, setError);
        continue;
      }

      if (setData && setData.items && Array.isArray(setData.items)) {
        const items: Item[] = setData.items;
        const totalItems = items.length;
        const levelCounts: Record<number, number> = {};
        for (let i = 0; i <= 9; i++) levelCounts[i] = 0;
        let dueCount = 0;

        items.forEach((item) => {
          const level = item.srs?.srs_level ?? 0;
          levelCounts[level]++;
          if (isItemDue(item)) dueCount++;

          // Collect review date (past activity) + projected next due (future load)
          if (item.srs?.time_created && level > 0) {
            const d = new Date(item.srs.time_created);
            if (!isNaN(d.getTime())) {
              reviewDates.push(toDateString(d, timezone));
              // Compute next due date
              const timeFactor = SRS_TIME_FACTORS[level];
              if (timeFactor) {
                const nextDue = new Date(d.getTime() + timeFactor);
                futureDues.push({ date: toDateString(nextDue, timezone) });
              }
            }
          }
        });

        sets.push({ setId, setTitle, setType, totalItems, levelCounts, dueCount });

        // Accumulate into aggregate
        aggregateTotalItems += totalItems;
        aggregateTotalDue += dueCount;
        for (let i = 0; i <= 9; i++) {
          aggregateLevelCounts[i] += (levelCounts[i] || 0);
        }
      }
    }

    // Build SRS load chart data
    const today = toDateString(new Date(), timezone);

    // Past: reviews per day (last 30 days)
    const pastCounts: Record<string, number> = {};
    reviewDates.forEach((date) => {
      if (date <= today) {
        pastCounts[date] = (pastCounts[date] || 0) + 1;
      }
    });

    // Future: projected dues per day (next 30 days)
    const futureCounts: Record<string, number> = {};
    futureDues.forEach(({ date }) => {
      futureCounts[date] = (futureCounts[date] || 0) + 1;
    });

    // Build 30-day windows: past 30 + today + future 30
    const loadChart: { date: string; reviewed: number; due: number }[] = [];
    const msPerDay = 24 * 60 * 60 * 1000;
    const nowMs = Date.now();

    for (let offset = -30; offset <= 30; offset++) {
      const d = toDateString(new Date(nowMs + offset * msPerDay), timezone);
      loadChart.push({
        date: d,
        reviewed: pastCounts[d] || 0,
        due: futureCounts[d] || 0,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        sets,
        aggregate: {
          totalItems: aggregateTotalItems,
          levelCounts: aggregateLevelCounts,
          totalDue: aggregateTotalDue,
          srsEnabledSets: sets.length,
        },
        loadChart,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ success: false, error: 'Unauthorized - authentication required' });
  }

  const userId = await resolveUserId(session.user.sub);

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return handleGET(req, res, userId);
});
