import { useState, useRef, useEffect, useCallback } from 'react';
import TypedResponseView from '@/components/Set/Features/Field-Card-Session/shared/views/TypedResponseView';

export default function PublicConjugationCard({
  questions,
  currentIndex,
  onAnswerSubmitted,
  onNext,
  onComplete,
}) {
  const inputRef = useRef(null);
  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
  }, [currentIndex]);

  const handleCheckAnswer = useCallback(() => {
    if (!userAnswer.trim()) return;
    const trimmed = userAnswer.trim();
    const correct = question.acceptableAnswers.some((a) => trimmed === a);
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
    if (isLastQuestion) onComplete();
    else onNext();
  }, [isLastQuestion, onNext, onComplete]);

  const handleRetry = () => {
    onAnswerSubmitted({ isRetraction: true });
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
  };

  const currentItem = {
    question: question.word.kana,
    answer: question.expectedAnswer,
    answerType: 'Kana',
    questionType: 'Conjugation',
  };

  const questionDisplay = (
    <div className="text-center mb-6 sm:mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e30a5f]/10 text-[#e30a5f] text-sm font-medium mb-4">
        Conjugate to: {question.form.label} ({question.form.japanese})
      </div>
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
      {/* Invisible placeholder for stable height */}
      <div className="invisible mt-3 px-3 py-1.5 text-xs">placeholder</div>
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
      onInputChange={(e) => setUserAnswer(e.target.value)}
      onCheckAnswer={handleCheckAnswer}
      onNext={handleNext}
      onRetry={handleRetry}
      questionDisplay={questionDisplay}
    />
  );
}
