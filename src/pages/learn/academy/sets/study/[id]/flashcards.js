// pages/learn/academy/sets/study/[id]/flashcards.js
import AuthenticatedLayout from '@/components/ui/AuthenticatedLayout';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import {
  FaArrowLeft,
  FaArrowRight,
  FaTimes,
  FaRedo,
  FaCheckCircle,
  FaTimesCircle,
  FaVolumeUp,
  FaBrain,
} from 'react-icons/fa';
import KeyboardShortcutHint from '../../../../../../components/Set/Features/Field-Card-Session/shared/views/KeyboardShortcutHint';
import { TbCards, TbX } from 'react-icons/tb';
import { MdFlip } from 'react-icons/md';
import { FiEdit2 } from 'react-icons/fi';
import useAnalyticsSession from '@/hooks/useAnalyticsSession';
import ItemEditModal from '@/components/Set/Features/Field-Card-Session/shared/views/ItemEditModal.jsx';
import {
  buildEditableItem,
  toUpdateRequest,
  mergeIntoBaseItem,
} from '@/components/Set/Features/Field-Card-Session/shared/controllers/utils/itemEditing';
import { clientLog } from '@/lib/clientLogger';

export default function SetFlashcards() {
  const router = useRouter();
  const { id } = router.query;

  const [cardsData, setCardsData] = useState([]);
  const [setInfo, setSetInfo] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Item editing states
  const [editingItem, setEditingItem] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  // Card states
  const [isFront, setIsFront] = useState(true);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [transitionState, setTransitionState] = useState('idle');

  // Study session stats
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    totalTime: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  // Card confidence levels
  const [cardConfidence, setCardConfidence] = useState({});

  // ============ ANALYTICS ============
  const {
    start: startAnalyticsSession,
    finish: finishAnalyticsSession,
    abort: abortAnalyticsSession,
  } = useAnalyticsSession('flashcards');
  const currentIndexRef = useRef(0);

  const markSetStudied = async (setId) => {
    try {
      await fetch('/api/database/v2/sets/update-from-full-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'set',
          entityId: setId,
          updates: { last_studied: new Date().toISOString() },
        }),
      });
    } catch (err) {
      clientLog.error('set.mark_studied_failed', {
        error: err?.message || String(err),
      });
    }
  };

  // Study mode
  const [studyMode, setStudyMode] = useState('plain'); // plain, quiz, interval

  const SLIDE_DURATION = 150;

  const transitionClasses = {
    idle: 'transition-transform duration-150 ease-out translate-x-0',
    'slide-out-left':
      'transition-transform duration-150 ease-out -translate-x-full',
    'slide-out-right':
      'transition-transform duration-150 ease-out translate-x-full',
    // Instant positioning (no transition) before sliding in
    'enter-from-right': 'translate-x-full',
    'enter-from-left': '-translate-x-full',
  };

  // Keep currentIndexRef in sync for use in analytics finish (avoids stale closure)
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // ----- Fetch Data from API -----
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

        // Transform items to flashcard format
        const transformedCards = Array.isArray(setItemsAPI)
          ? setItemsAPI
              .map((item, index) => {
                if (item.type === 'vocab' || item.type === 'vocabulary') {
                  return {
                    id: index + 1,
                    uuid: item.id,
                    type: 'vocabulary',
                    front: item.english || '',
                    back: `${item.kana || ''}${item.kanji ? ` (${item.kanji})` : ''}`,
                    kana: item.kana || '',
                    kanji: item.kanji || '',
                    english: item.english || '',
                    lexical_category: item.lexical_category || '',
                    example_sentences: Array.isArray(item.example_sentences)
                      ? item.example_sentences
                      : [item.example_sentences].filter(Boolean),
                    // Initialize interval data
                    interval: 1,
                    easeFactor: 2.5,
                    repetitions: 0,
                    lastReviewed: null,
                  };
                } else if (item.type === 'grammar') {
                  return {
                    id: index + 1,
                    uuid: item.id,
                    type: 'grammar',
                    front: item.title || '',
                    back: item.description || '',
                    title: item.title || '',
                    description: item.description || '',
                    topic: item.topic || '',
                    example_sentences: Array.isArray(item.example_sentences)
                      ? item.example_sentences.map((ex) =>
                          typeof ex === 'string'
                            ? ex
                            : `${ex.japanese || ''} (${ex.english || ''})`
                        )
                      : [],
                    // Initialize interval data
                    interval: 1,
                    easeFactor: 2.5,
                    repetitions: 0,
                    lastReviewed: null,
                  };
                }
                return null;
              })
              .filter(Boolean)
          : [];

        if (transformedCards.length === 0) {
          throw new Error('This set has no items to study');
        }

        setCardsData(transformedCards);
      } catch (err) {
        clientLog.error('flashcards.set_fetch_failed', {
          error: err?.message || String(err),
        });
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetData();
  }, [id]);

  // Start analytics session when card data is ready
  useEffect(() => {
    if (cardsData.length > 0) {
      startAnalyticsSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsData.length]);

  const handleFlip = useCallback(() => {
    setShouldAnimate(true);
    setIsFront((prev) => !prev);
  }, []);

  const slideCard = useCallback(
    (outDir, newIndex) => {
      // Phase 1: slide current card out
      setTransitionState(
        outDir === 'left' ? 'slide-out-left' : 'slide-out-right'
      );
      setTimeout(() => {
        // Phase 2: instantly reposition offscreen on opposite side, swap content
        setShouldAnimate(false);
        setIsFront(true);
        setCurrentIndex(newIndex);
        setTransitionState(
          outDir === 'left' ? 'enter-from-right' : 'enter-from-left'
        );
        // Phase 3: slide in (next frame so browser registers the position)
        requestAnimationFrame(() => {
          setTransitionState('idle');
        });
      }, SLIDE_DURATION);
    },
    [SLIDE_DURATION]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < cardsData.length - 1) {
      slideCard('left', currentIndex + 1);
    }
  }, [currentIndex, cardsData.length, slideCard]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      slideCard('right', currentIndex - 1);
    }
  }, [currentIndex, slideCard]);

  const handleOpenEditItem = useCallback(() => {
    const currentCard = cardsData[currentIndex];
    if (!currentCard) return;
    const editable = buildEditableItem(currentCard);
    if (!editable) {
      setEditError('This item cannot be edited right now.');
      return;
    }
    setEditError(null);
    setEditingItem(editable);
  }, [cardsData, currentIndex]);

  const handleCloseEditItem = useCallback(() => {
    if (isSavingEdit) return;
    setEditingItem(null);
    setEditError(null);
  }, [isSavingEdit]);

  const handleSaveEditedItem = useCallback(async (updatedItem) => {
    setIsSavingEdit(true);
    setEditError(null);
    try {
      const request = toUpdateRequest(updatedItem);
      const response = await fetch(
        '/api/database/v2/sets/update-from-full-set',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update item');
      }
      // Update cards data and recompute front/back
      setCardsData((prev) =>
        prev.map((card) => {
          const merged = mergeIntoBaseItem(card, updatedItem);
          if (merged !== card) {
            // Recompute front/back from updated fields
            if (merged.type === 'vocabulary') {
              merged.front = merged.english || '';
              merged.back = `${merged.kana || ''}${merged.kanji ? ` (${merged.kanji})` : ''}`;
            } else if (merged.type === 'grammar') {
              merged.front = merged.title || '';
              merged.back = merged.description || '';
            }
          }
          return merged;
        })
      );
      setEditingItem(null);
    } catch (err) {
      clientLog.error('flashcards.item_update_failed', {
        error: err?.message || String(err),
      });
      setEditError(err.message || 'Failed to update item');
    } finally {
      setIsSavingEdit(false);
    }
  }, []);

  const handleExit = useCallback(() => {
    abortAnalyticsSession();
    router.push(`/learn/academy/sets/study/${id}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, id]);

  const handleFinishSession = useCallback(() => {
    finishAnalyticsSession(currentIndexRef.current + 1);
    markSetStudied(id);
    router.push(`/learn/academy/sets/study/${id}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, id]);

  const markCard = useCallback(
    (confidence) => {
      setCardConfidence((prev) => ({
        ...prev,
        [currentIndex]: confidence,
      }));

      if (confidence === 'known') {
        setSessionStats((prev) => ({ ...prev, correct: prev.correct + 1 }));
      } else if (confidence === 'unknown') {
        setSessionStats((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
      }

      setTimeout(() => {
        if (currentIndex < cardsData.length - 1) {
          handleNext();
        }
      }, 500);
    },
    [currentIndex, cardsData.length, handleNext]
  );

  const handleIntervalResponse = useCallback(
    (difficulty) => {
      setSessionStats((prev) => ({
        ...prev,
        [difficulty]: prev[difficulty] + 1,
      }));

      setCardConfidence((prev) => ({
        ...prev,
        [currentIndex]: difficulty,
      }));

      setCardsData((prevCards) => {
        const updatedCards = [...prevCards];
        const currentCard = updatedCards[currentIndex];

        switch (difficulty) {
          case 'again':
            currentCard.interval = 1;
            currentCard.repetitions = 0;
            break;
          case 'hard':
            currentCard.interval = Math.max(1, currentCard.interval * 1.2);
            break;
          case 'good':
            currentCard.interval = currentCard.interval * 2.5;
            currentCard.repetitions += 1;
            break;
          case 'easy':
            currentCard.interval = currentCard.interval * 3.5;
            currentCard.repetitions += 1;
            break;
        }

        currentCard.lastReviewed = new Date();
        return updatedCards;
      });

      setTimeout(() => {
        if (currentIndex < cardsData.length - 1) {
          handleNext();
        }
      }, 500);
    },
    [currentIndex, cardsData.length, handleNext]
  );

  // Touch swipe handling
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchCurrentX = useRef(null);
  const cardContainerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchCurrentX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartX.current) return;
    touchCurrentX.current = e.targetTouches[0].clientX;

    // Check if horizontal swipe is dominant (prevent hijacking vertical scroll)
    const dx = Math.abs(touchCurrentX.current - touchStartX.current);
    const dy = Math.abs(e.targetTouches[0].clientY - touchStartY.current);
    if (dy > dx) return; // vertical scroll, ignore

    const diff = touchCurrentX.current - touchStartX.current;
    const capped = Math.max(-80, Math.min(80, diff));

    if (cardContainerRef.current) {
      cardContainerRef.current.style.transform = `translateX(${capped}px) rotate(${capped * 0.02}deg)`;
      cardContainerRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchCurrentX.current) return;

    const diff = touchCurrentX.current - touchStartX.current;

    // Reset visual state
    if (cardContainerRef.current) {
      cardContainerRef.current.style.transform = '';
      cardContainerRef.current.style.transition = '';
    }

    if (Math.abs(diff) >= 60) {
      if (diff < 0)
        handleNext(); // swipe left = next
      else handlePrevious(); // swipe right = previous
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchCurrentX.current = null;
  }, [handleNext, handlePrevious]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (studyMode === 'interval' && !isFront) {
        if (e.key === '1') handleIntervalResponse('again');
        if (e.key === '2') handleIntervalResponse('hard');
        if (e.key === '3') handleIntervalResponse('good');
        if (e.key === '4') handleIntervalResponse('easy');
      }
    },
    [
      handleFlip,
      handleNext,
      handlePrevious,
      handleIntervalResponse,
      studyMode,
      isFront,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const progress =
    cardsData.length > 0 ? (currentIndex / cardsData.length) * 100 : 0;
  const isLastCard = currentIndex === cardsData.length - 1;

  const container3DStyles = {
    perspective: '1000px',
    perspectiveOrigin: 'center center',
  };

  const flipCardStyles = {
    transform: isFront ? 'rotateY(0deg)' : 'rotateY(180deg)',
    transformStyle: 'preserve-3d',
    transition: shouldAnimate
      ? 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)'
      : 'none',
    width: '100%',
    height: '100%',
    position: 'relative',
  };

  const sideBaseStyles = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    borderRadius: '1rem',
  };

  const getConfidenceColor = (confidence) => {
    if (studyMode === 'interval') {
      switch (confidence) {
        case 'again':
          return 'bg-red-400';
        case 'hard':
          return 'bg-orange-400';
        case 'good':
          return 'bg-blue-400';
        case 'easy':
          return 'bg-green-400';
        default:
          return null;
      }
    } else {
      return confidence === 'known'
        ? 'bg-green-400'
        : confidence === 'unknown'
          ? 'bg-red-400'
          : 'bg-yellow-400';
    }
  };

  // Show error state
  if (error) {
    return (
      <AuthenticatedLayout
        sidebar="academy"
        title="Error Loading Flashcards"
        variant="fixed"
        mainClassName="px-4 sm:px-6 py-4 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
            Error Loading Flashcards
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
      title={`Flashcards • ${setInfo?.title || 'Study Set'}`}
      variant="gradient"
      mainClassName="p-6 overflow-x-hidden sm:mt-10"
    >
      {/* Header */}
      <div className="w-full max-w-5xl mx-auto mb-6 sm:mb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleExit}
              className="p-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
              aria-label="Exit"
            >
              <TbX className="w-6 h-6 text-gray-700 dark:text-white" />
            </button>

            <div className="flex items-center gap-2">
              <TbCards className="text-brand-pink text-xl" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {setInfo?.title || 'Flashcards'}
              </h1>
            </div>
          </div>

          {/* Study Mode Selector */}
          <div className="hidden md:flex items-center gap-2 bg-gray-200 dark:bg-white/10 rounded-lg p-1 px-1">
            <button
              onClick={() => setStudyMode('plain')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                studyMode === 'plain'
                  ? 'bg-brand-pink text-white'
                  : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Plain Cards
            </button>
            {/*<button
                onClick={() => setStudyMode('quiz')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  studyMode === 'quiz' 
                    ? 'bg-brand-pink text-white' 
                    : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Quiz
              </button>*/}
            {/*<button
                onClick={() => setStudyMode('interval')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  studyMode === 'interval' 
                    ? 'bg-brand-pink text-white' 
                    : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Interval
              </button>*/}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-white/70 mb-2">
            <span>
              Card {currentIndex + 1} of {cardsData.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-pink to-brand-pink-hover transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Card Area */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center sm:mb-10">
          <div className="w-full max-w-3xl space-y-6">
            {/* Stats bar skeleton */}
            <div className="flex items-center justify-center gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                    style={{ animationDelay: `${i * 60}ms` }}
                  />
                  <div
                    className="h-3 w-14 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                    style={{ animationDelay: `${i * 60 + 30}ms` }}
                  />
                </div>
              ))}
            </div>
            {/* Card skeleton */}
            <div className="w-full aspect-[3/2] max-w-xl mx-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-surface-card shadow-sm">
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                <div
                  className="h-8 w-32 rounded-lg bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                  style={{ animationDelay: '100ms' }}
                />
                <div
                  className="h-5 w-48 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="h-4 w-24 rounded bg-black/[0.03] dark:bg-white/[0.03] animate-pulse"
                  style={{ animationDelay: '200ms' }}
                />
              </div>
            </div>
            {/* Nav dots skeleton */}
            <div className="flex items-center justify-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                  style={{ animationDelay: `${i * 40 + 250}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : cardsData.length > 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-3xl">
            {/* Stats Bar */}
            <div className="flex items-center justify-center gap-6 mb-6">
              {studyMode === 'quiz' ? (
                <>
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-500" />
                    <span className="text-gray-600 dark:text-white/70 text-sm">
                      Known: {sessionStats.correct}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaTimesCircle className="text-red-500" />
                    <span className="text-gray-600 dark:text-white/70 text-sm">
                      Learning: {sessionStats.incorrect}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaRedo className="text-yellow-500" />
                    <span className="text-gray-600 dark:text-white/70 text-sm">
                      Skipped: {sessionStats.skipped}
                    </span>
                  </div>
                </>
              ) : studyMode === 'interval' ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <span className="text-xs font-medium text-red-700 dark:text-red-400">
                      Again: {sessionStats.again}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                      Hard: {sessionStats.hard}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                      Good: {sessionStats.good}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">
                      Easy: {sessionStats.easy}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-gray-600 dark:text-white/70 text-sm"></div>
              )}
            </div>

            {/* Card Container — swipeable */}
            <div
              className="relative w-full h-96 mb-8 touch-pan-y"
              style={container3DStyles}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                ref={cardContainerRef}
                className={`absolute w-full h-full ${transitionClasses[transitionState]}`}
                style={{ willChange: 'transform' }}
              >
                <div
                  style={flipCardStyles}
                  onClick={handleFlip}
                  className="cursor-pointer"
                >
                  {/* Front Side */}
                  <div
                    style={{
                      ...sideBaseStyles,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    }}
                    className="relative bg-white dark:bg-white/10 border-2 border-blue-200 dark:border-blue-500/30 overflow-hidden"
                  >
                    {/* Top accent strip */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 to-indigo-500" />

                    {/* Edit button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditItem();
                      }}
                      className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/20 hover:text-gray-700 dark:hover:text-white/80 transition-colors z-10"
                      title="Edit Item"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>

                    {cardConfidence[currentIndex] && (
                      <div
                        className={`absolute top-4 right-14 w-3 h-3 rounded-full ${getConfidenceColor(
                          cardConfidence[currentIndex]
                        )}`}
                      />
                    )}

                    <p className="text-3xl md:text-4xl lg:text-5xl font-medium px-8 text-center text-gray-900 dark:text-white">
                      {cardsData[currentIndex].front}
                    </p>

                    {cardsData[currentIndex].type === 'vocabulary' &&
                      cardsData[currentIndex].lexical_category && (
                        <span className="mt-4 px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {cardsData[currentIndex].lexical_category}
                        </span>
                      )}

                    <div className="absolute bottom-6 text-gray-400 dark:text-white/40 text-sm">
                      <span className="hidden sm:inline">
                        Click or press Space to flip
                      </span>
                      <span className="sm:hidden">
                        Tap to flip · Swipe to navigate
                      </span>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div
                    style={{
                      ...sideBaseStyles,
                      transform: 'rotateY(180deg)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    }}
                    className="relative p-8 bg-white dark:bg-white/10 border-2 border-rose-200 dark:border-rose-500/30 overflow-hidden"
                  >
                    {/* Top accent strip */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-400 to-pink-500" />

                    {/* Edit button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditItem();
                      }}
                      className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50 hover:bg-gray-200 dark:hover:bg-white/20 hover:text-gray-700 dark:hover:text-white/80 transition-colors z-10"
                      title="Edit Item"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>

                    <p className="text-3xl md:text-4xl lg:text-5xl font-medium text-center text-gray-900 dark:text-white mb-4">
                      {cardsData[currentIndex].back}
                    </p>

                    {cardsData[currentIndex].example_sentences?.length > 0 && (
                      <div className="mt-6 text-gray-500 dark:text-white/60 text-xs md:text-sm max-w-lg text-center italic">
                        {cardsData[currentIndex].example_sentences[0]}
                      </div>
                    )}

                    {studyMode === 'interval' &&
                      cardsData[currentIndex].interval && (
                        <div className="absolute bottom-6 text-gray-400 dark:text-white/40 text-xs">
                          Next review:{' '}
                          {Math.round(cardsData[currentIndex].interval)} day(s)
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  currentIndex === 0
                    ? 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 cursor-not-allowed'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20 active:scale-95'
                }`}
              >
                <FaArrowLeft /> Previous
              </button>

              {/* Center Actions */}
              <div className="flex items-center gap-2">
                {studyMode === 'quiz' && (
                  <>
                    <button
                      onClick={() => markCard('unknown')}
                      className="px-4 py-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors active:scale-95"
                    >
                      Still Learning
                    </button>
                    <button
                      onClick={() => {
                        setSessionStats((prev) => ({
                          ...prev,
                          skipped: prev.skipped + 1,
                        }));
                        handleNext();
                      }}
                      className="px-4 py-2 bg-yellow-100 dark:bg-yellow-500/20 hover:bg-yellow-200 dark:hover:bg-yellow-500/30 text-yellow-700 dark:text-yellow-400 rounded-lg font-medium transition-colors active:scale-95"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => markCard('known')}
                      className="px-4 py-2 bg-green-100 dark:bg-green-500/20 hover:bg-green-200 dark:hover:bg-green-500/30 text-green-700 dark:text-green-400 rounded-lg font-medium transition-colors active:scale-95"
                    >
                      Got it!
                    </button>
                  </>
                )}

                {studyMode === 'interval' && !isFront && (
                  <>
                    <button
                      onClick={() => handleIntervalResponse('again')}
                      className="px-3 py-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors active:scale-95 text-sm"
                    >
                      <div className="text-xs opacity-70">1</div>
                      Again
                    </button>
                    <button
                      onClick={() => handleIntervalResponse('hard')}
                      className="px-3 py-2 bg-orange-100 dark:bg-orange-500/20 hover:bg-orange-200 dark:hover:bg-orange-500/30 text-orange-600 dark:text-orange-400 rounded-lg font-medium transition-colors active:scale-95 text-sm"
                    >
                      <div className="text-xs opacity-70">2</div>
                      Hard
                    </button>
                    <button
                      onClick={() => handleIntervalResponse('good')}
                      className="px-3 py-2 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 rounded-lg font-medium transition-colors active:scale-95 text-sm"
                    >
                      <div className="text-xs opacity-70">3</div>
                      Good
                    </button>
                    <button
                      onClick={() => handleIntervalResponse('easy')}
                      className="px-3 py-2 bg-green-100 dark:bg-green-500/20 hover:bg-green-200 dark:hover:bg-green-500/30 text-green-600 dark:text-green-400 rounded-lg font-medium transition-colors active:scale-95 text-sm"
                    >
                      <div className="text-xs opacity-70">4</div>
                      Easy
                    </button>
                  </>
                )}

                {studyMode === 'interval' && isFront && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Flip the card to rate difficulty
                  </div>
                )}
              </div>

              {!isLastCard ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-pink hover:bg-brand-pink-hover text-white rounded-lg font-medium transition-all active:scale-95"
                >
                  Next <FaArrowRight />
                </button>
              ) : (
                <button
                  onClick={handleFinishSession}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-all active:scale-95"
                >
                  Finish Session
                </button>
              )}
            </div>

            {/* Keyboard Shortcuts */}
            <KeyboardShortcutHint
              className="mt-8"
              shortcuts={[
                { key: 'Space', label: 'Flip' },
                { key: '←/→', label: 'Navigate' },
                { key: 'Enter', label: 'Next' },
                ...(studyMode === 'interval'
                  ? [{ key: '1-4', label: 'Rate difficulty' }]
                  : []),
              ]}
            />
          </div>
        </div>
      ) : null}
      <ItemEditModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        isSaving={isSavingEdit}
        error={editError}
        onClose={handleCloseEditItem}
        onSave={handleSaveEditedItem}
      />
    </AuthenticatedLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();
