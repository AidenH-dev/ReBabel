// pages/learn/academy/sets/study/[id]/srs/learn-new.js
import Head from "next/head";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import AcademySidebar from "@/components/Sidebars/AcademySidebar";

// Import icons for phase indicators
import { FaBook, FaDumbbell } from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";

// Import SRS Learn New Components
import SRSQuizHeader from "@/components/pages/academy/sets/SRSLearnNewSet/QuizHeader/SRSQuizHeader";
import SRSQuestionCard from "@/components/pages/academy/sets/SRSLearnNewSet/QuestionCard/SRSQuestionCard";
import SRSMultipleChoice from "@/components/pages/academy/sets/SRSLearnNewSet/MultipleChoice/SRSMultipleChoice";
import SRSReviewCards from "@/components/pages/academy/sets/SRSLearnNewSet/ReviewCards/SRSReviewCards";
import SRSQuizSummary from "@/components/pages/academy/sets/SRSLearnNewSet/QuizSummary/SRSQuizSummary";

export default function LearnNew() {
  const router = useRouter();
  const { id } = router.query;

  // Data states
  const [itemData, setItemData] = useState([]);
  const [setInfo, setSetInfo] = useState(null);
  const [setType, setSetType] = useState(null); // 'vocab' | 'grammar'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // SRS saving states
  const [isSavingSRS, setIsSavingSRS] = useState(false);
  const [srsError, setSrsError] = useState(null);

  // SRS Array states
  const [reviewArray, setReviewArray] = useState([]);
  const [multipleChoiceArray, setMultipleChoiceArray] = useState([]);
  const [translationArray, setTranslationArray] = useState([]);

  // ============ PHASE MANAGEMENT ============
  const [currentPhase, setCurrentPhase] = useState('review');
  const [currentIndex, setCurrentIndex] = useState(0);

  // ============ ACTIVE ARRAYS (MUTABLE) ============
  const [activeReviewArray, setActiveReviewArray] = useState([]);
  const [activeMCArray, setActiveMCArray] = useState([]);
  const [activeTranslationArray, setActiveTranslationArray] = useState([]);

  // ============ QUESTION STATE (MC & Translation) ============
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentShuffledOptions, setCurrentShuffledOptions] = useState([]);

  // ============ SUMMARY STATE ============
  const [animateAccuracy, setAnimateAccuracy] = useState(false);

  // ============ SESSION TRACKING ============
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    totalAttempts: 0,
    accuracy: 0
  });
  const [answeredItems, setAnsweredItems] = useState([]);

  // ============ PHASE PROGRESS TRACKING ============
  const [phaseProgress, setPhaseProgress] = useState({
    'multiple-choice': {
      completedItems: new Set(),
      totalUniqueItems: 0
    },
    'translation': {
      completedItems: new Set(),
      totalUniqueItems: 0
    }
  });
  const [completedPhases, setCompletedPhases] = useState([]);

  // ============ REFS ============
  const translationInputRef = useRef(null);

  // Fetch set data from API
  useEffect(() => {
    if (!id) return;

    const fetchSetData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get limit from URL query params, default to 10 if not provided
        const limitParam = router.query.limit ? parseInt(router.query.limit, 10) : 10;
        const validLimit = isNaN(limitParam) || limitParam <= 0 ? 10 : limitParam;

        const response = await fetch(`/api/database/v2/srs/set/learn/${id}?limit=${validLimit}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch set: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || "Failed to load set data");
        }

        const setInfoData = result.data.set;
        const setItemsAPI = result.data.items || [];

        if (!setInfoData) {
          throw new Error("Invalid set data structure received from API");
        }

        setSetInfo({
          title: setInfoData.title || "Untitled Set",
          description: setInfoData.description?.toString() || ""
        });

        // Extract and store set type
        setSetType(setInfoData.set_type || 'vocab');

        // Transform items to item data format
        const transformedItemData = Array.isArray(setItemsAPI)
          ? setItemsAPI
              .map((item, index) => {
                if (item.type === "vocab" || item.type === "vocabulary") {
                  return {
                    id: `vocab-${index}`,
                    uuid: item.id, // Preserve actual UUID from API
                    type: "vocabulary",
                    kana: item.kana || "",
                    kanji: item.kanji || null,
                    english: item.english || "",
                    lexical_category: item.lexical_category || "",
                    example_sentences: Array.isArray(item.example_sentences)
                      ? item.example_sentences
                      : [item.example_sentences].filter(Boolean)
                  };
                } else if (item.type === "grammar") {
                  return {
                    id: `grammar-${index}`,
                    uuid: item.id, // Preserve actual UUID from API
                    type: "grammar",
                    title: item.title || "",
                    description: item.description || "",
                    topic: item.topic || "",
                    example_sentences: Array.isArray(item.example_sentences)
                      ? item.example_sentences.map((ex) =>
                          typeof ex === "string"
                            ? ex
                            : `${ex.japanese || ""} (${ex.english || ""})`
                        )
                      : []
                  };
                }
                return null;
              })
              .filter(Boolean)
          : [];

        if (transformedItemData.length === 0) {
          throw new Error("This set has no items to study");
        }

        setItemData(transformedItemData);

        // ============================================
        // HELPER: Shuffle Array Function
        // ============================================
        const shuffleArray = (array) => {
          const shuffled = [...array];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        };

        // ============================================
        // STEP 1: Review Array (flat data)
        // ============================================
        const review = transformedItemData;
        setReviewArray(review);

        // ============================================
        // STEP 2: Multiple Choice Array (all variations)
        // ============================================

        // Helper function to get distractors for a given answer
        const getDistractors = (correctAnswer, answerType, itemType) => {
          const allOptions = [];

          // Collect all possible options of the same type and field
          transformedItemData.forEach((dataItem) => {
            if (dataItem.type === itemType) {
              let value = null;

              if (itemType === "vocabulary") {
                if (answerType === "Kana") {
                  value = dataItem.kana;
                } else if (answerType === "English") {
                  value = dataItem.english;
                } else if (answerType === "Kanji" && dataItem.kanji) {
                  value = dataItem.kanji;
                }
              } else if (itemType === "grammar") {
                if (answerType === "Description") {
                  value = dataItem.description;
                } else if (answerType === "Grammar Pattern") {
                  value = dataItem.title;
                }
              }

              // Add to options if it's not the correct answer and it exists
              if (value && value !== correctAnswer) {
                allOptions.push(value);
              }
            }
          });

          // Remove duplicates
          const uniqueOptions = [...new Set(allOptions)];

          // Shuffle and take up to 3
          const shuffled = uniqueOptions.sort(() => Math.random() - 0.5);
          return shuffled.slice(0, 3);
        };

        const multipleChoice = [];

        transformedItemData.forEach((item) => {
          if (item.type === "vocabulary") {
            // English → Kana
            multipleChoice.push({
              id: `${item.id}-mc-en-kana`,
              originalId: item.id,
              uuid: item.uuid,
              type: "vocabulary",
              questionType: "English",
              answerType: "Kana",
              question: item.english,
              answer: item.kana,
              hint: item.lexical_category,
              distractors: getDistractors(item.kana, "Kana", "vocabulary")
            });

            // Kana → English
            multipleChoice.push({
              id: `${item.id}-mc-kana-en`,
              originalId: item.id,
              uuid: item.uuid,
              type: "vocabulary",
              questionType: "Kana",
              answerType: "English",
              question: item.kana,
              answer: item.english,
              hint: item.lexical_category,
              distractors: getDistractors(item.english, "English", "vocabulary")
            });

            // If kanji exists, add kanji variations
            if (item.kanji) {
              // English → Kanji
              multipleChoice.push({
                id: `${item.id}-mc-en-kanji`,
                originalId: item.id,
                uuid: item.uuid,
                type: "vocabulary",
                questionType: "English",
                answerType: "Kanji",
                question: item.english,
                answer: item.kanji,
                hint: `${item.lexical_category} (${item.kana})`,
                distractors: getDistractors(item.kanji, "Kanji", "vocabulary")
              });

              // Kanji → English
              multipleChoice.push({
                id: `${item.id}-mc-kanji-en`,
                originalId: item.id,
                uuid: item.uuid,
                type: "vocabulary",
                questionType: "Kanji",
                answerType: "English",
                question: item.kanji,
                answer: item.english,
                hint: `${item.lexical_category} (${item.kana})`,
                distractors: getDistractors(item.english, "English", "vocabulary")
              });

              // Kana → Kanji
              multipleChoice.push({
                id: `${item.id}-mc-kana-kanji`,
                originalId: item.id,
                uuid: item.uuid,
                type: "vocabulary",
                questionType: "Kana",
                answerType: "Kanji",
                question: item.kana,
                answer: item.kanji,
                hint: item.english,
                distractors: getDistractors(item.kanji, "Kanji", "vocabulary")
              });

              // Kanji → Kana
              multipleChoice.push({
                id: `${item.id}-mc-kanji-kana`,
                originalId: item.id,
                uuid: item.uuid,
                type: "vocabulary",
                questionType: "Kanji",
                answerType: "Kana",
                question: item.kanji,
                answer: item.kana,
                hint: item.english,
                distractors: getDistractors(item.kana, "Kana", "vocabulary")
              });
            }
          } else if (item.type === "grammar") {
            // Title → Description
            multipleChoice.push({
              id: `${item.id}-mc-title-desc`,
              originalId: item.id,
              uuid: item.uuid,
              type: "grammar",
              questionType: "Grammar Pattern",
              answerType: "Description",
              question: item.title,
              answer: item.description,
              hint: item.topic,
              distractors: getDistractors(item.description, "Description", "grammar")
            });

            // Description → Title
            multipleChoice.push({
              id: `${item.id}-mc-desc-title`,
              originalId: item.id,
              uuid: item.uuid,
              type: "grammar",
              questionType: "Description",
              answerType: "Grammar Pattern",
              question: item.description,
              answer: item.title,
              hint: item.topic,
              distractors: getDistractors(item.title, "Grammar Pattern", "grammar")
            });
          }
        });

        // Shuffle the multiple choice array so questions appear in random order
        const shuffledMultipleChoice = shuffleArray(multipleChoice);
        setMultipleChoiceArray(shuffledMultipleChoice);

        // ============================================
        // STEP 3: Translation Array (all variations)
        // SKIP FOR GRAMMAR SETS
        // ============================================
        const translation = [];

        // Only generate translation questions for vocabulary sets
        if (setInfoData.set_type !== 'grammar') {
          transformedItemData.forEach((item) => {
            if (item.type === "vocabulary") {
              // English → Kana
              translation.push({
                id: `${item.id}-tr-en-kana`,
                originalId: item.id,
                uuid: item.uuid,
                type: "vocabulary",
                questionType: "English",
                answerType: "Kana",
                question: item.english,
                answer: item.kana,
                hint: item.lexical_category
              });

              // Kana → English
              translation.push({
                id: `${item.id}-tr-kana-en`,
                originalId: item.id,
                uuid: item.uuid,
                type: "vocabulary",
                questionType: "Kana",
                answerType: "English",
                question: item.kana,
                answer: item.english,
                hint: item.lexical_category
              });

              // If kanji exists, add kanji question variations
              // NOTE: We only add variations where user types Kana or English
              // Users cannot type Kanji, so answerType: "Kanji" variations are excluded
              if (item.kanji) {
                // Kanji → English (user types English)
                translation.push({
                  id: `${item.id}-tr-kanji-en`,
                  originalId: item.id,
                  uuid: item.uuid,
                  type: "vocabulary",
                  questionType: "Kanji",
                  answerType: "English",
                  question: item.kanji,
                  answer: item.english,
                  hint: `${item.lexical_category} (${item.kana})`
                });

                // Kanji → Kana (user types Kana)
                translation.push({
                  id: `${item.id}-tr-kanji-kana`,
                  originalId: item.id,
                  uuid: item.uuid,
                  type: "vocabulary",
                  questionType: "Kanji",
                  answerType: "Kana",
                  question: item.kanji,
                  answer: item.kana,
                  hint: item.english
                });
              }
            } else if (item.type === "grammar") {
              // Title → Description
              translation.push({
                id: `${item.id}-tr-title-desc`,
                originalId: item.id,
                uuid: item.uuid,
                type: "grammar",
                questionType: "Grammar Pattern",
                answerType: "Description",
                question: item.title,
                answer: item.description,
                hint: item.topic
              });

              // Description → Title
              translation.push({
                id: `${item.id}-tr-desc-title`,
                originalId: item.id,
                uuid: item.uuid,
                type: "grammar",
                questionType: "Description",
                answerType: "Grammar Pattern",
                question: item.description,
                answer: item.title,
                hint: item.topic
              });
            }
          });
        }

        // Shuffle the translation array so questions appear in random order
        const shuffledTranslation = shuffleArray(translation);
        setTranslationArray(shuffledTranslation);

        // Console log all arrays for development
        console.log("=== SET DATA LOADED ===");
        console.log("Set Info:", setInfoData);
        console.log("Transformed Item Data:", transformedItemData);
        console.log("Total Items:", transformedItemData.length);
        console.log("\n=== REVIEW ARRAY ===");
        console.log("Review Items:", review);
        console.log("Total Review Items:", review.length);
        console.log("\n=== MULTIPLE CHOICE ARRAY ===");
        console.log("Multiple Choice Questions:", multipleChoice);
        console.log("Total Multiple Choice Questions:", multipleChoice.length);
        console.log("\n=== TRANSLATION ARRAY ===");
        console.log("Translation Questions:", translation);
        console.log("Total Translation Questions:", translation.length);
      } catch (err) {
        console.error("Error fetching set:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetData();
  }, [id, router.query.limit]);

  // Initialize active arrays when data is loaded
  useEffect(() => {
    if (itemData.length > 0) {
      setActiveReviewArray([...reviewArray]);
      setActiveMCArray([...multipleChoiceArray]);
      setActiveTranslationArray([...translationArray]);

      // Calculate total questions per phase (each variation counts separately)
      const progressConfig = {
        'multiple-choice': {
          completedItems: new Set(),
          totalUniqueItems: multipleChoiceArray.length
        }
      };

      // Only track translation phase for non-grammar sets
      if (setType !== 'grammar') {
        progressConfig['translation'] = {
          completedItems: new Set(),
          totalUniqueItems: translationArray.length
        };
      }

      setPhaseProgress(progressConfig);
    }
  }, [itemData, reviewArray, multipleChoiceArray, translationArray, setType]);

  // ============ HELPER FUNCTIONS ============

  // Get current array based on phase
  const getCurrentArray = () => {
    switch (currentPhase) {
      case 'review':
        return activeReviewArray;
      case 'multiple-choice':
        return activeMCArray;
      case 'translation':
        return activeTranslationArray;
      default:
        return [];
    }
  };

  // ============ CORE LOGIC HANDLERS ============

  // Handle answer submission for MC and Translation phases
  const handleAnswerSubmitted = (answerData) => {
    // Record the answer
    setAnsweredItems(prev => [...prev, {
      ...answerData,
      phase: currentPhase,
      timestamp: Date.now()
    }]);

    // Update session stats
    setSessionStats(prev => {
      const newCorrect = prev.correct + (answerData.isCorrect ? 1 : 0);
      const newIncorrect = prev.incorrect + (answerData.isCorrect ? 0 : 1);
      const newTotal = prev.totalAttempts + 1;

      return {
        correct: newCorrect,
        incorrect: newIncorrect,
        totalAttempts: newTotal,
        accuracy: Math.round((newCorrect / newTotal) * 100)
      };
    });

    // Track unique items completed for MC and Translation phases
    // Each variation (e.g., "English → Kana") counts as a separate completion
    if (answerData.isCorrect && (currentPhase === 'multiple-choice' || currentPhase === 'translation')) {
      const currentItem = getCurrentArray()[currentIndex];
      setPhaseProgress(prev => {
        const newCompletedItems = new Set(prev[currentPhase].completedItems);
        newCompletedItems.add(currentItem.id); // Use item.id (e.g., "vocab-1-mc-en-kana")
        return {
          ...prev,
          [currentPhase]: {
            ...prev[currentPhase],
            completedItems: newCompletedItems
          }
        };
      });
    }

    // If incorrect, add current item to end of array
    if (!answerData.isCorrect) {
      const currentItem = getCurrentArray()[currentIndex];

      if (currentPhase === 'multiple-choice') {
        setActiveMCArray(prev => [...prev, currentItem]);
      } else if (currentPhase === 'translation') {
        setActiveTranslationArray(prev => [...prev, currentItem]);
      }
    }

    // Store correctness for UI feedback
    setIsCorrect(answerData.isCorrect);
    setShowResult(true);
  };

  // Handle next navigation for MC and Translation
  const handleNext = () => {
    const currentArray = getCurrentArray();

    // Reset question state for next item
    setSelectedOption(null);
    setShowResult(false);
    setIsCorrect(false);
    setUserAnswer('');

    // Check if there are more items in current phase
    if (currentIndex < currentArray.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handlePhaseComplete();
    }
  };

  // Handle phase completion and transition
  const handlePhaseComplete = async () => {
    // Reset index for next phase
    setCurrentIndex(0);

    // Transition to next phase
    if (currentPhase === 'review') {
      setCurrentPhase('multiple-choice');
    } else if (currentPhase === 'multiple-choice') {
      // For grammar sets, skip translation and go directly to complete
      if (setType === 'grammar') {
        // Save all items to SRS before showing summary
        const success = await saveAllItemsToSRS();

        if (success) {
          setCurrentPhase('complete');
          // Trigger accuracy bar animation after a short delay
          setTimeout(() => setAnimateAccuracy(true), 100);
        }
        // If save fails, stay on multiple-choice phase and show error popup
      } else {
        // For vocab sets, transition to translation
        setCurrentPhase('translation');
      }
    } else if (currentPhase === 'translation') {
      // Save all items to SRS before showing summary
      const success = await saveAllItemsToSRS();

      if (success) {
        setCurrentPhase('complete');
        // Trigger accuracy bar animation after a short delay
        setTimeout(() => setAnimateAccuracy(true), 100);
      }
      // If save fails, stay on translation phase and show error popup
    }
  };

  // ============ REVIEW PHASE HANDLERS ============

  const handleReviewNext = () => {
    if (currentIndex < activeReviewArray.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handlePhaseComplete();
    }
  };

  const handleReviewPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // ============ MULTIPLE CHOICE HANDLERS ============

  const handleMCOptionSelect = (option) => {
    setSelectedOption(option);

    const currentItem = activeMCArray[currentIndex];
    const isCorrect = option === currentItem.answer;

    handleAnswerSubmitted({
      isCorrect,
      userAnswer: option,
      correctAnswer: currentItem.answer,
      questionId: currentItem.id,
      questionType: currentItem.questionType,
      answerType: currentItem.answerType,
      question: currentItem.question
    });
  };

  // ============ TRANSLATION HANDLERS ============

  const handleTranslationCheck = () => {
    const currentItem = activeTranslationArray[currentIndex];

    // Normalize answers for comparison
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = currentItem.answer.trim().toLowerCase();

    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    handleAnswerSubmitted({
      isCorrect,
      userAnswer,
      correctAnswer: currentItem.answer,
      questionId: currentItem.id,
      questionType: currentItem.questionType,
      answerType: currentItem.answerType,
      question: currentItem.question
    });
  };

  const handleTranslationRetry = () => {
    // User clicked "I was correct" button
    // Need to rollback everything:
    // 1. Remove the last answered item (the incorrect one we just added)
    // 2. Reverse the stats changes
    // 3. Remove the item from the end of the array (that was added due to incorrect answer)
    // 4. Mark the item as completed in phaseProgress (user says they were correct)
    // 5. Reset the UI state to allow retyping

    const currentItem = activeTranslationArray[currentIndex];

    // Remove last answered item
    setAnsweredItems(prev => prev.slice(0, -1));

    // Reverse stats changes (remove 1 incorrect, remove 1 total attempt)
    // Then add 1 correct (user claims they were correct)
    setSessionStats(prev => {
      const newIncorrect = Math.max(0, prev.incorrect - 1);
      const newCorrect = prev.correct + 1;
      const newTotal = prev.totalAttempts; // Same total, just switching incorrect to correct
      const newAccuracy = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0;

      return {
        ...prev,
        correct: newCorrect,
        incorrect: newIncorrect,
        accuracy: newAccuracy
      };
    });

    // Mark item as completed (user claims correct)
    setPhaseProgress(prev => {
      const newCompletedItems = new Set(prev[currentPhase].completedItems);
      newCompletedItems.add(currentItem.id); // Use item.id for individual variation
      return {
        ...prev,
        [currentPhase]: {
          ...prev[currentPhase],
          completedItems: newCompletedItems
        }
      };
    });

    // Remove the duplicate item from the end of the translation array
    // (it was added because the answer was marked incorrect)
    setActiveTranslationArray(prev => prev.slice(0, -1));

    // Reset UI state to allow retyping
    setShowResult(false);
    setIsCorrect(false);
    setUserAnswer('');

    // Focus the input field
    if (translationInputRef?.current) {
      translationInputRef.current.focus();
    }
  };

  // ============ GENERAL HANDLERS ============

  const handleExit = () => {
    router.push(`/learn/academy/sets/study/${id}`);
  };

  // ============ SRS SAVE FUNCTION ============

  const saveAllItemsToSRS = async () => {
    setIsSavingSRS(true);
    setSrsError(null);

    const errors = [];

    // Get unique UUIDs from reviewArray (one entry per item)
    for (const item of reviewArray) {
      if (!item.uuid) {
        console.warn(`Item ${item.id} has no UUID, skipping SRS save`);
        continue;
      }

      try {
        const response = await fetch(`/api/database/v2/srs/item/create-entry/${item.uuid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            srs_level: 1,
            scope: 'set_srs_flow_learn_new'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          errors.push(`Item ${item.uuid}: ${errorData.error || 'Failed to save'}`);
        }
      } catch (error) {
        errors.push(`Item ${item.uuid}: ${error.message}`);
      }
    }

    setIsSavingSRS(false);

    if (errors.length > 0) {
      setSrsError(`Failed to save ${errors.length} item(s) to SRS. Please try again.`);
      return false;
    }

    return true;
  };

  // ============ COMPUTED VALUES ============

  // Phase configuration for header
  const phases = useMemo(() => {
    const basePhases = [
      { id: 'review', name: 'Review', icon: FaBook, color: 'bg-blue-500', borderColor: 'border-blue-500' },
      { id: 'multiple-choice', name: 'Multiple Choice', icon: IoSparkles, color: 'bg-purple-500', borderColor: 'border-purple-500' }
    ];

    // Only add translation phase for non-grammar sets
    if (setType !== 'grammar') {
      basePhases.push({ id: 'translation', name: 'Translation', icon: FaDumbbell, color: 'bg-[#e30a5f]', borderColor: 'border-[#e30a5f]' });
    }

    return basePhases;
  }, [setType]);

  const currentPhaseIndex = phases.findIndex(p => p.id === currentPhase);
  const currentPhaseConfig = phases[currentPhaseIndex];
  const CurrentPhaseIcon = currentPhaseConfig?.icon;

  // Helper to get completed count for current phase
  const getCompletedCount = () => {
    if (currentPhase === 'review') {
      return currentIndex;
    }
    return phaseProgress[currentPhase]?.completedItems.size || 0;
  };

  // Helper to get total unique items for current phase
  const getTotalUniqueItems = () => {
    if (currentPhase === 'review') {
      return activeReviewArray.length;
    }
    return phaseProgress[currentPhase]?.totalUniqueItems || 0;
  };

  // Calculate progress percentage based on unique items completed
  const calculateProgressPercentage = () => {
    if (currentPhase === 'review') {
      // Review phase: use current index
      return activeReviewArray.length > 0
        ? ((currentIndex + 1) / activeReviewArray.length) * 100
        : 0;
    }

    // MC and Translation: use unique items completed
    const completed = getCompletedCount();
    const total = getTotalUniqueItems();
    return total > 0 ? (completed / total) * 100 : 0;
  };

  // Shuffle multiple choice options when question changes
  // Store shuffled options to preserve their positions when showing results
  useEffect(() => {
    if (currentPhase === 'multiple-choice' && activeMCArray[currentIndex] && !showResult) {
      const currentItem = activeMCArray[currentIndex];
      const options = [currentItem.answer, ...currentItem.distractors];

      // Fisher-Yates shuffle algorithm
      const shuffled = [...options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setCurrentShuffledOptions(shuffled);
    }
  }, [currentPhase, activeMCArray, currentIndex, showResult]);

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <AcademySidebar />
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
              Error Loading Set
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => router.push(`/learn/academy/sets/study/${id}`)}
              className="px-4 py-2 bg-[#e30a5f] text-white rounded-lg hover:bg-[#c00950] transition-colors"
            >
              Back to Study Set
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Learn New - {setInfo?.title || "Study Set"}</title>
        <meta name="description" content="Learn new cards in your study set" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#141f25] dark:to-[#1c2b35]">
        {/* Only show sidebar during complete phase (summary) */}
        {currentPhase === 'complete' && <AcademySidebar />}

        <main className="flex-1 flex flex-col p-3 sm:p-6">
          {/* Loading State */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-pulse mb-4">
                  <div className="w-64 h-32 bg-gray-200 dark:bg-white/10 rounded-lg mx-auto"></div>
                </div>
                <p className="text-gray-600 dark:text-white/70">Loading set data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Show completion summary */}
              {currentPhase === 'complete' && (
                <SRSQuizSummary
                  sessionStats={sessionStats}
                  answeredItems={answeredItems}
                  animateAccuracy={animateAccuracy}
                  onExit={handleExit}
                />
              )}

              {/* Show active phase components */}
              {currentPhase !== 'complete' && (
                <>
                  {/* Quiz Header */}
                  <SRSQuizHeader
                    setTitle={setInfo?.title}
                    sessionStats={sessionStats}
                    currentIndex={currentIndex}
                    totalQuestions={getCurrentArray().length}
                    currentPhase={currentPhase}
                    completedPhases={completedPhases}
                    phases={phases}
                    currentPhaseIndex={currentPhaseIndex}
                    currentPhaseConfig={currentPhaseConfig}
                    CurrentPhaseIcon={CurrentPhaseIcon}
                    progressInPhase={calculateProgressPercentage()}
                    completedCount={getCompletedCount()}
                    totalUniqueItems={getTotalUniqueItems()}
                    displayMode={currentPhase === 'review' ? 'question-count' : 'completion-count'}
                    onExit={handleExit}
                  />

                  {/* Review Phase */}
                  {currentPhase === 'review' && activeReviewArray.length > 0 && (
                    <SRSReviewCards
                      currentCard={activeReviewArray[currentIndex]}
                      isLastCard={currentIndex === activeReviewArray.length - 1}
                      isFirstCard={currentIndex === 0}
                      onNext={handleReviewNext}
                      onPrevious={handleReviewPrevious}
                    />
                  )}

                  {/* Multiple Choice Phase */}
                  {currentPhase === 'multiple-choice' && activeMCArray.length > 0 && (
                    <SRSMultipleChoice
                      currentItem={activeMCArray[currentIndex]}
                      uniqueOptions={currentShuffledOptions}
                      selectedOption={selectedOption}
                      showResult={showResult}
                      isCorrect={isCorrect}
                      isTransitioning={false}
                      isLastQuestion={currentIndex === activeMCArray.length - 1}
                      onOptionSelect={handleMCOptionSelect}
                      onNext={handleNext}
                    />
                  )}

                  {/* Translation Phase - Only for vocabulary sets */}
                  {currentPhase === 'translation' && setType !== 'grammar' && activeTranslationArray.length > 0 && !isSavingSRS && (
                    <SRSQuestionCard
                      currentItem={activeTranslationArray[currentIndex]}
                      userAnswer={userAnswer}
                      showResult={showResult}
                      isCorrect={isCorrect}
                      isLastQuestion={currentIndex === activeTranslationArray.length - 1}
                      inputRef={translationInputRef}
                      onInputChange={(e) => setUserAnswer(e.target.value)}
                      onCheckAnswer={handleTranslationCheck}
                      onNext={handleNext}
                      onRetry={handleTranslationRetry}
                    />
                  )}

                  {/* SRS Saving Loading Screen */}
                  {isSavingSRS && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto"></div>
                        <p className="text-xl font-semibold text-gray-700 dark:text-white">
                          Saving your progress to SRS...
                        </p>
                        <p className="text-sm text-gray-500 dark:text-white/70">
                          Please wait while we save your items
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* SRS Error Popup */}
              {srsError && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Failed to Save Progress
                        </h3>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-white/70">
                      {srsError}
                    </p>

                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={async () => {
                          setSrsError(null);
                          const success = await saveAllItemsToSRS();
                          if (success) {
                            setCurrentPhase('complete');
                            setTimeout(() => setAnimateAccuracy(true), 100);
                          }
                        }}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => setSrsError(null)}
                        className="flex-1 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}

export const getServerSideProps = withPageAuthRequired();
