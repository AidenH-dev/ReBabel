import { useEffect, useState, useRef } from 'react';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';

export default function SRSLevelChange({
  item,
  oldLevel,
  newLevel,
  onComplete,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timersRef = useRef({});

  const levelIncreased = newLevel > oldLevel;
  const levelDecreased = newLevel < oldLevel;

  useEffect(() => {
    const timers = timersRef.current;

    timers.showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 80);

    timers.animateTimer = setTimeout(() => {
      setIsAnimating(true);
    }, 450);

    timers.hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1800);

    timers.completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2100);

    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, [onComplete]);

  const getItemDisplay = () => {
    if (item.type === 'vocabulary') {
      return item.kanji || item.kana;
    }
    if (item.type === 'grammar') {
      return item.title;
    }
    return '';
  };

  const getSubtitle = () => {
    if (item.type === 'vocabulary') {
      return item.english;
    }
    if (item.type === 'grammar') {
      return item.topic;
    }
    return '';
  };

  const changeLabel = levelIncreased
    ? 'Level Up'
    : levelDecreased
      ? 'Level Down'
      : 'Level Stable';

  const toneClass = levelIncreased
    ? 'border-emerald-500/80 text-emerald-700 dark:text-emerald-300'
    : levelDecreased
      ? 'border-red-500/80 text-red-700 dark:text-red-300'
      : 'border-gray-500/70 text-gray-700 dark:text-gray-300';

  return (
    <div className="pointer-events-none absolute left-1/2 top-20 z-20 -translate-x-1/2 sm:top-24 lg:left-[calc(50%+24.5rem)] lg:top-1/2 lg:z-0 lg:-translate-x-0 lg:-translate-y-1/2 xl:left-[calc(50%+25rem)]">
      <div
        className={`transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
        }`}
      >
        <div
          className={`w-[calc(100vw-1.5rem)] max-w-2xl rounded-xl border-2 border-dashed bg-white/90 px-3 py-3 shadow-lg backdrop-blur-sm sm:px-4 sm:py-3.5 lg:w-40 lg:max-w-none lg:px-4 lg:py-4 xl:w-48 dark:bg-surface-page/90 ${toneClass}`}
        >
          <div className="flex items-center justify-between gap-3 sm:gap-5 lg:flex-col lg:items-start lg:gap-4">
            <div className="min-w-0 lg:w-full">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80 sm:text-xs lg:text-sm">
                SRS {changeLabel}
              </div>
              <div className="truncate text-base font-bold text-gray-900 dark:text-white sm:text-lg lg:whitespace-normal lg:break-words lg:text-lg lg:leading-tight">
                {getItemDisplay()}
              </div>
              <div className="truncate text-xs text-gray-600 dark:text-white/70 sm:text-sm lg:mt-1 lg:whitespace-normal lg:break-words lg:text-sm lg:leading-tight">
                {getSubtitle()}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:w-full lg:flex-col lg:items-center lg:gap-1.5 lg:border-t lg:border-current/20 lg:pt-3">
              <div
                className={`text-xl font-bold text-gray-500 dark:text-gray-300 sm:text-2xl lg:text-2xl ${
                  levelIncreased ? 'lg:order-3' : 'lg:order-1'
                }`}
              >
                {oldLevel}
              </div>

              {levelIncreased && (
                <div
                  className={`transform transition-all duration-300 lg:order-2 ${
                    isAnimating ? '-translate-y-1 scale-110' : 'scale-100'
                  }`}
                >
                  <FaArrowUp className="text-lg text-emerald-500 sm:text-xl lg:text-xl" />
                </div>
              )}

              {levelDecreased && (
                <div
                  className={`transform transition-all duration-300 lg:order-2 ${
                    isAnimating ? 'translate-y-1 scale-110' : 'scale-100'
                  }`}
                >
                  <FaArrowDown className="text-lg text-red-500 sm:text-xl lg:text-xl" />
                </div>
              )}

              {!levelIncreased && !levelDecreased && (
                <div className="text-lg text-gray-500 dark:text-gray-300 sm:text-xl lg:order-2 lg:text-xl">
                  -
                </div>
              )}

              <div
                className={`text-xl font-bold transition-all duration-300 sm:text-2xl lg:text-2xl ${
                  isAnimating ? 'scale-110 opacity-100' : 'scale-95 opacity-80'
                } ${
                  levelIncreased
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : levelDecreased
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-800 dark:text-white'
                } ${levelIncreased ? 'lg:order-1' : 'lg:order-3'}`}
              >
                {newLevel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
