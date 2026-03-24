import { useEffect } from 'react';
import {
  FaArrowRight,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaRedo,
  FaCheck,
} from 'react-icons/fa';
import { FiEdit2 } from 'react-icons/fi';
import { toKana } from 'wanakana';
import KeyboardShortcutHint from './KeyboardShortcutHint';

/**
 * TypedResponseView - Shared presentational component for typed response questions
 *
 * Used across Quiz mode, SRS Learn-New, and SRS Due-Now flows for translation/typing questions.
 * Displays question, text input with automatic kana conversion (for Japanese), and provides
 * visual feedback for correct/incorrect answers with an "I was correct" retry option.
 *
 * @param {Object} currentItem - The current question item
 * @param {string} currentItem.question - Question text to display
 * @param {string} currentItem.answer - Correct answer
 * @param {string} currentItem.questionType - Type of question (e.g., "English", "Kana")
 * @param {string} currentItem.answerType - Type of answer (e.g., "Kana", "English")
 * @param {string} [currentItem.hint] - Optional hint text to display
 * @param {string} userAnswer - Current user input value
 * @param {boolean} showResult - Whether to show correct/incorrect feedback
 * @param {boolean} isCorrect - Whether the submitted answer is correct
 * @param {boolean} [showHint] - Whether to display the hint
 * @param {boolean} isLastQuestion - Whether this is the final question
 * @param {Object} inputRef - React ref for the input element (for auto-focus)
 * @param {function(Event): void} onInputChange - Callback when input value changes
 * @param {function(): void} onCheckAnswer - Callback to check/submit the answer
 * @param {function(): void} onNext - Callback to proceed to next question
 * @param {function(): void} onRetry - Callback for "I was correct" button (retracts incorrect answer)
 * @param {function(Object): void} [onEditItem] - Optional callback to edit current item
 * @param {boolean} [disableKeyboardShortcuts] - Temporarily disable Enter shortcut handling
 */
