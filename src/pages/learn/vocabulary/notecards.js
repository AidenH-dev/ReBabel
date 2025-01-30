import Head from "next/head";
import Sidebar from "../../../components/Sidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default function Notecards() {
  const router = useRouter();
  const { lesson } = router.query;
  const [cardsData, setCardsData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Front/back flip states
  const [isFront, setIsFront] = useState(true);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Slide animation control
  const [transitionState, setTransitionState] = useState("idle");

  // Match durations in JS & CSS
  const SLIDE_DURATION = 200;

  const transitionClasses = {
    idle: "transition-all duration-200 ease-in-out translate-x-0 opacity-100",

    "slide-out-left":
      "transition-all duration-200 ease-in-out -translate-x-full opacity-0",
    "slide-in-right":
      "transition-all duration-200 ease-in-out translate-x-full opacity-0",

    "slide-out-right":
      "transition-all duration-200 ease-in-out translate-x-full opacity-0",
    "slide-in-left":
      "transition-all duration-200 ease-in-out -translate-x-full opacity-0",
  };

  useEffect(() => {
    if (!lesson) return;

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
          back: item["Japanese(Hiragana/Katakana)"],
        }));
        setCardsData(formattedCards);
      })
      .catch((error) => console.error("Error fetching vocabulary data:", error));
  }, [lesson]);

  const handleFlip = () => {
    setShouldAnimate(true);
    setIsFront((prev) => !prev);
  };

  // Helper to slide out, switch index, then slide in
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

  // Navigate back to /learn/vocabulary
  const handleExit = () => {
    router.push("/learn/vocabulary");
  };

  // --- 3D FLIP STYLES ---
  const container3DStyles = {
    perspective: "600px",
    perspectiveOrigin: "center 30%", // can tweak to make the 3D flip more dramatic
    overflow: "visible",
  };

  const flipCardStyles = {
    transform: isFront ? "rotateY(0deg)" : "rotateY(180deg)",
    transformStyle: "preserve-3d",
    transition: shouldAnimate ? "transform 0.7s" : "none",
    width: "100%",
    height: "100%",
    position: "relative",
  };

  const sideBaseStyles = {
    position: "absolute",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
    borderRadius: "0.5rem",
    boxShadow: "0 15px 30px rgba(0,0,0,0.4)",
  };

  // If we're on the last card, we'll show "Finish" instead of "Next".
  const isLastCard = currentIndex === cardsData.length - 1;

  return (
    <main className="flex flex-row min-h-screen bg-[#141f25] text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-40 flex-1 flex flex-col items-center justify-center p-3">
        <Head>
          <title>Notecards</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="w-full max-w-3xl mx-auto text-white px-28">
          {cardsData.length > 0 && (
            <div className="text-center mb-6">
              <p className="text-sm mt-2">
                Currently studying card {currentIndex + 1} of{" "}
                {cardsData.length}
              </p>
            </div>
          )}

          {cardsData.length > 0 ? (
            <>
              <div
                className="relative w-full h-80 mb-6"
                style={container3DStyles}
              >
                <div
                  className={`absolute w-full h-full flex items-center justify-center ${transitionClasses[transitionState]}`}
                  style={{ overflow: "visible" }}
                >
                  {/* Flip Card wrapper */}
                  <div style={flipCardStyles} onClick={handleFlip}>
                    {/* Front Side */}
                    <div
                      style={{
                        ...sideBaseStyles,
                        backgroundColor: "#405289",
                      }}
                    >
                      <p className="text-5xl font-normal px-4 text-center">
                        {cardsData[currentIndex].front}
                      </p>
                    </div>

                    {/* Back Side */}
                    <div
                      style={{
                        ...sideBaseStyles,
                        backgroundColor: "#405289",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <p className="text-5xl font-normal px-4 text-center">
                        {cardsData[currentIndex].back}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center w-full mt-4">
                {/* Left: Previous Button */}
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`px-4 py-2 bg-[#da1c60] text-white rounded-md font-semibold transition-colors ${
                    currentIndex === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#c71854]"
                  }`}
                >
                  Previous
                </button>

                {/* Middle: Exit Button */}
                <button
                  onClick={handleExit}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md font-semibold hover:bg-gray-700 transition-colors"
                >
                  Exit
                </button>

                {/* Right: Next or Finish Button */}
                {!isLastCard ? (
                  <button
                    onClick={handleNext}
                    className={`px-4 py-2 bg-[#da1c60] text-white rounded-md font-semibold transition-colors ${
                      currentIndex === cardsData.length - 1
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-[#c71854]"
                    }`}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleExit}
                    className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-500 transition-colors"
                  >
                    Finish
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-center">Loading cards or no cards available...</p>
          )}
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps = withPageAuthRequired();
