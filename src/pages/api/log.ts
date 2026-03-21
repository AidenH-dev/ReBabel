/**
 * Ingest endpoint for client-side logs.
 * Receives batched log entries from clientLogger.ts and writes them
 * to stdout as structured JSON via the server-side logger.
 *
 * No auth required — must work for unauthenticated pages too.
 * Rate-limited to prevent abuse.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { log } from '@/lib/logger';
import { createRateLimiter } from '@/lib/rateLimit';

const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 30 });

const MAX_BODY_SIZE = 10_000; // 10KB max payload
const MAX_ENTRIES = 20; // max log entries per request
const VALID_LEVELS = new Set(['INFO', 'WARN', 'ERROR']);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit by IP
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown';

  if (!limiter.check(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Validate payload size
  const raw = JSON.stringify(req.body);
  if (raw.length > MAX_BODY_SIZE) {
    return res.status(413).json({ error: 'Payload too large' });
  }

  const { logs } = req.body || {};
  if (!Array.isArray(logs) || logs.length === 0) {
    return res.status(400).json({ error: 'Invalid payload: expected { logs: [...] }' });
  }

  const entries = logs.slice(0, MAX_ENTRIES);

  for (const entry of entries) {
    const { level, msg, meta } = entry || {};

    if (!VALID_LEVELS.has(level) || typeof msg !== 'string') continue;

    const logMeta = {
      source: 'client',
      ...(typeof meta === 'object' && meta !== null ? meta : {}),
    };

    switch (level) {
      case 'ERROR':
        log.error(msg, logMeta);
        break;
      case 'WARN':
        log.warn(msg, logMeta);
        break;
      case 'INFO':
        log.info(msg, logMeta);
        break;
    }
  }

  return res.status(200).json({ ok: true });
}
