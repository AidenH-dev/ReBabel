/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window per key (typically IP address).
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 30 });
 *   // In handler:
 *   if (!limiter.check(ip)) return res.status(429).json({ error: 'Too many requests' });
 */

const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 30;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // clean stale entries every 5 min

export function createRateLimiter({
  windowMs = DEFAULT_WINDOW_MS,
  maxRequests = DEFAULT_MAX_REQUESTS,
} = {}) {
  const hits = new Map(); // key -> { count, resetAt }

  // Periodically clean up expired entries to prevent memory leaks
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now > entry.resetAt) {
        hits.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Don't block process exit
  if (cleanupTimer.unref) cleanupTimer.unref();

  return {
    /**
     * Check if the key is within rate limits.
     * Returns true if allowed, false if rate limited.
     */
    check(key) {
      const now = Date.now();
      const entry = hits.get(key);

      if (!entry || now > entry.resetAt) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }

      entry.count += 1;
      return entry.count <= maxRequests;
    },
  };
}
