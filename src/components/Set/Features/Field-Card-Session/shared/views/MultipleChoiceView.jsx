import { useEffect } from "react";
import { FaArrowRight, FaTimesCircle } from "react-icons/fa";
import { BsCheckCircleFill } from "react-icons/bs";
import KeyboardShortcutHint from "./KeyboardShortcutHint";

/**
 * MultipleChoiceView - Shared presentational component for multiple choice questions
 *
 * Used across Quiz mode, SRS Learn-New, and SRS Due-Now flows.
 * Displays question, answer options in a 2x2 grid, and provides visual feedback for correct/incorrect answers.
 *
 * @param {Object} currentItem - The current question item
 * @param {string} currentItem.question - Question text to display
 * @param {string} currentItem.answer - Correct answer
 * @param {string} currentItem.questionType - Type of question (e.g., "English", "Kana")
 * @param {string} currentItem.answerType - Type of answer (e.g., "Kana", "English")
 * @param {string[]} uniqueOptions - Array of answer options (correct answer + distractors)
 * @param {string|null} selectedOption - Currently selected option
 * @param {boolean} showResult - Whether to show correct/incorrect feedback
 * @param {boolean} isCorrect - Whether the selected answer is correct
 * @param {boolean} [isTransitioning] - Whether component is transitioning to next question
 * @param {boolean} isLastQuestion - Whether this is the final question
 * @param {function(string): void} onOptionSelect - Callback when option is selected
 * @param {function(): void} onNext - Callback to proceed to next question
 */

export default function MultipleChoiceView({
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
  // Keyboard shortcuts: 1-4 for options, Enter for next
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent keyboard shortcuts if transitioning
      if (isTransitioning) return;

      // Number keys 1-4 to select options (only when result not shown)
      if (!showResult && uniqueOptions && uniqueOptions.length > 0) {
        const key = e.key;
        if (['1', '2', '3', '4'].includes(key)) {
          const index = parseInt(key, 10) - 1;
          if (index < uniqueOptions.length) {
            onOptionSelect(uniqueOptions[index]);
          }
        }
      }

      // Enter key to proceed to next question (only when result is shown)
      if (showResult && e.key === 'Enter') {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult, isTransitioning, uniqueOptions, onOptionSelect, onNext]);

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

        {/* Keyboard Shortcuts */}
        <KeyboardShortcutHint
          className="mt-6"
          shortcuts={
            !showResult
              ? [{ key: "1-4", label: "Select answer" }]
              : [{ key: "Enter", label: "Continue" }]
          }
        />
      </div>
    </div>
  );
}
