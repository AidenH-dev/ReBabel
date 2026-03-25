import '@/styles/globals.css';
import { Fredoka } from '@next/font/google';
import { UserProvider, useUser } from '@auth0/nextjs-auth0/client';
import { PremiumProvider } from '@/contexts/PremiumContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import ReportIssueButton from '@/components/ui/ReportIssueButton';
import BugReporter from '@/components/BugReporter'; // Implements SPEC-LLM-UI-001
import BugReporterErrorBoundary from '@/components/BugReporter/BugReporterErrorBoundary';
import { BugReporterProvider } from '@/contexts/BugReporterContext';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { SRSNotificationPrompt } from '@/components/Popups/SRSNotificationPrompt';
import usePushNotifications from '@/hooks/usePushNotifications';
import useCapacitorInit from '@/hooks/useCapacitorInit';
import { clientLog } from '@/lib/clientLogger';

// Early push notification listener setup (for cold start handling)
// This runs immediately when the module loads on the client
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;

      const { PushNotifications } =
        await import('@capacitor/push-notifications');

      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
          const route =
            notification.notification?.data?.route ||
            '/learn/academy/sets/fast-review';

          window.location.href = route;
        }
      );
    } catch (e) {
      clientLog.error('push.cold_start_failed', {
        error: e?.message || String(e),
      });
    }
  })();
}

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

// Bridge component that runs inside <UserProvider>
function PostHogAuthBridge() {
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;
    if (user?.sub) {
      posthog.identify(user.sub, {
        email: user.email,
        name: user.name,
        email_verified: !!user.email_verified,
      });
    } else {
      posthog.reset();
    }
  }, [user, isLoading]);

  return null;
}

// Bridge component that fires a heartbeat once per app load when authenticated.
// Implements SPEC-DB-003 (client caller)
function PlatformHeartbeatBridge() {
  const { user, isLoading } = useUser();
  const firedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !user || firedRef.current) return;
    firedRef.current = true;
    // Fire-and-forget: do not await, do not surface errors to the user
    fetch('/api/analytics/heartbeat', { method: 'POST' }).catch(() => {});
  }, [user, isLoading]);

  return null;
}

// Push notification bridge: auto re-registers token on launch + first-time prompt
function PushNotificationBridge() {
  const { showPrompt, srsCount, handleEnableNotifications, handleClosePrompt } =
    usePushNotifications();

  return (
    <SRSNotificationPrompt
      isOpen={showPrompt}
      onClose={handleClosePrompt}
      onEnableNotifications={handleEnableNotifications}
      srsSetCount={srsCount}
    />
  );
}

export default function MyApp({ Component, pageProps }) {
  useCapacitorInit();

  return (
    <UserProvider>
      <PlatformHeartbeatBridge />
      <PushNotificationBridge />
      <PreferencesProvider>
        <ThemeProvider>
          <PremiumProvider>
            <Script
              async
              src="https://www.googletagmanager.com/gtag/js?id=G-VRBTF7S087"
            />
            <Script id="google-analytics">
              {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-VRBTF7S087');
          `}
            </Script>
            <BugReporterProvider>
              <PostHogProvider client={posthog}>
                <PostHogAuthBridge />
                <div className={fredoka.className}>
                  <BugReporterErrorBoundary>
                    <Component {...pageProps} />
                  </BugReporterErrorBoundary>
                  <ReportIssueButton />
                  <BugReporter />
                  <Analytics />
                  <SpeedInsights />
                </div>
              </PostHogProvider>
            </BugReporterProvider>
          </PremiumProvider>
        </ThemeProvider>
      </PreferencesProvider>
    </UserProvider>
  );
}
