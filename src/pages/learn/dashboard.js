// pages/learn/academy/dashboard.js
import Link from 'next/link';
import AuthenticatedLayout from '@/components/ui/AuthenticatedLayout';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useState, useEffect, useRef, useMemo } from 'react';
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import { FaFire, FaCalendarAlt } from 'react-icons/fa';
import { TbCards, TbBooks } from 'react-icons/tb';
import { FaRegFolderOpen } from 'react-icons/fa6';
import { HiOutlineLightningBolt } from 'react-icons/hi';
import { LuTextCursorInput } from 'react-icons/lu';
import PageHeader from '@/components/ui/PageHeader';
import { InlineError } from '@/components/ui/errors';
import ActivityCalendar from '@/components/Dashboard/ActivityCalendar';
import useJapaneseDate from '@/hooks/useJapaneseDate';
import DashboardSkeleton from '@/components/Dashboard/DashboardSkeleton';
import StatsGrid from '@/components/Dashboard/StatsGrid';
import RecentSetsSection from '@/components/Dashboard/RecentSetsSection';
import formatStudyTime from '@/lib/study/formatStudyTime';

export default function DashboardPage() {
  const jpDate = useJapaneseDate();
  const [greeting, setGreeting] = useState('Hello');
  const [mounted, setMounted] = useState(false);
  const setsCardRef = useRef(null);
  const [visibleSetCount, setVisibleSetCount] = useState(3);

  // --- SWR data fetching ---

  // 1. User profile
  const { data: profileData, error: profileErrorObj } = useSWR(
    '/api/auth/me',
    fetcher
  );
  const userProfile = profileData || null;
  const profileError = profileErrorObj
    ? 'Failed to load your profile. Please try again.'
    : null;

  // 2. Sets list (depends on profile userId)
  const userId = userProfile?.sub;
  const {
    data: setsRaw,
    error: setsErrorObj,
    isLoading: setsLoading,
  } = useSWR(
    userId
      ? `/api/database/v2/sets/retrieve-list/${encodeURIComponent(userId)}`
      : null,
    fetcher,
    { revalidateOnFocus: true }
  );

  const sets = useMemo(() => {
    if (!setsRaw?.data?.sets) return [];
    return setsRaw.data.sets
      .map((record) => ({
        id: record.entity_id,
        name: record.data.title || 'Untitled Set',
        item_num: parseInt(record.data.item_num, 10) || 0,
        date:
          record.data.last_studied ||
          record.data.date_created ||
          record.data.updated_at,
        set_type: record.data.set_type || null,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [setsRaw]);

  const setsError = setsErrorObj ? 'Failed to load your sets.' : null;

  // 3. Due count (depends on profile)
  const {
    data: dueRaw,
    error: dueErrorObj,
    isLoading: dueLoading,
  } = useSWR(
    userId ? '/api/database/v2/srs/all-due?countOnly=true' : null,
    fetcher,
    { revalidateOnFocus: true }
  );
  const totalDueItems = dueRaw?.data?.metadata?.totalDueItems ?? 0;
  const dueError = dueErrorObj ? 'Failed to load due items count.' : null;

  // 4. Dashboard stats (independent)
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );
  const {
    data: statsRaw,
    error: statsErrorObj,
    isLoading: dashboardLoading,
  } = useSWR(
    `/api/analytics/user/dashboard?timezone=${encodeURIComponent(timezone)}`,
    fetcher,
    { revalidateOnFocus: true }
  );
  const statsError = statsErrorObj ? 'Failed to load dashboard stats.' : null;

  const userData = useMemo(() => {
    const d = statsRaw?.data;
    if (!d) {
      return {
        name: userProfile?.name || '',
        currentStreak: null,
        longestStreak: null,
        totalStudyTime: null,
        sessionsCompleted: null,
        daysActiveLast60: null,
        cardsReviewed: null,
        accuracyRate: null,
        activityData: [],
      };
    }
    return {
      name: userProfile?.name || '',
      currentStreak: d.current_streak ?? 0,
      longestStreak: d.longest_streak ?? 0,
      totalStudyTime: formatStudyTime(d.total_study_minutes),
      cardsReviewed: d.total_items_reviewed ?? null,
      accuracyRate:
        d.accuracy_rate != null
          ? Math.round(d.accuracy_rate * 1000) / 10
          : null,
      activityData: d.activity_data ?? [],
      sessionsCompleted: d.sessions_completed ?? 0,
      daysActiveLast60: d.days_active_last_60 ?? 0,
    };
  }, [statsRaw, userProfile]);

  // Set greeting and mounted state
  useEffect(() => {
    setMounted(true);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Calculate how many set cards fit without scrolling
  useEffect(() => {
    const calculate = () => {
      const card = setsCardRef.current;
      if (!card) return;

      const width = window.innerWidth;

      // Desktop/tablet: one row = match column count
      if (width >= 768) {
        if (width >= 1024) return setVisibleSetCount(4);
        return setVisibleSetCount(3);
      }
      if (width >= 640) return setVisibleSetCount(2);

      // Mobile: max 3 sets (list view)
      setVisibleSetCount(3);
    };

    // Recalculate after a frame so layout is settled
    requestAnimationFrame(calculate);
    window.addEventListener('resize', calculate);
    return () => window.removeEventListener('resize', calculate);
  }, [dashboardLoading, setsLoading]);

  // Show loading skeleton
  if (!mounted) {
    return (
      <AuthenticatedLayout sidebar="main" title="Dashboard • ReBabel">
        <DashboardSkeleton />
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      sidebar="main"
      title="Dashboard • ReBabel"
      variant="fixed"
      mainClassName="min-h-0 overflow-hidden"
    >
      <PageHeader
        title={
          <div>
            <div className="flex items-center gap-3">
              {/* Japanese date */}
              <span
                className="relative text-2xl text-gray-900 dark:text-white inline-flex items-baseline"
                style={{ fontFeatureSettings: '"palt"' }}
              >
                <span className="font-bold">{jpDate.monthNum}</span>
                <ruby>
                  <span
                    className="font-medium"
                    style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif' }}
                  >
                    月
                  </span>
                  <rp>(</rp>
                  <rt className={jpDate.rtClass}>{jpDate.monthKanjiReading}</rt>
                  <rp>)</rp>
                </ruby>
                <span className="font-bold">{jpDate.dayNum}</span>
                <ruby>
                  <span
                    className="font-medium"
                    style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif' }}
                  >
                    日
                  </span>
                  <rp>(</rp>
                  <rt className={jpDate.rtClass}>{jpDate.dayKanjiReading}</rt>
                  <rp>)</rp>
                </ruby>
                <span className="absolute left-0 top-full -mt-1 text-[0.55rem] text-gray-400 dark:text-gray-500 font-medium tracking-wider uppercase whitespace-nowrap">
                  {jpDate.englishDate}
                </span>
                <span
                  className="inline-block w-[5px] h-[5px] rounded-full bg-gray-400 dark:bg-gray-500 mx-2"
                  style={{ verticalAlign: '0.3em' }}
                />
                <ruby>
                  <span
                    className="font-medium"
                    style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif' }}
                  >
                    {jpDate.dowKanji}
                  </span>
                  <rp>(</rp>
                  <rt className={jpDate.rtClass}>{jpDate.dowReading}</rt>
                  <rp>)</rp>
                </ruby>
                <ruby>
                  <span
                    className="font-medium"
                    style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif' }}
                  >
                    曜
                  </span>
                  <rp>(</rp>
                  <rt className={jpDate.rtClass}>よう</rt>
                  <rp>)</rp>
                </ruby>
                <ruby>
                  <span
                    className="font-medium"
                    style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif' }}
                  >
                    日
                  </span>
                  <rp>(</rp>
                  <rt className={jpDate.rtClass}>び</rt>
                  <rp>)</rp>
                </ruby>
              </span>

              {/* Divider */}
              <div className="w-px self-stretch bg-gray-300 dark:bg-gray-600" />

              {/* Greeting */}
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {greeting}
              </span>

              {/* Meta pills */}
              {userData.currentStreak != null && userData.currentStreak > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-semibold">
                  <FaFire className="text-xs" />
                  <span>{userData.currentStreak} day streak</span>
                </div>
              )}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs font-medium transition-opacity duration-200"
                style={{
                  opacity: !setsLoading && sets.length > 0 ? 1 : 0,
                  pointerEvents:
                    !setsLoading && sets.length > 0 ? 'auto' : 'none',
                }}
              >
                <TbCards className="text-xs" />
                <span>{sets.length} sets</span>
              </div>
            </div>
          </div>
        }
        actions={
          <>
            <Link
              href="/learn/academy/sets/fast-review"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:brightness-110 hover:ring-2 hover:ring-[#667eea]/40 transition-all duration-200"
              style={{
                opacity: !dueLoading && totalDueItems > 0 ? 1 : 0,
                pointerEvents:
                  !dueLoading && totalDueItems > 0 ? 'auto' : 'none',
                maxHeight: !dueLoading && totalDueItems > 0 ? '3rem' : '0',
                overflow: 'hidden',
              }}
            >
              <HiOutlineLightningBolt className="text-base" />
              <span>Review Due</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-white/20 text-white min-w-[1.5rem] text-center">
                {totalDueItems}
              </span>
            </Link>
            <Link
              href="/learn/academy/resources"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-brand-pink to-[#c1084d] text-white hover:brightness-110 hover:ring-2 hover:ring-brand-pink/40 transition-all"
            >
              <TbBooks className="text-base" />
              <span>Guide</span>
            </Link>
          </>
        }
      />

      {/* Mobile header */}
      <div className="lg:hidden px-4 pt-[max(1rem,var(--cap-safe-top))] pb-4">
        <div className="flex items-baseline gap-2.5 text-lg sm:text-xl md:text-2xl">
          <span
            className="relative text-gray-900 dark:text-white inline-flex items-baseline"
            style={{ fontFeatureSettings: '"palt"' }}
          >
            <span className="font-bold">{jpDate.monthNum}</span>
            <ruby>
              <span
                className="font-medium"
                style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif' }}
              >
                月
              </span>
              <rp>(</rp>
              <rt className={jpDate.rtClass}>{jpDate.monthKanjiReading}</rt>
              <rp>)</rp>
            </ruby>
            <span className="font-bold">{jpDate.dayNum}</span>
            <ruby>
              <span
                className="font-medium"
                style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif' }}
              >
                日
              </span>
              <rp>(</rp>
              <rt className={jpDate.rtClass}>{jpDate.dayKanjiReading}</rt>
              <rp>)</rp>
            </ruby>
            <span className="absolute left-0 top-full -mt-1 text-[0.5rem] text-gray-400 dark:text-gray-500 font-medium tracking-wider uppercase whitespace-nowrap">
              {jpDate.englishDate}
            </span>
            <span
              className="inline-block w-[4px] h-[4px] rounded-full bg-gray-400 dark:bg-gray-500 mx-1.5"
              style={{ verticalAlign: '0.25em' }}
            />
            <ruby>
              <span
                className="font-medium"
                style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif' }}
              >
                {jpDate.dowKanji}
              </span>
              <rp>(</rp>
              <rt className={jpDate.rtClass}>{jpDate.dowReading}</rt>
              <rp>)</rp>
            </ruby>
            <ruby>
              <span
                className="font-medium"
                style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif' }}
              >
                曜
              </span>
              <rp>(</rp>
              <rt className={jpDate.rtClass}>よう</rt>
              <rp>)</rp>
            </ruby>
            <ruby>
              <span
                className="font-medium"
                style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif' }}
              >
                日
              </span>
              <rp>(</rp>
              <rt className={jpDate.rtClass}>び</rt>
              <rp>)</rp>
            </ruby>
          </span>
          <span className="inline-block w-px h-[1.1em] bg-gray-300 dark:bg-gray-600 align-baseline translate-y-[0.15em]" />
          <span className="font-bold text-gray-900 dark:text-white">
            {greeting}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto lg:pt-4">
        <div className="px-4 md:p-4 lg:mx-auto lg:w-full lg:max-w-5xl">
          <div className="max-w-5xl mx-auto space-y-4">
            {profileError && (
              <InlineError
                message={profileError}
                onRetry={() => window.location.reload()}
              />
            )}
            {statsError && (
              <InlineError
                message={statsError}
                onRetry={() => window.location.reload()}
              />
            )}
            {/* Tablet-only greeting (hidden on mobile where header handles it, hidden on desktop where PageHeader handles it) */}
            <div className="hidden md:block lg:hidden">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {greeting}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ready to continue your Japanese learning journey?
              </p>
            </div>

            <StatsGrid
              currentStreak={userData.currentStreak}
              longestStreak={userData.longestStreak}
              totalStudyTime={userData.totalStudyTime}
              accuracyRate={userData.accuracyRate}
              cardsReviewed={userData.cardsReviewed}
            />

            {/* Activity Calendar */}
            <div className="bg-white dark:bg-surface-card rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-gray-600 dark:text-gray-400 text-sm" />
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Activity
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                  <span>Less</span>
                  <div className="flex gap-0.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-gray-100 dark:bg-white/[0.07]" />
                    <div className="w-2.5 h-2.5 rounded-sm bg-green-200 dark:bg-green-900" />
                    <div className="w-2.5 h-2.5 rounded-sm bg-green-400 dark:bg-green-700" />
                    <div className="w-2.5 h-2.5 rounded-sm bg-green-600 dark:bg-green-500" />
                    <div className="w-2.5 h-2.5 rounded-sm bg-green-700 dark:bg-green-400" />
                  </div>
                  <span>More</span>
                </div>
              </div>

              {userData.activityData.length > 0 ? (
                <>
                  <ActivityCalendar activityData={userData.activityData} />

                  <div className="mt-3 grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {userData.daysActiveLast60 ??
                          userData.activityData.filter((d) => d.level > 0)
                            .length}
                      </div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">
                        Days Active
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {userData.sessionsCompleted ?? '\u2014'}
                      </div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">
                        Sessions
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {setsLoading
                          ? '\u2014'
                          : sets.reduce((sum, s) => sum + (s.item_num || 0), 0)}
                      </div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">
                        Total Items
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatStudyTime(
                          userData.activityData
                            .slice(-30)
                            .reduce((sum, d) => sum + d.minutes, 0)
                        )}
                      </div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">
                        30 Days
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-16 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
                  {dashboardLoading ? 'Loading...' : 'No activity yet'}
                </div>
              )}
            </div>

            {/* Quick Actions - Mobile only */}
            <div className="md:hidden flex gap-2">
              {!dueLoading && totalDueItems > 0 ? (
                <Link
                  href="/learn/academy/sets/fast-review"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white transition-all"
                >
                  <HiOutlineLightningBolt className="text-base" />
                  <span>Fast Review</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-white/20 min-w-[1.5rem] text-center">
                    {totalDueItems}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/learn/academy/practice"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-pink to-[#c1084d] text-white transition-all"
                >
                  <LuTextCursorInput className="text-base" />
                  <span>Study Translating</span>
                </Link>
              )}
              <Link
                href="/learn/academy/sets"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 transition-all"
              >
                <FaRegFolderOpen className="text-sm" />
                <span>View Sets</span>
              </Link>
            </div>

            <RecentSetsSection
              sets={sets}
              setsLoading={setsLoading}
              setsError={setsError}
              visibleSetCount={visibleSetCount}
              setsCardRef={setsCardRef}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();
