import { useState, useRef, useEffect, useCallback } from 'react';
import TypedResponseView from '@/components/Set/Features/Field-Card-Session/shared/views/TypedResponseView';
import { FiEdit2 } from 'react-icons/fi';
import { FaTimes } from 'react-icons/fa';

export default function MasterConjugationCard({
  questions,
  currentIndex,
  onAnswerSubmitted,
  onNext,
  onComplete,
  onEditItem,
  onSkipItem,
}) {
  const inputRef = useRef(null);

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
  }, [currentIndex]);

  // Check answer: exact kana match against acceptableAnswers
  const handleCheckAnswer = useCallback(() => {
    if (!userAnswer.trim()) return;

    const trimmed = userAnswer.trim();
    const correct = question.acceptableAnswers.some(
      (acceptable) => trimmed === acceptable
    );

    setIsCorrect(correct);
    setShowResult(true);

    onAnswerSubmitted({
      isCorrect: correct,
      question: question.word.kanji || question.word.kana,
      userAnswer: trimmed,
      correctAnswer: question.expectedAnswer,
      questionType: `${question.form.label} (${question.form.japanese})`,
      answerType: 'Kana',
    });
  }, [userAnswer, question, onAnswerSubmitted]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      onComplete();
    } else {
      onNext();
    }
  }, [isLastQuestion, onNext, onComplete]);

  // Handle retry - "I was correct"
  const handleRetry = () => {
    onAnswerSubmitted({
      isRetraction: true,
    });
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
  };

  const handleInputChange = (e) => {
    setUserAnswer(e.target.value);
  };

  // Build the currentItem shape that TypedResponseView expects
  const currentItem = {
    question: question.word.kana,
    answer: question.expectedAnswer,
    answerType: 'Kana',
    questionType: 'Conjugation',
  };

  // Custom question display with kanji/kana/english and form badge
  const questionDisplay = (
    <div className="text-center mb-6 sm:mb-8">
      {/* Target form badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-pink/10 text-brand-pink text-sm font-medium mb-4">
        Conjugate to: {question.form.label} ({question.form.japanese})
      </div>
      {/* Word display */}
      {question.word.kanji ? (
        <>
          <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-1">
            {question.word.kanji}
          </div>
          <div className="text-lg text-gray-500 dark:text-white/50">
            {question.word.kana}
          </div>
        </>
      ) : (
        <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
          {question.word.kana}
        </div>
      )}
      <div className="text-sm text-gray-400 dark:text-white/40 mt-2">
        {question.word.english}
      </div>
      {/* Edit label -- always rendered for stable height, visibility toggled */}
      <div
        className={`flex items-center justify-center mt-3 ${showResult ? '' : 'invisible'}`}
      >
        {onEditItem && (
          <button
            onClick={() => onEditItem(question)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-xs font-medium"
            title="Edit word category"
            tabIndex={showResult ? 0 : -1}
          >
            <FiEdit2 className="w-3.5 h-3.5" />
            Edit Label
          </button>
        )}
      </div>
    </div>
  );

  return (
    <TypedResponseView
      currentItem={currentItem}
      userAnswer={userAnswer}
      showResult={showResult}
      isCorrect={isCorrect}
      showHint={false}
      isLastQuestion={isLastQuestion}
      inputRef={inputRef}
      onInputChange={handleInputChange}
      onCheckAnswer={handleCheckAnswer}
      onNext={handleNext}
      onRetry={handleRetry}
      questionDisplay={questionDisplay}
      onSkipItem={onSkipItem ? () => onSkipItem(question) : undefined}
    />
  );
}
