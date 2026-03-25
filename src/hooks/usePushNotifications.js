import { useEffect, useRef, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { clientLog } from '@/lib/clientLogger';

const PUSH_REQUESTED_KEY = 'push_permission_requested';

/**
 * Register with APNs and POST the resulting token to the server.
 * Resolves with the token string, rejects on timeout or error.
 */
async function registerAndSendToken() {
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const token = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Push registration timeout')),
      10000
    );

    PushNotifications.addListener('registration', (t) => {
      clearTimeout(timeout);
      resolve(t.value);
    });

    PushNotifications.addListener('registrationError', (err) => {
      clearTimeout(timeout);
      reject(new Error(err?.message || String(err)));
    });

    PushNotifications.register();
  });

  const res = await fetch('/api/push/register-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceToken: token, platform: 'ios' }),
  });

  if (!res.ok) {
    throw new Error(`register-token responded ${res.status}`);
  }

  return token;
}

/**
 * Push notification lifecycle hook.
 *
 * Handles two concerns:
 *  1. Auto re-register the APNs token on every app launch (tokens change on
 *     reinstall, OS update, or at Apple's discretion).
 *  2. Show a one-time prompt for first-time users who have SRS-enabled sets.
 */
export default function usePushNotifications() {
  const { user, isLoading } = useUser();
  const [showPrompt, setShowPrompt] = useState(false);
  const [srsCount, setSrsCount] = useState(0);
  const [isNativePlatform, setIsNativePlatform] = useState(false);
  const reregisteredRef = useRef(false);

  // Auto re-register on every app launch for users who previously granted permission.
  useEffect(() => {
    if (isLoading || !user || reregisteredRef.current) return;

    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        if (!localStorage.getItem(PUSH_REQUESTED_KEY)) return;

        const { PushNotifications } =
          await import('@capacitor/push-notifications');
        const permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive !== 'granted') return;

        reregisteredRef.current = true;
        await registerAndSendToken();
      } catch (e) {
        clientLog.warn('push.auto_reregister_failed', {
          error: e?.message || String(e),
        });
      }
    })();
  }, [user, isLoading]);

  // One-time prompt for first-time users.
  useEffect(() => {
    if (isLoading || !user) return;
    if (localStorage.getItem(PUSH_REQUESTED_KEY)) return;

    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        setIsNativePlatform(true);

        const response = await fetch('/api/database/v2/sets/srs-count');
        if (!response.ok) return;

        const data = await response.json();
        if (data.success && data.count > 0) {
          setSrsCount(data.count);
          setShowPrompt(true);
        }
      } catch (e) {
        clientLog.warn('capacitor.not_available');
      }
    })();
  }, [user, isLoading]);

  const handleEnableNotifications = async () => {
    if (!isNativePlatform) return;

    try {
      const { PushNotifications } =
        await import('@capacitor/push-notifications');
      const result = await PushNotifications.requestPermissions();
      localStorage.setItem(PUSH_REQUESTED_KEY, 'true');

      if (result.receive === 'granted') {
        await registerAndSendToken();
      }
    } catch (e) {
      clientLog.error('push.permission_failed', {
        error: e?.message || String(e),
      });
    }
  };

  const handleClosePrompt = () => {
    setShowPrompt(false);
    localStorage.setItem(PUSH_REQUESTED_KEY, 'true');
  };

  return { showPrompt, srsCount, handleEnableNotifications, handleClosePrompt };
}
