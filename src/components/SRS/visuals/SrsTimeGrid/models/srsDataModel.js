/**
 * SRS Data Model
 *
 * Handles SRS business logic and data transformations.
 * Converts raw API data into display-ready format.
 */

import { getIntervalForLevel } from './srsIntervals';

/**
 * Calculate next review date based on SRS level and creation time
 * @param {string} timeCreated - ISO datetime string of when item was created
 * @param {number} srsLevel - Current SRS level
 * @returns {Date} - The next review date
 */
export function calculateNextReviewDate(timeCreated, srsLevel) {
  const createdDate = new Date(timeCreated);
  const intervalMs = getIntervalForLevel(srsLevel);
  return new Date(createdDate.getTime() + intervalMs);
}

/**
 * Transform a raw API item into a display item
 * @param {object} item - Raw item from API
 * @returns {object|null} - Transformed item or null if invalid
 */
export function transformApiItem(item, formatTimeFunc) {
  // Validate SRS data exists
  if (!item.srs || !item.srs.time_created) {
    console.warn('Item missing SRS data:', item);
    return null;
  }

  // Calculate next review date
  const reviewDate = calculateNextReviewDate(
    item.srs.time_created,
    item.srs.srs_level
  );

  // Generate display title based on item type
  let title = '';
  if (item.type === 'vocabulary' || item.type === 'vocab') {
    title = item.kanji || item.kana || item.english || 'Vocabulary';
  } else if (item.type === 'grammar') {
    title = item.title || 'Grammar';
  } else {
    title = 'Review Item';
  }

  console.log('Transformed item:', {
    title,
    srsLevel: item.srs.srs_level,
    created: item.srs.time_created,
    nextReview: reviewDate.toISOString(),
    hour: reviewDate.getHours(),
  });

  return {
    id: item.id,
    title,
    date: reviewDate,
    time: formatTimeFunc(reviewDate),
    itemType: item.type,
    srsLevel: item.srs.srs_level || 0,
    english: item.english || '',
    kanji: item.kanji || '',
    kana: item.kana || '',
  };
}

/**
 * Transform multiple API items into display items
 * @param {array} items - Raw items from API
 * @param {function} formatTimeFunc - Function to format time
 * @returns {array} - Array of transformed items
 */
export function transformApiItems(items, formatTimeFunc) {
  return items
    .map((item) => transformApiItem(item, formatTimeFunc))
    .filter((item) => item !== null);
}
