import Button from '@/components/ui/Button';
import useCountUp from '@/hooks/useCountUp';
import { FiCheckCircle } from 'react-icons/fi';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { TbLoader3 } from 'react-icons/tb';

/**
 * ChunkCompletionView -- shown between chunks with stats, mini review, and continue/exit options.
 *
 * IMPORTANT: Caller MUST NOT render this when chunkNumber === totalChunks.
 * Use SummaryView for the final chunk instead.
 *
 * @param {object} props
 * @param {number} props.chunkNumber - 1-based chunk number
 * @param {number} props.totalChunks
 * @param {object} props.chunkStats - { correct, incorrect, totalAttempts, accuracy }
 * @param {object} props.overallStats - { correct, incorrect, totalAttempts, accuracy, itemsCompleted, totalItems }
 * @param {Array} props.chunkAnsweredItems - [{ question, answer, isCorrect }] items from this chunk
 * @param {'quiz'|'flashcards'} props.variant - 'flashcards' hides accuracy stats (no right/wrong in plain mode)
 * @param {function} props.onContinue
 * @param {function} props.onSaveAndExit
 * @param {boolean} props.isLoading
 */
export default function ChunkCompletionView({
  chunkNumber,
  totalChunks,
  chunkStats,
  overallStats,
  chunkAnsweredItems = [],
  variant = 'quiz',
  onContinue,
  onSaveAndExit,
  isLoading = false,
}) {
  if (chunkNumber >= totalChunks) {
    console.warn(
      'ChunkCompletionView rendered on final chunk -- use SummaryView instead'
    );
  }

  const isFlashcards = variant === 'flashcards';
  const safeAccuracy = Number.isFinite(chunkStats.accuracy)
    ? chunkStats.accuracy
    : 0;
  const animatedAccuracy = useCountUp(
    isFlashcards ? 0 : safeAccuracy,
    800,
    200,
    !isFlashcards
  );

  const overallProgress =
    overallStats.totalItems > 0
      ? Math.round(
          (overallStats.itemsCompleted / overallStats.totalItems) * 100
        )
      : 0;
  const safeOverallAccuracy = Number.isFinite(overallStats.accuracy)
    ? overallStats.accuracy
    : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-center">
      {/* Header */}
      <div className="text-center mb-6">
        <FiCheckCircle className="text-green-500 text-4xl mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Chunk {chunkNumber} of {totalChunks} Complete!
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isFlashcards
            ? `${chunkStats.totalAttempts} card${chunkStats.totalAttempts !== 1 ? 's' : ''} reviewed`
            : `${chunkStats.totalAttempts} question${chunkStats.totalAttempts !== 1 ? 's' : ''} answered`}
        </p>
      </div>

      {/* Two-column layout: Stats (left) + Quick Review (right) on desktop, stacked on mobile */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
        {/* Left column: Stats + Overall Progress */}
        <div className="flex-1 min-w-0">
          {/* Chunk Stats Card -- only for quiz variant (flashcards have no accuracy) */}
          {!isFlashcards && (
            <div className="bg-surface-card rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-6">
              {/* Accuracy hero */}
              <div className="text-center mb-4">
                <div className="text-4xl font-bold tabular-nums text-gray-900 dark:text-white">
                  {animatedAccuracy}%
                </div>
                <div className="text-[10px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400 mt-1">
                  Chunk Accuracy
                </div>
              </div>

              {/* Accuracy progress bar */}
              <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2 mb-4">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-[1200ms] ease-out"
                  style={{ width: `${safeAccuracy}%` }}
                />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2.5 text-center">
                  <div className="text-[10px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">
                    Correct
                  </div>
                  <div className="text-xl font-bold tabular-nums text-green-600 dark:text-green-400">
                    {chunkStats.correct}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2.5 text-center">
                  <div className="text-[10px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">
                    Incorrect
                  </div>
                  <div className="text-xl font-bold tabular-nums text-red-600 dark:text-red-400">
                    {chunkStats.incorrect}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overall Progress Card */}
          <div
            className={`bg-surface-card rounded-xl border border-gray-200 dark:border-white/10 p-4 ${isFlashcards ? '' : 'mt-4'}`}
          >
            <div className="text-[10px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400 mb-2">
              Overall Progress
            </div>

            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2 mb-2">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-[1200ms] ease-out"
                style={{ width: `${overallProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                {overallStats.itemsCompleted} of {overallStats.totalItems}{' '}
                {isFlashcards ? 'cards' : 'items'} completed
              </span>
              {!isFlashcards && overallStats.totalAttempts > 0 && (
                <span className="text-gray-500 dark:text-gray-400">
                  {safeOverallAccuracy}% accuracy
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Quick Review (desktop: side-by-side, mobile: below) */}
        {chunkAnsweredItems.length > 0 && (
          <div className="lg:w-[340px] lg:flex-shrink-0 bg-surface-card rounded-xl border border-gray-200 dark:border-white/10 p-4">
            <div className="text-[10px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400 mb-2">
              Quick Review
            </div>
            <div className="max-h-[280px] overflow-y-auto space-y-1.5">
              {chunkAnsweredItems.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs border ${
                    item.isCorrect
                      ? 'border-green-300/70 dark:border-green-500/20 bg-green-50/60 dark:bg-green-500/5'
                      : 'border-red-300/70 dark:border-red-400/20 bg-red-50/60 dark:bg-red-400/5'
                  }`}
                >
                  {item.isCorrect ? (
                    <FaCheckCircle className="text-green-500 text-xs flex-shrink-0" />
                  ) : (
                    <FaTimesCircle className="text-red-500 text-xs flex-shrink-0" />
                  )}
                  <span className="truncate text-gray-700 dark:text-gray-200">
                    {item.question}
                  </span>
                  {item.answer && (
                    <span className="ml-auto text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {item.answer}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons -- same line */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <Button
          variant="secondary"
          onClick={onSaveAndExit}
          disabled={isLoading}
        >
          Exit & Save Progress
        </Button>
        <Button
          variant="primary"
          onClick={onContinue}
          disabled={isLoading}
          className="relative"
        >
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <TbLoader3 className="w-4 h-4 animate-spin" />
            </span>
          )}
          <span className={isLoading ? 'opacity-0' : ''}>
            Continue to Next Chunk
          </span>
        </Button>
      </div>
      <div className="text-right mt-1">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          Your progress is saved
        </span>
      </div>
    </div>
  );
}
