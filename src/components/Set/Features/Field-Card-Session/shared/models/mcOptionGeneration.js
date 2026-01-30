// Multiple Choice Option Generation Utilities
// Consolidates MC option generation logic from quiz.js, MasterMultipleChoice.jsx, and learn-new.js

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled copy of array
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Extracts field value from an item based on answer type
 * @param {Object} item - The data item (vocab or grammar)
 * @param {string} answerType - Type of answer ("Kana", "English", "Kanji", "Description", "Grammar Pattern")
 * @returns {string|null} - The extracted value or null
 */
const extractFieldValue = (item, answerType) => {
  if (!item) return null;

  if (item.type === "vocabulary") {
    switch (answerType) {
      case "Kana":
        return item.kana || null;
      case "English":
        return item.english || null;
      case "Kanji":
        return item.kanji || null;
      default:
        return null;
    }
  } else if (item.type === "grammar") {
    switch (answerType) {
      case "Description":
        return item.description || null;
      case "Grammar Pattern":
        return item.title || null;
      default:
        return null;
    }
  }

  return null;
};

/**
 * Generates distractors for a given correct answer from raw data items
 * Used during data loading phase for pre-generation (SRS approach)
 *
 * @param {string} correctAnswer - The correct answer to exclude
 * @param {string} answerType - Type of answer ("Kana", "English", etc.)
 * @param {string} itemType - Type of item ("vocabulary" or "grammar")
 * @param {Array} dataItems - Array of raw data items to extract distractors from
 * @param {number} count - Number of distractors to return (default: 3)
 * @returns {Array<string>} - Array of distractor strings
 */
export const generateDistractorsFromData = (
  correctAnswer,
  answerType,
  itemType,
  dataItems,
  count = 3
) => {
  const allOptions = [];

  // Collect all possible options of the same type and field
  dataItems.forEach((dataItem) => {
    if (dataItem.type === itemType) {
      const value = extractFieldValue(dataItem, answerType);

      // Add to options if it's not the correct answer and it exists
      if (value && value !== correctAnswer) {
        allOptions.push(value);
      }
    }
  });

  // Remove duplicates
  const uniqueOptions = [...new Set(allOptions)];

  // Shuffle and take the requested count
  const shuffled = shuffleArray(uniqueOptions);
  return shuffled.slice(0, count);
};

/**
 * Generates multiple choice options from quiz items (on-demand generation)
 * Used during quiz rendering for dynamic option generation
 *
 * @param {Object} currentItem - The current quiz item with question/answer
 * @param {Array} allQuizItems - Array of all quiz items to extract distractors from
 * @param {number} totalOptions - Total number of options to generate (default: 4)
 * @returns {Array<string>} - Shuffled array of options including correct answer
 */
export const generateOptionsFromQuizItems = (
  currentItem,
  allQuizItems,
  totalOptions = 4
) => {
  if (!currentItem || !currentItem.answer) {
    return [];
  }

  const correctAnswer = currentItem.answer.trim();

  // Filter quiz items to only those with matching questionType and answerType
  // This ensures distractors are contextually appropriate
  const matchingItems = allQuizItems.filter(
    (item) =>
      item.questionType === currentItem.questionType &&
      item.answerType === currentItem.answerType &&
      item.answer &&
      item.answer.trim() !== correctAnswer
  );

  // Collect all possible answers from matching items (as distractors)
  const allAnswers = matchingItems
    .map((item) => item.answer.trim())
    .filter((answer) => answer); // Remove empty strings

  // Remove duplicates
  const uniqueDistractors = [...new Set(allAnswers)];

  // Calculate how many distractors we need
  const neededDistractors = Math.min(
    uniqueDistractors.length,
    totalOptions - 1
  );

  // If we don't have enough unique distractors for at least 2 options total
  if (neededDistractors < 1) {
    // Return only the correct answer (fallback for small datasets)
    return [correctAnswer];
  }

  // Shuffle and take the needed number of distractors
  const shuffledDistractors = shuffleArray(uniqueDistractors);
  const selectedDistractors = shuffledDistractors.slice(0, neededDistractors);

  // Combine correct answer with distractors
  const allOptions = [correctAnswer, ...selectedDistractors];

  // Shuffle all options so correct answer isn't always first
  return shuffleArray(allOptions);
};

/**
 * Pre-generates multiple choice items with embedded distractors
 * Used for SRS and quiz modes that need distractors stored with each item
 *
 * @param {Array} dataItems - Array of raw data items (vocab/grammar)
 * @param {Array|null} distractorPool - Optional array of items to use for distractors (defaults to dataItems)
 * @param {number} distractorCount - Number of distractors per item (default: 3)
 * @returns {Array<Object>} - Array of MC items with distractors
 */
