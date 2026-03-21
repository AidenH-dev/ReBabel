import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { TbX } from 'react-icons/tb';
import { TbLanguageHiragana } from 'react-icons/tb';

export default function PublicSessionHeader({
  level,
  sessionStats,
  currentIndex,
  totalQuestions,
  onExit,
}) {
  const progress =
    totalQuestions > 0 ? Math.round((currentIndex / totalQuestions) * 100) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onExit}
            className="p-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
            aria-label="Exit"
          >
            <TbX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-white" />
          </button>
          <div className="flex items-center gap-2">
            <TbLanguageHiragana className="text-[#e30a5f] text-lg sm:text-xl" />
            <h1 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
              JLPT N{level} Conjugation
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FaCheckCircle className="text-green-500 text-sm" />
            <span className="text-gray-600 dark:text-white/70">
              {sessionStats.correct}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FaTimesCircle className="text-red-500 text-sm" />
            <span className="text-gray-600 dark:text-white/70">
              {sessionStats.incorrect}
            </span>
          </div>
          <div className="text-gray-600 dark:text-white/70">
            {sessionStats.accuracy}%
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-white/70 mb-2">
          <span>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span>{progress}% Complete</span>
        </div>
        <div className="bg-gray-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-out rounded-full bg-[#e30a5f]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
