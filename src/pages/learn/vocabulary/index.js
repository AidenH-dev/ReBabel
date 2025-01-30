import Head from "next/head";
import Sidebar from "../../../components/Sidebar";
import { useState } from "react";
import Link from "next/link";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { FiSettings } from "react-icons/fi";

export default function VocabularyDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  // Example sets
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

        {/* 
          Here we mirror the grammar page structure:
          - a parent container with "h-screen" or "min-h-screen"
          - a grid layout with grid-rows-[auto,1fr]
          - an inner grid for the main content using grid-cols-12
        */}
        <div className="h-screen grid grid-rows-[auto,1fr] bg-gray-50 dark:bg-[#141f25] p-4">
          <main className="row-span-1 grid grid-cols-12 gap-x-4 gap-y-8 p-4 mt-16 mx-12">
            {/* === Top row of 4 metrics === */}
            {/* 1) Study Activity */}
            <section className="col-span-6 md:col-span-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg p-4 shadow-md">
              <h2 className="text-lg font-semibold mb-4 text-white">Study Activity</h2>
              <p className="text-sm text-white">Coming Soon!</p>
            </section>

            {/* 2) Total Word Bank */}
            <section className="col-span-6 md:col-span-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-4 shadow-md flex flex-col justify-center">
              <div className="flex items-center justify-between w-full ml-2">
                <div>
                  <p className="text-4xl font-[300] text-white">1,245</p>
                  <h2 className="text-md font-[400] text-white">Total Word Bank</h2>
                </div>
                <button
                  className="flex items-center justify-center text-white w-10 h-10 transition mr-4"
                  onClick={() => (window.location.href = "/knowledgebase-dashboard")}
                >
                  <FiSettings className="w-full h-full" />
                </button>
              </div>
            </section>


            {/* 4) Vocabulary Tracker (or New Vocab) */}
            <section className="col-span-6 md:col-span-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-4 shadow-md flex flex-col justify-center items-center">
              <p className="text-4xl font-[300] text-white">+99</p>
              <h2 className="text-md font-[400] mt-3 mb-1 text-white">
                Vocabulary Tracker Coming Soon!
              </h2>
            </section>

            {/* 3) Quizzes Completed */}
            <section className="col-span-6 md:col-span-3 bg-gradient-to-r from-indigo-500 rounded-lg p-4 shadow-md flex flex-col justify-center">
              <div className="ml-2">
                <p className="text-4xl font-[300] text-white">38</p>
                <h2 className="text-md font-[400] text-white">Sets Completed Coming Soon!</h2>
              </div>
            </section>




            {/* === Bottom row: "Sets" and "Vocabulary Tags" === */}
            {/* Sets / Recents */}
            <section className="col-span-12 md:col-span-6 bg-white dark:bg-[#1c2b35] rounded-lg shadow-lg p-4">
              <h2 className="text-2xl font-[400] mb-3 text-gray-800 dark:text-gray-200">
                Sets
              </h2>

              {/* Search + Buttons */}
              <div className="mx-4 flex flex-wrap gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Search saved sets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-200 dark:bg-[#0d3c4b] text-[#4e4a4a] dark:text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300"
                />
                <button className="bg-gray-200 dark:bg-[#0d3c4b] text-[#4e4a4a] dark:text-white px-6 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300">
                  Edit My Sets
                </button>
              </div>

              <h2 className="text-xl font-[300] py-2 text-gray-800 dark:text-gray-200">
                Recents
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {vocabularySets
                  .filter((set) =>
                    set.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((set, index) => {
                    const formattedDate = new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    }).format(new Date(set.date));

                    return (
                      <Link
                        key={index}
                        href={set.path}
                        className="block mx-4 px-4 py-2 bg-gray-100 dark:bg-[#404f7d] text-left rounded-sm text-sm transition-transform hover:bg-gray-200 dark:hover:bg-[#50597d] dark:hover:border-l-4  dark:hover:border-[#6dbfb8] shadow-md"
                      >
                        <h2 className="text-lg font-[300] text-gray-800 dark:text-gray-200">
                          {set.name}
                        </h2>
                        <p className="text-sm font-[300] text-[#6b6b6b] dark:text-[#b0b0b0] pt-1">
                          {set.terms} Terms | {formattedDate}
                        </p>
                      </Link>
                    );
                  })}
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-200 dark:bg-[#0d3c4b] text-[#4e4a4a] dark:text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto py-4 px-4">
                {vocabularyGroups
                  .filter((group) =>
                    group.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((group, index) => {
                    return (
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
                    );
                  })}
              </div>
            </section>
          </main>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
