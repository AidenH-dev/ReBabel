import Head from "next/head";
import Sidebar from "../../../components/Sidebar";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useRouter } from "next/router";
import { FaPlus, FaBrain, FaFire, FaClock, FaChartLine } from "react-icons/fa";
import { FiSearch, FiGrid, FiList, FiPlay, FiEdit2, FiExternalLink, FiClock, FiAlertCircle } from "react-icons/fi";
import { MdAutorenew } from "react-icons/md";

export default function VocabularyDashboard() {
  // Tabs: "sets" | "tags"
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
      if (!(userProfile && userProfile.email)) return;
      setIsLoadingSets(true);
      try {
        const response = await fetch(
          `/api/database/fetch-user-set?userEmail=${encodeURIComponent(
            userProfile.email
          )}`
        );
        const data = await response.json();
        const formattedData = data.map((record) => ({
          id: record.id,
          name: record.set_name,
          terms: record.vocabulary || [],
          date: record.created_at,
          path: `/learn/vocabulary/view-set?id=${record.id}`,
        }));
        formattedData.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentsSets(formattedData);
      } catch (error) {
        console.error("Error fetching user sets:", error);
      } finally {
        setIsLoadingSets(false);
      }
    };
    fetchUserSets();
  }, [userProfile]);

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

  // Static groups (unchanged)
  const vocabularyGroups = [
    { name: "Lesson 1 Genki 1", path: "/learn/vocabulary/notecards?lesson=1", terms: 30, date: "12/23/2024" },
    { name: "Lesson 2 Genki 1", path: "/learn/vocabulary/notecards?lesson=2", terms: 20, date: "12/23/2024" },
    { name: "Lesson 3 Genki 1", path: "/learn/vocabulary/notecards?lesson=3", terms: 25, date: "12/23/2024" },
    { name: "Lesson 4 Genki 1", path: "/learn/vocabulary/notecards?lesson=4", terms: 40, date: "12/23/2024" },
    { name: "Lesson 5 Genki 1", path: "/learn/vocabulary/notecards?lesson=5", terms: 28, date: "12/23/2024" },
    { name: "Lesson 6 Genki 1", path: "/learn/vocabulary/notecards?lesson=6", terms: 15, date: "12/23/2024" },
    { name: "Lesson 7 Genki 1", path: "/learn/vocabulary/notecards?lesson=7", terms: 35, date: "12/23/2024" },
    { name: "Lesson 8 Genki 1", path: "/learn/vocabulary/notecards?lesson=8", terms: 22, date: "12/23/2024" },
    { name: "Lesson 9 Genki 1", path: "/learn/vocabulary/notecards?lesson=9", terms: 18, date: "12/23/2024" },
    { name: "Lesson 10 Genki 1", path: "/learn/vocabulary/notecards?lesson=10", terms: 26, date: "12/23/2024" },
    { name: "Lesson 11 Genki 1", path: "/learn/vocabulary/notecards?lesson=11", terms: 26, date: "12/23/2024" },
    { name: "Lesson 12 Genki 1", path: "/learn/vocabulary/notecards?lesson=12", terms: 26, date: "12/23/2024" },
  ];

  // Derived views
  const filteredSets = recentsSets.filter((s) =>
    s.name.toLowerCase().includes(searchSets.toLowerCase())
  );

  const sortedSets = [...filteredSets].sort((a, b) => {
    if (sortKey === "az") return a.name.localeCompare(b.name);
    if (sortKey === "size") return b.terms.length - a.terms.length;
    // recent
    return new Date(b.date) - new Date(a.date);
  });

  const visibleSets = showAll ? sortedSets : sortedSets.slice(0, 8);

  // Handler for starting interval review
  const handleStartSmartReview = () => {
    // This would navigate to a special review mode that pulls all due cards
    // from across all sets based on their interval data
    router.push("/learn/vocabulary/smart-review");
  };

  return (
    <div className="flex flex-row min-h-screen bg-white dark:bg-[#141f25] text-[#222] dark:text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main className="ml-auto flex-1 flex flex-col min-h-screen bg-gray-50 dark:bg-[#141f25] px-6 sm:px-10 py-8">
        <Head>
          <title>Vocabulary Dashboard</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Smart Review Widget - Compact version */}
        <div className="w-full max-w-6xl mx-auto mb-4">
          <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-xl shadow-md p-4 text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Left side - Main info */}
              <div className="flex items-center gap-4 flex-1">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <FaBrain className="text-lg" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <h2 className="text-sm font-bold">Smart Review {'(Coming Soon)'}</h2>
                    <span className="text-xs text-white/70 hidden sm:inline">• Spaced repetition {'(Reinforcing recall for cards youve studied)'}</span>
                  </div>
                  
                  {/* Compact stats */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-white/70">Due:</span>
                      <span className="font-bold text-sm">{intervalCards.due}</span>
                      {intervalCards.overdue > 0 && (
                        <span className="text-red-300 font-bold">+{intervalCards.overdue}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-white/70">Learning:</span>
                      <span className="font-bold text-sm">{intervalCards.learning}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-white/70">Done:</span>
                      <span className="font-bold text-sm text-green-300">{intervalCards.todayCompleted}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaFire className="text-orange-400 text-xs" />
                      <span className="text-white/90">{intervalCards.streak}d</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartSmartReview}
                  disabled={intervalCards.due === 0 && intervalCards.overdue === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    intervalCards.due > 0 || intervalCards.overdue > 0
                      ? "bg-white text-[#667eea] hover:bg-white/90 active:scale-95"
                      : "bg-white/20 text-white/60 cursor-not-allowed"
                  }`}
                >
                  <MdAutorenew className="text-lg" />
                  <span className="hidden sm:inline">Start Review</span>
                  <span className="sm:hidden">Review</span>
                  {(intervalCards.due > 0 || intervalCards.overdue > 0) && (
                    <span className="px-1.5 py-0.5 bg-[#667eea] text-white rounded-full text-xs font-bold">
                      {intervalCards.due + intervalCards.overdue}
                    </span>
                  )}
                </button>
                
                <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="View Statistics">
                  <FaChartLine className="text-sm" />
                </button>
              </div>
            </div>

            {/* Slim progress bar */}
            <div className="mt-3">
              <div className="w-full bg-white/20 rounded-full h-1">
                <div 
                  className="bg-white h-1 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(intervalCards.todayCompleted / (intervalCards.todayCompleted + intervalCards.due + intervalCards.overdue)) * 100}%` 
                  }}
                />
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
                onClick={() => setActiveTab("tags")}
                className={`pb-2 pt-1 px-1 text-sm font-medium focus:outline-none border-b-2 transition-colors
                  ${activeTab === "tags"
                    ? "text-[#e30a5f] border-[#e30a5f]"
                    : "text-black/70 dark:text-white/80 border-transparent hover:text-black dark:hover:text-white hover:border-[#e30a5f]"}`}
              >
                Groups
              </button>
            </div>
          </div>
        </div>

        {/* Content panel */}
        <div className="w-full max-w-6xl mx-auto">
          <section className="mt-3 rounded-2xl shadow-sm bg-white dark:bg-[#1c2b35] border border-black/5 dark:border-white/5 p-4 sm:p-6">
            {/* Header row for Sets */}
            {activeTab === "sets" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-[#0f1a1f] dark:text-white flex-1">
                    My Sets{recentsSets.length ? (
                      <span className="ml-2 text-xs font-normal text-black/60 dark:text-white/60">{recentsSets.length}</span>
                    ) : null}
                  </h2>

                  {/* View toggle */}
                  <div className="flex items-center gap-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-1">
                    <button
                      onClick={() => setView("grid")}
                      className={`px-2 py-1 rounded-md text-xs flex items-center gap-1 transition ${
                        view === "grid" ? "bg-white dark:bg-[#0f1a1f] text-[#e30a5f]" : "text-black/70 dark:text-white/70"
                      }`}
                      aria-label="Grid view"
                    >
                      <FiGrid className="inline-block" /> Grid
                    </button>
                    <button
                      onClick={() => setView("list")}
                      className={`px-2 py-1 rounded-md text-xs flex items-center gap-1 transition ${
                        view === "list" ? "bg-white dark:bg-[#0f1a1f] text-[#e30a5f]" : "text-black/70 dark:text-white/70"
                      }`}
                      aria-label="List view"
                    >
                      <FiList className="inline-block" /> List
                    </button>
                  </div>

                  {/* Sort */}
                  <label className="text-xs text-black/60 dark:text-white/60 flex items-center gap-2">
                    Sort
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
                    onClick={() => router.push("/learn/vocabulary/create-set")}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-[#e30a5f] text-white hover:opacity-95 active:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e30a5f]/70 focus:ring-offset-white dark:focus:ring-offset-[#1c2b35]"
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
                      <p className="mb-3">You don't have any sets yet.</p>
                      <button
                        onClick={() => router.push("/learn/vocabulary/create-set")}
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

            {/* Groups (kept, with palette tweaks) */}
            {activeTab === "tags" && (
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
              onClick={() => router.push("/learn/vocabulary/create-set")}
              className="sm:hidden fixed bottom-6 right-6 z-10 shadow-lg rounded-full p-4 bg-[#e30a5f] text-white focus:outline-none focus:ring-2 focus:ring-white/60"
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
  return (
    <div className="group rounded-lg border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-[#1d2a32] p-3 transition-all hover:shadow-sm hover:-translate-y-px focus-within:ring-2 focus-within:ring-[#e30a5f]">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{set.name}</h4>
        <span className="text-[11px] whitespace-nowrap text-black/60 dark:text-white/60">{formatDate(set.date)}</span>
      </div>
      <p className="text-xs text-black/60 dark:text-white/60 mt-1">{set.terms.length} Terms</p>

      <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={{ pathname: "/learn/vocabulary/notecards", query: { terms: JSON.stringify(set.terms) } }}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:opacity-90"
        >
          <FiPlay /> Study
        </Link>
        <Link
          href={set.path}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:opacity-90"
        >
          <FiExternalLink /> Open
        </Link>
      </div>
    </div>
  );
}

function SetRow({ set, formatDate }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white/70 dark:bg-white/[0.02] px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{set.name}</div>
        <div className="text-xs text-black/60 dark:text-white/60">{set.terms.length} Terms</div>
      </div>
      <div className="hidden sm:block text-[11px] text-black/60 dark:text-white/60 whitespace-nowrap">{formatDate(set.date)}</div>
      <div className="flex items-center gap-2">
        <Link
          href={{ pathname: "/learn/vocabulary/notecards", query: { terms: JSON.stringify(set.terms) } }}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:opacity-90"
        >
          <FiPlay /> Study
        </Link>
        <Link
          href={set.path}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:opacity-90"
        >
          <FiExternalLink /> Open
        </Link>
      </div>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();