// Dev Playground — exact replica of due-now.js with mock vocab data injected.
// No auth, no database. API calls from hooks (saveSRSLevel, analytics, item edit)
// will 404 silently — the UI flow works identically to production.
//
// This is a vocab-only set, which means:
//   - No multiple-choice phase (MC is only for grammar items)
//   - Translation phase only (English↔Kana, Kanji↔English, Kanji↔Kana)
//   - Level changes fire after ALL variations of a vocab item are completed
//   - Incorrect answers get re-queued to the end of the array
//
// Visit: http://localhost:3000/dev/srs-playground

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';

import { FaDumbbell } from 'react-icons/fa';

import SessionStatHeaderView from '@/components/Set/Features/Field-Card-Session/shared/views/SessionStatHeaderView.jsx';
import TypedResponseView from '@/components/Set/Features/Field-Card-Session/shared/views/TypedResponseView.jsx';
import SummaryView from '@/components/Set/Features/Field-Card-Session/shared/views/SummaryView';
import LevelChangeView, {
  LevelChangePlaceholder,
} from '@/components/Set/Features/Field-Card-Session/SRS/views/LevelChangeView';
import ItemEditModal from '@/components/Set/Features/Field-Card-Session/shared/views/ItemEditModal.jsx';
import { validateTypedAnswer } from '@/lib/study/answerValidation';
import { shuffleArray } from '@/lib/study/mcOptionGeneration';
import { transformItems } from '@/lib/study/itemTransform';
import { generateTranslationItems } from '@/lib/study/translationGeneration';
import {
  mergeIntoBaseItem,
  mergeIntoQuestionItem,
} from '@/lib/study/itemEditing';

import useQuestionState from '@/hooks/study/useQuestionState';
import useSessionStats from '@/hooks/study/useSessionStats';
import usePhaseProgress from '@/hooks/study/usePhaseProgress';
import useItemEditing from '@/hooks/study/useItemEditing';
import useSrsLevelTracking from '@/hooks/study/useSrsLevelTracking';

// ─── Mock API Data ──────────────────────────────────────────────────────────
// Shaped exactly like the API response items from /api/database/v2/srs/set/due/[id]
// so transformItems() processes them identically to production.
// Vocab only — no grammar items — matching a real vocab set due-now session.

const MOCK_API_ITEMS = [
  {
    id: 'mock-uuid-v0',
    type: 'vocab',
    kana: 'たべる',
    kanji: '食べる',
    english: 'to eat',
    lexical_category: 'verb',
    example_sentences: ['毎日ご飯を食べます。', 'ピザを食べたい。'],
    tags: ['N5', 'food'],
    srs: { srs_level: 3 },
  },
  {
    id: 'mock-uuid-v1',
    type: 'vocab',
    kana: 'のむ',
    kanji: '飲む',
    english: 'to drink',
    lexical_category: 'verb',
    example_sentences: ['水を飲みます。', 'コーヒーを飲みたい。'],
    tags: ['N5', 'food'],
    srs: { srs_level: 1 },
  },
  {
    id: 'mock-uuid-v2',
    type: 'vocab',
    kana: 'ねこ',
    kanji: '猫',
    english: 'cat',
    lexical_category: 'noun',
    example_sentences: ['猫が好きです。'],
    tags: ['N5', 'animals'],
    srs: { srs_level: 5 },
  },
  {
    id: 'mock-uuid-v3',
    type: 'vocab',
    kana: 'はしる',
    kanji: '走る',
    english: 'to run',
    lexical_category: 'verb',
    example_sentences: ['公園で走ります。'],
    tags: ['N4', 'movement'],
    srs: { srs_level: 2 },
  },
  {
    id: 'mock-uuid-v4',
    type: 'vocab',
    kana: 'きれい',
    kanji: null,
    english: 'beautiful; clean',
    lexical_category: 'na-adjective',
    example_sentences: ['この花はきれいです。'],
    tags: ['N5'],
    srs: { srs_level: 4 },
  },
];

const MOCK_SET_INFO = {
  title: 'Dev Playground Set',
  description: 'Mock data for UI/UX testing',
};

