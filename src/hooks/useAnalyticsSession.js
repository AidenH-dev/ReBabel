import { useRef, useCallback, useEffect } from 'react';
import { clientLog } from '@/lib/clientLogger';

/**
 * Hook for managing analytics session lifecycle.
 *
 * Session end-states (mutually exclusive — ref is nulled on first call):
 *   - finish(items, correct) → marks session as "finished" (normal completion)
 *   - abort()                → marks session as "hung" (user clicked exit mid-session)
 *   - page close / unmount   → marks session as "hung" via sendBeacon (automatic)
 *
 * Rolling updates (for SRS sessions):
 *   - update(items, correct) → finishes or updates a session without ending it locally.
 *     After the first call, the session is "finished" on the server with partial counts.
 *     Subsequent calls upsert the latest counts. If the client crashes after any update,
 *     the server already has the best available data. The final finish() call sends the
 *     complete counts and closes the local session.
 *
 * @param {string} sessionType - One of: 'quiz', 'srs_due_review', 'srs_learn_new',
 *   'srs_fast_review', 'flashcards', 'translate'
 * @returns {{ start, finish, update, abort }}
 */
export default function useAnalyticsSession(sessionType) {
  const sessionIdRef = useRef(null);
  const hasRollingUpdatedRef = useRef(false);

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
        hasRollingUpdatedRef.current = false;
      }
    } catch (err) {
      clientLog.error('analytics_session.start_failed', {
        error: err?.message || String(err),
      });
    }
  }, [sessionType]);

  // Rolling update: finish/update the session on the server without
  // ending it locally. The session ref stays active for further updates.
  const update = useCallback(async (itemsReviewed, itemsCorrect) => {
    if (!sessionIdRef.current) return;
    const id = sessionIdRef.current;
    try {
      await fetch(`/api/analytics/user/sessions/${id}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemsReviewed,
          itemsCorrect,
          rollingUpdate: true,
        }),
      });
      hasRollingUpdatedRef.current = true;
    } catch (err) {
      clientLog.error('analytics_session.update_failed', {
        error: err?.message || String(err),
      });
    }
  }, []);

  // Final finish: send complete counts and null the session ref.
  // Automatically uses rollingUpdate if prior updates were sent.
  const finish = useCallback(async (itemsReviewed, itemsCorrect) => {
    if (!sessionIdRef.current) return;
    const id = sessionIdRef.current;
    sessionIdRef.current = null;
    try {
      await fetch(`/api/analytics/user/sessions/${id}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemsReviewed,
          itemsCorrect,
          rollingUpdate: hasRollingUpdatedRef.current,
        }),
      });
    } catch (err) {
      clientLog.error('analytics_session.finish_failed', {
        error: err?.message || String(err),
      });
    }
  }, []);

  // Mark session as hung via sendBeacon (works during page teardown).
  // If the session was already finished by a rolling update, the server
  // will reject this — which is the desired behavior.
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

  return { start, finish, update, abort, sessionIdRef };
}
