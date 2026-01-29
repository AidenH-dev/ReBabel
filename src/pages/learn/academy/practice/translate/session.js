// Translate Practice Session Page
// Main session page for on-demand translate practice

import Head from "next/head";
import AcademySidebar from "@/components/Sidebars/AcademySidebar";
import MasterTranslateSession from "@/components/Practice/Premium/Features/Translate/Session/controllers/MasterTranslateSession";
import TranslateSummaryView from "@/components/Practice/Premium/Features/Translate/Session/views/TranslateSummaryView";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { TbX } from "react-icons/tb";
import { FaDumbbell } from "react-icons/fa";

export default function TranslatePracticeSession() {
  const router = useRouter();
  const [config, setConfig] = useState(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [questionResults, setQuestionResults] = useState([]);

  // Session stats
  const [sessionStats, setSessionStats] = useState({
    totalQuestions: 0,
    avgScore: 0,
    avgGrammar: 0,
    avgVocab: 0,
    totalScore: 0,
    _grammarSum: 0,
    _vocabSum: 0,
    _avgSum: 0
  });

  // Load config from sessionStorage
  useEffect(() => {
    if (router.query.sessionLength) {
      if (typeof window !== 'undefined') {
        const savedConfig = sessionStorage.getItem('translate-practice-config');
        if (savedConfig) {
          try {
            const loadedConfig = JSON.parse(savedConfig);
            setConfig(loadedConfig);
            sessionStorage.removeItem('translate-practice-config'); // Clean up
            setIsLoading(false);
          } catch (err) {
            console.error('Failed to parse config:', err);
            router.push('/learn/academy/practice');
          }
        } else {
          // No config - redirect back
          router.push('/learn/academy/practice');
        }
      }
    }
  }, [router.query, router]);

  const handleQuestionCompleted = (result) => {
    setQuestionResults(prev => [...prev, result]);

    const grammarScore = result.gradeResult?.grades?.grammar || 0;
    const vocabScore = result.gradeResult?.grades?.vocabulary || 0;
    const questionAvg = (grammarScore + vocabScore) / 2;

    setSessionStats(prev => {
      const newTotal = prev.totalQuestions + 1;
      const newAvgSum = prev._avgSum + questionAvg;
      const newGrammarSum = prev._grammarSum + grammarScore;
      const newVocabSum = prev._vocabSum + vocabScore;
      return {
        totalQuestions: newTotal,
        totalScore: prev.totalScore + result.totalScore,
        avgScore: Math.round(newAvgSum / newTotal),
        avgGrammar: Math.round(newGrammarSum / newTotal),
        avgVocab: Math.round(newVocabSum / newTotal),
        _avgSum: newAvgSum,
        _grammarSum: newGrammarSum,
        _vocabSum: newVocabSum,
      };
    });
  };

  const handleSessionComplete = () => {
    setSessionComplete(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-row h-screen overflow-hidden bg-white dark:bg-[#141f25]">
        <AcademySidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e30a5f] mx-auto"></div>
            <p className="mt-4 text-sm text-black/60 dark:text-white/60">Loading practice session...</p>
          </div>
        </main>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="flex flex-row h-screen overflow-hidden bg-white dark:bg-[#141f25]">
        <AcademySidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <TranslateSummaryView
            sessionStats={sessionStats}
            questionResults={questionResults}
            onRestart={() => {
              // Just go back to practice - fresh session
              router.push('/learn/academy/practice');
            }}
            onExit={() => router.push('/learn/academy/practice')}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-row h-screen overflow-hidden bg-white dark:bg-[#141f25]">
      <Head>
        <title>Translate Practice</title>
      </Head>

      <AcademySidebar />

      <main className="flex-1 flex flex-col p-6 overflow-y-auto">
        {/* Header - Quiz Mode Style */}
        <div className="w-full max-w-5xl mx-auto mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={() => router.push('/learn/academy/practice')}
                className="p-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                aria-label="Exit"
              >
                <TbX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-white" />
              </button>

              <div className="flex items-center gap-2">
                <FaDumbbell className="text-[#e30a5f] text-lg sm:text-xl" />
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                  Translate Practice
                </h1>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-gray-600 dark:text-white/70">
                <span className="hidden sm:inline">Average Score: </span>
                <span className="font-semibold">{sessionStats.avgScore}%</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-white/70 mb-2">
              <span className="flex items-center gap-2">
                <FaDumbbell className="text-sm sm:hidden" />
                <span>
                  Question {questionResults.length + 1} of {config.sessionLength}
                </span>
              </span>
              <span>{Math.round((questionResults.length / config.sessionLength) * 100)}% Complete</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Progress Bar */}
              <div className="flex-1 bg-gray-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full transition-all duration-500 ease-out rounded-full bg-[#e30a5f]"
                  style={{ width: `${(questionResults.length / config.sessionLength) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Session Controller */}
        <div className="flex-1 w-full max-w-5xl mx-auto">
          <MasterTranslateSession
            pools={config.pools}
            focalPoints={config.focalPoints}
            sessionLength={config.sessionLength}
            onQuestionCompleted={handleQuestionCompleted}
            onSessionComplete={handleSessionComplete}
          />
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
