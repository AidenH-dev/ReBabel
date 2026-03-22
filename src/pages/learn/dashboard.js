// pages/learn/academy/dashboard.js
import Head from 'next/head';
import Link from 'next/link';
import MainSidebar from '../../components/Sidebars/MainSidebar';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import {
  FaFire,
  FaClock,
  FaCheck,
  FaCalendarAlt,
  FaPlus,
} from 'react-icons/fa';
import { TbCards, TbRepeat, TbBooks } from 'react-icons/tb';
import { FiPlay, FiChevronRight } from 'react-icons/fi';
import { FaRegFolderOpen } from 'react-icons/fa6';
import { HiOutlineLightningBolt } from 'react-icons/hi';
import { LuTextCursorInput } from 'react-icons/lu';
import PageHeader from '../../components/ui/PageHeader';
import SetRow from '../../components/ui/SetRow';
import { clientLog } from '@/lib/clientLogger';

function ActivityCalendar({ activityData }) {
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);
  const [maxWeeks, setMaxWeeks] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      // cell = 10px (w-2.5), gap = 2px (gap-0.5), plus 1px padding each side
      setMaxWeeks(Math.floor((w + 2) / 12));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getColorClass = (level) => {
    if (level === 0) return 'bg-gray-100 dark:bg-white/[0.07]';
    if (level === 1) return 'bg-green-200 dark:bg-green-900';
    if (level === 2) return 'bg-green-400 dark:bg-green-700';
    if (level === 3) return 'bg-green-600 dark:bg-green-500';
    return 'bg-green-700 dark:bg-green-400';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const showTooltip = (e, day) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      date: day.date,
      minutes: day.minutes,
      x: rect.left + rect.width / 2,
      y: rect.top - 4,
    });
  };

  const hideTooltip = () => setTooltip(null);

  // Group by week
  const weeks = [];
  for (let i = 0; i < activityData.length; i += 7) {
    weeks.push(activityData.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto" ref={containerRef}>
      {tooltip &&
        createPortal(
          <div
            className="fixed z-50 px-2 py-1 rounded-md bg-gray-900 dark:bg-gray-700 text-white text-[10px] leading-tight whitespace-nowrap pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-medium">{formatDate(tooltip.date)}</div>
            <div className="text-gray-300">
              {tooltip.minutes > 0
                ? `${tooltip.minutes} min studied`
                : 'No activity'}
            </div>
          </div>,
          document.body
        )}
      <div className="inline-flex gap-0.5 p-px">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-0.5">
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-2.5 h-2.5 rounded-sm ${getColorClass(day.level)} transition-all hover:ring-1 hover:ring-brand-pink cursor-pointer`}
                onMouseEnter={(e) => showTooltip(e, day)}
                onMouseLeave={hideTooltip}
                onClick={(e) => showTooltip(e, day)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// [number reading, がつ/にち suffix reading]
const MONTH_READINGS = [
  ['いち', 'がつ'],
  ['に', 'がつ'],
  ['さん', 'がつ'],
  ['し', 'がつ'],
  ['ご', 'がつ'],
  ['ろく', 'がつ'],
  ['しち', 'がつ'],
  ['はち', 'がつ'],
  ['く', 'がつ'],
  ['じゅう', 'がつ'],
  ['じゅういち', 'がつ'],
  ['じゅうに', 'がつ'],
];

// [number reading, にち suffix reading] — irregular days have combined readings
const DAY_READINGS = [
  ['', ''],
  ['ついた', 'ち'],
  ['ふつ', 'か'],
  ['みっ', 'か'],
  ['よっ', 'か'],
  ['いつ', 'か'],
  ['むい', 'か'],
  ['なの', 'か'],
  ['よう', 'か'],
  ['ここの', 'か'],
  ['とお', 'か'],
  ['じゅういち', 'にち'],
  ['じゅうに', 'にち'],
  ['じゅうさん', 'にち'],
  ['じゅうよっ', 'か'],
  ['じゅうご', 'にち'],
  ['じゅうろく', 'にち'],
  ['じゅうしち', 'にち'],
  ['じゅうはち', 'にち'],
  ['じゅうく', 'にち'],
  ['はつ', 'か'],
  ['にじゅういち', 'にち'],
  ['にじゅうに', 'にち'],
  ['にじゅうさん', 'にち'],
  ['にじゅうよっ', 'か'],
  ['にじゅうご', 'にち'],
  ['にじゅうろく', 'にち'],
  ['にじゅうしち', 'にち'],
  ['にじゅうはち', 'にち'],
  ['にじゅうく', 'にち'],
  ['さんじゅう', 'にち'],
  ['さんじゅういち', 'にち'],
];

const DOW_KANJI = ['日', '月', '火', '水', '木', '金', '土'];
const DOW_READINGS = ['にち', 'げつ', 'か', 'すい', 'もく', 'きん', 'ど'];

function useJapaneseDate() {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();
  const dow = now.getDay();

  const monthNum = `${month + 1}`;
  const dayNum = `${day}`;
  const dowKanji = DOW_KANJI[dow];

  const [monthNumReading, monthKanjiReading] = MONTH_READINGS[month];
  const [dayNumReading, dayKanjiReading] = DAY_READINGS[day];
  const dowReading = DOW_READINGS[dow];

  const englishDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const rtClass =
    'text-[0.55rem] font-normal text-gray-400 dark:text-gray-500 [ruby-align:center]';

  return {
    monthNum,
    dayNum,
    dowKanji,
    monthNumReading,
    monthKanjiReading,
    dayNumReading,
    dayKanjiReading,
    dowReading,
    englishDate,
    rtClass,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const jpDate = useJapaneseDate();
  const [userProfile, setUserProfile] = useState(null);
  const [greeting, setGreeting] = useState('Hello');
  const [mounted, setMounted] = useState(false);

  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Sets state
  const [sets, setSets] = useState([]);
  const [setsLoading, setSetsLoading] = useState(true);
  const [totalDueItems, setTotalDueItems] = useState(0);
  const [dueLoading, setDueLoading] = useState(true);
  const setsCardRef = useRef(null);
  const [visibleSetCount, setVisibleSetCount] = useState(3);

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
        clientLog.error('dashboard.fetch_failed', {
          endpoint: '/api/auth/me',
          error: error?.message || String(error),
        });
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
              date:
                record.data.last_studied ||
                record.data.date_created ||
                record.data.updated_at,
              set_type: record.data.set_type || null,
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          setSets(formatted);
        }
      } catch (err) {
        clientLog.error('dashboard.fetch_failed', {
          endpoint: '/api/database/v2/sets/retrieve-list',
          error: err?.message || String(err),
        });
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
        clientLog.error('dashboard.fetch_failed', {
          endpoint: '/api/database/v2/srs/all-due',
          error: err?.message || String(err),
        });
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
        clientLog.error('dashboard.fetch_failed', {
          endpoint: '/api/analytics/user/dashboard',
          error: err?.message || String(err),
        });
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboard();
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
      <div className="flex min-h-screen bg-gray-50 dark:bg-surface-page">
        <MainSidebar />

        <main className="ml-auto flex-1 flex flex-col">
          <Head>
            <title>Dashboard • ReBabel</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>

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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                        <div className="mt-3 flex items-center gap-2">
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
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50 dark:bg-surface-page">
      <MainSidebar />

      <main className="ml-auto flex-1 flex flex-col min-h-0 overflow-hidden">
        <Head>
          <title>Dashboard • ReBabel</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <PageHeader
          title={
            <div>
              <div className="flex items-center gap-3">
                {/* Japanese date */}
                <span
                  className="relative text-2xl text-gray-900 dark:text-white"
                  style={{ fontFeatureSettings: '"palt"' }}
                >
                  <ruby>
                    <span className="font-bold">{jpDate.monthNum}</span>
                    <rp>(</rp>
                    <rt className={jpDate.rtClass}>{jpDate.monthNumReading}</rt>
                    <rp>)</rp>
                  </ruby>
                  <ruby>
                    <span
                      className="font-medium"
                      style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif' }}
                    >
                      月
                    </span>
                    <rp>(</rp>
                    <rt className={jpDate.rtClass}>
                      {jpDate.monthKanjiReading}
                    </rt>
                    <rp>)</rp>
                  </ruby>
                  <ruby>
                    <span className="font-bold">{jpDate.dayNum}</span>
                    <rp>(</rp>
                    <rt className={jpDate.rtClass}>{jpDate.dayNumReading}</rt>
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
                {userData.currentStreak != null &&
                  userData.currentStreak > 0 && (
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
              className="relative text-gray-900 dark:text-white"
              style={{ fontFeatureSettings: '"palt"' }}
            >
              <ruby>
                <span className="font-bold">{jpDate.monthNum}</span>
                <rp>(</rp>
                <rt className={jpDate.rtClass}>{jpDate.monthNumReading}</rt>
                <rp>)</rp>
              </ruby>
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
              <ruby>
                <span className="font-bold">{jpDate.dayNum}</span>
                <rp>(</rp>
                <rt className={jpDate.rtClass}>{jpDate.dayNumReading}</rt>
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
              {/* Tablet-only greeting (hidden on mobile where header handles it, hidden on desktop where PageHeader handles it) */}
              <div className="hidden md:block lg:hidden">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {greeting}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ready to continue your Japanese learning journey?
                </p>
              </div>

              {/* Compact Stats Row - Desktop only */}
              <div className="hidden md:grid md:grid-cols-4 gap-3">
                {/* Streak Card */}
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-3 text-white shadow">
                  <div className="flex items-center justify-between mb-1">
                    <FaFire className="text-lg" />
                    <div className="text-right">
                      <div className="text-[10px] opacity-75">Longest</div>
                      <div className="text-sm font-bold">
                        {userData.longestStreak ?? '—'}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">
                    {userData.currentStreak ?? '—'}
                  </div>
                  <p className="text-[10px] opacity-90">day streak</p>
                </div>

                {/* Study Time */}
                <div className="bg-white dark:bg-surface-card rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FaClock className="text-xs text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {userData.totalStudyTime ?? '—'}
                  </div>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    Total Study Time
                  </p>
                </div>

                {/* Accuracy */}
                <div className="bg-white dark:bg-surface-card rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <FaCheck className="text-xs text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {userData.accuracyRate != null
                      ? `${userData.accuracyRate}%`
                      : '—'}
                  </div>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    Accuracy Rate
                  </p>
                </div>

                {/* Items Reviewed */}
                <div className="bg-white dark:bg-surface-card rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <TbCards className="text-xs text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {userData.cardsReviewed ?? '—'}
                  </div>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    Items Reviewed
                  </p>
                </div>
              </div>

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
                            : sets.reduce(
                                (sum, s) => sum + (s.item_num || 0),
                                0
                              )}
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

              {/* Compact Stats - Mobile only */}
              <div className="md:hidden bg-white dark:bg-surface-card rounded-lg p-3 shadow-sm">
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

              {/* Recent Sets */}
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
                ) : sets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center text-sm text-black/70 dark:text-white/70">
                    <p className="mb-3">You don&apos;t have any sets yet.</p>
                    <button
                      onClick={() => router.push('/learn/academy/sets/create')}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-brand-pink text-white hover:opacity-95"
                    >
                      <FaPlus /> Create your first set
                    </button>
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
                          <span className="text-xs font-medium">
                            Create or Import
                          </span>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
