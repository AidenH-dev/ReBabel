import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { TbAlertCircle } from 'react-icons/tb';
import { FiCheckCircle } from 'react-icons/fi';
import SignupCTA from '@/components/Conjugation/Public/SignupCTA';

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
        <div className="bg-white dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-6">
          {/* Completion Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-1">
              <FiCheckCircle className="w-9 h-9 sm:w-11 sm:h-11 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  Session Complete!
                </h2>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                  JLPT N{level} Conjugation Practice
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2 text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {sessionStats.correct}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium flex items-center justify-center gap-1">
                <FaCheckCircle
                  className="text-green-500"
                  style={{ fontSize: 8 }}
                />
                Correct
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2 text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {sessionStats.incorrect}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium flex items-center justify-center gap-1">
                <FaTimesCircle
                  className="text-red-400"
                  style={{ fontSize: 8 }}
                />
                Incorrect
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2 text-center">
              <div className="text-lg font-bold text-brand-pink">
                {sessionStats.accuracy}%
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                Accuracy
              </div>
            </div>
          </div>

          {/* Accuracy bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Overall Accuracy
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-pink to-[#c1084d] transition-all duration-[1500ms] ease-out"
                style={{
                  width: animateAccuracy ? `${sessionStats.accuracy}%` : '0%',
                }}
              />
            </div>
          </div>

          <button
            onClick={onPracticeAgain}
            className="w-full px-4 py-2.5 rounded-lg font-medium text-sm text-white transition-all active:scale-95 bg-gradient-to-r from-brand-pink to-[#c1084d] hover:brightness-110"
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
        <div className="bg-white dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 p-3 sm:p-4 max-h-[400px] lg:max-h-[600px] overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
            Question Breakdown
          </h3>
          <div className="space-y-1.5">
            {answeredItems.map((item, i) => (
              <div
                key={i}
                className={`rounded-md border px-2.5 py-2 text-xs transition-colors ${
                  item.isNearMiss
                    ? 'border-yellow-300/70 dark:border-yellow-500/20 bg-yellow-50/60 dark:bg-yellow-400/5'
                    : item.isCorrect
                      ? 'border-green-300/70 dark:border-green-500/20 bg-green-50/60 dark:bg-green-500/5'
                      : 'border-red-300/70 dark:border-red-400/20 bg-red-50/60 dark:bg-red-400/5'
                }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  {item.isNearMiss ? (
                    <TbAlertCircle
                      className="text-yellow-500"
                      style={{ fontSize: 9 }}
                    />
                  ) : item.isCorrect ? (
                    <FaCheckCircle
                      className="text-green-500"
                      style={{ fontSize: 9 }}
                    />
                  ) : (
                    <FaTimesCircle
                      className="text-red-400"
                      style={{ fontSize: 9 }}
                    />
                  )}
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {item.questionType}
                  </span>
                </div>
                <div className="text-[11px]">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    Q:{' '}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {item.question}
                  </span>
                </div>
                {item.isNearMiss && (
                  <div className="text-[11px] mt-0.5">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      You:{' '}
                    </span>
                    <span className="text-yellow-600 dark:text-yellow-400">
                      {item.userAnswer}
                    </span>
                  </div>
                )}
                {!item.isCorrect && (
                  <div className="text-[11px] mt-0.5">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      You:{' '}
                    </span>
                    <span className="text-red-500 dark:text-red-400 line-through">
                      {item.userAnswer}
                    </span>
                  </div>
                )}
                <div className="text-[11px] mt-0.5">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {item.isNearMiss
                      ? 'Correct: '
                      : item.isCorrect
                        ? 'You: '
                        : 'Answer: '}
                  </span>
                  <span
                    className={`font-medium ${
                      item.isNearMiss
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : item.isCorrect
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {item.isNearMiss
                      ? item.correctAnswer
                      : item.isCorrect
                        ? item.userAnswer
                        : item.correctAnswer}
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
