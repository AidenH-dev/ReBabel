import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';
import { clientLog } from '@/lib/clientLogger';

const IOS_VIEWPORT_CONTENT =
  'width=device-width, initial-scale=1, viewport-fit=cover';

// Detect iPhone model by screen size and set --cap-safe-top CSS variable.
// Capacitor's webview returns 0 for env(safe-area-inset-*), so we detect manually.
function applyCapacitorSafeArea() {
  if (typeof window === 'undefined') return;
  const screenH = Math.max(window.screen.height, window.screen.width);
  let top = 20;
  if (screenH >= 852)
    top = 40; // Dynamic Island (iPhone 14 Pro, 15, 16, etc.)
  else if (screenH >= 812) top = 28; // Notch (iPhone X, 11, 12, 13, 14, etc.)
  document.documentElement.style.setProperty('--cap-safe-top', `${top}px`);
}

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

async function hideSplashScreen() {
  try {
    const { SplashScreen } = await import(
      /* webpackIgnore: true */ '@capacitor/splash-screen'
    );
    await SplashScreen.hide();
  } catch {
    // Not running in Capacitor, or plugin not available — expected on web
  }
}

/**
 * Consolidated Capacitor initialization hook.
 *
 * Runs a single sequential async flow:
 *  1. Safe area detection (native iOS only)
 *  2. PostHog init (all envs except dev)
 *  3. Splash screen dismiss (only after 1-2 complete)
 */
export default function useCapacitorInit() {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      // 1. Capacitor safe area (native iOS only)
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (
          Capacitor.isNativePlatform() &&
          /iPhone|iPad|iPod/i.test(navigator.userAgent)
        ) {
          ensureNativeIOSViewportCover();
          applyCapacitorSafeArea();
        }
      } catch {
        clientLog.warn('capacitor.not_available');
      }

      // 2. PostHog init (all environments except dev)
      if (process.env.NEXT_PUBLIC_NODE_ENV !== 'development') {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
          api_host:
            process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
          person_profiles: 'identified_only',
          defaults: '2025-05-24',
          session_recording: {
            maskAllInputs: false,
          },
        });
      }

      // 3. Hide splash screen now that init is complete
      await hideSplashScreen();
    })();

    // Safety: if primary hide fails, force dismiss after 5s
    const safetyTimeout = setTimeout(hideSplashScreen, 5000);
    return () => clearTimeout(safetyTimeout);
  }, []);
}
