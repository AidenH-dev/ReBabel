import { withAuth } from '@/lib/withAuth';
import { createRateLimiter } from '@/lib/rateLimit';
import { createAPNsJWT, sendAPNsNotification, getAPNsConfig } from '@/lib/apns';

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  }

  try {
    if (!limiter.check(req.auth0Sub)) {
      return res
        .status(429)
        .json({
          success: false,
          error: 'Too many requests. Please try again later.',
        });
    }

    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res
        .status(400)
        .json({ success: false, error: 'Device token is required' });
    }

    const apnsConfig = getAPNsConfig();
    if (!apnsConfig) {
      req.log.error('config.missing', { error: 'Missing APNs configuration' });
      return res
        .status(500)
        .json({ success: false, error: 'Push notifications not configured' });
    }

    const {
      keyId: apnsKeyId,
      teamId: apnsTeamId,
      bundleId,
      isProduction,
      privateKey,
    } = apnsConfig;
    const jwt = createAPNsJWT(apnsKeyId, apnsTeamId, privateKey);

    const notification = {
      aps: {
        alert: {
          title: 'Test Notification',
          body: 'Push notifications are working! Tap to open fast review.',
        },
        sound: 'default',
        badge: 1,
      },
      // Custom data for deep linking
      route: '/learn/academy/sets/fast-review',
    };

    const result = await sendAPNsNotification(
      deviceToken,
      notification,
      jwt,
      bundleId,
      isProduction
    );

    if (result.success) {
      return res
        .status(200)
        .json({ success: true, message: 'Test notification sent!' });
    } else {
      req.log.error('apns.send_failed', {
        error: result.error,
        statusCode: result.statusCode,
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to send notification',
      });
    }
  } catch (error) {
    req.log.error('push.send_test_failed', {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return res
      .status(500)
      .json({ success: false, error: 'Failed to send notification' });
  }
}

export default withAuth(handler);
