// pages/learn/academy/dashboard.js
import Head from 'next/head';
import Link from 'next/link';
import MainSidebar from '../../components/Sidebars/MainSidebar';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  FaFire,
  FaClock,
  FaCheck,
  FaCalendarAlt,
  FaPlus,
} from 'react-icons/fa';
import { TbCards, TbRepeat } from 'react-icons/tb';
import { FiPlay, FiChevronRight } from 'react-icons/fi';
import { FaRegFolderOpen } from 'react-icons/fa6';

function ActivityCalendar({ activityData }) {
  const getColorClass = (level) => {
    if (level === 0) return 'bg-gray-100 dark:bg-white/[0.07]';
    if (level === 1) return 'bg-green-200 dark:bg-green-900';
    if (level === 2) return 'bg-green-400 dark:bg-green-700';
    if (level === 3) return 'bg-green-600 dark:bg-green-500';
    return 'bg-green-700 dark:bg-green-400';
  };

  // Group by week
  const weeks = [];
  for (let i = 0; i < activityData.length; i += 7) {
    weeks.push(activityData.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-0.5 p-px">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-0.5">
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-2.5 h-2.5 rounded-sm ${getColorClass(day.level)} transition-all hover:ring-1 hover:ring-[#e30a5f] cursor-pointer`}
                title={`${day.date}: ${day.minutes}min`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [greeting, setGreeting] = useState('Hello');
  const [mounted, setMounted] = useState(false);

  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Sets state
  const [sets, setSets] = useState([]);
  const [setsLoading, setSetsLoading] = useState(true);
  const [totalDueItems, setTotalDueItems] = useState(0);
  const [dueLoading, setDueLoading] = useState(true);

  // Initialize with null to distinguish "not yet loaded" from "loaded with zero"
  const [userData, setUserData] = useState({
    name: '',
    currentStreak: null,
    longestStreak: null,
    totalStudyTime: null,
    sessionsCompleted: null,
    daysActiveLast60: null,
    cardsReviewed: null,
    accuracyRate: null,
    activityData: [],
  });

  const formatStudyTime = (minutes) => {
    if (!minutes) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const profile = await response.json();
        setUserProfile(profile);
        if (profile?.name) {
          setUserData((prev) => ({ ...prev, name: profile.name }));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchUserProfile();
  }, []);

  // Fetch sets once we have a userProfile
  useEffect(() => {
    if (!userProfile?.sub) return;
    const fetchSets = async () => {
      setSetsLoading(true);
      try {
        const res = await fetch(
          `/api/database/v2/sets/retrieve-list/${encodeURIComponent(userProfile.sub)}`
        );
        const result = await res.json();
        if (result.success && result.data?.sets) {
          const formatted = result.data.sets
            .map((record) => ({
              id: record.entity_id,
              name: record.data.title || 'Untitled Set',
              item_num: parseInt(record.data.item_num, 10) || 0,
              date: record.data.date_created || record.data.updated_at,
              set_type: record.data.set_type || null,
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          setSets(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch sets:', err);
      } finally {
        setSetsLoading(false);
      }
    };
    fetchSets();
  }, [userProfile]);

  // Fetch total SRS due count
  useEffect(() => {
    if (!userProfile?.sub) return;
    const fetchDueCount = async () => {
      try {
        const res = await fetch('/api/database/v2/srs/all-due?countOnly=true');
        const result = await res.json();
        if (result.success && result.data) {
          setTotalDueItems(result.data.metadata.totalDueItems);
        }
      } catch (err) {
        console.error('Failed to fetch due count:', err);
      } finally {
        setDueLoading(false);
      }
    };
    fetchDueCount();
  }, [userProfile]);

  // Set greeting and mounted state, then fetch real dashboard data
  useEffect(() => {
    setMounted(true);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const fetchDashboard = async () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await fetch(
          `/api/analytics/user/dashboard?timezone=${encodeURIComponent(timezone)}`
        );
        const json = await res.json();
        if (res.ok && json.message) {
          const d = json.message;
          setUserData((prev) => ({
            ...prev,
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
          }));
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Show loading state until client-side hydration is complete
  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
        <MainSidebar />

        <main className="ml-auto flex-1 overflow-y-auto pt-[max(1rem,env(safe-area-inset-top))]">
          <Head>
            <title>Dashboard • ReBabel</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>

          <div className="p-4">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="hidden md:block">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Hello!
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ready to continue your Japanese learning journey?
                </p>
              </div>
              <div className="md:hidden h-2" aria-hidden="true" />

              {/* Compact Stats Row - Desktop only */}
              <div className="hidden md:grid md:grid-cols-4 gap-3">
                {/* Streak Card */}
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-4 text-white shadow">
                  <div className="flex items-center justify-between mb-2">
                    <FaFire className="text-2xl" />
                    <div className="text-right">
                      <div className="text-xs opacity-75">Longest</div>
                      <div className="text-lg font-bold">
                        {userData.longestStreak ?? '—'}
                      </div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-0.5">
                    {userData.currentStreak ?? '—'}
                  </div>
                  <p className="text-xs opacity-90">day streak</p>
                </div>

                {/* Study Time */}
                <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FaClock className="text-sm text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                    {userData.totalStudyTime ?? '—'}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Study Time
                  </p>
                </div>

                {/* Accuracy */}
                <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <FaCheck className="text-sm text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                    {userData.accuracyRate != null
                      ? `${userData.accuracyRate}%`
                      : '—'}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Accuracy Rate
                  </p>
                </div>

                {/* Items Reviewed */}
                <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <TbCards className="text-sm text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                    {userData.cardsReviewed ?? '—'}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Items Reviewed
                  </p>
                </div>
              </div>

              {/* Activity Calendar - Empty state */}
              <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm">
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
                      <div className="w-2.5 h-2.5 rounded-sm bg-gray-100 dark:bg-gray-800" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-green-200 dark:bg-green-900/40" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-green-400 dark:bg-green-700/60" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-green-600 dark:bg-green-600/80" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-green-700 dark:bg-green-500" />
                    </div>
                    <span>More</span>
                  </div>
                </div>

                <div className="h-16 flex items-center justify-center text-gray-400 dark:text-gray-600">
                  Loading...
                </div>
              </div>

              {/* Compact Stats - Mobile only */}
              <div className="md:hidden bg-white dark:bg-[#1c2b35] rounded-lg p-3 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-3 text-white">
                    <div className="flex items-center gap-2">
                      <FaFire className="text-base" />
                      <div>
                        <div className="text-lg font-bold leading-tight">
                          {userData.currentStreak ?? '—'}
                        </div>
                        <p className="text-[10px] opacity-80">Day Streak</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-base text-blue-500" />
                      <div>
                        <div className="text-lg font-bold leading-tight text-gray-900 dark:text-white">
                          {userData.totalStudyTime ?? '—'}
                        </div>
                        <p className="text-[10px] text-gray-500">Study Time</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <FaCheck className="text-base text-green-500" />
                      <div>
                        <div className="text-lg font-bold leading-tight text-gray-900 dark:text-white">
                          {userData.accuracyRate != null
                            ? `${userData.accuracyRate}%`
                            : '—'}
                        </div>
                        <p className="text-[10px] text-gray-500">Accuracy</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <TbCards className="text-base text-purple-500" />
                      <div>
                        <div className="text-lg font-bold leading-tight text-gray-900 dark:text-white">
                          {userData.cardsReviewed ?? '—'}
                        </div>
                        <p className="text-[10px] text-gray-500">Reviewed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Sets – skeleton during SSR hydration */}
              <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold tracking-tight text-[#0f1a1f] dark:text-white">
                    Recent Sets
                  </h2>
                  <div className="h-8 w-24 rounded-lg bg-black/5 dark:bg-white/5 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-lg bg-black/5 dark:bg-white/5 h-24"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
      <MainSidebar />

      <main className="ml-auto flex-1 overflow-y-auto pt-[max(1rem,env(safe-area-inset-top))]">
        <Head>
          <title>Dashboard • ReBabel</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="px-4 md:p-4">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Header */}
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {greeting}
                {/*userData.name ? `, ${userData.name}` : ''*/}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ready to continue your Japanese learning journey?
              </p>
            </div>
            <div className="md:hidden h-2" aria-hidden="true" />

            {/* Compact Stats Row - Desktop only */}
            <div className="hidden md:grid md:grid-cols-4 gap-3">
              {/* Streak Card */}
              <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-4 text-white shadow">
                <div className="flex items-center justify-between mb-2">
                  <FaFire className="text-2xl" />
                  <div className="text-right">
                    <div className="text-xs opacity-75">Longest</div>
                    <div className="text-lg font-bold">
                      {userData.longestStreak ?? '—'}
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-bold mb-0.5">
                  {userData.currentStreak ?? '—'}
                </div>
                <p className="text-xs opacity-90">day streak</p>
              </div>

              {/* Study Time */}
              <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FaClock className="text-sm text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                  {userData.totalStudyTime ?? '—'}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Total Study Time
                </p>
              </div>

              {/* Accuracy */}
              <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <FaCheck className="text-sm text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                  {userData.accuracyRate != null
                    ? `${userData.accuracyRate}%`
                    : '—'}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Accuracy Rate
                </p>
              </div>

              {/* Items Reviewed */}
              <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <TbCards className="text-sm text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                  {userData.cardsReviewed ?? '—'}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Items Reviewed
                </p>
              </div>
            </div>

            {/* Activity Calendar */}
            <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm">
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
                        {userData.sessionsCompleted ?? '—'}
                      </div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">
                        Sessions
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {setsLoading
                          ? '—'
                          : sets.reduce((sum, s) => sum + (s.item_num || 0), 0)}
                      </div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">
                        Total Items
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {Math.round(
                          userData.activityData.reduce(
                            (sum, d) => sum + d.minutes,
                            0
                          ) / 60
                        )}
                        h
                      </div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400">
                        60 Days
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

            {/* Compact Stats - Mobile only */}
            <div className="md:hidden bg-white dark:bg-[#1c2b35] rounded-lg p-3 shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-3 text-white">
                  <div className="flex items-center gap-2">
                    <FaFire className="text-base" />
                    <div>
                      <div className="text-lg font-bold leading-tight">
                        {userData.currentStreak ?? '—'}
                      </div>
                      <p className="text-[10px] opacity-80">Day Streak</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <FaClock className="text-base text-blue-500" />
                    <div>
                      <div className="text-lg font-bold leading-tight text-gray-900 dark:text-white">
                        {userData.totalStudyTime ?? '—'}
                      </div>
                      <p className="text-[10px] text-gray-500">Study Time</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <FaCheck className="text-base text-green-500" />
                    <div>
                      <div className="text-lg font-bold leading-tight text-gray-900 dark:text-white">
                        {userData.accuracyRate != null
                          ? `${userData.accuracyRate}%`
                          : '—'}
                      </div>
                      <p className="text-[10px] text-gray-500">Accuracy</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <TbCards className="text-base text-purple-500" />
                    <div>
                      <div className="text-lg font-bold leading-tight text-gray-900 dark:text-white">
                        {userData.cardsReviewed ?? '—'}
                      </div>
                      <p className="text-[10px] text-gray-500">Reviewed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sets */}
            <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm overflow-hidden">
              {/* Header */}
              <Link
                href="/learn/academy/sets"
                className="mb-4 flex items-center gap-1 w-fit group"
              >
                <h2 className="text-lg font-semibold tracking-tight text-[#0f1a1f] dark:text-white group-hover:text-[#e30a5f] transition-colors">
                  Recent Sets
                </h2>
                <FiChevronRight className="text-gray-400 dark:text-gray-500 text-lg mt-px group-hover:text-[#e30a5f] transition-colors" />
              </Link>

              {/* Fast Review banner */}
              {!dueLoading && totalDueItems > 0 && (
                <div className="mb-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-xl shadow-md px-4 py-3 text-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                      <TbRepeat className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold">Fast Review</p>
                      <p className="text-xs text-white/70">
                        {totalDueItems} item{totalDueItems !== 1 ? 's' : ''} due
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      router.push('/learn/academy/sets/fast-review')
                    }
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-[#667eea] hover:bg-white/90 transition-colors"
                  >
                    <TbRepeat className="text-base" /> Review {totalDueItems}
                  </button>
                </div>
              )}

              {/* Sets */}
              {setsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-lg bg-black/5 dark:bg-white/5 h-24"
                    />
                  ))}
                </div>
              ) : sets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center text-sm text-black/70 dark:text-white/70">
                  <p className="mb-3">You don&apos;t have any sets yet.</p>
                  <button
                    onClick={() => router.push('/learn/academy/sets/create')}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-[#e30a5f] text-white hover:opacity-95"
                  >
                    <FaPlus /> Create your first set
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {sets.slice(0, 3).map((set) => {
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
                          className="group rounded-lg border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-[#1d2a32] p-3 transition-all hover:shadow-sm focus-within:ring-2 focus-within:ring-[#e30a5f]"
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
                          <div className="mt-3 flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
