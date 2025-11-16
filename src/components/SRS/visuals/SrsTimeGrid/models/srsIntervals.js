/**
 * SRS Interval Constants
 *
 * Defines the review intervals for each SRS level in milliseconds.
 * These intervals determine how long after an item is created/reviewed
 * that it will be due for review again.
 */

export const SRS_INTERVALS = {
  1: 10 * 60 * 1000,           // 10 minutes
  2: 1 * 24 * 60 * 60 * 1000,  // 1 day
  3: 3 * 24 * 60 * 60 * 1000,  // 3 days
  4: 7 * 24 * 60 * 60 * 1000,  // 7 days
  5: 14 * 24 * 60 * 60 * 1000, // 14 days
  6: 30 * 24 * 60 * 60 * 1000, // 30 days
  7: 60 * 24 * 60 * 60 * 1000, // 60 days
  8: 120 * 24 * 60 * 60 * 1000,// 120 days
  9: 180 * 24 * 60 * 60 * 1000,// 180 days (6 months)
};

/**
 * Get the interval for a given SRS level
 */
export function getIntervalForLevel(srsLevel) {
  return SRS_INTERVALS[srsLevel] || SRS_INTERVALS[1]; // Default to 10 minutes
}
