// pages/learn/academy/sets/study/[id]/quiz.js
import AuthenticatedLayout from '@/components/ui/AuthenticatedLayout';
import MasterQuizModeSelect from '@/components/Set/Features/Field-Card-Session/Quiz/controllers/MasterQuizModeSelect';
import MasterQuizHeader from '@/components/Set/Features/Field-Card-Session/Quiz/controllers/MasterQuizHeader';
import MasterQuestionCard from '@/components/Set/Features/Field-Card-Session/Quiz/controllers/MasterQuestionCard';
import SummaryView from '@/components/Set/Features/Field-Card-Session/shared/views/SummaryView';
import ReviewView from '@/components/Set/Features/Field-Card-Session/shared/views/ReviewView.jsx';
import MasterMultipleChoice from '@/components/Set/Features/Field-Card-Session/Quiz/controllers/MasterMultipleChoice';
import ItemEditModal from '@/components/Set/Features/Field-Card-Session/shared/views/ItemEditModal.jsx';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import {
  generateOptionsFromQuizItems,
  shuffleArray,
} from '@/components/Set/Features/Field-Card-Session/shared/models/mcOptionGeneration';
import { transformItems } from '@/components/Set/Features/Field-Card-Session/shared/models/itemTransform';
import { generateQuizItems } from '@/components/Set/Features/Field-Card-Session/shared/models/translationGeneration';
import {
  buildEditableItem,
  toUpdateRequest,
  mergeIntoBaseItem,
  mergeIntoQuestionItem,
} from '@/components/Set/Features/Field-Card-Session/shared/controllers/utils/itemEditing';
import useAnalyticsSession from '@/hooks/useAnalyticsSession';
import { clientLog } from '@/lib/clientLogger';
import { markSetStudied } from '@/lib/setActions';

