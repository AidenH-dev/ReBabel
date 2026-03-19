import Head from 'next/head';
import AcademySidebar from '@/components/Sidebars/AcademySidebar';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useRouter } from 'next/router';
import { FaPlus, FaFire, FaClock, FaChartLine } from 'react-icons/fa';
import {
  FiSearch,
  FiGrid,
  FiList,
  FiPlay,
  FiEdit2,
  FiExternalLink,
  FiClock,
  FiAlertCircle,
} from 'react-icons/fi';
import {
  TbRepeat,
  TbStack2,
  TbArrowsSort,
  TbArrowUp,
  TbArrowDown,
} from 'react-icons/tb';
import PageHeader from '@/components/ui/PageHeader';
import { MdAutorenew } from 'react-icons/md';
import { BeginnerPackPopup } from '@/components/popups/sets/newUserPopup';
import CustomSelect from '@/components/ui/CustomSelect';
import { HiOutlineLightningBolt } from 'react-icons/hi';
import { FaRegFolderOpen } from 'react-icons/fa6';
import { TiChartPieOutline } from 'react-icons/ti';
import { useUserPreferences } from '@/contexts/PreferencesContext';
import SetsSrsOverview from '@/components/SRS/sets-srs-overview';

export default function VocabularyDashboard() {
  // Tabs: "srs" | "sets" | "groups"
  const [activeTab, setActiveTabState] = useState('sets');

  // Persist active tab
  useEffect(() => {
    const saved = localStorage.getItem('sets-active-tab');
    if (saved === 'srs' || saved === 'sets') setActiveTabState(saved);
  }, []);
  const setActiveTab = (v) => {
    setActiveTabState(v);
    localStorage.setItem('sets-active-tab', v);
  };

  // Search inputs
  const [searchSets, setSearchSets] = useState('');
  const [searchTags, setSearchTags] = useState('');

  // UI state
  const [sortKey, setSortKeyState] = useState('recent'); // recent | az | size
  const [sizeDesc, setSizeDescState] = useState(true); // true = largest first, false = smallest first
  const [view, setViewState] = useState('grid'); // grid | list
  const [showAll, setShowAll] = useState(false);
  const [typeFilter, setTypeFilter] = useState(new Set(['vocab', 'grammar'])); // Set of active types

  // Sync preferences with server
  const { savePreference } = useUserPreferences((serverPrefs) => {
    if (serverPrefs.sets_view) setViewState(serverPrefs.sets_view);
    if (serverPrefs.sets_sort) setSortKeyState(serverPrefs.sets_sort);
    if (serverPrefs.sets_size_desc !== undefined)
      setSizeDescState(serverPrefs.sets_size_desc !== 'false');
  });

  // Load saved preferences from localStorage on mount (instant, before server responds)
  useEffect(() => {
    const savedView = localStorage.getItem('sets-view');
    if (savedView === 'grid' || savedView === 'list') setViewState(savedView);
    const savedSort = localStorage.getItem('sets-sort');
    if (savedSort === 'recent' || savedSort === 'az' || savedSort === 'size')
      setSortKeyState(savedSort);
    const savedSizeDir = localStorage.getItem('sets-size-desc');
    if (savedSizeDir !== null) setSizeDescState(savedSizeDir !== 'false');
  }, []);

  const setView = (v) => {
    setViewState(v);
    localStorage.setItem('sets-view', v);
    savePreference('sets_view', v);
  };

  const setSortKey = (v) => {
    setSortKeyState(v);
    localStorage.setItem('sets-sort', v);
    savePreference('sets_sort', v);
  };

  const toggleTypeFilter = (type) => {
    setTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        // Don't allow deselecting both — at least one must stay active
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const setSizeDesc = (v) => {
    setSizeDescState(v);
    localStorage.setItem('sets-size-desc', String(v));
    savePreference('sets_size_desc', String(v));
  };

  const [userProfile, setUserProfile] = useState(null);
  const [recentsSets, setRecentsSets] = useState([]);
  const [isLoadingSets, setIsLoadingSets] = useState(true);

  const [showBeginnerPopup, setShowBeginnerPopup] = useState(false);

  // Fast Review state
  const [totalDueItems, setTotalDueItems] = useState(0);
  const [isLoadingDueCount, setIsLoadingDueCount] = useState(true);

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalSets: 0,
    totalItems: 0,
    activeSrsItems: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const router = useRouter();
  const searchRef = useRef(null);

  // Keyboard: focus search with '/'
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Fetch the Auth0 user profile on mount.
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const profile = await response.json();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchUserProfile();
  }, []);

  // Once the user profile is loaded, fetch the user sets from Supabase.
  useEffect(() => {
    const fetchUserSets = async () => {
      if (!(userProfile && userProfile.sub)) return;
      setIsLoadingSets(true);
      try {
        const response = await fetch(
          `/api/database/v2/sets/retrieve-list/${encodeURIComponent(userProfile.sub)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch user sets');
        }

        const formattedData = result.data.sets.map((record) => ({
          id: record.entity_id,
          name: record.data.title || 'Untitled Set',
          item_num: record.data.item_num,
          date: record.data.date_created || record.data.updated_at,
          path: `/learn/academy/set/study/${record.entity_id}`,
          set_type: record.data.set_type || null,
        }));

        formattedData.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentsSets(formattedData);
      } catch (error) {
        console.error('Error fetching user sets:', error);
        setRecentsSets([]);
      } finally {
        setIsLoadingSets(false);
      }
    };
    fetchUserSets();
  }, [userProfile]);

  useEffect(() => {
    if (!isLoadingSets && recentsSets.length === 0 && userProfile) {
      setShowBeginnerPopup(true);
    }
  }, [isLoadingSets, recentsSets, userProfile]);

  // Fetch Fast Review due count — once only
  const dueCountFetched = useRef(false);
  useEffect(() => {
    if (!userProfile || dueCountFetched.current) return;
    dueCountFetched.current = true;

    const fetchDueCount = async () => {
      try {
        const response = await fetch(
          '/api/database/v2/srs/all-due?countOnly=true'
        );
        const result = await response.json();
        if (result.success && result.data) {
          setTotalDueItems(result.data.metadata.totalDueItems);
        }
      } catch (error) {
        console.error('Error fetching due count:', error);
      } finally {
        setIsLoadingDueCount(false);
      }
    };

    fetchDueCount();
  }, [userProfile]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!userProfile) return;

      try {
        const response = await fetch('/api/database/v2/stats/dashboard');
        const result = await response.json();
        if (result.success && result.data) {
          setDashboardStats(result.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, [userProfile]);

  // Helpers
  const fixDateString = (dateString) => {
    if (!dateString) return dateString;
    let fixed = dateString.replace(' ', 'T');
    fixed = fixed.replace(/(\.\d{3})\d+/, '$1');
    fixed = fixed.replace(/([+-]\d\d)$/, '$1:00');
    return fixed;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const d = new Date(fixDateString(dateString));
    return isNaN(d)
      ? 'Unknown date'
      : new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }).format(d);
  };

  // Static groups
  const vocabularyGroups = [
    {
      name: 'Lesson 1 Genki 1',
      path: '/learn/vocabulary/sets?lesson=1',
      terms: 30,
      date: '12/23/2024',
    },
    {
      name: 'Lesson 2 Genki 1',
      path: '/learn/vocabulary/sets?lesson=2',
      terms: 20,
      date: '12/23/2024',
    },
    {
      name: 'Lesson 3 Genki 1',
      path: '/learn/vocabulary/sets?lesson=3',
      terms: 25,
      date: '12/23/2024',
    },
    {
      name: 'Lesson 4 Genki 1',
      path: '/learn/vocabulary/sets?lesson=4',
      terms: 40,
      date: '12/23/2024',
    },
    {
      name: 'Lesson 5 Genki 1',
      path: '/learn/vocabulary/sets?lesson=5',
      terms: 28,
      date: '12/23/2024',
    },
    {
      name: 'Lesson 6 Genki 1',
      path: '/learn/vocabulary/sets?lesson=6',
      terms: 15,
      date: '12/23/2024',
    },
    {
      name: 'Lesson 7 Genki 1',
      path: '/learn/vocabulary/sets?lesson=7',
      terms: 35,
      date: '12/23/2024',
    },
    {
      name: 'Lesson 8 Genki 1',
      path: '/learn/vocabulary/sets?lesson=8',
      terms: 22,
      date: '12/23/2024',
    },
    {
      name: 'Lesson 9 Genki 1',
      path: '/learn/vocabulary/sets?lesson=9',
      terms: 18,
      date: '12/23/2024',
    },
    {
      name: 'Lesson 10 Genki 1',
      path: '/learn/vocabulary/sets?lesson=10',
      terms: 26,
      date: '12/23/2024',
    },
    {
      name: 'Lesson 11 Genki 1',
      path: '/learn/vocabulary/sets?lesson=11',
      terms: 26,
      date: '12/23/2024',
    },
    {
      name: 'Lesson 12 Genki 1',
      path: '/learn/vocabulary/sets?lesson=12',
      terms: 26,
      date: '12/23/2024',
    },
  ];

  // Derived views
  const filteredSets = recentsSets.filter((s) => {
    if (typeFilter.size < 2 && !typeFilter.has(s.set_type)) return false;
    return s.name.toLowerCase().includes(searchSets.toLowerCase());
  });

  const sortedSets = [...filteredSets].sort((a, b) => {
    if (sortKey === 'az') return a.name.localeCompare(b.name);
    if (sortKey === 'size') {
      const diff = (b.item_num || 0) - (a.item_num || 0);
      return sizeDesc ? diff : -diff;
    }
    return new Date(b.date) - new Date(a.date);
  });

  const visibleSets = showAll ? sortedSets : sortedSets.slice(0, 8);

  // Handler for starting Fast Review
  const handleStartFastReview = () => {
    router.push('/learn/academy/sets/fast-review');
  };

  return (
    <div className="flex flex-row h-screen overflow-hidden bg-white dark:bg-[#141f25] text-[#222] dark:text-white">
      {/* Sidebar */}
      <AcademySidebar />

      {/* Main */}
      <main className="ml-auto flex-1 flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-[#141f25]">
        {/* Desktop sticky header with inline stats */}
        <PageHeader
          title="Sets"
          meta={
            isLoadingStats ? (
              <div className="flex items-center gap-3 ml-1 pl-3 border-l border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      {i > 1 && (
                        <span className="text-gray-300 dark:text-gray-600 text-sm">
                          ·
                        </span>
                      )}
                      <div className="h-3.5 w-8 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      <div className="h-3 w-10 rounded bg-gray-100 dark:bg-gray-700/50 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 font-medium ml-1 pl-3 border-l border-gray-300 dark:border-gray-600">
                <StatPill
                  value={dashboardStats.totalSets}
                  label="sets"
                  tooltip="Total study sets"
                />
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <StatPill
                  value={dashboardStats.totalItems}
                  label="items"
                  tooltip="Total items across all sets"
                />
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <StatPill
                  value={dashboardStats.activeSrsItems}
                  label="SRS Active"
                  tooltip="Items tracked by spaced repetition"
                />
                {!isLoadingSets && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600 ml-0.5">
                      |
                    </span>
                    <StatPill
                      value={`${recentsSets.filter((s) => s.set_type === 'vocab').length} V`}
                      tooltip="Vocabulary sets"
                      className="ml-0.5 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold"
                    />
                    <StatPill
                      value={`${recentsSets.filter((s) => s.set_type === 'grammar').length} G`}
                      tooltip="Grammar sets"
                      className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 font-bold"
                    />
                  </>
                )}
              </div>
            )
          }
          actions={
            <>
              {!isLoadingDueCount && totalDueItems > 0 && (
                <button
                  onClick={handleStartFastReview}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:brightness-110 hover:ring-2 hover:ring-[#667eea]/40 transition-all"
                >
                  <HiOutlineLightningBolt className="text-base" />
                  <span>Fast Review</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-white/20 text-white min-w-[1.5rem] text-center">
                    {totalDueItems}
                  </span>
                </button>
              )}
              <Link
                href="/learn/academy/sets/create"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#e30a5f] to-[#c1084d] text-white hover:brightness-110 hover:ring-2 hover:ring-[#e30a5f]/40 transition-all"
              >
                <FaPlus className="text-xs" />
                <span>Create Set</span>
              </Link>
            </>
          }
        />

        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 lg:py-4 pt-[max(2rem,var(--cap-safe-top))] lg:pt-4">
          <BeginnerPackPopup
            isOpen={showBeginnerPopup}
            onClose={() => setShowBeginnerPopup(false)}
            onImport={() => {
              // After successful import, reload to show the new sets
              window.location.reload();
            }}
            userProfile={userProfile}
          />

          <Head>
            <title>Sets</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>
          {/* Desktop stats are now in the PageHeader above */}
          {/* Fast Review Widget - Mobile */}
          {!isLoadingDueCount && totalDueItems > 0 && (
            <div className="mt-5 sm:hidden w-full max-w-6xl mx-auto mb-4">
              <div className="bg-gradient-to-r from-[#667eea]/80 to-[#764ba2]/80 rounded-xl shadow-md px-4 py-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                      <HiOutlineLightningBolt className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold truncate">
                        Fast Review
                      </h2>
                      <p className="text-xs text-white/70 truncate">
                        Review All SRS Item(s) Due
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleStartFastReview}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-white text-[#667eea] hover:bg-white/90"
                  >
                    <MdAutorenew className="text-base" />
                    <span>
                      Review{' '}
                      <span className="text-sm font-md">{totalDueItems}</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Top tabs */}
          <div className="w-full max-w-6xl mx-auto">
            <div className="border-b border-black/5 dark:border-white/10">
              <div className="flex items-end gap-6 -mb-px h-10">
                <button
                  onClick={() => setActiveTab('sets')}
                  className={`pb-2 pt-1 px-1 text-sm font-medium focus:outline-none border-b-2 transition-colors
                  ${
                    activeTab === 'sets'
                      ? 'text-[#e30a5f] border-[#e30a5f]'
                      : 'text-black/70 dark:text-white/80 border-transparent hover:text-black dark:hover:text-white hover:border-[#e30a5f]'
                  }`}
                >
                  View Sets
                </button>
                <button
                  onClick={() => setActiveTab('srs')}
                  className={`pb-2 pt-1 px-1 text-sm font-medium focus:outline-none border-b-2 transition-colors
                  ${
                    activeTab === 'srs'
                      ? 'text-[#e30a5f] border-[#e30a5f]'
                      : 'text-black/70 dark:text-white/80 border-transparent hover:text-black dark:hover:text-white hover:border-[#e30a5f]'
                  }`}
                >
                  SRS
                </button>
              </div>
            </div>
          </div>

          {/* Content panel */}
          <div className="w-full max-w-6xl mx-auto">
            <section className="mt-3 rounded-2xl shadow-sm bg-white dark:bg-[#1c2b35] border border-black/5 dark:border-white/5 p-4 sm:p-6">
              {/* SRS Section — kept mounted to preserve data, hidden when inactive */}
              <div style={{ display: activeTab === 'srs' ? 'block' : 'none' }}>
                <SetsSrsOverview active={activeTab === 'srs'} />
              </div>

              {/* Header row for Notecards (formerly Sets) */}
              {activeTab === 'sets' && (
                <div className="flex flex-col gap-4">
                  {/* Toolbar — desktop: single row / mobile: stats + search then controls */}
                  <div className="flex flex-col gap-2">
                    {/* Mobile stats */}
                    {!isLoadingStats && (
                      <div className="sm:hidden flex items-center gap-3 text-xs text-black/50 dark:text-white/50 pb-2.5 mb-0.5 border-b border-black/10 dark:border-white/10">
                        <span>
                          <span className="text-sm font-bold text-black/80 dark:text-white/80">
                            {dashboardStats.totalSets}
                          </span>{' '}
                          sets
                        </span>
                        <span className="text-black/20 dark:text-white/20">
                          ·
                        </span>
                        <span>
                          <span className="text-sm font-bold text-black/80 dark:text-white/80">
                            {dashboardStats.totalItems}
                          </span>{' '}
                          items
                        </span>
                        <span className="text-black/20 dark:text-white/20">
                          ·
                        </span>
                        <span>
                          <span className="text-sm font-bold text-black/80 dark:text-white/80">
                            {dashboardStats.activeSrsItems}
                          </span>{' '}
                          SRS active
                        </span>
                      </div>
                    )}

                    {/* Row 1: title (desktop only) + search + controls (desktop) */}
                    <div className="flex items-center gap-1.5 sm:gap-3">
                      {/* Title — hidden on mobile */}
                      <h2 className="hidden sm:block text-lg font-semibold tracking-tight text-[#0f1a1f] dark:text-white flex-shrink-0">
                        My Sets
                        {recentsSets.length > 0 && (
                          <span className="ml-2 text-xs font-normal text-black/60 dark:text-white/60">
                            {recentsSets.length}
                          </span>
                        )}
                      </h2>

                      {/* Search */}
                      <div className="relative flex-1 sm:max-w-xs">
                        <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40 text-sm" />
                        <input
                          ref={searchRef}
                          type="text"
                          placeholder="Search..."
                          value={searchSets}
                          onChange={(e) => setSearchSets(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-[#111] dark:text-white pl-8 pr-8 py-1.5 rounded-lg text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f] sm:placeholder:content-['Search…_(/)']"
                        />
                        {searchSets && (
                          <button
                            onClick={() => setSearchSets('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 hover:opacity-90"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Mobile view toggle — next to search */}
                      <div className="flex sm:hidden items-center gap-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-1 flex-shrink-0">
                        <button
                          onClick={() => setView('grid')}
                          className={`p-1.5 rounded-md transition ${
                            view === 'grid'
                              ? 'bg-white dark:bg-[#0f1a1f] text-[#e30a5f] shadow-sm'
                              : 'text-black/60 dark:text-white/60'
                          }`}
                          aria-label="Grid view"
                        >
                          <FiGrid className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setView('list')}
                          className={`p-1.5 rounded-md transition ${
                            view === 'list'
                              ? 'bg-white dark:bg-[#0f1a1f] text-[#e30a5f] shadow-sm'
                              : 'text-black/60 dark:text-white/60'
                          }`}
                          aria-label="List view"
                        >
                          <FiList className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Spacer — desktop only */}
                      <div className="hidden sm:block flex-1" />

                      {/* Controls — desktop only (inline) */}
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-1">
                          {[
                            { value: 'all', label: 'All' },
                            { value: 'vocab', label: 'Vocab' },
                            { value: 'grammar', label: 'Grammar' },
                          ].map((opt) => {
                            const isActive =
                              opt.value === 'all'
                                ? typeFilter.size === 2
                                : typeFilter.has(opt.value) &&
                                  typeFilter.size === 1;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  if (opt.value === 'all')
                                    setTypeFilter(
                                      new Set(['vocab', 'grammar'])
                                    );
                                  else setTypeFilter(new Set([opt.value]));
                                }}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                                  isActive
                                    ? 'bg-white dark:bg-[#0f1a1f] text-[#e30a5f] shadow-sm'
                                    : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-1">
                          <button
                            onClick={() => setSortKey('recent')}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition ${
                              sortKey === 'recent'
                                ? 'bg-white dark:bg-[#0f1a1f] text-[#e30a5f] shadow-sm'
                                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                            }`}
                          >
                            <FiClock className="w-3 h-3" />
                            Recent
                          </button>
                          <button
                            onClick={() => setSortKey('az')}
                            className={`px-2 py-1 rounded-md text-xs font-medium transition ${
                              sortKey === 'az'
                                ? 'bg-white dark:bg-[#0f1a1f] text-[#e30a5f] shadow-sm'
                                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                            }`}
                          >
                            A–Z
                          </button>
                          <button
                            onClick={() => {
                              if (sortKey === 'size') setSizeDesc(!sizeDesc);
                              else setSortKey('size');
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition ${
                              sortKey === 'size'
                                ? 'bg-white dark:bg-[#0f1a1f] text-[#e30a5f] shadow-sm'
                                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                            }`}
                          >
                            {sortKey === 'size' ? (
                              sizeDesc ? (
                                <TbArrowDown className="w-3 h-3" />
                              ) : (
                                <TbArrowUp className="w-3 h-3" />
                              )
                            ) : (
                              <TbArrowsSort className="w-3 h-3" />
                            )}
                            Size
                          </button>
                        </div>

                        <div className="flex items-center gap-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-1">
                          <button
                            onClick={() => setView('grid')}
                            className={`p-1.5 rounded-md transition ${
                              view === 'grid'
                                ? 'bg-white dark:bg-[#0f1a1f] text-[#e30a5f] shadow-sm'
                                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                            }`}
                            aria-label="Grid view"
                          >
                            <FiGrid className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setView('list')}
                            className={`p-1.5 rounded-md transition ${
                              view === 'list'
                                ? 'bg-white dark:bg-[#0f1a1f] text-[#e30a5f] shadow-sm'
                                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                            }`}
                            aria-label="List view"
                          >
                            <FiList className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: controls — mobile only */}
                    <div className="flex sm:hidden items-center gap-2 overflow-x-auto">
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleTypeFilter('vocab')}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                            typeFilter.has('vocab')
                              ? 'border-blue-300/50 dark:border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 text-blue-600/80 dark:text-blue-400/80'
                              : 'border-black/10 dark:border-white/10 text-black/30 dark:text-white/30'
                          }`}
                        >
                          Vocab
                        </button>
                        <button
                          onClick={() => toggleTypeFilter('grammar')}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                            typeFilter.has('grammar')
                              ? 'border-green-300/50 dark:border-green-500/30 bg-green-500/5 dark:bg-green-500/10 text-green-600/80 dark:text-green-400/80'
                              : 'border-black/10 dark:border-white/10 text-black/30 dark:text-white/30'
                          }`}
                        >
                          Grammar
                        </button>
                      </div>

                      {/* Spacer */}
                      <div className="flex-1" />

                      <div className="flex items-center gap-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-1 flex-shrink-0">
                        <button
                          onClick={() => setSortKey('recent')}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition ${
                            sortKey === 'recent'
                              ? 'bg-white dark:bg-[#0f1a1f] text-[#e30a5f] shadow-sm'
                              : 'text-black/60 dark:text-white/60'
                          }`}
                        >
                          <FiClock className="w-3 h-3" />
                          Recent
                        </button>
                        <button
                          onClick={() => setSortKey('az')}
                          className={`px-2 py-1 rounded-md text-xs font-medium transition ${
                            sortKey === 'az'
                              ? 'bg-white dark:bg-[#0f1a1f] text-[#e30a5f] shadow-sm'
                              : 'text-black/60 dark:text-white/60'
                          }`}
                        >
                          A–Z
                        </button>
                        <button
                          onClick={() => {
                            if (sortKey === 'size') setSizeDesc(!sizeDesc);
                            else setSortKey('size');
                          }}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition ${
                            sortKey === 'size'
                              ? 'bg-white dark:bg-[#0f1a1f] text-[#e30a5f] shadow-sm'
                              : 'text-black/60 dark:text-white/60'
                          }`}
                        >
                          {sortKey === 'size' ? (
                            sizeDesc ? (
                              <TbArrowDown className="w-3 h-3" />
                            ) : (
                              <TbArrowUp className="w-3 h-3" />
                            )
                          ) : (
                            <TbArrowsSort className="w-3 h-3" />
                          )}
                          Size
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="mt-1">
                    {/* Empty state */}
                    {!isLoadingSets && recentsSets.length === 0 && (
                      <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center text-sm text-black/70 dark:text-white/70">
                        <p className="mb-3">
                          You don&apos;t have any sets yet.
                        </p>
                        <button
                          onClick={() =>
                            router.push('/learn/academy/sets/create')
                          }
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-[#e30a5f] text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                        >
                          <FaPlus /> Create your first set
                        </button>
                      </div>
                    )}

                    {/* Skeletons */}
                    {isLoadingSets && (
                      <div
                        className={`grid ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-3`}
                      >
                        {Array.from({ length: view === 'grid' ? 4 : 3 }).map(
                          (_, i) => (
                            <div
                              key={i}
                              className="rounded-lg border border-black/5 dark:border-white/5 bg-gray-50 dark:bg-[#1d2a32] p-3"
                              style={{ animationDelay: `${i * 75}ms` }}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div
                                  className="h-4 w-2/3 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                                  style={{ animationDelay: `${i * 75}ms` }}
                                />
                                <div
                                  className="h-3 w-12 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                                  style={{ animationDelay: `${i * 75 + 50}ms` }}
                                />
                              </div>
                              <div className="flex items-center justify-between mb-3">
                                <div
                                  className="h-3 w-14 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                                  style={{
                                    animationDelay: `${i * 75 + 100}ms`,
                                  }}
                                />
                                <div
                                  className="h-5 w-14 rounded-full bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                                  style={{
                                    animationDelay: `${i * 75 + 150}ms`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-6 w-14 rounded-md bg-black/[0.03] dark:bg-white/[0.03] animate-pulse"
                                  style={{
                                    animationDelay: `${i * 75 + 200}ms`,
                                  }}
                                />
                                <div
                                  className="h-6 w-14 rounded-md bg-black/[0.03] dark:bg-white/[0.03] animate-pulse"
                                  style={{
                                    animationDelay: `${i * 75 + 250}ms`,
                                  }}
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {!isLoadingSets && recentsSets.length > 0 && (
                      <>
                        {view === 'grid' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {visibleSets.map((set) => (
                              <SetCard
                                key={set.id}
                                set={set}
                                formatDate={formatDate}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="divide-y divide-black/5 dark:divide-white/10 rounded-lg overflow-hidden border border-black/5 dark:border-white/10">
                            {visibleSets.map((set) => (
                              <SetRow
                                key={set.id}
                                set={set}
                                formatDate={formatDate}
                              />
                            ))}
                          </div>
                        )}

                        {sortedSets.length > 8 && (
                          <div className="flex justify-center mt-4">
                            <button
                              onClick={() => setShowAll((s) => !s)}
                              className="text-sm px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                            >
                              {showAll
                                ? 'Show less'
                                : `Show all (${sortedSets.length})`}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Groups */}
              {activeTab === 'groups' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50" />
                      <input
                        type="text"
                        placeholder="Search groups"
                        value={searchTags}
                        onChange={(e) => setSearchTags(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-[#111] dark:text-white pl-9 pr-3 py-2 rounded-lg text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {vocabularyGroups
                      .filter((group) =>
                        group.name
                          .toLowerCase()
                          .includes(searchTags.toLowerCase())
                      )
                      .map((group, index) => (
                        <Link
                          key={index}
                          href={group.path}
                          className="flex flex-col justify-between p-3 rounded-lg border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-[#1d2a32] text-sm transition-all hover:shadow-sm hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                        >
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {group.name}
                          </span>
                          <span className="text-xs text-black/60 dark:text-white/60 mt-1">
                            {group.terms} Terms
                          </span>
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatPill({ value, label, tooltip, className }) {
  return (
    <span className={`relative group/stat cursor-default ${className || ''}`}>
      {label ? (
        <>
          <span className="text-gray-900 dark:text-white font-bold">
            {value}
          </span>{' '}
          {label}
        </>
      ) : (
        value
      )}
      <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 rounded-md bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 text-[10px] font-medium whitespace-nowrap opacity-0 group-hover/stat:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
        {tooltip}
      </span>
    </span>
  );
}

function SetCard({ set, formatDate }) {
  const getTypeIndicator = () => {
    if (set.set_type === 'vocab') {
      return { label: 'Vocab', colorClass: 'bg-blue-100 dark:bg-blue-900/30' };
    } else if (set.set_type === 'grammar') {
      return {
        label: 'Grammar',
        colorClass: 'bg-green-100 dark:bg-green-900/30 ',
      };
    } else {
      return {
        label: 'V & G',
        colorClass: 'bg-purple-100 dark:bg-purple-900/30',
      };
    }
  };

  const typeIndicator = getTypeIndicator();

  return (
    <div className="group rounded-lg border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-[#1d2a32] p-3 transition-all hover:shadow-sm hover:-translate-y-px focus-within:ring-2 focus-within:ring-[#e30a5f]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
            {set.name}
          </h4>
        </div>
        <span className="text-[11px] whitespace-nowrap text-black/60 dark:text-white/60">
          {formatDate(set.date)}
        </span>
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
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:opacity-90"
        >
          <FiPlay /> Study
        </Link>
        <Link
          href={`/learn/academy/sets/study/${set.id}`}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:opacity-90"
        >
          <FaRegFolderOpen /> Open
        </Link>
      </div>
    </div>
  );
}

function SetRow({ set, formatDate }) {
  const getTypeIndicator = () => {
    if (set.set_type === 'vocab') {
      return { label: 'Vocab', colorClass: 'bg-blue-100 dark:bg-blue-900/30' };
    } else if (set.set_type === 'grammar') {
      return {
        label: 'Grammar',
        colorClass: 'bg-green-100 dark:bg-green-900/30 ',
      };
    } else {
      return {
        label: 'V & G',
        colorClass: 'bg-purple-100 dark:bg-purple-900/30',
      };
    }
  };

  const typeIndicator = getTypeIndicator();

  return (
    <div className="flex items-center justify-between gap-3 bg-white/70 dark:bg-white/[0.02] px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {set.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-black/60 dark:text-white/60">
            {set.item_num} Items
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${typeIndicator.colorClass}`}
          >
            {typeIndicator.label}
          </span>
        </div>
      </div>
      <div className="hidden sm:block text-[11px] text-black/60 dark:text-white/60 whitespace-nowrap">
        {formatDate(set.date)}
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/learn/academy/sets/study/${set.id}/quiz`}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:opacity-90"
        >
          <FiPlay /> Study
        </Link>
        <Link
          href={`/learn/academy/sets/study/${set.id}`}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:opacity-90"
        >
          <FaRegFolderOpen /> Open
        </Link>
      </div>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
