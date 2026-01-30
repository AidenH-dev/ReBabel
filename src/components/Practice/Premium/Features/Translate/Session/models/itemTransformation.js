// Item Transformation Model
// Data transformation utilities for converting vocab/grammar items to quiz format

import { shuffleArray } from "@/components/Set/Features/Field-Card-Session/shared/models/mcOptionGeneration";

/**
 * Transforms vocab/grammar items to translate quiz format
 * Similar to generateQuizItems in quiz.js
 * @param {Array} items - Raw vocab/grammar items
 * @returns {Array} - Quiz items with question/answer format
 */
export const transformItemsToQuiz = (items) => {
  return items.map((item, idx) => {
    if (item.type === 'vocab' || item.type === 'vocabulary') {
      return {
        id: `vocab-${idx}`,
        type: 'vocabulary',
        question: item.english,
        answer: item.kana,
        questionType: "English",
        answerType: "Kana",
        hint: item.kanji || undefined,
        metadata: {
          lexical_category: item.lexical_category,
          example_sentences: item.example_sentences
        }
      };
    } else if (item.type === 'grammar') {
      return {
        id: `grammar-${idx}`,
        type: 'grammar',
        question: item.title,
        answer: item.description,
        questionType: "Grammar Pattern",
        answerType: "English",
        hint: item.example_sentences?.[0] || undefined,
        metadata: {
          topic: item.topic,
          notes: item.notes
        }
      };
    }
  }).filter(Boolean);
};

/**
 * Prepares session items from selected sets and focus config
 * @param {Array} selectedSets - Array of set objects
 * @param {Object} focusConfig - Focus configuration
 * @param {Array} fetchedSetsData - Array of fetched set data from API
 * @returns {Array} - Shuffled quiz items ready for session
 */
export const prepareSessionItems = (selectedSets, focusConfig, fetchedSetsData) => {
  const allFocusedItems = [];

  fetchedSetsData.forEach((setData, idx) => {
    const setId = selectedSets[idx].id;
    const setItems = setData.data.data.items;
    const focusedIds = focusConfig[setId] || [];

    // If no focus specified, use all items from set
    const itemsToInclude = focusedIds.length > 0
      ? setItems.filter(item => focusedIds.includes(item.id))
      : setItems;

    allFocusedItems.push(...itemsToInclude);
  });

  // Transform and shuffle
  const quizItems = transformItemsToQuiz(allFocusedItems);
  return shuffleArray(quizItems);
};
