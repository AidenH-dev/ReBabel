import Head from "next/head";
import AcademySidebar from "@/components/Sidebars/AcademySidebar";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useRouter } from "next/router";
import { FaPlus, FaBrain, FaFire, FaClock, FaChartLine } from "react-icons/fa";
import { FiSearch, FiGrid, FiList, FiPlay, FiEdit2, FiExternalLink, FiAlertCircle } from "react-icons/fi";
import { TbChartInfographic } from "react-icons/tb";
import { MdAutorenew } from "react-icons/md";
import { BeginnerPackPopup } from "@/components/popups/sets/newUserPopup";

function VocabularyDashboard() {
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

  // Mock data for other tabs - can be replaced with real data
  const [intervalCards, setIntervalCards] = useState({ due: 23, overdue: 5 });
  const [vocabularyGroups, setVocabularyGroups] = useState([]);

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
          path: `/learn/academy/sets/study/${record.entity_id}`,
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

  const handleCreateSet = () => {
    router.push('/learn/academy/sets/create');
  };

  return (
    <>
      <Head>
        <title>My Sets | Academy</title>
      </Head>
      {showBeginnerPopup && <BeginnerPackPopup onClose={() => setShowBeginnerPopup(false)} />}
      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100 dark:bg-gray-900">
        <AcademySidebar />
        <main className="flex-grow w-full lg:w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Sets</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and study your vocabulary sets.</p>
            </header>

            {/* Toolbar: Search, Sort, View, etc. */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <div className="relative w-full md:w-auto md:flex-grow max-w-sm">
                <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search sets... (Press /)"
                  value={searchSets}
                  onChange={(e) => setSearchSets(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                  <button onClick={() => setView('grid')} className={`p-2 rounded-l-md transition ${view === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><FiGrid /></button>
                  <button onClick={() => setView('list')} className={`p-2 rounded-r-md transition ${view === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><FiList /></button>
                </div>
                <button onClick={handleCreateSet} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition">
                  <FaPlus />
                  <span>New Set</span>
                </button>
              </div>
            </div>

            {/* Sets Content */}
            {isLoadingSets ? (
              <div className="text-center py-10">Loading sets...</div>
            ) : sortedSets.length > 0 ? (
              <>
                {view === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {visibleSets.map(set => (
                      <Link key={set.id} href={set.path} className="block group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all">
                        <h3 className="font-semibold text-gray-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">{set.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{set.item_num || 0} terms</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Created: {formatDate(set.date)}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {visibleSets.map(set => (
                      <Link key={set.id} href={set.path} className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex-grow pr-4">
                          <h3 className="font-medium text-gray-800 dark:text-white truncate">{set.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{set.item_num || 0} terms</p>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block flex-shrink-0">{formatDate(set.date)}</span>
                        <FiExternalLink className="ml-4 text-gray-400 flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
                {sortedSets.length > 8 && (
                  <div className="text-center mt-8">
                    <button onClick={() => setShowAll(s => !s)} className="text-blue-600 dark:text-blue-400 hover:underline">
                      {showAll ? 'Show Fewer' : `Show All ${sortedSets.length} Sets`}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No sets found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Get started by creating your first vocabulary set.</p>
                <button onClick={handleCreateSet} className="mt-4 flex items-center mx-auto gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition">
                  <FaPlus />
                  <span>Create New Set</span>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default withPageAuthRequired(VocabularyDashboard);