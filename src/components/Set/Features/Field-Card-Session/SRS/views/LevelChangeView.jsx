import { useEffect, useState, useRef, useCallback } from 'react';
import { FaArrowRight } from 'react-icons/fa';
import { SRS_INTERVALS } from '@/lib/srs/constants';

/** Format an SRS interval in ms to a short human label. */
function formatInterval(ms) {
  if (!ms) return '';
  const minutes = ms / (60 * 1000);
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d`;
  const months = days / 30;
  return `${Math.round(months)}mo`;
}

/** Get a human-readable label for an SRS level interval. */
function getDueLabel(level) {
  const ms = SRS_INTERVALS[level];
  if (!ms) return null;
  const minutes = ms / (60 * 1000);
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} hr`;
  const days = hours / 24;
  if (days === 1) return '1 day';
  if (days < 30) return `${Math.round(days)} days`;
  const months = days / 30;
  if (months === 1) return '1 month';
  return `${Math.round(months)} months`;
}

/**
 * SRSLevelChange — shows a level-up/down notification after completing all
 * variations of an item.
 *
 * Renders in-flow between progress bar and question card at all breakpoints.
 * Back-to-back: Effect re-runs on prop change, clearing old timers first.
 */
export default function SRSLevelChange({
  item,
  oldLevel,
  newLevel,
  onComplete,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timersRef = useRef({});
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const levelIncreased = newLevel > oldLevel;
  const levelDecreased = newLevel < oldLevel;

  const fireComplete = useCallback(() => {
    if (onCompleteRef.current) onCompleteRef.current();
  }, []);

  useEffect(() => {
    Object.values(timersRef.current).forEach((t) => clearTimeout(t));
    const timers = {};
    timersRef.current = timers;

    setIsVisible(false);
    setIsAnimating(false);

    timers.show = setTimeout(() => setIsVisible(true), 80);
    timers.animate = setTimeout(() => setIsAnimating(true), 400);
    timers.hide = setTimeout(() => setIsVisible(false), 2200);
    timers.complete = setTimeout(fireComplete, 2500);

    return () => {
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
    };
  }, [item, oldLevel, newLevel, fireComplete]);

  const getItemDisplay = () => {
    if (item.type === 'vocabulary') return item.kanji || item.kana;
    if (item.type === 'grammar') return item.title;
    return '';
  };

  const getSubtitle = () => {
    if (item.type === 'vocabulary') return item.english;
    if (item.type === 'grammar') return item.topic;
    return '';
  };

  const labelText = levelIncreased
    ? 'Level Up'
    : levelDecreased
      ? 'Level Down'
      : 'No Change';

  const labelColor = levelIncreased
    ? 'text-emerald-700 dark:text-emerald-300'
    : levelDecreased
      ? 'text-red-700 dark:text-red-300'
      : 'text-gray-600 dark:text-gray-400';

  const toneBorder = levelIncreased
    ? 'border-emerald-400 dark:border-emerald-500/60'
    : levelDecreased
      ? 'border-red-400 dark:border-red-500/60'
      : 'border-gray-400 dark:border-gray-500/60';

  const toneBg = levelIncreased
    ? 'bg-emerald-50 dark:bg-emerald-950/40'
    : levelDecreased
      ? 'bg-red-50 dark:bg-red-950/40'
      : 'bg-gray-50 dark:bg-gray-900/40';

  const arrowColor = levelIncreased
    ? 'text-emerald-500'
    : levelDecreased
      ? 'text-red-500'
      : 'text-gray-400';

  const newLevelColor = levelIncreased
    ? 'text-emerald-600 dark:text-emerald-400'
    : levelDecreased
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-700 dark:text-white';

  const dividerColor = levelIncreased
    ? 'bg-emerald-300 dark:bg-emerald-700'
    : levelDecreased
      ? 'bg-red-300 dark:bg-red-700'
      : 'bg-gray-300 dark:bg-gray-600';

  const dueLabel = getDueLabel(newLevel);

  return (
    <div className="pointer-events-none">
      <div
        className={`transition-opacity duration-500 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className={`rounded-xl border-[1.5px] border-dashed ${toneBorder} ${toneBg} px-3 py-2 shadow-md backdrop-blur-sm sm:px-4 sm:py-2.5`}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Level transition badge */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-base font-bold text-gray-400 dark:text-gray-500 sm:text-lg">
                {oldLevel}
              </span>
              <FaArrowRight
                className={`text-xs ${arrowColor} ${
                  isAnimating ? 'scale-125' : 'scale-100'
                } transition-transform duration-300`}
              />
              <span
                className={`text-lg font-extrabold sm:text-xl ${newLevelColor} ${
                  isAnimating ? 'scale-110' : 'scale-95 opacity-80'
                } transition-all duration-300`}
              >
                {newLevel}
              </span>
            </div>

            {/* Divider */}
            <div className={`w-px h-7 sm:h-8 ${dividerColor}`} />

            {/* Item info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-sm font-bold text-gray-900 dark:text-white sm:text-base">
                  {getItemDisplay()}
                </span>
                <span
                  className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider sm:text-xs ${labelColor}`}
                >
                  {labelText}
                </span>
              </div>
              <div className="truncate text-[11px] text-gray-500 dark:text-white/60 sm:text-xs">
                {getSubtitle()}
              </div>
            </div>

            {/* Next due */}
            {dueLabel && (
              <>
                <div className={`w-px h-7 sm:h-8 shrink-0 ${dividerColor}`} />
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 sm:text-[11px]">
                    Next in
                  </span>
                  <span
                    className={`text-xs font-bold sm:text-sm ${newLevelColor}`}
                  >
                    {dueLabel}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Invisible placeholder with the same structure/sizing as the real card.
 * Render this inside the slot when no level change is active so the slot
 * always has the correct natural height.
 */
export function LevelChangePlaceholder() {
  return (
    <div className="pointer-events-none invisible" aria-hidden="true">
      <div className="rounded-xl border-[1.5px] border-dashed border-transparent px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-base sm:text-lg font-bold">0</span>
            <FaArrowRight className="text-xs" />
            <span className="text-lg sm:text-xl font-extrabold">0</span>
          </div>
          <div className="w-px h-7 sm:h-8" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm sm:text-base font-bold">
                Placeholder
              </span>
              <span className="text-[10px] sm:text-xs font-semibold uppercase">
                Level Up
              </span>
            </div>
            <div className="text-[11px] sm:text-xs">subtitle</div>
          </div>
          {/* Match the due section height in placeholder */}
          <div className="w-px h-7 sm:h-8 shrink-0" />
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] sm:text-[11px]">Next in</span>
            <span className="text-xs sm:text-sm font-bold">0 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
