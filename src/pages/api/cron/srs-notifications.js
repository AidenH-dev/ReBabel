import crypto from 'crypto';
import http2 from 'http2';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function createJWT(keyId, teamId, privateKey) {
  const header = {
    alg: 'ES256',
    kid: keyId,
  };

  const payload = {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${base64Header}.${base64Payload}`;

  const sign = crypto.createSign('SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(privateKey, 'base64url');

  return `${signatureInput}.${signature}`;
}

function sendAPNsNotification(deviceToken, payload, jwt, bundleId, isProduction = false) {
  return new Promise((resolve, reject) => {
    const host = isProduction ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';

    const client = http2.connect(`https://${host}`);

    client.on('error', (err) => {
      reject(err);
    });

    const headers = {
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      'authorization': `bearer ${jwt}`,
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

export default async function handler(req, res) {
  // Verify request is from Vercel Cron or has valid secret
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, verify it (Pro/Enterprise plans)
  // Otherwise, check for Vercel's cron user-agent or allow in development
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } else {
    // For Hobby plans: verify it's coming from Vercel's cron system
    const isVercelCron = req.headers['user-agent']?.includes('vercel-cron');
    const isLocalDev = process.env.NODE_ENV !== 'production';

    if (!isVercelCron && !isLocalDev) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // Get users with due items from Supabase
    const { data: users, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_users_with_due_items');

    if (error) {
      console.error('Error fetching users with due items:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!users || users.length === 0) {
      return res.json({ message: 'No users to notify', count: 0 });
    }

    // Setup APNs
    const apnsKeyId = process.env.APNS_KEY_ID;
    const apnsTeamId = process.env.APNS_TEAM_ID;
    const apnsKey = process.env.APNS_KEY;
    const bundleId = process.env.APNS_BUNDLE_ID || 'org.rebabel.app';
    const isProduction = process.env.APNS_PRODUCTION === 'true';

    if (!apnsKeyId || !apnsTeamId || !apnsKey) {
      console.error('Missing APNs configuration');
      return res.status(500).json({ error: 'Push notifications not configured' });
    }

    let privateKey;
    if (apnsKey.includes('BEGIN PRIVATE KEY')) {
      privateKey = apnsKey.replace(/\\n/g, '\n');
    } else {
      privateKey = Buffer.from(apnsKey, 'base64').toString('utf-8');
    }

    const jwt = createJWT(apnsKeyId, apnsTeamId, privateKey);

    // Send notifications to each user
    const results = [];
    for (const user of users) {
      const notification = {
        aps: {
          alert: {
            title: 'がんばれ! Time to Review',
            body: user.due_count === 1
              ? 'You have 1 item ready for review'
              : `You have ${user.due_count} items ready for review`,
          },
          sound: 'default',
          badge: Number(user.due_count),
        },
      };

      try {
        const result = await sendAPNsNotification(
          user.device_token,
          notification,
          jwt,
          bundleId,
          isProduction
        );

        results.push({
          user_id: user.user_id,
          success: result.success,
          error: result.error
        });

        // Update last_notified_at for this user
        if (result.success) {
          await supabase
            .schema('v1_kvs_rebabel')
            .from('notification_preferences')
            .update({ last_notified_at: new Date().toISOString() })
            .eq('user_id', user.user_id);
        }
      } catch (err) {
        console.error(`Failed to send notification to ${user.user_id}:`, err);
        results.push({
          user_id: user.user_id,
          success: false,
          error: err.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return res.json({
      message: `Sent ${successCount}/${results.length} notifications`,
      results
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({ error: error.message });
  }
}
