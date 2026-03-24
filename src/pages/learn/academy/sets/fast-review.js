// pages/learn/academy/sets/fast-review.js
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import AuthenticatedLayout from '@/components/ui/AuthenticatedLayout';

// Import icons for phase indicators
import { FaDumbbell } from 'react-icons/fa';
import { IoSparkles } from 'react-icons/io5';

// Import SRS Learn New Components
import SessionStatHeaderView from '@/components/Set/Features/Field-Card-Session/shared/views/SessionStatHeaderView.jsx';
import TypedResponseView from '@/components/Set/Features/Field-Card-Session/shared/views/TypedResponseView.jsx';
import MultipleChoiceView from '@/components/Set/Features/Field-Card-Session/shared/views/MultipleChoiceView.jsx';
import SummaryView from '@/components/Set/Features/Field-Card-Session/shared/views/SummaryView';
import LevelChangeView, {
  LevelChangePlaceholder,
} from '@/components/Set/Features/Field-Card-Session/SRS/views/LevelChangeView';
import ItemEditModal from '@/components/Set/Features/Field-Card-Session/shared/views/ItemEditModal.jsx';
import {
  validateTypedAnswer,
  validateMultipleChoice,
} from '@/lib/study/answerValidation';
import {
  pregenerateMultipleChoiceItems,
  shuffleArray,
  shuffleOptionsWithDistractors,
} from '@/lib/study/mcOptionGeneration';
import { transformItems } from '@/lib/study/itemTransform';
import { generateTranslationItems } from '@/lib/study/translationGeneration';
import {
  mergeIntoBaseItem,
  mergeIntoQuestionItem,
} from '@/lib/study/itemEditing';
import useAnalyticsSession from '@/hooks/useAnalyticsSession';
import { clientLog } from '@/lib/clientLogger';

// Shared study hooks
import useQuestionState from '@/hooks/study/useQuestionState';
import useSessionStats from '@/hooks/study/useSessionStats';
import usePhaseProgress from '@/hooks/study/usePhaseProgress';
import useItemEditing from '@/hooks/study/useItemEditing';
import useSrsLevelTracking from '@/hooks/study/useSrsLevelTracking';

