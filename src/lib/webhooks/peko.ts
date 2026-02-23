/**
 * Peko Webhook Utility
 * Fire-and-forget notifications to OpenClaw gateway for monitoring
 */

// Types
export type PekoEventType =
  | 'error'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'subscription.payment_failed'
  | 'bug_report';

export interface PekoEvent {
  type: PekoEventType;
  summary: string;
  details?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: string;
}

export interface ErrorContext {
  context?: string;
  endpoint?: string;
  userId?: string;
}

export interface SubscriptionData {
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId: string;
  status: string;
  priceId?: string;
  eventId?: string;
}

export interface BugReportData {
  reportId: string;
  userId: string;
  userEmail: string;
  location?: string;
  feature?: string;
  description?: string;
}

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

function formatMessage(event: PekoEvent): string {
  const ts = event.timestamp || new Date().toISOString();
  const severity = event.severity || 'low';

  let msg = `[ReBabel Event]\nType: ${event.type}\nSeverity: ${severity}\nTime: ${ts}\nSummary: ${event.summary}`;

  if (event.details && Object.keys(event.details).length > 0) {
    msg += `\nDetails: ${JSON.stringify(event.details, null, 2)}`;
  }

  msg += `\n\nReview this event and notify Aiden with a concise update on Discord. If it's an error, include what likely went wrong and if it needs immediate attention.`;

  return msg;
}

/**
 * Core notification function - fire and forget
 */
export function notifyPeko(event: PekoEvent): void {
  const url = process.env.PEKO_WEBHOOK_URL;
  const token = process.env.PEKO_WEBHOOK_TOKEN;

  if (!url || !token) {
    console.warn('[Peko] Webhook not configured, skipping notification');
    return;
  }

  const message = formatMessage(event);

  // Fire and forget - don't await, don't let failures propagate
  fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      name: `ReBabel:${event.type}`,
      deliver: true,
      channel: 'discord',
    }),
  })
    .then((res) => {
      if (!res.ok) {
        console.error(`[Peko] Webhook failed: ${res.status}`);
      }
    })
    .catch((err) => {
      console.error('[Peko] Webhook error:', err);
    });
}

/**
 * Report an error with rate limiting
 */
export function notifyError(error: Error, context?: ErrorContext): void {
  const signature = getErrorSignature(error);

  if (isRateLimited(signature)) {
    return;
  }

  notifyPeko({
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
export function notifySubscription(
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
    created: `New subscription: ${data.stripeSubscriptionId}`,
    updated: `Subscription updated: ${data.stripeSubscriptionId}`,
    canceled: `Subscription canceled: ${data.stripeSubscriptionId}`,
    payment_failed: `Payment failed for subscription: ${data.stripeSubscriptionId}`,
  };

  notifyPeko({
    type: eventType,
    severity: severityMap[type],
    summary: summaryMap[type],
    details: {
      userId: data.userId,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      status: data.status,
      priceId: data.priceId,
      eventId: data.eventId,
    },
  });
}

/**
 * Report user-submitted bug reports
 */
export function notifyBugReport(data: BugReportData): void {
  const summary = data.feature
    ? `${data.location || 'Unknown location'} - ${data.feature}`
    : 'No details provided';

  // Build a more detailed message for bug reports
  let detailedSummary = `Bug report from ${data.userEmail}\n\nLocation: ${data.location || 'Not specified'}\nFeature: ${data.feature || 'Not specified'}`;

  if (data.description) {
    detailedSummary += `\n\nDescription:\n${data.description}`;
  }

  notifyPeko({
    type: 'bug_report',
    severity: 'medium',
    summary: detailedSummary,
    details: {
      reportId: data.reportId,
      userId: data.userId,
      userEmail: data.userEmail,
      location: data.location,
      feature: data.feature,
      description: data.description,
    },
  });
}
