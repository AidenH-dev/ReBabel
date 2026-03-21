/**
 * API route middleware that adds structured logging to every request.
 *
 * Usage:
 *   // Authenticated route:
 *   export default withApiAuthRequired(withLogger(async (req, res) => {
 *     req.log.info('doing.something', { data: 123 });
 *   }));
 *
 *   // Public route:
 *   export default withLogger(async (req, res) => { ... });
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createLogger } from './logger';
import type { Logger } from './logger';

export interface LoggedRequest extends NextApiRequest {
  log: Logger;
  requestId: string;
}

type LoggedHandler = (
  req: LoggedRequest,
  res: NextApiResponse
) => Promise<void> | void;

const SLOW_THRESHOLD_MS = 3000;

export function withLogger(handler: LoggedHandler) {
  return async function loggedHandler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    const requestId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const startTime = performance.now();
    const route = req.url?.split('?')[0] || 'unknown';

    const reqLog = createLogger({
      requestId,
      method: req.method,
      route,
    });

    // Attach to request object
    const logged = req as LoggedRequest;
    logged.log = reqLog;
    logged.requestId = requestId;

    // Set response header for client correlation
    res.setHeader('x-request-id', requestId);

    reqLog.info('request.start');

    // Patch res.end to capture response metrics (fire once)
    let ended = false;
    const originalEnd = res.end;
    (res as any).end = function patchedEnd(this: any, ...args: any[]) {
      if (!ended) {
        ended = true;
        const durationMs = Math.round(performance.now() - startTime);
        const status = res.statusCode;

        const meta: Record<string, unknown> = { status, durationMs };

        if (durationMs > SLOW_THRESHOLD_MS) {
          meta.slow = true;
          reqLog.warn('request.slow', meta);
        }

        if (status >= 500) {
          reqLog.error('request.end', meta);
        } else if (status >= 400) {
          reqLog.warn('request.end', meta);
        } else {
          reqLog.info('request.end', meta);
        }
      }
      return originalEnd.apply(this, args as any);
    };

    try {
      await handler(logged, res);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));

      reqLog.error('unhandled_error', {
        error: error.message,
        stack: error.stack,
      });

      if (!res.writableEnded) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}
