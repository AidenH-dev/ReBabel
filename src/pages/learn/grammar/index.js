import Head from "next/head";
import Sidebar from "../../../components/Sidebar"; // Import your Sidebar component
import { useState, useEffect } from "react";
import { FiSettings } from "react-icons/fi";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import { RiSpeakLine } from "react-icons/ri";
import { TbListCheck } from "react-icons/tb";
import { IoIosTimer } from "react-icons/io";
import { LuTimerReset } from "react-icons/lu";
import { BsTextParagraph } from "react-icons/bs";
import { TbSpace } from "react-icons/tb";
import { IoImagesOutline } from "react-icons/io5";
import Link from "next/link";

export default function GrammarDashboard() {

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
          {/* Main Content Area */}
          <main className="row-span-1 grid grid-cols-12 gap-x-4 gap-y-8 p-4 mt-16 mx-12">
            {/* Recent Activity */}
            <section className="col-span-12 md:col-span-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg p-4 shadow-md">
              <h2 className="text-lg font-semibold mb-4 text-white">
                Recent Activity
              </h2>
              <p className="text-sm text-white">
                Track your grammar practice here.
              </p>
            </section>

            {/* Grammar Rules Mastered */}
            <section className="col-span-6 md:col-span-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-4 shadow-md flex flex-col justify-center items-center">
              <p className="text-4xl font-[300] text-white">120</p>
              <h2 className="text-md font-[400] mt-3 mb-1 text-white">
                Grammar Rules Mastered
              </h2>
            </section>

            {/* Practice Sessions Completed */}
            <section className="col-span-6 md:col-span-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-4 shadow-md flex flex-col justify-center items-center">
              <p className="text-4xl font-[300] text-white">45</p>
              <h2 className="text-md font-[400] mt-3 mb-1 text-white">
                Practice Sessions Completed
              </h2>
            </section>

            {/* Learning Tools CAUSES WHITE SCREEN ERROR MUST FIX*/}
            <section className="col-span-18 md:col-span-6 lg:col-span-5 grid grid-cols-2 gap-4">
              <Link
                href="/learn/grammar/translate"
                className="cursor-pointer hover:brightness-110 hover:outline hover:outline-2 hover:outline-gray-200 hover:border-0 border-2 border-gray-250 bg-gradient-to-r from-[#404f7d] to-blue-600 bg-[length:200%] hover:animate-gradient-ease rounded-lg p-4 shadow-lg flex flex-col justify-center items-center"
              >
                <div>
                  <h2 className="text-lg font-semibold mb-2 text-gray-250 flex items-center">
                    <FaArrowRightArrowLeft className="h-8 w-8 mr-3" />
                    Translation
                  </h2>
                </div>
              </Link>
              <Link
                href="/learn/grammar/translate"
                className="cursor-pointer hover:brightness-110 hover:outline hover:outline-2 hover:outline-gray-200 hover:border-0 border-2 border-gray-250 bg-gradient-to-r from-[#404f7d] to-blue-600 bg-[length:200%] hover:animate-gradient-ease rounded-lg p-4 shadow-lg flex flex-col justify-center items-center"
              >
                <div>
                  <h2 className="text-lg font-semibold mb-2 text-gray-250 flex items-center">
                    <RiSpeakLine className="h-8 w-8 mr-3" />
                    Conversation
                  </h2>
                </div>
              </Link>

              <Link
                href="https://comprehension.yourdomain.com"
                className="cursor-pointer hover:brightness-110 hover:outline hover:outline-2 hover:outline-gray-200 hover:border-0 border-2 border-gray-250 bg-gradient-to-r from-[#404f7d] to-blue-600 bg-[length:200%] hover:animate-gradient-ease rounded-lg p-4 shadow-lg flex flex-col justify-center items-center"
              >
                <div>
                  <h2 className="text-lg font-semibold mb-2 text-gray-250 flex items-center">
                    <BsTextParagraph className="h-8 w-8 mr-3" />
                    Comprehension
                  </h2>
                </div>
              </Link>

              <Link
                href="https://fluency.yourdomain.com"
                className="cursor-pointer hover:brightness-110 hover:outline hover:outline-2 hover:outline-gray-200 hover:border-0 border-2 border-gray-300 bg-gradient-to-r from-[#404f7d] to-blue-600 bg-[length:200%] hover:animate-gradient-ease rounded-lg p-4 shadow-lg flex flex-col justify-center items-center"
              >
                <div>
                  <h2 className="text-lg font-semibold mb-2 text-gray-250 flex items-center">
                    <LuTimerReset className="h-8 w-8 mr-3" />
                    Fluency
                  </h2>
                </div>
              </Link>

              <Link
                href="https://cloze.yourdomain.com"
                className="cursor-pointer hover:brightness-110 hover:outline hover:outline-2 hover:outline-gray-200 hover:border-0 border-2 border-gray-300 bg-gradient-to-r from-[#404f7d] to-blue-600 bg-[length:200%] hover:animate-gradient-ease rounded-lg p-4 shadow-lg flex flex-col justify-center items-center"
              >
                <div>
                  <h2 className="text-lg font-semibold mb-2 text-gray-250 flex items-center">
                    <TbSpace className="h-8 w-8 mr-3" />
                    Cloze Exercises
                  </h2>
                </div>
              </Link>

              <Link
                href="https://imagematching.yourdomain.com"
                className="cursor-pointer hover:brightness-110 hover:outline hover:outline-2 hover:outline-gray-200 hover:border-0 border-2 border-gray-300 bg-gradient-to-r from-[#404f7d] to-blue-600 bg-[length:200%] hover:animate-gradient-ease rounded-lg p-4 shadow-lg flex flex-col justify-center items-center"
              >
                <div>
                  <h2 className="text-lg font-semibold mb-2 text-gray-250 flex items-center">
                    <IoImagesOutline className="h-8 w-8 mr-3" />
                    Image Matching
                  </h2>
                </div>
              </Link>
            </section>

            {/* Practice Topics */}
            <section className="col-span-6 md:col-span-6 lg:col-span-7 bg-white dark:bg-[#1c2b35] rounded-lg shadow-lg p-4">
              <h2 className="text-2xl font-[400] mb-3 text-gray-800 dark:text-gray-200">
                Practice Topics
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {grammarPracticeSets.map((set, index) => (
                  <Link
                    key={index}
                    href={set.path}
                    className="block bg-gray-100 dark:bg-[#404f7d] text-left rounded-lg text-sm p-4 transition-transform hover:bg-gray-200 dark:hover:bg-[#50597d] shadow-md"
                  >
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
