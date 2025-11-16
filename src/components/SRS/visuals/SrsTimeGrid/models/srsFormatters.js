/**
 * SRS Formatting Utilities
 *
 * Helper functions for formatting dates and times for display.
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
 * Format date as day abbreviation and date number (e.g., "Mon 16")
 */
export function formatDayHeader(date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[date.getDay()]} ${date.getDate()}`;
}

/**
 * Get the start of today's date (midnight)
 */
export function getTodayStart(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
