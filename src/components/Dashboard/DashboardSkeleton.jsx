import { FaCalendarAlt } from 'react-icons/fa';

export default function DashboardSkeleton() {
  return (
    <>
      {/* PageHeader skeleton */}
      <div className="hidden lg:block -mt-[var(--cap-safe-top)] flex-shrink-0 bg-white dark:bg-surface-elevated border-b border-gray-300 dark:border-gray-700 px-4 sm:px-6 pt-[calc(var(--cap-safe-top)+1rem)] pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Date skeleton */}
            <div className="animate-pulse h-8 w-44 rounded-lg bg-black/[0.06] dark:bg-white/[0.06]" />
            <div className="w-px h-7 bg-gray-200 dark:bg-gray-700" />
            {/* Greeting skeleton */}
            <div
              className="animate-pulse h-8 w-36 rounded-lg bg-black/[0.06] dark:bg-white/[0.06]"
              style={{ animationDelay: '50ms' }}
            />
            {/* Pill skeletons */}
            <div
              className="animate-pulse h-6 w-24 rounded-full bg-black/[0.04] dark:bg-white/[0.04]"
              style={{ animationDelay: '100ms' }}
            />
            <div
              className="animate-pulse h-6 w-16 rounded-full bg-black/[0.04] dark:bg-white/[0.04]"
              style={{ animationDelay: '150ms' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <div
              className="animate-pulse h-9 w-28 rounded-lg bg-black/[0.06] dark:bg-white/[0.06]"
              style={{ animationDelay: '75ms' }}
            />
            <div
              className="animate-pulse h-9 w-28 rounded-lg bg-black/[0.06] dark:bg-white/[0.06]"
              style={{ animationDelay: '125ms' }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-[max(1rem,var(--cap-safe-top))] lg:pt-4">
        <div className="px-4 md:p-4 lg:w-screen lg:max-w-[calc(100vw-16rem)] lg:mx-auto">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Tablet greeting skeleton */}
            <div className="lg:hidden md:block hidden">
              <div
                className="animate-pulse h-7 w-48 rounded-lg bg-black/[0.06] dark:bg-white/[0.06] mb-2"
                style={{ animationDelay: '50ms' }}
              />
              <div
                className="animate-pulse h-4 w-72 rounded bg-black/[0.04] dark:bg-white/[0.04]"
                style={{ animationDelay: '100ms' }}
              />
            </div>
            <div className="md:hidden h-2" aria-hidden="true" />

            {/* Stats Row - Desktop skeleton */}
            <div className="hidden md:grid md:grid-cols-4 gap-3">
              {/* Streak card skeleton */}
              <div className="bg-gradient-to-br from-orange-500/60 to-red-500/60 rounded-lg p-3 shadow">
                <div className="flex items-center justify-between mb-1">
                  <div className="animate-pulse h-5 w-5 rounded bg-white/20" />
                  <div className="text-right space-y-1">
                    <div className="animate-pulse h-3 w-12 rounded bg-white/20 ml-auto" />
                    <div className="animate-pulse h-4 w-8 rounded bg-white/20 ml-auto" />
                  </div>
                </div>
                <div className="animate-pulse h-7 w-12 rounded bg-white/20 mt-1" />
                <div className="animate-pulse h-3 w-16 rounded bg-white/20 mt-2" />
              </div>
              {/* Study Time skeleton */}
              <div className="bg-white dark:bg-surface-card rounded-lg p-3 shadow-sm">
                <div
                  className="animate-pulse w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 mb-1"
                  style={{ animationDelay: '50ms' }}
                />
                <div
                  className="animate-pulse h-6 w-16 rounded bg-black/[0.06] dark:bg-white/[0.06] mt-1"
                  style={{ animationDelay: '100ms' }}
                />
                <div
                  className="animate-pulse h-3 w-24 rounded bg-black/[0.04] dark:bg-white/[0.04] mt-2"
                  style={{ animationDelay: '150ms' }}
                />
              </div>
              {/* Accuracy skeleton */}
              <div className="bg-white dark:bg-surface-card rounded-lg p-3 shadow-sm">
                <div
                  className="animate-pulse w-6 h-6 rounded-md bg-green-100 dark:bg-green-900/30 mb-1"
                  style={{ animationDelay: '100ms' }}
                />
                <div
                  className="animate-pulse h-6 w-14 rounded bg-black/[0.06] dark:bg-white/[0.06] mt-1"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="animate-pulse h-3 w-20 rounded bg-black/[0.04] dark:bg-white/[0.04] mt-2"
                  style={{ animationDelay: '200ms' }}
                />
              </div>
              {/* Items Reviewed skeleton */}
              <div className="bg-white dark:bg-surface-card rounded-lg p-3 shadow-sm">
                <div
                  className="animate-pulse w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/30 mb-1"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="animate-pulse h-6 w-12 rounded bg-black/[0.06] dark:bg-white/[0.06] mt-1"
                  style={{ animationDelay: '200ms' }}
                />
                <div
                  className="animate-pulse h-3 w-24 rounded bg-black/[0.04] dark:bg-white/[0.04] mt-2"
                  style={{ animationDelay: '250ms' }}
                />
              </div>
            </div>

            {/* Activity Calendar skeleton */}
            <div className="bg-white dark:bg-surface-card rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-gray-400 dark:text-gray-600 text-sm" />
                  <div className="animate-pulse h-4 w-14 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="animate-pulse h-3 w-8 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-sm bg-gray-100 dark:bg-white/[0.05]"
                      />
                    ))}
                  </div>
                  <div className="animate-pulse h-3 w-8 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
                </div>
              </div>
              {/* Calendar grid skeleton */}
              <div className="flex gap-0.5 overflow-hidden">
                {Array.from({ length: 26 }).map((_, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-0.5">
                    {Array.from({ length: 7 }).map((_, dayIdx) => (
                      <div
                        key={dayIdx}
                        className="w-2.5 h-2.5 rounded-sm animate-pulse"
                        style={{
                          backgroundColor: 'var(--cal-skel)',
                          opacity: 0.3 + Math.random() * 0.4,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
              {/* Stats row skeleton below calendar */}
              <div className="mt-3 grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <div
                      className="animate-pulse h-5 w-10 rounded bg-black/[0.06] dark:bg-white/[0.06] mx-auto"
                      style={{ animationDelay: `${i * 60}ms` }}
                    />
                    <div
                      className="animate-pulse h-3 w-16 rounded bg-black/[0.04] dark:bg-white/[0.04] mx-auto mt-1"
                      style={{ animationDelay: `${i * 60 + 30}ms` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Stats skeleton */}
            <div className="md:hidden bg-white dark:bg-surface-card rounded-lg p-3 shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-orange-500/60 to-red-500/60 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse h-4 w-4 rounded bg-white/20" />
                    <div>
                      <div className="animate-pulse h-5 w-8 rounded bg-white/20" />
                      <div className="animate-pulse h-2.5 w-14 rounded bg-white/20 mt-1" />
                    </div>
                  </div>
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="animate-pulse h-4 w-4 rounded bg-black/[0.06] dark:bg-white/[0.06]"
                        style={{ animationDelay: `${(i + 1) * 60}ms` }}
                      />
                      <div>
                        <div
                          className="animate-pulse h-5 w-10 rounded bg-black/[0.06] dark:bg-white/[0.06]"
                          style={{
                            animationDelay: `${(i + 1) * 60 + 30}ms`,
                          }}
                        />
                        <div
                          className="animate-pulse h-2.5 w-14 rounded bg-black/[0.04] dark:bg-white/[0.04] mt-1"
                          style={{
                            animationDelay: `${(i + 1) * 60 + 60}ms`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Sets skeleton */}
            <div className="bg-white dark:bg-surface-card rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  <div className="animate-pulse h-5 w-24 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
                  <div className="animate-pulse h-4 w-4 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
                </div>
              </div>
              {/* Desktop/tablet grid */}
              <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-surface-elevated p-3"
                  >
                    <div
                      className="animate-pulse h-4 w-3/4 rounded bg-black/[0.06] dark:bg-white/[0.06]"
                      style={{ animationDelay: `${i * 80}ms` }}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <div
                        className="animate-pulse h-3 w-14 rounded bg-black/[0.04] dark:bg-white/[0.04]"
                        style={{ animationDelay: `${i * 80 + 40}ms` }}
                      />
                      <div
                        className="animate-pulse h-5 w-12 rounded-full bg-black/[0.04] dark:bg-white/[0.04]"
                        style={{ animationDelay: `${i * 80 + 60}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Mobile list */}
              <div className="sm:hidden divide-y divide-black/5 dark:divide-white/10 rounded-lg overflow-hidden border border-black/5 dark:border-white/10">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 bg-white/70 dark:bg-white/[0.02] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className="animate-pulse h-4 w-3/4 rounded bg-black/[0.06] dark:bg-white/[0.06]"
                        style={{ animationDelay: `${i * 80}ms` }}
                      />
                      <div className="flex items-center gap-2 mt-1.5">
                        <div
                          className="animate-pulse h-3 w-14 rounded bg-black/[0.04] dark:bg-white/[0.04]"
                          style={{ animationDelay: `${i * 80 + 40}ms` }}
                        />
                        <div
                          className="animate-pulse h-4 w-12 rounded-full bg-black/[0.04] dark:bg-white/[0.04]"
                          style={{ animationDelay: `${i * 80 + 60}ms` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="animate-pulse h-6 w-14 rounded-md bg-black/[0.06] dark:bg-white/[0.06]"
                        style={{ animationDelay: `${i * 80 + 80}ms` }}
                      />
                      <div
                        className="animate-pulse h-6 w-14 rounded-md bg-black/[0.06] dark:bg-white/[0.06]"
                        style={{ animationDelay: `${i * 80 + 100}ms` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
