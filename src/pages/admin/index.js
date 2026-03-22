// Implements SPEC-DB-004 (UI layer — Platform Metrics admin dashboard)
import Head from 'next/head';
import AdminSidebar from '@/components/Sidebars/AdminSidebar';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { FaShieldAlt } from 'react-icons/fa';
import { TbLoader3 } from 'react-icons/tb';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Returns a YYYY-MM-DD string for a date that is `offsetDays` before today (UTC).
function utcDateString(offsetDays = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

// Quick-select presets
const DATE_PRESETS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

function AdminPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Platform-metrics state
  const [metrics, setMetrics] = useState(null); // { total_users, daily[] }
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);

  // Date range — controlled inputs
  const [startDate, setStartDate] = useState(() => utcDateString(29));
  const [endDate, setEndDate] = useState(() => utcDateString(0));
  const [activePreset, setActivePreset] = useState(30);

  // --- Auth check ---
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/api/auth/login');
      return;
    }

    const isAdmin =
      user?.['https://rebabel.org/app_metadata']?.isAdmin || false;
    if (!isAdmin) {
      router.push('/');
      return;
    }

    setIsAuthorized(true);
  }, [user, isLoading, router]);

  // --- Data fetching ---
  const fetchMetrics = useCallback(async (start, end) => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const res = await fetch(
        `/api/admin/platform-metrics?start_date=${start}&end_date=${end}`
      );
      const json = await res.json();
      if (!res.ok) {
        setMetricsError(json.error || 'Failed to load metrics.');
        setMetrics(null);
      } else {
        setMetrics(json.message);
      }
    } catch (err) {
      setMetricsError('Network error — could not fetch metrics.');
      setMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Fetch on auth or date change
  useEffect(() => {
    if (!isAuthorized) return;
    fetchMetrics(startDate, endDate);
  }, [isAuthorized, startDate, endDate, fetchMetrics]);

  // Preset button handler
  const handlePreset = (days) => {
    setActivePreset(days);
    setStartDate(utcDateString(days - 1));
    setEndDate(utcDateString(0));
  };

  // Custom date input handler — clears preset highlight
  const handleStartChange = (e) => {
    setActivePreset(null);
    setStartDate(e.target.value);
  };
  const handleEndChange = (e) => {
    setActivePreset(null);
    setEndDate(e.target.value);
  };

  // --- Derived headline values ---
  const totalUsers = metrics?.total_users ?? null;

  const daily = metrics?.daily || [];

  const newSignups = daily.reduce((sum, d) => sum + (d.signups || 0), 0);

  const avgDauStudy =
    daily.length > 0
      ? Math.round(
          daily.reduce((sum, d) => sum + (d.dau_study || 0), 0) / daily.length
        )
      : null;

  // --- Chart data ---
  const chartData = useMemo(() => {
    if (!daily.length) return null;

    const labels = daily.map((d) => {
      // Show as "Mar 7" style for readability
      const date = new Date(d.date + 'T00:00:00Z');
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
    });

    return {
      labels,
      datasets: [
        {
          label: 'DAU (Visit)',
          data: daily.map((d) => d.dau_visit),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: daily.length > 60 ? 0 : 3,
          pointHoverRadius: 5,
        },
        {
          label: 'DAU (Study)',
          data: daily.map((d) => d.dau_study),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: daily.length > 60 ? 0 : 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Signups',
          data: daily.map((d) => d.signups),
          borderColor: 'var(--brand-pink)',
          backgroundColor: 'rgba(227, 10, 95, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: daily.length > 60 ? 0 : 3,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [daily]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            color: '#9ca3af',
            font: { size: 12 },
          },
        },
        tooltip: {
          backgroundColor: 'var(--surface-card)',
          titleColor: '#fff',
          bodyColor: '#d1d5db',
          borderColor: '#374151',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            title: (items) => {
              if (!items.length) return '';
              const idx = items[0].dataIndex;
              return daily[idx]?.date || '';
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#6b7280',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12,
            font: { size: 11 },
          },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#6b7280',
            precision: 0,
            font: { size: 11 },
          },
          grid: {
            color: 'rgba(107, 114, 128, 0.15)',
          },
        },
      },
    }),
    [daily]
  );

  // --- Loading / unauthorized screen ---
  if (isLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-surface-elevated">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  // Range label for card headers
  const rangeLabel = activePreset
    ? `${activePreset}d`
    : `${startDate} — ${endDate}`;

  return (
    <>
      <Head>
        <title>Admin - ReBabel</title>
      </Head>
      <div className="flex flex-row min-h-screen bg-white dark:bg-surface-elevated text-[#4e4a4a] dark:text-white">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-6 md:p-8">
            {/* ── Header ── */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <FaShieldAlt className="text-xl text-brand-pink" />
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                System administration and monitoring
              </p>
            </div>

            {/* ── Headline Stat Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-surface-card rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Users
                </p>
                {metricsLoading ? (
                  <TbLoader3 className="text-2xl text-brand-pink animate-spin" />
                ) : (
                  <p className="text-2xl font-bold text-brand-pink">
                    {totalUsers !== null ? totalUsers.toLocaleString() : '—'}
                  </p>
                )}
              </div>
              <div className="bg-white dark:bg-surface-card rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  New Signups ({rangeLabel})
                </p>
                {metricsLoading ? (
                  <TbLoader3 className="text-2xl text-blue-500 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {newSignups.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="bg-white dark:bg-surface-card rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Avg DAU — Study ({rangeLabel})
                </p>
                {metricsLoading ? (
                  <TbLoader3 className="text-2xl text-green-500 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {avgDauStudy !== null ? avgDauStudy.toLocaleString() : '—'}
                  </p>
                )}
              </div>
            </div>

            {/* ── Platform Metrics Section ── */}
            <div className="bg-white dark:bg-surface-card rounded-lg border border-gray-200 dark:border-gray-800">
              {/* Header with date controls */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <h2 className="text-lg font-semibold">Platform Metrics</h2>

                  {/* Quick presets */}
                  <div className="flex items-center gap-2">
                    {DATE_PRESETS.map(({ label, days }) => (
                      <button
                        key={label}
                        onClick={() => handlePreset(days)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink ${
                          activePreset === days
                            ? 'bg-brand-pink text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date range inputs */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="text-gray-500 dark:text-gray-400">
                    From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={handleStartChange}
                    max={endDate}
                    className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-elevated text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
                  />
                  <label className="text-gray-500 dark:text-gray-400">to</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={handleEndChange}
                    min={startDate}
                    max={utcDateString(0)}
                    className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-elevated text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
                  />
                </div>
              </div>

              {/* Error banner */}
              {metricsError && (
                <div className="mx-6 mt-4 px-4 py-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                  {metricsError}
                </div>
              )}

              {/* Loading */}
              {metricsLoading && (
                <div className="flex items-center justify-center py-16">
                  <TbLoader3 className="text-3xl text-brand-pink animate-spin mr-2" />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    Loading metrics...
                  </span>
                </div>
              )}

              {/* Line chart */}
              {!metricsLoading && !metricsError && chartData && (
                <div className="px-6 py-6">
                  <div className="h-80">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!metricsLoading &&
                !metricsError &&
                !chartData &&
                metrics !== null && (
                  <div className="py-16 text-center text-gray-400 dark:text-gray-600 text-sm">
                    No data available for this date range.
                  </div>
                )}

              {/* Initial state */}
              {!metricsLoading && !metricsError && metrics === null && (
                <div className="py-16 text-center text-gray-400 dark:text-gray-600 text-sm">
                  No metrics loaded.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default AdminPage;
