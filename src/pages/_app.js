import "@/styles/globals.css";
import { Fredoka } from "@next/font/google";
import { UserProvider, useUser } from "@auth0/nextjs-auth0/client";
import ReportIssueButton from '@/components/report-issue';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

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

export default function MyApp({ Component, pageProps }) {

  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      defaults: '2025-05-24',
      session_recording: {
        maskAllInputs: false, // unmask inputs for language typing visibility
      },
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.debug();
      },
    });
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <UserProvider>
        {/* Identify Auth0 user with PostHog AFTER provider is mounted */}
        <PostHogAuthBridge />
        <div className={fredoka.className}>
          <Component {...pageProps} />
          <ReportIssueButton />
          <Analytics />
          <SpeedInsights />
        </div>
      </UserProvider>
    </PostHogProvider>
  );
}
