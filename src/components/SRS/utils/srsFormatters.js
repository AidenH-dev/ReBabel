/**
 * SRS Utility Functions for Formatting
 */

/**
 * Format time as HH:MM
 */
export function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format date as day and number (e.g., "Mon 16")
 */
export function formatDayHeader(date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[date.getDay()]} ${date.getDate()}`;
}

/**
 * Calculate next review date based on SRS level and creation time
 * Standard SRS intervals (in milliseconds)
 */
export function calculateNextReviewDate(timeCreated, srsLevel) {
  const intervals = {
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

  const createdDate = new Date(timeCreated);
  const intervalMs = intervals[srsLevel] || intervals[1]; // Default to 10 minutes if unknown level
  const nextReviewDate = new Date(createdDate.getTime() + intervalMs);

  return nextReviewDate;
}

/**
 * Get the start of today's date
 */
export function getTodayStart(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // Set to midnight
  return d;
}
