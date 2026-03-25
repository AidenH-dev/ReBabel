/**
 * Safely coerce a value into an array.
 * Handles: actual arrays, JSON-stringified arrays, plain strings, and nullish values.
 */
export function safeParseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    if (value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return value.trim() ? [value] : [];
  }
  return [];
}

/**
 * Transforms raw API items into the internal format used by all field card sessions.
 *
 * @param {Array} apiItems - Raw items from the API response
 * @param {Object} [options]
 * @param {boolean} [options.includeSrsLevel] - Include srs_level (default: false)
 * @returns {Array} Transformed items in internal format
 */
export function transformItems(apiItems, options = {}) {
  const { includeSrsLevel = false } = options;

  if (!Array.isArray(apiItems)) return [];

  return apiItems
    .map((item, index) => {
      if (item.type === 'vocab' || item.type === 'vocabulary') {
        const transformed = {
          id: `vocab-${index}`,
          uuid: item.id,
          type: 'vocabulary',
          kana: item.kana || '',
          kanji: item.kanji || null,
          english: item.english || '',
          lexical_category: item.lexical_category || '',
          example_sentences: safeParseArray(item.example_sentences),
          tags: safeParseArray(item.tags),
        };

        if (includeSrsLevel) {
          transformed.srs_level = item.srs?.srs_level || 1;
        }

        // Preserve multi-set tracking fields if present
        if (item.setId !== undefined) transformed.setId = item.setId;
        if (item.setTitle !== undefined) transformed.setTitle = item.setTitle;

        return transformed;
      }

      if (item.type === 'grammar') {
        const transformed = {
          id: `grammar-${index}`,
          uuid: item.id,
          type: 'grammar',
          title: item.title || '',
          description: item.description || '',
          topic: item.topic || '',
          notes: item.notes || '',
          example_sentences: safeParseArray(item.example_sentences).map((ex) =>
            typeof ex === 'string'
              ? ex
              : `${ex.japanese || ''} (${ex.english || ''})`
          ),
          tags: safeParseArray(item.tags),
        };

        if (includeSrsLevel) {
          transformed.srs_level = item.srs?.srs_level || 1;
        }

        // Preserve multi-set tracking fields if present
        if (item.setId !== undefined) transformed.setId = item.setId;
        if (item.setTitle !== undefined) transformed.setTitle = item.setTitle;

        return transformed;
      }

      return null;
    })
    .filter(Boolean);
}
