import { useRouter } from 'next/router';
import { TbArrowLeft } from 'react-icons/tb';

/**
 * PageHeader — Desktop-only sticky header bar for content pages.
 * Hidden on mobile (< lg breakpoint). Mobile pages use inline layouts instead.
 *
 * @param {string} title - Page title
 * @param {string} [backHref] - URL for the back button (omit to hide back button)
 * @param {string} [backLabel] - Label next to back arrow (e.g. set title)
 * @param {React.ReactNode} [backIcon] - Icon next to backLabel
 * @param {React.ReactNode} [meta] - Inline metadata shown after the title (e.g. stat pills)
 * @param {React.ReactNode} [actions] - Right-aligned action buttons
 */
export default function PageHeader({
  title,
  backHref,
  backLabel,
  backIcon,
  meta,
  actions,
}) {
  const router = useRouter();

  return (
    <div className="hidden lg:block -mt-[var(--cap-safe-top)] flex-shrink-0 bg-white dark:bg-[#1a2834] border-b border-gray-300 dark:border-gray-700 px-4 sm:px-6 pt-[calc(var(--cap-safe-top)+1rem)] pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {backHref && (
            <button
              onClick={() => router.push(backHref)}
              className="flex items-center justify-center w-auto px-3 py-1.5 rounded-lg border-2 border-gray-300 dark:border-gray-500 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-md transition-all flex-shrink-0"
            >
              <TbArrowLeft className="text-gray-700 dark:text-gray-200 text-lg" />
              {backLabel && (
                <div className="flex items-center gap-2 ml-1">
                  {backIcon}
                  <span className="text-lg text-gray-900 dark:text-white font-semibold truncate max-w-[200px]">
                    {backLabel}
                  </span>
                </div>
              )}
            </button>
          )}
          {typeof title === 'string' ? (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate flex-shrink-0">
              {title}
            </h1>
          ) : (
            <div className="flex-shrink-0">{title}</div>
          )}
          {meta && meta}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
