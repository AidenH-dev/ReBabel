import { useState, useCallback } from 'react';

export default function usePhaseProgress() {
  const [phaseProgress, setPhaseProgress] = useState({});
  const [completedPhases, setCompletedPhases] = useState([]);

  const initPhases = useCallback((config) => {
    // config is an object mapping phase names to totalUniqueItems
    // e.g. { 'multiple-choice': 5, translation: 10 }
    const initial = {};
    for (const [phase, totalUniqueItems] of Object.entries(config)) {
      initial[phase] = {
        completedItems: new Set(),
        totalUniqueItems,
      };
    }
    setPhaseProgress(initial);
  }, []);

  const markItemCompleted = useCallback((phase, itemId) => {
    let allCompleted = false;

    setPhaseProgress((prev) => {
      if (!prev[phase]) return prev;

      const newCompletedItems = new Set(prev[phase].completedItems);
      newCompletedItems.add(itemId);

      allCompleted = newCompletedItems.size >= prev[phase].totalUniqueItems;

      return {
        ...prev,
        [phase]: {
          ...prev[phase],
          completedItems: newCompletedItems,
        },
      };
    });

    return allCompleted;
  }, []);

  const completePhase = useCallback((phase) => {
    setCompletedPhases((prev) =>
      prev.includes(phase) ? prev : [...prev, phase]
    );
  }, []);

  return {
    phaseProgress,
    setPhaseProgress,
    completedPhases,
    initPhases,
    markItemCompleted,
    completePhase,
  };
}
