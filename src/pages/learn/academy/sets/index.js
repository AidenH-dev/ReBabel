import Head from "next/head";
import AcademySidebar from "@/components/Sidebars/AcademySidebar";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useRouter } from "next/router";
import { FaPlus, FaBrain, FaFire, FaClock, FaChartLine } from "react-icons/fa";
import { FiSearch, FiGrid, FiList, FiPlay, FiEdit2, FiExternalLink, FiClock, FiAlertCircle } from "react-icons/fi";
import { TbChartInfographic } from "react-icons/tb";
import { MdAutorenew } from "react-icons/md";
import { BeginnerPackPopup } from "@/components/popups/sets/newUserPopup";

export default function VocabularyDashboard() {
  // Tabs: "srs" | "sets" | "groups"
  const [activeTab, setActiveTab] = useState("sets");

  // Search inputs
  const [searchSets, setSearchSets] = useState("");
  const [searchTags, setSearchTags] = useState("");

  // UI state
  const [sortKey, setSortKey] = useState("recent"); // recent | az | size
  const [view, setView] = useState("grid"); // grid | list
  const [showAll, setShowAll] = useState(false);

  const [userProfile, setUserProfile] = useState(null);
  const [recentsSets, setRecentsSets] = useState([]);
  const [isLoadingSets, setIsLoadingSets] = useState(true);

  const [showBeginnerPopup, setShowBeginnerPopup] = useState(false);

  // Interval review cards state (mock data - replace with real data from backend)
  const [intervalCards, setIntervalCards] = useState({
    due: 23,        // Cards due for review today
    overdue: 5,     // Cards that were due in previous days
    learning: 42,   // Cards still in learning phase
    review: 18,     // Cards in review phase
    nextReview: "2 hours", // Time until next batch of cards
    todayCompleted: 15, // Cards already reviewed today
    streak: 7       // Current review streak
  });

  // SRS Statistics (mock data - replace with real data)
  const [srsStats, setSrsStats] = useState({
    totalCards: 245,
    maturedCards: 87,
    youngCards: 103,
    newCards: 55,
    retention: 92.3,
    averageEase: 2.5,
    studyTime: "1h 23m",
    reviewsToday: 47,
    reviewsThisWeek: 312,
    heatmapData: [] // Would contain daily review data for heatmap
  });

  const [srsView, setSrsView] = useState("sets"); // "dashboard" | "sets"

  // Add mock SRS sets data
  const [srsSets, setSrsSets] = useState([
    {
      id: 1,
      name: "JLPT N5 Vocabulary",
      totalCards: 82,
      dueToday: 12,
      newCards: 5,
      learningCards: 18,
      reviewCards: 47,
      lastStudied: "2024-12-28",
      retention: 89.5,
      averageInterval: "3.2 days"
    },
    {
      id: 2,
      name: "Genki 1 - Lesson 1-3",
      totalCards: 65,
      dueToday: 8,
      newCards: 0,
      learningCards: 12,
      reviewCards: 45,
      lastStudied: "2024-12-27",
      retention: 92.1,
      averageInterval: "5.1 days"
    },
    {
      id: 3,
      name: "Common Kanji Readings",
      totalCards: 120,
      dueToday: 3,
      newCards: 15,
      learningCards: 25,
      reviewCards: 77,
      lastStudied: "2024-12-29",
      retention: 86.3,
      averageInterval: "2.8 days"
    }
  ]);
  const [srsSetView, setSrsSetView] = useState("grid");
  const [srsSearchQuery, setSrsSearchQuery] = useState("");

  const router = useRouter();
  const searchRef = useRef(null);

  // Keyboard: focus search with '/'
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fetch the Auth0 user profile on mount.
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const profile = await response.json();
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
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
        console.error("Error fetching user sets:", error);
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

  // Helpers
  const fixDateString = (dateString) => {
    if (!dateString) return dateString;
    let fixed = dateString.replace(" ", "T");
    fixed = fixed.replace(/(\.\d{3})\d+/, "$1");
    fixed = fixed.replace(/([+-]\d\d)$/, "$1:00");
    return fixed;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const d = new Date(fixDateString(dateString));
    return isNaN(d)
      ? "Unknown date"
      : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(d);
  };

  // Static groups
  const vocabularyGroups = [
    { name: "Lesson 1 Genki 1", path: "/learn/vocabulary/sets?lesson=1", terms: 30, date: "12/23/2024" },
    { name: "Lesson 2 Genki 1", path: "/learn/vocabulary/sets?lesson=2", terms: 20, date: "12/23/2024" },
    { name: "Lesson 3 Genki 1", path: "/learn/vocabulary/sets?lesson=3", terms: 25, date: "12/23/2024" },
    { name: "Lesson 4 Genki 1", path: "/learn/vocabulary/sets?lesson=4", terms: 40, date: "12/23/2024" },
    { name: "Lesson 5 Genki 1", path: "/learn/vocabulary/sets?lesson=5", terms: 28, date: "12/23/2024" },
    { name: "Lesson 6 Genki 1", path: "/learn/vocabulary/sets?lesson=6", terms: 15, date: "12/23/2024" },
    { name: "Lesson 7 Genki 1", path: "/learn/vocabulary/sets?lesson=7", terms: 35, date: "12/23/2024" },
    { name: "Lesson 8 Genki 1", path: "/learn/vocabulary/sets?lesson=8", terms: 22, date: "12/23/2024" },
    { name: "Lesson 9 Genki 1", path: "/learn/vocabulary/sets?lesson=9", terms: 18, date: "12/23/2024" },
    { name: "Lesson 10 Genki 1", path: "/learn/vocabulary/sets?lesson=10", terms: 26, date: "12/23/2024" },
    { name: "Lesson 11 Genki 1", path: "/learn/vocabulary/sets?lesson=11", terms: 26, date: "12/23/2024" },
    { name: "Lesson 12 Genki 1", path: "/learn/vocabulary/sets?lesson=12", terms: 26, date: "12/23/2024" },
  ];

  // Derived views
  const filteredSets = recentsSets.filter((s) =>
    s.name.toLowerCase().includes(searchSets.toLowerCase())
  );

  const sortedSets = [...filteredSets].sort((a, b) => {
    if (sortKey === "az") return a.name.localeCompare(b.name);
    if (sortKey === "size") return (b.item_num || 0) - (a.item_num || 0);
    return new Date(b.date) - new Date(a.date);
  });

  const visibleSets = showAll ? sortedSets : sortedSets.slice(0, 8);

  // Handler for starting interval review
  const handleStartSmartReview = () => {
    router.push("/learn/vocabulary/smart-review");
  };

  return (
    <div className="flex flex-row h-screen overflow-hidden bg-white dark:bg-[#141f25] text-[#222] dark:text-white">
      {/* Sidebar */}
      <AcademySidebar />

      {/* Main */}
      <main className="ml-auto flex-1 flex flex-col h-screen overflow-y-auto bg-gray-50 dark:bg-[#141f25] px-6 sm:px-10 mt-10 sm:mt-0 py-8">
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

        {/* Smart Review Widget - Coming Soon */}
        <div className="w-full max-w-6xl mx-auto mb-4">
          <div className="relative bg-gradient-to-r from-[#667eea]/80 to-[#764ba2]/80 rounded-xl shadow-md p-4 text-white overflow-hidden">
            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
              Coming Soon
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 opacity-60">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <FaBrain className="text-lg" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <h2 className="text-sm font-bold">Smart Review</h2>
                    <span className="text-xs text-white/70 hidden sm:inline">• AI-powered spaced repetition</span>
                  </div>

                  <p className="text-xs text-white/80">
                    Review cards at optimal intervals for maximum retention
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/20 text-white/60 cursor-not-allowed"
                >
                  <MdAutorenew className="text-lg" />
                  <span>Coming Soon</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Top tabs */}
        <div className="w-full max-w-6xl mx-auto">
          <div className="border-b border-black/5 dark:border-white/10">
            <div className="flex items-end gap-6 -mb-px h-10">
              <button
                onClick={() => setActiveTab("sets")}
                className={`pb-2 pt-1 px-1 text-sm font-medium focus:outline-none border-b-2 transition-colors
                  ${activeTab === "sets"
                    ? "text-[#e30a5f] border-[#e30a5f]"
                    : "text-black/70 dark:text-white/80 border-transparent hover:text-black dark:hover:text-white hover:border-[#e30a5f]"}`}
              >
                My Sets
              </button>
              <button
                disabled
                className="pb-2 pt-1 px-1 text-sm font-medium focus:outline-none border-b-2 border-transparent text-black/40 dark:text-white/40 cursor-not-allowed flex items-center gap-2"
              >
                SRS
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#667eea]/10 text-[#667eea] dark:bg-[#667eea]/20">
                  Coming Soon
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Content panel */}
        <div className="w-full max-w-6xl mx-auto">
          <section className="mt-3 rounded-2xl shadow-sm bg-white dark:bg-[#1c2b35] border border-black/5 dark:border-white/5 p-4 sm:p-6">

            {/* SRS Section */}
            {activeTab === "srs" && (
              <div className="flex flex-col gap-3">
                {/* Header with description and view toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-[#0f1a1f] dark:text-white">
                    Spaced Repetition System
                  </h2>

                  {/* View toggle for Dashboard/Sets */}
                  <div className="flex items-center gap-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-1">
                    <button
                      onClick={() => setSrsView("sets")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${srsView === "sets"
                        ? "bg-white dark:bg-[#0f1a1f] text-[#e30a5f] shadow-sm"
                        : "text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
                        }`}
                    >
                      Sets
                    </button>
                    <button
                      onClick={() => setSrsView("dashboard")}
                      className={`px-3 py-1.5 rounded-md text-md font-medium transition ${srsView === "dashboard"
                        ? "bg-white dark:bg-[#0f1a1f] text-[#e30a5f] shadow-sm"
                        : "text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
                        }`}
                    >
                      <TbChartInfographic />
                    </button>
                  </div>
                </div>

                {/* Dashboard View */}
                {srsView === "dashboard" && (
                  <>
                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-gray-50 dark:bg-[#1d2a32] rounded-lg border border-black/5 dark:border-white/10 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Total Cards</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{srsStats.totalCards}</div>
                      </div>

                      <div className="bg-gray-50 dark:bg-[#1d2a32] rounded-lg border border-black/5 dark:border-white/10 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Retention</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{srsStats.retention}%</div>
                      </div>

                      <div className="bg-gray-50 dark:bg-[#1d2a32] rounded-lg border border-black/5 dark:border-white/10 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Study Time</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{srsStats.studyTime}</div>
                      </div>

                      <div className="bg-gray-50 dark:bg-[#1d2a32] rounded-lg border border-black/5 dark:border-white/10 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">This Week</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{srsStats.reviewsThisWeek}</div>
                      </div>
                    </div>

                    {/* Card Distribution by Level */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Card Distribution */}
                      <div className="bg-white dark:bg-[#1d2a32] border border-black/5 dark:border-white/10 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Card Distribution by Level</h3>
                        <div className="space-y-3">
                          {/* Beginner - 4 sub-levels */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">Beginner</span>
                            </div>
                            <div className="flex-1 max-w-[180px] ml-3">
                              <div className="flex items-center gap-1">
                                <div className="flex gap-1 text-[10px] font-mono">
                                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">28</span>
                                  <span className="text-gray-400">-</span>
                                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">35</span>
                                  <span className="text-gray-400">-</span>
                                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">24</span>
                                  <span className="text-gray-400">-</span>
                                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">23</span>
                                </div>
                                <span className="text-xs font-medium ml-2">110</span>
                              </div>
                            </div>
                          </div>

                          {/* Novice - 2 sub-levels */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">Novice</span>
                            </div>
                            <div className="flex-1 max-w-[180px] ml-3">
                              <div className="flex items-center gap-1">
                                <div className="flex gap-1 text-[10px] font-mono">
                                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">41</span>
                                  <span className="text-gray-400">-</span>
                                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">32</span>
                                </div>
                                <span className="text-xs font-medium ml-2">73</span>
                              </div>
                            </div>
                          </div>

                          {/* Intermediate - 1 level */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">Intermediate</span>
                            </div>
                            <div className="flex-1 max-w-[180px] ml-3">
                              <div className="flex items-center gap-1">
                                <div className="flex gap-1 text-[10px] font-mono">
                                  <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 rounded">37</span>
                                </div>
                                <span className="text-xs font-medium ml-2">37</span>
                              </div>
                            </div>
                          </div>

                          {/* Expert - 1 level */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">Expert</span>
                            </div>
                            <div className="flex-1 max-w-[180px] ml-3">
                              <div className="flex items-center gap-1">
                                <div className="flex gap-1 text-[10px] font-mono">
                                  <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded">17</span>
                                </div>
                                <span className="text-xs font-medium ml-2">17</span>
                              </div>
                            </div>
                          </div>

                          {/* Master - 1 level */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">Master</span>
                            </div>
                            <div className="flex-1 max-w-[180px] ml-3">
                              <div className="flex items-center gap-1">
                                <div className="flex gap-1 text-[10px] font-mono">
                                  <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">8</span>
                                </div>
                                <span className="text-xs font-medium ml-2">8</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Review Forecast */}
                      <div className="bg-white dark:bg-[#1d2a32] border border-black/5 dark:border-white/10 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Review Forecast</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Today</span>
                            <span className="text-sm font-semibold text-[#e30a5f]">{intervalCards.due + intervalCards.overdue}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Tomorrow</span>
                            <span className="text-sm font-medium">18</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Next 7 days</span>
                            <span className="text-sm font-medium">92</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Next 30 days</span>
                            <span className="text-sm font-medium">187</span>
                          </div>
                          <div className="pt-2 mt-2 border-t border-black/5 dark:border-white/10">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600 dark:text-gray-400">Next review in</span>
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">{intervalCards.nextReview}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Sets View */}
                {srsView === "sets" && (
                  <div className="flex flex-col gap-4">
                    {/* Actions bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="relative flex-1 max-w-md">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50" />
                        <input
                          type="text"
                          placeholder="Search SRS sets..."
                          value={srsSearchQuery}
                          onChange={(e) => setSrsSearchQuery(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-[#111] dark:text-white pl-9 pr-3 py-2 rounded-lg text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                        />
                      </div>

                      {/* View toggle */}
                      <div className="flex items-center w-min gap-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-1">
                        <button
                          onClick={() => setSrsSetView("grid")}
                          className={`px-2 py-1 rounded-md text-xs flex items-center gap-1 transition ${srsSetView === "grid" ? "bg-white dark:bg-[#0f1a1f] text-[#e30a5f]" : "text-black/70 dark:text-white/70"
                            }`}
                        >
                          <FiGrid className="inline-block" /> Grid
                        </button>
                        <button
                          onClick={() => setSrsSetView("list")}
                          className={`px-2 py-1 rounded-md text-xs flex items-center gap-1 transition ${srsSetView === "list" ? "bg-white dark:bg-[#0f1a1f] text-[#e30a5f]" : "text-black/70 dark:text-white/70"
                            }`}
                        >
                          <FiList className="inline-block" /> List
                        </button>
                      </div>

                      <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-[#e30a5f] text-white hover:opacity-95">
                        <FaPlus /> Enable SRS for Set
                      </button>
                    </div>

                    {/* Filtered sets */}
                    {(() => {
                      const filteredSrsSets = srsSets.filter(set =>
                        set.name.toLowerCase().includes(srsSearchQuery.toLowerCase())
                      );

                      if (filteredSrsSets.length === 0 && srsSearchQuery) {
                        return (
                          <div className="rounded-lg border border-dashed border-black/10 dark:border-white/10 p-6 text-center text-sm text-black/70 dark:text-white/70">
                            <p>No SRS sets found matching &quot;{srsSearchQuery}&quot;</p>
                          </div>
                        );
                      }

                      if (srsSetView === "grid") {
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredSrsSets.map((set) => (
                              <div key={set.id} className="bg-white dark:bg-[#1d2a32] border border-black/5 dark:border-white/10 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                {/* Set Header */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{set.name}</h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                      Last: {formatDate(set.lastStudied)}
                                    </p>
                                  </div>
                                  {set.dueToday > 0 && (
                                    <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded-full whitespace-nowrap">
                                      {set.dueToday} due
                                    </span>
                                  )}
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                  <div className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                                    <span>Progress</span>
                                    <span>{Math.round((set.reviewCards / set.totalCards) * 100)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div className="flex h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-green-500"
                                        style={{ width: `${(set.reviewCards / set.totalCards) * 100}%` }}
                                      />
                                      <div
                                        className="bg-orange-500"
                                        style={{ width: `${(set.learningCards / set.totalCards) * 100}%` }}
                                      />
                                      <div
                                        className="bg-blue-500"
                                        style={{ width: `${(set.newCards / set.totalCards) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Stats Row */}
                                <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400 mb-3">
                                  <span>Ret: <strong className="text-gray-900 dark:text-white">{set.retention}%</strong></span>
                                  <span>Total: <strong className="text-gray-900 dark:text-white">{set.totalCards}</strong></span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  <button
                                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium bg-[#e30a5f] text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={set.dueToday === 0}
                                  >
                                    <MdAutorenew className="text-sm" /> Study
                                  </button>
                                  <button className="px-2 py-2 rounded-lg text-xs font-medium border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
                                    <FiEdit2 />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      } else {
                        // List view
                        return (
                          <div className="divide-y divide-black/5 dark:divide-white/10 rounded-lg overflow-hidden border border-black/5 dark:border-white/10">
                            {filteredSrsSets.map((set) => (
                              <div key={set.id} className="flex items-center justify-between gap-4 bg-white/70 dark:bg-white/[0.02] px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                                {/* Left: Name and last studied */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{set.name}</h3>
                                    {set.dueToday > 0 && (
                                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[10px] font-medium rounded-full whitespace-nowrap">
                                        {set.dueToday} due
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                    Last studied: {formatDate(set.lastStudied)}
                                  </p>
                                </div>

                                {/* Center: Stats */}
                                <div className="hidden sm:flex items-center gap-6">
                                  <div className="text-center">
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{set.totalCards}</div>
                                    <div className="text-[10px] text-gray-600 dark:text-gray-400">cards</div>
                                  </div>
                                </div>

                                {/* Progress bar */}
                                <div className="hidden lg:block w-24">
                                  <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1 text-center">
                                    {Math.round((set.reviewCards / set.totalCards) * 100)}%
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                    <div className="flex h-1 rounded-full overflow-hidden">
                                      <div
                                        className="bg-green-500"
                                        style={{ width: `${(set.reviewCards / set.totalCards) * 100}%` }}
                                      />
                                      <div
                                        className="bg-orange-500"
                                        style={{ width: `${(set.learningCards / set.totalCards) * 100}%` }}
                                      />
                                      <div
                                        className="bg-blue-500"
                                        style={{ width: `${(set.newCards / set.totalCards) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Stats */}
                                <div className="hidden xl:flex items-center gap-4 text-[11px] text-gray-600 dark:text-gray-400">
                                  <span>Ret: <strong className="text-gray-900 dark:text-white">{set.retention}%</strong></span>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-2">
                                  <button
                                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-[#e30a5f] text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={set.dueToday === 0}
                                  >
                                    <MdAutorenew /> Study
                                  </button>
                                  <button className="p-1.5 rounded-md text-xs border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
                                    <FiEdit2 />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }
                    })()}

                    {/* Empty state for SRS sets */}
                    {srsSets.length === 0 && !srsSearchQuery && (
                      <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center text-sm text-black/70 dark:text-white/70">
                        <FaBrain className="text-3xl mx-auto mb-3 opacity-50" />
                        <p className="mb-3">No SRS-enabled sets yet.</p>
                        <p className="text-xs mb-4">Enable SRS on your notecard sets to use spaced repetition for better memorization.</p>
                        <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-[#e30a5f] text-white hover:opacity-95">
                          <FaPlus /> Enable SRS for a Set
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Header row for Notecards (formerly Sets) */}
            {activeTab === "sets" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-row sm:items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-[#0f1a1f] dark:text-white flex-1">
                    My Sets{recentsSets.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-black/60 dark:text-white/60">{recentsSets.length}</span>
                    )}
                  </h2>

                  {/* View toggle */}
                  <div className="flex items-center w-min gap-1 h-min rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-1">
                    <button
                      onClick={() => setView("grid")}
                      className={`px-2 py-1 rounded-md text-xs flex items-center gap-1 transition ${view === "grid" ? "bg-white dark:bg-[#0f1a1f] text-[#e30a5f]" : "text-black/70 dark:text-white/70"
                        }`}
                      aria-label="Grid view"
                    >
                      <FiGrid className="inline-block" /> Grid
                    </button>
                    <button
                      onClick={() => setView("list")}
                      className={`px-2 py-1 rounded-md text-xs flex items-center gap-1 transition ${view === "list" ? "bg-white dark:bg-[#0f1a1f] text-[#e30a5f]" : "text-black/70 dark:text-white/70"
                        }`}
                      aria-label="List view"
                    >
                      <FiList className="inline-block" /> List
                    </button>
                  </div>

                  {/* Sort */}
                  <label className="text-xs text-black/60 dark:text-white/60 flex items-center gap-2">
                    <span className="hidden sm:inline">Sort</span>
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value)}
                      className="text-sm bg-white dark:bg-[#0f1a1f] border border-black/10 dark:border-white/10 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                    >
                      <option value="recent">Most recent</option>
                      <option value="az">A–Z</option>
                      <option value="size">Most terms</option>
                    </select>
                  </label>

                  {/* New set */}
                  <button
                    onClick={() => router.push("/learn/academy/sets/create")}
                    className="hidden sm:flex items-center gap-2 w-fit rounded-lg px-3 py-2 text-sm font-medium bg-[#e30a5f] text-white hover:opacity-95 active:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e30a5f]/70 focus:ring-offset-white dark:focus:ring-offset-[#1c2b35]"
                  >
                    <FaPlus /> New Set
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search your sets (press '/')"
                    value={searchSets}
                    onChange={(e) => setSearchSets(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-[#111] dark:text-white pl-9 pr-20 py-2 rounded-lg text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                  />
                  {searchSets && (
                    <button
                      onClick={() => setSearchSets("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 text-black/70 dark:text-white/70 hover:opacity-90"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Results */}
                <div className="mt-1">
                  {/* Empty state */}
                  {!isLoadingSets && recentsSets.length === 0 && (
                    <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 p-8 text-center text-sm text-black/70 dark:text-white/70">
                      <p className="mb-3">You don&apos;t have any sets yet.</p>
                      <button
                        onClick={() => router.push("/learn/academy/sets/create")}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-[#e30a5f] text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                      >
                        <FaPlus /> Create your first set
                      </button>
                    </div>
                  )}

                  {/* Skeletons */}
                  {isLoadingSets && (
                    <div className={`grid ${view === "grid" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"} gap-3`}>
                      {Array.from({ length: view === "grid" ? 8 : 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse rounded-lg bg-black/5 dark:bg-white/5 h-24" />
                      ))}
                    </div>
                  )}

                  {!isLoadingSets && recentsSets.length > 0 && (
                    <>
                      {view === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {visibleSets.map((set) => (
                            <SetCard key={set.id} set={set} formatDate={formatDate} />
                          ))}
                        </div>
                      ) : (
                        <div className="divide-y divide-black/5 dark:divide-white/10 rounded-lg overflow-hidden border border-black/5 dark:border-white/10">
                          {visibleSets.map((set) => (
                            <SetRow key={set.id} set={set} formatDate={formatDate} />
                          ))}
                        </div>
                      )}

                      {sortedSets.length > 8 && (
                        <div className="flex justify-center mt-4">
                          <button
                            onClick={() => setShowAll((s) => !s)}
                            className="text-sm px-3 py-2 rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                          >
                            {showAll ? "Show less" : `Show all (${sortedSets.length})`}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Groups */}
            {activeTab === "groups" && (
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
                    .filter((group) => group.name.toLowerCase().includes(searchTags.toLowerCase()))
                    .map((group, index) => (
                      <Link
                        key={index}
                        href={group.path}
                        className="flex flex-col justify-between p-3 rounded-lg border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-[#1d2a32] text-sm transition-all hover:shadow-sm hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                      >
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{group.name}</span>
                        <span className="text-xs text-black/60 dark:text-white/60 mt-1">{group.terms} Terms</span>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </section>

          {/* Floating action button on mobile */}
          {activeTab === "sets" && (
            <button
              onClick={() => router.push("/learn/academy/sets/create")}
              className="sm:hidden fixed bottom-6 left-6 z-10 shadow-lg rounded-full p-4 bg-[#e30a5f] text-white focus:outline-none focus:ring-2 focus:ring-white/60"
              aria-label="Create new set"
            >
              <FaPlus />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function SetCard({ set, formatDate }) {
  const getTypeIndicator = () => {
    if (set.set_type === 'vocab') {
      return {label: 'Vocab', colorClass: 'bg-blue-100 dark:bg-blue-900/30' };
    } else if (set.set_type === 'grammar') {
      return {label: 'Grammar', colorClass: 'bg-green-100 dark:bg-green-900/30 ' };
    } else {
      return {label: 'V & G', colorClass: 'bg-purple-100 dark:bg-purple-900/30' };
    }
  };

  const typeIndicator = getTypeIndicator();

  return (
    <div className="group rounded-lg border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-[#1d2a32] p-3 transition-all hover:shadow-sm hover:-translate-y-px focus-within:ring-2 focus-within:ring-[#e30a5f]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{set.name}</h4>
        </div>
        <span className="text-[11px] whitespace-nowrap text-black/60 dark:text-white/60">{formatDate(set.date)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-xs text-black/60 dark:text-white/60">{set.item_num} Items</p>
        <div className={`text-xs px-2 py-1 rounded-full font-medium ${typeIndicator.colorClass}`}>
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
          <FiExternalLink /> Open
        </Link>
      </div>
    </div>
  );
}

function SetRow({ set, formatDate }) {
  const getTypeIndicator = () => {
    if (set.set_type === 'vocab') {
      return {label: 'Vocab', colorClass: 'bg-blue-100 dark:bg-blue-900/30' };
    } else if (set.set_type === 'grammar') {
      return {label: 'Grammar', colorClass: 'bg-green-100 dark:bg-green-900/30 ' };
    } else {
      return {label: 'V & G', colorClass: 'bg-purple-100 dark:bg-purple-900/30' };
    }
  };

  const typeIndicator = getTypeIndicator();

  return (
    <div className="flex items-center justify-between gap-3 bg-white/70 dark:bg-white/[0.02] px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{set.name}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-black/60 dark:text-white/60">{set.item_num} Items</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${typeIndicator.colorClass}`}>
            {typeIndicator.label}
          </span>
        </div>
      </div>
      <div className="hidden sm:block text-[11px] text-black/60 dark:text-white/60 whitespace-nowrap">{formatDate(set.date)}</div>
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
          <FiExternalLink /> Open
        </Link>
      </div>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();