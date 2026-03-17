import '@/styles/globals.css';
import { Fredoka } from '@next/font/google';
import { UserProvider, useUser } from '@auth0/nextjs-auth0/client';
import { PremiumProvider } from '@/contexts/PremiumContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ReportIssueButton from '@/components/report-issue';
import BugReporter from '@/components/BugReporter'; // Implements SPEC-LLM-UI-001
import BugReporterErrorBoundary from '@/components/BugReporter/BugReporterErrorBoundary';
import { BugReporterProvider } from '@/contexts/BugReporterContext';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { SRSNotificationPrompt } from '@/components/popups/SRSNotificationPrompt';

const IOS_VIEWPORT_CONTENT =
  'width=device-width, initial-scale=1, viewport-fit=cover';

function ensureNativeIOSViewportCover() {
  if (typeof document === 'undefined') return;

  const viewportMeta = document.querySelector('meta[name="viewport"]');

  if (!viewportMeta) {
    const createdMeta = document.createElement('meta');
    createdMeta.setAttribute('name', 'viewport');
    createdMeta.setAttribute('content', IOS_VIEWPORT_CONTENT);
    document.head.appendChild(createdMeta);
    return;
  }

  const content = viewportMeta.getAttribute('content') || '';

  if (!content.includes('viewport-fit=cover')) {
    viewportMeta.setAttribute('content', `${content}, viewport-fit=cover`);
  }
}

// Detect iPhone model by screen size and set CSS safe area variables.
// This runs on Capacitor iOS where env(safe-area-inset-*) returns 0.
function applyCapacitorSafeArea() {
  if (typeof window === 'undefined') return;

  const h = window.screen.height;
  const w = window.screen.width;
  // Use the larger dimension (handles any orientation)
  const screenH = Math.max(h, w);

  let top = 0;
  let bottom = 0;

  // Dynamic Island phones (iPhone 14 Pro, 15, 15 Pro, 16, 16 Pro, etc.)
  // Screen heights: 852, 932, 874, 956
  if (screenH >= 852) {
    top = 59;
    bottom = 34;
  }
  // Notch phones (iPhone X, XS, XR, 11, 12, 13, 14, etc.)
  // Screen heights: 812, 844, 896, 926
  else if (screenH >= 812) {
    top = 47;
    bottom = 34;
  }
  // Older phones with home button (iPhone SE, 8, etc.)
  // Status bar only, no home indicator
  else {
    top = 20;
    bottom = 0;
  }

  document.documentElement.style.setProperty('--cap-safe-top', `${top}px`);
  document.documentElement.style.setProperty(
    '--cap-safe-bottom',
    `${bottom}px`
  );
  document.documentElement.style.setProperty('--cap-safe-left', '0px');
  document.documentElement.style.setProperty('--cap-safe-right', '0px');
}

// 🔔 Early push notification listener setup (for cold start handling)
// This runs immediately when the module loads on the client
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;

      const { PushNotifications } =
        await import('@capacitor/push-notifications');

      console.log('[Push] Early listener setup for cold start');

      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
          console.log('[Push] Cold start notification action:', notification);

          const route =
            notification.notification?.data?.route ||
            '/learn/academy/sets/fast-review';

          console.log('[Push] Navigating to:', route);
          window.location.href = route;
        }
      );
    } catch (e) {
      console.error('[Push] Early listener setup error:', e);
    }
  })();
}

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

// 🔹 Bridge component that runs inside <UserProvider>
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

