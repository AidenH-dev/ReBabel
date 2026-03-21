import { NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseKvs } from '@/lib/supabaseKvs';
import { resolveUserId } from '@/lib/resolveUserId';
import { withLogger } from '@/lib/withLogger';
import type { LoggedRequest } from '@/lib/withLogger';

interface ApiResponse {
  count?: number;
  error?: string;
}

async function handler(req: LoggedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await resolveUserId(session.user.sub);

  try {
    // Get today's date boundaries in UTC
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Find all session entities owned by this user that were created today
    const { data: ownerRows, error: ownerError } = await supabaseKvs
      .from('user_stats')
      .select('entity')
      .eq('property', 'owner')
      .eq('value', userId)
      .gte('ts', todayStart.toISOString())
      .lte('ts', todayEnd.toISOString());

    if (ownerError) {
      req.log.error('rpc.failed', { fn: 'user_stats.owner_query', error: ownerError.message, code: ownerError.code });
      return res.status(500).json({ error: 'Failed to fetch session count' });
    }

    const candidateEntities = Array.from(new Set(ownerRows?.map(row => row.entity) || []));

    if (candidateEntities.length === 0) {
      return res.status(200).json({ count: 0 });
    }

    // Filter to only 'translate' session types (conjugation is unlimited)
    const { data: sessionRows, error: sessionError } = await supabaseKvs
      .from('user_stats')
      .select('entity')
      .eq('property', 'session_type')
      .eq('value', 'translate')
      .in('entity', candidateEntities);

    if (sessionError) {
      req.log.error('rpc.failed', { fn: 'user_stats.session_type_query', error: sessionError.message, code: sessionError.code });
      return res.status(500).json({ error: 'Failed to fetch session count' });
    }

    const sessionEntities = new Set(sessionRows?.map(row => row.entity) || []);

    return res.status(200).json({ count: sessionEntities.size });
  } catch (error: any) {
    req.log.error('session.today_count_failed', { error: error?.message || String(error), stack: error?.stack });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withApiAuthRequired(withLogger(handler));
