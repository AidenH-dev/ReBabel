import Head from "next/head";
import MainSidebar from "../../../components/Sidebars/MainSidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { 
  FaArrowLeft, 
  FaArrowRight, 
  FaTimes,
  FaRedo,
  FaCheckCircle,
  FaTimesCircle,
  FaKeyboard,
  FaVolumeUp,
  FaBrain
} from "react-icons/fa";
import { TbCards, TbX } from "react-icons/tb";
import { MdFlip } from "react-icons/md";

export default function Notecards() {
  const router = useRouter();
  const { lesson, terms } = router.query;
  const [cardsData, setCardsData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
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
    // New stats for interval mode
    again: 0,
    hard: 0,
    good: 0,
    easy: 0
  });
  
  // Card confidence levels
  const [cardConfidence, setCardConfidence] = useState({});
  
  // Study mode - now includes 'interval'
  const [studyMode, setStudyMode] = useState("study"); // study, quiz, interval
  
  const SLIDE_DURATION = 300;

  const transitionClasses = {
    idle: "transition-all duration-300 ease-out translate-x-0 opacity-100",
    "slide-out-left": "transition-all duration-300 ease-out -translate-x-full opacity-0",
    "slide-in-right": "transition-all duration-300 ease-out translate-x-full opacity-0",
    "slide-out-right": "transition-all duration-300 ease-out translate-x-full opacity-0",
    "slide-in-left": "transition-all duration-300 ease-out -translate-x-full opacity-0",
  };

  useEffect(() => {
    if (!router.isReady) return;

    if (terms) {
      try {
        const parsedTerms = JSON.parse(terms);
        const formattedCards = parsedTerms.map((item) => ({
          front: item.English,
          back: item["Japanese(Hiragana/Katakana)"] || item.Japanese,
          audio: item.audio || null,
          // Initialize interval data for each card
          interval: 1, // Starting interval in days
          easeFactor: 2.5, // Starting ease factor
          repetitions: 0,
          lastReviewed: null
        }));
        setCardsData(formattedCards);
      } catch (error) {
        console.error("Error parsing terms from query parameter:", error);
      }
    } else if (lesson) {
      fetch(`/api/fetch-vocabulary?lesson=${lesson}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch vocabulary data");
          }
          return response.json();
        })
        .then((data) => {
          const formattedCards = data.map((item) => ({
            front: item.English,
            back: item["Japanese(Hiragana/Katakana)"] || item.Japanese,
            audio: item.audio || null,
            // Initialize interval data for each card
            interval: 1,
            easeFactor: 2.5,
            repetitions: 0,
            lastReviewed: null
          }));
          setCardsData(formattedCards);
        })
        .catch((error) =>
          console.error("Error fetching vocabulary data:", error)
        );
    }
  }, [router.isReady, lesson, terms]);

  const handleFlip = () => {
    setShouldAnimate(true);
    setIsFront((prev) => !prev);
  };

  const slideCard = (outState, inState, newIndex) => {
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
  };

  const handleNext = () => {
    if (currentIndex < cardsData.length - 1) {
      slideCard("slide-out-left", "slide-in-right", currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      slideCard("slide-out-right", "slide-in-left", currentIndex - 1);
    }
  };

  const handleExit = () => {
    router.push("/learn/vocabulary");
  };

  // Mark card as known/unknown (for quiz mode)
  const markCard = (confidence) => {
    setCardConfidence({
      ...cardConfidence,
      [currentIndex]: confidence
    });
    
    if (confidence === 'known') {
      setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else if (confidence === 'unknown') {
      setSessionStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }
    
    // Auto-advance after marking
    setTimeout(() => {
      if (currentIndex < cardsData.length - 1) {
        handleNext();
      }
    }, 500);
  };

  // Handle interval-based learning response
  const handleIntervalResponse = (difficulty) => {
    // Update session stats
    setSessionStats(prev => ({ 
      ...prev, 
      [difficulty]: prev[difficulty] + 1 
    }));

    // Mark the card with difficulty level for visual feedback
    setCardConfidence({
      ...cardConfidence,
      [currentIndex]: difficulty
    });

    // Here you would normally update the card's interval data
    // This will be implemented later with the scheduling algorithm
    // For now, just track the response
    
    const updatedCards = [...cardsData];
    const currentCard = updatedCards[currentIndex];
    
    // Simple interval adjustment (to be replaced with proper SM-2 algorithm)
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
    setCardsData(updatedCards);

    // Auto-advance after marking
    setTimeout(() => {
      if (currentIndex < cardsData.length - 1) {
        handleNext();
      }
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      handleFlip();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (studyMode === 'interval' && !isFront) {
      // Keyboard shortcuts for interval mode
      if (e.key === '1') handleIntervalResponse('again');
      if (e.key === '2') handleIntervalResponse('hard');
      if (e.key === '3') handleIntervalResponse('good');
      if (e.key === '4') handleIntervalResponse('easy');
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, cardsData.length, isFront, studyMode]);

  // Calculate progress
  const progress = cardsData.length > 0 ? ((currentIndex + 1) / cardsData.length) * 100 : 0;
  const isLastCard = currentIndex === cardsData.length - 1;

  // 3D Flip Styles
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

  // Get confidence indicator color based on mode and response
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
      // Quiz mode colors
      return confidence === 'known' ? 'bg-green-400' : 
             confidence === 'unknown' ? 'bg-red-400' : 
             'bg-yellow-400';
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#141f25] dark:to-[#1c2b35]">
      <MainSidebar />

      <main className="ml-auto flex-1 flex flex-col p-6">
        <Head>
          <title>Flashcards • {lesson ? `Lesson ${lesson}` : 'Custom Set'}</title>
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
                  {lesson ? `Lesson ${lesson} Vocabulary` : 'Vocabulary Practice'}
                </h1>
              </div>
            </div>

            {/* Study Mode Selector */}
            <div className="flex items-center gap-2 bg-gray-200 dark:bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setStudyMode('study')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  studyMode === 'study' 
                    ? 'bg-[#e30a5f] text-white' 
                    : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Study
              </button>
              <button
                onClick={() => setStudyMode('quiz')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  studyMode === 'quiz' 
                    ? 'bg-[#e30a5f] text-white' 
                    : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Quiz
              </button>
              <button
                onClick={() => setStudyMode('interval')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                  studyMode === 'interval' 
                    ? 'bg-[#e30a5f] text-white' 
                    : 'text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Interval
              </button>
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
        {cardsData.length > 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl">
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
                    Free study mode - review at your own pace
                  </div>
                )}
              </div>

              {/* Card Container */}
              <div
                className="relative w-full h-96 mb-8"
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
                      {/* Card confidence indicator */}
                      {cardConfidence[currentIndex] && (
                        <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                          getConfidenceColor(cardConfidence[currentIndex])
                        }`} />
                      )}
                      
                      <p className="text-4xl md:text-5xl font-medium px-8 text-center text-white">
                        {cardsData[currentIndex].front}
                      </p>
                      
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
                    >
                      <p className="text-4xl md:text-5xl font-medium px-8 text-center text-white mb-4">
                        {cardsData[currentIndex].back}
                      </p>
                      
                      {/* Audio button if available */}
                      {cardsData[currentIndex].audio && (
                        <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                          <FaVolumeUp className="text-white" />
                        </button>
                      )}

                      {/* Show interval info in interval mode */}
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
                {/* Previous */}
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

                {/* Next/Finish */}
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
              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-white/40">
                <span className="flex items-center gap-2">
                  <FaKeyboard /> Keyboard shortcuts:
                </span>
                <span>Space: Flip</span>
                <span>←/→: Navigate</span>
                {studyMode === 'interval' && <span>1-4: Rate difficulty (Interval mode)</span>}
                {studyMode === 'quiz' && <span>1/2/3: Rate card (Quiz mode)</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse mb-4">
                <div className="w-64 h-32 bg-gray-200 dark:bg-white/10 rounded-lg mx-auto"></div>
              </div>
              <p className="text-gray-600 dark:text-white/70">Loading flashcards...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();