// 🔔 Bridge component for push notification permission on native app
function PushNotificationBridge() {
  const { user, isLoading } = useUser();
  const [showPrompt, setShowPrompt] = useState(false);
  const [srsCount, setSrsCount] = useState(0);
  const [isNativePlatform, setIsNativePlatform] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;

    const checkSrsAndPrompt = async () => {
      // Check if already requested
      if (localStorage.getItem('push_permission_requested')) return;

      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        setIsNativePlatform(true);

        // Check if user has SRS-enabled sets
        const response = await fetch('/api/database/v2/sets/srs-count');
        if (!response.ok) return;

        const data = await response.json();
        if (data.success && data.count > 0) {
          setSrsCount(data.count);
          setShowPrompt(true);
        }
      } catch (e) {
        // Not in Capacitor environment or API error
      }
    };

    checkSrsAndPrompt();
  }, [user, isLoading]);

  const handleEnableNotifications = async () => {
    if (!isNativePlatform) return;

    try {
      const { PushNotifications } =
        await import('@capacitor/push-notifications');

      // Request permission
      const result = await PushNotifications.requestPermissions();
      localStorage.setItem('push_permission_requested', 'true');

      if (result.receive === 'granted') {
        // Add listener BEFORE calling register to avoid race condition
        PushNotifications.addListener('registration', async (token) => {
          console.log('Push token received:', token.value);
          try {
            const res = await fetch('/api/push/register-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                deviceToken: token.value,
                platform: 'ios',
              }),
            });
            const data = await res.json();
            console.log('Token registration result:', data);
          } catch (err) {
            console.error('Failed to register token:', err);
          }
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
        });

        await PushNotifications.register();
      }
    } catch (e) {
      console.error('Failed to request push permissions:', e);
    }
  };

  const handleClosePrompt = () => {
    setShowPrompt(false);
    // Mark as requested so we don't show again
    localStorage.setItem('push_permission_requested', 'true');
  };

  return (
    <SRSNotificationPrompt
      isOpen={showPrompt}
      onClose={handleClosePrompt}
      onEnableNotifications={handleEnableNotifications}
      srsSetCount={srsCount}
    />
  );
}

// Fixed bars that cover the notch/Dynamic Island and home indicator areas.
// Content scrolls behind these bars instead of being visible in the safe area.
function CapacitorSafeAreaBars() {
  return (
    <>
      {/* Top bar — covers notch / Dynamic Island */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--cap-safe-top)',
          zIndex: 99999,
          backgroundColor: '#141f25',
          pointerEvents: 'none',
        }}
      />
      {/* Bottom bar — covers home indicator */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'var(--cap-safe-bottom)',
          zIndex: 99999,
          backgroundColor: '#141f25',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

export default function MyApp({ Component, pageProps }) {
  const [isPosthogEnabled, setIsPosthogEnabled] = useState(false);
  const [isCapacitorIOS, setIsCapacitorIOS] = useState(false);

  useEffect(() => {
    const enforceForNativeIOS = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        if (!/iPhone|iPad|iPod/i.test(navigator.userAgent)) return;

        ensureNativeIOSViewportCover();
        applyCapacitorSafeArea();
        setIsCapacitorIOS(true);
      } catch (e) {
        // Ignore if Capacitor is unavailable.
      }
    };

    enforceForNativeIOS();
  }, []);

  useEffect(() => {
    // Only initialize PostHog outside of development
    if (process.env.NEXT_PUBLIC_NODE_ENV !== 'development') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        defaults: '2025-05-24',
        session_recording: {
          maskAllInputs: false, // unmask inputs for language typing visibility
        },
      });
      setIsPosthogEnabled(true);
    } else {
      console.log('🔹 PostHog disabled in development');
    }
  }, []);

  return (
    <UserProvider>
      <PlatformHeartbeatBridge />
      <PushNotificationBridge />
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
            {isCapacitorIOS && <CapacitorSafeAreaBars />}
            {isPosthogEnabled ? (
              <PostHogProvider client={posthog}>
                <PostHogAuthBridge />
                <div
                  className={fredoka.className}
                  style={
                    isCapacitorIOS
                      ? {
                          paddingTop: 'var(--cap-safe-top)',
                          paddingBottom: 'var(--cap-safe-bottom)',
                        }
                      : undefined
                  }
                >
                  <BugReporterErrorBoundary>
                    <Component {...pageProps} />
                  </BugReporterErrorBoundary>
                  <ReportIssueButton />
                  <BugReporter />
                  <Analytics />
                  <SpeedInsights />
                </div>
              </PostHogProvider>
            ) : (
              <div
                className={fredoka.className}
                style={
                  isCapacitorIOS
                    ? {
                        paddingTop: 'var(--cap-safe-top)',
                        paddingBottom: 'var(--cap-safe-bottom)',
                      }
                    : undefined
                }
              >
                <BugReporterErrorBoundary>
                  <Component {...pageProps} />
                </BugReporterErrorBoundary>
                <ReportIssueButton />
                <BugReporter />
                <Analytics />
                <SpeedInsights />
              </div>
            )}
          </BugReporterProvider>
        </PremiumProvider>
      </ThemeProvider>
    </UserProvider>
  );
}
