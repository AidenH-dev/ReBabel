import Head from "next/head";
import Sidebar from "../../../components/Sidebar"; // Import your Sidebar component
import { useState } from "react";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default function Notecards() {
  const [cardsData, setCardsData] = useState([
    { front: "What is React?", back: "A JavaScript library for building user interfaces." },
    { front: "What is Next.js?", back: "A React framework for server-rendered applications." },
    { front: "What is JSX?", back: "A syntax extension for JavaScript that looks like XML." },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFront, setIsFront] = useState(true);

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
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps = withPageAuthRequired();
