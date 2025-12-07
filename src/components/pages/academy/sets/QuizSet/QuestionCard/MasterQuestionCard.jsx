// /components/pages/academy/sets/QuizSet/QuestionCard/MasterQuestionCard.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import TypedResponseView from "@/components/Set/Features/Field-Card-Session/shared/views/TypedResponseView.jsx";

export default function MasterQuestionCard({
  quizItems,
  currentIndex,
  onAnswerSubmitted,
  onNext,
  onComplete
}) {
  const inputRef = useRef(null);

  // Derived values
  const currentItem = quizItems[currentIndex];
  const totalQuestions = quizItems.length;
  const isLastQuestion = currentIndex === quizItems.length - 1;

  // Local state for question interaction
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Focus input when question changes
  useEffect(() => {
    if (!showResult && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, showResult]);

  // Reset state when question changes
  useEffect(() => {
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
    setShowHint(false);
  }, [currentIndex]);

  // Check answer handler
  const handleCheckAnswer = useCallback(() => {
    if (!userAnswer.trim()) return;

    const processedAnswer = userAnswer.trim();

    // Normalize for comparison (remove spaces, lowercase for English)
    const normalizedUserAnswer =
      currentItem.answerType === "English"
        ? processedAnswer.toLowerCase().replace(/\s+/g, "")
        : processedAnswer.replace(/\s+/g, "");

    const normalizedCorrectAnswer =
      currentItem.answerType === "English"
        ? currentItem.answer.toLowerCase().replace(/\s+/g, "")
        : currentItem.answer.replace(/\s+/g, "");

    const correct = normalizedUserAnswer === normalizedCorrectAnswer;

    setIsCorrect(correct);
    setShowResult(true);

    // Single callback with all answer data
    onAnswerSubmitted({
      itemId: currentItem.id,
      question: currentItem.question,
      userAnswer: processedAnswer,
      correctAnswer: currentItem.answer,
      isCorrect: correct,
      questionType: currentItem.questionType,
      answerType: currentItem.answerType
    });

    // Log to console
    console.log(`Quiz Item: ${currentItem.id}`, {
      question: currentItem.question,
      correctAnswer: currentItem.answer,
      userAnswer: userAnswer,
      result: correct ? "PASSED" : "FAILED"
    });
  }, [userAnswer, currentItem, onAnswerSubmitted]);

  // Handle next question
  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      onComplete();
    } else {
      onNext();
    }
  }, [isLastQuestion, onNext, onComplete]);

  // Handle retry - "I was correct" button
  const handleRetry = () => {
    // Notify parent to retract the last answer
    onAnswerSubmitted({
      itemId: currentItem.id,
      isRetraction: true
    });

    // Reset UI to allow re-answering
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
  };

  // Input change handler
  const handleInputChange = (e) => {
    setUserAnswer(e.target.value);
  };

  // Render using shared TypedResponseView component
  return (
    <TypedResponseView
      currentItem={currentItem}
      userAnswer={userAnswer}
      showResult={showResult}
      isCorrect={isCorrect}
      showHint={showHint}
      isLastQuestion={isLastQuestion}
      inputRef={inputRef}
      onInputChange={handleInputChange}
      onCheckAnswer={handleCheckAnswer}
      onNext={handleNext}
      onRetry={handleRetry}
    />
  );
}