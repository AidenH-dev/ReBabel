import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { TbX } from "react-icons/tb";
import { MdQuiz } from "react-icons/md";
import { BsCheckCircleFill } from "react-icons/bs";

/**
 * SessionStatHeaderView - Shared presentational component for quiz/session headers
 *
 * Used across Quiz mode, SRS Learn-New, and SRS Due-Now flows.
 * Displays session title, statistics (correct/incorrect/accuracy), phase indicators,
 * progress tracking, and navigation controls.
 *
 * @param {string} setTitle - Title of the quiz/study set
 * @param {Object} sessionStats - Session statistics
 * @param {number} sessionStats.correct - Number of correct answers
 * @param {number} sessionStats.incorrect - Number of incorrect answers
 * @param {number} sessionStats.accuracy - Accuracy percentage (0-100)
 * @param {number} currentIndex - Current question index (0-based)
 * @param {number} totalQuestions - Total number of questions in current phase
 * @param {string} currentPhase - ID of the current phase (e.g., 'review', 'multiple-choice')
 * @param {string[]} completedPhases - Array of completed phase IDs
 * @param {Array} phases - Array of phase configuration objects
 * @param {string} phases[].id - Phase identifier
 * @param {string} phases[].name - Display name for the phase
 * @param {Component} phases[].icon - Icon component for the phase
 * @param {string} phases[].color - Tailwind color class for the phase (e.g., 'bg-blue-500')
 * @param {string} phases[].borderColor - Tailwind border color class (e.g., 'border-blue-500')
 * @param {number} currentPhaseIndex - Index of current phase in phases array
 * @param {Object} currentPhaseConfig - Configuration object for current phase
 * @param {Component} CurrentPhaseIcon - Icon component for current phase
 * @param {number} progressInPhase - Progress percentage in current phase (0-100)
 * @param {number} [completedCount] - Number of unique items completed (for completion-count mode)
 * @param {number} [totalUniqueItems] - Total number of unique items (for completion-count mode)
 * @param {string} [displayMode='question-count'] - Display mode: 'question-count' or 'completion-count'
 * @param {function(): void} onExit - Callback when exit button is clicked
 */
export default function SessionStatHeaderView({
  setTitle,
  sessionStats,
  currentIndex,
  totalQuestions,
  currentPhase,
  completedPhases,
  phases,
  currentPhaseIndex,
  currentPhaseConfig,
  CurrentPhaseIcon,
  progressInPhase,
  completedCount,
  totalUniqueItems,
  displayMode = 'question-count',
  onExit
}) {
  // Get phase status helper
  const getPhaseStatus = (phase) => {
    if (completedPhases.includes(phase.id)) return 'completed';
    if (phase.id === currentPhase) return 'active';
    return 'upcoming';
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={onExit}
            className="p-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
            aria-label="Exit"
          >
            <TbX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-white" />
          </button>

          <div className="flex items-center gap-2">
            <MdQuiz className="text-[#e30a5f] text-lg sm:text-xl" />
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
              {setTitle || "Quiz"}
            </h1>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FaCheckCircle className="text-green-500 text-sm" />
            <span className="text-gray-600 dark:text-white/70">
              <span className="hidden sm:inline">Correct: </span>{sessionStats.correct}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FaTimesCircle className="text-red-500 text-sm" />
            <span className="text-gray-600 dark:text-white/70">
              <span className="hidden sm:inline">Incorrect: </span>{sessionStats.incorrect}
            </span>
          </div>
          <div className="text-gray-600 dark:text-white/70">
            {sessionStats.accuracy}%
          </div>
        </div>
      </div>

      {/* Current Phase Progress */}
      <div>
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-white/70 mb-2">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop: Inline Phase Indicators */}
            {phases && phases.length > 1 && (
              <div className="hidden sm:flex items-center gap-1.5">
                {phases.map((phase, index) => {
                  const IconComponent = phase.icon;
                  const status = getPhaseStatus(phase);
                  const isCompleted = status === 'completed';
                  const isActive = status === 'active';

                  return (
                    <div key={phase.id} className="flex items-center gap-1.5">
                      {/* Compact Phase Dot/Icon */}
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                        isCompleted
                          ? `${phase.color} text-white`
                          : isActive
                          ? `${phase.borderColor} border bg-white dark:bg-white/10 text-gray-900 dark:text-white`
                          : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40'
                      }`}>
                        {isCompleted ? (
                          <BsCheckCircleFill className="text-xs" />
                        ) : (
                          <IconComponent className="text-xs" />
                        )}
                        <span className="whitespace-nowrap">{phase.name}</span>
                      </div>

                      {/* Arrow Separator */}
                      {index < phases.length - 1 && (
                        <svg className="w-3 h-3 text-gray-300 dark:text-white/20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  );
                })}
                <span className="text-gray-300 dark:text-white/20">|</span>
              </div>
            )}

            {/* Current Question Info */}
            <span className="flex items-center gap-2">
              {CurrentPhaseIcon && (
                <>
                  <CurrentPhaseIcon className="text-sm sm:hidden" />
                  <span className="sm:hidden">{currentPhaseConfig?.name}:</span>
                </>
              )}
              <span>
                {displayMode === 'completion-count' && currentPhase !== 'review'
                  ? `${completedCount} completed out of ${totalUniqueItems} total`
                  : `Question ${currentIndex + 1} of ${totalQuestions}`
                }
              </span>
            </span>
          </div>

          <span>{Math.round(progressInPhase)}% Complete</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress Bar */}
          <div className="flex-1 bg-gray-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out rounded-full ${
                currentPhaseConfig ? currentPhaseConfig.color : 'bg-gray-400'
              }`}
              style={{ width: `${progressInPhase}%` }}
            />
          </div>

          {/* Mobile: Next Phase Indicator */}
          {phases && phases.length > 1 && currentPhaseIndex < phases.length - 1 && (
            <div className="sm:hidden flex items-center gap-1.5">
              <svg className="w-3 h-3 text-gray-400 dark:text-white/40" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {(() => {
                const nextPhase = phases[currentPhaseIndex + 1];
                const NextIcon = nextPhase.icon;
                return (
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs ${nextPhase.borderColor} border bg-white dark:bg-white/5 text-gray-600 dark:text-white/60`}>
                    <NextIcon className="text-xs" />
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
