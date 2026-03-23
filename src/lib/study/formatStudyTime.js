/**
 * Convert total minutes into a human-readable "Xh Ym" string.
 * @param {number|null|undefined} minutes
 * @returns {string}
 */
export default function formatStudyTime(minutes) {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
