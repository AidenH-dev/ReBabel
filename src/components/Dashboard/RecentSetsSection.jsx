import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaPlus } from 'react-icons/fa';
import { FiPlay, FiChevronRight } from 'react-icons/fi';
import { FaRegFolderOpen } from 'react-icons/fa6';
import SetRow from '@/components/ui/SetRow';
import Button from '@/components/ui/Button';
import { InlineError } from '@/components/ui/errors';

export default function RecentSetsSection({
  sets,
  setsLoading,
  setsError,
  visibleSetCount,
  setsCardRef,
}) {
  const router = useRouter();

  return (
    <div
      ref={setsCardRef}
      className="bg-white dark:bg-surface-card rounded-lg p-4 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <Link
        href="/learn/academy/sets"
        className="mb-4 flex items-center gap-1 w-fit group"
      >
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white group-hover:text-brand-pink transition-colors">
          Recent Sets
        </h2>
        <FiChevronRight className="text-gray-400 dark:text-gray-500 text-lg mt-px group-hover:text-brand-pink transition-colors" />
      </Link>

      {/* Sets */}
      {setsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg bg-black/[0.06] dark:bg-white/[0.06] h-24"
            />
          ))}
        </div>
      ) : setsError ? (
        <InlineError
          message={setsError}
          onRetry={() => window.location.reload()}
        />
      ) : sets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center text-sm text-black/70 dark:text-white/70">
          <p className="mb-3">You don&apos;t have any sets yet.</p>
          <Button
            onClick={() => router.push('/learn/academy/sets/create')}
            variant="primary"
            size="sm"
            className="gap-2"
          >
            <FaPlus /> Create your first set
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop/tablet grid view */}
          <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sets.slice(0, visibleSetCount).map((set) => {
              const typeMap = {
                vocab: {
                  label: 'Vocab',
                  colorClass:
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                },
                grammar: {
                  label: 'Grammar',
                  colorClass:
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                },
              };
              const typeIndicator = typeMap[set.set_type] ?? {
                label: 'V & G',
                colorClass:
                  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
              };
              return (
                <div
                  key={set.id}
                  className="group rounded-lg border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-surface-elevated p-3 transition-all hover:shadow-sm focus-within:ring-2 focus-within:ring-brand-pink"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                      {set.name}
                    </h4>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-black/60 dark:text-white/60">
                      {set.item_num} Items
                    </p>
                    <div
                      className={`text-xs px-2 py-1 rounded-full font-medium ${typeIndicator.colorClass}`}
                    >
                      {typeIndicator.label}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/learn/academy/sets/study/${set.id}/quiz`}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 text-gray-700 dark:text-white hover:opacity-90"
                    >
                      <FiPlay /> Study
                    </Link>
                    <Link
                      href={`/learn/academy/sets/study/${set.id}`}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 text-gray-700 dark:text-white hover:opacity-90"
                    >
                      <FaRegFolderOpen /> Open
                    </Link>
                  </div>
                </div>
              );
            })}
            {/* Fill empty grid slots with create/import CTA */}
            {sets.length < visibleSetCount && (
              <Link
                href="/learn/academy/sets/create"
                className="rounded-lg border-2 border-dashed border-brand-pink/20 dark:border-brand-pink/20 p-3 flex flex-col items-center justify-center gap-1.5 text-brand-pink/60 dark:text-brand-pink/50 hover:border-brand-pink/50 hover:text-brand-pink hover:bg-brand-pink/[0.03] transition-colors"
              >
                <FaPlus className="text-sm" />
                <span className="text-xs font-medium">Create or Import</span>
              </Link>
            )}
          </div>
          {/* Mobile list view */}
          <div className="sm:hidden divide-y divide-black/5 dark:divide-white/10 rounded-lg overflow-hidden border border-black/5 dark:border-white/10">
            {sets.slice(0, visibleSetCount).map((set) => (
              <SetRow key={set.id} set={set} />
            ))}
            {sets.length < visibleSetCount && (
              <Link
                href="/learn/academy/sets/create"
                className="flex items-center gap-3 px-3 py-2 text-brand-pink/60 dark:text-brand-pink/50 hover:text-brand-pink hover:bg-brand-pink/[0.03] transition-colors"
              >
                <div className="w-6 h-6 rounded-md border-2 border-dashed border-brand-pink/30 flex items-center justify-center">
                  <FaPlus className="text-[8px]" />
                </div>
                <span className="text-sm font-medium">
                  Create or import a set
                </span>
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
