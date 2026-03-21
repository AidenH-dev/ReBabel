/**
 * Structured logger for server-side use.
 * Production: single-line JSON to stdout (Vercel ingests and indexes).
 * Development: human-readable colored output.
 *
 * Usage:
 *   import { log } from '@/lib/logger';
 *   log.info('user.created', { userId: 'usr_123' });
 *   const child = log.child({ requestId: 'req_abc' });
 *   child.error('rpc.failed', { fn: 'create_set', error: err.message });
 */

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 } as const;
type LogLevel = keyof typeof LEVELS;

const ENV_LEVEL: LogLevel =
  (process.env.LOG_LEVEL?.toUpperCase() as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG');

const REDACT_KEYS = new Set([
  'token',
  'api_key',
  'apiKey',
  'key',
  'secret',
  'password',
  'authorization',
  'stripe_secret_key',
  'webhook_secret',
  'apns_key',
  'auth0_secret',
  'device_token',
  'credit_card',
  'card_number',
  'cvv',
  'ssn',
]);

const REDACT_PATTERNS = [
  /^sk_/,      // Stripe secret keys
  /^whsec_/,   // Stripe webhook secrets
  /^Bearer /,  // Auth tokens
];

function shouldRedactValue(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  return REDACT_PATTERNS.some((p) => p.test(val));
}

function redact(meta: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (REDACT_KEYS.has(k.toLowerCase())) {
      cleaned[k] = '[REDACTED]';
    } else if (shouldRedactValue(v)) {
      cleaned[k] = '[REDACTED]';
    } else if (v instanceof Error) {
      cleaned[k] = { message: v.message, stack: v.stack };
    } else {
      cleaned[k] = v;
    }
  }
  return cleaned;
}

const isProd = process.env.NODE_ENV === 'production';

const COLORS: Record<LogLevel, string> = {
  DEBUG: '\x1b[90m',  // gray
  INFO: '\x1b[36m',   // cyan
  WARN: '\x1b[33m',   // yellow
  ERROR: '\x1b[31m',  // red
};
const RESET = '\x1b[0m';

function emit(level: LogLevel, msg: string, meta: Record<string, unknown>) {
  if (LEVELS[level] < LEVELS[ENV_LEVEL]) return;

  const cleaned = redact(meta);

  if (isProd) {
    const entry = { level, msg, ts: new Date().toISOString(), ...cleaned };
    // All levels use console.log for JSON — the level field distinguishes severity.
    // This avoids Vercel double-decorating console.error lines.
    console.log(JSON.stringify(entry));
  } else {
    const color = COLORS[level];
    const metaStr = Object.keys(cleaned).length
      ? ' ' + JSON.stringify(cleaned, null, 2)
      : '';
    console.log(`${color}[${level}]${RESET} ${msg}${metaStr}`);
  }
}

export interface Logger {
  debug(msg: string, meta?: Record<string, unknown>): void;
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
  child(defaultMeta: Record<string, unknown>): Logger;
}

export function createLogger(
  defaultMeta: Record<string, unknown> = {}
): Logger {
  return {
    debug: (msg, meta = {}) => emit('DEBUG', msg, { ...defaultMeta, ...meta }),
    info: (msg, meta = {}) => emit('INFO', msg, { ...defaultMeta, ...meta }),
    warn: (msg, meta = {}) => emit('WARN', msg, { ...defaultMeta, ...meta }),
    error: (msg, meta = {}) => emit('ERROR', msg, { ...defaultMeta, ...meta }),
    child: (childMeta) => createLogger({ ...defaultMeta, ...childMeta }),
  };
}

export const log = createLogger();
