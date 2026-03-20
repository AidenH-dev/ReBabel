// Implements SPEC-LLM-001
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { resolveUserId } from '@/lib/resolveUserId';

export default withApiAuthRequired(async function handler(req, res) {
  // Implements SPEC-LLM-001: only GET is accepted
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Implements SPEC-LLM-001: reject unauthenticated requests
  const session = await getSession(req, res);
  const userId = session?.user?.sub
    ? await resolveUserId(session.user.sub)
    : null;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Implements SPEC-LLM-001: call check_bug_reporter_permission RPC
    const { data, error } = await supabaseAdmin
      .schema('v1_kvs_rebabel')
      .rpc('check_bug_reporter_permission', { p_user_id: userId });

    if (error) throw error;

    return res.status(200).json({ allowed: Boolean(data) });
  } catch (e) {
    console.error('bug-reporter/permission error:', e);
    return res.status(500).json({ error: 'Failed to check permission' });
  }
});