// ─── Page Component ─────────────────────────────────────────────────────────
// This is a line-for-line copy of due-now.js with only three changes:
//   1. Mock data instead of API fetch
//   2. No AuthenticatedLayout / withPageAuthRequired
//   3. No useAnalyticsSession / markSetStudied (no-ops in dev)

export default function SrsPlayground() {
  const router = useRouter();

  // Data states
  const [itemData, setItemData] = useState([]);
  const [setInfo, setSetInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // SRS Array states - translation only (no MC for vocab sets)
  const [translationArray, setTranslationArray] = useState([]);

  // Phase management
  const [currentPhase, setCurrentPhase] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Active arrays (mutable — items appended on incorrect answers)
  const [activeTranslationArray, setActiveTranslationArray] = useState([]);

  // ============ SHARED HOOKS (identical to due-now.js) ============
  const {
    showResult,
    setShowResult,
    isCorrect,
    setIsCorrect,
    isNearMiss,
    setIsNearMiss,
    userAnswer,
    setUserAnswer,
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
    showLevelChange,
    currentLevelChange,
    setShouldGoToSummaryAfterLevelChange,
    leveledItemIdsRef,
    mistakesPerItemRef,
    initLevels,
    recordMistake,
    retractMistake,
    checkAndTriggerLevelChange,
    handleLevelChangeComplete,
  } = useSrsLevelTracking();

  // Dev: fake level change overlay (independent of real SRS tracking)
  const [devLevelChange, setDevLevelChange] = useState(null);
  const devLevelCounterRef = useRef(0);

  // Refs
  const translationInputRef = useRef(null);
  const sessionInitializedRef = useRef(false);

  // ============ MOCK DATA INITIALIZATION (replaces API fetch) ============
  useEffect(() => {
    setSetInfo(MOCK_SET_INFO);

    // Transform mock API items exactly like the real page does
    const transformedItemData = transformItems(MOCK_API_ITEMS, {
      includeSrsLevel: true,
    });

    setItemData(transformedItemData);

    // Initialize SRS levels for each item
    initLevels(transformedItemData);

    // Generate translation questions for vocabulary items only
    // (identical to due-now.js line 226)
    const translation = generateTranslationItems(transformedItemData);

    // Shuffle the array so questions appear in random order
    const shuffledTranslation = shuffleArray(translation);
    setTranslationArray(shuffledTranslation);

    // Vocab-only set: no MC, go straight to translation
    setCurrentPhase('translation');

    // Fake a short loading delay so you can see the skeleton
    setTimeout(() => setIsLoading(false), 600);
  }, []);

  // Initialize active arrays when data is loaded (once only)
  // (identical to due-now.js lines 273-305)
  useEffect(() => {
    if (itemData.length > 0 && !sessionInitializedRef.current) {
      sessionInitializedRef.current = true;
      setActiveTranslationArray([...translationArray]);

      // Set up phase progress — translation only
      const phaseProgressObj = {};
      if (translationArray.length > 0) {
        phaseProgressObj['translation'] = {
          completedItems: new Set(),
          totalUniqueItems: translationArray.length,
        };
      }
      setPhaseProgress(phaseProgressObj);
    }
  }, [itemData, translationArray]);

  // ============ HELPER FUNCTIONS ============

  const getCurrentArray = () => {
    return activeTranslationArray;
  };

  // ============ CORE LOGIC HANDLERS (identical to due-now.js) ============

  // Handle answer submission
  // (identical to due-now.js handleAnswerSubmitted, lines 370-406)
  const handleAnswerSubmitted = (answerData) => {
    const currentItem = getCurrentArray()[currentIndex];
    const originalId = currentItem.originalId;

    // Record the answer via hook
    recordAnswer({
      ...answerData,
      phase: currentPhase,
      timestamp: Date.now(),
      originalId: originalId,
    });

    // Track mistakes per original item (not per question variation)
    if (!answerData.isCorrect) {
      recordMistake(originalId);
    }

    // Track unique items completed
    // Each variation (e.g., "English -> Kana") counts as a separate completion
    if (answerData.isCorrect) {
      markItemCompleted(currentPhase, currentItem.id);
    }

    // If incorrect, add current item to end of array for retry
    if (!answerData.isCorrect) {
      setActiveTranslationArray((prev) => {
        const hasRetryQueued = prev
          .slice(currentIndex + 1)
          .some((item) => item.id === currentItem.id);
        return hasRetryQueued ? prev : [...prev, currentItem];
      });
    }

    // Store correctness for UI feedback
    setIsCorrect(answerData.isCorrect);
    setIsNearMiss(answerData.isNearMiss || false);
    setShowResult(true);
  };

  // Handle next navigation
  // (identical to due-now.js handleNext, lines 409-445)
  const handleNext = () => {
    const currentArray = getCurrentArray();
    const currentItem = currentArray[currentIndex];
    const originalId = currentItem.originalId;

    // Check if this is the last question
    const isLastQuestion = currentIndex >= currentArray.length - 1;

    // Check if all question variations for this original item are now completed
    const willShowLevelChange = checkAndTriggerLevelChange(
      originalId,
      translationArray,
      phaseProgress,
      itemData,
      'dev_playground'
    );

    // If this is the last question AND we're showing a level change,
    // wait for the level change animation to complete before going to summary.
    // Don't reset UI state here -- keep showing the answered card behind the animation.
    if (isLastQuestion && willShowLevelChange) {
      setShouldGoToSummaryAfterLevelChange(true);
      return;
    }

    // Reset question state for the next card
    setShowResult(false);
    setIsCorrect(false);
    setUserAnswer('');

    // Check if there are more items in current phase
    if (currentIndex < currentArray.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handlePhaseComplete();
    }
  };

  // Handle phase completion and transition
  // (identical to due-now.js handlePhaseComplete, lines 448-467)
  const handlePhaseComplete = () => {
    // Translation completed, go to summary
    setCurrentPhase('complete');
    triggerAccuracyAnimation();
  };

  // ============ TRANSLATION HANDLERS ============
  // (identical to due-now.js, lines 471-525)

  const handleTranslationCheck = () => {
    const currentItem = activeTranslationArray[currentIndex];

    // Use shared validation utility
    const { isCorrect: correct, isNearMiss: nearMiss } = validateTypedAnswer(
      userAnswer,
      currentItem.answer,
      currentItem.answerType
    );

    handleAnswerSubmitted({
      isCorrect: correct,
      isNearMiss: nearMiss,
      userAnswer,
      correctAnswer: currentItem.answer,
      questionId: currentItem.id,
      questionType: currentItem.questionType,
      answerType: currentItem.answerType,
      question: currentItem.question,
    });
  };

  const handleTranslationRetry = () => {
    // User clicked "I was correct" button
    // Rollback everything:
    // 1. Remove the last answered item (the incorrect one)
    // 2. Reverse the stats changes
    // 3. Remove the item from the end of the array (added due to incorrect answer)
    // 4. Mark the item as completed in phaseProgress
    // 5. Decrement the mistake count
    // 6. Reset the UI state
    const currentItem = activeTranslationArray[currentIndex];
    const originalId = currentItem.originalId;

    // Remove last answered item and reverse stats
    retractLastAnswer();

    // Decrement mistake count (user claims they were correct)
    retractMistake(originalId);

    // Mark item as completed (user claims correct)
    markItemCompleted(currentPhase, currentItem.id);

    // Remove the duplicate item from the end of the translation array
    // (it was added because the answer was marked incorrect)
    setActiveTranslationArray((prev) => prev.slice(0, -1));

    // Reset UI state to allow retyping
    resetQuestion();

    // Focus the input field
    if (translationInputRef?.current) {
      translationInputRef.current.focus();
    }
  };

  // ============ ITEM EDITING HANDLERS ============
  // (identical to due-now.js, lines 529-537)

  const handleSaveEditedItem = async (updatedItem) => {
    // In dev mode this will 404 on the API call — that's expected.
    // The local state merges still happen so the UI updates.
    await saveEdit(updatedItem, [
      { setState: setItemData, mergeFn: mergeIntoBaseItem },
      { setState: setTranslationArray, mergeFn: mergeIntoQuestionItem },
      { setState: setActiveTranslationArray, mergeFn: mergeIntoQuestionItem },
    ]);
  };

  // ============ GENERAL HANDLERS ============

  const handleExit = () => {
    router.reload();
  };

  const onLevelChangeComplete = () => {
    handleLevelChangeComplete(handlePhaseComplete);
  };

  // ============ COMPUTED VALUES ============
  // (identical to due-now.js, lines 553-599)

  const phases = useMemo(() => {
    const phaseArray = [];

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
  }, [translationArray]);

  const currentPhaseIndex = phases.findIndex((p) => p.id === currentPhase);
  const currentPhaseConfig = phases[currentPhaseIndex];
  const CurrentPhaseIcon = currentPhaseConfig?.icon;

  // Helper to get completed count for current phase
  const getCompletedCount = () => {
    return phaseProgress[currentPhase]?.completedItems.size || 0;
  };

  // Helper to get total unique items for current phase
  const getTotalUniqueItems = () => {
    return phaseProgress[currentPhase]?.totalUniqueItems || 0;
  };

  // Calculate progress percentage based on unique items completed
  const calculateProgressPercentage = () => {
    const completed = getCompletedCount();
    const total = getTotalUniqueItems();
    return total > 0 ? (completed / total) * 100 : 0;
  };

  // ============ DEV CONTROLS ============

  const handleDevFillCorrect = () => {
    if (showResult || currentPhase !== 'translation') return;
    const currentItem = activeTranslationArray[currentIndex];
    if (currentItem) setUserAnswer(currentItem.answer);
  };

  const handleDevFillWrong = () => {
    if (showResult || currentPhase !== 'translation') return;
    setUserAnswer('wrong');
  };

  // Step back: fully undo the question at the target index so it can be
  // re-answered and re-trigger level-ups. Undoes: phaseProgress completion,
  // level-up tracking, mistake tracking, SRS level state — for EVERY
  // variation of that item's originalId.
  const handleDevStepBack = () => {
    // Figure out which index we're rewinding TO
    let targetIndex;
    if (currentPhase === 'complete') {
      // Back out of summary into the last translation question
      setCurrentPhase('translation');
      targetIndex = activeTranslationArray.length - 1;
    } else if (showResult) {
      // Currently showing a result — stay on this question but undo its answer
      targetIndex = currentIndex;
    } else {
      // Pre-submit — go to the previous question
      targetIndex = Math.max(0, currentIndex - 1);
    }

    // Get the item at the target index and its originalId
    const targetItem = activeTranslationArray[targetIndex];
    if (!targetItem) return;
    const originalId = targetItem.originalId;

    // 1. Remove this originalId from leveledItemIds so level-up can fire again
    leveledItemIdsRef.current.delete(originalId);

    // 2. Remove ALL variations of this originalId from phaseProgress completions
    //    so checkAndTriggerLevelChange sees them as incomplete
    const allVariationIds = translationArray
      .filter((q) => q.originalId === originalId)
      .map((q) => q.id);

    setPhaseProgress((prev) => {
      const translationProgress = prev.translation;
      if (!translationProgress) return prev;

      const newCompleted = new Set(translationProgress.completedItems);
      for (const varId of allVariationIds) {
        newCompleted.delete(varId);
      }

      return {
        ...prev,
        translation: {
          ...translationProgress,
          completedItems: newCompleted,
        },
      };
    });

    // 3. Re-initialize SRS levels from the original mock data so the
    //    old level is back to what it was before any level change
    initLevels(itemData);

    // 4. Reset question UI and move to target index
    resetQuestion();
    setCurrentIndex(targetIndex);
  };

  // Reset all level tracking so level-ups can fire again on any item.
  // Also clears phaseProgress completions so variations count as incomplete.
  const handleDevResetLevels = () => {
    // Re-initialize SRS levels from original item data (resets itemSRSLevels + mistakesPerItem)
    initLevels(itemData);
    // Clear the set of items that have already triggered level changes
    leveledItemIdsRef.current.clear();
    // Reset phaseProgress completions so all variations are "not yet completed"
    setPhaseProgress((prev) => {
      const reset = {};
      for (const [phase, data] of Object.entries(prev)) {
        reset[phase] = {
          ...data,
          completedItems: new Set(),
        };
      }
      return reset;
    });
  };

  // Auto-advance: fill correct answer, submit, then advance — all in one click
  const handleDevAutoAdvance = () => {
    if (currentPhase !== 'translation') return;
    const currentItem = activeTranslationArray[currentIndex];
    if (!currentItem) return;

    if (!showResult) {
      // Fill + submit
      setUserAnswer(currentItem.answer);
      // Need a tick for state to settle before submitting
      setTimeout(() => {
        handleAnswerSubmitted({
          isCorrect: true,
          isNearMiss: false,
          userAnswer: currentItem.answer,
          correctAnswer: currentItem.answer,
          questionId: currentItem.id,
          questionType: currentItem.questionType,
          answerType: currentItem.answerType,
          question: currentItem.question,
        });
      }, 0);
    } else {
      // Already showing result, just advance
      handleNext();
    }
  };

  // Dev: trigger a fake level change dropdown — cycles through items and
  // varied SRS levels so you see different "Next in" intervals.
  const MOCK_LEVEL_SCENARIOS = [
    {
      item: {
        type: 'vocabulary',
        kanji: '食べる',
        kana: 'たべる',
        english: 'to eat',
      },
      oldLevel: 1,
      newLevel: 2,
    }, // Next in 1 day
    {
      item: {
        type: 'vocabulary',
        kanji: '飲む',
        kana: 'のむ',
        english: 'to drink',
      },
      oldLevel: 3,
      newLevel: 2,
    }, // Level down → 1 day
    {
      item: { type: 'vocabulary', kanji: '猫', kana: 'ねこ', english: 'cat' },
      oldLevel: 3,
      newLevel: 4,
    }, // Next in 7 days
    {
      item: {
        type: 'vocabulary',
        kanji: '走る',
        kana: 'はしる',
        english: 'to run',
      },
      oldLevel: 5,
      newLevel: 6,
    }, // Next in 30 days
    {
      item: {
        type: 'vocabulary',
        kanji: null,
        kana: 'きれい',
        english: 'beautiful; clean',
      },
      oldLevel: 7,
      newLevel: 8,
    }, // Next in 120 days
    {
      item: {
        type: 'vocabulary',
        kanji: '読む',
        kana: 'よむ',
        english: 'to read',
      },
      oldLevel: 2,
      newLevel: 1,
    }, // Level down → 10 min
    {
      item: {
        type: 'vocabulary',
        kanji: '書く',
        kana: 'かく',
        english: 'to write',
      },
      oldLevel: 4,
      newLevel: 5,
    }, // Next in 14 days
    {
      item: {
        type: 'vocabulary',
        kanji: '聞く',
        kana: 'きく',
        english: 'to listen',
      },
      oldLevel: 8,
      newLevel: 9,
    }, // Next in 6 months
  ];

  const handleDevTriggerLevelChange = () => {
    const idx = devLevelCounterRef.current % MOCK_LEVEL_SCENARIOS.length;
    devLevelCounterRef.current += 1;
    setDevLevelChange(MOCK_LEVEL_SCENARIOS[idx]);
  };

  const handleDevLevelChangeComplete = () => {
    setDevLevelChange(null);
  };

  // Which level change to show — dev override takes priority
  const activeLevelChange =
    devLevelChange ||
    (showLevelChange && currentLevelChange ? currentLevelChange : null);
  const activeLevelChangeComplete = devLevelChange
    ? handleDevLevelChangeComplete
    : onLevelChangeComplete;

  // ============ RENDER ============
  // (identical to due-now.js render, lines 623-771, minus AuthenticatedLayout)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-surface-page dark:via-surface-page dark:to-surface-page">
      {/* Dev banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-1.5 text-center">
        <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
          DEV PLAYGROUND — mock data, no auth, no API writes
        </span>
      </div>

      <div className="p-3 sm:p-6 sm:mt-10">
        {/* Loading State (identical skeleton to due-now.js) */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-2xl space-y-6 px-4">
              {/* Session header skeleton */}
              <div className="flex items-center justify-between">
                <div className="h-6 w-40 rounded-lg bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
                <div
                  className="h-5 w-20 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                  style={{ animationDelay: '50ms' }}
                />
              </div>
              {/* Progress bar skeleton */}
              <div
                className="h-2.5 w-full rounded-full bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                style={{ animationDelay: '100ms' }}
              />
              {/* Card skeleton */}
              <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-surface-card shadow-sm p-8">
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="h-10 w-36 rounded-lg bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="h-5 w-48 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                    style={{ animationDelay: '200ms' }}
                  />
                  <div
                    className="h-4 w-28 rounded bg-black/[0.03] dark:bg-white/[0.03] animate-pulse"
                    style={{ animationDelay: '250ms' }}
                  />
                </div>
              </div>
              {/* Action buttons skeleton */}
              <div className="flex justify-center gap-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-24 rounded-lg bg-black/[0.05] dark:bg-white/[0.05] animate-pulse"
                    style={{ animationDelay: `${300 + i * 50}ms` }}
                  />
                ))}
              </div>
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
                completionTitle="SRS Review Complete"
              />
            )}

            {/* Show active phase components */}
            {currentPhase !== 'complete' && (
              <div className="relative flex-1">
                {/* Quiz Header */}
                <SessionStatHeaderView
                  setTitle={setInfo?.title}
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
                  {activeLevelChange ? (
                    <LevelChangeView
                      item={activeLevelChange.item}
                      oldLevel={activeLevelChange.oldLevel}
                      newLevel={activeLevelChange.newLevel}
                      onComplete={activeLevelChangeComplete}
                    />
                  ) : (
                    <LevelChangePlaceholder />
                  )}
                </div>

                {/* Translation Phase */}
                {currentPhase === 'translation' &&
                  activeTranslationArray.length > 0 && (
                    <TypedResponseView
                      currentItem={activeTranslationArray[currentIndex]}
                      userAnswer={userAnswer}
                      showResult={showResult}
                      isCorrect={isCorrect}
                      isNearMiss={isNearMiss}
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

        {/* Floating dev toolbar — fixed position, won't affect layout */}
        {currentPhase !== null && (
          <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-gray-900/90 backdrop-blur rounded-xl px-3 py-2 shadow-2xl opacity-70 hover:opacity-100 transition-opacity">
            <button
              onClick={handleDevStepBack}
              disabled={currentIndex === 0 && currentPhase !== 'complete'}
              className="px-3 py-2 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Step back one question"
            >
              Back
            </button>
            {currentPhase !== 'complete' && !showResult && (
              <>
                <button
                  onClick={handleDevFillCorrect}
                  className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-500"
                  title="Fill correct answer"
                >
                  Fill
                </button>
                <button
                  onClick={handleDevFillWrong}
                  className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500"
                  title="Fill wrong answer"
                >
                  Wrong
                </button>
              </>
            )}
            <button
              onClick={handleDevAutoAdvance}
              disabled={currentPhase === 'complete'}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Auto fill + submit + next"
            >
              Skip
            </button>
            <div className="w-px h-6 bg-gray-600" />
            <button
              onClick={handleDevResetLevels}
              className="px-3 py-2 rounded-lg bg-yellow-500 text-yellow-950 text-sm font-medium hover:bg-yellow-400"
              title="Reset all level tracking so level-ups fire again"
            >
              Reset Levels
            </button>
            <div className="w-px h-6 bg-gray-600" />
            <button
              onClick={handleDevTriggerLevelChange}
              className="px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500"
              title="Trigger a fake level change dropdown. Click rapidly to test back-to-back."
            >
              Level Up
            </button>
          </div>
        )}

        <ItemEditModal
          item={editingItem}
          isOpen={Boolean(editingItem)}
          isSaving={isSavingEdit}
          error={editError}
          onClose={closeEdit}
          onSave={handleSaveEditedItem}
        />
      </div>
    </div>
  );
}
