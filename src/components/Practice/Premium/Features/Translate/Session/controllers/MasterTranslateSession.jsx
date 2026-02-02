// Master Translate Session Controller
// Handles batch sentence generation and LLM-based grading

import { useState, useEffect, useRef } from "react";
import { toKana } from "wanakana";
import GradeResultView from "../views/GradeResultView";

export default function MasterTranslateSession({
  pools,              // { grammar: [...], vocab: [...] }
  focalPoints,        // { grammar: [...], vocab: [...] }
  sessionLength,      // 10 questions
  onQuestionCompleted,
  onSessionComplete,
  onGenerationSuccess,
  onGenerationError
}) {
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [gradeResult, setGradeResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // Current question derived from state
  const currentQuestion = allQuestions[currentQuestionIndex] || null;

  // Batch generate all questions on mount
  useEffect(() => {
    generateAllQuestions();
  }, []);

  // Batch generation - single API call for all questions
  const generateAllQuestions = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Build focal points array for batch generation
      const allFocalPoints = [
        ...focalPoints.grammar.map(fp => ({ type: 'grammar', item: fp })),
        ...focalPoints.vocab.map(fp => ({ type: 'vocabulary', item: fp }))
      ];

      const response = await fetch('/api/practice/translate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grammarPool: pools.grammar,
          vocabPool: pools.vocab,
          focalPoints: allFocalPoints,
          count: sessionLength
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      setAllQuestions(data.data.sentences);
      onGenerationSuccess?.();
    } catch (error) {
      console.error('Error generating questions:', error);
      const message = 'Failed to generate questions. Please try again.';
      setError(message);
      onGenerationError?.(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      inputRef.current?.focus();
      return;
    }

    setIsGrading(true);
    setError(null);

    try {
      // Call grading API
      const response = await fetch('/api/practice/translate/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          englishSentence: currentQuestion.english,
          expectedTranslation: currentQuestion.expectedJapanese,
          userTranslation: userAnswer,
          focalPoint: currentQuestion.focalPoint,
          context: { grammarPool: pools.grammar, vocabPool: pools.vocab }
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Grading failed');
      }

      setGradeResult(data.data);
      setShowResult(true);

      // Calculate if correct (score >= 70/100)
      const totalScore = Object.values(data.data.grades).reduce((sum, score) => sum + score, 0);
      const isCorrect = totalScore >= 70;

      // Notify parent
      onQuestionCompleted({
        questionNumber: currentQuestionIndex + 1,
        english: currentQuestion.english,
        expectedJapanese: currentQuestion.expectedJapanese,
        userAnswer: userAnswer,
        gradeResult: data.data,
        totalScore: totalScore,
        isCorrect: isCorrect
      });

    } catch (error) {
      console.error('Error grading answer:', error);
      setError('Failed to grade answer. Please try again.');
    } finally {
      setIsGrading(false);
    }
  };

  const handleNext = () => {
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex >= sessionLength) {
      // Session complete
      onSessionComplete();
    } else {
      // Move to next pre-generated question
      setCurrentQuestionIndex(nextIndex);
      setUserAnswer("");
      setGradeResult(null);
      setShowResult(false);
    }
  };

  // Handle input with wanakana conversion
  const handleInputChange = (e) => {
    const raw = e.target.value;
    const converted = toKana(raw, { IMEMode: true });
    setUserAnswer(converted);
  };

  // Handle Enter key for submit/next progression
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showResult) {
        handleNext();
      } else if (!isGrading && userAnswer.trim()) {
        handleSubmit();
      }
    }
  };

  const handleRetry = () => {
    // Override grade to perfect score
    const perfectGrade = {
      error_analysis: {},
      grades: {
        grammar_and_structure: 20,
        vocabulary_and_expression: 20,
        spelling_and_script_accuracy: 20,
        politeness_and_cultural_appropriateness: 20,
        fluency_and_naturalness: 20
      },
      feedback: "Marked correct by user override"
    };

    setGradeResult(perfectGrade);

    onQuestionCompleted({
      questionNumber: currentQuestionIndex + 1,
      english: currentQuestion.english,
      expectedJapanese: currentQuestion.expectedJapanese,
      userAnswer: userAnswer,
      gradeResult: perfectGrade,
      totalScore: 100,
      isCorrect: true,
      wasRetried: true
    });
  };

  // Render loading state
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e30a5f]"></div>
        <p className="mt-4 text-sm text-black/60 dark:text-white/60">
          Generating {sessionLength} practice sentences...
        </p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Generation Failed
        </h3>
        <p className="text-sm text-gray-600 dark:text-white/60 mb-6">
          {error || 'Something went wrong while generating practice sentences.'}
        </p>
        <button
          onClick={() => onGenerationError?.('Generation failed')}
          className="px-6 py-3 rounded-lg bg-[#e30a5f] text-white font-medium hover:opacity-90 transition-opacity"
        >
          Return to Practice
        </button>
      </div>
    );
  }

  // Shared action buttons used in both mobile and desktop layouts
  const actionButtons = (
    <>
      {!showResult ? (
        <button
          onClick={handleSubmit}
          disabled={isGrading || !userAnswer.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
                   bg-gradient-to-r from-[#e30a5f] to-[#f41567] hover:from-[#f41567] hover:to-[#e30a5f] text-white
                   disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isGrading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Grading...
            </>
          ) : (
            'Submit Translation'
          )}
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleRetry}
            className="flex-1 px-4 py-3 rounded-lg border-2 border-[#e30a5f] text-[#e30a5f] font-medium hover:bg-[#e30a5f]/10"
          >
            I Was Correct
          </button>
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-3 rounded-lg bg-[#e30a5f] text-white font-medium hover:opacity-90"
          >
            {currentQuestionIndex + 1 >= sessionLength ? 'Finish' : 'Next Question'}
          </button>
        </div>
      )}
    </>
  );

  const expectedAnswer = showResult && (
    <div className="mt-4 p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Expected Answer:</p>
      <p className="text-sm text-gray-900 dark:text-white">{currentQuestion.expectedJapanese}</p>
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-6">
      {/* Error Message */}
      {error && (
        <div className="lg:col-span-full mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-600 dark:text-red-400 underline mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Left Panel - Translation Area */}
      {/* Desktop: always visible | Mobile: hidden when showing results */}
      <div className={`bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-4 sm:p-6 ${showResult ? 'hidden lg:block' : 'block'}`}>
        {/* English Sentence */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-[#e30a5f] text-white rounded-full flex items-center justify-center text-sm">1</span>
            English Sentence
          </h2>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-lg text-gray-800 dark:text-white font-medium">
              {currentQuestion.english}
            </p>
          </div>
        </div>

        {/* User Translation Input */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-[#e30a5f] text-white rounded-full flex items-center justify-center text-sm">2</span>
            Your Translation
          </h2>
          <textarea
            ref={inputRef}
            value={userAnswer}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={showResult}
            className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg resize-none
                     bg-white dark:bg-[#0f1a1f] text-gray-900 dark:text-white
                     focus:border-[#e30a5f] dark:focus:border-[#e30a5f] focus:outline-none
                     disabled:bg-gray-100 dark:disabled:bg-white/5 disabled:cursor-not-allowed
                     placeholder-gray-400 dark:placeholder-gray-500"
            rows="3"
            placeholder="Type your Japanese translation here..."
          />
        </div>

        {/* Action Buttons & Expected Answer - Desktop only */}
        <div className="hidden lg:block">
          {actionButtons}
          {expectedAnswer}
        </div>

        {/* Action Buttons - Mobile only (submit state) */}
        {!showResult && (
          <div className="lg:hidden">
            {actionButtons}
          </div>
        )}
      </div>

      {/* Right Panel - Grading Results */}
      {/* Desktop: always visible | Mobile: hidden until results ready */}
      <div className={`bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-4 sm:p-6 ${showResult ? 'block' : 'hidden lg:block'} mt-4 lg:mt-0`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Grading Results
        </h2>

        {showResult && gradeResult ? (
          <>
            <GradeResultView gradeResult={gradeResult} />

            {/* Mobile-only: show user answer, expected answer & action buttons here */}
            <div className="lg:hidden mt-4 space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Your Answer:</p>
                <p className="text-sm text-gray-900 dark:text-white">{userAnswer}</p>
              </div>
              {expectedAnswer}
              <div>
                {actionButtons}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Submit your translation to see results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

