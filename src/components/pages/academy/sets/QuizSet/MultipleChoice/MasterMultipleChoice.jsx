// components/pages/academy/sets/QuizSet/MultipleChoice/MasterMultipleChoice.jsx
import { useState, useEffect, useMemo } from "react";
import MultipleChoiceView from "@/components/Set/Features/Field-Card-Session/shared/views/MultipleChoiceView.jsx";
import { validateMultipleChoice } from "@/components/Set/Features/Field-Card-Session/shared/controllers/utils/answerValidation";
import { generateOptionsFromQuizItems } from "@/components/Set/Features/Field-Card-Session/shared/models/mcOptionGeneration";

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

    // Generate unique options from quiz items using centralized utility
    const uniqueOptions = useMemo(() => {
        if (!quizItems || quizItems.length === 0 || !currentItem) {
            return [];
        }

        return generateOptionsFromQuizItems(currentItem, quizItems);
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

        // Use shared validation utility
        const correct = validateMultipleChoice(option, currentItem.answer);
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