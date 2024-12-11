import Head from "next/head";
import Sidebar from "../../../components/Sidebar"; // Import your Sidebar component
import { useState, useEffect } from "react";
import { FiSettings } from "react-icons/fi";
import { IoFastFoodOutline } from "react-icons/io5";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const studyModes = [
    { name: "Notecards", path: "/learn/vocabulary/notecards" },
    { name: "Quizzing", path: "/learn/vocabulary/quizzing" },
    { name: "Writing", path: "/learn/vocabulary/writing" },
    { name: "Immersion", path: "/learn/vocabulary/immersion" },
    { name: "Chunking", path: "/learn/vocabulary/games" },
  ];
  const vocabularySets = [
    {
      name: "Lesson 1",
      path: "/learn/vocabulary/notecards",
      terms: 40,
      date: "12/23/2024",
    },
    {
      name: "Food",
      path: "/learn/vocabulary/quizzing",
      terms: 15,
      date: "12/23/2024",
    },
    {
      name: "Lesson 2 & 3",
      path: "/learn/vocabulary/writing",
      terms: 23,
      date: "12/23/2024",
    },
    {
      name: "Immersion",
      path: "/learn/vocabulary/immersion",
      terms: 54,
      date: "12/23/2024",
    },
    {
      name: "Chunking",
      path: "/learn/vocabulary/games",
      terms: 36,
      date: "12/23/2024",
    },
  ];

  const vocabularyGroups = [
    {
      name: "Food",
      path: "/learn/vocabulary/notecards",
      terms: 30,
      date: "12/23/2024",
    },
    {
      name: "Colors",
      path: "/learn/vocabulary/quizzing",
      terms: 20,
      date: "12/23/2024",
    },
    {
      name: "Descriptors",
      path: "/learn/vocabulary/writing",
      terms: 25,
      date: "12/23/2024",
    },
    {
      name: "Animals",
      path: "/learn/vocabulary/immersion",
      terms: 40,
      date: "12/23/2024",
    },
    {
      name: "Clothing",
      path: "/learn/vocabulary/games",
      terms: 28,
      date: "12/23/2024",
    },
    {
      name: "Weather",
      path: "/learn/vocabulary/notecards",
      terms: 15,
      date: "12/23/2024",
    },
    {
      name: "Body Parts",
      path: "/learn/vocabulary/quizzing",
      terms: 35,
      date: "12/23/2024",
    },
    {
      name: "Family",
      path: "/learn/vocabulary/writing",
      terms: 22,
      date: "12/23/2024",
    },
    {
      name: "Hobbies",
      path: "/learn/vocabulary/immersion",
      terms: 18,
      date: "12/23/2024",
    },
    {
      name: "Emotions",
      path: "/learn/vocabulary/games",
      terms: 26,
      date: "12/23/2024",
    },
  ];

  useEffect(() => {
    // Set the initial theme based on system preferences
    const isDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (e) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    mediaQuery.addEventListener("change", handleThemeChange);

    // Cleanup listener on component unmount
    return () => mediaQuery.removeEventListener("change", handleThemeChange);
  }, []);

  return (
    <div className="flex flex-row min-h-screen bg-white dark:bg-[#141f25] text-[#4e4a4a] dark:text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen bg-gray-100 dark:bg-[#141f25]">
        <Head>
          <title>Study Dashboard</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Dashboard Content */}
        <div className="p-20 mt-4">
          {/* Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Git Commit-style Calendar */} {/* FIX THE AUTO STYLING */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg p-4 shadow-md">
              <h2 className="text-lg font-semibold mb-4">Study Activity</h2>
              <p className="text-sm">Track your grammar practice here.</p>
            </div>
            {/* Existing Metrics */}
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500  rounded-lg p-4 shadow-md h-fit">
                {/* Left Section: Number and Name */}
                <div>
                  <p className="text-4xl font-[300]">1,245</p>
                  <h2 className="text-md font-[400] mt-3 mb-1">
                    Total Word Bank
                  </h2>
                </div>

                {/* Right Section: Button with Icon */}
                <button
                  className="flex items-center justify-center text-white  w-10 h-10 transition mr-4"
                  onClick={() =>
                    (window.location.href = "/knowledgebase-dashboard")
                  }
                >
                  <FiSettings className="w-full h-full" />
                </button>
              </div>

              <div className="bg-gradient-to-r from-indigo-500 rounded-lg p-4 shadow-md h-fit">
                <p className="text-4xl font-[300]">38</p>
                <h2 className="text-md font-[400] mt-3 mb-1">
                  Quizzes Completed
                </h2>
              </div>
              <div className="bg-gradient-to-r from-indigo-500 rounded-lg p-4 shadow-md h-fit">
                <p className="text-4xl font-[300]">57</p>
                <h2 className="text-md font-[400] mt-3 mb-1">
                  New Vocabulary This Week
                </h2>
              </div>
            </div>
          </div>

          <div className=" pb-20">
            <div className="grid grid-cols-2 min-h-full gap-3 mb-10">
              {/* Study Modes Section */}
              <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-lg p-4">
                <h2 className="text-2xl font-[400] mb-3">Sets</h2>
                <div className="mx-4 flex gap-3">
                  <input
                    type="text"
                    placeholder="Search saved sets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-200 dark:bg-[#0d3c4b] text-[#4e4a4a] dark:text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 "
                  />
                  <button className="bg-gray-200 dark:bg-[#0d3c4b] text-[#4e4a4a] dark:text-white px-6 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 ">
                    My Sets
                  </button>

                  <button className="bg-gray-200 dark:bg-[#0d3c4b] text-[#4e4a4a] dark:text-white px-6 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 ">
                    Prebuilt
                  </button>
                </div>
                {/*<h2 className="text-2xl font-[400] mb-3">Study</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-4">
                  {studyModes
                    .filter((mode) =>
                      mode.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((mode, index) => (
                      <a
                        key={index}
                        href={mode.path}
                        className="block p-4 bg-gray-100 dark:bg-[#0d3c4b] text-center rounded-lg text-sm transition-transform hover:scale-105 hover:bg-gray-200 dark:hover:bg-[#0f4d63] shadow-md"
                      >
                        <h2 className="text-lg font-semibold">{mode.name}</h2>
                      </a>
                    ))}
                </div>*/}
                {/* User Uploaded Vocabulary Sets */}
                <h2 className="text-xl font-[300] py-3">Recents</h2>
                <div className="grid grid-cols-1 gap-3">
                  {vocabularySets
                    .filter((set) =>
                      set.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((set, index) => {
                      // Format the date as "Mar 24 2024"
                      const formattedDate = new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      }).format(new Date(set.date));

                      return (
                        <a
                          key={index}
                          href={set.path}
                          className="block mx-4 px-4 py-2 bg-gray-100 dark:bg-[#404f7d] text-left rounded-sm text-sm transition-transform hover:bg-gray-200 dark:hover:bg-[#404f7d] dark:hover:border-l-4  dark:hover:border-[#6dbfb8] shadow-md"
                        >
                          <h2 className="text-lg font-[300]">{set.name}</h2>
                          <p className="text-sm font-[300] text-[#6b6b6b] dark:text-[#b0b0b0] pt-1">
                            {set.terms} Terms | {formattedDate}
                          </p>
                        </a>
                      );
                    })}
                </div>
              </div>
              {/* User Uploaded Vocabulary Sets */}
              <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-lg p-4">
                <h2 className="text-2xl font-[400] mb-4">Vocabulary Tags</h2>
                <div className="mx-4 flex gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Search tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-200 dark:bg-[#0d3c4b] text-[#4e4a4a] dark:text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 "
                  />
                </div>
                {/* Add a grid container for rectangular tags */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto py-4 px-4">
                  {vocabularyGroups
                    .filter((set) =>
                      set.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((set, index) => {
                      // Format the date as "Mar 24 2024"
                      const formattedDate = new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      }).format(new Date(set.date));

                      return (
                        <a
                          key={index}
                          href={set.path}
                          className="flex flex-col justify-between items-start p-3 bg-gray-100 dark:bg-[#404f7d] rounded-md text-xs md:text-sm transition-transform hover:scale-105 hover:bg-gray-200 dark:hover:bg-[#50597d] shadow"
                        >
                          <span className="text-sm font-[500] text-[#1c1c1c] dark:text-white">
                            {set.name}
                          </span>
                          <span className="text-xs font-[300] text-[#6b6b6b] dark:text-[#b0b0b0] mt-1">
                            {set.terms} Terms
                          </span>
                        </a>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();

//<div className="grid grid-flow-col auto-cols-max gap-2">
//{/* Columns for Dynamic Weeks */}
//{Array.from({ length: 21 }).map((_, index) => (
//  <div key={index} className="grid grid-rows-7 gap-1">
//    {/* Rows for Days of the Week */}
//    {Array.from({ length: 7 }).map((_, dayIndex) => {
//      // Simulate activity level for styling
//      const activityLevel = Math.floor(Math.random() * 5); // Random activity level
//      const activityColors = [
//        "bg-gray-300 dark:bg-gray-700", // No activity
//        "bg-green-200 dark:bg-[#0e4429]", // Low activity
//        "bg-green-400 dark:bg-[#046c32]", // Medium activity
//        "bg-green-600 dark:bg-[#27a642]", // High activity
//        "bg-green-800 dark:bg-[#3bd354]", // Very high activity
//      ];
//
//      return (
//        <div
//          key={dayIndex}
//          className={`w-4 h-4 rounded-sm ${activityColors[activityLevel]}`}
//        />
//      );
//    })}
//  </div>
//))}
//</div>
