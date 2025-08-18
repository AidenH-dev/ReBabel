import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Sidebar from "../../../components/Sidebar.js";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import {
  FaArrowRight,
  FaCheckCircle,
  FaTimesCircle,
  FaTrophy,
  FaRedo
} from "react-icons/fa";
import {
  TbX,
  TbLoader3,
  TbRefresh,
  TbSend
} from "react-icons/tb";
import {
  MdTranslate,
  MdAutorenew,
  MdCheck
} from "react-icons/md";
import Chart from "chart.js/auto";

export default function TranslationPractice() {
  const router = useRouter();
  const { lessons } = router.query;
  const chartRefs = useRef({});
  const inputRef = useRef(null);

  // Core states
  const [isLoading, setIsLoading] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [responseMessage, setResponseMessage] = useState(null);
  const [responseMessageGrade, setResponseMessageGrade] = useState(null);
  const [progress, setProgress] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    attempts: 0,
    avgScore: 0,
    bestScore: 0
  });

  // UI states
  const [animateScore, setAnimateScore] = useState(false);
  const [userInput, setUserInput] = useState("");

  const handleGenerateSentence = async () => {
    setIsLoading(true);
    setResponseMessageGrade(null);
    setUserInput(""); // Clear user input

    try {
      const response = await fetch(
        `/api/flexible-gpt-generator?lessons=${encodeURIComponent(lessons)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputLesson: lessons }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData.error || "Unknown error occurred");
        return;
      }

      const data = await response.json();
      const parsedMessage = JSON.parse(data.message);
      setResponseMessage(parsedMessage.english_sentence);

      // Clear input and previous grades
      if (inputRef.current) inputRef.current.value = "";

      // Destroy existing charts
      Object.keys(chartRefs.current).forEach((chartId) => {
        if (chartRefs.current[chartId]) {
          chartRefs.current[chartId].destroy();
          delete chartRefs.current[chartId];
        }
      });
    } catch (error) {
      console.error("Error calling the API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeTranslation = async () => {
    const japaneseSentence = userInput.trim();

    if (!japaneseSentence) {
      // Add visual feedback for empty input
      inputRef.current?.focus();
      return;
    }

    setIsGrading(true);
    const englishSentence = responseMessage;

    try {
      const response = await fetch("/api/grader-gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ japaneseSentence, englishSentence }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      const parsedData = typeof data.message === "string" ? JSON.parse(data.message) : data.message;
      setResponseMessageGrade(parsedData);

      // Update session stats
      const totalScore = Object.values(parsedData.grades).reduce((sum, grade) => sum + (grade ?? 0), 0);
      setSessionStats(prev => ({
        attempts: prev.attempts + 1,
        avgScore: Math.round((prev.avgScore * prev.attempts + totalScore) / (prev.attempts + 1)),
        bestScore: Math.max(prev.bestScore, totalScore)
      }));

      // Trigger score animation
      setAnimateScore(true);
      setTimeout(() => setAnimateScore(false), 600);

      // Update progress
      setProgress((prev) => Math.min(prev + 10, 100));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsGrading(false);
    }
  };

  // Render charts when grade is received
  useEffect(() => {
    if (responseMessageGrade) {
      const chartColors = {
        grammar: { primary: "#3b82f6", light: "#dbeafe" },
        vocabulary: { primary: "#10b981", light: "#d1fae5" },
        spelling: { primary: "#8b5cf6", light: "#ede9fe" },
        politeness: { primary: "#f59e0b", light: "#fed7aa" },
        fluency: { primary: "#ef4444", light: "#fee2e2" }
      };

      const chartsData = {
        grammarChart: {
          value: responseMessageGrade.grades.grammar_and_structure,
          max: 20,
          colors: chartColors.grammar
        },
        vocabularyChart: {
          value: responseMessageGrade.grades.vocabulary_and_expression,
          max: 20,
          colors: chartColors.vocabulary
        },
        spellingChart: {
          value: responseMessageGrade.grades.spelling_and_script_accuracy,
          max: 20,
          colors: chartColors.spelling
        },
        politenessChart: {
          value: responseMessageGrade.grades.politeness_and_cultural_appropriateness,
          max: 20,
          colors: chartColors.politeness
        },
        fluencyChart: {
          value: responseMessageGrade.grades.fluency_and_naturalness,
          max: 20,
          colors: chartColors.fluency
        },
      };

      Object.keys(chartsData).forEach((chartId) => {
        const { value, max, colors } = chartsData[chartId];

        if (chartRefs.current[chartId]) {
          chartRefs.current[chartId].destroy();
        }

        const canvas = document.getElementById(chartId);
        if (canvas) {
          chartRefs.current[chartId] = new Chart(canvas, {
            type: "doughnut",
            data: {
              datasets: [{
                data: [value, max - value],
                backgroundColor: [colors.primary, colors.light],
                borderWidth: 0,
              }],
            },
            options: {
              cutout: "75%",
              plugins: {
                tooltip: { enabled: false },
                legend: { display: false },
              },
              animation: {
                animateRotate: true,
                animateScale: false,
              }
            },
          });
        }
      });
    }
  }, [responseMessageGrade]);

  const handleExit = () => {
    router.push("/learn/grammar");
  };

  const getTotalScore = () => {
    if (!responseMessageGrade) return 0;
    return Object.values(responseMessageGrade.grades).reduce(
      (sum, grade) => sum + (grade ?? 0), 0
    );
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-blue-600 dark:text-blue-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
      <Sidebar />

      <main className="ml-auto max-h-screen overflow-y-scroll flex-1 p-6">
        <Head>
          <title>Translation Practice • Lesson {lessons}</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Header */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleExit}
                className="p-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                aria-label="Exit"
              >
                <TbX className="w-6 h-6 text-gray-700 dark:text-white" />
              </button>

              <div className="flex items-center gap-2">
                <MdTranslate className="text-[#e30a5f] text-2xl" />
                <div>
                  <h1 className="text-sm md:text-md lg:text-xl font-semibold text-gray-900 dark:text-white">
                    Translation Practice
                  </h1>
                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                    Lesson {lessons}
                  </p>
                </div>
              </div>
            </div>

            {/* Session Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 bg-white dark:bg-white/10 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Attempts</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{sessionStats.attempts}</p>
              </div>
              <div className="text-center px-4 py-2 bg-white dark:bg-white/10 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Avg Score</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{sessionStats.avgScore}%</p>
              </div>
              <div className="text-center px-4 py-2 bg-white dark:bg-white/10 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Best</p>
                <p className="text-lg font-bold text-[#e30a5f]">{sessionStats.bestScore}%</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Session Progress</span>
              <span>{progress}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#e30a5f] to-[#f41567] transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Main Content */}
          {progress < 100 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel - Translation Area */}
              <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-8 h-8 bg-[#e30a5f] text-white rounded-full flex items-center justify-center text-sm">1</span>
                      English Sentence
                    </h2>
                    <button
                      onClick={handleGenerateSentence}
                      disabled={isLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isLoading
                          ? "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                          : "bg-[#e30a5f] hover:bg-[#f41567] text-white active:scale-95"
                        }`}
                    >
                      {isLoading ? (
                        <>
                          <TbLoader3 className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <MdAutorenew />
                          Generate New
                        </>
                      )}
                    </button>
                  </div>

                  {responseMessage ? (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-lg text-gray-800 dark:text-white font-medium">
                        {responseMessage}
                      </p>
                    </div>
                  ) : (
                    <div className="p-8 bg-gray-50 dark:bg-white/5 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Click &quot;Generate New&quot; to get a sentence to translate
                      </p>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-8 h-8 bg-[#e30a5f] text-white rounded-full flex items-center justify-center text-sm">2</span>
                      Your Translation
                    </h2>
                  </div>

                  <div className="relative">
                    <textarea
                      ref={inputRef}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      disabled={!responseMessage}
                      className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg resize-none 
                               bg-white dark:bg-[#0f1a1f] text-gray-900 dark:text-white
                               focus:border-[#e30a5f] dark:focus:border-[#e30a5f] focus:outline-none
                               disabled:bg-gray-100 dark:disabled:bg-white/5 disabled:cursor-not-allowed
                               placeholder-gray-400 dark:placeholder-gray-500"
                      rows="3"
                      placeholder={responseMessage ? "Type your Japanese translation here..." : "Generate a sentence first"}
                    />
                  </div>
                </div>

                <button
                  onClick={handleGradeTranslation}
                  disabled={!responseMessage || isGrading || !userInput.trim()}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${!responseMessage || isGrading || !userInput.trim()
                      ? "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#e30a5f] to-[#f41567] hover:from-[#f41567] hover:to-[#e30a5f] text-white active:scale-[0.98]"
                    }`}
                >
                  {isGrading ? (
                    <>
                      <TbLoader3 className="animate-spin" />
                      Grading...
                    </>
                  ) : (
                    <>
                      <TbSend />
                      Submit Translation
                    </>
                  )}
                </button>
              </div>

              {/* Right Panel - Grading Results */}
              <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Grading Results
                </h2>

                {responseMessageGrade ? (
                  <div className={`space-y-4 ${animateScore ? 'animate-pulse' : ''}`}>
                    {/* Score Categories */}
                    <div className="space-y-3">
                      {[
                        { id: "grammarChart", label: "Grammar & Structure", color: "blue" },
                        { id: "vocabularyChart", label: "Vocabulary", color: "green" },
                        { id: "spellingChart", label: "Spelling & Script", color: "purple" },
                        { id: "politenessChart", label: "Politeness", color: "orange" },
                        { id: "fluencyChart", label: "Fluency", color: "red" }
                      ].map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="relative w-14 h-14">
                            <canvas id={item.id}></canvas>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white">
                              {responseMessageGrade?.grades[
                                item.id.replace("Chart", "") === "grammar" ? "grammar_and_structure" :
                                  item.id.replace("Chart", "") === "vocabulary" ? "vocabulary_and_expression" :
                                    item.id.replace("Chart", "") === "spelling" ? "spelling_and_script_accuracy" :
                                      item.id.replace("Chart", "") === "politeness" ? "politeness_and_cultural_appropriateness" :
                                        "fluency_and_naturalness"
                              ] ?? "--"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2 mt-1">
                              <div
                                className={`h-2 rounded-full bg-${item.color}-500 transition-all duration-500`}
                                style={{
                                  width: `${(responseMessageGrade?.grades[
                                    item.id.replace("Chart", "") === "grammar" ? "grammar_and_structure" :
                                      item.id.replace("Chart", "") === "vocabulary" ? "vocabulary_and_expression" :
                                        item.id.replace("Chart", "") === "spelling" ? "spelling_and_script_accuracy" :
                                          item.id.replace("Chart", "") === "politeness" ? "politeness_and_cultural_appropriateness" :
                                            "fluency_and_naturalness"
                                  ] ?? 0) * 5}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Score */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          Total Score
                        </span>
                        <div className="text-right">
                          <span className={`text-3xl font-bold ${getScoreColor(getTotalScore())}`}>
                            {getTotalScore()}
                          </span>
                          <span className="text-lg text-gray-600 dark:text-gray-400">/100</span>
                        </div>
                      </div>

                      {/* Score Feedback */}
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getTotalScore() >= 90 ? "🎉 Excellent work! Nearly perfect!" :
                            getTotalScore() >= 70 ? "👍 Good job! Keep practicing!" :
                              getTotalScore() >= 50 ? "💪 Not bad! Room for improvement." :
                                "📚 Keep studying! You'll get better with practice."}
                        </p>
                      </div>
                    </div>

                    {/* Feedback Section */}
                    {responseMessageGrade.feedback && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                          Feedback
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          {responseMessageGrade.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <FaTrophy className="text-3xl text-gray-400 dark:text-gray-600" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Submit a translation to see your results
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Completion Screen */
            <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-8 text-center max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-5xl text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Session Complete!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Great job completing this translation practice session
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Attempts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{sessionStats.attempts}</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{sessionStats.avgScore}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best Score</p>
                  <p className="text-2xl font-bold text-[#e30a5f]">{sessionStats.bestScore}%</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setProgress(0);
                    setSessionStats({ attempts: 0, avgScore: 0, bestScore: 0 });
                    setResponseMessage(null);
                    setResponseMessageGrade(null);
                    setUserInput("");
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
                >
                  <FaRedo />
                  Practice Again
                </button>
                <button
                  onClick={handleExit}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e30a5f] to-[#f41567] hover:from-[#f41567] hover:to-[#e30a5f] text-white rounded-lg font-medium transition-all active:scale-95"
                >
                  <MdCheck />
                  Finish Session
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();