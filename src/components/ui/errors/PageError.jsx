/**
 * Full-page error state — replaces the entire page content.
 * Used when a critical data fetch fails and the page can't render.
 *
 * Usage:
 *   <PageError title="Error Loading Set" message={error} backHref="/learn/academy/sets" backLabel="Back to Sets" />
 */
export default function PageError({
  title = 'Something went wrong',
  message,
  backHref,
  backLabel = 'Go Back',
  icon,
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
      <div className="text-center max-w-md">
        {icon || <div className="text-red-500 text-4xl mb-4">!</div>}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>
        )}
        {backHref && (
          <a
            href={backHref}
            className="inline-flex items-center px-4 py-2 bg-brand-pink text-white rounded-lg hover:bg-brand-pink-hover transition-colors font-medium text-sm"
          >
            {backLabel}
          </a>
        )}
      </div>
    </div>
  );
}
