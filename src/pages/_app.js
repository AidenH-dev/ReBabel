import "@/styles/globals.css";
import { Fredoka } from "@next/font/google";
import { UserProvider, useUser } from "@auth0/nextjs-auth0/client";
import { PremiumProvider } from '@/contexts/PremiumContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ReportIssueButton from '@/components/report-issue';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import Script from 'next/script';

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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

// 🔔 Bridge component for push notification permission on native app
function PushNotificationBridge() {
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading || !user) return;

    const initPushNotifications = async () => {
      // Check if already requested
      if (localStorage.getItem('push_permission_requested')) return;

      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { PushNotifications } = await import('@capacitor/push-notifications');

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
                body: JSON.stringify({ deviceToken: token.value, platform: 'ios' }),
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
        // Not in Capacitor environment
      }
    };

    initPushNotifications();
  }, [user, isLoading]);

  return null;
}

export default function MyApp({ Component, pageProps }) {
  const [isPosthogEnabled, setIsPosthogEnabled] = useState(false);

  useEffect(() => {
    // Only initialize PostHog outside of development
    if (process.env.NEXT_PUBLIC_NODE_ENV !== 'development') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        defaults: '2025-05-24',
        session_recording: {
          maskAllInputs: false, // unmask inputs for language typing visibility
        },
      });
      setIsPosthogEnabled(true);
    } else {
      console.log("🔹 PostHog disabled in development");
    }
  }, []);

  return (
    <UserProvider>
      <PushNotificationBridge />
      <ThemeProvider>
      <PremiumProvider>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-VRBTF7S087" />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-VRBTF7S087');
          `}
        </Script>
        {isPosthogEnabled ? (
          <PostHogProvider client={posthog}>
            <PostHogAuthBridge />
            <div className={fredoka.className}>
              <Component {...pageProps} />
              <ReportIssueButton />
              <Analytics />
              <SpeedInsights />
            </div>
          </PostHogProvider>
        ) : (
          <div className={fredoka.className}>
            <Component {...pageProps} />
            <ReportIssueButton />
            <Analytics />
            <SpeedInsights />
          </div>
        )}
      </PremiumProvider>
      </ThemeProvider>
    </UserProvider>
  );
}
