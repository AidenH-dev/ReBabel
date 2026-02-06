// pages/learn/academy/sets/study/[id]/flashcards.js
import Head from "next/head";
import MainSidebar from "../../../../../../components/Sidebars/AcademySidebar";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import {
  FaArrowLeft,
  FaArrowRight,
  FaTimes,
  FaRedo,
  FaCheckCircle,
  FaTimesCircle,
  FaVolumeUp,
  FaBrain
} from "react-icons/fa";
import KeyboardShortcutHint from "../../../../../../components/Set/Features/Field-Card-Session/shared/views/KeyboardShortcutHint";
import { TbCards, TbX } from "react-icons/tb";
import { MdFlip } from "react-icons/md";

export default function SetFlashcards() {
  const router = useRouter();
  const { id } = router.query;
  
  const [cardsData, setCardsData] = useState([]);
  const [setInfo, setSetInfo] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Card states
  const [isFront, setIsFront] = useState(true);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [transitionState, setTransitionState] = useState("idle");
  
  // Study session stats
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    totalTime: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0
  });
  
  // Card confidence levels
  const [cardConfidence, setCardConfidence] = useState({});
  
  // Study mode
  const [studyMode, setStudyMode] = useState("plain"); // plain, quiz, interval
  
  const SLIDE_DURATION = 300;

  const transitionClasses = {
    idle: "transition-all duration-300 ease-out translate-x-0 opacity-100",
    "slide-out-left": "transition-all duration-300 ease-out -translate-x-full opacity-0",
    "slide-in-right": "transition-all duration-300 ease-out translate-x-full opacity-0",
    "slide-out-right": "transition-all duration-300 ease-out translate-x-full opacity-0",
    "slide-in-left": "transition-all duration-300 ease-out -translate-x-full opacity-0",
  };

  // ----- Fetch Data from API -----
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
          throw new Error(result.error || 'Failed to load set data');
        }

        const apiData = result.data;
        const setInfoData = apiData.data?.set;
        const setItemsAPI = apiData.data?.items || [];

        if (!setInfoData) {
          throw new Error('Invalid set data structure received from API');
        }

        setSetInfo({
          title: setInfoData.title || "Untitled Set",
          description: setInfoData.description?.toString() || "",
        });

        // Transform items to flashcard format
        const transformedCards = Array.isArray(setItemsAPI) ? setItemsAPI.map((item, index) => {
          if (item.type === 'vocab' || item.type === 'vocabulary') {
            return {
              id: index + 1,
              type: 'vocabulary',
              front: item.english || "",
              back: `${item.kana || ""}${item.kanji ? ` (${item.kanji})` : ""}`,
              kana: item.kana || "",
              kanji: item.kanji || "",
              english: item.english || "",
              lexical_category: item.lexical_category || "",
              example_sentences: Array.isArray(item.example_sentences) 
                ? item.example_sentences 
                : [item.example_sentences].filter(Boolean),
              // Initialize interval data
              interval: 1,
              easeFactor: 2.5,
              repetitions: 0,
              lastReviewed: null
            };
          } else if (item.type === 'grammar') {
            return {
              id: index + 1,
              type: 'grammar',
              front: item.title || "",
              back: item.description || "",
              title: item.title || "",
              description: item.description || "",
              topic: item.topic || "",
              example_sentences: Array.isArray(item.example_sentences)
                ? item.example_sentences.map(ex => 
                    typeof ex === 'string' ? ex : `${ex.japanese || ''} (${ex.english || ''})`
                  )
                : [],
              // Initialize interval data
              interval: 1,
              easeFactor: 2.5,
              repetitions: 0,
              lastReviewed: null
            };
          }
          return null;
        }).filter(Boolean) : [];

        if (transformedCards.length === 0) {
          throw new Error('This set has no items to study');
        }

        setCardsData(transformedCards);

      } catch (err) {
        console.error('Error fetching set:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetData();
  }, [id]);

  const handleFlip = useCallback(() => {
    setShouldAnimate(true);
    setIsFront((prev) => !prev);
  }, []);

  const slideCard = useCallback((outState, inState, newIndex) => {
    setTransitionState(outState);
    setTimeout(() => {
      setShouldAnimate(false);
      setIsFront(true);
      setCurrentIndex(newIndex);
      setTransitionState(inState);
      setTimeout(() => {
        setTransitionState("idle");
      }, SLIDE_DURATION);
    }, SLIDE_DURATION);
  }, [SLIDE_DURATION]);

  const handleNext = useCallback(() => {
    if (currentIndex < cardsData.length - 1) {
      slideCard("slide-out-left", "slide-in-right", currentIndex + 1);
    }
  }, [currentIndex, cardsData.length, slideCard]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      slideCard("slide-out-right", "slide-in-left", currentIndex - 1);
    }
  }, [currentIndex, slideCard]);

  const handleExit = useCallback(() => {
    router.push(`/learn/academy/sets/study/${id}`);
  }, [router, id]);

  const markCard = useCallback((confidence) => {
    setCardConfidence(prev => ({
      ...prev,
      [currentIndex]: confidence
    }));
    
    if (confidence === 'known') {
      setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else if (confidence === 'unknown') {
      setSessionStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }
    
    setTimeout(() => {
      if (currentIndex < cardsData.length - 1) {
        handleNext();
      }
    }, 500);
  }, [currentIndex, cardsData.length, handleNext]);

  const handleIntervalResponse = useCallback((difficulty) => {
    setSessionStats(prev => ({ 
      ...prev, 
      [difficulty]: prev[difficulty] + 1 
    }));

    setCardConfidence(prev => ({
      ...prev,
      [currentIndex]: difficulty
    }));

    setCardsData(prevCards => {
      const updatedCards = [...prevCards];
      const currentCard = updatedCards[currentIndex];
      
      switch(difficulty) {
        case 'again':
          currentCard.interval = 1;
          currentCard.repetitions = 0;
          break;
        case 'hard':
          currentCard.interval = Math.max(1, currentCard.interval * 1.2);
          break;
        case 'good':
          currentCard.interval = currentCard.interval * 2.5;
          currentCard.repetitions += 1;
          break;
        case 'easy':
          currentCard.interval = currentCard.interval * 3.5;
          currentCard.repetitions += 1;
          break;
      }
      
      currentCard.lastReviewed = new Date();
      return updatedCards;
    });

    setTimeout(() => {
      if (currentIndex < cardsData.length - 1) {
        handleNext();
      }
    }, 500);
  }, [currentIndex, cardsData.length, handleNext]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === ' ') {
      e.preventDefault();
      handleFlip();
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (studyMode === 'interval' && !isFront) {
      if (e.key === '1') handleIntervalResponse('again');
      if (e.key === '2') handleIntervalResponse('hard');
      if (e.key === '3') handleIntervalResponse('good');
      if (e.key === '4') handleIntervalResponse('easy');
    }
  }, [handleFlip, handleNext, handlePrevious, handleIntervalResponse, studyMode, isFront]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const progress = cardsData.length > 0 ? ((currentIndex) / cardsData.length) * 100 : 0;
  const isLastCard = currentIndex === cardsData.length - 1;

  const container3DStyles = {
    perspective: "1000px",
    perspectiveOrigin: "center center",
  };

  const flipCardStyles = {
    transform: isFront ? "rotateY(0deg)" : "rotateY(180deg)",
    transformStyle: "preserve-3d",
    transition: shouldAnimate ? "transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)" : "none",
    width: "100%",
    height: "100%",
    position: "relative",
  };

  const sideBaseStyles = {
    position: "absolute",
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
    borderRadius: "1rem",
  };

  const getConfidenceColor = (confidence) => {
    if (studyMode === 'interval') {
      switch(confidence) {
        case 'again': return 'bg-red-400';
        case 'hard': return 'bg-orange-400';
        case 'good': return 'bg-blue-400';
        case 'easy': return 'bg-green-400';
        default: return null;
      }
    } else {
      return confidence === 'known' ? 'bg-green-400' : 
             confidence === 'unknown' ? 'bg-red-400' : 
             'bg-yellow-400';
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen min-h-0 bg-gray-50 dark:bg-[#141f25]">
        <MainSidebar />
        <main className="ml-auto flex-1 px-4 sm:px-6 py-4 pt-[max(1rem,env(safe-area-inset-top))] flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
              Error Loading Flashcards
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => router.push('/learn/academy/sets')}
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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#141f25] dark:to-[#1c2b35] overflow-x-hidden">

      <main className="ml-auto flex-1 flex flex-col p-6 pt-[max(1.5rem,env(safe-area-inset-top))] overflow-x-hidden">
        <Head>
          <title>Flashcards • {setInfo?.title || 'Study Set'}</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Header */}
        <div className="w-full max-w-5xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleExit}
                className="p-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                aria-label="Exit"
              >
                <TbX className="w-6 h-6 text-gray-700 dark:text-white" />
              </button>
              
              <div className="flex items-center gap-2">
                <TbCards className="text-[#e30a5f] text-xl" />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {setInfo?.title || 'Flashcards'}
                </h1>
              </div>
            </div>

            {/* Study Mode Selector */}
            <div className="hidden md:flex items-center gap-2 bg-gray-200 dark:bg-white/10 rounded-lg p-1 px-1">
              <button
                onClick={() => setStudyMode('plain')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  studyMode === 'plain' 
                    ? 'bg-[#e30a5f] text-white' 
                    : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Plain Cards
              </button>
              {/*<button
                onClick={() => setStudyMode('quiz')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  studyMode === 'quiz' 
                    ? 'bg-[#e30a5f] text-white' 
                    : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Quiz
              </button>*/}
              {/*<button
                onClick={() => setStudyMode('interval')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  studyMode === 'interval' 
                    ? 'bg-[#e30a5f] text-white' 
                    : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Interval
              </button>*/}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-white/70 mb-2">
              <span>Card {currentIndex + 1} of {cardsData.length}</span>
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

        {/* Main Card Area */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse mb-4">
                <div className="w-64 h-32 bg-gray-200 dark:bg-white/10 rounded-lg mx-auto"></div>
              </div>
              <p className="text-gray-600 dark:text-white/70">Loading flashcards...</p>
            </div>
          </div>
        ) : cardsData.length > 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center overflow-x-hidden">
            <div className="w-full max-w-3xl overflow-x-hidden">
              {/* Stats Bar */}
              <div className="flex items-center justify-center gap-6 mb-6">
                {studyMode === 'quiz' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-500" />
                      <span className="text-gray-600 dark:text-white/70 text-sm">Known: {sessionStats.correct}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaTimesCircle className="text-red-500" />
                      <span className="text-gray-600 dark:text-white/70 text-sm">Learning: {sessionStats.incorrect}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaRedo className="text-yellow-500" />
                      <span className="text-gray-600 dark:text-white/70 text-sm">Skipped: {sessionStats.skipped}</span>
                    </div>
                  </>
                ) : studyMode === 'interval' ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <span className="text-xs font-medium text-red-700 dark:text-red-400">Again: {sessionStats.again}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Hard: {sessionStats.hard}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Good: {sessionStats.good}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">Easy: {sessionStats.easy}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-600 dark:text-white/70 text-sm">
                    
                  </div>
                )}
              </div>

              {/* Card Container */}
              <div
                className="relative w-full h-96 mb-8 overflow-hidden"
                style={container3DStyles}
              >
                <div
                  className={`absolute w-full h-full ${transitionClasses[transitionState]}`}
                >
                  <div 
                    style={flipCardStyles} 
                    onClick={handleFlip}
                    className="cursor-pointer"
                  >
                    {/* Front Side */}
                    <div
                      style={{
                        ...sideBaseStyles,
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                      }}
                      className="relative"
                    >
                      {cardConfidence[currentIndex] && (
                        <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                          getConfidenceColor(cardConfidence[currentIndex])
                        }`} />
                      )}
                      
                      <p className="text-3xl md:text-4xl lg:text-5xl font-medium px-8 text-center text-white">
                        {cardsData[currentIndex].front}
                      </p>
                      
                      {cardsData[currentIndex].type === 'vocabulary' && cardsData[currentIndex].lexical_category && (
                        <span className="mt-4 px-3 py-1 text-sm rounded-full bg-white/20 text-white/90">
                          {cardsData[currentIndex].lexical_category}
                        </span>
                      )}
                      
                      <div className="absolute bottom-6 text-white/50 text-sm">
                        Click or press Space to flip
                      </div>
                    </div>

                    {/* Back Side */}
                    <div
                      style={{
                        ...sideBaseStyles,
                        background: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
                        transform: "rotateY(180deg)",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                      }}
                      className="relative p-8"
                    >
                      <p className="text-3xl md:text-4xl lg:text-5xl font-medium text-center text-white mb-4">
                        {cardsData[currentIndex].back}
                      </p>
                      
                      {cardsData[currentIndex].example_sentences?.length > 0 && (
                        <div className="mt-6 text-white/80 text-xs md:text-sm max-w-lg text-center italic">
                          {cardsData[currentIndex].example_sentences[0]}
                        </div>
                      )}

                      {studyMode === 'interval' && cardsData[currentIndex].interval && (
                        <div className="absolute bottom-6 text-white/50 text-xs">
                          Next review: {Math.round(cardsData[currentIndex].interval)} day(s)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    currentIndex === 0
                      ? "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 cursor-not-allowed"
                      : "bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20 active:scale-95"
                  }`}
                >
                  <FaArrowLeft /> Previous
                </button>

                {/* Center Actions */}
                <div className="flex items-center gap-2">
                  {studyMode === 'quiz' && (
                    <>
                      <button
                        onClick={() => markCard('unknown')}
                        className="px-4 py-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors active:scale-95"
                      >
                        Still Learning
                      </button>
                      <button
                        onClick={() => {
                          setSessionStats(prev => ({ ...prev, skipped: prev.skipped + 1 }));
                          handleNext();
                        }}
                        className="px-4 py-2 bg-yellow-100 dark:bg-yellow-500/20 hover:bg-yellow-200 dark:hover:bg-yellow-500/30 text-yellow-700 dark:text-yellow-400 rounded-lg font-medium transition-colors active:scale-95"
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => markCard('known')}
                        className="px-4 py-2 bg-green-100 dark:bg-green-500/20 hover:bg-green-200 dark:hover:bg-green-500/30 text-green-700 dark:text-green-400 rounded-lg font-medium transition-colors active:scale-95"
                      >
                        Got it!
                      </button>
                    </>
                  )}
                  
                  {studyMode === 'interval' && !isFront && (
                    <>
                      <button
                        onClick={() => handleIntervalResponse('again')}
                        className="px-3 py-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors active:scale-95 text-sm"
                      >
                        <div className="text-xs opacity-70">1</div>
                        Again
                      </button>
                      <button
                        onClick={() => handleIntervalResponse('hard')}
                        className="px-3 py-2 bg-orange-100 dark:bg-orange-500/20 hover:bg-orange-200 dark:hover:bg-orange-500/30 text-orange-600 dark:text-orange-400 rounded-lg font-medium transition-colors active:scale-95 text-sm"
                      >
                        <div className="text-xs opacity-70">2</div>
                        Hard
                      </button>
                      <button
                        onClick={() => handleIntervalResponse('good')}
                        className="px-3 py-2 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 rounded-lg font-medium transition-colors active:scale-95 text-sm"
                      >
                        <div className="text-xs opacity-70">3</div>
                        Good
                      </button>
                      <button
                        onClick={() => handleIntervalResponse('easy')}
                        className="px-3 py-2 bg-green-100 dark:bg-green-500/20 hover:bg-green-200 dark:hover:bg-green-500/30 text-green-600 dark:text-green-400 rounded-lg font-medium transition-colors active:scale-95 text-sm"
                      >
                        <div className="text-xs opacity-70">4</div>
                        Easy
                      </button>
                    </>
                  )}

                  {studyMode === 'interval' && isFront && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Flip the card to rate difficulty
                    </div>
                  )}
                </div>

                {!isLastCard ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-4 py-2 bg-[#e30a5f] hover:bg-[#f41567] text-white rounded-lg font-medium transition-all active:scale-95"
                  >
                    Next <FaArrowRight />
                  </button>
                ) : (
                  <button
                    onClick={handleExit}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-all active:scale-95"
                  >
                    Finish Session
                  </button>
                )}
              </div>

              {/* Keyboard Shortcuts */}
              <KeyboardShortcutHint
                className="mt-8"
                shortcuts={[
                  { key: "Space", label: "Flip" },
                  { key: "←/→", label: "Navigate" },
                  { key: "Enter", label: "Next" },
                  ...(studyMode === 'interval' ? [{ key: "1-4", label: "Rate difficulty" }] : [])
                ]}
              />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();