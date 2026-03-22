import { withAuth } from '@/lib/withAuth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userEmail = req.auth0Email;
    if (!userEmail) {
      return res.status(401).json({ error: 'Email not available in session' });
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
          email: userEmail,
          connection: 'Username-Password-Authentication',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      req.log.error('auth0.password_reset_failed', { error: errorText });
      return res.status(500).json({ error: 'Failed to send reset email' });
    }

    return res
      .status(200)
      .json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    req.log.error('password_reset.error', {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return res.status(500).json({ error: 'Failed to send reset email' });
  }
}

export default withAuth(handler);
