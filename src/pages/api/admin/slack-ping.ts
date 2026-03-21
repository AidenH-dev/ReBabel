import { NextApiRequest, NextApiResponse } from 'next';
import { withLogger } from '@/lib/withLogger';

export default withLogger(async function handler(req, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Slack sends slash command payloads as application/x-www-form-urlencoded
  const { token, command } = req.body;

  // Verify this came from Slack
  if (token !== process.env.SLACK_VERIFICATION_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({
    response_type: 'ephemeral',
    text: `✅ ReBabel is live — ${new Date().toISOString()}`,
  });
});
