// /components/pages/academy/sets/SRSLearnNewSet/QuestionCard/SRSQuestionCard.jsx
import {
  FaArrowRight,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaKeyboard,
  FaRedo,
  FaCheck
} from "react-icons/fa";

export default function SRSQuestionCard({
  currentItem,
  userAnswer,
  showResult,
  isCorrect,
  showHint,
  isLastQuestion,
  inputRef,
  onInputChange,
  onCheckAnswer,
  onNext,
  onRetry
}) {
  if (!currentItem) return null;

  // Helper: does this question expect Kana?
  const expectsKana = (item) => item?.answerType === "Kana";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-0">
      <div className="w-full max-w-3xl">
        {/* Question Card */}
        <div className="bg-white dark:bg-white/10 rounded-2xl shadow-xl p-4 sm:p-8 mb-4 sm:mb-6">
          <div className="mb-2 text-xs sm:text-sm text-gray-500 dark:text-white/50">
            {currentItem.questionType} → {currentItem.answerType}
          </div>

          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 text-gray-900 dark:text-white break-words">
            {currentItem.question}
          </div>

          {showHint && currentItem.hint && (
            <div className="text-center text-sm sm:text-base text-gray-600 dark:text-white/60 mb-3 sm:mb-4">
              Hint: {currentItem.hint}
            </div>
          )}

          {/* Answer Input */}
          <div className="relative mb-6 sm:mb-8">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={onInputChange}
              disabled={showResult}
              placeholder={
                expectsKana(currentItem)
                  ? "Type in romaji: ka → か, shi → し, kyo → きょ"
                  : "Type your answer..."
              }
              inputMode="text"
              autoComplete="off"
              className={`w-full px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg rounded-lg border-2 transition-all
                ${
                  showResult
                    ? isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-300 dark:border-white/20 bg-white dark:bg-white/5"
                }
                text-gray-900 dark:text-white
                placeholder-gray-400 dark:placeholder-white/40
                focus:outline-none focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent
                disabled:opacity-75`}
            />

            {showResult && (
              <div
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  isCorrect ? "text-green-500" : "text-red-500"
                }`}
              >
                {isCorrect ? (
                  <FaCheckCircle size={20} className="sm:w-6 sm:h-6" />
                ) : (
                  <FaTimesCircle size={20} className="sm:w-6 sm:h-6" />
                )}
              </div>
            )}
          </div>

          {/* Result Feedback */}
          <div className="min-h-[80px] sm:min-h-[96px]">
            {showResult && (
              <div
                className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
                  isCorrect
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                    : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                }`}
              >
                {isCorrect ? (
                  <div className="flex items-center gap-2">
                    <FaCheck />
                    <span className="font-semibold">Correct!</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FaTimes />
                      <span className="font-semibold">Incorrect</span>
                    </div>
                    <div className="text-xs sm:text-sm">
                      The correct answer is:{" "}
                      <span className="font-bold">{currentItem.answer}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4">
          {!showResult ? (
            <button
              onClick={onCheckAnswer}
              disabled={!userAnswer.trim()}
              className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                userAnswer.trim()
                  ? "bg-[#e30a5f] hover:bg-[#f41567] text-white active:scale-95"
                  : "bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed"
              }`}
            >
              Check Answer
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              {!isCorrect && (
                <button
                  onClick={onRetry}
                  className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors active:scale-95
                    border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900
                    dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700/60 dark:hover:text-white
                    focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2
                    focus:ring-offset-white dark:focus:ring-pink-400 dark:focus:ring-offset-gray-900"
                >
                  <FaRedo className="inline mr-2" />
                  I was correct
                </button>
              )}

              {!isLastQuestion ? (
                <button
                  onClick={onNext}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all active:scale-95
                    flex items-center justify-center text-sm sm:text-base
                    bg-[#e30a5f] hover:bg-[#f41567] text-white focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                >
                  Next Question
                  <FaArrowRight className="inline ml-2" />
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all active:scale-95 text-sm sm:text-base ${
                    isCorrect
                      ? "bg-[#e30a5f] hover:bg-[#f41567] text-white"
                      : "bg-gray-600 hover:bg-gray-700 text-white"
                  }`}
                >
                  View Results <FaArrowRight className="inline ml-2" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-gray-500 dark:text-white/40">
          <span className="flex items-center gap-2">
            <FaKeyboard /> <span className="hidden sm:inline">Keyboard shortcuts:</span>
          </span>
          <span>Enter: Submit/Continue</span>
        </div>
      </div>
    </div>
  );
}
