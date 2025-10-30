// pages/learn/academy/sets/study/[id]/srs/learn-new.js
import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import AcademySidebar from "@/components/Sidebars/AcademySidebar";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // SRS Array states
  const [reviewArray, setReviewArray] = useState([]);
  const [multipleChoiceArray, setMultipleChoiceArray] = useState([]);
  const [translationArray, setTranslationArray] = useState([]);

  // TODO: Add your state management here
  // Example: currentIndex, quizItems, sessionStats, etc.

  // Fetch set data from API
  useEffect(() => {
    if (!id) return;

    const fetchSetData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/database/v2/sets/retrieve-set/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch set: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || "Failed to load set data");
        }

        const apiData = result.data;
        const setInfoData = apiData.data?.set;
        const setItemsAPI = apiData.data?.items || [];

        if (!setInfoData) {
          throw new Error("Invalid set data structure received from API");
        }

        setSetInfo({
          title: setInfoData.title || "Untitled Set",
          description: setInfoData.description?.toString() || ""
        });

        // Transform items to item data format
        const transformedItemData = Array.isArray(setItemsAPI)
          ? setItemsAPI
              .map((item, index) => {
                if (item.type === "vocab" || item.type === "vocabulary") {
                  return {
                    id: `vocab-${index}`,
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

        setMultipleChoiceArray(multipleChoice);

        // ============================================
        // STEP 3: Translation Array (all variations)
        // ============================================
        const translation = [];

        transformedItemData.forEach((item) => {
          if (item.type === "vocabulary") {
            // English → Kana
            translation.push({
              id: `${item.id}-tr-en-kana`,
              originalId: item.id,
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
              type: "vocabulary",
              questionType: "Kana",
              answerType: "English",
              question: item.kana,
              answer: item.english,
              hint: item.lexical_category
            });

            // If kanji exists, add kanji variations
            if (item.kanji) {
              // English → Kanji
              translation.push({
                id: `${item.id}-tr-en-kanji`,
                originalId: item.id,
                type: "vocabulary",
                questionType: "English",
                answerType: "Kanji",
                question: item.english,
                answer: item.kanji,
                hint: `${item.lexical_category} (${item.kana})`
              });

              // Kanji → English
              translation.push({
                id: `${item.id}-tr-kanji-en`,
                originalId: item.id,
                type: "vocabulary",
                questionType: "Kanji",
                answerType: "English",
                question: item.kanji,
                answer: item.english,
                hint: `${item.lexical_category} (${item.kana})`
              });

              // Kana → Kanji
              translation.push({
                id: `${item.id}-tr-kana-kanji`,
                originalId: item.id,
                type: "vocabulary",
                questionType: "Kana",
                answerType: "Kanji",
                question: item.kana,
                answer: item.kanji,
                hint: item.english
              });

              // Kanji → Kana
              translation.push({
                id: `${item.id}-tr-kanji-kana`,
                originalId: item.id,
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
              type: "grammar",
              questionType: "Description",
              answerType: "Grammar Pattern",
              question: item.description,
              answer: item.title,
              hint: item.topic
            });
          }
        });

        setTranslationArray(translation);

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
  }, [id]);

  // TODO: Implement your quiz logic here
  // Example functions you might need:
  // - handleAnswerSubmitted
  // - handleNext
  // - handlePrevious
  // - handleExit
  // - etc.

  const handleExit = () => {
    router.push(`/learn/academy/sets/study/${id}`);
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
        <title>Learn New - {setInfo?.title || "Study Set"}</title>
        <meta name="description" content="Learn new cards in your study set" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#141f25] dark:to-[#1c2b35]">
        <AcademySidebar />

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
              {/* TODO: Render your SRS components here based on current state */}

              {/* Example: Header Component */}
              {/* <SRSQuizHeader
                setTitle={setInfo?.title}
                sessionStats={sessionStats}
                currentIndex={currentIndex}
                totalQuestions={totalQuestions}
                currentPhase={currentPhase}
                quizMode={quizMode}
                completedPhases={completedPhases}
                phases={phases}
                currentPhaseIndex={currentPhaseIndex}
                currentPhaseConfig={currentPhaseConfig}
                CurrentPhaseIcon={CurrentPhaseIcon}
                progressInPhase={progressInPhase}
                onExit={handleExit}
              /> */}

              {/* Example: Review Cards Component */}
              {/* <SRSReviewCards
                currentCard={itemData[currentIndex]}
                isLastCard={currentIndex === itemData.length - 1}
                isFirstCard={currentIndex === 0}
                onNext={handleNext}
                onPrevious={handlePrevious}
              /> */}

              {/* Example: Multiple Choice Component */}
              {/* <SRSMultipleChoice
                currentItem={currentItem}
                uniqueOptions={uniqueOptions}
                selectedOption={selectedOption}
                showResult={showResult}
                isCorrect={isCorrect}
                isTransitioning={isTransitioning}
                isLastQuestion={isLastQuestion}
                onOptionSelect={handleOptionSelect}
                onNext={handleNext}
              /> */}

              {/* Example: Question Card Component */}
              {/* <SRSQuestionCard
                currentItem={currentItem}
                userAnswer={userAnswer}
                showResult={showResult}
                isCorrect={isCorrect}
                showHint={showHint}
                isLastQuestion={isLastQuestion}
                inputRef={inputRef}
                onInputChange={handleInputChange}
                onCheckAnswer={handleCheckAnswer}
                onNext={handleNext}
                onRetry={handleRetry}
              /> */}

              {/* Example: Quiz Summary Component */}
              {/* <SRSQuizSummary
                sessionStats={sessionStats}
                answeredItems={answeredItems}
                animateAccuracy={animateAccuracy}
                onRetry={handleRetry}
                onExit={handleExit}
              /> */}

              {/* Placeholder UI */}
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-white dark:bg-white/10 rounded-2xl shadow-xl p-8 max-w-2xl">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    SRS Learn New - Ready for Implementation
                  </h2>
                  <p className="text-gray-600 dark:text-white/70 mb-4">
                    All components are imported and the set data is loaded.
                  </p>
                  <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 dark:text-white/80 mb-2">
                      <strong>Set:</strong> {setInfo?.title}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-white/80">
                      <strong>Total Items:</strong> {itemData.length}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-white/50">
                    Check the console for the full set data array.
                  </p>
                  <button
                    onClick={handleExit}
                    className="mt-6 w-full px-4 py-2 bg-[#e30a5f] hover:bg-[#f41567] text-white rounded-lg font-medium transition-colors"
                  >
                    Back to Study Set
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}

export const getServerSideProps = withPageAuthRequired();
