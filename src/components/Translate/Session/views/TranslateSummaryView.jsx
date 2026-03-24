// Translate Summary View
// Summary screen showing all question results with scores

import { FiCheckCircle } from 'react-icons/fi';

function formatDuration(ms) {
  if (!ms || ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function TranslateSummaryView({
  sessionStats,
  questionResults,
  onRestart,
  onExit,
  sessionDurationMs,
}) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Completion Header */}
      <div className="bg-surface-card rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FiCheckCircle className="w-9 h-9 sm:w-11 sm:h-11 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Session Complete!
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              {sessionStats.totalQuestions} translation questions
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 text-center">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">
              Questions
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {sessionStats.totalQuestions}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 text-center">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">
              Average
            </div>
            <div className="text-lg sm:text-xl font-bold text-brand-pink">
              {sessionStats.avgScore}%
            </div>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <span className="text-[10px] font-medium text-blue-500">
                G: {sessionStats.avgGrammar}%
              </span>
              <span className="text-[10px] font-medium text-purple-500">
                V: {sessionStats.avgVocab}%
              </span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 text-center">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">
              Time
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tabular-nums">
              {formatDuration(sessionDurationMs)}
            </div>
          </div>
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="bg-surface-card rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Question Breakdown
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {questionResults.map((result, idx) => (
            <div
              key={idx}
              className="rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    Q{result.questionNumber}: {result.english}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 break-all">
                    Expected: {result.expectedJapanese}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 break-all">
                    Your answer: {result.userAnswer}
                  </p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 sm:text-right sm:ml-4">
                  {(() => {
                    const g = result.gradeResult?.grades?.grammar || 0;
                    const v = result.gradeResult?.grades?.vocabulary || 0;
                    const avg = Math.round((g + v) / 2);
                    return (
                      <>
                        <p
                          className={`text-lg sm:text-xl font-bold ${
                            avg >= 90
                              ? 'text-green-500'
                              : avg >= 70
                                ? 'text-blue-500'
                                : avg >= 50
                                  ? 'text-yellow-500'
                                  : 'text-red-500'
                          }`}
                        >
                          {avg}%
                        </p>
                        <div className="flex items-center gap-2 sm:mt-0.5">
                          <span className="text-[10px] font-medium text-blue-500">
                            G: {g}%
                          </span>
                          <span className="text-[10px] font-medium text-purple-500">
                            V: {v}%
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              {result.gradeResult?.feedback && (
                <p className="text-[10px] text-gray-500 dark:text-gray-400 italic mt-1.5 pt-1.5 border-t border-gray-200 dark:border-white/5">
                  {result.gradeResult.feedback}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 pb-4">
        <button
          onClick={onExit}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-sm transition-all active:scale-95 bg-gradient-to-r from-brand-pink to-[#c1084d] text-white hover:brightness-110"
        >
          Back to Practice
        </button>
      </div>
    </div>
  );
}
