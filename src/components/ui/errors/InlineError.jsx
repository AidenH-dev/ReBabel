/**
 * Inline error banner — sits within a page section without taking over.
 * Used when a data fetch fails but the rest of the page still works.
 *
 * Usage:
 *   <InlineError message="Failed to load sets" onRetry={() => fetchSets()} />
 *   <InlineError message={error} />
 */
export default function InlineError({ message, onRetry, className = '' }) {
  if (!message) return null;

  return (
    <div
      className={`rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-red-700 dark:text-red-400">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
