import { useEffect, useRef } from 'react';

const MAX_ENTRIES = 20;
const ERROR_BODY_LIMIT = 500;
const ERROR_BODY_TIMEOUT = 1000;

export function useFetchLogger() {
  const logsRef = useRef([]);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
      const [input, init] = args;
      const url =
        typeof input === 'string' ? input : input?.url || String(input);

      // Skip circular logging
      if (url.includes('/api/bug-reporter/')) {
        return originalFetch.apply(this, args);
      }

      const method = init?.method || 'GET';
      const start = Date.now();
      const entry = {
        method,
        url,
        status: null,
        durationMs: null,
        error: null,
        bodyPreview: null,
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await originalFetch.apply(this, args);
        entry.status = response.status;
        entry.durationMs = Date.now() - start;

        if (response.status >= 400) {
          try {
            const cloned = response.clone();
            const text = await Promise.race([
              cloned.text(),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error('timeout')),
                  ERROR_BODY_TIMEOUT
                )
              ),
            ]);
            entry.bodyPreview = text.slice(0, ERROR_BODY_LIMIT);
          } catch {
            // Best-effort; ignore failures to read error body
          }
        }

        logsRef.current = [...logsRef.current, entry].slice(-MAX_ENTRIES);
        return response;
      } catch (err) {
        entry.durationMs = Date.now() - start;
        entry.error = err.message || String(err);
        logsRef.current = [...logsRef.current, entry].slice(-MAX_ENTRIES);
        throw err;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return logsRef;
}
