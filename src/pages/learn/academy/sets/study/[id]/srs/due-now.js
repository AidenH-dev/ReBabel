// pages/learn/academy/sets/study/[id]/srs/due-now.js
import Head from "next/head";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import AcademySidebar from "@/components/Sidebars/AcademySidebar";

// Import icons for phase indicators
import { FaDumbbell } from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";

// Import SRS Learn New Components
import SRSQuizHeader from "@/components/pages/academy/sets/SRSLearnNewSet/QuizHeader/SRSQuizHeader";
import TypedResponseView from "@/components/Set/Features/Field-Card-Session/shared/views/TypedResponseView.jsx";
import MultipleChoiceView from "@/components/Set/Features/Field-Card-Session/shared/views/MultipleChoiceView.jsx";
import SRSQuizSummary from "@/components/pages/academy/sets/SRSLearnNewSet/QuizSummary/SRSQuizSummary";
import SRSLevelChange from "@/components/pages/academy/sets/SRSLearnNewSet/LevelChange/SRSLevelChange";

export default function DueNow() {
  const router = useRouter();
  const { id } = router.query;

  // Data states
  const [itemData, setItemData] = useState([]);
  const [setInfo, setSetInfo] = useState(null);
  const [setType, setSetType] = useState(null); // 'vocab' | 'grammar'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // SRS Array states - translation and multiple choice
  const [translationArray, setTranslationArray] = useState([]);
  const [multipleChoiceArray, setMultipleChoiceArray] = useState([]);

  // ============ PHASE MANAGEMENT ============
  const [currentPhase, setCurrentPhase] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ============ ACTIVE ARRAYS (MUTABLE) ============
  const [activeTranslationArray, setActiveTranslationArray] = useState([]);
  const [activeMCArray, setActiveMCArray] = useState([]);

  // ============ QUESTION STATE (Translation) ============
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');

  // ============ QUESTION STATE (Multiple Choice) ============
  const [selectedOption, setSelectedOption] = useState(null);
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
    'translation': {
      completedItems: new Set(),
      totalUniqueItems: 0
    }
  });
  const [completedPhases, setCompletedPhases] = useState([]);

  // ============ SRS LEVEL TRACKING ============
  const [itemSRSLevels, setItemSRSLevels] = useState({}); // Map of originalId -> { level, mistakes }
  const [mistakesPerItem, setMistakesPerItem] = useState({}); // Map of originalId -> number of mistakes in this session
  const [showLevelChange, setShowLevelChange] = useState(false);
  const [currentLevelChange, setCurrentLevelChange] = useState(null); // { item, oldLevel, newLevel }
  const [shouldGoToSummaryAfterLevelChange, setShouldGoToSummaryAfterLevelChange] = useState(false);

  // ============ REFS ============
  const translationInputRef = useRef(null);

  // Fetch set data from API
  useEffect(() => {
    if (!id) return;

    const fetchSetData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/database/v2/srs/set/due/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch set: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || "Failed to load set data");
        }

        const apiData = result.data;
        const setInfoData = apiData.set;
        const setItemsAPI = apiData.items || [];

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
                      : [item.example_sentences].filter(Boolean),
                    srs_level: item.srs?.srs_level || 1 // Get SRS level from new API structure
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
                      : [],
                    srs_level: item.srs?.srs_level || 1 // Get SRS level from new API structure
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
        // Initialize SRS levels for each item
        // ============================================
        const srsLevelsMap = {};
        const mistakesMap = {};
        transformedItemData.forEach((item) => {
          srsLevelsMap[item.id] = item.srs_level || 1;
          mistakesMap[item.id] = 0; // Start with 0 mistakes
        });
        setItemSRSLevels(srsLevelsMap);
        setMistakesPerItem(mistakesMap);

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
        // HELPER: Get Distractors for Multiple Choice
        // ============================================
        const getDistractors = (correctAnswer, answerType, itemType) => {
          const allOptions = [];

          transformedItemData.forEach((dataItem) => {
            if (dataItem.type === itemType) {
              let value = null;

              if (itemType === "grammar") {
                if (answerType === "Description") {
                  value = dataItem.description;
                } else if (answerType === "Grammar Pattern") {
                  value = dataItem.title;
                }
              } else if (itemType === "vocabulary") {
                if (answerType === "Kana") {
                  value = dataItem.kana;
                } else if (answerType === "English") {
                  value = dataItem.english;
                }
              }

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

        // ============================================
        // QUESTION ARRAYS: Separate by Type
        // ============================================
        const translation = [];
        const multipleChoice = [];

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
            // Grammar: Title → Description (Multiple Choice)
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

            // Grammar: Description → Title (Multiple Choice)
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

        // Shuffle the arrays so questions appear in random order
        const shuffledTranslation = shuffleArray(translation);
        const shuffledMultipleChoice = shuffleArray(multipleChoice);
        setTranslationArray(shuffledTranslation);
        setMultipleChoiceArray(shuffledMultipleChoice);

        // Determine initial phase based on which arrays have content
        let initialPhase = null;
        if (shuffledMultipleChoice.length > 0) {
          initialPhase = 'multiple-choice';
        } else if (shuffledTranslation.length > 0) {
          initialPhase = 'translation';
        }
        setCurrentPhase(initialPhase);

        // Console log all arrays for development
        console.log("=== SET DATA LOADED ===");
        console.log("Set Info:", setInfoData);
        console.log("Set Type:", setInfoData.set_type);
        console.log("Transformed Item Data:", transformedItemData);
        console.log("Total Items:", transformedItemData.length);
        console.log("\n=== MULTIPLE CHOICE ARRAY ===");
        console.log("MC Questions:", multipleChoice);
        console.log("Total MC Questions:", multipleChoice.length);
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
  }, [id]);

  // Initialize active arrays when data is loaded
  useEffect(() => {
    if (itemData.length > 0) {
      setActiveTranslationArray([...translationArray]);
      setActiveMCArray([...multipleChoiceArray]);

      // Calculate total questions per phase (each variation counts separately)
      const phaseProgressObj = {};
      if (multipleChoiceArray.length > 0) {
        phaseProgressObj['multiple-choice'] = {
          completedItems: new Set(),
          totalUniqueItems: multipleChoiceArray.length
        };
      }
      if (translationArray.length > 0) {
        phaseProgressObj['translation'] = {
          completedItems: new Set(),
          totalUniqueItems: translationArray.length
        };
      }
      setPhaseProgress(phaseProgressObj);
    }
  }, [itemData, translationArray, multipleChoiceArray]);

  // Shuffle MC options whenever the current item or phase changes
  useEffect(() => {
    if (currentPhase === 'multiple-choice' && activeMCArray.length > 0) {
      const currentItem = activeMCArray[currentIndex];
      if (currentItem) {
        const options = [currentItem.answer, ...currentItem.distractors];
        // Fisher-Yates shuffle
        const shuffled = [...options];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setCurrentShuffledOptions(shuffled);
        setSelectedOption(null); // Reset selection
      }
    }
  }, [currentPhase, activeMCArray, currentIndex]);

  // ============ HELPER FUNCTIONS ============

  // Get current array based on phase
  const getCurrentArray = () => {
    if (currentPhase === 'multiple-choice') {
      return activeMCArray;
    }
    return activeTranslationArray;
  };

  // ============ CORE LOGIC HANDLERS ============

  // Handle Multiple Choice option selection
  const handleMCOptionSelect = (selectedAnswer) => {
    const currentItem = activeMCArray[currentIndex];
    const isCorrect = selectedAnswer === currentItem.answer;

    // Call handleAnswerSubmitted with MC answer data
    handleAnswerSubmitted({
      isCorrect,
      userAnswer: selectedAnswer,
      correctAnswer: currentItem.answer,
      questionId: currentItem.id,
      questionType: currentItem.questionType,
      answerType: currentItem.answerType,
      question: currentItem.question
    });

    // Show result
    setSelectedOption(selectedAnswer);
    setShowResult(true);
    setIsCorrect(isCorrect);
  };

  // Handle answer submission for Translation phase
  const handleAnswerSubmitted = (answerData) => {
    const currentItem = getCurrentArray()[currentIndex];
    const originalId = currentItem.originalId; // e.g., "vocab-1"

    // Record the answer
    setAnsweredItems(prev => [...prev, {
      ...answerData,
      phase: currentPhase,
      timestamp: Date.now(),
      originalId: originalId
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

    // Track mistakes per original item (not per question variation)
    if (!answerData.isCorrect) {
      setMistakesPerItem(prev => ({
        ...prev,
        [originalId]: (prev[originalId] || 0) + 1
      }));
    }

    // Track unique items completed for Translation phase
    // Each variation (e.g., "English → Kana") counts as a separate completion
    if (answerData.isCorrect) {
      setPhaseProgress(prev => {
        const newCompletedItems = new Set(prev[currentPhase].completedItems);
        newCompletedItems.add(currentItem.id); // Use item.id (e.g., "vocab-1-tr-en-kana")
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
      setActiveTranslationArray(prev => [...prev, currentItem]);
    }

    // Store correctness for UI feedback
    setIsCorrect(answerData.isCorrect);
    setShowResult(true);
  };

  // Handle next navigation for Translation
  const handleNext = () => {
    const currentArray = getCurrentArray();
    const currentItem = currentArray[currentIndex];
    const originalId = currentItem.originalId;

    // Check if this is the last question
    const isLastQuestion = currentIndex >= currentArray.length - 1;

    // Reset question state before checking for level change
    setShowResult(false);
    setIsCorrect(false);
    setUserAnswer('');

    // Check if all question variations for this original item are now completed
    const willShowLevelChange = checkAndTriggerLevelChange(originalId);

    // If this is the last question AND we're showing a level change,
    // wait for the level change animation to complete before going to summary
    if (isLastQuestion && willShowLevelChange) {
      setShouldGoToSummaryAfterLevelChange(true);
      // Don't proceed further - wait for level change animation to complete
      return;
    }

    // Check if there are more items in current phase
    if (currentIndex < currentArray.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handlePhaseComplete();
    }
  };

  // Check if all variations of an item are completed and trigger level change
  // Returns true if level change was triggered, false otherwise
  const checkAndTriggerLevelChange = (originalId) => {
    // Find all question variations for this original item in the translation array
    const questionsForItem = translationArray.filter(q => q.originalId === originalId);
    const totalVariations = questionsForItem.length;

    // Count how many variations have been completed
    const completedVariations = questionsForItem.filter(q =>
      phaseProgress.translation.completedItems.has(q.id)
    ).length;

    // If all variations are completed, calculate and show level change
    if (completedVariations === totalVariations) {
      const originalItem = itemData.find(item => item.id === originalId);
      if (!originalItem) return false;

      const oldLevel = itemSRSLevels[originalId] || 1;
      const mistakes = mistakesPerItem[originalId] || 0;

      // Calculate new level: +1 if no mistakes, -1 if any mistakes
      const newLevel = mistakes === 0 ? oldLevel + 1 : Math.max(1, oldLevel - 1);

      // Update the SRS level
      setItemSRSLevels(prev => ({
        ...prev,
        [originalId]: newLevel
      }));

      // Show level change animation
      setCurrentLevelChange({
        item: originalItem,
        oldLevel,
        newLevel
      });
      setShowLevelChange(true);

      // Save the new SRS level to the database (pass UUID, not generated ID)
      saveSRSLevel(originalItem.uuid, newLevel);

      console.log(`SRS Level Update: ${originalId} - ${oldLevel} → ${newLevel} (mistakes: ${mistakes})`);

      return true; // Level change was triggered
    }

    return false; // No level change
  };

  // Save SRS level to database
  const saveSRSLevel = async (uuid, newLevel) => {
    try {
      const response = await fetch(`/api/database/v2/srs/item/create-entry/${uuid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          srs_level: newLevel,
          scope: 'set_srs_flow_due_now_review'
        })
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Failed to save SRS level:', result.error);
      } else {
        console.log(`Successfully saved SRS level for ${uuid}: ${newLevel}`);
      }
    } catch (error) {
      console.error('Error saving SRS level:', error);
    }
  };

  // Handle phase completion and transition
  const handlePhaseComplete = () => {
    // Determine next phase
    if (currentPhase === 'multiple-choice') {
      // MC completed, move to translation if it exists
      if (translationArray.length > 0) {
        setCurrentPhase('translation');
        setCurrentIndex(0);
        setShowResult(false);
        setUserAnswer('');
      } else {
        // No translation, go to summary
        setCurrentPhase('complete');
        setTimeout(() => setAnimateAccuracy(true), 100);
      }
    } else if (currentPhase === 'translation') {
      // Translation completed, go to summary
      setCurrentPhase('complete');
      setTimeout(() => setAnimateAccuracy(true), 100);
    }
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
    // 5. Decrement the mistake count for this item
    // 6. Reset the UI state to allow retyping

    const currentItem = activeTranslationArray[currentIndex];
    const originalId = currentItem.originalId;

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

    // Decrement mistake count (user claims they were correct)
    setMistakesPerItem(prev => ({
      ...prev,
      [originalId]: Math.max(0, (prev[originalId] || 0) - 1)
    }));

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

  const handleLevelChangeComplete = () => {
    // Hide the level change animation
    setShowLevelChange(false);
    setCurrentLevelChange(null);

    // If we were waiting to go to summary after this level change, do it now
    if (shouldGoToSummaryAfterLevelChange) {
      setShouldGoToSummaryAfterLevelChange(false);
      handlePhaseComplete();
    }
  };

  // ============ COMPUTED VALUES ============

  // Phase configuration for header - dynamic based on content
  const phases = useMemo(() => {
    const phaseArray = [];

    if (multipleChoiceArray.length > 0) {
      phaseArray.push({
        id: 'multiple-choice',
        name: 'Multiple Choice',
        icon: IoSparkles,
        color: 'bg-purple-500',
        borderColor: 'border-purple-500'
      });
    }

    if (translationArray.length > 0) {
      phaseArray.push({
        id: 'translation',
        name: 'Translation',
        icon: FaDumbbell,
        color: 'bg-[#e30a5f]',
        borderColor: 'border-[#e30a5f]'
      });
    }

    return phaseArray;
  }, [multipleChoiceArray, translationArray]);

  const currentPhaseIndex = phases.findIndex(p => p.id === currentPhase);
  const currentPhaseConfig = phases[currentPhaseIndex];
  const CurrentPhaseIcon = currentPhaseConfig?.icon;

  // Helper to get completed count for current phase
  const getCompletedCount = () => {
    return phaseProgress[currentPhase]?.completedItems.size || 0;
  };

  // Helper to get total unique items for current phase
  const getTotalUniqueItems = () => {
    return phaseProgress[currentPhase]?.totalUniqueItems || 0;
  };

  // Calculate progress percentage based on unique items completed
  const calculateProgressPercentage = () => {
    // Translation: use unique items completed
    const completed = getCompletedCount();
    const total = getTotalUniqueItems();
    return total > 0 ? (completed / total) * 100 : 0;
  };

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
        <title>Due Now - {setInfo?.title || "Study Set"}</title>
        <meta name="description" content="Review cards that are due now" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#141f25] dark:to-[#1c2b35]">
        {/* Only show sidebar during complete phase (summary) */}
        {currentPhase === 'complete' && <AcademySidebar />}

        {/* SRS Level Change Animation Overlay */}
        {showLevelChange && currentLevelChange && (
          <SRSLevelChange
            item={currentLevelChange.item}
            oldLevel={currentLevelChange.oldLevel}
            newLevel={currentLevelChange.newLevel}
            onComplete={handleLevelChangeComplete}
          />
        )}

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
                    displayMode={'completion-count'}
                    onExit={handleExit}
                  />

                  {/* Multiple Choice Phase */}
                  {currentPhase === 'multiple-choice' && activeMCArray.length > 0 && (
                    <MultipleChoiceView
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

                  {/* Translation Phase */}
                  {currentPhase === 'translation' && activeTranslationArray.length > 0 && (
                    <TypedResponseView
                      currentItem={activeTranslationArray[currentIndex]}
                      userAnswer={userAnswer}
                      showResult={showResult}
                      isCorrect={isCorrect}
                      showHint={false}
                      isLastQuestion={currentIndex === activeTranslationArray.length - 1}
                      inputRef={translationInputRef}
                      onInputChange={(e) => setUserAnswer(e.target.value)}
                      onCheckAnswer={handleTranslationCheck}
                      onNext={handleNext}
                      onRetry={handleTranslationRetry}
                    />
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}

export const getServerSideProps = withPageAuthRequired();
