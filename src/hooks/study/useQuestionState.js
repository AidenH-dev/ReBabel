import { useState, useCallback } from 'react';

export default function useQuestionState() {
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [currentShuffledOptions, setCurrentShuffledOptions] = useState([]);

  const resetQuestion = useCallback(() => {
    setShowResult(false);
    setIsCorrect(false);
    setUserAnswer('');
    setSelectedOption(null);
    setCurrentShuffledOptions([]);
  }, []);

  return {
    showResult,
    setShowResult,
    isCorrect,
    setIsCorrect,
    userAnswer,
    setUserAnswer,
    selectedOption,
    setSelectedOption,
    currentShuffledOptions,
    setCurrentShuffledOptions,
    resetQuestion,
  };
}
