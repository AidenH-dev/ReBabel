/**
 * SRS interval constants and due-check utilities.
 * Single source of truth — used by API routes, cron jobs, and client components.
 */

export const SRS_INTERVALS: Record<number, number> = {
  1: 10 * 60 * 1000,            // 10 minutes
  2: 1 * 24 * 60 * 60 * 1000,   // 1 day
  3: 3 * 24 * 60 * 60 * 1000,   // 3 days
  4: 7 * 24 * 60 * 60 * 1000,   // 7 days
  5: 14 * 24 * 60 * 60 * 1000,  // 14 days
  6: 30 * 24 * 60 * 60 * 1000,  // 30 days
  7: 60 * 24 * 60 * 60 * 1000,  // 60 days
  8: 120 * 24 * 60 * 60 * 1000, // 120 days
  9: 180 * 24 * 60 * 60 * 1000, // 180 days (6 months)
};

export function getIntervalForLevel(srsLevel: number): number {
  return SRS_INTERVALS[srsLevel] || SRS_INTERVALS[1];
}

/**
 * Check if an SRS item is due for review.
 * Works for any item shape that has srs_level and a timestamp.
 */
export function isItemDue(srsLevel: number, lastReviewTimeMs: number): boolean {
  const interval = SRS_INTERVALS[srsLevel];
  if (!interval) return false;
  return (Date.now() - lastReviewTimeMs) >= interval;
}