export const pregenerateMultipleChoiceItems = (
  dataItems,
  distractorPool = null,
  distractorCount = 3
) => {
  // Use distractorPool if provided, otherwise fallback to dataItems for backward compatibility
  const sourceForDistractors = distractorPool || dataItems;

  const multipleChoiceItems = [];

  dataItems.forEach((item) => {
    if (item.type === "vocabulary") {
      // English � Kana
      multipleChoiceItems.push({
        id: `${item.id}-mc-en-kana`,
        originalId: item.id,
        uuid: item.uuid,
        type: "vocabulary",
        questionType: "English",
        answerType: "Kana",
        question: item.english,
        answer: item.kana,
        hint: item.lexical_category,
        distractors: generateDistractorsFromData(
          item.kana,
          "Kana",
          "vocabulary",
          sourceForDistractors,
          distractorCount
        ),
      });

      // Kana � English
      multipleChoiceItems.push({
        id: `${item.id}-mc-kana-en`,
        originalId: item.id,
        uuid: item.uuid,
        type: "vocabulary",
        questionType: "Kana",
        answerType: "English",
        question: item.kana,
        answer: item.english,
        hint: item.lexical_category,
        distractors: generateDistractorsFromData(
          item.english,
          "English",
          "vocabulary",
          sourceForDistractors,
          distractorCount
        ),
      });

      // If kanji exists, add kanji variations
      if (item.kanji) {
        // English � Kanji
        multipleChoiceItems.push({
          id: `${item.id}-mc-en-kanji`,
          originalId: item.id,
          uuid: item.uuid,
          type: "vocabulary",
          questionType: "English",
          answerType: "Kanji",
          question: item.english,
          answer: item.kanji,
          hint: `${item.lexical_category} (${item.kana})`,
          distractors: generateDistractorsFromData(
            item.kanji,
            "Kanji",
            "vocabulary",
            sourceForDistractors,
            distractorCount
          ),
        });

        // Kanji � English
        multipleChoiceItems.push({
          id: `${item.id}-mc-kanji-en`,
          originalId: item.id,
          uuid: item.uuid,
          type: "vocabulary",
          questionType: "Kanji",
          answerType: "English",
          question: item.kanji,
          answer: item.english,
          hint: `${item.lexical_category} (${item.kana})`,
          distractors: generateDistractorsFromData(
            item.english,
            "English",
            "vocabulary",
            sourceForDistractors,
            distractorCount
          ),
        });

        // Kana � Kanji
        multipleChoiceItems.push({
          id: `${item.id}-mc-kana-kanji`,
          originalId: item.id,
          uuid: item.uuid,
          type: "vocabulary",
          questionType: "Kana",
          answerType: "Kanji",
          question: item.kana,
          answer: item.kanji,
          hint: item.english,
          distractors: generateDistractorsFromData(
            item.kanji,
            "Kanji",
            "vocabulary",
            sourceForDistractors,
            distractorCount
          ),
        });

        // Kanji � Kana
        multipleChoiceItems.push({
          id: `${item.id}-mc-kanji-kana`,
          originalId: item.id,
          uuid: item.uuid,
          type: "vocabulary",
          questionType: "Kanji",
          answerType: "Kana",
          question: item.kanji,
          answer: item.kana,
          hint: item.english,
          distractors: generateDistractorsFromData(
            item.kana,
            "Kana",
            "vocabulary",
            sourceForDistractors,
            distractorCount
          ),
        });
      }
    } else if (item.type === "grammar") {
      // Title � Description
      multipleChoiceItems.push({
        id: `${item.id}-mc-title-desc`,
        originalId: item.id,
        uuid: item.uuid,
        type: "grammar",
        questionType: "Grammar Pattern",
        answerType: "Description",
        question: item.title,
        answer: item.description,
        hint: item.topic,
        distractors: generateDistractorsFromData(
          item.description,
          "Description",
          "grammar",
          sourceForDistractors,
          distractorCount
        ),
      });

      // Description � Title
      multipleChoiceItems.push({
        id: `${item.id}-mc-desc-title`,
        originalId: item.id,
        uuid: item.uuid,
        type: "grammar",
        questionType: "Description",
        answerType: "Grammar Pattern",
        question: item.description,
        answer: item.title,
        hint: item.topic,
        distractors: generateDistractorsFromData(
          item.title,
          "Grammar Pattern",
          "grammar",
          sourceForDistractors,
          distractorCount
        ),
      });
    }
  });

  return multipleChoiceItems;
};

/**
 * Generates shuffled options from an item with pre-generated distractors
 * Used when rendering questions that already have distractors stored
 *
 * @param {Object} item - Item with answer and distractors array
 * @returns {Array<string>} - Shuffled array of all options
 */
export const shuffleOptionsWithDistractors = (item) => {
  if (!item || !item.answer) {
    return [];
  }

  const options = [item.answer, ...(item.distractors || [])];
  return shuffleArray(options);
};
