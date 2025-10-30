// components/pages/academy/sets/SRSLearnNewSet/ReviewCards/SRSReviewCards.jsx
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";

export default function SRSReviewCards({
  currentCard,
  isLastCard,
  isFirstCard,
  onNext,
  onPrevious
}) {
  if (!currentCard) return null;

  return (
    <div className="flex-1 flex flex-col items-center px-2 sm:px-4 min-h-0">
      <div className="w-full max-w-3xl flex flex-col min-h-0 flex-1 py-4">

        {/* Card Content - Scrollable */}
        <div className="bg-white dark:bg-white/10 rounded-2xl shadow-xl p-6 sm:p-8 mb-4 sm:mb-6 overflow-y-auto flex-1 min-h-0">
          {currentCard.type === "vocabulary" ? (
            /* Vocabulary Card */
            <div>
              {/* Type Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs sm:text-sm font-medium mb-4">
                <IoSparkles className="text-sm" />
                Vocabulary
              </div>

              {/* Main Content */}
              <div className="space-y-4 sm:space-y-6">
                {/* Kanji (if exists) */}
                {currentCard.kanji && (
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-1">
                      Kanji
                    </div>
                    <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
                      {currentCard.kanji}
                    </div>
                  </div>
                )}

                {/* Kana */}
                <div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-1">
                    Reading
                  </div>
                  <div className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white/90">
                    {currentCard.kana}
                  </div>
                </div>

                {/* English */}
                <div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-1">
                    Meaning
                  </div>
                  <div className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white">
                    {currentCard.english}
                  </div>
                </div>

                {/* Lexical Category */}
                {currentCard.lexical_category && (
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-1">
                      Type
                    </div>
                    <div className="inline-block px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-sm text-gray-700 dark:text-white/80">
                      {currentCard.lexical_category}
                    </div>
                  </div>
                )}

                {/* Example Sentences */}
                {currentCard.example_sentences && currentCard.example_sentences.length > 0 && (
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-2">
                      Example Sentences
                    </div>
                    <div className="space-y-2">
                      {currentCard.example_sentences.slice(0, 3).map((sentence, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg text-sm sm:text-base text-gray-700 dark:text-white/80"
                        >
                          {sentence}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Grammar Card */
            <div>
              {/* Type Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs sm:text-sm font-medium mb-4">
                <IoSparkles className="text-sm" />
                Grammar
              </div>

              {/* Main Content */}
              <div className="space-y-4 sm:space-y-6">
                {/* Grammar Pattern */}
                <div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-1">
                    Pattern
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white break-words">
                    {currentCard.title}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-1">
                    Meaning / Usage
                  </div>
                  <div className="text-lg sm:text-xl text-gray-800 dark:text-white/90">
                    {currentCard.description}
                  </div>
                </div>

                {/* Topic */}
                {currentCard.topic && (
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-1">
                      Topic
                    </div>
                    <div className="inline-block px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-sm text-gray-700 dark:text-white/80">
                      {currentCard.topic}
                    </div>
                  </div>
                )}

                {/* Example Sentences */}
                {currentCard.example_sentences && currentCard.example_sentences.length > 0 && (
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mb-2">
                      Examples
                    </div>
                    <div className="space-y-2">
                      {currentCard.example_sentences.slice(0, 3).map((sentence, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg text-sm sm:text-base text-gray-700 dark:text-white/80"
                        >
                          {sentence}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 flex-shrink-0">
          {/* Previous Button */}
          <button
            onClick={onPrevious}
            disabled={isFirstCard}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base flex items-center gap-2 ${
              isFirstCard
                ? "bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed"
                : "bg-gray-600 hover:bg-gray-700 text-white active:scale-95"
            }`}
          >
            <FaArrowLeft />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Card Counter */}
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-500 dark:text-white/50">
              {isLastCard ? "Ready to start quiz?" : "Keep studying"}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={onNext}
            className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all active:scale-95 text-sm sm:text-base flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <span>{isLastCard ? "Start Quiz" : "Next"}</span>
            <FaArrowRight />
          </button>
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center text-xs sm:text-sm text-gray-500 dark:text-white/40 flex-shrink-0">
          Take your time to review each card before starting the quiz
        </div>
      </div>
    </div>
  );
}
