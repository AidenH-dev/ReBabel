// components/pages/academy/sets/SRSLearnNewSet/MultipleChoice/SRSMultipleChoice.jsx
import { FaArrowRight, FaTimesCircle } from "react-icons/fa";
import { BsCheckCircleFill } from "react-icons/bs";

export default function SRSMultipleChoice({
  currentItem,
  uniqueOptions,
  selectedOption,
  showResult,
  isCorrect,
  isTransitioning,
  isLastQuestion,
  onOptionSelect,
  onNext
}) {
  // Get option button style
  const getOptionStyle = (option) => {
    const baseStyle = "w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 font-medium text-sm sm:text-base";

    if (!showResult || isTransitioning) {
      // Before answer submission or during transition
      if (selectedOption === option && !isTransitioning) {
        return `${baseStyle} bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-gray-900 dark:text-white`;
      }
      return `${baseStyle} bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 active:scale-98`;
    } else {
      // After answer submission (compare trimmed values)
      if (option.trim() === currentItem.answer.trim()) {
        // Correct answer
        return `${baseStyle} bg-green-50 dark:bg-green-900/20 border-green-500 text-gray-900 dark:text-white`;
      } else if (selectedOption === option) {
        // Selected wrong answer
        return `${baseStyle} bg-red-50 dark:bg-red-900/20 border-red-500 text-gray-900 dark:text-white`;
      }
      // Other options
      return `${baseStyle} bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50`;
    }
  };

  // Get option icon
  const getOptionIcon = (option) => {
    if (!showResult || isTransitioning) return null;

    if (option.trim() === currentItem.answer.trim()) {
      return <BsCheckCircleFill className="text-green-500 text-lg sm:text-xl flex-shrink-0" />;
    } else if (selectedOption === option) {
      return <FaTimesCircle className="text-red-500 text-lg sm:text-xl flex-shrink-0" />;
    }
    return null;
  };

  // Safety check for invalid state
  if (!currentItem || !uniqueOptions || uniqueOptions.length < 1) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4">
        <div className="w-full max-w-3xl">
          <div className="bg-white dark:bg-white/10 rounded-2xl shadow-xl p-4 sm:p-8 mb-4 sm:mb-6">
            <div className="text-center text-gray-500 dark:text-white/50">
              Not enough valid options for this question. Please check the quiz data.
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4">
            <button
              onClick={onNext}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white active:scale-95"
            >
              {isLastQuestion ? "Start Translation" : "Skip Question"}
              <FaArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4">
      <div className="w-full max-w-3xl">
        {/* Question Card */}
        <div className="bg-white dark:bg-white/10 rounded-2xl shadow-xl p-4 sm:p-8 mb-4 sm:mb-6">
          {/* Question Type Badge */}
          <div className="mb-2 text-xs sm:text-sm text-gray-500 dark:text-white/50">
            {currentItem.questionType} → {currentItem.answerType}
          </div>

          {/* Question */}
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 text-gray-900 dark:text-white break-words">
            {currentItem.question}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {uniqueOptions.map((option, index) => (
              <button
                key={`${option}-${index}`}
                onClick={() => onOptionSelect(option)}
                disabled={showResult || isTransitioning}
                className={getOptionStyle(option)}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Option Number */}
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center font-bold text-gray-700 dark:text-white">
                    {index + 1}
                  </div>

                  {/* Option Text */}
                  <div className="flex-1 min-w-0">
                    {option}
                  </div>

                  {/* Result Icon */}
                  {getOptionIcon(option)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4">
          <button
            onClick={onNext}
            className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base flex items-center justify-center gap-2 ${
              showResult
                ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white active:scale-95 opacity-100"
                : "bg-transparent text-transparent pointer-events-none opacity-0"
            }`}
            disabled={!showResult}
          >
            {isLastQuestion ? "Start Translation" : "Next Question"}
            <FaArrowRight />
          </button>
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center text-xs sm:text-sm text-gray-500 dark:text-white/40">
          {!showResult ? "Select an answer to continue" : "Continue"}
        </div>
      </div>
    </div>
  );
}
