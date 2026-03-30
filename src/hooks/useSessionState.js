import { useState, useRef, useMemo, useEffect, useCallback } from 'react';

/**
 * useSessionState — Session persistence hook (Issues #106, #107)
 *
 * Coordinates session creation, debounced auto-save, resume, abandon,
 * and chunk management. Wraps around existing study hooks without
 * replacing them.
 *
 * IMPORTANT: create() expects items already in [{ itemId: string }] format.
 * The page is responsible for mapping its item shapes before calling create.
 */
export default function useSessionState() {
  const [activeSession, setActiveSession] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const entityIdRef = useRef(null);
  const activeSessionRef = useRef(null);
  const saveTimerRef = useRef(null);
  const pendingSaveRef = useRef(null);

  // Keep ref in sync with state (for closures in advanceChunk, etc.)
  activeSessionRef.current = activeSession;

  // ── Internal: flush accumulated save ──────────────────────────

  const flushSave = useCallback(async () => {
    if (!entityIdRef.current || !pendingSaveRef.current) return;
    const payload = pendingSaveRef.current;

    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/analytics/user/session-state/${entityIdRef.current}/save`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        // Only clear the buffer after a successful save.
        // On failure, the data stays in the buffer for the next flush to retry.
        pendingSaveRef.current = null;
      } else {
        console.error('Session state save returned', res.status);
      }
    } catch (e) {
      console.error('Session state save failed:', e);
    }
    setIsSaving(false);
  }, []);

  // ── Check for active session on mount ─────────────────────────

  const checkForActive = useCallback(async (sessionType, sourceSetId) => {
    setIsChecking(true);
    try {
      const params = new URLSearchParams();
      if (sessionType) params.set('sessionType', sessionType);
      if (sourceSetId) params.set('setId', sourceSetId);
      const qs = params.toString();

      const res = await fetch(
        `/api/analytics/user/session-state/active${qs ? `?${qs}` : ''}`
      );
      const json = await res.json();

      if (json.active) {
        setActiveSession(json.state);
        entityIdRef.current = json.state.entity_id;
        setIsChecking(false);
        return json.state;
      }
    } catch (e) {
      console.error('Check active session failed:', e);
    }
    setIsChecking(false);
    return null;
  }, []);

  // ── Create new session state ──────────────────────────────────

  const create = useCallback(
    async (sessionType, sourceSetId, items, config, chunkSize) => {
      setIsCreating(true);
      try {
        const res = await fetch('/api/analytics/user/session-state/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionType,
            sourceSetId: sourceSetId || null,
            items,
            config: config || null,
            ...(chunkSize ? { chunkSize } : {}),
          }),
        });
        const json = await res.json();
        setIsCreating(false);

        if (json.success) {
          entityIdRef.current = json.entityId;
          // If session already existed, don't overwrite activeSession (checkForActive already set the full state)
          if (!json.existing) {
            const now = new Date().toISOString();
            setActiveSession({
              entity_id: json.entityId,
              session_type: sessionType,
              state_status: 'active',
              is_chunked: String(json.isChunked),
              total_chunks: String(json.totalChunks),
              total_items: String(items.length),
              chunk_size: String(chunkSize || 25),
              current_chunk_index: '0',
              chunks_completed: '0',
              current_index: '0',
              items_completed: '0',
              stats_correct: '0',
              stats_incorrect: '0',
              stats_attempts: '0',
              created_at: now,
              updated_at: now,
            });
          }
          return json;
        }
        throw new Error(json.error || 'Failed to create session state');
      } catch (e) {
        setIsCreating(false);
        throw e;
      }
    },
    []
  );

  // ── Debounced save (fire-and-forget) ──────────────────────────

  const save = useCallback(
    (progress, completedItems) => {
      if (!entityIdRef.current) return;

      // Accumulate: progress overwrites (latest wins), completedItems appends
      pendingSaveRef.current = {
        ...(pendingSaveRef.current || {}),
        ...progress,
        completedItems: [
          ...(pendingSaveRef.current?.completedItems || []),
          ...(completedItems || []),
        ],
      };

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        flushSave();
      }, 2000);
    },
    [flushSave]
  );

  // ── Immediate save (awaitable) ────────────────────────────────

  const saveNow = useCallback(
    async (progress, completedItems) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      // Merge with any pending accumulated data
      pendingSaveRef.current = {
        ...(pendingSaveRef.current || {}),
        ...progress,
        completedItems: [
          ...(pendingSaveRef.current?.completedItems || []),
          ...(completedItems || []),
        ],
      };

      return flushSave();
    },
    [flushSave]
  );

  // ── Abandon session ───────────────────────────────────────────

  const abandon = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    pendingSaveRef.current = null;

    if (!entityIdRef.current) return;
    try {
      await fetch(
        `/api/analytics/user/session-state/${entityIdRef.current}/abandon`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      console.error('Abandon session failed:', e);
    }
    entityIdRef.current = null;
    setActiveSession(null);
  }, []);

  // ── Fetch full state for resume ───────────────────────────────

  const fetchFullState = useCallback(async () => {
    if (!entityIdRef.current) return null;
    try {
      const res = await fetch(
        `/api/analytics/user/session-state/${entityIdRef.current}`
      );
      const json = await res.json();
      if (json.success) return json;
    } catch (e) {
      console.error('Fetch session state failed:', e);
    }
    return null;
  }, []);

  // ── Advance to next chunk ─────────────────────────────────────

  const advanceChunk = useCallback(
    async (analyticsSessionId) => {
      const session = activeSessionRef.current;
      if (!session) return;

      const newChunkIndex = (parseInt(session.current_chunk_index) || 0) + 1;
      const newChunksCompleted = (parseInt(session.chunks_completed) || 0) + 1;

      // Reset completed phases explicitly -- sending {} writes nothing to the KVS,
      // leaving stale completed_phase.* from the previous chunk. Must send 'false'
      // to overwrite them.
      await saveNow({
        currentChunkIndex: newChunkIndex,
        chunksCompleted: newChunksCompleted,
        analyticsSessionId,
        currentIndex: 0,
        completedPhases: {
          review: false,
          'multiple-choice': false,
          translation: false,
        },
      });

      setActiveSession((prev) => {
        // Remove stale completed_phase.* keys from local state
        const cleaned = { ...prev };
        Object.keys(cleaned).forEach((k) => {
          if (k.startsWith('completed_phase.')) delete cleaned[k];
        });
        return {
          ...cleaned,
          current_chunk_index: String(newChunkIndex),
          chunks_completed: String(newChunksCompleted),
          analytics_session_id: analyticsSessionId,
          current_index: '0',
        };
      });
    },
    [saveNow]
  );

  // ── Chunk info (computed) ─────────────────────────────────────

  const chunkInfo = useMemo(() => {
    if (!activeSession) return null;
    const isChunked = activeSession.is_chunked === 'true';
    const totalItems = parseInt(activeSession.total_items) || 0;
    if (!isChunked) {
      return {
        isChunked: false,
        chunkSize: totalItems,
        totalChunks: 1,
        currentChunkIndex: 0,
        totalItems,
      };
    }
    return {
      isChunked: true,
      chunkSize: parseInt(activeSession.chunk_size) || 25,
      totalChunks: parseInt(activeSession.total_chunks) || 1,
      currentChunkIndex: parseInt(activeSession.current_chunk_index) || 0,
      totalItems,
    };
  }, [activeSession]);

  // ── Cleanup: flush pending save on unmount ────────────────────

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      // Flush any pending save via sendBeacon (SPA navigation)
      if (pendingSaveRef.current && entityIdRef.current) {
        const url = `/api/analytics/user/session-state/${entityIdRef.current}/save`;
        const body = JSON.stringify(pendingSaveRef.current);
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            url,
            new Blob([body], { type: 'application/json' })
          );
        } else {
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
          }).catch(() => {});
        }
        pendingSaveRef.current = null;
      }
    };
  }, []);

  return {
    activeSession,
    isChecking,
    isCreating,
    isSaving,
    checkForActive,
    create,
    save,
    saveNow,
    abandon,
    fetchFullState,
    chunkInfo,
    advanceChunk,
  };
}
