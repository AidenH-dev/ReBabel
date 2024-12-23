import Head from "next/head";
import Sidebar from "../../../components/Sidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default function Notecards() {
  const router = useRouter();
  const { lesson } = router.query; // Extract query parameter from URL
  const [cardsData, setCardsData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFront, setIsFront] = useState(true);

  useEffect(() => {
    if (!lesson) return;

    console.log("Fetching vocabulary for lesson:", lesson);

    fetch(`/api/fetch-vocabulary?lesson=${lesson}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch vocabulary data");
        }
        return response.json();
      })
      .then((data) => {
        console.log("API response data:", data);

        // Format the data for notecard usage
        const formattedCards = data.map((item) => ({
          front: item.English,
          back: item["Japanese(Hiragana/Katakana)"],
        }));

        console.log("Formatted cards:", formattedCards);

        setCardsData(formattedCards);
      })
      .catch((error) => console.error("Error fetching vocabulary data:", error));
  }, [lesson]);

  const handleFlip = () => {
    setIsFront(!isFront);
  };

  const handleNext = () => {
    if (currentIndex < cardsData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFront(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFront(true);
    }
  };

  return (
    <main className="flex flex-row min-h-screen bg-[#141f25] text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Head>
          <title>Notecards</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="w-full max-w-md bg-[#1c2b35] text-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-4">Study Notecards</h1>

          {/* Notecard */}
          {cardsData.length > 0 ? (
            <>
              <div
                className="relative w-full h-48 border rounded-lg bg-[#0d3c4b] flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                onClick={handleFlip}
              >
                <p className="text-lg font-semibold text-center">
                  {isFront ? cardsData[currentIndex].front : cardsData[currentIndex].back}
                </p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`px-4 py-2 bg-[#da1c60] text-white rounded-md ${
                    currentIndex === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-[#c71854]"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === cardsData.length - 1}
                  className={`px-4 py-2 bg-[#da1c60] text-white rounded-md ${
                    currentIndex === cardsData.length - 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#c71854]"
                  }`}
                >
                  Next
                </button>
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
