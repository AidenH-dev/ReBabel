// Translate Practice Session Page
// Main session page for on-demand translate practice

import AuthenticatedLayout from '@/components/ui/AuthenticatedLayout';
import MasterTranslateSession from '@/components/Practice/Premium/Features/Translate/Session/controllers/MasterTranslateSession';
import TranslateSummaryView from '@/components/Practice/Premium/Features/Translate/Session/views/TranslateSummaryView';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { usePremium } from '@/contexts/PremiumContext';
import useAnalyticsSession from '@/hooks/useAnalyticsSession';
import { TbX } from 'react-icons/tb';
import { FaDumbbell } from 'react-icons/fa';
import { BiBook } from 'react-icons/bi';
import { TbLanguage } from 'react-icons/tb';
import { clientLog } from '@/lib/clientLogger';

export default function TranslatePracticeSession() {
  const router = useRouter();
  const { incrementSessionCount } = usePremium();
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
    _avgSum: 0,
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
            clientLog.error('translate_session.config_parse_failed', {
              error: err?.message || String(err),
            });
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
    setQuestionResults((prev) => [...prev, result]);

    const grammarScore = result.gradeResult?.grades?.grammar || 0;
    const vocabScore = result.gradeResult?.grades?.vocabulary || 0;
    const questionAvg = (grammarScore + vocabScore) / 2;

    setSessionStats((prev) => {
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

  // ============ ANALYTICS ============
  const {
    start: startAnalyticsSession,
    finish: finishAnalyticsSession,
    abort: abortAnalyticsSession,
    sessionIdRef,
  } = useAnalyticsSession('translate');

  const handleSessionComplete = () => {
    finishAnalyticsSession();
    setSessionComplete(true);
  };

  const handleGenerationSuccess = async () => {
    incrementSessionCount();
    await startAnalyticsSession();
  };

  const handleGenerationError = () => {
    router.push('/learn/academy/practice');
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout
        sidebar="academy"
        title="Translate Practice"
        variant="fixed"
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-pink mx-auto"></div>
            <p className="mt-4 text-sm text-black/60 dark:text-white/60">
              Loading practice session...
            </p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (sessionComplete) {
    return (
      <AuthenticatedLayout
        sidebar="academy"
        title="Translate Practice Complete"
        variant="fixed"
        mainClassName="p-3 sm:p-6 overflow-y-auto"
      >
        <TranslateSummaryView
          sessionStats={sessionStats}
          questionResults={questionResults}
          onRestart={() => {
            // Just go back to practice - fresh session
            router.push('/learn/academy/practice');
          }}
          onExit={() => router.push('/learn/academy/practice')}
        />
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      sidebar="academy"
      title="Translate Practice"
      variant="fixed"
      mainClassName="px-1 pt-0 pb-1 sm:p-6 overflow-y-auto"
    >
      {/* Header - Quiz Mode Style */}
      <div className="w-full max-w-5xl mx-auto mb-3 sm:mb-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 ml-0 ">
            <button
              onClick={() => {
                abortAnalyticsSession();
                router.push('/learn/academy/practice');
              }}
              className="shrink-0 p-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
              aria-label="Exit"
            >
              <TbX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-white" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <FaDumbbell className="shrink-0 text-brand-pink text-lg sm:text-xl" />
              <h1 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                Translate Practice
              </h1>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TbLanguage className="text-green-500 text-sm" />
              <span className="text-gray-600 dark:text-white/70">
                <span className="hidden sm:inline">Grammar: </span>
                {sessionStats.avgGrammar}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <BiBook className="text-blue-500 text-sm" />
              <span className="text-gray-600 dark:text-white/70">
                <span className="hidden sm:inline">Vocab: </span>
                {sessionStats.avgVocab}%
              </span>
            </div>
            <div className="text-gray-600 dark:text-white/70">
              <span className="hidden sm:inline">Average: </span>
              <span className="font-semibold">{sessionStats.avgScore}%</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-white/70 mb-2">
            <span className="flex items-center gap-2">
              <FaDumbbell className="text-sm sm:hidden" />
              <span>
                Question {questionResults.length + 1} of {config.sessionLength}
              </span>
            </span>
            <span>
              {Math.round(
                (questionResults.length / config.sessionLength) * 100
              )}
              % Complete
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Progress Bar */}
            <div className="flex-1 bg-gray-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full transition-all duration-500 ease-out rounded-full bg-brand-pink"
                style={{
                  width: `${(questionResults.length / config.sessionLength) * 100}%`,
                }}
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
          analyticsSessionId={sessionIdRef.current}
          onQuestionCompleted={handleQuestionCompleted}
          onSessionComplete={handleSessionComplete}
          onGenerationSuccess={handleGenerationSuccess}
          onGenerationError={handleGenerationError}
        />
      </div>
    </AuthenticatedLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();
