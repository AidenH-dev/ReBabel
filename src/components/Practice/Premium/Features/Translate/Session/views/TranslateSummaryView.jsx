// Translate Summary View
// Summary screen showing all question results with scores

export default function TranslateSummaryView({
  sessionStats,
  questionResults,
  onRestart,
  onExit
}) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Completion Header */}
      <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-5 sm:p-8 text-center mb-4 sm:mb-6">
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <svg className="w-8 h-8 sm:w-12 sm:h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Session Complete!
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Great job completing {sessionStats.totalQuestions} translation questions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-3 sm:p-4 text-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Questions</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {sessionStats.totalQuestions}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-3 sm:p-4 text-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Average</p>
          <p className="text-xl sm:text-2xl font-bold text-[#e30a5f]">
            {sessionStats.avgScore}%
          </p>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-1">
            <span className="text-xs font-medium text-blue-500">
              G: {sessionStats.avgGrammar}%
            </span>
            <span className="text-xs font-medium text-purple-500">
              V: {sessionStats.avgVocab}%
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-3 sm:p-4 text-center">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Points</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {sessionStats.totalScore}
          </p>
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Question Breakdown
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {questionResults.map((result, idx) => (
            <div
              key={idx}
              className="p-3 sm:p-4 bg-gray-50 dark:bg-white/5 rounded-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Q{result.questionNumber}: {result.english}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-all">
                    Expected: {result.expectedJapanese}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
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
                        <p className={`text-xl sm:text-2xl font-bold ${
                          avg >= 90 ? 'text-green-600 dark:text-green-400' :
                          avg >= 70 ? 'text-blue-600 dark:text-blue-400' :
                          avg >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {avg}%
                        </p>
                        <div className="flex items-center gap-2 sm:mt-0.5">
                          <span className="text-xs font-medium text-blue-500">G: {g}%</span>
                          <span className="text-xs font-medium text-purple-500">V: {v}%</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              {result.gradeResult?.feedback && (
                <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-2">
                  {result.gradeResult.feedback}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4 pb-4">
        <button
          onClick={onExit}
          className="w-full sm:w-auto px-6 py-3 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
        >
          Back to Practice
        </button>
      </div>
    </div>
  );
}
