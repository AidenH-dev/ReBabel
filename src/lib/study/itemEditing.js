export function buildEditableItem(questionItem) {
  if (!questionItem || !questionItem.uuid) return null;

  const itemType = questionItem.cardType || questionItem.type;

  if (itemType === 'grammar') {
    return {
      type: 'grammar',
      uuid: questionItem.uuid,
      title: questionItem.title || '',
      description: questionItem.description || '',
      topic: questionItem.topic || '',
      notes: questionItem.notes || '',
      example_sentences: Array.isArray(questionItem.example_sentences)
        ? questionItem.example_sentences
        : [],
      tags: Array.isArray(questionItem.tags) ? questionItem.tags : [],
    };
  }

  return {
    type: 'vocabulary',
    uuid: questionItem.uuid,
    english: questionItem.english || '',
    kana: questionItem.kana || '',
    kanji: questionItem.kanji || '',
    lexical_category: questionItem.lexical_category || '',
    example_sentences: Array.isArray(questionItem.example_sentences)
      ? questionItem.example_sentences
      : [],
    tags: Array.isArray(questionItem.tags) ? questionItem.tags : [],
  };
}

export function toUpdateRequest(editableItem) {
  if (!editableItem?.uuid) {
    throw new Error('Item UUID is required for updates');
  }

  if (editableItem.type === 'grammar') {
    return {
      entityType: 'grammar',
      entityId: editableItem.uuid,
      updates: {
        title: editableItem.title || '',
        description: editableItem.description || '',
        topic: editableItem.topic || '',
        notes: editableItem.notes || '',
        example_sentences: JSON.stringify(editableItem.example_sentences || []),
        tags: JSON.stringify(editableItem.tags || []),
      },
    };
  }

  return {
    entityType: 'vocab',
    entityId: editableItem.uuid,
    updates: {
      english: editableItem.english || '',
      kana: editableItem.kana || '',
      kanji: editableItem.kanji || '',
      lexical_category: editableItem.lexical_category || '',
      example_sentences: JSON.stringify(editableItem.example_sentences || []),
      tags: JSON.stringify(editableItem.tags || []),
    },
  };
}

export function mergeIntoBaseItem(baseItem, editableItem) {
  if (!baseItem || !editableItem || baseItem.uuid !== editableItem.uuid) {
    return baseItem;
  }

  if (baseItem.type === 'grammar') {
    return {
      ...baseItem,
      title: editableItem.title,
      description: editableItem.description,
      topic: editableItem.topic,
      notes: editableItem.notes || baseItem.notes || '',
      example_sentences:
        editableItem.example_sentences || baseItem.example_sentences || [],
      tags: editableItem.tags || baseItem.tags || [],
    };
  }

  return {
    ...baseItem,
    english: editableItem.english,
    kana: editableItem.kana,
    kanji: editableItem.kanji,
    lexical_category: editableItem.lexical_category,
    example_sentences:
      editableItem.example_sentences || baseItem.example_sentences || [],
    tags: editableItem.tags || baseItem.tags || [],
  };
}

export function mergeIntoQuestionItem(questionItem, editableItem) {
  if (
    !questionItem ||
    !editableItem ||
    questionItem.uuid !== editableItem.uuid
  ) {
    return questionItem;
  }

  const itemType = questionItem.cardType || questionItem.type;

  if (itemType === 'grammar') {
    const question =
      questionItem.questionType === 'Description'
        ? editableItem.description
        : editableItem.title;

    const answer =
      questionItem.answerType === 'Description'
        ? editableItem.description
        : editableItem.title;

    return {
      ...questionItem,
      title: editableItem.title,
      description: editableItem.description,
      topic: editableItem.topic,
      notes: editableItem.notes || questionItem.notes || '',
      question,
      answer,
      hint: editableItem.topic,
    };
  }

  const question =
    questionItem.questionType === 'English'
      ? editableItem.english
      : questionItem.questionType === 'Kana'
        ? editableItem.kana
        : editableItem.kanji;

  const answer =
    questionItem.answerType === 'English'
      ? editableItem.english
      : questionItem.answerType === 'Kana'
        ? editableItem.kana
        : editableItem.kanji;

  let hint = questionItem.hint;
  if (
    questionItem.questionType === 'Kanji' &&
    questionItem.answerType === 'Kana'
  ) {
    hint = editableItem.english;
  } else if (questionItem.questionType === 'Kanji') {
    hint = `${editableItem.lexical_category} (${editableItem.kana})`;
  } else {
    hint = editableItem.lexical_category;
  }

  return {
    ...questionItem,
    english: editableItem.english,
    kana: editableItem.kana,
    kanji: editableItem.kanji,
    lexical_category: editableItem.lexical_category,
    question,
    answer,
    hint,
  };
}
