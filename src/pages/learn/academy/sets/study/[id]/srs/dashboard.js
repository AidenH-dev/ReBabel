import Head from 'next/head';
import Link from 'next/link';
import MainSidebar from '@/components/Sidebars/AcademySidebar';
import {
  TimeGridWeek,
  useSrsTimeGrid,
} from '@/components/SRS/visuals/SrsTimeGrid';
import SrsProgressPipeline from '@/components/SRS/dashboard/srs-progress-pipeline';
import SrsMasteryBar from '@/components/SRS/dashboard/srs-mastery-bar';
import SrsLevelDistribution from '@/components/SRS/dashboard/srs-level-distribution';
import SrsTabbedPanel from '@/components/SRS/dashboard/srs-tabbed-panel';
import { calculateNextReviewDate } from '@/components/SRS/visuals/SrsTimeGrid/models/srsDataModel';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { TbStack2, TbArrowLeft } from 'react-icons/tb';
import { LuRepeat } from 'react-icons/lu';
import { FaPlus } from 'react-icons/fa';

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
        console.error('Error fetching SRS items:', err);
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
      <div className="flex h-screen min-h-0 bg-gray-50 dark:bg-[#141f25]">
        <MainSidebar />
        <main className="ml-auto flex-1 flex items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">
            Loading SRS items...
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen min-h-0 bg-gray-50 dark:bg-[#141f25]">
        <MainSidebar />
        <main className="ml-auto flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 font-semibold mb-2">
              Error Loading SRS Dashboard
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => router.push(`/learn/academy/sets/study/${id}`)}
              className="px-4 py-2 bg-[#e30a5f] text-white rounded-lg hover:bg-[#c00950] transition-colors"
            >
              Back to Set
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  return (
    <div className="flex h-screen min-h-0 bg-gray-50 dark:bg-[#141f25]">
      <MainSidebar />

      <main className="ml-auto flex-1 flex flex-col min-h-0 overflow-hidden">
        <Head>
          <title>{setTitle} - SRS Dashboard</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Scrollable content area */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Header */}
          <div className="bg-white dark:bg-[#1a2834] border-b border-gray-300 dark:border-gray-700 px-4 sm:px-6 py-4">
            {/* Top row: nav + title + action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => router.push(`/learn/academy/sets/study/${id}`)}
                  className="flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-lg border-2 border-gray-300 dark:border-gray-500 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-md transition-all flex-shrink-0"
                >
                  <TbArrowLeft className="text-gray-700 dark:text-gray-200 text-lg" />
                  <div className="hidden sm:flex items-center gap-2 ml-1">
                    <TbStack2 className="text-gray-700 dark:text-gray-200 text-lg" />
                    <span className="text-lg text-gray-900 dark:text-white font-semibold truncate max-w-[200px]">
                      {setTitle}
                    </span>
                  </div>
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    SRS Dashboard
                  </h1>
                  <p className="sm:hidden text-xs text-gray-500 dark:text-gray-400 truncate">
                    {setTitle}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/learn/academy/sets/study/${id}/srs/due-now`}
                  className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold transition-all ${
                    stats.dueNow > 0
                      ? 'bg-gradient-to-r from-[#e30a5f] to-[#c1084d] text-white hover:brightness-110 hover:ring-2 hover:ring-[#e30a5f]/40'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 pointer-events-none'
                  }`}
                >
                  <LuRepeat className="text-lg opacity-80" />
                  <span className="hidden sm:inline">Due Now</span>
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
                  className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-semibold transition-all ${
                    learnNewLeft > 0
                      ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:brightness-110 hover:ring-2 hover:ring-[#667eea]/40'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 pointer-events-none'
                  }`}
                >
                  <FaPlus className="text-sm opacity-80" />
                  <span className="hidden sm:inline">Learn New</span>
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
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
