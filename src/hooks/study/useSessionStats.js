import { useState, useCallback, useRef } from 'react';

export default function useSessionStats() {
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    totalAttempts: 0,
    accuracy: 0,
  });
  const sessionStatsRef = useRef(sessionStats);
  sessionStatsRef.current = sessionStats;

  const [answeredItems, setAnsweredItems] = useState([]);
  const [animateAccuracy, setAnimateAccuracy] = useState(false);

  const recordAnswer = useCallback((result) => {
    setAnsweredItems((prev) => [...prev, result]);

    setSessionStats((prev) => {
      const newCorrect = prev.correct + (result.isCorrect ? 1 : 0);
      const newIncorrect = prev.incorrect + (result.isCorrect ? 0 : 1);
      const newTotal = prev.totalAttempts + 1;

      return {
        correct: newCorrect,
        incorrect: newIncorrect,
        totalAttempts: newTotal,
        accuracy: Math.round((newCorrect / newTotal) * 100),
      };
    });
  }, []);

  const retractLastAnswer = useCallback(() => {
    setAnsweredItems((prev) => prev.slice(0, -1));

    // Reverse stats: remove 1 incorrect, add 1 correct (user claims they were correct)
    setSessionStats((prev) => {
      const newIncorrect = Math.max(0, prev.incorrect - 1);
      const newCorrect = prev.correct + 1;
      const newTotal = prev.totalAttempts; // Same total, switching incorrect to correct
      const newAccuracy =
        newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0;

      return {
        ...prev,
        correct: newCorrect,
        incorrect: newIncorrect,
        accuracy: newAccuracy,
      };
    });
  }, []);

  const triggerAccuracyAnimation = useCallback(() => {
    setTimeout(() => setAnimateAccuracy(true), 100);
  }, []);

  // Bulk-restore stats on session resume (bypass recordAnswer which is for live answers)
  const restoreStats = useCallback(
    ({ correct, incorrect, answeredItems: restored }) => {
      const total = correct + incorrect;
      setSessionStats({
        correct,
        incorrect,
        totalAttempts: total,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      });
      if (restored) setAnsweredItems(restored);
    },
    []
  );

  return {
    sessionStats,
    sessionStatsRef,
    answeredItems,
    animateAccuracy,
    recordAnswer,
    retractLastAnswer,
    triggerAccuracyAnimation,
    restoreStats,
  };
}
