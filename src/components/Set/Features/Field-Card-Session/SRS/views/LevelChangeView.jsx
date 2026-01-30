// components/pages/academy/sets/SRSLearnNewSet/LevelChange/SRSLevelChange.jsx
import { useEffect, useState, useRef } from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

export default function SRSLevelChange({
  item,
  oldLevel,
  newLevel,
  onComplete
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timersRef = useRef({});

  const levelIncreased = newLevel > oldLevel;
  const levelDecreased = newLevel < oldLevel;

  // Function to immediately dismiss and continue
  const handleDismiss = () => {
    // Clear all timers
    Object.values(timersRef.current).forEach(timer => clearTimeout(timer));
    timersRef.current = {};

    // Immediately hide and complete
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  useEffect(() => {
    // Trigger entrance animation
    timersRef.current.showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Start number animation
    timersRef.current.animateTimer = setTimeout(() => {
      setIsAnimating(true);
    }, 800);

    // Auto-dismiss after showing
    timersRef.current.hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 3800);

    // Call onComplete to continue to next item
    timersRef.current.completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4300);

    return () => {
      Object.values(timersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, [onComplete]);

  // Keyboard shortcut: Enter to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  // Get display text for item
  const getItemDisplay = () => {
    if (item.type === 'vocabulary') {
      return item.kanji || item.kana;
    } else if (item.type === 'grammar') {
      return item.title;
    }
    return '';
  };

  // Get subtitle text
  const getSubtitle = () => {
    if (item.type === 'vocabulary') {
      return item.english;
    } else if (item.type === 'grammar') {
      return item.topic;
    }
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Animated Card */}
      <div
        className={`
          transform transition-all duration-500 ease-out
          ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
        `}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          {/* Item Display */}
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {getItemDisplay()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {getSubtitle()}
            </div>
          </div>

          {/* Level Change Display */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Old Level */}
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Previous
              </div>
              <div
                className={`
                  text-4xl font-bold transition-all duration-500
                  ${isAnimating ? 'opacity-50 scale-90' : 'opacity-100 scale-100'}
                  ${levelDecreased ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}
                `}
              >
                {oldLevel}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center">
              {levelIncreased && (
                <div
                  className={`
                    transform transition-all duration-500
                    ${isAnimating ? 'scale-110 translate-y-[-4px]' : 'scale-100'}
                  `}
                >
                  <FaArrowUp className="text-4xl text-green-500" />
                </div>
              )}
              {levelDecreased && (
                <div
                  className={`
                    transform transition-all duration-500
                    ${isAnimating ? 'scale-110 translate-y-[4px]' : 'scale-100'}
                  `}
                >
                  <FaArrowDown className="text-4xl text-red-500" />
                </div>
              )}
              {!levelIncreased && !levelDecreased && (
                <div className="text-4xl text-gray-400 dark:text-gray-500">→</div>
              )}
            </div>

            {/* New Level */}
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                New
              </div>
              <div
                className={`
                  text-4xl font-bold transition-all duration-500
                  ${isAnimating ? 'opacity-100 scale-110' : 'opacity-50 scale-90'}
                  ${levelIncreased ? 'text-green-500' : levelDecreased ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}
                `}
              >
                {newLevel}
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center">
            {levelIncreased && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Perfect! Level increased
                </span>
              </div>
            )}
            {levelDecreased && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                  Keep practicing! Level decreased
                </span>
              </div>
            )}
            {!levelIncreased && !levelDecreased && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700/30 rounded-lg">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                  Level maintained
                </span>
              </div>
            )}
          </div>

          {/* SRS Info */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {levelIncreased && `Next review scheduled further out`}
              {levelDecreased && `You'll see this item sooner`}
              {!levelIncreased && !levelDecreased && `Review schedule unchanged`}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
              Press Enter to continue
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
