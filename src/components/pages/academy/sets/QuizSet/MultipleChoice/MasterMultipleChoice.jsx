// components/pages/academy/sets/QuizSet/MultipleChoice/MasterMultipleChoice.jsx
import { useState, useEffect, useMemo } from "react";
import MultipleChoiceView from "@/components/Set/Features/Field-Card-Session/shared/views/MultipleChoiceView.jsx";

export default function MasterMultipleChoice({
    quizItems,
    currentIndex,
    onAnswerSubmitted,
    onNext,
    onComplete
}) {
    // Initialize all hooks at the top level (before any conditional returns)
    const [selectedOption, setSelectedOption] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Calculate current item - safe to do before early return
    const currentItem = quizItems && quizItems.length > 0 ? quizItems[currentIndex] : null;
    const isLastQuestion = quizItems ? currentIndex === quizItems.length - 1 : false;

    // Generate unique options from quiz items with matching question/answer types
    const uniqueOptions = useMemo(() => {
        if (!quizItems || quizItems.length === 0 || !currentItem || !currentItem.answer) {
            return [];
        }

        // Get the correct answer (trimmed)
        const correctAnswer = currentItem.answer.trim();

        // Filter quiz items to only those with matching questionType and answerType
        const matchingItems = quizItems.filter(item =>
            item.questionType === currentItem.questionType &&
            item.answerType === currentItem.answerType &&
            item.answer &&
            item.answer.trim() !== correctAnswer // Exclude the current item's answer
        );

        // Collect all possible answers from matching items (as distractors)
        const allAnswers = matchingItems
            .map(item => item.answer.trim())
            .filter(answer => answer); // Remove any empty strings

        // Remove duplicates from distractors
        const uniqueDistractors = [...new Set(allAnswers)];

        // Shuffle the distractors
        const shuffled = uniqueDistractors.sort(() => Math.random() - 0.5);

        // Determine how many distractors we need (target 4 total options, or minimum 2)
        const targetTotal = 4;
        const neededDistractors = Math.min(shuffled.length, targetTotal - 1);

        // If we don't have enough unique distractors for at least 2 options total
        if (neededDistractors < 1) {
            return [correctAnswer];
        }

        // Take the needed number of distractors
        const selectedDistractors = shuffled.slice(0, neededDistractors);

        // Combine correct answer with distractors
        const allOptions = [correctAnswer, ...selectedDistractors];

        // Shuffle all options so correct answer isn't always first
        return allOptions.sort(() => Math.random() - 0.5);
    }, [currentItem, quizItems]);

    // Reset state when question changes
    useEffect(() => {
        // Immediately reset all state
        setSelectedOption(null);
        setShowResult(false);
        setIsCorrect(false);
        setIsTransitioning(false);
    }, [currentIndex]);

    // Safety check for quizItems - now after all hooks
    if (!quizItems || quizItems.length === 0) {
        return null;
    }

    // Handle option selection and immediately check answer
    const handleOptionSelect = (option) => {
        if (showResult) return; // Prevent selection after answer is submitted
        
        setSelectedOption(option);
        
        // Immediately check if answer is correct (compare trimmed values)
        const correct = option.trim() === currentItem.answer.trim();
        setIsCorrect(correct);
        setShowResult(true);

        // Notify parent component
        onAnswerSubmitted({
            itemId: currentItem.id,
            question: currentItem.question,
            userAnswer: option,
            correctAnswer: currentItem.answer,
            isCorrect: correct,
            questionType: currentItem.questionType,
            answerType: currentItem.answerType
        });
    };

    // Handle next question
    const handleNext = () => {
        // Set transitioning state to hide result highlights
        setIsTransitioning(true);
        
        // Small delay before actually moving to next question
        setTimeout(() => {
            if (isLastQuestion) {
                onComplete();
            } else {
                onNext();
            }
        }, 50);
    };

    // Render using shared MultipleChoiceView component
    return (
        <MultipleChoiceView
            currentItem={currentItem}
            uniqueOptions={uniqueOptions}
            selectedOption={selectedOption}
            showResult={showResult}
            isCorrect={isCorrect}
            isTransitioning={isTransitioning}
            isLastQuestion={isLastQuestion}
            onOptionSelect={handleOptionSelect}
            onNext={handleNext}
        />
    );
}