/**
 * Generates translation question items from transformed items.
 * All question items include the full source data so that the edit modal
 * always has complete item information.
 *
 * @param {Array} items - Transformed items from transformItems()
 * @param {Object} [options]
 * @param {boolean} [options.includeGrammar] - Generate grammar translation questions (default: false)
 * @returns {Array} Translation question items
 */
export function generateTranslationItems(items, options = {}) {
  const { includeGrammar = false } = options;
  const translation = [];

  items.forEach((item) => {
    if (item.type === 'vocabulary') {
      const vocabBase = {
        originalId: item.id,
        uuid: item.uuid,
        type: 'vocabulary',
        english: item.english,
        kana: item.kana,
        kanji: item.kanji,
        lexical_category: item.lexical_category,
        example_sentences: item.example_sentences,
        tags: item.tags || [],
      };

      // Preserve multi-set tracking fields if present
      if (item.setId !== undefined) vocabBase.setId = item.setId;
      if (item.setTitle !== undefined) vocabBase.setTitle = item.setTitle;

      // English → Kana
      translation.push({
        ...vocabBase,
        id: `${item.id}-tr-en-kana`,
        questionType: 'English',
        answerType: 'Kana',
        question: item.english,
        answer: item.kana,
        hint: item.lexical_category,
      });

      // Kana → English
      translation.push({
        ...vocabBase,
        id: `${item.id}-tr-kana-en`,
        questionType: 'Kana',
        answerType: 'English',
        question: item.kana,
        answer: item.english,
        hint: item.lexical_category,
      });

      if (item.kanji) {
        // Kanji → English
        translation.push({
          ...vocabBase,
          id: `${item.id}-tr-kanji-en`,
          questionType: 'Kanji',
          answerType: 'English',
          question: item.kanji,
          answer: item.english,
          hint: `${item.lexical_category} (${item.kana})`,
        });

        // Kanji → Kana
        translation.push({
          ...vocabBase,
          id: `${item.id}-tr-kanji-kana`,
          questionType: 'Kanji',
          answerType: 'Kana',
          question: item.kanji,
          answer: item.kana,
          hint: item.english,
        });
      }
    } else if (includeGrammar && item.type === 'grammar') {
      const grammarBase = {
        originalId: item.id,
        uuid: item.uuid,
        type: 'grammar',
        title: item.title,
        description: item.description,
        topic: item.topic,
        notes: item.notes || '',
        example_sentences: item.example_sentences,
        tags: item.tags || [],
      };

      // Preserve multi-set tracking fields if present
      if (item.setId !== undefined) grammarBase.setId = item.setId;
      if (item.setTitle !== undefined) grammarBase.setTitle = item.setTitle;

      // Title → Description
      translation.push({
        ...grammarBase,
        id: `${item.id}-tr-title-desc`,
        questionType: 'Grammar Pattern',
        answerType: 'Description',
        question: item.title,
        answer: item.description,
        hint: item.topic,
      });

      // Description → Title
      translation.push({
        ...grammarBase,
        id: `${item.id}-tr-desc-title`,
        questionType: 'Description',
        answerType: 'Grammar Pattern',
        question: item.description,
        answer: item.title,
        hint: item.topic,
      });
    }
  });

  return translation;
}

/**
 * Generates quiz question items from transformed items.
 * Similar to generateTranslationItems but uses quiz-specific type naming
 * and includes cardType for the edit modal's type detection.
 *
 * @param {Array} cards - Transformed items from transformItems()
 * @returns {Array} Quiz question items
 */
export function generateQuizItems(cards) {
  const items = [];

  cards.forEach((card) => {
    if (card.type === 'vocabulary') {
      const vocabBase = {
        originalId: card.id,
        uuid: card.uuid,
        cardType: 'vocabulary',
        english: card.english,
        kana: card.kana,
        kanji: card.kanji,
        lexical_category: card.lexical_category,
        example_sentences: card.example_sentences,
        tags: card.tags || [],
      };

      // English to Kana
      items.push({
        ...vocabBase,
        id: `${card.id}-en-kana`,
        type: 'vocab-en-kana',
        question: card.english,
        answer: card.kana,
        hint: card.lexical_category,
        questionType: 'English',
        answerType: 'Kana',
      });

      if (card.kanji) {
        // Kanji to English
        items.push({
          ...vocabBase,
          id: `${card.id}-kanji-en`,
          type: 'vocab-kanji-en',
          question: card.kanji,
          answer: card.english,
          hint: `${card.lexical_category} (${card.kana})`,
          questionType: 'Kanji',
          answerType: 'English',
        });

        // Kanji to Kana
        items.push({
          ...vocabBase,
          id: `${card.id}-kanji-kana`,
          type: 'vocab-kanji-kana',
          question: card.kanji,
          answer: card.kana,
          hint: card.english,
          questionType: 'Kanji',
          answerType: 'Kana',
        });
      } else {
        // Kana to English (when no kanji)
        items.push({
          ...vocabBase,
          id: `${card.id}-kana-en`,
          type: 'vocab-kana-en',
          question: card.kana,
          answer: card.english,
          hint: card.lexical_category,
          questionType: 'Kana',
          answerType: 'English',
        });
      }
    } else if (card.type === 'grammar') {
      const grammarBase = {
        originalId: card.id,
        uuid: card.uuid,
        cardType: 'grammar',
        title: card.title,
        description: card.description,
        topic: card.topic,
        notes: card.notes || '',
        example_sentences: card.example_sentences,
        tags: card.tags || [],
      };

      // Title to Description
      items.push({
        ...grammarBase,
        id: `${card.id}-title-desc`,
        type: 'grammar-title-desc',
        question: card.title,
        answer: card.description,
        hint: card.topic,
        questionType: 'Grammar Pattern',
        answerType: 'Description',
      });

      // Description to Title
      items.push({
        ...grammarBase,
        id: `${card.id}-desc-title`,
        type: 'grammar-desc-title',
        question: card.description,
        answer: card.title,
        hint: card.topic,
        questionType: 'Description',
        answerType: 'Grammar Pattern',
      });
    }
  });

  return items;
}