export default function TypedResponseView({
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
  onRetry,
  onEditItem,
  disableKeyboardShortcuts = false,
  questionDisplay,
  onSkipItem,
}) {
  // Auto-focus input when component loads or question changes
  useEffect(() => {
    if (currentItem && !showResult && inputRef?.current) {
      inputRef.current.focus();
    }
  }, [currentItem, showResult, inputRef]);

  // Global Enter key handler: submits first, then advances
  useEffect(() => {
    if (disableKeyboardShortcuts) return;

    const handleGlobalKeyDown = (e) => {
      if (e.key !== 'Enter' || e.shiftKey) return;
      e.preventDefault();

      if (!showResult) {
        if (userAnswer.trim()) {
          onCheckAnswer();
        }
      } else {
        onNext();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showResult, userAnswer, onCheckAnswer, onNext, disableKeyboardShortcuts]);

  if (!currentItem) return null;

  // Helper: does this question expect Kana?
  const expectsKana = (item) => item?.answerType === 'Kana';

  // Input change handler with conditional kana conversion
  const handleInputChange = (e) => {
    const raw = e.target.value;
    if (expectsKana(currentItem)) {
      // Convert romaji to kana in IME mode
      const convertedValue = toKana(raw, { IMEMode: true });
      // Create a synthetic event with converted value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: convertedValue,
        },
      };
      onInputChange(syntheticEvent);
    } else {
      onInputChange(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-0">
      <div className="w-full max-w-3xl">
        {/* Question Card */}
        <div className="relative bg-white dark:bg-white/10 rounded-2xl shadow-xl p-4 sm:p-8 mb-4 sm:mb-6">
          {showResult && onEditItem && currentItem?.uuid && (
            <button
              onClick={() => onEditItem(currentItem)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-sm transition-all text-xs sm:text-sm font-medium"
              title="Edit Item"
            >
              <span>Edit Item</span>
              <FiEdit2 className="w-4 h-4" />
            </button>
          )}

          {questionDisplay ? (
            questionDisplay
          ) : (
            <>
              <div className="mb-2 text-xs sm:text-sm text-gray-500 dark:text-white/50">
                {currentItem.questionType} → {currentItem.answerType}
              </div>

              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 text-gray-900 dark:text-white break-words">
                {currentItem.question}
              </div>
            </>
          )}

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
              onChange={handleInputChange}
              disabled={showResult}
              placeholder={
                expectsKana(currentItem)
                  ? 'Type in romaji: ka → か, shi → し, kyo → きょ'
                  : 'Type your answer...'
              }
              inputMode="text"
              autoComplete="off"
              autoCapitalize="off"
              className={`w-full px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg rounded-lg border-2 transition-all
                ${
                  showResult
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-white/20 bg-white dark:bg-white/5'
                }
                text-gray-900 dark:text-white
                placeholder-gray-400 dark:placeholder-white/40
                focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-transparent
                disabled:opacity-75`}
            />

            {showResult && (
              <div
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  isCorrect ? 'text-green-500' : 'text-red-500'
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

          {/* Result Feedback -- always renders worst-case content invisible for stable height */}
          <div className="relative">
            {/* Invisible layout always present to hold height */}
            <div
              className="p-3 sm:p-4 text-sm sm:text-base invisible"
              aria-hidden="true"
            >
              <div className="flex items-center gap-2 mb-2">
                <FaTimes />
                <span className="font-semibold">Incorrect</span>
              </div>
              <div className="text-xs sm:text-sm mb-2">
                The correct answer is:{' '}
                <span className="font-bold">{currentItem.answer}</span>
              </div>
              {/* Reserve space for item detail */}
              {currentItem.type === 'vocabulary' && (
                <div className="flex items-center gap-2 pt-2 border-t border-transparent text-xs sm:text-sm">
                  <span className="font-bold">
                    {currentItem.kanji || currentItem.kana}
                  </span>
                  {currentItem.kanji && <span>{currentItem.kana}</span>}
                  <span>·</span>
                  <span>{currentItem.english}</span>
                  {currentItem.lexical_category && (
                    <>
                      <span>·</span>
                      <span>{currentItem.lexical_category}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            {/* Visible feedback positioned on top */}
            <div
              className={`absolute top-0 left-0 right-0 p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
                !showResult
                  ? 'opacity-0'
                  : isCorrect
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              }`}
            >
              {isCorrect ? (
                <div>
                  <div className="flex items-center gap-2">
                    <FaCheck />
                    <span className="font-semibold">Correct!</span>
                  </div>
                  {/* Item detail on correct */}
                  {currentItem.type === 'vocabulary' && (
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 pt-2 mt-2 border-t border-green-200 dark:border-green-700/50 text-xs sm:text-sm text-green-700 dark:text-green-300/80">
                      <span className="font-bold">
                        {currentItem.kanji || currentItem.kana}
                      </span>
                      {currentItem.kanji && (
                        <span className="text-green-600 dark:text-green-400/70">
                          {currentItem.kana}
                        </span>
                      )}
                      <span className="opacity-40">·</span>
                      <span>{currentItem.english}</span>
                      {currentItem.lexical_category && (
                        <>
                          <span className="opacity-40">·</span>
                          <span className="opacity-70">
                            {currentItem.lexical_category}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FaTimes />
                    <span className="font-semibold">Incorrect</span>
                  </div>
                  <div className="text-xs sm:text-sm">
                    The correct answer is:{' '}
                    <span className="font-bold">{currentItem.answer}</span>
                  </div>
                  {/* Item detail on incorrect */}
                  {currentItem.type === 'vocabulary' && (
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 pt-2 mt-2 border-t border-red-200 dark:border-red-700/50 text-xs sm:text-sm text-red-700 dark:text-red-300/80">
                      <span className="font-bold">
                        {currentItem.kanji || currentItem.kana}
                      </span>
                      {currentItem.kanji && (
                        <span className="text-red-600 dark:text-red-400/70">
                          {currentItem.kana}
                        </span>
                      )}
                      <span className="opacity-40">·</span>
                      <span>{currentItem.english}</span>
                      {currentItem.lexical_category && (
                        <>
                          <span className="opacity-40">·</span>
                          <span className="opacity-70">
                            {currentItem.lexical_category}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4 min-h-[48px] sm:min-h-[52px]">
          {!showResult ? (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              {onSkipItem && (
                <button
                  onClick={onSkipItem}
                  className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors active:scale-95
                    border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900
                    dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700/60 dark:hover:text-white
                    focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2
                    focus:ring-offset-white dark:focus:ring-pink-400 dark:focus:ring-offset-gray-900"
                >
                  Not a valid card
                </button>
              )}
              <button
                onClick={onCheckAnswer}
                disabled={!userAnswer.trim()}
                className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  userAnswer.trim()
                    ? 'bg-brand-pink hover:bg-brand-pink-hover text-white active:scale-95'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed'
                }`}
              >
                Check Answer
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              {onSkipItem && (
                <button
                  onClick={onSkipItem}
                  className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors active:scale-95
                    border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900
                    dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700/60 dark:hover:text-white
                    focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2
                    focus:ring-offset-white dark:focus:ring-pink-400 dark:focus:ring-offset-gray-900"
                >
                  Not a valid card
                </button>
              )}
              {!isCorrect && (
                <button
                  onClick={onRetry}
                  className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors active:scale-95
                    border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900
                    dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700/60 dark:hover:text-white
                    focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2
                    focus:ring-offset-white dark:focus:ring-pink-400 dark:focus:ring-offset-gray-900"
                >
                  <FaRedo className="inline mr-2" />I was correct
                </button>
              )}

              {!isLastQuestion ? (
                <button
                  onClick={onNext}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all active:scale-95
                    flex items-center justify-center text-sm sm:text-base
                    bg-brand-pink hover:bg-brand-pink-hover text-white focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                >
                  Next Question
                  <FaArrowRight className="inline ml-2" />
                </button>
              ) : (
                <button
                  onClick={onNext}
                  className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all active:scale-95 text-sm sm:text-base ${
                    isCorrect
                      ? 'bg-brand-pink hover:bg-brand-pink-hover text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  View Results <FaArrowRight className="inline ml-2" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts */}
        <KeyboardShortcutHint
          className="mt-6 sm:mt-8"
          shortcuts={[{ key: 'Enter', label: 'Submit/Continue' }]}
        />
      </div>
    </div>
  );
}
