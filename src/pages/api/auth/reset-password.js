import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const response = await fetch(
      `https://${process.env.AUTH0_ISSUER_BASE_URL.replace('https://', '')}/dbconnections/change_password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.AUTH0_CLIENT_ID,
          email: session.user.email,
          connection: 'Username-Password-Authentication',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Auth0 password reset error:', errorText);
      return res.status(500).json({ error: 'Failed to send reset email' });
    }

    return res.status(200).json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Failed to send reset email' });
  }
}

export default withApiAuthRequired(handler);
