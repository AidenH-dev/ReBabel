import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeftLong, FaArrowRight, FaArrowRightLong } from "react-icons/fa6";
import { CiPlay1 } from "react-icons/ci"; 
import { TbDivide, TbLoader3 } from "react-icons/tb";
import { useState } from "react";
import { useEffect } from "react";
import Chart from 'chart.js/auto';

export default function Learn() {
  const [responseMessage, setResponseMessage] = useState(null);
  const [responseMessageGrade, setResponseMessageGrade] = useState(null);

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
    setIsLoading(true); // Set loading state to true before fetch
    try {
      const response = await fetch("/api/grader-gpt", {
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
        grammarChart: { value: responseMessageGrade.grades.grammar_and_structure, max: 20 },
        vocabularyChart: { value: responseMessageGrade.grades.vocabulary_and_expression, max: 20 },
        spellingChart: { value: responseMessageGrade.grades.spelling_and_script_accuracy, max: 20 },
        politenessChart: { value: responseMessageGrade.grades.politeness_and_cultural_appropriateness, max: 20 },
        fluencyChart: { value: responseMessageGrade.grades.fluency_and_naturalness, max: 20 },
      };

      Object.keys(chartsData).forEach(chartId => {
        const { value, max } = chartsData[chartId];
        new Chart(document.getElementById(chartId), {
          type: 'doughnut',
          data: {
            datasets: [{
              data: [value, max - value],
              backgroundColor: ['#1c64f2', '#e5e7eb'],
              borderWidth: 0,
            }],
          },
          options: {
            cutout: '80%',
            plugins: { tooltip: { enabled: false }, legend: { display: false } },
          }
        });
      });
    }
  }, [responseMessageGrade]);

  return (
    <main className="flex flex-col items-center justify-between h-screen overflow-hidden px-10 py-4 relative">
      {/* Floating back button at the top left */}
      <div className="absolute top-0 left-0 m-4">
        <Link href="/" className="text-left text-4xl font-semibold leading-tight">
          <FaArrowLeftLong />
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center w-full">
        <Head>
          <title>Learn</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className="flex flex-col w-screen items-center justify-center mt-10">

          <div className="flex items-center justify-center flex-wrap w-screen max-w-screen-md mt-2 mx-auto">
            <div className="m-4 max-w-screen-md flex-grow flex-shrink-0 basis-2/5 p-6 text-left no-underline border border-gray-200 rounded-lg transition-colors duration-150 ">
              <div className="flex items-center">
                <h3 className="font-semibold text-2xl flex items-center">
                  Generate A Sentance <span className="ml-2"></span>
                </h3>
                <button
                  className={`p-2 bg-blue-600 text-white rounded flex items-center justify-center  ${
                    isLoading ? "disabled opacity-50 cursor-not-allowed" : ""
                  }`} // Add dynamic button classes
                  onClick={handleButtonClick}
                  disabled={isLoading} // Disable button using isLoading state
                >
                  {isLoading ? <TbLoader3 className="animate-spin" /> : <CiPlay1 />}
                </button>
              </div>     
              <div className="flex items-center my-10">
              {responseMessage && ( // Conditionally render response message
                  <p className="font-semibold mx-2 text-green-500">{responseMessage}</p>
                )} 
            </div>
              <h3 className="m-0 mb-4 font-semibold text-2xl flex items-center">
                Check <span className="ml-2"></span>
              </h3>
              <div className="flex items-center">
                <input type="text" className="flex-grow p-2 border border-gray-300 mr-2 rounded" placeholder="Type your message..." />
                <button 
                    className="p-2 bg-blue-600 text-white rounded flex items-center justify-center"
                    onClick={handleButtonClickGrade}
                    disabled={isLoading} // Disable button using isLoading state
                >
                    Send <FaArrowRight className="ml-2" />
                </button>
              </div>    
              {responseMessageGrade && (
                <div className="max-w-full w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 mt-4 md:p-6">
                  <h3 className="text-xl font-bold leading-none text-gray-900 dark:text-white mb-4">Evaluation Scores</h3>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-700 dark:text-gray-400">Grammar and Structure</span>
                    <div className="relative w-12 h-12">
                      <canvas id="grammarChart"></canvas>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-900 dark:text-white">
                        {responseMessageGrade.grades.grammar_and_structure}/20
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-700 dark:text-gray-400">Vocabulary and Expression</span>
                    <div className="relative w-12 h-12">
                      <canvas id="vocabularyChart"></canvas>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-900 dark:text-white">
                        {responseMessageGrade.grades.vocabulary_and_expression}/20
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-700 dark:text-gray-400">Spelling and Script Accuracy</span>
                    <div className="relative w-12 h-12">
                      <canvas id="spellingChart"></canvas>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-900 dark:text-white">
                        {responseMessageGrade.grades.spelling_and_script_accuracy}/20
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-700 dark:text-gray-400">Politeness and Cultural Appropriateness</span>
                    <div className="relative w-12 h-12">
                      <canvas id="politenessChart"></canvas>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-900 dark:text-white">
                        {responseMessageGrade.grades.politeness_and_cultural_appropriateness}/20
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-700 dark:text-gray-400">Fluency and Naturalness</span>
                    <div className="relative w-12 h-12">
                      <canvas id="fluencyChart"></canvas>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-900 dark:text-white">
                        {responseMessageGrade.grades.fluency_and_naturalness}/20
                      </span>
                    </div>
                  </div>
                </div>
              )
            }
            </div>

          </div>
        </main>
      </div>
    </main>

  );
}
