// pages/learn/academy/sets/study/[id]/srs/learn-new.js
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import AuthenticatedLayout from '@/components/ui/AuthenticatedLayout';
import BaseModal from '@/components/ui/BaseModal';

// Import icons for phase indicators
import { FaBook, FaDumbbell } from 'react-icons/fa';
import { IoSparkles } from 'react-icons/io5';

// Import SRS Learn New Components
import SessionStatHeaderView from '@/components/Set/Features/Field-Card-Session/shared/views/SessionStatHeaderView.jsx';
import TypedResponseView from '@/components/Set/Features/Field-Card-Session/shared/views/TypedResponseView.jsx';
import MultipleChoiceView from '@/components/Set/Features/Field-Card-Session/shared/views/MultipleChoiceView.jsx';
import ReviewView from '@/components/Set/Features/Field-Card-Session/shared/views/ReviewView.jsx';
import SummaryView from '@/components/Set/Features/Field-Card-Session/shared/views/SummaryView';
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
  buildEditableItem,
  toUpdateRequest,
  mergeIntoBaseItem,
  mergeIntoQuestionItem,
} from '@/lib/study/itemEditing';
import useAnalyticsSession from '@/hooks/useAnalyticsSession';
import { clientLog } from '@/lib/clientLogger';
import { markSetStudied } from '@/lib/setActions';

