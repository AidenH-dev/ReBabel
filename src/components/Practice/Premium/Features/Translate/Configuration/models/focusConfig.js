// Focus Configuration Model
// Data transformation utilities for managing focus selections

/**
 * Calculates total focused items across all selected sets
 * @param {Array} selectedSets - Array of set objects
 * @param {Object} focusConfig - Map of setId to array of focused item IDs
 * @returns {number} - Total number of focused items
 */
export const calculateTotalFocusedItems = (selectedSets, focusConfig) => {
  return selectedSets.reduce((total, set) => {
    const focusedIds = focusConfig[set.id] || [];
    // Empty array = all items selected
    return total + (focusedIds.length || set.item_num);
  }, 0);
};

/**
 * Gets focus status text for a set
 * @param {string} setId - Set ID
 * @param {number} totalItems - Total items in set
 * @param {Object} focusConfig - Focus configuration
 * @returns {string} - Status text like "5 items" or "All 10 items"
 */
export const getFocusStatusText = (setId, totalItems, focusConfig) => {
  const focusedIds = focusConfig[setId] || [];
  if (focusedIds.length === 0) {
    return `All ${totalItems} items`;
  }
  return `${focusedIds.length} of ${totalItems} items`;
};

/**
 * Validates if session can start
 * @param {Array} selectedSets - Array of selected sets
 * @param {Object} focusConfig - Focus configuration
 * @returns {boolean} - True if at least 1 set selected with items
 */
export const canStartSession = (selectedSets, focusConfig) => {
  if (selectedSets.length === 0) return false;
  const totalItems = calculateTotalFocusedItems(selectedSets, focusConfig);
  return totalItems > 0;
};
