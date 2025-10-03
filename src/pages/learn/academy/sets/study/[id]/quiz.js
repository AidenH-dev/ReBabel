// pages/learn/academy/sets/study/[id]/quiz.js
import Head from "next/head";
import MainSidebar from "../../../../../../components/Sidebars/AcademySidebar";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import {
    FaArrowRight,
    FaTimes,
    FaCheckCircle,
    FaTimesCircle,
    FaKeyboard,
    FaRedo,
    FaCheck
} from "react-icons/fa";
import { TbX } from "react-icons/tb";
import { MdQuiz } from "react-icons/md";
import { toKana } from "wanakana";

export default function SetQuiz() {
    const router = useRouter();
    const { id } = router.query;
    const inputRef = useRef(null);

    const [cardsData, setCardsData] = useState([]);
    const [setInfo, setSetInfo] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Quiz specific states
    const [quizItems, setQuizItems] = useState([]);
    const [userAnswer, setUserAnswer] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [showHint, setShowHint] = useState(false);
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

    // Focus input when question changes
    useEffect(() => {
        if (!showResult && !quizCompleted && inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentIndex, showResult, quizCompleted]);

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

    // Helper: does this question expect Kana?
    const expectsKana = (item) => item?.answerType === "Kana";

    // Input change handler with conditional kana conversion
    const handleInputChange = (e) => {
        const raw = e.target.value;
        const currentItem = quizItems[currentIndex];
        if (expectsKana(currentItem)) {
            setUserAnswer(toKana(raw, { IMEMode: true }));
        } else {
            setUserAnswer(raw);
        }
    };

    // Check answer
    const checkAnswer = useCallback(() => {
        if (!userAnswer.trim()) return;

        const currentItem = quizItems[currentIndex];
        const processedAnswer = userAnswer.trim();

        // Normalize for comparison (remove spaces, lowercase for English)
        const normalizedUserAnswer =
            currentItem.answerType === "English"
                ? processedAnswer.toLowerCase().replace(/\s+/g, "")
                : processedAnswer.replace(/\s+/g, "");

        const normalizedCorrectAnswer =
            currentItem.answerType === "English"
                ? currentItem.answer.toLowerCase().replace(/\s+/g, "")
                : currentItem.answer.replace(/\s+/g, "");

        const correct = normalizedUserAnswer === normalizedCorrectAnswer;

        setIsCorrect(correct);
        setShowResult(true);

        // Track answered item
        setAnsweredItems(prev => [...prev, {
            question: currentItem.question,
            userAnswer: processedAnswer,
            correctAnswer: currentItem.answer,
            isCorrect: correct,
            questionType: currentItem.questionType,
            answerType: currentItem.answerType
        }]);

        // Update statistics
        setItemStats(prevStats => {
            const newItemStats = { ...prevStats };
            newItemStats[currentItem.id].attempts += 1;

            if (correct) {
                newItemStats[currentItem.id].passed += 1;
            } else {
                newItemStats[currentItem.id].failed += 1;
            }

            // Log to console
            console.log(`Quiz Item: ${currentItem.id}`, {
                question: currentItem.question,
                correctAnswer: currentItem.answer,
                userAnswer: userAnswer,
                result: correct ? "PASSED" : "FAILED",
                stats: newItemStats[currentItem.id]
            });

            return newItemStats;
        });

        if (correct) {
            setSessionStats((prev) => ({
                ...prev,
                correct: prev.correct + 1,
                totalAttempts: prev.totalAttempts + 1,
                accuracy: Math.round(((prev.correct + 1) / (prev.totalAttempts + 1)) * 100)
            }));
        } else {
            setSessionStats((prev) => ({
                ...prev,
                incorrect: prev.incorrect + 1,
                totalAttempts: prev.totalAttempts + 1,
                accuracy: Math.round((prev.correct / (prev.totalAttempts + 1)) * 100)
            }));
        }
    }, [userAnswer, currentIndex, quizItems]);

    // Handle next question
    const handleNext = useCallback(() => {
        if (currentIndex < quizItems.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setUserAnswer("");
            setShowResult(false);
            setIsCorrect(false);
            setShowHint(false);
        } else {
            // Quiz completed - show results screen
            console.log("=== QUIZ COMPLETED ===");
            console.log("Final Statistics:", {
                sessionStats,
                itemBreakdown: itemStats
            });
            setQuizCompleted(true);
        }
    }, [currentIndex, quizItems.length, sessionStats, itemStats]);

    // Handle retry - "I was correct" button
    const handleRetry = () => {
        const currentItem = quizItems[currentIndex];

        // Remove the last answered item from the breakdown
        setAnsweredItems(prev => prev.slice(0, -1));

        // Retract the incorrect statistics
        const newItemStats = { ...itemStats };
        newItemStats[currentItem.id].attempts -= 1;
        newItemStats[currentItem.id].failed -= 1;
        setItemStats(newItemStats);

        // Retract session statistics
        setSessionStats((prev) => ({
            ...prev,
            incorrect: prev.incorrect - 1,
            totalAttempts: prev.totalAttempts - 1,
            accuracy: prev.totalAttempts - 1 > 0
                ? Math.round((prev.correct / (prev.totalAttempts - 1)) * 100)
                : 0
        }));

        // Reset UI to allow re-answering
        setUserAnswer("");
        setShowResult(false);
        setIsCorrect(false);
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !showResult) {
            e.preventDefault();
            checkAnswer();
        } else if (e.key === "Enter" && showResult) {
            e.preventDefault();
            if (isCorrect) {
                handleNext();
            } else {
                handleRetry();
            }
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

    const progress =
        quizItems.length > 0 ? (currentIndex / quizItems.length) * 100 : 0;
    const currentItem = quizItems[currentIndex];
    const isLastQuestion = currentIndex === quizItems.length - 1;

    // Global Enter key handler: submits first, then advances
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.key !== "Enter" || e.shiftKey || quizCompleted) return;
            e.preventDefault();

            if (!showResult) {
                if (userAnswer.trim()) {
                    checkAnswer();
                }
            } else {
                handleNext();
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [showResult, userAnswer, currentIndex, quizCompleted, checkAnswer, handleNext]);

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

                {/* Header */}
                {!quizCompleted && (
                    <div className="w-full max-w-5xl mx-auto mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                <button
                                    onClick={handleExit}
                                    className="p-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                                    aria-label="Exit"
                                >
                                    <TbX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-white" />
                                </button>

                                <div className="flex items-center gap-2">
                                    <MdQuiz className="text-[#e30a5f] text-lg sm:text-xl" />
                                    <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                                        {setInfo?.title || "Quiz"}
                                    </h1>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm w-full sm:w-auto justify-between sm:justify-end">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <FaCheckCircle className="text-green-500 text-sm" />
                                    <span className="text-gray-600 dark:text-white/70">
                                        <span className="hidden sm:inline">Correct: </span>{sessionStats.correct}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <FaTimesCircle className="text-red-500 text-sm" />
                                    <span className="text-gray-600 dark:text-white/70">
                                        <span className="hidden sm:inline">Incorrect: </span>{sessionStats.incorrect}
                                    </span>
                                </div>
                                <div className="text-gray-600 dark:text-white/70">
                                    {sessionStats.accuracy}%
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-white/70 mb-2">
                                <span>
                                    Question {currentIndex + 1} of {quizItems.length}
                                </span>
                                <span>{Math.round(progress)}% Complete</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#e30a5f] to-[#f41567] transition-all duration-500 ease-out rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Quiz Area */}
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-pulse mb-4">
                                <div className="w-64 h-32 bg-gray-200 dark:bg-white/10 rounded-lg mx-auto"></div>
                            </div>
                            <p className="text-gray-600 dark:text-white/70">Loading quiz...</p>
                        </div>
                    </div>
                ) : quizCompleted ? (
                    <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden lg:mr-10">
                        {/* Left Side - Quiz Summary */}
                        <div className="flex-1 flex items-center justify-center lg:justify-end lg:pr-3">
                            <div className="w-full max-w-xl">
                                <div className="bg-white dark:bg-white/10 rounded-2xl shadow-xl p-4 sm:p-8 h-auto lg:h-[500px]">
                                    <div className="flex flex-col h-full">
                                        <div className="text-center mb-3 sm:mb-4">
                                            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-2 sm:mb-3">
                                                <FaCheckCircle className="text-white text-2xl sm:text-3xl" />
                                            </div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                                Quiz Complete!
                                            </h2>
                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-white/60">
                                                Great job! Here&apos;s how you did:
                                            </p>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2 sm:p-3 text-center">
                                                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
                                                    {sessionStats.correct}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-600 dark:text-white/60 flex items-center justify-center gap-1">
                                                    <FaCheckCircle className="text-green-500" />
                                                    Correct
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2 sm:p-3 text-center">
                                                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
                                                    {sessionStats.incorrect}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-600 dark:text-white/60 flex items-center justify-center gap-1">
                                                    <FaTimesCircle className="text-red-500" />
                                                    Incorrect
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2 sm:p-3 text-center">
                                                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
                                                    {quizItems.length}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-600 dark:text-white/60">
                                                    Total Questions
                                                </div>
                                            </div>
                                        </div>

                                        {/* Animated Accuracy Bar with Liquid Effect */}
                                        <div className="mb-auto">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-gray-700 dark:text-white/80">
                                                    Overall Accuracy
                                                </span>
                                                <span className="text-xl font-bold bg-gradient-to-r from-[#e30a5f] to-[#f41567] bg-clip-text text-transparent">
                                                    {sessionStats.accuracy}%
                                                </span>
                                            </div>
                                            <div className="relative w-full h-6 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className="h-full relative overflow-hidden rounded-full transition-all duration-[1500ms] ease-out"
                                                    style={{ width: animateAccuracy ? `${sessionStats.accuracy}%` : '0%' }}
                                                >
                                                    {/* Base gradient */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-[#e30a5f] via-[#f41567] to-[#e30a5f]"></div>

                                                    {/* Liquid wave effect */}
                                                    <div
                                                        className="absolute inset-0 opacity-40"
                                                        style={{
                                                            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.8) 0%, transparent 70%)',
                                                            animation: 'liquid 3s ease-in-out infinite'
                                                        }}
                                                    ></div>

                                                    {/* Shimmer overlay */}
                                                    <div
                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                                        style={{
                                                            animation: 'shimmer 2s infinite linear'
                                                        }}
                                                    ></div>

                                                    {/* Bubble effects */}
                                                    <div
                                                        className="absolute bottom-0 left-1/4 w-2 h-2 bg-white/50 rounded-full"
                                                        style={{
                                                            animation: 'bubble1 4s ease-in-out infinite'
                                                        }}
                                                    ></div>
                                                    <div
                                                        className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-white/40 rounded-full"
                                                        style={{
                                                            animation: 'bubble2 5s ease-in-out infinite 1s'
                                                        }}
                                                    ></div>
                                                    <div
                                                        className="absolute bottom-0 left-3/4 w-2.5 h-2.5 bg-white/30 rounded-full"
                                                        style={{
                                                            animation: 'bubble3 3.5s ease-in-out infinite 0.5s'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <style jsx>{`
                                                @keyframes shimmer {
                                                    0% { transform: translateX(-100%); }
                                                    100% { transform: translateX(100%); }
                                                }
                                                @keyframes liquid {
                                                    0%, 100% { transform: translateX(-10%) translateY(0) scale(1); }
                                                    25% { transform: translateX(10%) translateY(-5%) scale(1.1); }
                                                    50% { transform: translateX(-5%) translateY(5%) scale(0.9); }
                                                    75% { transform: translateX(15%) translateY(-3%) scale(1.05); }
                                                }
                                                @keyframes bubble1 {
                                                    0% { transform: translateY(0) scale(0); opacity: 0; }
                                                    10% { opacity: 1; }
                                                    90% { opacity: 0.8; }
                                                    100% { transform: translateY(-24px) scale(1); opacity: 0; }
                                                }
                                                @keyframes bubble2 {
                                                    0% { transform: translateY(0) scale(0); opacity: 0; }
                                                    10% { opacity: 1; }
                                                    90% { opacity: 0.6; }
                                                    100% { transform: translateY(-24px) scale(1.2); opacity: 0; }
                                                }
                                                @keyframes bubble3 {
                                                    0% { transform: translateY(0) scale(0); opacity: 0; }
                                                    10% { opacity: 1; }
                                                    90% { opacity: 0.5; }
                                                    100% { transform: translateY(-24px) scale(0.8); opacity: 0; }
                                                }
                                            `}</style>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
                                            <button
                                                onClick={() => {
                                                    setQuizCompleted(false);
                                                    setCurrentIndex(0);
                                                    setUserAnswer("");
                                                    setShowResult(false);
                                                    setIsCorrect(false);
                                                    setShowHint(false);
                                                    setAnsweredItems([]);
                                                    setAnimateAccuracy(false);
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
                                                }}
                                                className="flex-1 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all active:scale-95 text-sm sm:text-base"
                                            >
                                                <FaRedo className="inline mr-2" />
                                                Retry Quiz
                                            </button>
                                            <button
                                                onClick={handleExit}
                                                className="flex-1 px-4 py-2.5 bg-[#e30a5f] hover:bg-[#f41567] text-white rounded-lg font-medium transition-all active:scale-95 text-sm sm:text-base"
                                            >
                                                Back to Study Set
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Question Breakdown (Scrollable) */}
                        <div className="w-full lg:w-1/4 flex items-center mt-4 lg:mt-0">
                            <div className="bg-white dark:bg-white/10 rounded-2xl shadow-xl p-3 sm:p-4 flex flex-col w-full h-auto max-h-[300px] lg:h-[500px] lg:max-h-none">
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
                                    Question Breakdown
                                </h3>
                                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 sm:pr-2">
                                    {answeredItems.map((item, index) => (
                                        <div
                                            key={index}
                                            className={`p-2.5 rounded-lg border ${item.isCorrect
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                                }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        {item.isCorrect ? (
                                                            <FaCheckCircle className="text-green-500 flex-shrink-0" style={{ fontSize: '10px' }} />
                                                        ) : (
                                                            <FaTimesCircle className="text-red-500 flex-shrink-0" style={{ fontSize: '10px' }} />
                                                        )}
                                                        <span className="text-xs text-gray-500 dark:text-white/50">
                                                            {item.questionType} → {item.answerType}
                                                        </span>
                                                    </div>
                                                    <div className="mb-1">
                                                        <span className="text-xs text-gray-600 dark:text-white/60">Q: </span>
                                                        <span className="font-semibold text-xs text-gray-900 dark:text-white">
                                                            {item.question}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {!item.isCorrect && (
                                                            <div>
                                                                <span className="text-xs text-gray-600 dark:text-white/60">You: </span>
                                                                <span className="text-xs text-red-600 dark:text-red-400 line-through">
                                                                    {item.userAnswer}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="text-xs text-gray-600 dark:text-white/60">
                                                                {item.isCorrect ? 'You: ' : 'Answer: '}
                                                            </span>
                                                            <span className={`font-medium text-xs ${item.isCorrect
                                                                ? 'text-green-700 dark:text-green-300'
                                                                : 'text-gray-900 dark:text-white'
                                                                }`}>
                                                                {item.correctAnswer}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : currentItem ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-0">
                        <div className="w-full max-w-3xl">
                            {/* Question Card */}
                            <div className="bg-white dark:bg-white/10 rounded-2xl shadow-xl p-4 sm:p-8 mb-4 sm:mb-6">
                                <div className="mb-2 text-xs sm:text-sm text-gray-500 dark:text-white/50">
                                    {currentItem.questionType} → {currentItem.answerType}
                                </div>

                                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 text-gray-900 dark:text-white break-words">
                                    {currentItem.question}
                                </div>

                                {showHint && currentItem.hint && (
                                    <div className="text-center text-sm sm:text-base text-gray-600 dark:text-white/60 mb-3 sm:mb-4">
                                        Hint: {currentItem.hint}
                                    </div>
                                )}

                                {/* Answer Input */}
                                <div className="relative mb-6 sm:mb-8">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={userAnswer}
                                        onChange={handleInputChange}
                                        onKeyPress={handleKeyPress}
                                        disabled={showResult}
                                        placeholder={
                                            expectsKana(currentItem)
                                                ? "Type in romaji: ka → か, shi → し, kyo → きょ"
                                                : "Type your answer..."
                                        }
                                        inputMode="text"
                                        autoComplete="off"
                                        className={`w-full px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg rounded-lg border-2 transition-all
                      ${showResult
                                                ? isCorrect
                                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                    : "border-red-500 bg-red-50 dark:bg-red-900/20"
                                                : "border-gray-300 dark:border-white/20 bg-white dark:bg-white/5"
                                            }
                      text-gray-900 dark:text-white 
                      placeholder-gray-400 dark:placeholder-white/40
                      focus:outline-none focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent
                      disabled:opacity-75`}
                                    />

                                    {showResult && (
                                        <div
                                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isCorrect ? "text-green-500" : "text-red-500"
                                                }`}
                                        >
                                            {isCorrect ? (
                                                <FaCheckCircle size={20} className="sm:w-6 sm:h-6" />
                                            ) : (
                                                <FaTimesCircle size={20} className="sm:w-6 sm:h-6" />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Result Feedback */}
                                <div className="min-h-[80px] sm:min-h-[96px]">
                                    {showResult && (
                                        <div
                                            className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${isCorrect
                                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                                }`}
                                        >
                                            {isCorrect ? (
                                                <div className="flex items-center gap-2">
                                                    <FaCheck />
                                                    <span className="font-semibold">Correct!</span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FaTimes />
                                                        <span className="font-semibold">Incorrect</span>
                                                    </div>
                                                    <div className="text-xs sm:text-sm">
                                                        The correct answer is:{" "}
                                                        <span className="font-bold">
                                                            {currentItem.answer}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4">
                                {!showResult ? (
                                    <button
                                        onClick={checkAnswer}
                                        disabled={!userAnswer.trim()}
                                        className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${userAnswer.trim()
                                            ? "bg-[#e30a5f] hover:bg-[#f41567] text-white active:scale-95"
                                            : "bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed"
                                            }`}
                                    >
                                        Check Answer
                                    </button>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                                        {!isCorrect && (
                                            <button
                                                onClick={handleRetry}
                                                className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors active:scale-95
                                                border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900
                                                dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700/60 dark:hover:text-white
                                                focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2
                                                focus:ring-offset-white dark:focus:ring-pink-400 dark:focus:ring-offset-gray-900"
                                            >
                                                <FaRedo className="inline mr-2" />
                                                I was correct
                                            </button>
                                        )}

                                        {!isLastQuestion ? (
                                            <button
                                                onClick={handleNext}
                                                className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all active:scale-95 
                                                        flex items-center justify-center text-sm sm:text-base
                                                      bg-[#e30a5f] hover:bg-[#f41567] text-white focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                                            >
                                                Next Question
                                                <FaArrowRight className="inline ml-2" />
                                            </button>

                                        ) : (
                                            <button
                                                onClick={handleNext}
                                                className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all active:scale-95 text-sm sm:text-base ${isCorrect
                                                    ? "bg-[#e30a5f] hover:bg-[#f41567] text-white"
                                                    : "bg-gray-600 hover:bg-gray-700 text-white"
                                                    }`}
                                            >
                                                View Results <FaArrowRight className="inline ml-2" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Keyboard Shortcuts */}
                            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-gray-500 dark:text-white/40">
                                <span className="flex items-center gap-2">
                                    <FaKeyboard /> <span className="hidden sm:inline">Keyboard shortcuts:</span>
                                </span>
                                <span>Enter: Submit/Continue</span>
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}

export const getServerSideProps = withPageAuthRequired();