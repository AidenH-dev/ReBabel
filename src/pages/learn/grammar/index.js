import Head from "next/head";
import Sidebar from "../../../components/Sidebar"; // Import your Sidebar component
import { useState, useEffect } from "react";
import { FiSettings } from "react-icons/fi";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default function GrammarDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  const grammarTopics = [
    { name: "Verb Conjugations", path: "/learn/grammar/verbs" },
    { name: "Sentence Structure", path: "/learn/grammar/sentences" },
    { name: "Particles", path: "/learn/grammar/particles" },
    { name: "Tenses", path: "/learn/grammar/tenses" },
    { name: "Modifiers", path: "/learn/grammar/modifiers" },
  ];


  const grammarPracticeSets = [
    {
      name: "Verb Conjugations",
      path: "/learn/grammar/practice/verbs",
      exercises: 15,
      date: "12/23/2024",
    },
    {
      name: "Sentence Structure",
      path: "/learn/grammar/practice/sentences",
      exercises: 10,
      date: "12/23/2024",
    },
    {
      name: "Particles",
      path: "/learn/grammar/practice/particles",
      exercises: 20,
      date: "12/23/2024",
    },
    {
      name: "Tenses",
      path: "/learn/grammar/practice/tenses",
      exercises: 12,
      date: "12/23/2024",
    },
    {
      name: "Modifiers",
      path: "/learn/grammar/practice/modifiers",
      exercises: 8,
      date: "12/23/2024",
    },
  ];

  useEffect(() => {
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (e) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    mediaQuery.addEventListener("change", handleThemeChange);

    return () => mediaQuery.removeEventListener("change", handleThemeChange);
  }, []);

  return (
    <div className="flex flex-row min-h-screen bg-white dark:bg-[#141f25] text-[#4e4a4a] dark:text-white">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col min-h-screen bg-gray-100 dark:bg-[#141f25]">
        <Head>
          <title>Grammar Dashboard</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="p-20 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg p-4 shadow-md">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <p className="text-sm">Track your grammar practice here.</p>
            </div>
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-4 shadow-md">
              <p className="text-4xl font-[300]">120</p>
              <h2 className="text-md font-[400] mt-3 mb-1">Grammar Rules Mastered</h2>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-4 shadow-md">
              <p className="text-4xl font-[300]">45</p>
              <h2 className="text-md font-[400] mt-3 mb-1">Practice Sessions Completed</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-lg p-4">
              <h2 className="text-2xl font-[400] mb-3">Flexible Learning</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {grammarTopics.map((topic, index) => (
                  <a
                    key={index}
                    href={topic.path}
                    className="block bg-gray-100 dark:bg-[#0d3c4b] text-center rounded-lg text-sm p-4 transition-transform hover:scale-105 hover:bg-gray-200 dark:hover:bg-[#0f4d63] shadow-md"
                  >
                    <h2 className="text-lg font-semibold">{topic.name}</h2>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-lg p-4">
              <h2 className="text-2xl font-[400] mb-3">Practice topics</h2>
              <div className="grid grid-cols-1 gap-3">
                {grammarPracticeSets.map((set, index) => (
                  <a
                    key={index}
                    href={set.path}
                    className="block bg-gray-100 dark:bg-[#404f7d] text-left rounded-lg text-sm p-4 transition-transform hover:bg-gray-200 dark:hover:bg-[#50597d] shadow-md"
                  >
                    <h2 className="text-lg font-[300]">{set.name}</h2>
                    <p className="text-sm text-[#6b6b6b] dark:text-[#b0b0b0]">
                      {set.exercises} Exercises | {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      }).format(new Date(set.date))}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();