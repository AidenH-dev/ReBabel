/**
 * APNs (Apple Push Notification service) utilities.
 * Shared by cron/srs-notifications and push/send-test.
 */

import crypto from 'crypto';
import http2 from 'http2';

export function createAPNsJWT(keyId, teamId, privateKey) {
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

export function sendAPNsNotification(
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
        let reason = null;
        try {
          reason = JSON.parse(responseData).reason;
        } catch {}
        resolve({ success: false, statusCode, error: responseData, reason });
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

/**
 * Get APNs configuration from environment variables.
 * Returns null if not configured.
 */
export function getAPNsConfig() {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const bundleId = process.env.APNS_BUNDLE_ID;
  const isProduction = process.env.APNS_PRODUCTION === 'true';
  const rawKey = process.env.APNS_KEY;

  if (!keyId || !teamId || !bundleId || !rawKey) {
    return null;
  }

  const privateKey = rawKey.replace(/\\n/g, '\n');

  return { keyId, teamId, bundleId, isProduction, privateKey };
}
