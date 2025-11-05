// components/pages/academy/sets/ViewSet/PracticeOptions/MasterPracticeOptions.jsx
import { useRouter } from "next/router";
import { FaPlay } from "react-icons/fa";
import { MdQuiz } from "react-icons/md";
import { TbCards } from "react-icons/tb";
import MasterSrsSetModule from "@/components/pages/academy/sets/ViewSet/srsSetModule/MasterSrsSetModule";

export default function PracticeOptions({ setId, enableSrsModule = true }) {
    const router = useRouter();

    const handleStartQuiz = () => {
        router.push(`/learn/academy/sets/study/${setId}/quiz`);
    };

    const handleStartFlashcards = () => {
        router.push(`/learn/academy/sets/study/${setId}/flashcards`);
    };

    return (
        <div className={`grid gap-3 mb-4 pt-2 sm:pt-0 ${enableSrsModule ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {enableSrsModule && <MasterSrsSetModule setId={setId} />}
            
            {/* Quiz and Flashcards - side by side on mobile */}
            <div className={`grid gap-2 w-full ${enableSrsModule ? 'grid-cols-2 sm:grid-cols-1' : 'grid-cols-2 sm:grid-cols-2'}`}>
                <button
                    onClick={handleStartQuiz}
                    className="group relative flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg text-white hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg flex-shrink-0">
                        <MdQuiz className="text-xl sm:text-2xl" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-sm sm:text-base">Quiz Mode</div>
                        <div className="text-xs opacity-90 hidden sm:block">Engage directly with your study content</div>
                    </div>
                    <FaPlay className="opacity-60 group-hover:opacity-100 transition-opacity sm:block flex-shrink-0" />
                </button>

                <button
                    onClick={handleStartFlashcards}
                    className="group relative flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-[#f093fb] to-[#f5576c] rounded-lg text-white hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg flex-shrink-0">
                        <TbCards className="text-xl sm:text-2xl" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-sm sm:text-base">Flashcards</div>
                        <div className="text-xs opacity-90 hidden sm:block">Review with flippable cards</div>
                    </div>
                    <FaPlay className="opacity-60 group-hover:opacity-100 transition-opacity sm:block flex-shrink-0" />
                </button>
            </div>
        </div>
    );
}