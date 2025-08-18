import Head from "next/head";
import Sidebar from "../../../components/Sidebar";
import { useState } from "react";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import Link from "next/link";
import { useRouter } from "next/router";
import Select from "react-select";

export default function GrammarDashboard() {
  const [translateSettings, setTranslateSettings] = useState(false);

  // Books (only needed for Translation)
  const [selectedBooks, setSelectedBooks] = useState({
    genki1: false,
    // genki2: false, // keeping minimal
  });

  // Single Lesson
  const [selectedLesson, setSelectedLesson] = useState(null);

  const router = useRouter();

  const toggleTranslateSettings = () => {
    setTranslateSettings((prev) => !prev);
  };

  const handleBookSelection = (book) => {
    setSelectedBooks((prev) => ({ ...prev, [book]: !prev[book] }));
  };

  // List of all lessons (Genki I only for now)
  const lessons = Array.from({ length: 12 }, (_, i) => `Lesson ${i + 1}`);

  // Prepare the filtered lesson options for React Select
  const filteredLessonOptions = lessons.map((lesson) => ({
    value: lesson,
    label: lesson,
  }));

  // Start translation exercise with the selected lesson
  const handleBegin = () => {
    if (selectedLesson) {
      router.push(
        `/learn/grammar/translateAdapt?lessons=${encodeURIComponent(
          selectedLesson
        )}`
      );
    } else {
      alert("Please select a lesson.");
    }
  };

  // --- Keep ONLY Verb Conjugations in practice sets ---
  const grammarPracticeSets = [
    {
      name: "Verb Conjugations",
      path: "/learn/grammar/practice/verbs",
      exercises: 15,
      date: "12/23/2024",
    },
  ];

  return (
    <div className="flex flex-row min-h-screen bg-white dark:bg-[#141f25] text-[#4e4a4a] dark:text-white">
      <Sidebar />

      {/* Main area - responsive padding and margin */}
      <main className="ml-auto flex-1 min-h-screen bg-gray-100 dark:bg-[#141f25]">
        <Head>
          <title>Grammar • Translation & Verbs</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Responsive container */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            {/* ============================ */}
            {/* Compact header               */}
            {/* ============================ */}
            <div className="mb-6">
              <h1 className="text-lg sm:text-xl font-[500] text-gray-800 dark:text-gray-100">
                Grammar Practice
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                Focused tools: Translation & Verb Conjugations
              </p>
            </div>

            {/* ============================ */}
            {/* Responsive Grid              */}
            {/* ============================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* ============================ */}
              {/* Translation Section          */}
              {/* ============================ */}
              <section className="relative min-h-[200px]">
                {/* Settings Panel (overlay) */}
                <div
                  className={`absolute inset-0 transform transition-all duration-300 ${
                    translateSettings
                      ? "opacity-100 translate-y-0 pointer-events-auto z-10"
                      : "opacity-0 -translate-y-2 pointer-events-none z-0"
                  }`}
                >
                  <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-md h-full flex flex-col">
                    <div className="flex-1">
                      <h2 className="text-sm sm:text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">
                        Translation Settings
                      </h2>

                      <div>
                        <h3 className="text-xs sm:text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
                          Select Book
                        </h3>

                        <label className="flex items-center cursor-pointer mb-3 ml-1 text-xs sm:text-sm">
                          <input
                            type="checkbox"
                            checked={selectedBooks.genki1}
                            onChange={() => handleBookSelection("genki1")}
                            className="mr-2"
                          />
                          Genki 1 (Third Edition)
                        </label>

                        <h3 className="text-xs sm:text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
                          Select Lesson
                        </h3>

                        {selectedBooks.genki1 ? (
                          <Select
                            options={filteredLessonOptions}
                            value={
                              selectedLesson
                                ? { value: selectedLesson, label: selectedLesson }
                                : null
                            }
                            onChange={(option) =>
                              setSelectedLesson(option ? option.value : null)
                            }
                            placeholder="Choose a lesson"
                            isClearable
                            isSearchable
                            styles={{
                              control: (base, state) => ({
                                ...base,
                                backgroundColor: "#fff",
                                color: "#000",
                                minHeight: 34,
                                height: 34,
                                borderColor: state.isFocused ? "#e30a5f" : base.borderColor,
                                boxShadow: state.isFocused ? "0 0 0 1px #e30a5f" : "none",
                                "&:hover": {
                                  borderColor: state.isFocused ? "#e30a5f" : base.borderColor,
                                },
                              }),
                              valueContainer: (base) => ({
                                ...base,
                                padding: "0 8px",
                              }),
                              input: (base) => ({ ...base, margin: 0, padding: 0 }),
                              indicatorsContainer: (base) => ({
                                ...base,
                                height: 34,
                              }),
                              singleValue: (base) => ({ ...base, color: "#000" }),
                              menu: (base) => ({ ...base, backgroundColor: "#fff" }),
                              option: (base, state) => ({
                                ...base,
                                fontSize: "0.875rem",
                                backgroundColor: state.isFocused ? "#f0f0f0" : "#fff",
                                color: "#000",
                              }),
                              placeholder: (base) => ({ ...base, color: "#999" }),
                            }}
                          />
                        ) : (
                          <p className="text-gray-500 text-xs sm:text-sm">
                            Check <span className="font-medium">Genki 1</span> to choose a
                            lesson.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between mt-4 gap-2">
                      <button
                        className="border border-gray-400 dark:border-white/40 text-gray-700 dark:text-white rounded-lg py-1.5 px-3 text-xs hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20 transition"
                        onClick={() => setTranslateSettings(false)}
                      >
                        Cancel
                      </button>

                      <div className="relative inline-block">
                        <div className="absolute inset-x-0 bottom-0 bg-[#B0104F] rounded-lg translate-y-1 h-[88%] transition-transform duration-200"></div>
                        <button
                          className="relative bg-[#E30B5C] active:bg-[#f41567] text-white py-1.5 px-3 rounded-lg transform transition-transform duration-200 active:translate-y-1 text-xs"
                          onClick={handleBegin}
                        >
                          Begin
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Default Translation Tile */}
                <div
                  className={`transform transition-all duration-300 ${
                    !translateSettings
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 -translate-y-2 pointer-events-none"
                  }`}
                >
                  <div
                    onClick={toggleTranslateSettings}
                    className="cursor-pointer hover:brightness-110 hover:outline hover:outline-2 hover:outline-gray-200 hover:border-0 border-2 border-gray-200 bg-gradient-to-r from-[#662f45] to-[#e30a5f] bg-[length:200%] hover:animate-gradient-ease rounded-lg p-5 shadow-lg flex flex-col justify-center items-center h-[200px]"
                  >
                    <h2 className="text-sm sm:text-base font-semibold mb-1.5 text-white flex items-center">
                      <FaArrowRightArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-2.5" />
                      Practice Translation
                    </h2>
                    <p className="text-[white]/90 text-xs sm:text-sm">
                      Click to choose book & lesson
                    </p>
                  </div>
                </div>
              </section>

              {/* ============================ */}
              {/* Verb Conjugations Section    */}
              {/* ============================ */}
              <section>
                <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-lg p-5 sm:p-6 lg:p-8 h-[200px] flex flex-col justify-center">
                  <h2 className="text-base sm:text-lg font-[500] mb-1.5 text-gray-800 dark:text-gray-200">
                    Adjective & Verb Conjugations
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6b6b6b] dark:text-[#b0b0b0] mb-3">
                    Practice conjugation patterns across forms and politeness levels.
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5">
                    {grammarPracticeSets.map((set, index) => (
                      <Link
                        key={index}
                        href={"/learn/grammar/conjugation"}
                        className="inline-flex items-center justify-center bg-[#e30a5f] hover:bg-[#b30e50] text-white rounded-md px-3 py-1.5 text-xs transition active:translate-y-[1px] shadow-md w-full sm:w-auto"
                      >
                        Start A Practice Session
                      </Link>
                    ))}
                    {/* Meta info - responsive */}
                    <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 text-center sm:text-left">
                      {grammarPracticeSets[0].exercises} Exercises •{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      }).format(new Date(grammarPracticeSets[0].date))}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();