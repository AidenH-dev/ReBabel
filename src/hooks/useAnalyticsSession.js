import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook for managing analytics session lifecycle.
 *
 * Session end-states (mutually exclusive — ref is nulled on first call):
 *   - finish(items, correct) → marks session as "finished" (normal completion)
 *   - abort()                → marks session as "hung" (user clicked exit mid-session)
 *   - page close / unmount   → marks session as "hung" via sendBeacon (automatic)
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

  // Mark session as hung via sendBeacon (works during page teardown)
  const markHung = useCallback((id) => {
    if (!id) return;
    const url = `/api/analytics/user/sessions/${id}/hung`;
    const body = new Blob([JSON.stringify({})], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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

  // Automatic cleanup: beforeunload (tab/window close) + component unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        markHung(sessionIdRef.current);
        sessionIdRef.current = null;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Component unmount (SPA navigation) — mark hung if session still active
      if (sessionIdRef.current) {
        markHung(sessionIdRef.current);
        sessionIdRef.current = null;
      }
    };
  }, [markHung]);

  return { start, finish, abort, sessionIdRef };
}
