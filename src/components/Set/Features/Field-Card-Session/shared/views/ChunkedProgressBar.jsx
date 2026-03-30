import { useState, useEffect } from 'react';

/**
 * ChunkedProgressBar — segmented progress bar with sliding window.
 * Shows max 9 segments on desktop, 5 on mobile. Active chunk stays centered.
 * Overflow badges on left/right show hidden chunk counts.
 * When total chunks fit in the window, all are shown with no overflow.
 */

const MAX_VISIBLE_DESKTOP = 9;
const MAX_VISIBLE_MOBILE = 5;

function computeWindow(totalChunks, currentChunkIndex, maxVisible) {
  if (totalChunks <= maxVisible) {
    return { start: 0, end: totalChunks, overflowLeft: 0, overflowRight: 0 };
  }

  const half = Math.floor(maxVisible / 2);
  let start = currentChunkIndex - half;
  let end = start + maxVisible;

  if (start < 0) {
    start = 0;
    end = maxVisible;
  }
  if (end > totalChunks) {
    end = totalChunks;
    start = totalChunks - maxVisible;
  }

  return {
    start,
    end,
    overflowLeft: start,
    overflowRight: totalChunks - end,
  };
}

export default function ChunkedProgressBar({
  totalChunks,
  currentChunkIndex,
  chunkProgress = 0,
  totalItems,
  itemsCompleted = 0,
  chunkSize,
  currentItemInChunk = 0,
  totalQuestionsInPhase = 0,
  color = 'bg-brand-pink',
  hideLabels = false,
}) {
  const currentChunkTotal = Math.min(
    chunkSize,
    totalItems - currentChunkIndex * chunkSize
  );
  const clampedProgress = Math.max(0, Math.min(100, chunkProgress));

  // Responsive: detect mobile for window size
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const maxVisible = isMobile ? MAX_VISIBLE_MOBILE : MAX_VISIBLE_DESKTOP;
  const win = computeWindow(totalChunks, currentChunkIndex, maxVisible);
  const isWindowed = totalChunks > maxVisible;

  return (
    <div className="w-full space-y-2">
      {/* Single-line label: chunk position | item in chunk | overall progress */}
      {!hideLabels && (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span className="font-medium">
              Chunk {currentChunkIndex + 1}/{totalChunks}
            </span>
            <span className="text-gray-400 dark:text-gray-500">
              Card {currentItemInChunk}/
              {totalQuestionsInPhase || currentChunkTotal}
            </span>
          </div>
          <span>
            {itemsCompleted} of {totalItems} total
          </span>
        </div>
      )}

      {/* Segmented bar with overflow badges */}
      <div className="flex items-center gap-1.5">
        {/* Left overflow badge */}
        {win.overflowLeft > 0 && (
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0 w-8 text-right">
            +{win.overflowLeft}
          </span>
        )}

        {/* Visible segments */}
        <div className="flex items-center h-2.5 gap-2 flex-1">
          {Array.from({ length: win.end - win.start }, (_, i) => {
            const chunkIdx = win.start + i;
            const isCompleted = chunkIdx < currentChunkIndex;
            const isActive = chunkIdx === currentChunkIndex;

            return (
              <div
                key={chunkIdx}
                className="h-full rounded-full overflow-hidden flex-1 bg-gray-200 dark:bg-white/10"
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
                  style={{
                    width: isCompleted
                      ? '100%'
                      : isActive
                        ? `${clampedProgress}%`
                        : '0%',
                    opacity: isCompleted ? 0.55 : 1,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Right overflow badge */}
        {win.overflowRight > 0 && (
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0 w-8 text-left">
            +{win.overflowRight}
          </span>
        )}
      </div>

      {/* Per-chunk item counts (desktop only, hidden when windowed) */}
      {!isWindowed && (
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
          {Array.from({ length: totalChunks }, (_, i) => {
            const chunkStart = i * chunkSize;
            const chunkEnd = Math.min(chunkStart + chunkSize, totalItems);
            const chunkTotal = chunkEnd - chunkStart;
            const isCompleted = i < currentChunkIndex;
            const isActive = i === currentChunkIndex;
            const itemsDone = isCompleted
              ? chunkTotal
              : isActive
                ? Math.min(
                    Math.round((clampedProgress / 100) * chunkTotal),
                    chunkTotal
                  )
                : 0;

            return (
              <span key={i} className="flex-1 text-center truncate">
                {itemsDone}/{chunkTotal}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
