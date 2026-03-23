import Link from 'next/link';
import AuthenticatedLayout from '@/components/ui/AuthenticatedLayout';
import {
  TimeGridWeek,
  useSrsTimeGrid,
} from '@/components/SRS/visuals/SrsTimeGrid';
import SrsProgressPipeline from '@/components/SRS/dashboard/SrsProgressPipeline';
import SrsMasteryBar from '@/components/SRS/dashboard/SrsMasteryBar';
import SrsLevelDistribution from '@/components/SRS/dashboard/SrsLevelDistribution';
import SrsTabbedPanel from '@/components/SRS/dashboard/SrsTabbedPanel';
import { calculateNextReviewDate } from '@/components/SRS/visuals/SrsTimeGrid/models/srsDataModel';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { TbStack2, TbArrowBackUp } from 'react-icons/tb';
import PageHeader from '@/components/ui/PageHeader';
import { LuRepeat } from 'react-icons/lu';
import { FaPlus } from 'react-icons/fa';
import { clientLog } from '@/lib/clientLogger';

export default function SRSDashboard() {
  const router = useRouter();
  const { id } = router.query;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setTitle, setSetTitle] = useState('SRS Dashboard');
  const [rawItems, setRawItems] = useState([]);
  const [setType, setSetType] = useState('vocabulary');
  const [learnNewLeft, setLearnNewLeft] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);

  const { items, currentTime, weekDays, setApiItems } = useSrsTimeGrid();

  // ========================================================================
  // STATS COMPUTATION
  // ========================================================================

  const stats = useMemo(() => {
    const _tick = refreshTick; // dependency to force recompute
    const now = new Date();
    const levelCounts = {};
    for (let i = 0; i <= 9; i++) levelCounts[i] = 0;
    let dueNow = 0;

    rawItems.forEach((item) => {
      const level = item.srs?.srs_level ?? 0;
      levelCounts[level]++;
      if (item.srs?.time_created && level > 0) {
        const nextReview = calculateNextReviewDate(
          item.srs.time_created,
          level
        );
        if (nextReview <= now) dueNow++;
      }
    });

    const notStarted = levelCounts[0];
    const fresh =
      levelCounts[1] + levelCounts[2] + levelCounts[3] + levelCounts[4];
    const practiced = levelCounts[5] + levelCounts[6];
    const intermediate = levelCounts[7];
    const expert = levelCounts[8];
    const mastered = levelCounts[9];
    const total = rawItems.length;
    const masteryPercent = total > 0 ? Math.round((mastered / total) * 100) : 0;

    const pipelineStages = [
      { label: 'Not Started', count: notStarted },
      { label: 'Fresh', count: fresh },
      { label: 'Practiced', count: practiced },
      { label: 'Intermediate', count: intermediate },
      { label: 'Expert', count: expert },
      { label: 'Mastered', count: mastered },
    ];

    return {
      levelCounts,
      dueNow,
      notStarted,
      mastered,
      total,
      masteryPercent,
      pipelineStages,
    };
  }, [rawItems, refreshTick]);

  // ========================================================================
  // AUTO-REFRESH WHEN NEXT ITEM BECOMES DUE
  // ========================================================================

  useEffect(() => {
    if (rawItems.length === 0) return;

    const now = new Date();
    let soonest = null;

    rawItems.forEach((item) => {
      const level = item.srs?.srs_level ?? 0;
      if (item.srs?.time_created && level > 0) {
        const nextReview = calculateNextReviewDate(
          item.srs.time_created,
          level
        );
        if (nextReview > now && (!soonest || nextReview < soonest)) {
          soonest = nextReview;
        }
      }
    });

    if (!soonest) return;

    const ms = soonest.getTime() - now.getTime() + 1000; // +1s buffer
    const timer = setTimeout(() => {
      setRefreshTick((t) => t + 1);
    }, ms);

    return () => clearTimeout(timer);
  }, [rawItems, refreshTick]);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  useEffect(() => {
    if (!id) return;

    const fetchSrsItems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/database/v2/srs/set/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch SRS items: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load SRS items');
        }

        const apiData = result.data;
        const apiItems = apiData.items || [];
        const setTitleFromAPI = apiData.set.title || 'No Title Found';
        const apiSetType = apiData.set.set_type || 'vocabulary';
        setSetTitle(setTitleFromAPI);
        setSetType(apiSetType);
        setRawItems(apiItems);
        setApiItems(apiItems);

        // Fetch daily learn-new limit
        const asOf = new Date().toISOString();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const dayLimitRes = await fetch(
          `/api/database/v2/srs/set/learn/day-limit/${id}?limit=5&vocab_or_grammar=${apiSetType}&as_of=${encodeURIComponent(asOf)}&as_of_timezone=${encodeURIComponent(timezone)}`
        );
        if (dayLimitRes.ok) {
          const dayLimitData = await dayLimitRes.json();
          if (dayLimitData.success) {
            setLearnNewLeft(dayLimitData.data?.learn_new_left ?? 0);
          }
        }
      } catch (err) {
        clientLog.error('srs.dashboard_fetch_failed', {
          error: err?.message || String(err),
        });
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSrsItems();
  }, [id]);

  // ========================================================================
  // LOADING & ERROR STATES
  // ========================================================================

  if (isLoading) {
    return (
      <AuthenticatedLayout
        sidebar="academy"
        title="SRS Dashboard"
        variant="fixed"
        mainClassName="min-h-0 overflow-hidden"
      >
        {/* Desktop header skeleton */}
        <div className="hidden lg:block flex-shrink-0 bg-white dark:bg-surface-elevated border-b border-gray-300 dark:border-gray-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-36 rounded-lg bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
              <div className="h-7 w-44 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-28 rounded-lg bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
              <div className="h-9 w-28 rounded-lg bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Mobile header skeleton */}
          <div className="lg:hidden px-4 pt-[max(1rem,var(--cap-safe-top))] pb-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-32 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
                <div
                  className="h-4 w-24 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                  style={{ animationDelay: '75ms' }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div
                className="flex-1 h-12 rounded-xl bg-black/[0.05] dark:bg-white/[0.05] animate-pulse"
                style={{ animationDelay: '100ms' }}
              />
              <div
                className="flex-1 h-12 rounded-xl bg-black/[0.05] dark:bg-white/[0.05] animate-pulse"
                style={{ animationDelay: '150ms' }}
              />
            </div>
          </div>

          {/* Progress section skeleton: pipeline + mastery */}
          <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-start">
            <div className="order-2 sm:order-1 flex-1 min-w-0 sm:pt-[21px]">
              {/* Pipeline skeleton */}
              <div className="flex items-center justify-between gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                      style={{ animationDelay: `${i * 50}ms` }}
                    />
                    <div
                      className="h-2 w-10 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                      style={{ animationDelay: `${i * 50 + 25}ms` }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 sm:order-2 sm:w-[28rem] flex-shrink-0">
              {/* Mastery bar skeleton */}
              <div className="flex items-baseline justify-between mb-2">
                <div className="h-4 w-28 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
                <div className="h-4 w-10 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse" />
              </div>
              <div
                className="h-[14px] rounded-xl bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                style={{ animationDelay: '100ms' }}
              />
              <div
                className="h-3 w-36 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse mt-1.5"
                style={{ animationDelay: '150ms' }}
              />
            </div>
          </div>

          {/* Main content skeleton: time grid + level dist / tabbed panel */}
          <div className="px-4 sm:px-6 pt-2 pb-3 flex flex-col lg:flex-row gap-4">
            {/* Left column */}
            <div className="lg:w-3/5 min-w-0 space-y-5">
              {/* Time grid skeleton */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="h-4 w-32 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
                  <div className="h-3 w-16 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse" />
                </div>
                <div className="h-48 sm:h-56 lg:h-64 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-page overflow-hidden">
                  <div className="h-8 bg-black/[0.03] dark:bg-white/[0.03] border-b border-gray-300 dark:border-gray-600 animate-pulse" />
                  <div className="space-y-0">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div
                        key={i}
                        className="h-6 border-b border-gray-200 dark:border-gray-700 animate-pulse bg-black/[0.01] dark:bg-white/[0.01]"
                        style={{ animationDelay: `${i * 40}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {/* Level distribution skeleton */}
              <div>
                <div className="h-4 w-32 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse mb-3" />
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-20 sm:w-24 flex-shrink-0 flex items-center gap-1.5">
                        <div
                          className="h-3 w-5 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                          style={{ animationDelay: `${i * 30}ms` }}
                        />
                        <div
                          className="h-2.5 w-10 rounded bg-black/[0.03] dark:bg-white/[0.03] animate-pulse"
                          style={{ animationDelay: `${i * 30 + 15}ms` }}
                        />
                      </div>
                      <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                        <div
                          className="h-full rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                          style={{
                            width: `${Math.max(10, 90 - i * 8)}%`,
                            animationDelay: `${i * 30 + 30}ms`,
                          }}
                        />
                      </div>
                      <div
                        className="h-3 w-6 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                        style={{ animationDelay: `${i * 30 + 45}ms` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Right column — tabbed panel skeleton */}
            <div className="lg:w-2/5 min-w-0">
              <div className="border-b border-black/5 dark:border-white/10 mb-3">
                <div className="flex items-end gap-6 h-10">
                  <div className="h-4 w-20 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse mb-2" />
                  <div className="h-4 w-24 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse mb-2" />
                  <div className="h-4 w-16 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse mb-2" />
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 sm:p-4">
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-2.5 py-2 rounded-md border border-black/[0.03] dark:border-white/[0.03]"
                    >
                      <div
                        className="h-3.5 w-3.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                        style={{ animationDelay: `${i * 50}ms` }}
                      />
                      <div className="flex-1 space-y-1.5">
                        <div
                          className="h-3.5 w-2/3 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                          style={{ animationDelay: `${i * 50 + 25}ms` }}
                        />
                        <div
                          className="h-2.5 w-1/3 rounded bg-black/[0.03] dark:bg-white/[0.03] animate-pulse"
                          style={{ animationDelay: `${i * 50 + 50}ms` }}
                        />
                      </div>
                      <div
                        className="h-5 w-8 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                        style={{ animationDelay: `${i * 50 + 75}ms` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Mobile floating back button */}
        <button
          onClick={() => router.push(`/learn/academy/sets/study/${id}`)}
          className="lg:hidden fixed bottom-6 left-6 z-[60] flex items-center justify-center w-15 h-15 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 hover:bg-gray-100/90 dark:hover:bg-gray-700/70 hover:border-gray-400 dark:hover:border-gray-500 transition-all shadow-lg"
        >
          <TbArrowBackUp className="w-6.5 h-6.5 text-gray-700 dark:text-gray-300" />
        </button>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout
        sidebar="academy"
        title="SRS Dashboard"
        variant="fixed"
        mainClassName="flex items-center justify-center"
      >
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 font-semibold mb-2">
            Error Loading SRS Dashboard
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.push(`/learn/academy/sets/study/${id}`)}
            className="px-4 py-2 bg-brand-pink text-white rounded-lg hover:bg-[#c00950] transition-colors"
          >
            Back to Set
          </button>
        </div>
      </AuthenticatedLayout>
    );
  }

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  return (
    <AuthenticatedLayout
      sidebar="academy"
      title={`${setTitle} - SRS Dashboard`}
      variant="fixed"
      mainClassName="min-h-0 overflow-hidden"
    >
      {/* Desktop sticky header */}
      <PageHeader
        title="SRS Dashboard"
        backHref={`/learn/academy/sets/study/${id}`}
        backLabel={setTitle}
        backIcon={
          <TbStack2 className="text-gray-700 dark:text-gray-200 text-lg" />
        }
        actions={
          <>
            <Link
              href={`/learn/academy/sets/study/${id}/srs/due-now`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                stats.dueNow > 0
                  ? 'bg-gradient-to-r from-brand-pink to-brand-pink-dark text-white hover:brightness-110 hover:ring-2 hover:ring-brand-pink/40'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 pointer-events-none'
              }`}
            >
              <LuRepeat className="text-lg opacity-80" />
              <span>Due Now</span>
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[1.5rem] text-center ${
                  stats.dueNow > 0
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                }`}
              >
                {stats.dueNow}
              </span>
            </Link>
            <Link
              href={`/learn/academy/sets/study/${id}/srs/learn-new`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                learnNewLeft > 0
                  ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:brightness-110 hover:ring-2 hover:ring-[#667eea]/40'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 pointer-events-none'
              }`}
            >
              <FaPlus className="text-sm opacity-80" />
              <span>Learn New</span>
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[1.5rem] text-center ${
                  learnNewLeft > 0
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                }`}
              >
                {learnNewLeft}
              </span>
            </Link>
          </>
        }
      />

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Mobile inline action banners — visible only below lg */}
        <div className="lg:hidden px-4 pt-[max(1rem,var(--cap-safe-top))] pb-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-shrink-0">
                SRS Dashboard
              </h1>
              <span className="text-sm text-gray-400 dark:text-gray-500 truncate">
                {setTitle}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/learn/academy/sets/study/${id}/srs/due-now`}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                stats.dueNow > 0
                  ? 'bg-gradient-to-r from-brand-pink to-brand-pink-dark text-white shadow-lg shadow-brand-pink/20'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 pointer-events-none'
              }`}
            >
              <LuRepeat className="text-lg opacity-80" />
              <span>Due Now</span>
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[1.5rem] text-center ${
                  stats.dueNow > 0
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                }`}
              >
                {stats.dueNow}
              </span>
            </Link>
            <Link
              href={`/learn/academy/sets/study/${id}/srs/learn-new`}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                learnNewLeft > 0
                  ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg shadow-[#667eea]/20'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 pointer-events-none'
              }`}
            >
              <FaPlus className="text-sm opacity-80" />
              <span>Learn New</span>
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[1.5rem] text-center ${
                  learnNewLeft > 0
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                }`}
              >
                {learnNewLeft}
              </span>
            </Link>
          </div>
        </div>
        {/* Progress section: pipeline + mastery bar */}
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-start">
          <div className="order-2 sm:order-1 flex-1 min-w-0 sm:pt-[21px]">
            <SrsProgressPipeline stages={stats.pipelineStages} />
          </div>
          <div className="order-1 sm:order-2 sm:w-[28rem] flex-shrink-0">
            <SrsMasteryBar
              stages={stats.pipelineStages}
              totalItems={stats.total}
            />
          </div>
        </div>

        {/* Left column (time grid + level dist) / Right column (tabbed panel) */}
        <div className="px-4 sm:px-6 pt-2 pb-3 flex flex-col lg:flex-row gap-4">
          <div className="lg:w-3/5 min-w-0 space-y-5">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Upcoming Reviews
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Next 7 days
                </span>
              </div>
              <div className="h-48 sm:h-56 lg:h-64">
                <TimeGridWeek
                  items={items}
                  currentTime={currentTime}
                  weekDays={weekDays}
                />
              </div>
            </div>
            <SrsLevelDistribution levelCounts={stats.levelCounts} />
          </div>
          <div className="lg:w-2/5 min-w-0">
            <SrsTabbedPanel setId={id} rawItems={rawItems} />
          </div>
        </div>
      </div>
      {/* Mobile floating back button — replaces sidebar bubble menu */}
      <button
        onClick={() => router.push(`/learn/academy/sets/study/${id}`)}
        className="lg:hidden fixed bottom-6 left-6 z-[60] flex items-center justify-center w-15 h-15 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 hover:bg-gray-100/90 dark:hover:bg-gray-700/70 hover:border-gray-400 dark:hover:border-gray-500 transition-all shadow-lg"
      >
        <TbArrowBackUp className="w-6.5 h-6.5 text-gray-700 dark:text-gray-300" />
      </button>
    </AuthenticatedLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();
