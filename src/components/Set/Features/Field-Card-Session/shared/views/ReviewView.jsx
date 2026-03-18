import { useEffect, useState, useRef, useCallback } from 'react';
import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { IoSparkles } from 'react-icons/io5';
import KeyboardShortcutHint from './KeyboardShortcutHint';

/**
 * ReviewView - Shared presentational component for review phase card display
 *
 * Supports:
 * - Keyboard navigation (←/→, Enter)
 * - Touch swipe gestures on mobile (left = next, right = previous)
 * - Slide animation on card transitions
 */
export default function ReviewView({
  currentCard,
  isLastCard,
  isFirstCard,
  onNext,
  onPrevious,
}) {
  const [slideDir, setSlideDir] = useState(null); // 'left' | 'right' | null
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef(null);

  // Touch state
  const touchStart = useRef(null);
  const touchCurrent = useRef(null);
  const cardElement = useRef(null);

  // Animated navigation
  const animateAndNavigate = useCallback(
    (direction) => {
      if (isAnimating) return;
      if (direction === 'right' && isFirstCard) return;

      setIsAnimating(true);
      setSlideDir(direction === 'left' ? 'left' : 'right');

      setTimeout(() => {
        if (direction === 'left') onNext();
        else onPrevious();
        setSlideDir(null);
        setIsAnimating(false);
      }, 200);
    },
    [isAnimating, isFirstCard, onNext, onPrevious]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        animateAndNavigate('left');
      } else if (e.key === 'ArrowLeft' && !isFirstCard) {
        animateAndNavigate('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [animateAndNavigate, isFirstCard]);

  // Touch handlers with drag feedback
  const handleTouchStart = (e) => {
    touchStart.current = e.targetTouches[0].clientX;
    touchCurrent.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!touchStart.current) return;
    touchCurrent.current = e.targetTouches[0].clientX;

    const diff = touchCurrent.current - touchStart.current;
    // Block right swipe if first card
    if (diff > 0 && isFirstCard) return;

    // Apply live drag transform (capped at 100px)
    const capped = Math.max(-100, Math.min(100, diff));
    if (cardElement.current) {
      cardElement.current.style.transform = `translateX(${capped}px)`;
      cardElement.current.style.opacity = `${1 - Math.abs(capped) / 300}`;
      cardElement.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchCurrent.current) return;

    const diff = touchCurrent.current - touchStart.current;
    const threshold = 50;

    // Reset the live drag
    if (cardElement.current) {
      cardElement.current.style.transform = '';
      cardElement.current.style.opacity = '';
      cardElement.current.style.transition = '';
    }

    if (Math.abs(diff) >= threshold) {
      if (diff < 0) {
        animateAndNavigate('left'); // swipe left = next
      } else if (!isFirstCard) {
        animateAndNavigate('right'); // swipe right = previous
      }
    }

    touchStart.current = null;
    touchCurrent.current = null;
  };

  if (!currentCard) return null;

  const slideClass =
    slideDir === 'left'
      ? 'animate-slide-out-left'
      : slideDir === 'right'
        ? 'animate-slide-out-right'
        : 'animate-slide-in';

  return (
    <div className="flex-1 flex flex-col items-center px-2 sm:px-4 min-h-0">
      <div className="w-full max-w-3xl flex flex-col min-h-0 flex-1 py-4">
        {/* Card Content - Swipeable + animated */}
        <div
          ref={cardElement}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`bg-white dark:bg-white/10 rounded-2xl shadow-xl p-6 sm:p-8 mb-4 sm:mb-6 overflow-y-auto flex-1 min-h-0 touch-pan-y ${slideClass}`}
          style={{ willChange: 'transform, opacity' }}
        >
          {currentCard.type === 'vocabulary' ? (
            /* Vocabulary Card */
            <div>
              {/* Type Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs sm:text-sm font-medium mb-4">
                <IoSparkles className="text-sm" />
                Vocabulary
              </div>

              {/* Main Content */}
              <div className="space-y-4 sm:space-y-6">
                {/* Kanji (if exists) */}
                {currentCard.kanji && (
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-1">
                      Kanji
                    </div>
                    <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
                      {currentCard.kanji}
                    </div>
                  </div>
                )}

                {/* Kana */}
                <div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-1">
                    Reading
                  </div>
                  <div className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white/90">
                    {currentCard.kana}
                  </div>
                </div>

                {/* English */}
                <div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-1">
                    Meaning
                  </div>
                  <div className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white">
                    {currentCard.english}
                  </div>
                </div>

                {/* Lexical Category */}
                {currentCard.lexical_category && (
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-1">
                      Type
                    </div>
                    <div className="inline-block px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-sm text-gray-700 dark:text-white/80">
                      {currentCard.lexical_category}
                    </div>
                  </div>
                )}

                {/* Example Sentences */}
                {currentCard.example_sentences &&
                  currentCard.example_sentences.length > 0 && (
                    <div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-2">
                        Example Sentences
                      </div>
                      <div className="space-y-2">
                        {currentCard.example_sentences
                          .slice(0, 3)
                          .map((sentence, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg text-sm sm:text-base text-gray-700 dark:text-white/80"
                            >
                              {sentence}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          ) : (
            /* Grammar Card */
            <div>
              {/* Type Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs sm:text-sm font-medium mb-4">
                <IoSparkles className="text-sm" />
                Grammar
              </div>

              {/* Main Content */}
              <div className="space-y-4 sm:space-y-6">
                {/* Grammar Pattern */}
                <div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-1">
                    Pattern
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white break-words">
                    {currentCard.title}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-1">
                    Meaning / Usage
                  </div>
                  <div className="text-lg sm:text-xl text-gray-800 dark:text-white/90">
                    {currentCard.description}
                  </div>
                </div>

                {/* Topic */}
                {currentCard.topic && (
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-1">
                      Topic
                    </div>
                    <div className="inline-block px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-sm text-gray-700 dark:text-white/80">
                      {currentCard.topic}
                    </div>
                  </div>
                )}

                {/* Example Sentences */}
                {currentCard.example_sentences &&
                  currentCard.example_sentences.length > 0 && (
                    <div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-2">
                        Examples
                      </div>
                      <div className="space-y-2">
                        {currentCard.example_sentences
                          .slice(0, 3)
                          .map((sentence, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg text-sm sm:text-base text-gray-700 dark:text-white/80"
                            >
                              {sentence}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 flex-shrink-0">
          {/* Previous Button */}
          <button
            onClick={() => animateAndNavigate('right')}
            disabled={isFirstCard || isAnimating}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base flex items-center gap-2 ${
              isFirstCard
                ? 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed'
                : 'bg-gray-600 hover:bg-gray-700 text-white active:scale-95'
            }`}
          >
            <FaArrowLeft />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Card Counter + swipe hint on mobile */}
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50">
              {isLastCard ? 'Ready to start quiz?' : 'Keep studying'}
            </div>
            <div className="sm:hidden text-[10px] text-gray-400 dark:text-white/30 mt-0.5">
              Swipe to navigate
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={() => animateAndNavigate('left')}
            disabled={isAnimating}
            className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all active:scale-95 text-sm sm:text-base flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <span>{isLastCard ? 'Start Quiz' : 'Next'}</span>
            <FaArrowRight />
          </button>
        </div>

        {/* Keyboard Shortcuts */}
        <KeyboardShortcutHint
          className="mt-6 flex-shrink-0"
          shortcuts={[
            { key: '←/→', label: 'Navigate' },
            { key: 'Enter', label: isLastCard ? 'Start Quiz' : 'Next' },
          ]}
        />
      </div>
    </div>
  );
}
