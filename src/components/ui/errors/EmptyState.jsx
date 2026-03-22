/**
 * Empty state — distinguishes "no data yet" from "failed to load".
 * Prevents misleading UIs where a fetch failure looks like empty data.
 *
 * Usage:
 *   <EmptyState
 *     isEmpty={sets.length === 0}
 *     error={fetchError}
 *     emptyContent={<p>You don't have any sets yet.</p>}
 *     errorMessage="Failed to load your sets"
 *     onRetry={() => fetchSets()}
 *   />
 */
import InlineError from './InlineError';

export default function EmptyState({
  isEmpty,
  error,
  emptyContent,
  errorMessage = 'Failed to load data',
  onRetry,
  className = '',
}) {
  if (error) {
    return (
      <div className={className}>
        <InlineError message={errorMessage} onRetry={onRetry} />
      </div>
    );
  }

  if (isEmpty) {
    return <div className={className}>{emptyContent}</div>;
  }

  return null;
}