export default function LearnNew() {
  const router = useRouter();
  const { id } = router.query;

  // Data states
  const [itemData, setItemData] = useState([]);
  const [fullSetItems, setFullSetItems] = useState([]); // Full set for MC distractor pool
  const [setInfo, setSetInfo] = useState(null);
  const [setType, setSetType] = useState(null); // 'vocab' | 'grammar'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // SRS saving states
  const [isSavingSRS, setIsSavingSRS] = useState(false);
  const [srsError, setSrsError] = useState(null);

  // SRS Array states
  const [reviewArray, setReviewArray] = useState([]);
  const [multipleChoiceArray, setMultipleChoiceArray] = useState([]);
  const [translationArray, setTranslationArray] = useState([]);

  // ============ PHASE MANAGEMENT ============
  const [currentPhase, setCurrentPhase] = useState('review');
  const [currentIndex, setCurrentIndex] = useState(0);

  // ============ ACTIVE ARRAYS (MUTABLE) ============
  const [activeReviewArray, setActiveReviewArray] = useState([]);
  const [activeMCArray, setActiveMCArray] = useState([]);
  const [activeTranslationArray, setActiveTranslationArray] = useState([]);

  // ============ QUESTION STATE (MC & Translation) ============
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentShuffledOptions, setCurrentShuffledOptions] = useState([]);

  // ============ ITEM EDITING STATE ============
  const [editingItem, setEditingItem] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  // ============ SUMMARY STATE ============
  const [animateAccuracy, setAnimateAccuracy] = useState(false);

  // ============ SESSION TRACKING ============
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    totalAttempts: 0,
    accuracy: 0,
  });
  const sessionStatsRef = useRef(sessionStats);
  sessionStatsRef.current = sessionStats;
  const [answeredItems, setAnsweredItems] = useState([]);

  // ============ PHASE PROGRESS TRACKING ============
  const [phaseProgress, setPhaseProgress] = useState({
    'multiple-choice': {
      completedItems: new Set(),
      totalUniqueItems: 0,
    },
    translation: {
      completedItems: new Set(),
      totalUniqueItems: 0,
    },
  });
  const [completedPhases, setCompletedPhases] = useState([]);

  // ============ REFS ============
  const translationInputRef = useRef(null);
  const sessionInitializedRef = useRef(false);

  // ============ ANALYTICS ============
  const {
    start: startAnalyticsSession,
    finish: finishAnalyticsSession,
    abort: abortAnalyticsSession,
  } = useAnalyticsSession('srs_learn_new');

  // Fetch set data from API
  useEffect(() => {
    if (!id) return;

    const fetchSetData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get limit from URL query params, default to 10 if not provided
        const limitParam = router.query.limit
          ? parseInt(router.query.limit, 10)
          : 10;
        const validLimit =
          isNaN(limitParam) || limitParam <= 0 ? 10 : limitParam;

        const response = await fetch(
          `/api/database/v2/srs/set/learn/${id}?limit=${validLimit}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch set: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load set data');
        }

        const setInfoData = result.data.set;
        const setItemsAPI = result.data.items || [];

        if (!setInfoData) {
          throw new Error('Invalid set data structure received from API');
        }

        setSetInfo({
          title: setInfoData.title || 'Untitled Set',
          description: setInfoData.description?.toString() || '',
        });

        // Extract and store set type
        setSetType(setInfoData.set_type || 'vocab');

        // Transform items to item data format
        const transformedItemData = transformItems(setItemsAPI);

        if (transformedItemData.length === 0) {
          throw new Error('This set has no items to study');
        }

        setItemData(transformedItemData);

        // ============================================
        // Conditionally fetch full set for distractors
        // ============================================
        let distractorPool = transformedItemData; // Default to session items

        if (transformedItemData.length < 4) {
          try {
            const fullSetResponse = await fetch(
              `/api/database/v2/sets/retrieve-set/${id}`
            );

            if (fullSetResponse.ok) {
              const fullSetResult = await fullSetResponse.json();

              if (fullSetResult.success && fullSetResult.data?.data?.items) {
                const fullSetItemsAPI = fullSetResult.data.data.items;
                const transformedFullSet = transformItems(fullSetItemsAPI);

                setFullSetItems(transformedFullSet);
                distractorPool = transformedFullSet;
              }
            }
          } catch (error) {
            clientLog.warn('srs.distractor_fetch_failed', {
              error: error?.message || String(error),
            });
          }
        }

        // ============================================
        // STEP 1: Review Array (flat data)
        // ============================================
        const review = transformedItemData;
        setReviewArray(review);

        // ============================================
        // STEP 2: Multiple Choice Array (all variations)
        // ============================================
        // Use centralized utility to pre-generate MC items with distractors
        const multipleChoice = pregenerateMultipleChoiceItems(
          transformedItemData, // Items to create questions for
          distractorPool, // Items to pull distractors from
          3
        );

        // Shuffle the multiple choice array so questions appear in random order
        const shuffledMultipleChoice = shuffleArray(multipleChoice);
        setMultipleChoiceArray(shuffledMultipleChoice);

        // ============================================
        // STEP 3: Translation Array (all variations)
        // SKIP FOR GRAMMAR SETS
        // ============================================
        const translation =
          setInfoData.set_type !== 'grammar'
            ? generateTranslationItems(transformedItemData, {
                includeGrammar: true,
              })
            : [];

        // Shuffle the translation array so questions appear in random order
        const shuffledTranslation = shuffleArray(translation);
        setTranslationArray(shuffledTranslation);
      } catch (err) {
        clientLog.error('srs.learn_new_fetch_failed', {
          error: err?.message || String(err),
        });
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetData();
  }, [id, router.query.limit]);

  // Initialize active arrays when data is loaded (once only)
  useEffect(() => {
    if (itemData.length > 0 && !sessionInitializedRef.current) {
      sessionInitializedRef.current = true;
      startAnalyticsSession();
      setActiveReviewArray([...reviewArray]);
      setActiveMCArray([...multipleChoiceArray]);
      setActiveTranslationArray([...translationArray]);

      // Calculate total questions per phase (each variation counts separately)
      const progressConfig = {
        'multiple-choice': {
          completedItems: new Set(),
          totalUniqueItems: multipleChoiceArray.length,
        },
      };

      // Only track translation phase for non-grammar sets
      if (setType !== 'grammar') {
        progressConfig['translation'] = {
          completedItems: new Set(),
          totalUniqueItems: translationArray.length,
        };
      }

      setPhaseProgress(progressConfig);
    }
  }, [itemData, reviewArray, multipleChoiceArray, translationArray, setType]);

  // ============ HELPER FUNCTIONS ============

  // Get current array based on phase
  const getCurrentArray = () => {
    switch (currentPhase) {
      case 'review':
        return activeReviewArray;
      case 'multiple-choice':
        return activeMCArray;
      case 'translation':
        return activeTranslationArray;
      default:
        return [];
    }
  };

  // ============ CORE LOGIC HANDLERS ============

  // Handle answer submission for MC and Translation phases
  const handleAnswerSubmitted = (answerData) => {
    // Record the answer
    setAnsweredItems((prev) => [
      ...prev,
      {
        ...answerData,
        phase: currentPhase,
        timestamp: Date.now(),
      },
    ]);

    // Update session stats
    setSessionStats((prev) => {
      const newCorrect = prev.correct + (answerData.isCorrect ? 1 : 0);
      const newIncorrect = prev.incorrect + (answerData.isCorrect ? 0 : 1);
      const newTotal = prev.totalAttempts + 1;

      return {
        correct: newCorrect,
        incorrect: newIncorrect,
        totalAttempts: newTotal,
        accuracy: Math.round((newCorrect / newTotal) * 100),
      };
    });

    // Track unique items completed for MC and Translation phases
    // Each variation (e.g., "English → Kana") counts as a separate completion
    if (
      answerData.isCorrect &&
      (currentPhase === 'multiple-choice' || currentPhase === 'translation')
    ) {
      const currentItem = getCurrentArray()[currentIndex];
      setPhaseProgress((prev) => {
        const newCompletedItems = new Set(prev[currentPhase].completedItems);
        newCompletedItems.add(currentItem.id); // Use item.id (e.g., "vocab-1-mc-en-kana")
        return {
          ...prev,
          [currentPhase]: {
            ...prev[currentPhase],
            completedItems: newCompletedItems,
          },
        };
      });
    }

    // If incorrect, add current item to end of array
    if (!answerData.isCorrect) {
      const currentItem = getCurrentArray()[currentIndex];

      if (currentPhase === 'multiple-choice') {
        setActiveMCArray((prev) => [...prev, currentItem]);
      } else if (currentPhase === 'translation') {
        setActiveTranslationArray((prev) => [...prev, currentItem]);
      }
    }

    // Store correctness for UI feedback
    setIsCorrect(answerData.isCorrect);
    setShowResult(true);
  };

  // Handle next navigation for MC and Translation
  const handleNext = () => {
    const currentArray = getCurrentArray();

    // Reset question state for next item
    setSelectedOption(null);
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
  const handlePhaseComplete = async () => {
    // Reset index for next phase
    setCurrentIndex(0);

    // Transition to next phase
    if (currentPhase === 'review') {
      setCurrentPhase('multiple-choice');
    } else if (currentPhase === 'multiple-choice') {
      // For grammar sets, skip translation and go directly to complete
      if (setType === 'grammar') {
        // Save all items to SRS before showing summary
        const success = await saveAllItemsToSRS();

        if (success) {
          setCurrentPhase('complete');
          // Trigger accuracy bar animation after a short delay
          setTimeout(() => setAnimateAccuracy(true), 100);
        }
        // If save fails, stay on multiple-choice phase and show error popup
      } else {
        // For vocab sets, transition to translation
        setCurrentPhase('translation');
      }
    } else if (currentPhase === 'translation') {
      // Save all items to SRS before showing summary
      const success = await saveAllItemsToSRS();

      if (success) {
        setCurrentPhase('complete');
        // Trigger accuracy bar animation after a short delay
        setTimeout(() => setAnimateAccuracy(true), 100);
      }
      // If save fails, stay on translation phase and show error popup
    }
  };

  // ============ REVIEW PHASE HANDLERS ============

  const handleReviewNext = () => {
    if (currentIndex < activeReviewArray.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handlePhaseComplete();
    }
  };

  const handleReviewPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // ============ MULTIPLE CHOICE HANDLERS ============

  const handleMCOptionSelect = (option) => {
    setSelectedOption(option);

    const currentItem = activeMCArray[currentIndex];
    // Use shared validation utility
    const isCorrect = validateMultipleChoice(option, currentItem.answer);

    handleAnswerSubmitted({
      isCorrect,
      userAnswer: option,
      correctAnswer: currentItem.answer,
      questionId: currentItem.id,
      questionType: currentItem.questionType,
      answerType: currentItem.answerType,
      question: currentItem.question,
    });
  };

  // ============ TRANSLATION HANDLERS ============

  const handleTranslationCheck = () => {
    const currentItem = activeTranslationArray[currentIndex];

    // Use shared validation utility
    const isCorrect = validateTypedAnswer(
      userAnswer,
      currentItem.answer,
      currentItem.answerType
    );

    handleAnswerSubmitted({
      isCorrect,
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
    // Need to rollback everything:
    // 1. Remove the last answered item (the incorrect one we just added)
    // 2. Reverse the stats changes
    // 3. Remove the item from the end of the array (that was added due to incorrect answer)
    // 4. Mark the item as completed in phaseProgress (user says they were correct)
    // 5. Reset the UI state to allow retyping

    const currentItem = activeTranslationArray[currentIndex];

    // Remove last answered item
    setAnsweredItems((prev) => prev.slice(0, -1));

    // Reverse stats changes (remove 1 incorrect, remove 1 total attempt)
    // Then add 1 correct (user claims they were correct)
    setSessionStats((prev) => {
      const newIncorrect = Math.max(0, prev.incorrect - 1);
      const newCorrect = prev.correct + 1;
      const newTotal = prev.totalAttempts; // Same total, just switching incorrect to correct
      const newAccuracy =
        newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0;

      return {
        ...prev,
        correct: newCorrect,
        incorrect: newIncorrect,
        accuracy: newAccuracy,
      };
    });

    // Mark item as completed (user claims correct)
    setPhaseProgress((prev) => {
      const newCompletedItems = new Set(prev[currentPhase].completedItems);
      newCompletedItems.add(currentItem.id); // Use item.id for individual variation
      return {
        ...prev,
        [currentPhase]: {
          ...prev[currentPhase],
          completedItems: newCompletedItems,
        },
      };
    });

    // Remove the duplicate item from the end of the translation array
    // (it was added because the answer was marked incorrect)
    setActiveTranslationArray((prev) => prev.slice(0, -1));

    // Reset UI state to allow retyping
    setShowResult(false);
    setIsCorrect(false);
    setUserAnswer('');

    // Focus the input field
    if (translationInputRef?.current) {
      translationInputRef.current.focus();
    }
  };

  // ============ ITEM EDITING HANDLERS ============

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

      setItemData((prev) =>
        prev.map((item) => mergeIntoBaseItem(item, updatedItem))
      );
      setReviewArray((prev) =>
        prev.map((item) => mergeIntoBaseItem(item, updatedItem))
      );
      setActiveReviewArray((prev) =>
        prev.map((item) => mergeIntoBaseItem(item, updatedItem))
      );
      setTranslationArray((prev) =>
        prev.map((item) => mergeIntoQuestionItem(item, updatedItem))
      );
      setActiveTranslationArray((prev) =>
        prev.map((item) => mergeIntoQuestionItem(item, updatedItem))
      );
      setMultipleChoiceArray((prev) =>
        prev.map((item) => mergeIntoQuestionItem(item, updatedItem))
      );
      setActiveMCArray((prev) =>
        prev.map((item) => mergeIntoQuestionItem(item, updatedItem))
      );

      setEditingItem(null);
    } catch (error) {
      clientLog.error('srs.item_update_failed', {
        error: error?.message || String(error),
      });
      setEditError(error.message || 'Failed to update item');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ============ GENERAL HANDLERS ============

  const handleExit = () => {
    abortAnalyticsSession();
    router.push(`/learn/academy/sets/study/${id}`);
  };

  // ============ SRS SAVE FUNCTION ============

  const saveAllItemsToSRS = async () => {
    setIsSavingSRS(true);
    setSrsError(null);

    const errors = [];

    // Get unique UUIDs from reviewArray (one entry per item)
    for (const item of reviewArray) {
      if (!item.uuid) {
        clientLog.warn('srs.item_missing_uuid', { itemId: item.id });
        continue;
      }

      try {
        const response = await fetch(
          `/api/database/v2/srs/item/create-entry/${item.uuid}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              srs_level: 1,
              scope: 'set_srs_flow_learn_new',
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          errors.push(
            `Item ${item.uuid}: ${errorData.error || 'Failed to save'}`
          );
        }
      } catch (error) {
        errors.push(`Item ${item.uuid}: ${error.message}`);
      }
    }

    setIsSavingSRS(false);

    if (errors.length > 0) {
      setSrsError(
        `Failed to save ${errors.length} item(s) to SRS. Please try again.`
      );
      return false;
    }

    return true;
  };

  // ============ COMPUTED VALUES ============

  // Phase configuration for header
  const phases = useMemo(() => {
    const basePhases = [
      {
        id: 'review',
        name: 'Review',
        icon: FaBook,
        color: 'bg-blue-500',
        borderColor: 'border-blue-500',
      },
      {
        id: 'multiple-choice',
        name: 'Multiple Choice',
        icon: IoSparkles,
        color: 'bg-purple-500',
        borderColor: 'border-purple-500',
      },
    ];

    // Only add translation phase for non-grammar sets
    if (setType !== 'grammar') {
      basePhases.push({
        id: 'translation',
        name: 'Translation',
        icon: FaDumbbell,
        color: 'bg-brand-pink',
        borderColor: 'border-brand-pink',
      });
    }

    return basePhases;
  }, [setType]);

  const currentPhaseIndex = phases.findIndex((p) => p.id === currentPhase);
  const currentPhaseConfig = phases[currentPhaseIndex];
  const CurrentPhaseIcon = currentPhaseConfig?.icon;

  // Helper to get completed count for current phase
  const getCompletedCount = () => {
    if (currentPhase === 'review') {
      return currentIndex;
    }
    return phaseProgress[currentPhase]?.completedItems.size || 0;
  };

  // Helper to get total unique items for current phase
  const getTotalUniqueItems = () => {
    if (currentPhase === 'review') {
      return activeReviewArray.length;
    }
    return phaseProgress[currentPhase]?.totalUniqueItems || 0;
  };

  // Calculate progress percentage based on unique items completed
  const calculateProgressPercentage = () => {
    if (currentPhase === 'review') {
      // Review phase: use completed count (currentIndex represents cards reviewed)
      return activeReviewArray.length > 0
        ? (currentIndex / activeReviewArray.length) * 100
        : 0;
    }

    // MC and Translation: use unique items completed
    const completed = getCompletedCount();
    const total = getTotalUniqueItems();
    return total > 0 ? (completed / total) * 100 : 0;
  };

  // Finish analytics session when study session completes
  useEffect(() => {
    if (currentPhase === 'complete') {
      const stats = sessionStatsRef.current;
      finishAnalyticsSession(reviewArray.length);
      markSetStudied(id);
    }
  }, [currentPhase, finishAnalyticsSession, id]);

  // Shuffle multiple choice options when question changes
  // Store shuffled options to preserve their positions when showing results
  useEffect(() => {
    if (
      currentPhase === 'multiple-choice' &&
      activeMCArray[currentIndex] &&
      !showResult
    ) {
      const currentItem = activeMCArray[currentIndex];
      // Use centralized utility to shuffle options with distractors
      const shuffled = shuffleOptionsWithDistractors(currentItem);
      setCurrentShuffledOptions(shuffled);
    }
  }, [currentPhase, activeMCArray, currentIndex, showResult]);

  // Show error state
  if (error) {
    return (
      <AuthenticatedLayout sidebar="academy" title="Learn New" variant="fixed">
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
              Error Loading Set
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => router.push(`/learn/academy/sets/study/${id}`)}
              className="px-4 py-2 bg-brand-pink text-white rounded-lg hover:bg-[#c00950] transition-colors"
            >
              Back to Study Set
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      sidebar="academy"
      title={`Learn New - ${setInfo?.title || 'Study Set'}`}
      variant="gradient"
      mainClassName="p-3 sm:p-6 sm:mt-10"
    >
      {/* Loading State */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
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
              completionTitle="Lesson Complete!"
            />
          )}

          {/* Show active phase components */}
          {currentPhase !== 'complete' && (
            <>
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
                displayMode={
                  currentPhase === 'review'
                    ? 'question-count'
                    : 'completion-count'
                }
                onExit={handleExit}
              />

              {/* Review Phase */}
              {currentPhase === 'review' && activeReviewArray.length > 0 && (
                <ReviewView
                  currentCard={activeReviewArray[currentIndex]}
                  isLastCard={currentIndex === activeReviewArray.length - 1}
                  isFirstCard={currentIndex === 0}
                  onNext={handleReviewNext}
                  onPrevious={handleReviewPrevious}
                />
              )}

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

              {/* Translation Phase - Only for vocabulary sets */}
              {currentPhase === 'translation' &&
                setType !== 'grammar' &&
                activeTranslationArray.length > 0 &&
                !isSavingSRS && (
                  <div className="relative flex-1">
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
                      onEditItem={handleOpenEditItem}
                      disableKeyboardShortcuts={Boolean(editingItem)}
                    />
                  </div>
                )}

              {/* SRS Saving Loading Screen */}
              {isSavingSRS && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto"></div>
                    <p className="text-xl font-semibold text-gray-700 dark:text-white">
                      Saving your progress to SRS...
                    </p>
                    <p className="text-sm text-gray-500 dark:text-white/70">
                      Please wait while we save your items
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* SRS Error Popup */}
          <BaseModal
            isOpen={!!srsError}
            onClose={() => setSrsError(null)}
            size="md"
            blur={false}
            closeOnBackdrop={false}
            footer={
              <div className="flex space-x-3">
                <button
                  onClick={async () => {
                    setSrsError(null);
                    const success = await saveAllItemsToSRS();
                    if (success) {
                      setCurrentPhase('complete');
                      setTimeout(() => setAnimateAccuracy(true), 100);
                    }
                  }}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => setSrsError(null)}
                  className="flex-1 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            }
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Failed to Save Progress
                  </h3>
                </div>
              </div>

              <p className="text-gray-600 dark:text-white/70">{srsError}</p>
            </div>
          </BaseModal>

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
