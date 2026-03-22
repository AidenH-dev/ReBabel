import { useState, useEffect, useRef, useMemo } from 'react';
import { FiSearch } from 'react-icons/fi';
import { FaPlus } from 'react-icons/fa';
import { TbChartInfographic } from 'react-icons/tb';
import { TbStack2 } from 'react-icons/tb';
import SrsProgressPipeline from '@/components/SRS/dashboard/srs-progress-pipeline';
import SrsMasteryBar from '@/components/SRS/dashboard/srs-mastery-bar';
import SrsLevelDistribution from '@/components/SRS/dashboard/srs-level-distribution';
import SrsLoadChart from '@/components/SRS/dashboard/srs-level-trend';
import SrsSetHealthCard from '@/components/SRS/sets-srs-set-card';

// ── Skeleton components ──────────────────────────────────────────────

function SetCardSkeleton({ delay = 0 }) {
  return (
    <div className="bg-white dark:bg-surface-elevated border border-border-default rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1">
          <div
            className="h-4 w-36 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
            style={{ animationDelay: `${delay}ms` }}
          />
          <div
            className="h-4 w-12 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
            style={{ animationDelay: `${delay + 50}ms` }}
          />
        </div>
        <div
          className="h-5 w-14 rounded-full bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
          style={{ animationDelay: `${delay + 80}ms` }}
        />
      </div>
      <div className="mb-2">
        <div className="flex justify-between mb-1">
          <div
            className="h-2.5 w-24 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
            style={{ animationDelay: `${delay + 120}ms` }}
          />
          <div
            className="h-2.5 w-8 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
            style={{ animationDelay: `${delay + 150}ms` }}
          />
        </div>
        <div
          className="h-[10px] rounded-lg bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
          style={{ animationDelay: `${delay + 180}ms` }}
        />
      </div>
      <div className="flex gap-3">
        {[0, 1, 2].map((j) => (
          <div
            key={j}
            className="h-2 w-6 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
            style={{ animationDelay: `${delay + 220 + j * 40}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-start">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
                <div
                  className="w-10 h-2 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                  style={{ animationDelay: `${i * 80 + 40}ms` }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="sm:w-[28rem] flex-shrink-0">
          <div className="h-[14px] rounded-xl bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
          <div
            className="h-3 w-36 mt-1.5 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
            style={{ animationDelay: '100ms' }}
          />
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        <div className="lg:w-1/2 space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-5 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
              style={{
                width: `${80 - i * 10}%`,
                animationDelay: `${i * 60}ms`,
              }}
            />
          ))}
        </div>
        <div
          className="lg:w-1/2 h-32 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
          style={{ animationDelay: '200ms' }}
        />
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────

export default function SetsSrsOverview({ active = true }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [srsView, setSrsViewState] = useState('sets'); // 'sets' | 'statistics'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortByState] = useState('due');
  const hasFetchedRef = useRef(false);
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  // Persist SRS sub-view and sort preference
  useEffect(() => {
    const savedView = localStorage.getItem('srs-tab-view');
    if (savedView === 'sets' || savedView === 'statistics')
      setSrsViewState(savedView);
    const savedSort = localStorage.getItem('srs-tab-sort');
    if (savedSort === 'due' || savedSort === 'mastery' || savedSort === 'alpha')
      setSortByState(savedSort);
  }, []);
  const setSrsView = (v) => {
    setSrsViewState(v);
    localStorage.setItem('srs-tab-view', v);
  };
  const setSortBy = (v) => {
    setSortByState(v);
    localStorage.setItem('srs-tab-sort', v);
  };

  // Fetch when first activated
  useEffect(() => {
    if (!active || hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/database/v2/srs/aggregate-overview?timezone=${encodeURIComponent(timezone)}`
        );
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load SRS data');
        }
      } catch {
        setError('Failed to fetch SRS overview');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [active]);

  // Refetch on visibility change
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible' && hasFetchedRef.current) {
        try {
          const res = await fetch(
            `/api/database/v2/srs/aggregate-overview?timezone=${encodeURIComponent(timezone)}`
          );
          const result = await res.json();
          if (result.success) setData(result.data);
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Aggregate pipeline stages
  const pipelineStages = useMemo(() => {
    if (!data) return null;
    const lc = data.aggregate.levelCounts;
    return [
      { label: 'Not Started', count: lc[0] || 0 },
      {
        label: 'Fresh',
        count: (lc[1] || 0) + (lc[2] || 0) + (lc[3] || 0) + (lc[4] || 0),
      },
      { label: 'Practiced', count: (lc[5] || 0) + (lc[6] || 0) },
      { label: 'Intermediate', count: lc[7] || 0 },
      { label: 'Expert', count: lc[8] || 0 },
      { label: 'Mastered', count: lc[9] || 0 },
    ];
  }, [data]);

  // Filtered + sorted sets
  const sortedSets = useMemo(() => {
    if (!data?.sets) return [];
    let filtered = data.sets;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => s.setTitle.toLowerCase().includes(q));
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'due') return b.dueCount - a.dueCount;
      if (sortBy === 'alpha') return a.setTitle.localeCompare(b.setTitle);
      const mastA =
        a.totalItems > 0
          ? (a.totalItems - (a.levelCounts[0] || 0)) / a.totalItems
          : 0;
      const mastB =
        b.totalItems > 0
          ? (b.totalItems - (b.levelCounts[0] || 0)) / b.totalItems
          : 0;
      return mastA - mastB;
    });
  }, [data, searchQuery, sortBy]);

  // ── Loading ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {/* Header + view toggle skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
          <div
            className="h-8 w-32 rounded-lg bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
            style={{ animationDelay: '50ms' }}
          />
        </div>
        {/* Card skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <SetCardSkeleton delay={0} />
          <SetCardSkeleton delay={120} />
          <SetCardSkeleton delay={240} />
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
          Spaced Repetition
        </h2>
        <div className="rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 p-6 text-center text-sm text-red-700 dark:text-red-300">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────

  if (!data?.sets?.length) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
          Spaced Repetition
        </h2>
        <div className="rounded-xl border border-dashed border-border-default p-8 text-center text-sm text-black/70 dark:text-white/70">
          <p className="mb-3">No SRS-enabled sets yet.</p>
          <p className="text-xs mb-4">
            Enable SRS on your notecard sets to use spaced repetition for better
            memorization.
          </p>
          <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-brand-pink text-white hover:bg-brand-pink-hover transition-colors">
            <FaPlus /> Enable SRS for a Set
          </button>
        </div>
      </div>
    );
  }

  const { aggregate } = data;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Header: title + stats + view toggle ──────────────────── */}
      <div className="flex items-center justify-between gap-2 pb-3 sm:pb-1 border-b border-border-default">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="hidden sm:block text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
            Spaced Repetition
          </h2>
          <span className="hidden sm:block w-px h-4 bg-black/10 dark:bg-white/10" />
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {aggregate.srsEnabledSets}
              </span>{' '}
              {aggregate.srsEnabledSets === 1 ? 'set' : 'sets'}
            </span>
            <span className="text-black/15 dark:text-white/15">·</span>
            <span>
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {aggregate.totalItems}
              </span>{' '}
              items
            </span>
            <span className="text-black/15 dark:text-white/15">·</span>
            <span>
              <span className="font-bold text-brand-pink">
                {aggregate.totalDue}
              </span>{' '}
              due
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-1 flex-shrink-0 -mt-1">
          <button
            onClick={() => setSrsView('sets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              srsView === 'sets'
                ? 'bg-white dark:bg-surface-deep text-brand-pink shadow-sm'
                : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
            }`}
          >
            <TbStack2 className="text-sm" />
            Sets
          </button>
          <button
            onClick={() => setSrsView('statistics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              srsView === 'statistics'
                ? 'bg-white dark:bg-surface-deep text-brand-pink shadow-sm'
                : 'text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white'
            }`}
          >
            <TbChartInfographic className="text-sm" />
            Statistics
          </button>
        </div>
      </div>

      {/* ── Statistics View ──────────────────────────────────────── */}
      {srsView === 'statistics' && (
        <div className="flex flex-col gap-5">
          {/* Pipeline + Mastery bar */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-start">
            <div className="order-2 sm:order-1 flex-1 min-w-0 sm:pt-[21px]">
              <SrsProgressPipeline stages={pipelineStages} />
            </div>
            <div className="order-1 sm:order-2 sm:w-[28rem] flex-shrink-0">
              <SrsMasteryBar
                stages={pipelineStages}
                totalItems={aggregate.totalItems}
              />
            </div>
          </div>

          {/* Level distribution + load chart */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <SrsLevelDistribution
                levelCounts={aggregate.levelCounts}
                compactMobile
              />
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2">
              <SrsLoadChart loadChart={data.loadChart} />
            </div>
          </div>
        </div>
      )}

      {/* ── Sets View ────────────────────────────────────────────── */}
      {srsView === 'sets' && (
        <div className="flex flex-col gap-3">
          {/* Toolbar */}
          <div className="flex flex-col gap-2">
            {/* Search + sort row */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40 text-sm" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-deep text-[#111] dark:text-white pl-8 pr-8 py-1.5 rounded-lg text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-brand-pink"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 hover:opacity-90"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Sort toggles */}
              <div className="flex items-center gap-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-1 flex-shrink-0">
                {[
                  { value: 'due', label: 'Due' },
                  { value: 'mastery', label: 'Mastery' },
                  { value: 'alpha', label: 'A–Z' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      sortBy === opt.value
                        ? 'bg-white dark:bg-surface-deep text-brand-pink shadow-sm'
                        : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sets grid */}
          {sortedSets.length === 0 && searchQuery ? (
            <div className="rounded-lg border border-dashed border-border-default p-6 text-center text-xs text-black/60 dark:text-white/60">
              No sets matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {sortedSets.map((set) => (
                <SrsSetHealthCard key={set.setId} set={set} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
