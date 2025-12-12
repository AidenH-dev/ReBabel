/**
 * Answer Validation Utility
 *
 * Provides standardized answer validation for both Quiz and SRS systems.
 * Handles different answer types (English, Kana, Kanji) with appropriate
 * normalization strategies.
 *
 * @module answerValidation
 */

/**
 * Normalizes an answer string based on the answer type.
 *
 * Normalization Strategy:
 * - English: Lowercase + remove all whitespace (more forgiving for typos)
 * - Japanese (Kana/Kanji): Preserve case + remove all whitespace
 * - Description/Grammar Pattern: Same as English
 *
 * @param {string} answer - The answer string to normalize
 * @param {string} answerType - Type of answer: "English", "Kana", "Kanji", "Description", "Grammar Pattern"
 * @returns {string} Normalized answer string
 *
 * @example
 * normalizeAnswer("to eat", "English") // "toeat"
 * normalizeAnswer("食べる", "Kanji") // "食べる"
 * normalizeAnswer(" た べ る ", "Kana") // "たべる"
 */
export function normalizeAnswer(answer, answerType) {
  if (!answer || typeof answer !== 'string') {
    return '';
  }

  // Trim leading/trailing whitespace first
  let normalized = answer.trim();

  // Determine if this is English-like text (should be lowercased)
  const isEnglishLike =
    answerType === "English" ||
    answerType === "Description" ||
    answerType === "Grammar Pattern";

  // Apply case normalization for English-like text
  if (isEnglishLike) {
    normalized = normalized.toLowerCase();
  }

  // Remove all internal whitespace for more forgiving comparison
  // This helps with typos like "ta be ru" vs "taberu"
  normalized = normalized.replace(/\s+/g, '');

  return normalized;
}

/**
 * Validates a typed/translation response answer.
 *
 * @param {string} userAnswer - The user's submitted answer
 * @param {string} correctAnswer - The correct answer
 * @param {string} answerType - Type of answer (e.g., "English", "Kana", "Kanji")
 * @returns {boolean} True if the answer is correct, false otherwise
 *
 * @example
 * validateTypedAnswer("to eat", "to eat", "English") // true
 * validateTypedAnswer("toeat", "to eat", "English") // true (whitespace removed)
 * validateTypedAnswer("To Eat", "to eat", "English") // true (case insensitive)
 * validateTypedAnswer("たべる", "食べる", "Kanji") // false (different characters)
 */
export function validateTypedAnswer(userAnswer, correctAnswer, answerType) {
  const normalizedUserAnswer = normalizeAnswer(userAnswer, answerType);
  const normalizedCorrectAnswer = normalizeAnswer(correctAnswer, answerType);
  

  // Implement fuzzyLevenshteinMatch for English answers to allow minor typos
  if (answerType === "English") {
    return fuzzyLevenshteinMatch(normalizedCorrectAnswer, normalizedUserAnswer);
  }

  return normalizedUserAnswer === normalizedCorrectAnswer;
}


/**
 * Implements fuzzy matching using Levenshtein distance to allow for minor typos in typed answers.
 * Calculates the similarity between two strings and returns true if the similarity meets the threshold.
 *
 * @param {string} expectedAnswer - The correct answer
 * @param {string} userAnswer - The user's submitted answer
 * @param {number} threasholdPercent - Minimum similarity percentage (0-1) to consider a match (default: 0.85)
 * @returns {boolean} True if the similarity meets or exceeds the threshold, false otherwise
 *
 * @example
 * fuzzyLevenshteinMatch("hello", "helo", 0.85) // true (minor typo allowed)
 * fuzzyLevenshteinMatch("hello", "goodbye", 0.85) // false (too different)
 * fuzzyLevenshteinMatch("食べる", "食べる", 0.85) // true (exact match)
 */
export function fuzzyLevenshteinMatch(expectedAnswer, userAnswer, threasholdPercent=0.75) {
  // Handle edge cases
  if (!expectedAnswer || !userAnswer) {
    return false;
  }

  // If they're exactly the same, return true immediately
  if (expectedAnswer === userAnswer) {
    return true;
  }

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(expectedAnswer, userAnswer);

  // Calculate similarity percentage (1 = identical, 0 = completely different)
  const maxLength = Math.max(expectedAnswer.length, userAnswer.length);
  const similarity = 1 - (distance / maxLength);

  // Check if similarity meets threshold
  return similarity >= threasholdPercent;
}

