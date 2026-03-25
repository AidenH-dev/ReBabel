import AuthenticatedLayout from '@/components/ui/AuthenticatedLayout';
import BouncingDots from '@/components/ui/BouncingDots';
import BaseModal from '@/components/ui/BaseModal';
import SessionStatHeaderView from '@/components/Set/Features/Field-Card-Session/shared/views/SessionStatHeaderView';
import ConjugationCard from '@/components/Conjugation/shared/views/ConjugationCard';
import ConjugationEditModal from '@/components/Conjugation/Premium/ConjugationEditModal';
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

  // Base form alert state — questions where the answer is the word itself
  const [baseFormMatches, setBaseFormMatches] = useState([]);

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

        const generated = data.data.questions;

        // Detect questions where the expected answer matches the stored word
        const matches = generated.filter(
          (q) => q.expectedAnswer === q.word.kana
        );

        if (matches.length > 0) {
          setBaseFormMatches(matches);
        }

        setQuestions(generated);
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

  // Base form alert: user chose to skip the matching questions
  const allQuestionsMatchBaseForm =
    baseFormMatches.length > 0 && baseFormMatches.length === questions.length;

  const handleSkipBaseFormMatches = () => {
    if (allQuestionsMatchBaseForm) {
      abortAnalyticsSession();
      router.push('/learn/academy/practice');
      return;
    }

    const matchSet = new Set(
      baseFormMatches.map(
        (q) => `${q.word.kana}::${q.word.kanji || ''}::${q.form.key}`
      )
    );
    setQuestions((prev) =>
      prev.filter(
        (q) =>
          !matchSet.has(`${q.word.kana}::${q.word.kanji || ''}::${q.form.key}`)
      )
    );
    setBaseFormMatches([]);
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
  // Erases the word from the session entirely — past answers and future questions
  const handleConfirmSkip = () => {
    const currentQ = questions[currentIndex];
    const skipKana = currentQ.word.kana;
    const skipKanji = currentQ.word.kanji || null;
    const questionLabel = skipKanji || skipKana;

    // Remove ALL answered items for this word and adjust stats
    const keptAnswers = answeredItems.filter(
      (a) => a.question !== questionLabel
    );
    const removedAnswers = answeredItems.length - keptAnswers.length;
    if (removedAnswers > 0) {
      const removedCorrect = answeredItems.filter(
        (a) => a.question === questionLabel && a.isCorrect
      ).length;
      const removedIncorrect = removedAnswers - removedCorrect;
      setAnsweredItems(keptAnswers);
      setSessionStats((prev) => {
        const newCorrect = prev.correct - removedCorrect;
        const newIncorrect = prev.incorrect - removedIncorrect;
        const newTotal = prev.totalAttempts - removedAnswers;
        return {
          correct: newCorrect,
          incorrect: newIncorrect,
          totalAttempts: newTotal,
          accuracy:
            newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0,
        };
      });
    }

    // Count how many removed questions were before currentIndex so we can adjust it
    const removedBefore = questions
      .slice(0, currentIndex)
      .filter(
        (q) => q.word.kana === skipKana && (q.word.kanji || null) === skipKanji
      ).length;

    // Remove ALL questions for this word
    const remaining = questions.filter(
      (q) => q.word.kana !== skipKana || (q.word.kanji || null) !== skipKanji
    );
    setQuestions(remaining);

    // Shift currentIndex back by the number of removed questions that were before it
    const adjustedIndex = currentIndex - removedBefore;

    if (remaining.length === 0) {
      handleComplete();
    } else if (adjustedIndex >= remaining.length) {
      setCurrentIndex(remaining.length - 1);
    } else {
      setCurrentIndex(adjustedIndex);
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
        <div className="flex flex-col items-center">
          <BouncingDots scale={0.8} />
          <p className="text-sm text-black/60 dark:text-white/60">
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
          completionTitle="Conjugation Practice Complete"
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

      <ConjugationCard
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

      {baseFormMatches.length > 0 && (
        <BaseModal
          isOpen
          onClose={
            allQuestionsMatchBaseForm
              ? handleSkipBaseFormMatches
              : () => setBaseFormMatches([])
          }
          title="Words Already in Target Form"
          size="md"
          footer={
            <div className="flex gap-3 w-full">
              {allQuestionsMatchBaseForm ? (
                <button
                  onClick={handleSkipBaseFormMatches}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-brand-pink hover:bg-brand-pink-hover text-white font-medium transition-colors"
                >
                  Back to Practice
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setBaseFormMatches([])}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors"
                  >
                    Keep All
                  </button>
                  <button
                    onClick={handleSkipBaseFormMatches}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-brand-pink hover:bg-brand-pink-hover text-white font-medium transition-colors"
                  >
                    Skip These ({baseFormMatches.length})
                  </button>
                </>
              )}
            </div>
          }
        >
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {allQuestionsMatchBaseForm
                ? 'All words in this session are already stored in the form you selected to practice. There are no questions to study.'
                : 'Some words are already stored in the form you selected to practice. The answer would be the same as the word itself.'}
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {baseFormMatches.map((q, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {q.word.kanji || q.word.kana}
                    {q.word.kanji && (
                      <span className="text-gray-500 dark:text-gray-400 ml-1">
                        ({q.word.kana})
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-3">
                    {q.form.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </BaseModal>
      )}
    </AuthenticatedLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();
