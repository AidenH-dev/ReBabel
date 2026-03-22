// Implements SPEC-LLM-001
import { withAuth } from '@/lib/withAuth';
import { supabaseKvs } from '@/lib/supabaseKvs';

async function handler(req, res) {
  // Implements SPEC-LLM-001: only GET is accepted
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.userId;

  try {
    // Implements SPEC-LLM-001: call check_bug_reporter_permission RPC
    const { data, error } = await supabaseKvs.rpc(
      'check_bug_reporter_permission',
      { p_user_id: userId }
    );

    if (error) throw error;

    return res.status(200).json({ allowed: Boolean(data) });
  } catch (e) {
    req.log.error('bug_reporter.permission_failed', {
      error: e?.message || String(e),
      stack: e?.stack,
    });
    return res.status(500).json({ error: 'Failed to check permission' });
  }
}

export default withAuth(handler);
