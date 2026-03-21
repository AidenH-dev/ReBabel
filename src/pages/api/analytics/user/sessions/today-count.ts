import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';
import { resolveUserId } from '@/lib/resolveUserId';

interface ApiResponse {
  count?: number;
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

  const userId = await resolveUserId(session.user.sub);

  try {
    const supabase = createClient(
      process.env.NEXT_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get today's date boundaries in UTC
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Find all session entities owned by this user that were created today
    const { data: ownerRows, error: ownerError } = await supabase
      .schema('v1_kvs_rebabel')
      .from('user_stats')
      .select('entity')
      .eq('property', 'owner')
      .eq('value', userId)
      .gte('ts', todayStart.toISOString())
      .lte('ts', todayEnd.toISOString());

    if (ownerError) {
      console.error('Failed to fetch session count:', ownerError);
      return res.status(500).json({ error: 'Failed to fetch session count' });
    }

    const candidateEntities = Array.from(new Set(ownerRows?.map(row => row.entity) || []));

    if (candidateEntities.length === 0) {
      return res.status(200).json({ count: 0 });
    }

    // Filter to only 'translate' session types (conjugation is unlimited)
    const { data: sessionRows, error: sessionError } = await supabase
      .schema('v1_kvs_rebabel')
      .from('user_stats')
      .select('entity')
      .eq('property', 'session_type')
      .eq('value', 'translate')
      .in('entity', candidateEntities);

    if (sessionError) {
      console.error('Failed to filter translate sessions:', sessionError);
      return res.status(500).json({ error: 'Failed to fetch session count' });
    }

    const sessionEntities = new Set(sessionRows?.map(row => row.entity) || []);

    return res.status(200).json({ count: sessionEntities.size });
  } catch (error) {
    console.error('Session count error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);
