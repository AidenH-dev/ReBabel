import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  FaArrowLeftLong,
  FaArrowRight,
  FaArrowRightLong,
} from "react-icons/fa6";
import { CiPlay1 } from "react-icons/ci";
import { TbDivide, TbLoader3 } from "react-icons/tb";
import { useState } from "react";
import { useEffect } from "react";
import Chart from "chart.js/auto";
import { useRef } from "react";
import Sidebar from "../../../components/Sidebar.js"; // Import the Sidebar component
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import ProgressBarComponent from "@/components/progress-bar.js";
import { TbX } from "react-icons/tb";
import { MdOutlineQuiz } from "react-icons/md";


export default function Learn() {
  const [responseMessage, setResponseMessage] = useState(null);
  const [responseMessageGrade, setResponseMessageGrade] = useState(null);
  const chartRefs = useRef({});
  const inputRef = useRef(null); // Reference for input field

  const [isLoading, setIsLoading] = useState(false); // State for button loading

  const handleButtonClick = async () => {
    setIsLoading(true); // Set loading state to true before fetch
    try {
      const response = await fetch("/api/gpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Include a body if your API expects any data, otherwise it can be omitted
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log(data);
      const parsedData = JSON.parse(data.message); // Parse the message string into an object
      setResponseMessage(parsedData.sentence); // Extract and set only the sentence
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false); // Set loading state to false after fetch (important for cleanup)
    }
  };

  const handleButtonClickGrade = async () => {
    setIsLoading(true);
    const japaneseSentence = inputRef.current.value;
    const englishSentence = responseMessage;

    console.log("Japanese Sentence:", japaneseSentence);
    console.log("English Sentence:", englishSentence);

    try {
      const response = await fetch("/api/grader-gpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ japaneseSentence, englishSentence }),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log(data);
      const parsedData = JSON.parse(data.message); // Parse the message string into an object
      setResponseMessageGrade(parsedData); // Extract and set only the sentence
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false); // Set loading state to false after fetch (important for cleanup)
    }
  };

  useEffect(() => {
    if (responseMessageGrade) {
      const chartsData = {
        grammarChart: {
          value: responseMessageGrade.grades.grammar_and_structure,
          max: 20,
        },
        vocabularyChart: {
          value: responseMessageGrade.grades.vocabulary_and_expression,
          max: 20,
        },
        spellingChart: {
          value: responseMessageGrade.grades.spelling_and_script_accuracy,
          max: 20,
        },
        politenessChart: {
          value:
            responseMessageGrade.grades.politeness_and_cultural_appropriateness,
          max: 20,
        },
        fluencyChart: {
          value: responseMessageGrade.grades.fluency_and_naturalness,
          max: 20,
        },
      };

      Object.keys(chartsData).forEach((chartId) => {
        const { value, max } = chartsData[chartId];

        // Destroy existing chart if it exists
        if (chartRefs.current[chartId]) {
          chartRefs.current[chartId].destroy();
        }

        // Create new chart
        chartRefs.current[chartId] = new Chart(
          document.getElementById(chartId),
          {
            type: "doughnut",
            data: {
              datasets: [
                {
                  data: [value, max - value],
                  backgroundColor: ["#1c64f2", "#e5e7eb"],
                  borderWidth: 0,
                },
              ],
            },
            options: {
              cutout: "80%",
              plugins: {
                tooltip: { enabled: false },
                legend: { display: false },
              },
            },
          }
        );
      });
    }
  }, [responseMessageGrade]);

  return (
    <main className="flex flex-col items-center justify-between h-screen overflow-hidden px-10 py-4 relative bg-white dark:bg-[#141f25]">
      <Sidebar />
      <Head>
        <title>Learn</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col items-center justify-center w-2/3">
        <div className="w-2/3 h-16 flex items-center space-x-4">
          <TbX className="w-8 h-8 text-gray-600" />
          <ProgressBarComponent className="flex-1" />

          <div className="cursor-pointer brightness-110 rounded-lg outline outline-2 outline-gray-200 border-gray-300 bg-gradient-to-r from-blue-400 to-blue-800 bg-[length:200%] px-2 py-1 shadow-lg flex flex-col justify-center items-center">
            <h2 className="text-md font-semibold  text-gray-250 flex items-center">
              <MdOutlineQuiz className="h-5 w-5 mr-3" />
              Exercise
            </h2>
          </div>
        </div>

        <main className="gird grid-column ">
          {/*<div className="w-full mb-">
            <div className="rounded-full border border-blue-600 p-1">
              <div
                className="flex h-6 items-center justify-center rounded-full bg-[#da1c60] text-xs leading-none"
                style={{ width: "85%", height: "85%" }}
              >
                <span className="p-1 text-white font-semibold">85%</span>
              </div>
            </div>
          </div>*/}

          <div className="flex flex-row items-center justify-center flex-wrap w-screen max-w-screen-md mt-2 mx-auto">
            <div className="grid grid-flow-col m-4 max-w-screen-md basis-2/5 p-6 text-left no-underline border border-gray-200 bg-white rounded-lg transition-colors duration-150 ">
              <div>
                <div className="flex items-center">
                  <h3 className="font-semibold text-2xl flex items-center">
                    Generate A Sentence <span className="ml-2"></span>
                  </h3>
                  <button
                    className={`p-2 bg-blue-600 text-white rounded flex items-center justify-center  ${
                      isLoading ? "disabled opacity-50 cursor-not-allowed" : ""
                    }`} // Add dynamic button classes
                    onClick={handleButtonClick}
                    disabled={isLoading} // Disable button using isLoading state
                  >
                    {isLoading ? (
                      <TbLoader3 className="animate-spin" />
                    ) : (
                      <CiPlay1 />
                    )}
                  </button>
                </div>
                <div className="flex items-center my-10">
                  {responseMessage && ( // Conditionally render response message
                    <p className="font-semibold mx-2 text-green-500">
                      {responseMessage}
                    </p>
                  )}
                </div>
                <h3 className="m-0 mb-4 font-semibold text-2xl flex items-center">
                  Check <span className="ml-2"></span>
                </h3>
                <div className="flex items-center">
                  <input
                    type="text"
                    ref={inputRef}
                    className="flex-grow p-2 border border-gray-300 mr-2 rounded"
                    placeholder="Type your Japanese translation..."
                  />

                  <button
                    className="p-2 bg-blue-600 text-white rounded flex items-center justify-center"
                    onClick={handleButtonClickGrade}
                    disabled={isLoading} // Disable button using isLoading state
                  >
                    Send <FaArrowRight className="ml-2" />
                  </button>
                </div>
              </div>
              <div className="mx-16">
                <div className="ml-8 max-w-full w-full bg-white rounded-lg shadow-lg p-6 mt-2">
                  <div className="flex items-center mb-2">
                    <div className="relative w-16 h-16">
                      <canvas id="grammarChart"></canvas>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                        {responseMessageGrade?.grades.grammar_and_structure ??
                          "--"}
                        /20
                      </span>
                    </div>
                    <span className="flex items-center ml-2">
                      <span className="px-4 py-2 text-blue-700 bg-blue-100 text-lg font-semibold rounded-lg">
                        Grammar and Structure
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center mb-2">
                    <div className="relative w-16 h-16">
                      <canvas id="vocabularyChart"></canvas>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                        {responseMessageGrade?.grades
                          .vocabulary_and_expression ?? "--"}
                        /20
                      </span>
                    </div>
                    <span className="flex items-center ml-2">
                      <span className="px-4 py-2 text-green-700 bg-green-100 text-lg font-semibold rounded-lg">
                        Vocabulary and Expression
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center mb-2">
                    <div className="relative w-16 h-16">
                      <canvas id="spellingChart"></canvas>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                        {responseMessageGrade?.grades
                          .spelling_and_script_accuracy ?? "--"}
                        /20
                      </span>
                    </div>
                    <span className="flex items-center ml-2">
                      <span className="px-4 py-2 text-purple-700 bg-purple-100 text-lg font-semibold rounded-lg">
                        Spelling and Script Accuracy
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center mb-2">
                    <div className="relative w-16 h-16">
                      <canvas id="politenessChart"></canvas>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                        {responseMessageGrade?.grades
                          .politeness_and_cultural_appropriateness ?? "--"}
                        /20
                      </span>
                    </div>
                    <span className="flex items-center ml-2">
                      <span className="px-4 py-2 text-orange-700 bg-orange-100 text-lg font-semibold rounded-lg">
                        Politeness and Cultural Accuracy
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center mb-2">
                    <div className="relative w-16 h-16">
                      <canvas id="fluencyChart"></canvas>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                        {responseMessageGrade?.grades.fluency_and_naturalness ??
                          "--"}
                        /20
                      </span>
                    </div>
                    <span className="flex items-center ml-2">
                      <span className="px-4 py-2 text-red-700 bg-red-100 text-lg font-semibold rounded-lg">
                        Fluency and Naturalness
                      </span>
                    </span>
                  </div>

                  {/* Total Grade Section */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                    <span className="text-xl font-bold text-gray-900">
                      Total Grade
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      {responseMessageGrade
                        ? Object.values(responseMessageGrade.grades).reduce(
                            (sum, grade) => sum + (grade ?? 0),
                            0
                          )
                        : "--"}
                      /100
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </main>
  );
}

export const getServerSideProps = withPageAuthRequired();
