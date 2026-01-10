// components/pages/academy/sets/QuizSet/QuizHeader/MasterQuizHeader.jsx
import { FaBook } from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";
import { FaDumbbell } from "react-icons/fa";
import SessionStatHeaderView from "@/components/Set/Features/Field-Card-Session/shared/views/SessionStatHeaderView.jsx";

// Static phase configurations for vocab sets
const VOCAB_PHASE_CONFIGS = {
  'completely-new': [
    { id: 'review', name: 'Review', icon: FaBook, color: 'bg-blue-500', borderColor: 'border-blue-500' },
    { id: 'multiple-choice', name: 'Multiple Choice', icon: IoSparkles, color: 'bg-purple-500', borderColor: 'border-purple-500' },
    { id: 'translation', name: 'Translation', icon: FaDumbbell, color: 'bg-[#e30a5f]', borderColor: 'border-[#e30a5f]' }
  ],
  'new': [
    { id: 'multiple-choice', name: 'Multiple Choice', icon: IoSparkles, color: 'bg-purple-500', borderColor: 'border-purple-500' },
    { id: 'translation', name: 'Translation', icon: FaDumbbell, color: 'bg-[#e30a5f]', borderColor: 'border-[#e30a5f]' }
  ],
  'practice': [
    { id: 'translation', name: 'Translation', icon: FaDumbbell, color: 'bg-[#e30a5f]', borderColor: 'border-[#e30a5f]' }
  ]
};

// Static phase configurations for grammar sets
const GRAMMAR_PHASE_CONFIGS = {
  'with-review': [
    { id: 'review', name: 'Review', icon: FaBook, color: 'bg-blue-500', borderColor: 'border-blue-500' },
    { id: 'multiple-choice', name: 'Multiple Choice', icon: IoSparkles, color: 'bg-purple-500', borderColor: 'border-purple-500' }
  ],
  'mc-only': [
    { id: 'multiple-choice', name: 'Multiple Choice', icon: IoSparkles, color: 'bg-purple-500', borderColor: 'border-purple-500' }
  ]
};

export default function MasterQuizHeader({
  setTitle,
  setType,
  sessionStats,
  currentIndex,
  totalQuestions,
  currentPhase,
  quizMode,
  quizType,
  completedPhases,
  onExit
}) {
  // Select appropriate phase configs based on set type
  const phaseConfigs = setType === 'grammar' ? GRAMMAR_PHASE_CONFIGS : VOCAB_PHASE_CONFIGS;
  const currentModeKey = setType === 'grammar' ? quizType : quizMode;
  const phases = phaseConfigs[currentModeKey] || [];
  const currentPhaseIndex = phases.findIndex(p => p.id === currentPhase);
  const currentPhaseConfig = phases[currentPhaseIndex];
  const CurrentPhaseIcon = currentPhaseConfig?.icon;

  // Calculate progress within current phase (1-indexed for display)
  const progressInPhase = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  // Render using shared SessionStatHeaderView component
  return (
    <SessionStatHeaderView
      setTitle={setTitle}
      sessionStats={sessionStats}
      currentIndex={currentIndex}
      totalQuestions={totalQuestions}
      currentPhase={currentPhase}
      completedPhases={completedPhases}
      phases={phases}
      currentPhaseIndex={currentPhaseIndex}
      currentPhaseConfig={currentPhaseConfig}
      CurrentPhaseIcon={CurrentPhaseIcon}
      progressInPhase={progressInPhase}
      displayMode="question-count"
      onExit={onExit}
    />
  );
}