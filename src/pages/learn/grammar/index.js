import Head from "next/head";
import Sidebar from "../../../components/Sidebar";
import { useState } from "react";
import { FiSettings } from "react-icons/fi";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import { RiSpeakLine } from "react-icons/ri";
import { LuTimerReset } from "react-icons/lu";
import { BsTextParagraph } from "react-icons/bs";
import { TbSpace } from "react-icons/tb";
import { IoImagesOutline } from "react-icons/io5";
import Link from "next/link";
import { useRouter } from "next/router";
import Select from "react-select";

export default function GrammarDashboard() {
  const [translateSettings, setTranslateSettings] = useState(false);

  // Books
  const [selectedBooks, setSelectedBooks] = useState({
    genki1: false,
    genki2: false,
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

  // List of all lessons
  const lessons = Array.from({ length: 23 }, (_, i) => `Lesson ${i + 1}`);

  // Prepare the filtered lesson options for React Select, based on selected books.
  const filteredLessonOptions = lessons
    .filter((_, index) => {
      // If Genki 1 is selected, show lessons 1-12 (indexes 0-11).
      if (selectedBooks.genki1 && index < 12) return true;
      // If Genki 2 is selected, show lessons 13-23 (indexes 12-22).
      if (selectedBooks.genki2 && index >= 12 && index < 23) return true;
      return false;
    })
    .map((lesson) => ({ value: lesson, label: lesson }));

  // Start translation exercise with the selected lesson
  const handleBegin = () => {
    if (selectedLesson) {
      router.push(
        `/learn/grammar/translateAdapt?lessons=${encodeURIComponent(selectedLesson)}`
      );
    } else {
      alert("Please select a lesson.");
    }
  };

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

  return (
    <div className="flex flex-row min-h-screen bg-white dark:bg-[#141f25] text-[#4e4a4a] dark:text-white">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col min-h-screen bg-gray-100 dark:bg-[#141f25]">
        <Head>
          <title>Grammar Dashboard</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="h-screen grid grid-rows-[auto,1fr] bg-gray-50 dark:bg-[#141f25] p-4">
          <main className="row-span-1 grid grid-cols-12 gap-x-4 gap-y-8 p-4 mt-16 mx-12">
            {/* Recent Activity */}
            <section className="col-span-12 md:col-span-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg p-4 shadow-md">
              <h2 className="text-lg font-semibold mb-4 text-white">
                Recent Activity
              </h2>
              <p className="text-xs">You&apos;ll be able to track your vocabulary practice here.</p>
            </section>

            {/* Grammar Rules Mastered */}
            <section className="col-span-6 md:col-span-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-4 shadow-md flex flex-col justify-center items-center">
              {/* Lowered from text-4xl to text-3xl */}
              <p className="text-3xl font-[300] text-white">120</p>
              <h2 className="text-md font-[400] mt-2 mb-1 text-white">
                Grammar Rules Mastered (Coming Soon!)
              </h2>
            </section>

            {/* Practice Sessions Completed */}
            <section className="col-span-6 md:col-span-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-4 shadow-md flex flex-col justify-center items-center">
              {/* Lowered from text-4xl to text-3xl */}
              <p className="text-3xl font-[300] text-white">45</p>
              <h2 className="text-md font-[400] mt-2 mb-1 text-white">
                Sessions Completed (Coming Soon!)
              </h2>
            </section>

            {/* Translation Section with Animation */}
            <section className="col-span-12 md:col-span-6 lg:col-span-5 relative">
              {/* Translation Settings Section */}
              <div
                className={`absolute inset-0 transform transition-all duration-500 ${translateSettings
                  ? "opacity-100 translate-y-0 pointer-events-auto z-10"
                  : "opacity-0 -translate-y-5 pointer-events-none z-0"
                  }`}
              >
                <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-md flex flex-col justify-between h-full">
                  <div>
                    <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                      Select Book(s)
                    </h2>
                    <div className="grid grid-cols-1 gap-2 ml-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBooks.genki1}
                          onChange={() => handleBookSelection("genki1")}
                          className="mr-2"
                        />
                        Genki 1 Third Edition
                      </label>
                      {/* Add more books if necessary */}
                    </div>

                    <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200 pt-5">
                      Select Lesson
                    </h2>

                    {Object.values(selectedBooks).some((isSelected) => isSelected) ? (
                      <Select
                        options={filteredLessonOptions}
                        value={
                          selectedLesson
                            ? { value: selectedLesson, label: selectedLesson }
                            : null
                        }
                        onChange={(option) => setSelectedLesson(option ? option.value : null)}
                        placeholder="Select a Lesson"
                        isClearable
                        isSearchable
                        /* Override default styles */
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: "#fff",
                            color: "#000",
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: "#000",
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: "#fff",
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? "#f0f0f0" : "#fff",
                            color: "#000",
                          }),
                          placeholder: (base) => ({
                            ...base,
                            color: "#999",
                          }),
                        }}
                      />
                    ) : (
                      <p className="text-gray-500">
                        Please select a book to see lessons.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between mt-4 mb-2 mx-4">
                    <div className="relative inline-block">
                      <div className="absolute inset-x-0 bottom-0 bg-red-700 rounded-lg translate-y-1 h-[90%] transition-transform duration-200"></div>
                      <button
                        className="relative bg-red-500 text-white py-2 px-4 rounded-lg transform transition-transform duration-200 active:translate-y-1"
                        onClick={() => setTranslateSettings(false)}
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="relative inline-block">
                      <div className="absolute inset-x-0 bottom-0 bg-blue-700 rounded-lg translate-y-1 h-[90%] transition-transform duration-200"></div>
                      <button
                        className="relative bg-blue-500 text-white py-2 px-4 rounded-lg transform transition-transform duration-200 active:translate-y-1"
                        onClick={handleBegin}
                      >
                        Begin
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Default Section */}
              <div
                className={`absolute inset-0 transform transition-all duration-500 ${!translateSettings
                  ? "opacity-100 translate-y-0 pointer-events-auto z-10"
                  : "opacity-0 -translate-y-5 pointer-events-none z-0"
                  }`}
              >
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div
                    onClick={toggleTranslateSettings}
                    className="cursor-pointer hover:brightness-110 hover:outline hover:outline-2 hover:outline-gray-200 hover:border-0 border-2 border-gray-250 bg-gradient-to-r from-[#404f7d] to-blue-600 bg-[length:200%] hover:animate-gradient-ease rounded-lg p-4 shadow-lg flex flex-col justify-center items-center"
                  >
                    <h2 className="text-lg font-semibold mb-2 text-white flex items-center">
                      <FaArrowRightArrowLeft className="h-8 w-8 mr-3" />
                      Translation
                    </h2>
                  </div>
                  <Link
                    href="/learn/grammar/conversation"
                    className="group relative cursor-pointer hover:brightness-110 hover:outline hover:outline-2 hover:outline-gray-200 hover:border-0 border-2 border-gray-250 bg-gradient-to-r from-[#404f7d] to-blue-600 bg-[length:200%] hover:animate-gradient-ease rounded-lg p-4 shadow-lg flex flex-col justify-center items-center"
                  >
                    <h2 className="text-lg font-semibold mb-2 text-white flex items-center">
                      <RiSpeakLine className="h-8 w-8 mr-3" />
                      Conversation
                    </h2>
                    <div className="absolute bg-white text-sm text-black px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Coming soon!
                    </div>
                  </Link>

                  <Link
                    href="/learn/grammar/comprehension"
                    className="group relative cursor-pointer hover:brightness-110 hover:outline hover:outline-2 hover:outline-gray-200 hover:border-0 border-2 border-gray-250 bg-gradient-to-r from-[#404f7d] to-blue-600 bg-[length:200%] hover:animate-gradient-ease rounded-lg p-4 shadow-lg flex flex-col justify-center items-center"
                  >
                    <h2 className="text-lg font-semibold mb-2 text-white flex items-center">
                      <BsTextParagraph className="h-8 w-8 mr-3" />
                      Comprehension
                    </h2>
                    <div className="absolute bg-white text-sm text-black px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Coming soon!
                    </div>
                  </Link>

                  <Link
                    href="https://fluency.yourdomain.com"
                    className="group relative cursor-pointer hover:brightness-110 hover:outline hover:outline-2 hover:outline-gray-200 hover:border-0 border-2 border-gray-300 bg-gradient-to-r from-[#404f7d] to-blue-600 bg-[length:200%] hover:animate-gradient-ease rounded-lg p-4 shadow-lg flex flex-col justify-center items-center"
                  >
                    <div>
                      <h2 className="text-lg font-semibold mb-2 text-white flex items-center">
                        <LuTimerReset className="h-8 w-8 mr-3" />
                        Fluency
                      </h2>
                    </div>
                    <div className="absolute bg-white text-sm text-black px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Coming soon!
                    </div>
                  </Link>

                  <Link
                    href="/learn/grammar/cloze"
                    className="group relative cursor-pointer hover:brightness-110 hover:outline hover:outline-2 hover:outline-gray-200 hover:border-0 border-2 border-gray-300 bg-gradient-to-r from-[#404f7d] to-blue-600 bg-[length:200%] hover:animate-gradient-ease rounded-lg p-4 shadow-lg flex flex-col justify-center items-center"
                  >
                    <h2 className="text-lg font-semibold mb-2 text-white flex items-center">
                      <TbSpace className="h-8 w-8 mr-3" />
                      Cloze Exercises
                    </h2>
                    <div className="absolute bg-white text-sm text-black px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Coming soon!
                    </div>
                  </Link>

                  <Link
                    href="/learn/grammar/imagematching"
                    className="group relative cursor-pointer hover:brightness-110 hover:outline hover:outline-2 hover:outline-gray-200 hover:border-0 border-2 border-gray-300 bg-gradient-to-r from-[#404f7d] to-blue-600 bg-[length:200%] hover:animate-gradient-ease rounded-lg p-4 shadow-lg flex flex-col justify-center items-center"
                  >
                    <h2 className="text-lg font-semibold mb-2 text-white flex items-center">
                      <IoImagesOutline className="h-8 w-8 mr-3" />
                      Matching
                    </h2>
                    <div className="absolute bg-white text-sm text-black px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Coming soon!
                    </div>
                  </Link>
                </div>
              </div>
            </section>

            {/* Practice Topics */}
            <section className="col-span-6 md:col-span-6 lg:col-span-7 bg-white dark:bg-[#1c2b35] rounded-lg shadow-lg p-4">
              {/* Lowered from text-2xl to text-xl */}
              <h2 className="text-xl font-[400] mb-3 text-gray-800 dark:text-gray-200">
                Practice Topics
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {grammarPracticeSets.map((set, index) => (
                  <Link
                    key={index}
                    href={set.path}
                    className="group relative block bg-gray-100 dark:bg-[#404f7d] text-left rounded-lg text-sm p-4 transition-transform hover:bg-gray-200 dark:hover:bg-[#50597d] shadow-md"
                  >
                    <div className="absolute bg-white text-sm text-black px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Coming soon!
                    </div>
                    <h2 className="text-lg font-[300] text-gray-800 dark:text-gray-200">
                      {set.name}
                    </h2>
                    <p className="text-sm text-[#6b6b6b] dark:text-[#b0b0b0]">
                      {set.exercises} Exercises |{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      }).format(new Date(set.date))}
                    </p>
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
