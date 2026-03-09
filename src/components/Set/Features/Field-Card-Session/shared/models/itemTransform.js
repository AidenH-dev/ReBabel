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
          example_sentences: Array.isArray(item.example_sentences)
            ? item.example_sentences
            : [item.example_sentences].filter(Boolean),
          tags: Array.isArray(item.tags) ? item.tags : [],
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
          example_sentences: Array.isArray(item.example_sentences)
            ? item.example_sentences.map((ex) =>
                typeof ex === 'string'
                  ? ex
                  : `${ex.japanese || ''} (${ex.english || ''})`
              )
            : [],
          tags: Array.isArray(item.tags) ? item.tags : [],
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
