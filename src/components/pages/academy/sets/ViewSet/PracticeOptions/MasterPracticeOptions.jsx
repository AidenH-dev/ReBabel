// components/pages/academy/sets/ViewSet/PracticeOptions/PracticeOptions.jsx
import { useRouter } from "next/router";
import { FaPlay } from "react-icons/fa";
import { MdQuiz } from "react-icons/md";
import { TbCards } from "react-icons/tb";

export default function PracticeOptions({ setId }) {
  const router = useRouter();

  const handleStartQuiz = () => {
    router.push(`/learn/academy/sets/study/${setId}/quiz`);
  };

  const handleStartFlashcards = () => {
    router.push(`/learn/academy/sets/study/${setId}/flashcards`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 flex-shrink-0">
      <button
        onClick={handleStartQuiz}
        className="group relative flex items-center gap-4 p-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg text-white hover:shadow-lg transition-all hover:-translate-y-0.5"
      >
        <div className="p-2 bg-white/20 rounded-lg">
          <MdQuiz className="text-2xl" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold">Quiz Mode</div>
          <div className="text-xs opacity-90">Engage directly with your study content</div>
        </div>
        <FaPlay className="opacity-60 group-hover:opacity-100 transition-opacity" />
      </button>

      <button
        onClick={handleStartFlashcards}
        className="group relative flex items-center gap-4 p-4 bg-gradient-to-r from-[#f093fb] to-[#f5576c] rounded-lg text-white hover:shadow-lg transition-all hover:-translate-y-0.5"
      >
        <div className="p-2 bg-white/20 rounded-lg">
          <TbCards className="text-2xl" />
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold">Flashcards</div>
          <div className="text-xs opacity-90">Review with flippable cards</div>
        </div>
        <FaPlay className="opacity-60 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}