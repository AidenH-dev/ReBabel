import { useRef, useCallback } from 'react';

/**
 * Hook for managing analytics session lifecycle (start + finish).
 *
 * @param {string} sessionType - One of: 'quiz', 'srs_due_review', 'srs_learn_new',
 *   'srs_fast_review', 'flashcards', 'translate'
 * @returns {{ start, finish, reset, sessionIdRef }}
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

  const reset = useCallback(() => {
    sessionIdRef.current = null;
  }, []);

  return { start, finish, reset, sessionIdRef };
}
