// Implements SPEC-DB-004 (API layer)
// GET /api/admin/platform-metrics?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
// Admin-only endpoint returning aggregated platform metrics for a date range.
import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';

interface ApiResponse {
  message?: unknown;
  error?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Admin privilege check
  const isAdmin =
    session.user?.['https://rebabel.org/app_metadata']?.isAdmin || false;
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Validate required query params
  const { start_date, end_date } = req.query;

  if (!start_date || typeof start_date !== 'string') {
    return res.status(400).json({ error: 'start_date is required (YYYY-MM-DD)' });
  }
  if (!end_date || typeof end_date !== 'string') {
    return res.status(400).json({ error: 'end_date is required (YYYY-MM-DD)' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_admin_platform_metrics', {
        p_start_date: start_date,
        p_end_date: end_date,
      });

    if (error) {
      console.error('Failed to fetch platform metrics:', error);
      return res.status(500).json({ error: 'Failed to fetch platform metrics' });
    }

    return res.status(200).json({ message: data });
  } catch (error) {
    console.error('Platform metrics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);
