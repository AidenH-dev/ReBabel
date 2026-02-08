import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    if (!session?.user?.sub) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { deviceToken, platform = 'ios' } = req.body;

    if (!deviceToken) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    const { data, error } = await supabase.rpc('register_device_token', {
      p_user_id: session.user.sub,
      p_token: deviceToken,
      p_platform: platform,
    }, { schema: 'v1_kvs_rebabel' });

    if (error) {
      console.error('Error registering device token:', error);
      return res.status(500).json({ error: 'Failed to register device token' });
    }

    return res.status(200).json({ success: true, id: data });
  } catch (error) {
    console.error('Register token error:', error);
    return res.status(500).json({ error: 'Failed to register device token' });
  }
}

export default withApiAuthRequired(handler);
