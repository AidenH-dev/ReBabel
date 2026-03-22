/**
 * Action error feedback — shown after a user-initiated action fails.
 * Auto-dismisses after a configurable timeout, or can be manually dismissed.
 *
 * Usage:
 *   <ActionError message={error} onDismiss={() => setError(null)} />
 *   <ActionError message={error} autoDismiss={5000} onDismiss={() => setError(null)} />
 */
import { useEffect } from 'react';

export default function ActionError({
  message,
  onDismiss,
  autoDismiss = 0,
  className = '',
}) {
  useEffect(() => {
    if (!message || !autoDismiss || !onDismiss) return;
    const timer = setTimeout(onDismiss, autoDismiss);
    return () => clearTimeout(timer);
  }, [message, autoDismiss, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-red-700 dark:text-red-400">{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300"
            aria-label="Dismiss"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
