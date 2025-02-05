import Head from "next/head";
import Sidebar from "../../../components/Sidebar";
import { useState, useEffect } from "react";
import Link from "next/link";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { FiSettings } from "react-icons/fi";
import { FaPlus } from "react-icons/fa6";
import { useRouter } from "next/router";

export default function VocabularyDashboard() {
  // Separate states for each search input.
  const [searchSets, setSearchSets] = useState("");
  const [searchTags, setSearchTags] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [recentsSets, setRecentsSets] = useState([]);
  const router = useRouter();

  // Fetch the Auth0 user profile on mount.
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/auth/me"); // Endpoint to get the Auth0 profile
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
    if (userProfile && userProfile.email) {
      const fetchUserSets = async () => {
        try {
          // Pass the user email as a query parameter to the API endpoint.
          const response = await fetch(
            `/api/database/fetch-user-set?userEmail=${encodeURIComponent(
              userProfile.email
            )}`
          );
          const data = await response.json();
          // Map the data and sort by date descending so the latest sets are first.
          const formattedData = data.map((record) => ({
            name: record.set_name,
            terms: record.vocabulary, // This is an array of terms
            date: record.created_at, // Use created_at from your table
            path: `/learn/vocabulary/view-set?id=${record.id}`,
          }));
          formattedData.sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );
          setRecentsSets(formattedData);
        } catch (error) {
          console.error("Error fetching user sets:", error);
        }
      };

      fetchUserSets();
    }
  }, [userProfile]);

  // Helper function to fix the date string.
  // Example: "2025-02-04 21:48:51.848729+00" becomes "2025-02-04T21:48:51.848+00:00"
  const fixDateString = (dateString) => {
    if (!dateString) return dateString;
    // Replace space with "T"
    let fixed = dateString.replace(" ", "T");
    // Trim fractional seconds to milliseconds (first 3 digits)
    fixed = fixed.replace(/(\.\d{3})\d+/, "$1");
    // Ensure the timezone offset is in the format +00:00 (if it ends with +00 or -00)
    fixed = fixed.replace(/([+-]\d\d)$/, "$1:00");
    return fixed;
  };

  // Helper function to format the date string to "Dec 23, 2024"
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const fixedDateString = fixDateString(dateString);
    const dateObj = new Date(fixedDateString);
    return isNaN(dateObj)
      ? "Unknown date"
      : new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }).format(dateObj);
  };

  // Vocabulary groups defined statically
  const vocabularyGroups = [
    {
      name: "Lesson 1 Genki 1",
      path: "/learn/vocabulary/notecards?lesson=1",
      terms: 30,
      date: "12/23/2024",
    },
    {
      name: "Lesson 2 Genki 1",
      path: "/learn/vocabulary/notecards?lesson=2",
      terms: 20,
      date: "12/23/2024",
    },
    {
      name: "Lesson 3 Genki 1",
      path: "/learn/vocabulary/notecards?lesson=3",
      terms: 25,
      date: "12/23/2024",
    },
    {
      name: "Lesson 4 Genki 1",
      path: "/learn/vocabulary/notecards?lesson=4",
      terms: 40,
      date: "12/23/2024",
    },
    {
      name: "Lesson 5 Genki 1",
      path: "/learn/vocabulary/notecards?lesson=5",
      terms: 28,
      date: "12/23/2024",
    },
    {
      name: "Lesson 6 Genki 1",
      path: "/learn/vocabulary/notecards?lesson=6",
      terms: 15,
      date: "12/23/2024",
    },
    {
      name: "Lesson 7 Genki 1",
      path: "/learn/vocabulary/notecards?lesson=7",
      terms: 35,
      date: "12/23/2024",
    },
    {
      name: "Lesson 8 Genki 1",
      path: "/learn/vocabulary/notecards?lesson=8",
      terms: 22,
      date: "12/23/2024",
    },
    {
      name: "Lesson 9 Genki 1",
      path: "/learn/vocabulary/notecards?lesson=9",
      terms: 18,
      date: "12/23/2024",
    },
    {
      name: "Lesson 10 Genki 1",
      path: "/learn/vocabulary/notecards?lesson=10",
      terms: 26,
      date: "12/23/2024",
    },
    {
      name: "Lesson 11 Genki 1",
      path: "/learn/vocabulary/notecards?lesson=11",
      terms: 26,
      date: "12/23/2024",
    },
    {
      name: "Lesson 12 Genki 1",
      path: "/learn/vocabulary/notecards?lesson=12",
      terms: 26,
      date: "12/23/2024",
    },
  ];

  // Determine which sets to display.
  // If there is a search query, show all matching sets.
  // Otherwise, show only the latest three sets.
  const displayedRecents =
    searchSets.trim().length > 0
      ? recentsSets.filter((set) =>
          set.name.toLowerCase().includes(searchSets.toLowerCase())
        )
      : recentsSets.slice(0, 4);

  return (
    <div className="flex flex-row min-h-screen bg-white dark:bg-[#141f25] text-[#4e4a4a] dark:text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen bg-gray-100 dark:bg-[#141f25]">
        <Head>
          <title>Vocabulary Dashboard</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="h-screen grid grid-rows-[auto,1fr] bg-gray-50 dark:bg-[#141f25] p-4">
          <main className="row-span-1 grid grid-cols-12 gap-x-4 gap-y-8 p-4 mt-16 mx-12">
            {/* === Top row of metrics === */}
            <section className="col-span-6 md:col-span-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg p-4 shadow-md">
              <h2 className="text-lg font-semibold mb-5 text-white">Recent Activity</h2>
              <p className="text-sm text-white ">(Coming Soon!)</p>
            </section>

            <section className="col-span-6 md:col-span-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-4 shadow-md flex flex-col justify-center">
              <div className="flex items-center justify-between w-full ml-2">
                <div>
                  <p className="text-3xl font-[300] text-white mt-2">1,245</p>
                  <h2 className="text-sm font-[400] text-white mt-1 mb-1">Terms (Coming Soon!)</h2>
                </div>
                <button
                  className="flex items-center justify-center text-white w-8 h-8 transition mr-4"
                  onClick={() =>
                    (window.location.href = "/knowledgebase-dashboard")
                  }
                >
                  <FiSettings className="w-full h-full" />
                </button>
              </div>
            </section>

            <section className="col-span-6 md:col-span-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-4 shadow-md flex flex-col justify-center items-center">
              <p className="text-3xl font-[300] text-white mt-2 mr-2">+99</p>
              <h2 className="text-sm font-[400] mt-1 mb-1 text-white">
                New Vocabulary (Coming Soon!)
              </h2>
            </section>

            <section className="col-span-6 md:col-span-3 bg-gradient-to-r from-indigo-500 rounded-lg p-4 shadow-md flex flex-col justify-center">
              <div className="ml-2">
                <p className="text-3xl font-[300] text-white">38</p>
                <h2 className="text-sm font-[400] text-white mt-1">
                  Sets Completed (Coming Soon!)
                </h2>
              </div>
            </section>

            {/* === Bottom row: "Sets" and "Vocabulary Tags" === */}
            {/* Sets / Recents */}
            <section className="col-span-12 md:col-span-6 bg-white dark:bg-[#1c2b35] rounded-lg shadow-lg p-4 pb-8">
              <h2 className="text-2xl font-[400] mb-3 text-gray-800 dark:text-gray-200">
                Sets
              </h2>

              {/* Search + Buttons */}
              <div className="mx-4 flex flex-wrap gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Search saved sets..."
                  value={searchSets}
                  onChange={(e) => setSearchSets(e.target.value)}
                  className="bg-gray-200 dark:bg-[#0d3c4b] text-[#4e4a4a] dark:text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300"
                />
                <button className="relative group bg-gray-200 dark:bg-[#0d3c4b] text-[#4e4a4a] dark:text-white px-6 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300">
                  Edit My Sets
                  <div className="absolute left-1/2 -translate-x-1/2 bg-white text-sm text-black px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    Coming soon!
                  </div>
                </button>

                <button
                  className="text-lg relative group bg-gray-200 dark:bg-[#0d3c4b] text-[#4e4a4a] dark:text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300"
                  onClick={() => router.push("/learn/vocabulary/create-set")}
                >
                  <FaPlus />
                </button>
              </div>

              <h2 className="text-xl font-[300] py-2 text-gray-800 dark:text-gray-200">
                Recents
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {recentsSets.length > 0 ? (
                  displayedRecents.length > 0 ? (
                    displayedRecents.map((set, index) => (
                      <Link
                        key={index}
                        href={{
                          pathname: "/learn/vocabulary/notecards",
                          // Pass the vocabulary array as a JSON string via the "terms" query parameter
                          query: { terms: JSON.stringify(set.terms) },
                        }}
                        className="block mx-4 px-4 py-2 bg-gray-100 dark:bg-[#404f7d] text-left rounded-sm text-sm transition-transform hover:bg-gray-200 dark:hover:bg-[#50597d] hover:border-l-4 hover:border-[#63f4e7] dark:hover:border-l-4 dark:hover:border-[#6dbfb8] shadow-md"
                      >
                        <h2 className="text-lg font-[300] text-gray-800 dark:text-gray-200">
                          {set.name}
                        </h2>
                        <p className="text-sm font-[300] text-[#6b6b6b] dark:text-[#b0b0b0] pt-1">
                          {set.terms.length} Terms | {formatDate(set.date)}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="mx-4 text-gray-600 dark:text-gray-300">
                      No sets found.
                    </p>
                  )
                ) : (
                  <p className="mx-4 text-gray-600 dark:text-gray-300">
                    {userProfile ? "No sets found." : "Loading sets..."}
                  </p>
                )}
              </div>
            </section>

            {/* Vocabulary Tags */}
            <section className="col-span-12 md:col-span-6 bg-white dark:bg-[#1c2b35] rounded-lg shadow-lg p-4">
              <h2 className="text-2xl font-[400] mb-4 text-gray-800 dark:text-gray-200">
                Vocabulary Tags
              </h2>

              <div className="mx-4 flex gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={searchTags}
                  onChange={(e) => setSearchTags(e.target.value)}
                  className="bg-gray-200 dark:bg-[#0d3c4b] text-[#4e4a4a] dark:text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 overflow-y-auto py-4 px-4">
                {vocabularyGroups
                  .filter((group) =>
                    group.name.toLowerCase().includes(searchTags.toLowerCase())
                  )
                  .map((group, index) => (
                    <Link
                      key={index}
                      href={group.path}
                      className="flex flex-col justify-between items-start p-3 bg-gray-100 dark:bg-[#404f7d] rounded-md text-xs md:text-sm transition-transform hover:scale-105 hover:bg-gray-200 dark:hover:bg-[#50597d] shadow"
                    >
                      <span className="text-sm font-[500] text-gray-800 dark:text-white">
                        {group.name}
                      </span>
                      <span className="text-xs font-[300] text-[#6b6b6b] dark:text-[#b0b0b0] mt-1">
                        {group.terms} Terms
                      </span>
                    </Link>
                  ))}
              </div>
            </section>
          </main>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
