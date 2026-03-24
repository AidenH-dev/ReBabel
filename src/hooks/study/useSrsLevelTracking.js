import { useState, useCallback, useRef } from 'react';
import { clientLog } from '@/lib/clientLogger';

export default function useSrsLevelTracking() {
  const [itemSRSLevels, setItemSRSLevels] = useState({});
  const [mistakesPerItem, setMistakesPerItem] = useState({});
  const [showLevelChange, setShowLevelChange] = useState(false);
  const [currentLevelChange, setCurrentLevelChange] = useState(null);
  const [
    shouldGoToSummaryAfterLevelChange,
    setShouldGoToSummaryAfterLevelChange,
  ] = useState(false);

  const leveledItemIdsRef = useRef(new Set());
  const mistakesPerItemRef = useRef(mistakesPerItem);
  mistakesPerItemRef.current = mistakesPerItem;

  const initLevels = useCallback((items) => {
    const srsLevelsMap = {};
    const mistakesMap = {};
    items.forEach((item) => {
      srsLevelsMap[item.id] = item.srs_level || 1;
      mistakesMap[item.id] = 0;
    });
    setItemSRSLevels(srsLevelsMap);
    setMistakesPerItem(mistakesMap);
  }, []);

  const recordMistake = useCallback((itemId) => {
    setMistakesPerItem((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  }, []);

  const retractMistake = useCallback((itemId) => {
    setMistakesPerItem((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) - 1),
    }));
  }, []);

  // Check if all variations of an item are completed and trigger level change.
  // Parameters:
  //   originalId - the base item id (e.g. "vocab-1")
  //   translationArray - the full (immutable) translation array for looking up variations
  //   phaseProgress - the current phase progress state
  //   itemData - the base item data array (to find the original item with uuid)
  // Returns true if level change was triggered, false otherwise.
  const checkAndTriggerLevelChange = useCallback(
    (originalId, translationArray, phaseProgress, itemData, scope) => {
      if (leveledItemIdsRef.current.has(originalId)) {
        return false;
      }

      // Find all question variations for this original item
      const questionsForItem = translationArray.filter(
        (q) => q.originalId === originalId
      );
      const totalVariations = questionsForItem.length;

      // Count how many variations have been completed
      const translationProgress = phaseProgress.translation;
      const completedVariations = questionsForItem.filter((q) =>
        translationProgress?.completedItems.has(q.id)
      ).length;

      // If all variations are completed, calculate and show level change
      if (completedVariations === totalVariations) {
        const originalItem = itemData.find((item) => item.id === originalId);
        if (!originalItem) return false;

        const oldLevel = itemSRSLevels[originalId] || 1;
        const mistakes = mistakesPerItem[originalId] || 0;

        // Calculate new level: +1 if no mistakes, -1 if any mistakes (min 1)
        const newLevel =
          mistakes === 0 ? oldLevel + 1 : Math.max(1, oldLevel - 1);

        setItemSRSLevels((prev) => ({
          ...prev,
          [originalId]: newLevel,
        }));

        setCurrentLevelChange({
          item: originalItem,
          oldLevel,
          newLevel,
        });
        setShowLevelChange(true);
        leveledItemIdsRef.current.add(originalId);

        // Save the new SRS level to the database
        saveSRSLevel(originalItem.uuid, newLevel, scope);

        return true;
      }

      return false;
    },
    [itemSRSLevels, mistakesPerItem]
  );

  const handleLevelChangeComplete = useCallback(
    (onPhaseComplete) => {
      setShowLevelChange(false);
      setCurrentLevelChange(null);

      if (shouldGoToSummaryAfterLevelChange) {
        setShouldGoToSummaryAfterLevelChange(false);
        if (onPhaseComplete) onPhaseComplete();
      }
    },
    [shouldGoToSummaryAfterLevelChange]
  );

  const saveSRSLevel = async (uuid, level, scope) => {
    try {
      const response = await fetch(
        `/api/database/v2/srs/item/create-entry/${uuid}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            srs_level: level,
            ...(scope && { scope }),
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        clientLog.error('srs.save_level_failed', { error: result.error });
      }
    } catch (error) {
      clientLog.error('srs.save_level_error', {
        error: error?.message || String(error),
      });
    }
  };

  return {
    itemSRSLevels,
    mistakesPerItem,
    mistakesPerItemRef,
    showLevelChange,
    currentLevelChange,
    shouldGoToSummaryAfterLevelChange,
    setShouldGoToSummaryAfterLevelChange,
    leveledItemIdsRef,
    initLevels,
    recordMistake,
    retractMistake,
    checkAndTriggerLevelChange,
    handleLevelChangeComplete,
    saveSRSLevel,
  };
}
