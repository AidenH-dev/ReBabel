import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { resolveUserId } from '@/lib/resolveUserId';
import { checkUsername } from '@/lib/usernameFilter';

export default withApiAuthRequired(async function handler(req, res) {
  const session = await getSession(req, res);
  if (!session?.user?.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await resolveUserId(session.user.sub, session.user.email);

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .schema('v1_kvs_rebabel')
        .rpc('get_user_identity', { p_user_id: userId });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        username: data?.username || null,
      });
    } catch (err) {
      console.error('Error fetching username:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'username is required' });
    }

    const trimmed = username.trim();

    // Content filter before hitting the DB
    const filterError = checkUsername(trimmed);
    if (filterError) {
      return res.status(400).json({ error: filterError });
    }

    try {
      const { data, error } = await supabaseAdmin
        .schema('v1_kvs_rebabel')
        .rpc('update_username', {
          p_user_id: userId,
          p_username: trimmed,
        });

      if (error) throw error;

      if (data?.error) {
        return res.status(400).json({ error: data.error });
      }

      return res.status(200).json({ success: true, username: data.username });
    } catch (err) {
      console.error('Error updating username:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
