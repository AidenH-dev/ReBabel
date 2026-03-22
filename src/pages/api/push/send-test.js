import { withAuth } from '@/lib/withAuth';
import { createRateLimiter } from '@/lib/rateLimit';
import crypto from 'crypto';

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });
import http2 from 'http2';

function createJWT(keyId, teamId, privateKey) {
  const header = {
    alg: 'ES256',
    kid: keyId,
  };

  const payload = {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString(
    'base64url'
  );
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url'
  );
  const signatureInput = `${base64Header}.${base64Payload}`;

  const sign = crypto.createSign('SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(privateKey, 'base64url');

  return `${signatureInput}.${signature}`;
}

function sendAPNsNotification(
  deviceToken,
  payload,
  jwt,
  bundleId,
  isProduction = false
) {
  return new Promise((resolve, reject) => {
    const host = isProduction
      ? 'api.push.apple.com'
      : 'api.sandbox.push.apple.com';

    const client = http2.connect(`https://${host}`);

    client.on('error', (err) => {
      reject(err);
    });

    const headers = {
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    };

    const req = client.request(headers);

    let responseData = '';
    let statusCode;

    req.on('response', (headers) => {
      statusCode = headers[':status'];
    });

    req.on('data', (chunk) => {
      responseData += chunk;
    });

    req.on('end', () => {
      client.close();
      if (statusCode === 200) {
        resolve({ success: true, statusCode });
      } else {
        resolve({ success: false, statusCode, error: responseData });
      }
    });

    req.on('error', (err) => {
      client.close();
      reject(err);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!limiter.check(req.auth0Sub)) {
      return res
        .status(429)
        .json({ error: 'Too many requests. Please try again later.' });
    }

    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res.status(400).json({ error: 'Device token is required' });
    }

    const apnsKeyId = process.env.APNS_KEY_ID;
    const apnsTeamId = process.env.APNS_TEAM_ID;
    const apnsKey = process.env.APNS_KEY;
    const bundleId = process.env.APNS_BUNDLE_ID || 'org.rebabel.app';
    const isProduction = process.env.APNS_PRODUCTION === 'true';

    if (!apnsKeyId || !apnsTeamId || !apnsKey) {
      req.log.error('config.missing', { error: 'Missing APNs configuration' });
      return res
        .status(500)
        .json({ error: 'Push notifications not configured' });
    }

    // Convert the key from base64, escaped newlines, or use directly
    let privateKey;
    if (apnsKey.includes('BEGIN PRIVATE KEY')) {
      // Key is in PEM format - handle escaped newlines
      privateKey = apnsKey.replace(/\\n/g, '\n');
    } else {
      // Key is base64 encoded
      privateKey = Buffer.from(apnsKey, 'base64').toString('utf-8');
    }

    const jwt = createJWT(apnsKeyId, apnsTeamId, privateKey);

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
        error: 'Failed to send notification',
        details: result.error,
        statusCode: result.statusCode,
      });
    }
  } catch (error) {
    req.log.error('push.send_test_failed', {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return res
      .status(500)
      .json({ error: 'Failed to send notification', details: error.message });
  }
}

export default withAuth(handler);
