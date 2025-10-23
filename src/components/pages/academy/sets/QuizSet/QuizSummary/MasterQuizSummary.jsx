// components/MasterQuizSummary.jsx
import { FaCheckCircle, FaTimesCircle, FaRedo } from "react-icons/fa";

export default function MasterQuizSummary({
  sessionStats,
  quizItems, // Legacy - not used for count anymore
  answeredItems,
  animateAccuracy,
  onRetry,
  onExit
}) {
  // Calculate total questions from all answered items (includes all phases)
  const totalQuestions = answeredItems.length;
  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden lg:mr-10">
      {/* Left Side - Quiz Summary */}
      <div className="flex-1 flex items-center justify-center lg:justify-end lg:pr-3">
        <div className="w-full max-w-xl">
          <div className="bg-white dark:bg-white/10 rounded-2xl shadow-xl p-4 sm:p-8 h-auto lg:h-[500px]">
            <div className="flex flex-col h-full">
              <div className="text-center mb-3 sm:mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-2 sm:mb-3">
                  <FaCheckCircle className="text-white text-2xl sm:text-3xl" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Quiz Complete!
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-white/60">
                  Great job! Here&apos;s how you did:
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2 sm:p-3 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
                    {sessionStats.correct}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-white/60 flex items-center justify-center gap-1">
                    <FaCheckCircle className="text-green-500" />
                    Correct
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2 sm:p-3 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
                    {sessionStats.incorrect}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-white/60 flex items-center justify-center gap-1">
                    <FaTimesCircle className="text-red-500" />
                    Incorrect
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2 sm:p-3 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
                    {totalQuestions}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-white/60">
                    Total Questions
                  </div>
                </div>
              </div>

              {/* Animated Accuracy Bar with Liquid Effect */}
              <div className="mb-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-white/80">
                    Overall Accuracy
                  </span>
                  <span className="text-xl font-bold bg-gradient-to-r from-[#e30a5f] to-[#f41567] bg-clip-text text-transparent">
                    {sessionStats.accuracy}%
                  </span>
                </div>
                <div className="relative w-full h-6 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full relative overflow-hidden rounded-full transition-all duration-[1500ms] ease-out"
                    style={{ width: animateAccuracy ? `${sessionStats.accuracy}%` : '0%' }}
                  >
                    {/* Base gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#e30a5f] via-[#f41567] to-[#e30a5f]"></div>

                    {/* Liquid wave effect */}
                    <div
                      className="absolute inset-0 opacity-40"
                      style={{
                        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.8) 0%, transparent 70%)',
                        animation: 'liquid 3s ease-in-out infinite'
                      }}
                    ></div>

                    {/* Shimmer overlay */}
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      style={{
                        animation: 'shimmer 2s infinite linear'
                      }}
                    ></div>

                    {/* Bubble effects */}
                    <div
                      className="absolute bottom-0 left-1/4 w-2 h-2 bg-white/50 rounded-full"
                      style={{
                        animation: 'bubble1 4s ease-in-out infinite'
                      }}
                    ></div>
                    <div
                      className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-white/40 rounded-full"
                      style={{
                        animation: 'bubble2 5s ease-in-out infinite 1s'
                      }}
                    ></div>
                    <div
                      className="absolute bottom-0 left-3/4 w-2.5 h-2.5 bg-white/30 rounded-full"
                      style={{
                        animation: 'bubble3 3.5s ease-in-out infinite 0.5s'
                      }}
                    ></div>
                  </div>
                </div>
                <style jsx>{`
                  @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                  }
                  @keyframes liquid {
                    0%, 100% { transform: translateX(-10%) translateY(0) scale(1); }
                    25% { transform: translateX(10%) translateY(-5%) scale(1.1); }
                    50% { transform: translateX(-5%) translateY(5%) scale(0.9); }
                    75% { transform: translateX(15%) translateY(-3%) scale(1.05); }
                  }
                  @keyframes bubble1 {
                    0% { transform: translateY(0) scale(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 0.8; }
                    100% { transform: translateY(-24px) scale(1); opacity: 0; }
                  }
                  @keyframes bubble2 {
                    0% { transform: translateY(0) scale(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 0.6; }
                    100% { transform: translateY(-24px) scale(1.2); opacity: 0; }
                  }
                  @keyframes bubble3 {
                    0% { transform: translateY(0) scale(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 0.5; }
                    100% { transform: translateY(-24px) scale(0.8); opacity: 0; }
                  }
                `}</style>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
                <button
                  onClick={onRetry}
                  className="flex-1 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all active:scale-95 text-sm sm:text-base"
                >
                  <FaRedo className="inline mr-2" />
                  Retry Quiz
                </button>
                <button
                  onClick={onExit}
                  className="flex-1 px-4 py-2.5 bg-[#e30a5f] hover:bg-[#f41567] text-white rounded-lg font-medium transition-all active:scale-95 text-sm sm:text-base"
                >
                  Back to Study Set
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Question Breakdown (Scrollable) */}
      <div className="w-full lg:w-1/4 flex items-center mt-4 lg:mt-0">
        <div className="bg-white dark:bg-white/10 rounded-2xl shadow-xl p-3 sm:p-4 flex flex-col w-full h-auto max-h-[300px] lg:h-[500px] lg:max-h-none">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
            Question Breakdown
          </h3>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 sm:pr-2">
            {answeredItems.map((item, index) => (
              <div
                key={index}
                className={`p-2.5 rounded-lg border ${
                  item.isCorrect
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      {item.isCorrect ? (
                        <FaCheckCircle className="text-green-500 flex-shrink-0" style={{ fontSize: '10px' }} />
                      ) : (
                        <FaTimesCircle className="text-red-500 flex-shrink-0" style={{ fontSize: '10px' }} />
                      )}
                      <span className="text-xs text-gray-500 dark:text-white/50">
                        {item.questionType} → {item.answerType}
                      </span>
                    </div>
                    <div className="mb-1">
                      <span className="text-xs text-gray-600 dark:text-white/60">Q: </span>
                      <span className="font-semibold text-xs text-gray-900 dark:text-white">
                        {item.question}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {!item.isCorrect && (
                        <div>
                          <span className="text-xs text-gray-600 dark:text-white/60">You: </span>
                          <span className="text-xs text-red-600 dark:text-red-400 line-through">
                            {item.userAnswer}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-gray-600 dark:text-white/60">
                          {item.isCorrect ? 'You: ' : 'Answer: '}
                        </span>
                        <span className={`font-medium text-xs ${
                          item.isCorrect
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {item.correctAnswer}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}