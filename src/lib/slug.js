/**
 * Convert a string to a URL-friendly slug.
 * Used for SEO-friendly share URLs and CSV filenames.
 */
export function toSlug(s) {
  return (s || 'set')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60);
}
