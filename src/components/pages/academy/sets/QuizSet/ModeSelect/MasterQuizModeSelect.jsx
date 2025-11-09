// components/pages/academy/sets/QuizSet/ModeSelect/MasterQuizModeSelect.jsx
import { FaGraduationCap, FaBrain, FaDumbbell } from "react-icons/fa";
import { MdQuiz } from "react-icons/md";
import { BsFillQuestionSquareFill } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { 
    TbArrowLeft
  } from "react-icons/tb";

export default function MasterQuizModeSelect({ setTitle, setType, onSelectMode, onExit }) {
  // Grammar sets have different modes
  const grammarModes = [
    {
      id: "with-review",
      title: "Review Cards + Multiple Choice",
      icon: BsFillQuestionSquareFill,
      description: "Study with all the info first",
      color: "from-blue-500 to-blue-600",
      borderColor: "border-blue-500/20 hover:border-blue-500",
      bgHover: "hover:bg-blue-50 dark:hover:bg-blue-900/10"
    },
    {
      id: "mc-only",
      title: "Multiple Choice Only",
      icon: IoSparkles,
      description: "Just practice multiple choice",
      color: "from-purple-500 to-purple-600",
      borderColor: "border-purple-500/20 hover:border-purple-500",
      bgHover: "hover:bg-purple-50 dark:hover:bg-purple-900/10"
    }
  ];

  // Vocab sets use existing modes
  const vocabModes = [
    {
      id: "completely-new",
      title: "Review Cards",
      icon: BsFillQuestionSquareFill,
      description: "Review new info first",
      color: "from-blue-500 to-blue-600",
      borderColor: "border-blue-500/20 hover:border-blue-500",
      bgHover: "hover:bg-blue-50 dark:hover:bg-blue-900/10"
    },
    {
      id: "new",
      title: "Multiple Choice",
      icon: IoSparkles,
      description: "Practice patially known items",
      color: "from-purple-500 to-purple-600",
      borderColor: "border-purple-500/20 hover:border-purple-500",
      bgHover: "hover:bg-purple-50 dark:hover:bg-purple-900/10"
    },
    {
      id: "practice",
      title: "Translate",
      icon: FaDumbbell,
      description: "Standard practice for known items",
      color: "from-[#e30a5f] to-[#f41567]",
      borderColor: "border-[#e30a5f]/20 hover:border-[#e30a5f]",
      bgHover: "hover:bg-pink-50 dark:hover:bg-pink-900/10"
    }
  ];

  const modes = setType === 'grammar' ? grammarModes : vocabModes;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Mode Options */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-6">
          {modes.map((mode) => {
            const IconComponent = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => onSelectMode(mode.id)}
                className={`flex-1 flex items-center gap-3 sm:gap-4 bg-white dark:bg-white/5 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 p-3 sm:p-5 border-2 ${mode.borderColor} ${mode.bgHover} active:scale-98 group min-w-0`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br ${mode.color} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <IconComponent className="text-white text-lg sm:text-2xl" />
                </div>

                {/* Content */}
                <div className="flex-1 text-left min-w-0 overflow-hidden">
                  <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1 truncate">
                    {mode.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-white/70 truncate">
                    {mode.description}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="flex-shrink-0 text-gray-400 dark:text-white/30 group-hover:text-gray-600 dark:group-hover:text-white/60 transition-colors">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {/* Exit Button */}
        <div className="text-center">
          <button
            onClick={onExit}
            className="inline-flex items-center justify-center px-2.5 py-2 pr-3 rounded-full border-2 border-gray-300 dark:text-white dark:border-gray-600 bg-white/50 dark:bg-gray-800/30 hover:bg-gray-100/70 dark:hover:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
            <TbArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-1" />
            Back to Study Set
          </button>
        </div>
      </div>
    </div>
  );
}
