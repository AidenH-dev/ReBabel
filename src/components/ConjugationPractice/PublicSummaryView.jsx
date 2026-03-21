import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import SignupCTA from './SignupCTA';

export default function PublicSummaryView({
  sessionStats,
  answeredItems,
  animateAccuracy,
  onPracticeAgain,
  level,
}) {
  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 max-w-5xl mx-auto w-full">
      {/* Left: Summary */}
      <div className="flex-1">
        <div className="bg-white dark:bg-white/10 rounded-2xl shadow-xl p-4 sm:p-8">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-3">
              <FaCheckCircle className="text-white text-2xl" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Session Complete!
            </h2>
            <p className="text-sm text-gray-600 dark:text-white/60">
              JLPT N{level} Conjugation Practice
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {sessionStats.correct}
              </div>
              <div className="text-xs text-gray-600 dark:text-white/60 flex items-center justify-center gap-1">
                <FaCheckCircle className="text-green-500" /> Correct
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {sessionStats.incorrect}
              </div>
              <div className="text-xs text-gray-600 dark:text-white/60 flex items-center justify-center gap-1">
                <FaTimesCircle className="text-red-500" /> Incorrect
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {answeredItems.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-white/60">
                Total
              </div>
            </div>
          </div>

          {/* Accuracy bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700 dark:text-white/80">
                Accuracy
              </span>
              <span className="text-lg font-bold text-[#e30a5f]">
                {sessionStats.accuracy}%
              </span>
            </div>
            <div className="w-full h-5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#e30a5f] to-[#f41567] transition-all duration-[1500ms] ease-out"
                style={{
                  width: animateAccuracy ? `${sessionStats.accuracy}%` : '0%',
                }}
              />
            </div>
          </div>

          <button
            onClick={onPracticeAgain}
            className="w-full px-4 py-2.5 bg-[#e30a5f] hover:bg-[#f41567] text-white rounded-lg font-medium transition-all text-sm"
          >
            Practice Again
          </button>
        </div>

        {/* CTA */}
        <div className="mt-4">
          <SignupCTA compact />
        </div>
      </div>

      {/* Right: Question Breakdown */}
      <div className="w-full lg:w-1/3">
        <div className="bg-white dark:bg-white/10 rounded-2xl shadow-xl p-3 sm:p-4 max-h-[400px] lg:max-h-[600px] overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Question Breakdown
          </h3>
          <div className="space-y-1.5">
            {answeredItems.map((item, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-lg border ${
                  item.isCorrect
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {item.isCorrect ? (
                    <FaCheckCircle
                      className="text-green-500"
                      style={{ fontSize: 10 }}
                    />
                  ) : (
                    <FaTimesCircle
                      className="text-red-500"
                      style={{ fontSize: 10 }}
                    />
                  )}
                  <span className="text-xs text-gray-500 dark:text-white/50">
                    {item.questionType}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-600 dark:text-white/60">Q: </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {item.question}
                  </span>
                </div>
                {!item.isCorrect && (
                  <div className="text-xs mt-0.5">
                    <span className="text-gray-600 dark:text-white/60">
                      You:{' '}
                    </span>
                    <span className="text-red-600 dark:text-red-400 line-through">
                      {item.userAnswer}
                    </span>
                  </div>
                )}
                <div className="text-xs mt-0.5">
                  <span className="text-gray-600 dark:text-white/60">
                    {item.isCorrect ? 'You: ' : 'Answer: '}
                  </span>
                  <span
                    className={`font-medium ${item.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'}`}
                  >
                    {item.isCorrect ? item.userAnswer : item.correctAnswer}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
