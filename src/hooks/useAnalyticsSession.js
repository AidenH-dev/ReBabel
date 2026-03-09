import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook for managing analytics session lifecycle.
 *
 * Session states:
 *   - finish(items, correct) → marks session as "finished" (normal completion)
 *   - abort()                → marks session as "hung" (user clicked exit mid-session)
 *   - tab close / navigate   → marks session as "hung" via sendBeacon (automatic)
 *
 * @param {string} sessionType - One of: 'quiz', 'srs_due_review', 'srs_learn_new',
 *   'srs_fast_review', 'flashcards', 'translate'
 * @returns {{ start, finish, abort }}
 */
export default function useAnalyticsSession(sessionType) {
  const sessionIdRef = useRef(null);

  const start = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/user/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionType }),
      });
      const data = await res.json();
      if (data.success) {
        sessionIdRef.current = data.entity_id;
      }
    } catch (err) {
      console.error('Failed to start analytics session:', err);
    }
  }, [sessionType]);

  const finish = useCallback(async (itemsReviewed, itemsCorrect) => {
    if (!sessionIdRef.current) return;
    const id = sessionIdRef.current;
    sessionIdRef.current = null;
    try {
      await fetch(`/api/analytics/user/sessions/${id}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemsReviewed, itemsCorrect }),
      });
    } catch (err) {
      console.error('Failed to finish analytics session:', err);
    }
  }, []);

  // Mark session as hung (intentional exit or tab close)
  const markHung = useCallback((id) => {
    if (!id) return;
    // Use sendBeacon for reliability on tab close; falls back to fetch
    const url = `/api/analytics/user/sessions/${id}/hung`;
    const body = JSON.stringify({});
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  }, []);

  // Intentional exit — user clicked an exit/back button mid-session
  const abort = useCallback(() => {
    if (!sessionIdRef.current) return;
    const id = sessionIdRef.current;
    sessionIdRef.current = null;
    markHung(id);
  }, [markHung]);

  // Automatic cleanup on tab close or page hide
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sessionIdRef.current) {
        markHung(sessionIdRef.current);
        sessionIdRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Component unmount — mark hung if session still active
      if (sessionIdRef.current) {
        markHung(sessionIdRef.current);
        sessionIdRef.current = null;
      }
    };
  }, [markHung]);

  return { start, finish, abort };
}