export default function FastReview() {
  const router = useRouter();

  // Data states
  const [itemData, setItemData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Multi-set tracking
  const [setBreakdown, setSetBreakdown] = useState([]);

  // SRS Array states - translation and multiple choice
  const [translationArray, setTranslationArray] = useState([]);
  const [multipleChoiceArray, setMultipleChoiceArray] = useState([]);

  // ============ PHASE MANAGEMENT ============
  const [currentPhase, setCurrentPhase] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ============ ACTIVE ARRAYS (MUTABLE) ============
  const [activeTranslationArray, setActiveTranslationArray] = useState([]);
  const [activeMCArray, setActiveMCArray] = useState([]);

  // ============ SHARED HOOKS ============
  const {
    showResult,
    setShowResult,
    isCorrect,
    setIsCorrect,
    userAnswer,
    setUserAnswer,
    selectedOption,
    setSelectedOption,
    currentShuffledOptions,
    setCurrentShuffledOptions,
    resetQuestion,
  } = useQuestionState();

  const {
    sessionStats,
    answeredItems,
    animateAccuracy,
    recordAnswer,
    retractLastAnswer,
    triggerAccuracyAnimation,
  } = useSessionStats();

  const {
    phaseProgress,
    setPhaseProgress,
    completedPhases,
    markItemCompleted,
  } = usePhaseProgress();

  const {
    editingItem,
    isSavingEdit,
    editError,
    openEdit,
    closeEdit,
    saveEdit,
  } = useItemEditing();

  const {
    mistakesPerItemRef,
    showLevelChange,
    currentLevelChange,
    setShouldGoToSummaryAfterLevelChange,
    leveledItemIdsRef,
    initLevels,
    recordMistake,
    retractMistake,
    checkAndTriggerLevelChange,
    handleLevelChangeComplete,
  } = useSrsLevelTracking();

  // ============ REFS ============
  const translationInputRef = useRef(null);
  const sessionInitializedRef = useRef(false);

  // ============ ANALYTICS ============
  const {
    start: startAnalyticsSession,
    finish: finishAnalyticsSession,
    abort: abortAnalyticsSession,
  } = useAnalyticsSession('srs_fast_review');

  const markSetsStudied = async (breakdown) => {
    const now = new Date().toISOString();
    await Promise.allSettled(
      breakdown.map((s) =>
        fetch('/api/database/v2/sets/update-from-full-set', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType: 'set',
            entityId: s.setId,
            updates: { last_studied: now },
          }),
        })
      )
    );
  };

  // Fetch all due items across sets
  useEffect(() => {
    const fetchAllDueItems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/database/v2/srs/all-due');

        if (!response.ok) {
          throw new Error(`Failed to fetch due items: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load due items');
        }

        const apiData = result.data;
        const apiItems = apiData.items || [];
        const metadata = apiData.metadata || {};

        if (apiItems.length === 0) {
          throw new Error('No items due for review');
        }

        // Store set breakdown for summary
        setSetBreakdown(metadata.setBreakdown || []);

        // Transform items to internal format
        const transformedItemData = transformItems(apiItems, {
          includeSrsLevel: true,
        });

        if (transformedItemData.length === 0) {
          throw new Error('No items due for review');
        }

        setItemData(transformedItemData);

        // ============================================
        // Initialize SRS levels for each item
        // ============================================
        initLevels(transformedItemData);

        // ============================================
        // QUESTION ARRAYS: Separate by Type
        // ============================================

        // Generate translation questions for vocabulary items only
        const translation = generateTranslationItems(transformedItemData);

        // Generate multiple choice questions for grammar items only
        const grammarItems = transformedItemData.filter(
          (item) => item.type === 'grammar'
        );

        const multipleChoice = pregenerateMultipleChoiceItems(
          grammarItems,
          grammarItems,
          3
        );

        // Shuffle the arrays so questions appear in random order
        const shuffledTranslation = shuffleArray(translation);
        const shuffledMultipleChoice = shuffleArray(multipleChoice);
        setTranslationArray(shuffledTranslation);
        setMultipleChoiceArray(shuffledMultipleChoice);

        // Determine initial phase based on which arrays have content
        let initialPhase = null;
        if (shuffledMultipleChoice.length > 0) {
          initialPhase = 'multiple-choice';
        } else if (shuffledTranslation.length > 0) {
          initialPhase = 'translation';
        }
        setCurrentPhase(initialPhase);
      } catch (err) {
        clientLog.error('fast_review.fetch_due_items_failed', {
          error: err?.message || String(err),
        });
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllDueItems();
  }, []);

  // Initialize active arrays when data is loaded (once only)
  useEffect(() => {
    if (itemData.length > 0 && !sessionInitializedRef.current) {
      sessionInitializedRef.current = true;
      startAnalyticsSession();
      setActiveTranslationArray([...translationArray]);
      setActiveMCArray([...multipleChoiceArray]);

      // Calculate total questions per phase
      const phaseProgressObj = {};
      if (multipleChoiceArray.length > 0) {
        phaseProgressObj['multiple-choice'] = {
          completedItems: new Set(),
          totalUniqueItems: multipleChoiceArray.length,
        };
      }
      if (translationArray.length > 0) {
        phaseProgressObj['translation'] = {
          completedItems: new Set(),
          totalUniqueItems: translationArray.length,
        };
      }
      setPhaseProgress(phaseProgressObj);
    }
  }, [itemData, translationArray, multipleChoiceArray]);

  // Finish analytics session when review completes
  useEffect(() => {
    if (currentPhase === 'complete') {
      const leveledIds = [...leveledItemIdsRef.current];
      const mistakes = mistakesPerItemRef.current;
      const itemsReviewed = leveledIds.length;
      const itemsCorrect = leveledIds.filter(
        (id) => (mistakes[id] || 0) === 0
      ).length;
      finishAnalyticsSession(itemsReviewed, itemsCorrect);
      markSetsStudied(setBreakdown);
    }
  }, [currentPhase, finishAnalyticsSession, setBreakdown]);

  // Shuffle MC options whenever the current item or phase changes
  useEffect(() => {
    if (currentPhase === 'multiple-choice' && activeMCArray.length > 0) {
      const currentItem = activeMCArray[currentIndex];
      if (currentItem) {
        const shuffled = shuffleOptionsWithDistractors(currentItem);
        setCurrentShuffledOptions(shuffled);
        setSelectedOption(null);
      }
    }
  }, [currentPhase, activeMCArray, currentIndex]);

  // ============ HELPER FUNCTIONS ============

  // Get current array based on phase
  const getCurrentArray = () => {
    if (currentPhase === 'multiple-choice') {
      return activeMCArray;
    }
    return activeTranslationArray;
  };

  // ============ CORE LOGIC HANDLERS ============

  // Handle Multiple Choice option selection
  const handleMCOptionSelect = (selectedAnswer) => {
    const currentItem = activeMCArray[currentIndex];
    const correct = validateMultipleChoice(selectedAnswer, currentItem.answer);

    handleAnswerSubmitted({
      isCorrect: correct,
      userAnswer: selectedAnswer,
      correctAnswer: currentItem.answer,
      questionId: currentItem.id,
      questionType: currentItem.questionType,
      answerType: currentItem.answerType,
      question: currentItem.question,
    });

    setSelectedOption(selectedAnswer);
    setShowResult(true);
    setIsCorrect(correct);
  };

  // Handle answer submission for Translation phase
  const handleAnswerSubmitted = (answerData) => {
    const currentItem = getCurrentArray()[currentIndex];
    const originalId = currentItem.originalId;

    // Record the answer via hook
    recordAnswer({
      ...answerData,
      phase: currentPhase,
      timestamp: Date.now(),
      originalId: originalId,
      setId: currentItem.setId,
      setTitle: currentItem.setTitle,
    });

    // Track mistakes per original item
    if (!answerData.isCorrect) {
      recordMistake(originalId);
    }

    // Track unique items completed
    if (answerData.isCorrect) {
      markItemCompleted(currentPhase, currentItem.id);
    }

    // If incorrect, add current item to end of array
    if (!answerData.isCorrect) {
      setActiveTranslationArray((prev) => {
        const hasRetryQueued = prev
          .slice(currentIndex + 1)
          .some((item) => item.id === currentItem.id);
        return hasRetryQueued ? prev : [...prev, currentItem];
      });
    }

    setIsCorrect(answerData.isCorrect);
    setShowResult(true);
  };

  // Handle next navigation for Translation
  const handleNext = () => {
    const currentArray = getCurrentArray();
    const currentItem = currentArray[currentIndex];
    const originalId = currentItem.originalId;

    const isLastQuestion = currentIndex >= currentArray.length - 1;

    const willShowLevelChange = checkAndTriggerLevelChange(
      originalId,
      translationArray,
      phaseProgress,
      itemData,
      'srs_fast_review'
    );

    // If this is the last question AND we're showing a level change,
    // wait for the level change animation to complete before going to summary.
    // Don't reset UI state -- keep showing the answered card behind the animation.
    if (isLastQuestion && willShowLevelChange) {
      setShouldGoToSummaryAfterLevelChange(true);
      return;
    }

    // Reset question state for the next card
    setShowResult(false);
    setIsCorrect(false);
    setUserAnswer('');

    if (currentIndex < currentArray.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handlePhaseComplete();
    }
  };

  // Handle phase completion and transition
  const handlePhaseComplete = () => {
    if (currentPhase === 'multiple-choice') {
      if (translationArray.length > 0) {
        setCurrentPhase('translation');
        setCurrentIndex(0);
        setShowResult(false);
        setUserAnswer('');
      } else {
        setCurrentPhase('complete');
        triggerAccuracyAnimation();
      }
    } else if (currentPhase === 'translation') {
      setCurrentPhase('complete');
      triggerAccuracyAnimation();
    }
  };

  // ============ TRANSLATION HANDLERS ============

  const handleTranslationCheck = () => {
    const currentItem = activeTranslationArray[currentIndex];

    const correct = validateTypedAnswer(
      userAnswer,
      currentItem.answer,
      currentItem.answerType
    );

    handleAnswerSubmitted({
      isCorrect: correct,
      userAnswer,
      correctAnswer: currentItem.answer,
      questionId: currentItem.id,
      questionType: currentItem.questionType,
      answerType: currentItem.answerType,
      question: currentItem.question,
    });
  };

  const handleTranslationRetry = () => {
    const currentItem = activeTranslationArray[currentIndex];
    const originalId = currentItem.originalId;

    // Remove last answered item and reverse stats
    retractLastAnswer();

    // Decrement mistake count
    retractMistake(originalId);

    // Mark item as completed (user claims correct)
    markItemCompleted(currentPhase, currentItem.id);

    // Remove the duplicate item from the end of the translation array
    setActiveTranslationArray((prev) => prev.slice(0, -1));

    // Reset UI state
    resetQuestion();

    if (translationInputRef?.current) {
      translationInputRef.current.focus();
    }
  };

  // ============ ITEM EDITING HANDLERS ============

  const handleSaveEditedItem = async (updatedItem) => {
    await saveEdit(updatedItem, [
      { setState: setItemData, mergeFn: mergeIntoBaseItem },
      { setState: setTranslationArray, mergeFn: mergeIntoQuestionItem },
      { setState: setActiveTranslationArray, mergeFn: mergeIntoQuestionItem },
      { setState: setMultipleChoiceArray, mergeFn: mergeIntoQuestionItem },
      { setState: setActiveMCArray, mergeFn: mergeIntoQuestionItem },
    ]);
  };

  // ============ GENERAL HANDLERS ============

  const handleExit = () => {
    abortAnalyticsSession();
    router.push('/learn/academy/sets');
  };

  const onLevelChangeComplete = () => {
    handleLevelChangeComplete(handlePhaseComplete);
  };

  // ============ COMPUTED VALUES ============

  const phases = useMemo(() => {
    const phaseArray = [];

    if (multipleChoiceArray.length > 0) {
      phaseArray.push({
        id: 'multiple-choice',
        name: 'Multiple Choice',
        icon: IoSparkles,
        color: 'bg-purple-500',
        borderColor: 'border-purple-500',
      });
    }

    if (translationArray.length > 0) {
      phaseArray.push({
        id: 'translation',
        name: 'Translation',
        icon: FaDumbbell,
        color: 'bg-brand-pink',
        borderColor: 'border-brand-pink',
      });
    }

    return phaseArray;
  }, [multipleChoiceArray, translationArray]);

  const currentPhaseIndex = phases.findIndex((p) => p.id === currentPhase);
  const currentPhaseConfig = phases[currentPhaseIndex];
  const CurrentPhaseIcon = currentPhaseConfig?.icon;

  const getCompletedCount = () => {
    return phaseProgress[currentPhase]?.completedItems.size || 0;
  };

  const getTotalUniqueItems = () => {
    return phaseProgress[currentPhase]?.totalUniqueItems || 0;
  };

  const calculateProgressPercentage = () => {
    const completed = getCompletedCount();
    const total = getTotalUniqueItems();
    return total > 0 ? (completed / total) * 100 : 0;
  };

  // Show error state
  if (error) {
    return (
      <AuthenticatedLayout
        sidebar="academy"
        title="Fast Review"
        variant="fixed"
      >
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
              {error === 'No items due for review'
                ? 'All Caught Up!'
                : 'Error Loading Items'}
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error === 'No items due for review'
                ? 'You have no items due for review right now. Check back later!'
                : error}
            </p>
            <button
              onClick={() => router.push('/learn/academy/sets')}
              className="px-4 py-2 bg-brand-pink text-white rounded-lg hover:bg-[#c00950] transition-colors"
            >
              Back to Sets
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      sidebar="academy"
      title="Fast Review"
      variant="gradient"
      mainClassName="p-3 sm:p-6 md:mt-10"
    >
      {/* Loading State */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse mb-4">
              <div className="w-64 h-32 bg-gray-200 dark:bg-white/10 rounded-lg mx-auto"></div>
            </div>
            <p className="text-gray-600 dark:text-white/70">
              Loading due items...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Show completion summary */}
          {currentPhase === 'complete' && (
            <SummaryView
              sessionStats={sessionStats}
              answeredItems={answeredItems}
              animateAccuracy={animateAccuracy}
              onBackToSet={handleExit}
              completionTitle="Fast Review Complete"
              setBreakdown={setBreakdown}
            />
          )}

          {/* Show active phase components */}
          {currentPhase !== 'complete' && (
            <div className="relative flex-1">
              {/* Quiz Header */}
              <SessionStatHeaderView
                setTitle="Fast Review"
                sessionStats={sessionStats}
                currentIndex={currentIndex}
                totalQuestions={getCurrentArray().length}
                currentPhase={currentPhase}
                completedPhases={completedPhases}
                phases={phases}
                currentPhaseIndex={currentPhaseIndex}
                currentPhaseConfig={currentPhaseConfig}
                CurrentPhaseIcon={CurrentPhaseIcon}
                progressInPhase={calculateProgressPercentage()}
                completedCount={getCompletedCount()}
                totalUniqueItems={getTotalUniqueItems()}
                displayMode={'completion-count'}
                onExit={handleExit}
              />

              {/* Level Change slot — placeholder keeps height stable */}
              <div className="max-w-3xl mx-auto px-2 sm:px-0 relative z-20 pb-2 sm:pb-3">
                {showLevelChange && currentLevelChange ? (
                  <LevelChangeView
                    item={currentLevelChange.item}
                    oldLevel={currentLevelChange.oldLevel}
                    newLevel={currentLevelChange.newLevel}
                    onComplete={onLevelChangeComplete}
                  />
                ) : (
                  <LevelChangePlaceholder />
                )}
              </div>

              {/* Multiple Choice Phase */}
              {currentPhase === 'multiple-choice' &&
                activeMCArray.length > 0 && (
                  <MultipleChoiceView
                    currentItem={activeMCArray[currentIndex]}
                    uniqueOptions={currentShuffledOptions}
                    selectedOption={selectedOption}
                    showResult={showResult}
                    isCorrect={isCorrect}
                    isTransitioning={false}
                    isLastQuestion={currentIndex === activeMCArray.length - 1}
                    onOptionSelect={handleMCOptionSelect}
                    onNext={handleNext}
                  />
                )}

              {/* Translation Phase */}
              {currentPhase === 'translation' &&
                activeTranslationArray.length > 0 && (
                  <TypedResponseView
                    currentItem={activeTranslationArray[currentIndex]}
                    userAnswer={userAnswer}
                    showResult={showResult}
                    isCorrect={isCorrect}
                    showHint={false}
                    isLastQuestion={
                      currentIndex === activeTranslationArray.length - 1
                    }
                    inputRef={translationInputRef}
                    onInputChange={(e) => setUserAnswer(e.target.value)}
                    onCheckAnswer={handleTranslationCheck}
                    onNext={handleNext}
                    onRetry={handleTranslationRetry}
                    onEditItem={openEdit}
                    disableKeyboardShortcuts={Boolean(editingItem)}
                  />
                )}
            </div>
          )}
        </>
      )}

      <ItemEditModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        isSaving={isSavingEdit}
        error={editError}
        onClose={closeEdit}
        onSave={handleSaveEditedItem}
      />
    </AuthenticatedLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();