export default function SetQuiz() {
  const router = useRouter();
  const { id } = router.query;

  // ============ ANALYTICS ============
  const {
    start: startAnalyticsSession,
    finish: finishAnalyticsSession,
    abort: abortAnalyticsSession,
  } = useAnalyticsSession('quiz');

  const [cardsData, setCardsData] = useState([]);
  const [setInfo, setSetInfo] = useState(null);
  const [setType, setSetType] = useState(null); // 'vocab' | 'grammar'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quiz mode states
  const [quizMode, setQuizMode] = useState(null); // null | 'completely-new' | 'new' | 'practice'
  const [quizType, setQuizType] = useState(null); // For grammar sets: 'with-review' | 'mc-only'
  const [modeSelectionComplete, setModeSelectionComplete] = useState(false);

  // Quiz phase tracking
  const [currentPhase, setCurrentPhase] = useState(null); // 'review' | 'multiple-choice' | 'translation'
  const [completedPhases, setCompletedPhases] = useState([]); // Track which phases are done
  const [multipleChoiceItems, setMultipleChoiceItems] = useState([]); // Items for multiple choice
  const [reviewItems, setReviewItems] = useState([]); // Items for review (cards data)

  // Quiz specific states
  const [quizItems, setQuizItems] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Item editing states
  const [editingItem, setEditingItem] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  // Quiz statistics
  const [itemStats, setItemStats] = useState({});
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    totalAttempts: 0,
    accuracy: 0,
  });
  const sessionStatsRef = useRef(sessionStats);
  sessionStatsRef.current = sessionStats;
  const [answeredItems, setAnsweredItems] = useState([]);
  const [animateAccuracy, setAnimateAccuracy] = useState(false);

  // Track completed items per phase (for progress bar)
  const [completedItems, setCompletedItems] = useState({
    review: new Set(),
    'multiple-choice': new Set(),
    translation: new Set(),
  });

  // Fetch Data from API
  useEffect(() => {
    if (!id) return;

    const fetchSetData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/database/v2/sets/retrieve-set/${id}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch set: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load set data');
        }

        const apiData = result.data;
        const setInfoData = apiData.data?.set;
        const setItemsAPI = apiData.data?.items || [];

        if (!setInfoData) {
          throw new Error('Invalid set data structure received from API');
        }

        setSetInfo({
          title: setInfoData.title || 'Untitled Set',
          description: setInfoData.description?.toString() || '',
        });

        // Extract and store set type
        setSetType(setInfoData.set_type || 'vocab');

        // Transform items to flashcard format
        const transformedCards = transformItems(setItemsAPI);

        if (transformedCards.length === 0) {
          throw new Error('This set has no items to study');
        }

        setCardsData(transformedCards);

        // Generate quiz items from cards
        const generatedQuizItems = generateQuizItems(transformedCards);
        setQuizItems(shuffleArray(generatedQuizItems));

        // Initialize item statistics
        const stats = {};
        generatedQuizItems.forEach((item) => {
          stats[item.id] = { passed: 0, failed: 0, attempts: 0 };
        });
        setItemStats(stats);
      } catch (err) {
        clientLog.error('quiz.set_fetch_failed', {
          error: err?.message || String(err),
        });
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetData();
  }, [id]);

  // Trigger accuracy bar animation when quiz completes
  useEffect(() => {
    if (quizCompleted) {
      // Small delay before animating for better visual effect
      const timer = setTimeout(() => {
        setAnimateAccuracy(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [quizCompleted]);

  // Finish analytics session when quiz completes
  useEffect(() => {
    if (quizCompleted) {
      const stats = sessionStatsRef.current;
      finishAnalyticsSession(quizItems.length, stats.correct);
      markSetStudied(id);
    }
  }, [quizCompleted, finishAnalyticsSession, id]);

  // Function to initialize multiple choice questions
  const initializeMultipleChoice = () => {
    // Generate multiple choice questions from quiz items using centralized utility
    const mcQuestions = quizItems.map((item) => ({
      ...item,
      options: generateOptionsFromQuizItems(item, quizItems),
    }));
    setMultipleChoiceItems(shuffleArray(mcQuestions));
  };

  // Handle mode selection
  const handleModeSelect = (mode) => {
    startAnalyticsSession();

    // For grammar sets, mode is the quizType
    if (setType === 'grammar') {
      setQuizType(mode);

      if (mode === 'with-review') {
        // Grammar: Review → Multiple Choice → Summary
        setCurrentPhase('review');
        setReviewItems(cardsData);
      } else if (mode === 'mc-only') {
        // Grammar: Multiple Choice → Summary
        setCurrentPhase('multiple-choice');
        initializeMultipleChoice();
      }
    } else {
      // For vocab sets, use existing quizMode logic
      setQuizMode(mode);

      if (mode === 'practice') {
        // Practice mode - go straight to translation
        setCurrentPhase('translation');
      } else if (mode === 'new') {
        // New mode - start with multiple choice
        setCurrentPhase('multiple-choice');
        initializeMultipleChoice();
      } else if (mode === 'completely-new') {
        // Completely new mode - start with review
        setCurrentPhase('review');
        setReviewItems(cardsData);
      }
    }

    setModeSelectionComplete(true);
  };

  // Handle phase completion and transition
  const handlePhaseComplete = () => {
    setCompletedPhases((prev) => [...prev, currentPhase]);

    if (setType === 'grammar') {
      // Grammar sets: no translation phase
      if (quizType === 'with-review') {
        if (currentPhase === 'review') {
          // Move to multiple choice
          setCurrentPhase('multiple-choice');
          initializeMultipleChoice();
          setCurrentIndex(0);
        } else if (currentPhase === 'multiple-choice') {
          // All phases complete (no translation for grammar)
          setQuizCompleted(true);
        }
      } else if (quizType === 'mc-only') {
        // Multiple choice only
        if (currentPhase === 'multiple-choice') {
          // All phases complete
          setQuizCompleted(true);
        }
      }
    } else {
      // Vocab sets: existing logic
      if (quizMode === 'completely-new') {
        if (currentPhase === 'review') {
          // Move to multiple choice
          setCurrentPhase('multiple-choice');
          initializeMultipleChoice();
          setCurrentIndex(0);
        } else if (currentPhase === 'multiple-choice') {
          // Move to translation
          setCurrentPhase('translation');
          setCurrentIndex(0);
        } else {
          // All phases complete
          setQuizCompleted(true);
        }
      } else if (quizMode === 'new') {
        if (currentPhase === 'multiple-choice') {
          // Move to translation
          setCurrentPhase('translation');
          setCurrentIndex(0);
        } else {
          // All phases complete
          setQuizCompleted(true);
        }
      } else {
        // Practice mode - only translation phase
        setQuizCompleted(true);
      }
    }
  };

  // Handle answer submission and retraction
  const handleAnswerSubmitted = useCallback(
    (answerData) => {
      // Handle retraction
      if (answerData.isRetraction) {
        setAnsweredItems((prev) => prev.slice(0, -1));
        setItemStats((prev) => {
          const updated = { ...prev };
          updated[answerData.itemId].attempts -= 1;
          updated[answerData.itemId].failed -= 1;
          return updated;
        });
        setSessionStats((prev) => ({
          ...prev,
          incorrect: prev.incorrect - 1,
          totalAttempts: prev.totalAttempts - 1,
          accuracy:
            prev.totalAttempts - 1 > 0
              ? Math.round((prev.correct / (prev.totalAttempts - 1)) * 100)
              : 0,
        }));
        return;
      }

      // Add to answered items
      setAnsweredItems((prev) => [...prev, answerData]);

      // Update item stats
      setItemStats((prev) => {
        const updated = { ...prev };
        updated[answerData.itemId].attempts += 1;
        if (answerData.isCorrect) {
          updated[answerData.itemId].passed += 1;
        } else {
          updated[answerData.itemId].failed += 1;
        }
        return updated;
      });

      // Update session stats
      setSessionStats((prev) => ({
        ...prev,
        correct: answerData.isCorrect ? prev.correct + 1 : prev.correct,
        incorrect: answerData.isCorrect ? prev.incorrect : prev.incorrect + 1,
        totalAttempts: prev.totalAttempts + 1,
        accuracy: Math.round(
          ((answerData.isCorrect ? prev.correct + 1 : prev.correct) /
            (prev.totalAttempts + 1)) *
            100
        ),
      }));

      // Track completed items for progress bar (any answered item)
      setCompletedItems((prev) => {
        const newSet = new Set(prev[currentPhase]);
        newSet.add(answerData.itemId);
        return { ...prev, [currentPhase]: newSet };
      });
    },
    [currentPhase]
  );

  const handleOpenEditItem = (questionItem) => {
    const editable = buildEditableItem(questionItem);

    if (!editable) {
      setEditError('This item cannot be edited right now.');
      return;
    }

    setEditError(null);
    setEditingItem(editable);
  };

  const handleCloseEditItem = () => {
    if (isSavingEdit) return;
    setEditingItem(null);
    setEditError(null);
  };

  const handleSaveEditedItem = async (updatedItem) => {
    setIsSavingEdit(true);
    setEditError(null);

    try {
      const request = toUpdateRequest(updatedItem);
      const response = await fetch(
        '/api/database/v2/sets/update-from-full-set',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update item');
      }

      setCardsData((prev) =>
        prev.map((item) => mergeIntoBaseItem(item, updatedItem))
      );
      setReviewItems((prev) =>
        prev.map((item) => mergeIntoBaseItem(item, updatedItem))
      );
      setQuizItems((prev) =>
        prev.map((item) => mergeIntoQuestionItem(item, updatedItem))
      );
      setMultipleChoiceItems((prev) =>
        prev.map((item) => mergeIntoQuestionItem(item, updatedItem))
      );

      setEditingItem(null);
    } catch (error) {
      clientLog.error('quiz.item_update_failed', {
        error: error?.message || String(error),
      });
      setEditError(error.message || 'Failed to update item');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle quiz retry
  const handleRetry = () => {
    startAnalyticsSession();
    setQuizCompleted(false);
    setCurrentIndex(0);
    setAnsweredItems([]);
    setAnimateAccuracy(false);
    setCompletedPhases([]);
    setCompletedItems({
      review: new Set(),
      'multiple-choice': new Set(),
      translation: new Set(),
    });
    setSessionStats({
      correct: 0,
      incorrect: 0,
      totalAttempts: 0,
      accuracy: 0,
    });
    const stats = {};
    quizItems.forEach((item) => {
      stats[item.id] = { passed: 0, failed: 0, attempts: 0 };
    });
    setItemStats(stats);
    setQuizItems(shuffleArray(quizItems));

    // Restart from first phase of selected mode
    if (setType === 'grammar') {
      if (quizType === 'with-review') {
        setCurrentPhase('review');
        setReviewItems(cardsData);
      } else if (quizType === 'mc-only') {
        setCurrentPhase('multiple-choice');
        initializeMultipleChoice();
      }
    } else {
      if (quizMode === 'practice') {
        setCurrentPhase('translation');
      } else if (quizMode === 'new') {
        setCurrentPhase('multiple-choice');
        initializeMultipleChoice();
      } else if (quizMode === 'completely-new') {
        setCurrentPhase('review');
        setReviewItems(cardsData);
      }
    }
  };

  // Handle exit
  const handleExit = () => {
    abortAnalyticsSession();
    router.push(`/learn/academy/sets/study/${id}`);
  };

  // Get current items based on phase
  const getCurrentItems = () => {
    if (currentPhase === 'review') return reviewItems;
    if (currentPhase === 'multiple-choice') return multipleChoiceItems;
    return quizItems;
  };

  // Show error state
  if (error) {
    return (
      <AuthenticatedLayout
        sidebar="academy"
        title="Error Loading Quiz"
        variant="fixed"
        mainClassName="px-4 sm:px-6 py-4 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
            Error Loading Quiz
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/learn/academy/sets')}
            className="px-4 py-2 bg-brand-pink text-white rounded-lg hover:bg-[#c00950] transition-colors"
          >
            Back to Sets
          </button>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      sidebar="academy"
      title={`Quiz • ${setInfo?.title || 'Study Set'}`}
      variant="gradient"
      mainClassName="p-3 sm:p-6 sm:mt-10"
    >
      {/* Loading State */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl space-y-6 px-4">
            {/* Question card skeleton */}
            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-surface-card shadow-sm p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="h-3 w-20 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse" />
                <div
                  className="h-10 w-48 rounded-lg bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                  style={{ animationDelay: '50ms' }}
                />
                <div
                  className="h-5 w-36 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                  style={{ animationDelay: '100ms' }}
                />
              </div>
            </div>
            {/* Option rows skeleton */}
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-surface-card animate-pulse"
                  style={{ animationDelay: `${150 + i * 60}ms` }}
                >
                  <div className="flex items-center h-full px-4 gap-3">
                    <div className="h-5 w-5 rounded-full bg-black/[0.06] dark:bg-white/[0.06]" />
                    <div
                      className="h-4 rounded bg-black/[0.06] dark:bg-white/[0.06]"
                      style={{ width: `${60 - i * 8}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !modeSelectionComplete ? (
        /* Mode Selection Screen */
        <MasterQuizModeSelect
          setTitle={setInfo?.title}
          setType={setType}
          onSelectMode={handleModeSelect}
          onExit={handleExit}
        />
      ) : (
        <>
          {/* Header */}
          {!quizCompleted && (
            <MasterQuizHeader
              setTitle={setInfo?.title}
              setType={setType}
              sessionStats={sessionStats}
              currentIndex={currentIndex}
              totalQuestions={getCurrentItems().length}
              currentPhase={currentPhase}
              quizMode={quizMode}
              quizType={quizType}
              completedPhases={completedPhases}
              completedCount={completedItems[currentPhase]?.size || 0}
              onExit={handleExit}
            />
          )}

          {/* Main Quiz Area */}
          {quizCompleted ? (
            <SummaryView
              sessionStats={sessionStats}
              answeredItems={answeredItems}
              animateAccuracy={animateAccuracy}
              onRetry={handleRetry}
              onBackToSet={handleExit}
              completionTitle="Quiz Complete!"
            />
          ) : currentPhase === 'review' ? (
            <ReviewView
              currentCard={reviewItems[currentIndex]}
              isLastCard={currentIndex === reviewItems.length - 1}
              isFirstCard={currentIndex === 0}
              onNext={() => {
                // Mark current card as completed before moving
                setCompletedItems((prev) => {
                  const newSet = new Set(prev['review']);
                  newSet.add(reviewItems[currentIndex].id);
                  return { ...prev, review: newSet };
                });
                if (currentIndex < reviewItems.length - 1) {
                  setCurrentIndex((prev) => prev + 1);
                } else {
                  handlePhaseComplete();
                }
              }}
              onPrevious={() => {
                if (currentIndex > 0) {
                  setCurrentIndex((prev) => prev - 1);
                }
              }}
            />
          ) : currentPhase === 'multiple-choice' ? (
            <MasterMultipleChoice
              quizItems={multipleChoiceItems}
              currentIndex={currentIndex}
              onAnswerSubmitted={handleAnswerSubmitted}
              onNext={() => setCurrentIndex((prev) => prev + 1)}
              onComplete={handlePhaseComplete}
            />
          ) : (
            <MasterQuestionCard
              quizItems={quizItems}
              currentIndex={currentIndex}
              onAnswerSubmitted={handleAnswerSubmitted}
              onNext={() => setCurrentIndex((prev) => prev + 1)}
              onEditItem={handleOpenEditItem}
              disableKeyboardShortcuts={Boolean(editingItem)}
              onComplete={() => {
                setQuizCompleted(true);
              }}
            />
          )}

          <ItemEditModal
            item={editingItem}
            isOpen={Boolean(editingItem)}
            isSaving={isSavingEdit}
            error={editError}
            onClose={handleCloseEditItem}
            onSave={handleSaveEditedItem}
          />
        </>
      )}
    </AuthenticatedLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();
