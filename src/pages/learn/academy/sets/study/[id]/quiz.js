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
} from '@/lib/study/mcOptionGeneration';
import { transformItems } from '@/lib/study/itemTransform';
import { generateQuizItems } from '@/lib/study/translationGeneration';
import {
  buildEditableItem,
  toUpdateRequest,
  mergeIntoBaseItem,
  mergeIntoQuestionItem,
} from '@/lib/study/itemEditing';
import useAnalyticsSession from '@/hooks/useAnalyticsSession';
import useSessionState from '@/hooks/useSessionState';
import ResumeSessionModal from '@/components/Set/Features/Field-Card-Session/shared/views/ResumeSessionModal';
import ChunkCompletionView from '@/components/Set/Features/Field-Card-Session/shared/views/ChunkCompletionView';
import { clientLog } from '@/lib/clientLogger';
import { markSetStudied } from '@/lib/setActions';

export default function SetQuiz() {
  const router = useRouter();
  const { id } = router.query;

  // ============ ANALYTICS ============
  const {
    start: startAnalyticsSession,
    finish: finishAnalyticsSession,
    abort: abortAnalyticsSession, // eslint-disable-line no-unused-vars -- kept for potential future use in handleExit
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

  // ============ SESSION PERSISTENCE ============
  const sessionState = useSessionState();
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeLoadingAction, setResumeLoadingAction] = useState(null);
  const [showChunkComplete, setShowChunkComplete] = useState(false);
  const [chunkStats, setChunkStats] = useState({
    correct: 0,
    incorrect: 0,
    totalAttempts: 0,
    accuracy: 0,
  });
  const [isChunkActionLoading, setIsChunkActionLoading] = useState(false);
  const [sessionCheckDone, setSessionCheckDone] = useState(false);
  const itemUuidMapRef = useRef(new Map()); // local id -> KB uuid
  // Chunk config ref -- set immediately on create/resume, immune to React state timing
  const chunkConfigRef = useRef({
    isChunked: false,
    chunkSize: 10,
    totalChunks: 1,
    currentChunkIndex: 0,
  });
  // Stats snapshot at chunk start -- used to compute per-chunk delta
  const chunkStartStatsRef = useRef({
    correct: 0,
    incorrect: 0,
    totalAttempts: 0,
  });
  // Index into answeredItems where the current chunk started
  const chunkStartAnswerIndexRef = useRef(0);
  // Number of items already completed before resume (offsets progress bar on resume)
  const [resumeCompletedOffset, setResumeCompletedOffset] = useState(0);

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

        // Build local id -> KB UUID lookup for session persistence.
        // Map both base card IDs AND generated quiz item compound IDs (e.g., '1_eng_kana')
        // so MC/translation answer saves can resolve the KB UUID.
        transformedCards.forEach((card) =>
          itemUuidMapRef.current.set(card.id, card.uuid)
        );

        // Generate quiz items from cards
        const generatedQuizItems = generateQuizItems(transformedCards);
        generatedQuizItems.forEach((qi) => {
          if (qi.uuid) itemUuidMapRef.current.set(qi.id, qi.uuid);
        });
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

  // Check for active session on mount
  useEffect(() => {
    if (!id) return;
    sessionState.checkForActive('quiz', id).then((active) => {
      if (active && parseInt(active.items_completed) > 0) {
        setShowResumeModal(true);
      } else if (active) {
        sessionState.abandon();
      }
      setSessionCheckDone(true);
    });
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

  // Finish analytics + close session state when quiz completes
  useEffect(() => {
    if (quizCompleted) {
      const stats = sessionStatsRef.current;
      finishAnalyticsSession(quizItems.length, stats.correct);
      markSetStudied(id);
      sessionState.abandon(); // close session so resume modal won't reappear
    }
  }, [quizCompleted, finishAnalyticsSession, id]);

  // Function to initialize multiple choice questions
  // Get the cards for a given chunk (reads from ref, immune to stale React state)
  const getChunkCards = (chunkIndex) => {
    const cc = chunkConfigRef.current;
    if (!cc.isChunked) return cardsData;
    const start = chunkIndex * cc.chunkSize;
    const end = Math.min(start + cc.chunkSize, cardsData.length);
    return cardsData.slice(start, end);
  };

  // Set up phase arrays for a given set of cards
  const setupPhaseArrays = (cards) => {
    const chunkQuizItems = shuffleArray(generateQuizItems(cards));
    setQuizItems(chunkQuizItems);
    setReviewItems(cards);
    // Generate MC from chunk items, but use full cardsData as distractor pool
    const allQuizItems = generateQuizItems(cardsData);
    const mcQuestions = chunkQuizItems.map((item) => ({
      ...item,
      options: generateOptionsFromQuizItems(item, allQuizItems),
    }));
    setMultipleChoiceItems(shuffleArray(mcQuestions));
    // Reset item stats for these items
    const stats = {};
    chunkQuizItems.forEach((item) => {
      stats[item.id] = { passed: 0, failed: 0, attempts: 0 };
    });
    setItemStats(stats);
  };

  // Handle mode selection
  const handleModeSelect = async (mode) => {
    startAnalyticsSession();

    // Create session state FIRST so we know if it's chunked
    let createResult = null;
    try {
      const sessionItems = cardsData.map((i) => ({ itemId: i.uuid }));
      createResult = await sessionState.create(
        'quiz',
        id,
        sessionItems,
        {
          quiz_mode: mode,
          quiz_type: setType === 'grammar' ? mode : undefined,
        },
        10
      );
    } catch (e) {
      clientLog.error('session_state.create_failed', { error: e?.message });
    }

    // Set chunk config ref IMMEDIATELY from create result (before any React state updates)
    if (createResult) {
      chunkConfigRef.current = {
        isChunked: createResult.isChunked === true,
        chunkSize: 10,
        totalChunks: createResult.totalChunks || 1,
        currentChunkIndex: 0,
      };
    }

    // Determine chunk 0 cards (reads from ref, not stale chunkInfo)
    const chunkCards = getChunkCards(0);

    // Set up phase arrays from chunk cards
    setupPhaseArrays(chunkCards);

    // Determine the starting phase and persist it immediately so resume
    // lands on the right phase even if the user closes before answering.
    let startPhase;
    if (setType === 'grammar') {
      setQuizType(mode);
      startPhase = mode === 'with-review' ? 'review' : 'multiple-choice';
    } else {
      setQuizMode(mode);
      startPhase =
        mode === 'practice'
          ? 'translation'
          : mode === 'new'
            ? 'multiple-choice'
            : 'review';
    }
    setCurrentPhase(startPhase);
    sessionState.saveNow({ currentPhase: startPhase, currentIndex: 0 });

    setModeSelectionComplete(true);
  };

  // Handle phase completion and transition.
  // Persists the new phase + completedPhases immediately so closing the tab
  // between phases doesn't leave stale state (Bug #3 / #6).
  const handlePhaseComplete = () => {
    const newCompletedPhases = [...completedPhases, currentPhase];
    setCompletedPhases(newCompletedPhases);

    // Determine the next phase
    let nextPhase = null;

    if (setType === 'grammar') {
      if (quizType === 'with-review' && currentPhase === 'review') {
        nextPhase = 'multiple-choice';
      } else if (quizType === 'mc-only' && currentPhase === 'multiple-choice') {
        nextPhase = null; // complete
      } else if (
        quizType === 'with-review' &&
        currentPhase === 'multiple-choice'
      ) {
        nextPhase = null; // complete
      }
    } else {
      if (quizMode === 'completely-new') {
        if (currentPhase === 'review') nextPhase = 'multiple-choice';
        else if (currentPhase === 'multiple-choice') nextPhase = 'translation';
      } else if (quizMode === 'new') {
        if (currentPhase === 'multiple-choice') nextPhase = 'translation';
      }
      // practice mode and final phases fall through to null (complete)
    }

    if (nextPhase) {
      setCurrentPhase(nextPhase);
      setCurrentIndex(0);
      // Clear resume offset so it doesn't bleed into the next phase's progress display
      setResumeCompletedOffset(0);

      // Persist phase transition immediately so resume lands on the right phase
      const phasesObj = {};
      newCompletedPhases.forEach((p) => {
        phasesObj[p] = true;
      });
      sessionState.saveNow({
        currentPhase: nextPhase,
        currentIndex: 0,
        completedPhases: phasesObj,
      });
    } else {
      completeSessionOrChunk();
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
        nearMiss: (prev.nearMiss || 0) + (answerData.isNearMiss ? 1 : 0),
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

      // Persist to session state (debounced)
      const kbUuid =
        itemUuidMapRef.current.get(answerData.itemId) || answerData.uuid;
      if (kbUuid) {
        const newAttempts = sessionStatsRef.current.totalAttempts + 1;
        sessionState.save(
          {
            currentIndex: currentIndex + 1,
            statsCorrect: answerData.isCorrect
              ? sessionStatsRef.current.correct + 1
              : sessionStatsRef.current.correct,
            statsIncorrect: answerData.isCorrect
              ? sessionStatsRef.current.incorrect
              : sessionStatsRef.current.incorrect + 1,
            statsAttempts: newAttempts,
            itemsCompleted: newAttempts,
            currentPhase,
          },
          [{ itemId: kbUuid, correct: answerData.isCorrect }]
        );
      }
    },
    [currentPhase, currentIndex, sessionState]
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

  // Handle quiz retry -- create a fresh session so persistence works
  const handleRetry = async () => {
    // Abandon the old session (may already be abandoned from completion)
    await sessionState.abandon();

    // Create a fresh session for the retry
    try {
      const sessionItems = cardsData.map((i) => ({ itemId: i.uuid }));
      const createResult = await sessionState.create(
        'quiz',
        id,
        sessionItems,
        {
          quiz_mode: quizMode || quizType,
          quiz_type: setType === 'grammar' ? quizType || quizMode : undefined,
        },
        chunkConfigRef.current.chunkSize
      );

      if (createResult) {
        chunkConfigRef.current = {
          isChunked: createResult.isChunked === true,
          chunkSize: chunkConfigRef.current.chunkSize,
          totalChunks: createResult.totalChunks || 1,
          currentChunkIndex: 0,
        };
      }
    } catch (e) {
      clientLog.error('session_state.retry_create_failed', {
        error: e?.message,
      });
    }

    startAnalyticsSession();
    chunkStartStatsRef.current = { correct: 0, incorrect: 0, totalAttempts: 0 };
    setQuizCompleted(false);
    setCurrentIndex(0);
    setAnsweredItems([]);
    setResumeCompletedOffset(0);
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

    // Regenerate phase arrays from chunk 0 (retry always starts from the beginning)
    const chunkCards = getChunkCards(0);
    setupPhaseArrays(chunkCards);

    // Restart from first phase of selected mode
    if (setType === 'grammar') {
      if (quizType === 'with-review') {
        setCurrentPhase('review');
      } else if (quizType === 'mc-only') {
        setCurrentPhase('multiple-choice');
      }
    } else {
      if (quizMode === 'practice') {
        setCurrentPhase('translation');
      } else if (quizMode === 'new') {
        setCurrentPhase('multiple-choice');
      } else if (quizMode === 'completely-new') {
        setCurrentPhase('review');
      }
    }
  };

  // Chunk-aware completion: show ChunkCompletionView between chunks, SummaryView on final
  const completeSessionOrChunk = () => {
    const cc = chunkConfigRef.current;
    if (cc.isChunked && cc.currentChunkIndex < cc.totalChunks - 1) {
      // Compute per-chunk stats (delta from chunk start snapshot)
      const start = chunkStartStatsRef.current;
      const chunkCorrect = sessionStats.correct - start.correct;
      const chunkIncorrect = sessionStats.incorrect - start.incorrect;
      const chunkTotal = chunkCorrect + chunkIncorrect;
      setChunkStats({
        correct: chunkCorrect,
        incorrect: chunkIncorrect,
        totalAttempts: chunkTotal,
        accuracy:
          chunkTotal > 0 ? Math.round((chunkCorrect / chunkTotal) * 100) : 0,
      });
      setShowChunkComplete(true);
    } else {
      setQuizCompleted(true);
    }
  };

  // Handle exit -- leave analytics session initiated for potential resume
  const handleExit = () => {
    router.push(`/learn/academy/sets/study/${id}`);
  };

  // ============ SESSION PERSISTENCE HANDLERS ============

  const handleResume = async () => {
    setResumeLoadingAction('resume');
    try {
      const full = await sessionState.fetchFullState();
      if (!full) {
        setResumeLoadingAction(null);
        return;
      }
      const { state, items } = full;

      // Set chunk config ref from DB state (NOT from stale chunkInfo)
      const isChunked = state.is_chunked === 'true';
      const chunkSize = parseInt(state.chunk_size) || 25;
      const totalChunks = parseInt(state.total_chunks) || 1;
      const currentChunkIndex = parseInt(state.current_chunk_index) || 0;
      chunkConfigRef.current = {
        isChunked,
        chunkSize,
        totalChunks,
        currentChunkIndex,
      };

      // Build set of completed KB UUIDs from session items
      const completedUuids = new Set(
        items.filter((i) => i.completed === 'true').map((i) => i.item_id)
      );

      // Set up phase arrays for the current chunk, filtering out completed items
      const chunkCards = isChunked
        ? cardsData.slice(
            currentChunkIndex * chunkSize,
            Math.min((currentChunkIndex + 1) * chunkSize, cardsData.length)
          )
        : cardsData;

      // Generate arrays then immediately filter — do NOT use setupPhaseArrays
      // (which sets state twice causing potential batching issues in async context)
      const allQuizItemsForPool = generateQuizItems(cardsData);
      const chunkQuizItems = shuffleArray(generateQuizItems(chunkCards));
      const mcQuestions = chunkQuizItems.map((item) => ({
        ...item,
        options: generateOptionsFromQuizItems(item, allQuizItemsForPool),
      }));

      // Set up phase arrays for resume. Items share UUIDs across phases (the same
      // base item appears in review, MC, and translation), so filtering by completedUuids
      // would incorrectly empty later phases. Instead: if review is done, clear its array;
      // MC/translation arrays start fresh (reshuffled, so index-based resume is impossible anyway).
      const restoredPhase = state.current_phase || 'review';
      const reviewDone = Object.keys(state).some(
        (k) => k === 'completed_phase.review' && state[k] === 'true'
      );

      if (restoredPhase === 'review' && completedUuids.size > 0) {
        // Resuming mid-review: filter out already-seen review cards
        setReviewItems(chunkCards.filter((c) => !completedUuids.has(c.uuid)));
      } else if (reviewDone) {
        setReviewItems([]); // review is done
      } else {
        setReviewItems(chunkCards);
      }
      // MC and translation arrays are always full (reshuffled on load)
      setQuizItems(chunkQuizItems);
      setMultipleChoiceItems(shuffleArray(mcQuestions));

      // Reset item stats
      const stats = {};
      chunkQuizItems.forEach((item) => {
        stats[item.id] = { passed: 0, failed: 0, attempts: 0 };
      });
      setItemStats(stats);

      // Restore aggregate stats
      const correct = parseInt(state.stats_correct) || 0;
      const incorrect = parseInt(state.stats_incorrect) || 0;
      const total = correct + incorrect;
      setSessionStats({
        correct,
        incorrect,
        totalAttempts: total,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      });

      // Snapshot cumulative stats as chunk baseline so per-chunk delta is correct
      chunkStartStatsRef.current = { correct, incorrect, totalAttempts: total };

      // Restore phase & mode (skip mode selection)
      setCurrentPhase(restoredPhase);
      setQuizMode(state.quiz_mode || null);
      setQuizType(state.quiz_type || null);
      setModeSelectionComplete(true);

      // Restore index and progress offset based on phase:
      // - Review: index=0 (filtered array), offset=completedUuids for card display
      // - MC/Translation: index=savedIndex (full array, reshuffled), offset=0
      const savedIndex = parseInt(state.current_index) || 0;
      if (restoredPhase === 'review') {
        setCurrentIndex(0);
        setResumeCompletedOffset(completedUuids.size);
      } else {
        setCurrentIndex(savedIndex);
        setResumeCompletedOffset(0);
        // Pre-seed completedItems for the restored phase so the progress bar
        // reflects items already answered (items 0..savedIndex-1 in the array).
        // Use placeholder IDs since the actual question IDs from the previous
        // session don't match the reshuffled array.
        setCompletedItems((prev) => {
          const seeded = new Set();
          for (let i = 0; i < savedIndex; i++) seeded.add(`resumed_${i}`);
          return { ...prev, [restoredPhase]: seeded };
        });
      }

      // Restore completed phases from DB
      const restoredCompletedPhases = Object.keys(state)
        .filter((k) => k.startsWith('completed_phase.') && state[k] === 'true')
        .map((k) => k.replace('completed_phase.', ''));
      setCompletedPhases(restoredCompletedPhases);

      // Rebuild answered items from session items
      const answeredFromDB = items
        .filter((i) => i.completed === 'true')
        .map((i) => ({ itemId: i.item_id, isCorrect: i.correct === 'true' }));
      setAnsweredItems(answeredFromDB);

      // Reinitiate analytics session
      if (state.analytics_session_id) {
        try {
          await fetch(
            `/api/analytics/user/sessions/${state.analytics_session_id}/reinitiate`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' } }
          );
        } catch {
          /* ignore */
        }
      }
      startAnalyticsSession();

      // Check if user was at a chunk completion boundary
      // (chunks_completed > current_chunk_index means a chunk was finished but not advanced)
      if (isChunked) {
        const chunksCompleted = parseInt(state.chunks_completed) || 0;
        if (
          chunksCompleted > currentChunkIndex &&
          currentChunkIndex < totalChunks - 1
        ) {
          setChunkStats({
            correct,
            incorrect,
            totalAttempts: total,
            accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
          });
          setShowChunkComplete(true);
        }
      }

      setShowResumeModal(false);
    } catch (e) {
      clientLog.error('session_state.resume_failed', { error: e?.message });
    }
    setResumeLoadingAction(null);
  };

  const handleStartFresh = async () => {
    setResumeLoadingAction('startFresh');
    await sessionState.abandon();
    setShowResumeModal(false);
    setResumeLoadingAction(null);
  };

  const handleSaveAndExit = async () => {
    setIsChunkActionLoading(true);
    await sessionState.saveNow({
      currentIndex,
      statsCorrect: sessionStats.correct,
      statsIncorrect: sessionStats.incorrect,
      statsAttempts: sessionStats.totalAttempts,
      itemsCompleted: answeredItems.length,
      currentPhase,
    });
    router.push(`/learn/academy/sets/study/${id}`);
  };

  const handleContinueChunk = async () => {
    setIsChunkActionLoading(true);
    // Read from ref (always current)
    const cc = chunkConfigRef.current;
    const chunkSize = cc.chunkSize;
    const newChunkIndex = cc.currentChunkIndex + 1;

    // Update ref immediately
    chunkConfigRef.current = { ...cc, currentChunkIndex: newChunkIndex };

    // Finish current analytics session
    finishAnalyticsSession(chunkStats.totalAttempts, chunkStats.correct);

    // Start new analytics session
    startAnalyticsSession();

    await sessionState.advanceChunk(null);

    // Regenerate phase arrays for new chunk
    const newStart = newChunkIndex * chunkSize;
    const newEnd = Math.min(newStart + chunkSize, cardsData.length);
    const newChunkCards = cardsData.slice(newStart, newEnd);
    setupPhaseArrays(newChunkCards);

    // Snapshot current cumulative stats as the new chunk's baseline
    chunkStartStatsRef.current = {
      correct: sessionStats.correct,
      incorrect: sessionStats.incorrect,
      totalAttempts: sessionStats.totalAttempts,
    };
    // Snapshot answeredItems length so we slice from the right place for the next chunk
    chunkStartAnswerIndexRef.current = answeredItems.length;

    // Reset local state for new chunk
    setShowChunkComplete(false);
    setChunkStats({ correct: 0, incorrect: 0, totalAttempts: 0, accuracy: 0 });
    setCurrentIndex(0);
    setCurrentPhase(
      quizMode === 'practice'
        ? 'translation'
        : quizMode === 'new' || quizType === 'mc-only'
          ? 'multiple-choice'
          : 'review'
    );
    setCompletedPhases([]);
    setCompletedItems({
      review: new Set(),
      'multiple-choice': new Set(),
      translation: new Set(),
    });
    setAnsweredItems((prev) => [...prev]); // Keep previous chunks' answers for overall stats
    setIsChunkActionLoading(false);
    setResumeCompletedOffset(0);
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
        sidebar={false}
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
      sidebar={false}
      title={`Quiz • ${setInfo?.title || 'Study Set'}`}
      variant="gradient"
      mainClassName="p-3 sm:p-6 sm:mt-10"
    >
      {/* Resume Session Modal */}
      <ResumeSessionModal
        isOpen={showResumeModal}
        sessionState={sessionState.activeSession}
        loadingAction={resumeLoadingAction}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
        onCancel={() => {
          setShowResumeModal(false);
          router.push(`/learn/academy/sets/study/${id}`);
        }}
      />

      {/* Loading State (wait for both data fetch and session check) */}
      {isLoading || !sessionCheckDone ? (
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
              currentIndex={currentIndex + resumeCompletedOffset}
              totalQuestions={getCurrentItems().length + resumeCompletedOffset}
              currentPhase={currentPhase}
              quizMode={quizMode}
              quizType={quizType}
              completedPhases={completedPhases}
              completedCount={
                (completedItems[currentPhase]?.size || 0) +
                resumeCompletedOffset
              }
              chunkInfo={sessionState.chunkInfo}
              itemsCompleted={answeredItems.length}
              onExit={handleExit}
            />
          )}

          {/* Main Quiz Area */}
          {showChunkComplete ? (
            <ChunkCompletionView
              chunkNumber={(sessionState.chunkInfo?.currentChunkIndex || 0) + 1}
              totalChunks={sessionState.chunkInfo?.totalChunks || 1}
              chunkStats={chunkStats}
              overallStats={{
                ...sessionStats,
                itemsCompleted: answeredItems.length,
                totalItems: cardsData.length,
              }}
              chunkAnsweredItems={answeredItems
                .slice(chunkStartAnswerIndexRef.current)
                .map((a) => ({
                  question:
                    a.question || a.english || a.kana || a.itemId || 'Item',
                  answer: a.answer || a.correctAnswer || '',
                  userAnswer: a.userAnswer || '',
                  isCorrect: a.isCorrect,
                  isNearMiss: a.isNearMiss || false,
                }))}
              onContinue={handleContinueChunk}
              onSaveAndExit={handleSaveAndExit}
              isLoading={isChunkActionLoading}
            />
          ) : quizCompleted ? (
            <SummaryView
              sessionStats={sessionStats}
              answeredItems={answeredItems}
              animateAccuracy={animateAccuracy}
              onRetry={handleRetry}
              onBackToSet={handleExit}
              completionTitle="Quiz Complete"
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
                // Persist review progress (debounced) — mark card as seen.
                // Persist review progress (debounced)
                const reviewCard = reviewItems[currentIndex];
                sessionState.save(
                  {
                    currentIndex: currentIndex + 1,
                    itemsCompleted: currentIndex + 1,
                    currentPhase: 'review',
                  },
                  [{ itemId: reviewCard?.uuid, correct: true }]
                );
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
                completeSessionOrChunk();
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
