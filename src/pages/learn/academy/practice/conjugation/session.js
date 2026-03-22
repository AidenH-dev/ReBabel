import AuthenticatedLayout from '@/components/ui/AuthenticatedLayout';
import SessionStatHeaderView from '@/components/Set/Features/Field-Card-Session/shared/views/SessionStatHeaderView';
import MasterConjugationCard from '@/components/Practice/Premium/Features/Conjugation/Session/controllers/MasterConjugationCard';
import ConjugationEditModal from '@/components/Practice/Premium/Features/Conjugation/Session/views/ConjugationEditModal';
import SummaryView from '@/components/Set/Features/Field-Card-Session/shared/views/SummaryView';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import useAnalyticsSession from '@/hooks/useAnalyticsSession';
import { clientLog } from '@/lib/clientLogger';
import { TbLanguageHiragana } from 'react-icons/tb';

const PHASES = [
  {
    id: 'conjugation',
    name: 'Conjugation',
    icon: TbLanguageHiragana,
    color: 'bg-brand-pink',
    borderColor: 'border-brand-pink',
  },
];

export default function ConjugationPracticeSession() {
  const router = useRouter();

  const [config, setConfig] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [answeredItems, setAnsweredItems] = useState([]);
  const [animateAccuracy, setAnimateAccuracy] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    totalAttempts: 0,
    accuracy: 0,
  });

  // Edit modal state
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Analytics
  const {
    start: startAnalyticsSession,
    finish: finishAnalyticsSession,
    abort: abortAnalyticsSession,
  } = useAnalyticsSession('conjugation');

  // Load config from sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedConfig = sessionStorage.getItem('conjugation-practice-config');
    if (savedConfig) {
      try {
        const loadedConfig = JSON.parse(savedConfig);
        setConfig(loadedConfig);
        sessionStorage.removeItem('conjugation-practice-config');
      } catch (err) {
        clientLog.error('conjugation.parse_config_failed', {
          error: err?.message || String(err),
        });
        router.push('/learn/academy/practice');
      }
    } else {
      router.push('/learn/academy/practice');
    }
  }, [router]);

  // Generate questions once config is loaded
  useEffect(() => {
    if (!config) return;

    const generateQuestions = async () => {
      setIsGenerating(true);
      setError(null);

      try {
        const res = await fetch('/api/practice/conjugation/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            poolItems: config.poolItems,
            selectedVerbForms: config.selectedVerbForms,
            selectedAdjForms: config.selectedAdjForms,
            count: config.count || 10,
            randomMode: config.randomMode,
          }),
        });

        const data = await res.json();

        if (res.status === 429) {
          setError(
            "You're sending requests too quickly. Please wait a moment and try again."
          );
          return;
        }

        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to generate questions');
          return;
        }

        setQuestions(data.data.questions);
        await startAnalyticsSession();
      } catch (err) {
        clientLog.error('conjugation.generate_questions_failed', {
          error: err?.message || String(err),
        });
        setError('Failed to generate questions. Please try again.');
      } finally {
        setIsGenerating(false);
        setIsLoading(false);
      }
    };

    generateQuestions();
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle answer submission
  const handleAnswerSubmitted = (result) => {
    if (result.isRetraction) {
      // Retract last answer ("I was correct")
      setAnsweredItems((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && !last.isCorrect) {
          updated.pop();
          setSessionStats((s) => {
            const newCorrect = s.correct;
            const newIncorrect = s.incorrect - 1;
            const newTotal = s.totalAttempts - 1;
            return {
              correct: newCorrect,
              incorrect: newIncorrect,
              totalAttempts: newTotal,
              accuracy:
                newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0,
            };
          });
        }
        return updated;
      });
      return;
    }

    setAnsweredItems((prev) => [...prev, result]);
    setSessionStats((prev) => {
      const newCorrect = prev.correct + (result.isCorrect ? 1 : 0);
      const newIncorrect = prev.incorrect + (result.isCorrect ? 0 : 1);
      const newTotal = prev.totalAttempts + 1;
      return {
        correct: newCorrect,
        incorrect: newIncorrect,
        totalAttempts: newTotal,
        accuracy: newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0,
      };
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleComplete = () => {
    finishAnalyticsSession(questions.length, sessionStats.correct);
    setSessionComplete(true);
    setTimeout(() => setAnimateAccuracy(true), 300);
  };

  const handleExit = () => {
    abortAnalyticsSession();
    router.push('/learn/academy/practice');
  };

  // Skip item: open edit modal in skip mode so user can choose what to do
  const handleSkipItem = (question) => {
    setEditingQuestion({ ...question, _skipMode: true });
  };

  // Called when user confirms the skip (from edit modal)
  const handleConfirmSkip = () => {
    // Retract answer if one was submitted for this question
    if (answeredItems.length > 0) {
      const currentQ = questions[currentIndex];
      const questionLabel = currentQ.word.kanji || currentQ.word.kana;
      const last = answeredItems[answeredItems.length - 1];
      if (last.question === questionLabel) {
        setAnsweredItems((prev) => prev.slice(0, -1));
        setSessionStats((prev) => {
          const wasCorrect = last.isCorrect;
          const newCorrect = prev.correct - (wasCorrect ? 1 : 0);
          const newIncorrect = prev.incorrect - (wasCorrect ? 0 : 1);
          const newTotal = prev.totalAttempts - 1;
          return {
            correct: newCorrect,
            incorrect: newIncorrect,
            totalAttempts: newTotal,
            accuracy:
              newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0,
          };
        });
      }
    }

    // Remove this question from the session entirely
    setQuestions((prev) => {
      const updated = [...prev];
      updated.splice(currentIndex, 1);
      return updated;
    });
    // If we removed the last question, complete the session
    // currentIndex stays the same since the array shifted, unless it was the last
    if (questions.length <= 1) {
      handleComplete();
    } else if (currentIndex >= questions.length - 1) {
      setCurrentIndex(questions.length - 2);
    }
  };

  // Edit item: save updated category/verb_group/kanji to DB
  const handleSaveEdit = async (updates) => {
    if (!editingQuestion) return;

    // Find the item ID from the config's poolItems
    const matchingItem = config.poolItems.find(
      (item) =>
        item.kana === editingQuestion.word.kana &&
        (item.kanji || null) === (editingQuestion.word.kanji || null)
    );

    if (!matchingItem?.id) {
      throw new Error('Could not find item to update');
    }

    const res = await fetch('/api/database/v2/sets/update-from-full-set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'vocab',
        entityId: matchingItem.id,
        updates,
      }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'Failed to update item');
    }
  };

  // Loading state
  if (isLoading || isGenerating) {
    return (
      <AuthenticatedLayout
        sidebar="academy"
        title="Conjugation Practice"
        variant="gradient"
        mainClassName="p-3 sm:p-6 sm:pt-10 items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-pink mx-auto"></div>
          <p className="mt-4 text-sm text-black/60 dark:text-white/60">
            Generating conjugation questions...
          </p>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AuthenticatedLayout
        sidebar="academy"
        title="Conjugation Practice"
        variant="gradient"
        mainClassName="p-3 sm:p-6 sm:pt-10 items-center justify-center"
      >
        <div className="text-center max-w-md">
          <div className="bg-white dark:bg-white/10 rounded-2xl shadow-xl p-8">
            <div className="text-red-500 text-4xl mb-4">!</div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600 dark:text-white/60 mb-6">
              {error}
            </p>
            <button
              onClick={() => router.push('/learn/academy/practice')}
              className="px-6 py-2.5 bg-brand-pink hover:bg-brand-pink-hover text-white rounded-lg font-medium transition-all"
            >
              Return to Practice
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Summary state -- show sidebar like quiz does
  if (sessionComplete) {
    return (
      <AuthenticatedLayout
        sidebar="academy"
        title="Conjugation Complete"
        variant="gradient"
        mainClassName="p-3 sm:p-6 sm:pt-10 overflow-y-auto"
      >
        <SummaryView
          sessionStats={sessionStats}
          answeredItems={answeredItems}
          animateAccuracy={animateAccuracy}
          onBackToSet={() => router.push('/learn/academy/practice')}
          completionTitle="Conjugation Complete!"
        />
      </AuthenticatedLayout>
    );
  }

  // Active session -- no sidebar, matches quiz layout
  const progress =
    questions.length > 0
      ? Math.round((currentIndex / questions.length) * 100)
      : 0;

  return (
    <AuthenticatedLayout
      sidebar="academy"
      title="Conjugation Practice"
      variant="gradient"
      mainClassName="p-3 sm:p-6 sm:pt-10 w-full overflow-y-auto"
    >
      <SessionStatHeaderView
        setTitle="Conjugation Practice"
        sessionStats={sessionStats}
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        currentPhase="conjugation"
        completedPhases={[]}
        phases={PHASES}
        currentPhaseIndex={0}
        currentPhaseConfig={PHASES[0]}
        CurrentPhaseIcon={TbLanguageHiragana}
        progressInPhase={progress}
        onExit={handleExit}
      />

      <MasterConjugationCard
        questions={questions}
        currentIndex={currentIndex}
        onAnswerSubmitted={handleAnswerSubmitted}
        onNext={handleNext}
        onComplete={handleComplete}
        onEditItem={(q) => setEditingQuestion(q)}
        onSkipItem={handleSkipItem}
      />

      {editingQuestion && (
        <ConjugationEditModal
          question={editingQuestion}
          skipMode={editingQuestion._skipMode || false}
          onSave={handleSaveEdit}
          onSkipConfirm={() => {
            handleConfirmSkip();
            setEditingQuestion(null);
          }}
          onClose={() => setEditingQuestion(null)}
        />
      )}
    </AuthenticatedLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();
