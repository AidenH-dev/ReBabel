// Implements SPEC-DB-004 (API layer)
// GET /api/admin/platform-metrics?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
// Admin-only endpoint returning aggregated platform metrics for a date range.
import { NextApiResponse } from 'next';
import { withAuth } from '@/lib/withAuth';
import type { AuthedRequest } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

async function handler(req: AuthedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Validate required query params
  const { start_date, end_date } = req.query;

  if (!start_date || typeof start_date !== 'string') {
    return res.status(400).json({ success: false, error: 'start_date is required (YYYY-MM-DD)' });
  }
  if (!end_date || typeof end_date !== 'string') {
    return res.status(400).json({ success: false, error: 'end_date is required (YYYY-MM-DD)' });
  }

  try {
    const { data, error } = await supabaseKvs
      .rpc('get_admin_platform_metrics', {
        p_start_date: start_date,
        p_end_date: end_date,
      });

    if (error) {
      req.log.error('rpc.failed', { fn: 'get_admin_platform_metrics', error: error.message, code: error.code });
      return res.status(500).json({ success: false, error: 'Failed to fetch platform metrics' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    req.log.error('platform_metrics.error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export default withAuth(handler, { requireAdmin: true });
