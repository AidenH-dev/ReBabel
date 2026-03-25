import { supabaseKvs } from '@/lib/supabaseKvs';
import { withLogger } from '@/lib/withLogger';
import { log } from '@/lib/logger';
import { SRS_INTERVALS } from '@/lib/srs/constants';
import { createAPNsJWT, sendAPNsNotification, getAPNsConfig } from '@/lib/apns';

function isItemNewlyDue(item, lastNotifiedAt) {
  if (!item.srs?.srs_level || !item.srs?.time_created) return false;

  const srsLevel = item.srs.srs_level;
  if (srsLevel < 1 || srsLevel > 9) return false;

  const timeCreated = new Date(item.srs.time_created).getTime();
  const interval = SRS_INTERVALS[srsLevel];
  const dueTime = timeCreated + interval;
  const now = Date.now();
  const lastNotified = lastNotifiedAt ? new Date(lastNotifiedAt).getTime() : 0;

  // Item is due AND became due after last notification
  return dueTime <= now && dueTime > lastNotified;
}

async function getNewlyDueCount(userId, lastNotifiedAt) {
  try {
    // Get user's sets
    const { data: setsData, error: setsError } = await supabaseKvs.rpc(
      'get_user_sets',
      { user_id: userId.trim() }
    );

    if (setsError || !setsData) return 0;

    // Parse sets data
    let setsArray = [];
    if (typeof setsData === 'string') {
      try {
        setsArray = JSON.parse(setsData);
      } catch {
        setsArray = Array.isArray(setsData) ? setsData : [];
      }
    } else if (Array.isArray(setsData)) {
      setsArray = setsData;
    }

    // Filter to SRS-enabled sets
    const srsEnabledSets = setsArray.filter(
      (set) => set.data?.srs_enabled === 'true'
    );

    if (srsEnabledSets.length === 0) return 0;

    let newlyDueCount = 0;

    // Check each set for newly due items
    for (const set of srsEnabledSets) {
      const { data: setData, error: setError } = await supabaseKvs.rpc(
        'get_set_items_srs_status_full',
        { set_id: set.entity_id }
      );

      if (setError || !setData?.items) continue;

      const newlyDueItems = setData.items.filter((item) =>
        isItemNewlyDue(item, lastNotifiedAt)
      );
      newlyDueCount += newlyDueItems.length;
    }

    return newlyDueCount;
  } catch (e) {
    log.error('srs.due_count_failed', {
      userId,
      error: e?.message || String(e),
    });
    return 0;
  }
}

export default withLogger(async function handler(req, res) {
  // Verify request is from Vercel Cron or has valid secret
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, verify it (Pro/Enterprise plans)
  // Otherwise, check for Vercel's cron user-agent or allow in development
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  } else {
    // For Hobby plans: verify it's coming from Vercel's cron system
    const isVercelCron = req.headers['user-agent']?.includes('vercel-cron');
    const isLocalDev = process.env.NODE_ENV !== 'production';

    if (!isVercelCron && !isLocalDev) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
  }

  try {
    // Get users with due items from Supabase
    const { data: users, error } = await supabaseKvs.rpc(
      'get_users_with_due_items'
    );

    if (error) {
      req.log.error('rpc.failed', {
        fn: 'get_users_with_due_items',
        error: error.message,
        code: error.code,
      });
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!users || users.length === 0) {
      return res.json({
        success: true,
        message: 'No users to notify',
        count: 0,
      });
    }

    // Setup APNs
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

    // APNs reasons that mean the token is permanently invalid
    const INVALID_TOKEN_REASONS = [
      'BadDeviceToken',
      'Unregistered',
      'DeviceTokenNotForTopic',
    ];

    // Group rows by user so we calculate due count once and send to all devices
    const userMap = new Map();
    for (const row of users) {
      if (!userMap.has(row.user_id)) {
        userMap.set(row.user_id, {
          user_id: row.user_id,
          due_count: row.due_count,
          tokens: [],
        });
      }
      userMap.get(row.user_id).tokens.push(row.device_token);
    }

    const results = [];
    for (const user of userMap.values()) {
      // Get last_notified_at
      const { data: prefData } = await supabaseKvs
        .from('notification_preferences')
        .select('last_notified_at')
        .eq('user_id', user.user_id)
        .single();
      const lastNotifiedAt = prefData?.last_notified_at;

      // Calculate newly due items once per user
      const newlyDueCount = await getNewlyDueCount(
        user.user_id,
        lastNotifiedAt
      );

      if (newlyDueCount === 0) {
        results.push({
          user_id: user.user_id,
          success: true,
          skipped: true,
          reason: 'No newly due items',
        });
        continue;
      }

      const notification = {
        aps: {
          alert: {
            title: 'SRS: がんばれ! Time to Review',
            body:
              newlyDueCount === 1
                ? '1 item just became ready for review'
                : `${newlyDueCount} items just became ready for review`,
          },
          sound: 'default',
          badge: Number(user.due_count),
        },
        route: '/learn/academy/sets/fast-review',
      };

      // Send to all of this user's devices
      let anySent = false;
      for (const token of user.tokens) {
        try {
          const result = await sendAPNsNotification(
            token,
            notification,
            jwt,
            bundleId,
            isProduction
          );

          results.push({
            user_id: user.user_id,
            success: result.success,
            error: result.error,
          });

          if (result.success) {
            anySent = true;
          } else if (INVALID_TOKEN_REASONS.includes(result.reason)) {
            // Token is permanently invalid -- remove it so we stop retrying
            await supabaseKvs.rpc('unregister_device_token', {
              p_token: token,
            });
            req.log.info('apns.stale_token_removed', {
              userId: user.user_id,
              reason: result.reason,
            });
          }
        } catch (err) {
          req.log.error('apns.send_failed', {
            userId: user.user_id,
            error: err?.message || String(err),
            stack: err?.stack,
          });
          results.push({
            user_id: user.user_id,
            success: false,
            error: err.message,
          });
        }
      }

      // Update last_notified_at once after all devices for this user
      if (anySent) {
        await supabaseKvs
          .from('notification_preferences')
          .update({ last_notified_at: new Date().toISOString() })
          .eq('user_id', user.user_id);
      }
    }

    const successCount = results.filter((r) => r.success && !r.skipped).length;
    req.log.info('cron.notifications.complete', {
      usersChecked: userMap.size,
      notificationsSent: successCount,
    });
    return res.json({
      success: true,
      message: `Sent ${successCount}/${results.length} notifications`,
      results,
    });
  } catch (error) {
    req.log.error('cron.srs_notifications_error', {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return res.status(500).json({ success: false, error: error.message });
  }
});
