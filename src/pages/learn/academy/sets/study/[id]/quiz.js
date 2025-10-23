// pages/learn/academy/sets/study/[id]/quiz.js
import Head from "next/head";
import MainSidebar from "@/components/Sidebars/AcademySidebar";
import MasterQuizModeSelect from "@/components/pages/academy/sets/QuizSet/ModeSelect/MasterQuizModeSelect.jsx";
import MasterQuizHeader from "@/components/pages/academy/sets/QuizSet/QuizHeader/MasterQuizHeader.jsx";
import MasterQuestionCard from "@/components/pages/academy/sets/QuizSet/QuestionCard/MasterQuestionCard.jsx";
import MasterQuizSummary from "@/components/pages/academy/sets/QuizSet/QuizSummary/MasterQuizSummary.jsx";
import MasterReviewCards from "@/components/pages/academy/sets/QuizSet/ReviewCards/MasterReviewCards.jsx";
import MasterMultipleChoice from "@/components/pages/academy/sets/QuizSet/MultipleChoice/MasterMultipleChoice.jsx";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default function SetQuiz() {
    const router = useRouter();
    const { id } = router.query;

    const [cardsData, setCardsData] = useState([]);
    const [setInfo, setSetInfo] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Quiz mode states
    const [quizMode, setQuizMode] = useState(null); // null | 'completely-new' | 'new' | 'practice'
    const [modeSelectionComplete, setModeSelectionComplete] = useState(false);

    // Quiz phase tracking
    const [currentPhase, setCurrentPhase] = useState(null); // 'review' | 'multiple-choice' | 'translation'
    const [completedPhases, setCompletedPhases] = useState([]); // Track which phases are done
    const [multipleChoiceItems, setMultipleChoiceItems] = useState([]); // Items for multiple choice
    const [reviewItems, setReviewItems] = useState([]); // Items for review (cards data)

    // Quiz specific states
    const [quizItems, setQuizItems] = useState([]);
    const [quizCompleted, setQuizCompleted] = useState(false);

    // Quiz statistics
    const [itemStats, setItemStats] = useState({});
    const [sessionStats, setSessionStats] = useState({
        correct: 0,
        incorrect: 0,
        totalAttempts: 0,
        accuracy: 0
    });
    const [answeredItems, setAnsweredItems] = useState([]);
    const [animateAccuracy, setAnimateAccuracy] = useState(false);

    // Fetch Data from API
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

                // Transform items to flashcard format
                const transformedCards = Array.isArray(setItemsAPI)
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

                if (transformedCards.length === 0) {
                    throw new Error("This set has no items to study");
                }

                setCardsData(transformedCards);

                // Generate quiz items from cards
                const generatedQuizItems = generateQuizItems(transformedCards);
                setQuizItems(shuffleArray(generatedQuizItems));

                // Initialize item statistics
                const stats = {};
                generatedQuizItems.forEach((item) => {
                    stats[item.id] = { passed: 0, failed: 0, attempts: 0 };
                });
                setItemStats(stats);
            } catch (err) {
                console.error("Error fetching set:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSetData();
    }, [id]);

    // Trigger accuracy bar animation when quiz completes
    useEffect(() => {
        if (quizCompleted) {
            // Small delay before animating for better visual effect
            const timer = setTimeout(() => {
                setAnimateAccuracy(true);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [quizCompleted]);

    // Generate quiz items based on card type
    const generateQuizItems = (cards) => {
        const items = [];

        cards.forEach((card) => {
            if (card.type === "vocabulary") {
                // English to Kana
                items.push({
                    id: `${card.id}-en-kana`,
                    originalId: card.id,
                    type: "vocab-en-kana",
                    question: card.english,
                    answer: card.kana,
                    hint: card.lexical_category,
                    questionType: "English",
                    answerType: "Kana"
                });

                if (card.kanji) {
                    // Kanji to English
                    items.push({
                        id: `${card.id}-kanji-en`,
                        originalId: card.id,
                        type: "vocab-kanji-en",
                        question: card.kanji,
                        answer: card.english,
                        hint: `${card.lexical_category} (${card.kana})`,
                        questionType: "Kanji",
                        answerType: "English"
                    });

                    // Kanji to Kana
                    items.push({
                        id: `${card.id}-kanji-kana`,
                        originalId: card.id,
                        type: "vocab-kanji-kana",
                        question: card.kanji,
                        answer: card.kana,
                        hint: card.english,
                        questionType: "Kanji",
                        answerType: "Kana"
                    });
                } else {
                    // Kana to English (when no kanji)
                    items.push({
                        id: `${card.id}-kana-en`,
                        originalId: card.id,
                        type: "vocab-kana-en",
                        question: card.kana,
                        answer: card.english,
                        hint: card.lexical_category,
                        questionType: "Kana",
                        answerType: "English"
                    });
                }
            } else if (card.type === "grammar") {
                // Title to Description
                items.push({
                    id: `${card.id}-title-desc`,
                    originalId: card.id,
                    type: "grammar-title-desc",
                    question: card.title,
                    answer: card.description,
                    hint: card.topic,
                    questionType: "Grammar Pattern",
                    answerType: "Description"
                });

                // Description to Title
                items.push({
                    id: `${card.id}-desc-title`,
                    originalId: card.id,
                    type: "grammar-desc-title",
                    question: card.description,
                    answer: card.title,
                    hint: card.topic,
                    questionType: "Description",
                    answerType: "Grammar Pattern"
                });
            }
        });

        return items;
    };

    // Shuffle array
    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Generate 4 options for multiple choice (1 correct + 3 wrong)
    const generateOptions = (correctItem, allItems) => {
        const options = [correctItem.answer];

        // Get wrong answers from other items with same answer type
        const wrongAnswers = allItems
            .filter(item =>
                item.id !== correctItem.id &&
                item.answerType === correctItem.answerType &&
                item.answer !== correctItem.answer
            )
            .map(item => item.answer);

        // Shuffle and take 3 random wrong answers
        const shuffledWrong = shuffleArray(wrongAnswers);
        for (let i = 0; i < 3 && i < shuffledWrong.length; i++) {
            options.push(shuffledWrong[i]);
        }

        // If we don't have enough unique wrong answers, add some placeholders
        while (options.length < 4) {
            options.push(`Option ${options.length}`);
        }

        return shuffleArray(options);
    };

    // Function to initialize multiple choice questions
    const initializeMultipleChoice = () => {
        // Generate multiple choice questions from quiz items
        const mcQuestions = quizItems.map(item => ({
            ...item,
            options: generateOptions(item, quizItems)
        }));
        setMultipleChoiceItems(shuffleArray(mcQuestions));
    };

    // Handle mode selection
    const handleModeSelect = (mode) => {
        console.log("Selected quiz mode:", mode);
        setQuizMode(mode);

        // Initialize quiz based on mode
        if (mode === 'practice') {
            // Practice mode - go straight to translation
            setCurrentPhase('translation');
            setModeSelectionComplete(true);
        } else if (mode === 'new') {
            // New mode - start with multiple choice
            setCurrentPhase('multiple-choice');
            initializeMultipleChoice();
            setModeSelectionComplete(true);
        } else if (mode === 'completely-new') {
            // Completely new mode - start with review
            setCurrentPhase('review');
            setReviewItems(cardsData);
            setModeSelectionComplete(true);
        }
    };

    // Handle phase completion and transition
    const handlePhaseComplete = () => {
        setCompletedPhases(prev => [...prev, currentPhase]);

        if (quizMode === 'completely-new') {
            if (currentPhase === 'review') {
                // Move to multiple choice
                setCurrentPhase('multiple-choice');
                initializeMultipleChoice();
                setCurrentIndex(0);
            } else if (currentPhase === 'multiple-choice') {
                // Move to translation
                setCurrentPhase('translation');
                setCurrentIndex(0);
            } else {
                // All phases complete
                setQuizCompleted(true);
            }
        } else if (quizMode === 'new') {
            if (currentPhase === 'multiple-choice') {
                // Move to translation
                setCurrentPhase('translation');
                setCurrentIndex(0);
            } else {
                // All phases complete
                setQuizCompleted(true);
            }
        } else {
            // Practice mode - only translation phase
            setQuizCompleted(true);
        }
    };

    // Handle answer submission and retraction
    const handleAnswerSubmitted = useCallback((answerData) => {
        // Handle retraction
        if (answerData.isRetraction) {
            setAnsweredItems(prev => prev.slice(0, -1));
            setItemStats(prev => {
                const updated = { ...prev };
                updated[answerData.itemId].attempts -= 1;
                updated[answerData.itemId].failed -= 1;
                return updated;
            });
            setSessionStats(prev => ({
                ...prev,
                incorrect: prev.incorrect - 1,
                totalAttempts: prev.totalAttempts - 1,
                accuracy: prev.totalAttempts - 1 > 0
                    ? Math.round((prev.correct / (prev.totalAttempts - 1)) * 100)
                    : 0
            }));
            return;
        }

        // Add to answered items
        setAnsweredItems(prev => [...prev, answerData]);

        // Update item stats
        setItemStats(prev => {
            const updated = { ...prev };
            updated[answerData.itemId].attempts += 1;
            if (answerData.isCorrect) {
                updated[answerData.itemId].passed += 1;
            } else {
                updated[answerData.itemId].failed += 1;
            }
            return updated;
        });

        // Update session stats
        setSessionStats(prev => ({
            ...prev,
            correct: answerData.isCorrect ? prev.correct + 1 : prev.correct,
            incorrect: answerData.isCorrect ? prev.incorrect : prev.incorrect + 1,
            totalAttempts: prev.totalAttempts + 1,
            accuracy: Math.round(
                ((answerData.isCorrect ? prev.correct + 1 : prev.correct) / (prev.totalAttempts + 1)) * 100
            )
        }));
    }, []);

    // Handle quiz retry
    const handleRetry = () => {
        setQuizCompleted(false);
        setCurrentIndex(0);
        setAnsweredItems([]);
        setAnimateAccuracy(false);
        setCompletedPhases([]);
        setSessionStats({
            correct: 0,
            incorrect: 0,
            totalAttempts: 0,
            accuracy: 0
        });
        const stats = {};
        quizItems.forEach((item) => {
            stats[item.id] = { passed: 0, failed: 0, attempts: 0 };
        });
        setItemStats(stats);
        setQuizItems(shuffleArray(quizItems));

        // Restart from first phase of selected mode
        if (quizMode === 'practice') {
            setCurrentPhase('translation');
        } else if (quizMode === 'new') {
            setCurrentPhase('multiple-choice');
            initializeMultipleChoice();
        } else if (quizMode === 'completely-new') {
            setCurrentPhase('review');
            setReviewItems(cardsData);
        }
    };

    // Handle exit
    const handleExit = () => {
        console.log("=== QUIZ SESSION ENDED ===");
        console.log("Final Statistics:", {
            sessionStats,
            itemBreakdown: itemStats
        });
        router.push(`/learn/academy/sets/study/${id}`);
    };

    // Get current items based on phase
    const getCurrentItems = () => {
        if (currentPhase === 'review') return reviewItems;
        if (currentPhase === 'multiple-choice') return multipleChoiceItems;
        return quizItems;
    };

    // Show error state
    if (error) {
        return (
            <div className="flex h-screen min-h-0 bg-gray-50 dark:bg-[#141f25]">
                <MainSidebar />
                <main className="ml-auto flex-1 px-4 sm:px-6 py-4 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
                            Error Loading Quiz
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                        <button
                            onClick={() => router.push("/learn/academy/sets")}
                            className="px-4 py-2 bg-[#e30a5f] text-white rounded-lg hover:bg-[#c00950] transition-colors"
                        >
                            Back to Sets
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#141f25] dark:to-[#1c2b35]">
            {quizCompleted && <MainSidebar />}
            <main className={`flex-1 flex flex-col p-3 sm:p-6 ${quizCompleted ? 'ml-0 lg:ml-auto' : 'w-full'}`}>
                <Head>
                    <title>Quiz • {setInfo?.title || "Study Set"}</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-pulse mb-4">
                                <div className="w-64 h-32 bg-gray-200 dark:bg-white/10 rounded-lg mx-auto"></div>
                            </div>
                            <p className="text-gray-600 dark:text-white/70">Loading quiz...</p>
                        </div>
                    </div>
                ) : !modeSelectionComplete ? (
                    /* Mode Selection Screen */
                    <MasterQuizModeSelect
                        setTitle={setInfo?.title}
                        onSelectMode={handleModeSelect}
                        onExit={handleExit}
                    />
                ) : (
                    <>
                        {/* Header */}
                        {!quizCompleted && (
                            <MasterQuizHeader
                                setTitle={setInfo?.title}
                                sessionStats={sessionStats}
                                currentIndex={currentIndex}
                                totalQuestions={getCurrentItems().length}
                                currentPhase={currentPhase}
                                quizMode={quizMode}
                                completedPhases={completedPhases}
                                onExit={handleExit}
                            />
                        )}

                        {/* Main Quiz Area */}
                        {quizCompleted ? (
                            <MasterQuizSummary
                                sessionStats={sessionStats}
                                quizItems={quizItems}
                                answeredItems={answeredItems}
                                animateAccuracy={animateAccuracy}
                                onRetry={handleRetry}
                                onExit={handleExit}
                            />
                        ) : currentPhase === 'review' ? (
                            <MasterReviewCards
                                cards={reviewItems}
                                currentIndex={currentIndex}
                                onNext={() => {
                                    if (currentIndex < reviewItems.length - 1) {
                                        setCurrentIndex(prev => prev + 1);
                                    } else {
                                        handlePhaseComplete();
                                    }
                                }}
                                onPrevious={() => {
                                    if (currentIndex > 0) {
                                        setCurrentIndex(prev => prev - 1);
                                    }
                                }}
                            />
                        ) : currentPhase === 'multiple-choice' ? (
                            <MasterMultipleChoice
                                quizItems={multipleChoiceItems}
                                currentIndex={currentIndex}
                                onAnswerSubmitted={handleAnswerSubmitted}
                                onNext={() => setCurrentIndex(prev => prev + 1)}
                                onComplete={handlePhaseComplete}
                            />
                        ) : (
                            <MasterQuestionCard
                                quizItems={quizItems}
                                currentIndex={currentIndex}
                                onAnswerSubmitted={handleAnswerSubmitted}
                                onNext={() => setCurrentIndex(prev => prev + 1)}
                                onComplete={() => {
                                    console.log("=== QUIZ COMPLETED ===");
                                    console.log("Final Statistics:", {
                                        sessionStats,
                                        itemBreakdown: itemStats
                                    });
                                    setQuizCompleted(true);
                                }}
                            />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export const getServerSideProps = withPageAuthRequired();