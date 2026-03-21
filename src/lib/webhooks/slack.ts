/**
 * Slack Webhook Utility
 * Fire-and-forget notifications to Slack for monitoring
 */

import { log } from '@/lib/logger';
import type {
  PekoEventType,
  PekoEvent,
  SubscriptionData,
  BugReportData,
  ErrorContext,
} from './peko';

// Rate limiting for errors (10 per minute per unique signature)
const errorCounts = new Map<string, { count: number; resetAt: number }>();
const ERROR_LIMIT = 10;
const ERROR_WINDOW_MS = 60000;

function isRateLimited(signature: string): boolean {
  const now = Date.now();
  const entry = errorCounts.get(signature);

  if (!entry || entry.resetAt < now) {
    errorCounts.set(signature, { count: 1, resetAt: now + ERROR_WINDOW_MS });
    return false;
  }

  if (entry.count >= ERROR_LIMIT) {
    return true;
  }

  entry.count++;
  return false;
}

function getErrorSignature(error: Error): string {
  const firstStackLine = error.stack?.split('\n')[1] || '';
  return `${error.message}:${firstStackLine}`.substring(0, 200);
}

const severityEmoji: Record<string, string> = {
  low: '📋',
  medium: '⚠️',
  high: '🚨',
  critical: '🔥',
};

function formatSlackMessage(event: PekoEvent): object {
  const severity = event.severity || 'low';
  const emoji = severityEmoji[severity] || '📋';
  const ts = event.timestamp || new Date().toISOString();

  const blocks: object[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${event.type}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${event.summary}*`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `*Severity:* ${severity} | *Time:* ${ts}`,
        },
      ],
    },
  ];

  if (event.details && Object.keys(event.details).length > 0) {
    const detailLines = Object.entries(event.details)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `*${k}:* ${typeof v === 'string' && v.includes('\n') ? `\n\`\`\`${v}\`\`\`` : v}`)
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: detailLines,
      },
    });
  }

  return { blocks };
}

/**
 * Core Slack notification — fire and forget
 */
export function notifySlack(event: PekoEvent): void {
  const url = process.env.SLACK_WEBHOOK_URL;

  if (!url) {
    log.warn('slack.not_configured');
    return;
  }

  const payload = formatSlackMessage(event);

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (!res.ok) {
        log.error('slack.webhook_failed', { status: res.status });
      }
    })
    .catch((err) => {
      log.error('slack.webhook_error', { error: err.message });
    });
}

/**
 * Report an error with rate limiting
 */
export function notifySlackError(error: Error, context?: ErrorContext): void {
  const signature = getErrorSignature(error);

  if (isRateLimited(signature)) {
    log.debug('slack.rate_limited', { signature });
    return;
  }

  notifySlack({
    type: 'error',
    severity: 'high',
    summary: error.message,
    details: {
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      ...context,
    },
  });
}

/**
 * Report subscription events
 */
export function notifySlackSubscription(
  type: 'created' | 'updated' | 'canceled' | 'payment_failed',
  data: SubscriptionData
): void {
  const eventType = `subscription.${type}` as PekoEventType;

  const severityMap: Record<string, 'low' | 'medium' | 'high'> = {
    created: 'medium',
    updated: 'low',
    canceled: 'medium',
    payment_failed: 'high',
  };

  const summaryMap: Record<string, string> = {
    created: `New subscription: ${data.userId}`,
    updated: `Subscription updated: ${data.stripeSubscriptionId}`,
    canceled: `Subscription canceled: ${data.userId}`,
    payment_failed: `Payment failed: ${data.userId}`,
  };

  notifySlack({
    type: eventType,
    severity: severityMap[type],
    summary: summaryMap[type],
    details: {
      userId: data.userId,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      status: data.status,
      priceId: data.priceId,
    },
  });
}

/**
 * Report new user sign-ups
 */
export function notifySlackSignup(user: {
  userId: string;
  email?: string;
  name?: string;
}): void {
  notifySlack({
    type: 'user.signup' as PekoEventType,
    severity: 'medium',
    summary: `New sign-up: ${user.email || user.userId}`,
    details: {
      userId: user.userId,
      email: user.email,
      name: user.name,
    },
  });
}

/**
 * Report user-submitted bug reports
 */
export function notifySlackBugReport(data: BugReportData): void {
  let summary = `Bug report from ${data.userEmail}`;
  if (data.feature) summary += ` — ${data.feature}`;

  notifySlack({
    type: 'bug_report',
    severity: 'medium',
    summary,
    details: {
      reportId: data.reportId,
      location: data.location,
      feature: data.feature,
      description: data.description,
    },
  });
}