/**
 * Calculates the Levenshtein distance between two strings.
 * The Levenshtein distance is the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one string into another.
 *
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} The Levenshtein distance between the two strings
 *
 * @private
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  // Initialize first column (deletions from str1)
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }

  // Initialize first row (insertions to str1)
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}


/**
 * Validates a multiple choice answer.
 *
 * For multiple choice, we use a simpler comparison since users are selecting
 * from predefined options (not typing). We only trim whitespace to handle
 * any formatting inconsistencies.
 *
 * @param {string} selectedOption - The option selected by the user
 * @param {string} correctAnswer - The correct answer
 * @returns {boolean} True if the selected option matches the correct answer
 *
 * @example
 * validateMultipleChoice("to eat", "to eat") // true
 * validateMultipleChoice("to eat ", " to eat") // true (whitespace trimmed)
 * validateMultipleChoice("to eat", "To Eat") // false (case sensitive for MC)
 */
export function validateMultipleChoice(selectedOption, correctAnswer) {
  if (!selectedOption || !correctAnswer) {
    return false;
  }

  // For multiple choice, we only trim whitespace
  // We don't lowercase because the options should match exactly as displayed
  return selectedOption.trim() === correctAnswer.trim();
}

/**
 * Validates an answer and returns detailed result information.
 *
 * This is a higher-level function that combines validation with metadata
 * useful for tracking, analytics, and UI feedback.
 *
 * @param {Object} params - Validation parameters
 * @param {string} params.userAnswer - The user's answer
 * @param {string} params.correctAnswer - The correct answer
 * @param {string} params.answerType - Type of answer
 * @param {string} params.questionType - Type of question (for context)
 * @param {string} params.validationType - "typed" or "multiple-choice"
 * @returns {Object} Validation result with metadata
 *
 * @example
 * validateAnswer({
 *   userAnswer: "to eat",
 *   correctAnswer: "to eat",
 *   answerType: "English",
 *   questionType: "Kana",
 *   validationType: "typed"
 * })
 * // Returns: { isCorrect: true, normalizedUserAnswer: "toeat", normalizedCorrectAnswer: "toeat", ... }
 */
export function validateAnswer({
  userAnswer,
  correctAnswer,
  answerType,
  questionType,
  validationType = "typed"
}) {
  let isCorrect = false;
  let normalizedUserAnswer = '';
  let normalizedCorrectAnswer = '';

  if (validationType === "multiple-choice") {
    isCorrect = validateMultipleChoice(userAnswer, correctAnswer);
    normalizedUserAnswer = userAnswer?.trim() || '';
    normalizedCorrectAnswer = correctAnswer?.trim() || '';
  } else {
    // Default to typed validation
    normalizedUserAnswer = normalizeAnswer(userAnswer, answerType);
    normalizedCorrectAnswer = normalizeAnswer(correctAnswer, answerType);
    isCorrect = validateTypedAnswer(userAnswer, correctAnswer, answerType);
  }

  return {
    isCorrect,
    userAnswer,
    correctAnswer,
    normalizedUserAnswer,
    normalizedCorrectAnswer,
    answerType,
    questionType,
    validationType,
    timestamp: Date.now()
  };
}

/**
 * Helper function to check if an answer type is Japanese (Kana or Kanji).
 *
 * @param {string} answerType - The answer type to check
 * @returns {boolean} True if the answer type is Japanese
 */
export function isJapaneseAnswerType(answerType) {
  return answerType === "Kana" || answerType === "Kanji";
}

/**
 * Helper function to check if an answer type is English-like (English, Description, Grammar Pattern).
 *
 * @param {string} answerType - The answer type to check
 * @returns {boolean} True if the answer type is English-like
 */
export function isEnglishAnswerType(answerType) {
  return (
    answerType === "English" ||
    answerType === "Description" ||
    answerType === "Grammar Pattern"
  );
}

