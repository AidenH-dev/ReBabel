/**
 * Client-side logger that sends structured logs to /api/log.
 * Fire-and-forget — never blocks UI. Batches logs within 100ms.
 *
 * Usage:
 *   import { clientLog } from '@/lib/clientLogger';
 *   clientLog.error('page.data_fetch_failed', { endpoint: '/api/sets', error: err.message });
 *   clientLog.warn('capacitor.not_available');
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  level: LogLevel;
  msg: string;
  meta: Record<string, unknown>;
}

let batch: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function getClientContext(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  return {
    url: window.location.href,
    route: window.location.pathname,
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
}

function flush() {
  if (batch.length === 0) return;

  const entries = batch;
  batch = [];
  flushTimer = null;

  const payload = JSON.stringify({ logs: entries });

  // Prefer sendBeacon (works during page teardown), fall back to fetch
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const sent = navigator.sendBeacon(
      '/api/log',
      new Blob([payload], { type: 'application/json' })
    );
    if (!sent) {
      fetchFallback(payload);
    }
  } else {
    fetchFallback(payload);
  }
}

function fetchFallback(payload: string) {
  try {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Swallow — logging must never crash the app
  }
}

function enqueue(level: LogLevel, msg: string, meta: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return; // SSR guard

  const entry: LogEntry = {
    level,
    msg,
    meta: {
      ...getClientContext(),
      ...meta,
      clientTs: new Date().toISOString(),
    },
  };

  batch.push(entry);

  // Batch within 100ms to reduce HTTP requests
  if (!flushTimer) {
    flushTimer = setTimeout(flush, 100);
  }
}

export const clientLog = {
  info: (msg: string, meta?: Record<string, unknown>) => enqueue('INFO', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => enqueue('WARN', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => enqueue('ERROR', msg, meta),
};
