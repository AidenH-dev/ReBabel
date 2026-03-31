import { useState, useCallback } from 'react';

export default function useQuestionState() {
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isNearMiss, setIsNearMiss] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [currentShuffledOptions, setCurrentShuffledOptions] = useState([]);

  const resetQuestion = useCallback(() => {
    setShowResult(false);
    setIsCorrect(false);
    setIsNearMiss(false);
    setUserAnswer('');
    setSelectedOption(null);
    setCurrentShuffledOptions([]);
  }, []);

  return {
    showResult,
    setShowResult,
    isCorrect,
    setIsCorrect,
    isNearMiss,
    setIsNearMiss,
    userAnswer,
    setUserAnswer,
    selectedOption,
    setSelectedOption,
    currentShuffledOptions,
    setCurrentShuffledOptions,
    resetQuestion,
  };
}
