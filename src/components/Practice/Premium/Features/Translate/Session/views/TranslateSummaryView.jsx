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
      <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-8 text-center mb-6">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Session Complete!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Great job completing {sessionStats.totalQuestions} translation questions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Questions</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {sessionStats.totalQuestions}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Score</p>
          <p className="text-2xl font-bold text-[#e30a5f]">
            {sessionStats.avgScore}%
          </p>
          <div className="flex items-center justify-center gap-3 mt-1">
            <span className="text-xs font-medium text-blue-500">
              G: {sessionStats.avgGrammar}%
            </span>
            <span className="text-xs font-medium text-purple-500">
              V: {sessionStats.avgVocab}%
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Points</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {sessionStats.totalScore}
          </p>
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Question Breakdown
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {questionResults.map((result, idx) => (
            <div
              key={idx}
              className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Q{result.questionNumber}: {result.english}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Expected: {result.expectedJapanese}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Your answer: {result.userAnswer}
                  </p>
                </div>
                <div className="text-right ml-4">
                  {(() => {
                    const g = result.gradeResult?.grades?.grammar || 0;
                    const v = result.gradeResult?.grades?.vocabulary || 0;
                    const avg = Math.round((g + v) / 2);
                    return (
                      <>
                        <p className={`text-2xl font-bold ${
                          avg >= 90 ? 'text-green-600 dark:text-green-400' :
                          avg >= 70 ? 'text-blue-600 dark:text-blue-400' :
                          avg >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {avg}%
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
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
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onExit}
          className="px-6 py-3 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
        >
          Back to Practice
        </button>
      </div>
    </div>
  );
}
