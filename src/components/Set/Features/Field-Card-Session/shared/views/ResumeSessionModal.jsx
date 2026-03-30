import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import { TbLoader3, TbRotateClockwise } from 'react-icons/tb';
import { FaBook, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { IoSparkles } from 'react-icons/io5';
import { FaDumbbell } from 'react-icons/fa6';

const SESSION_TYPE_LABELS = {
  quiz: 'Quiz',
  flashcards: 'Flashcards',
  conjugation: 'Conjugation Practice',
  srs_learn_new: 'Learn New Words',
  srs_due_review: 'SRS Review',
  srs_fast_review: 'Fast Review',
};

const QUIZ_MODE_LABELS = {
  'completely-new': 'Completely New',
  new: 'New',
  practice: 'Practice',
  'with-review': 'With Review',
  'mc-only': 'Multiple Choice Only',
};

const PHASE_CONFIG = {
  review: {
    name: 'Review',
    icon: FaBook,
    color: 'bg-blue-500',
    borderColor: 'border-blue-500',
  },
  'multiple-choice': {
    name: 'Multiple Choice',
    icon: IoSparkles,
    color: 'bg-purple-500',
    borderColor: 'border-purple-500',
  },
  translation: {
    name: 'Translation',
    icon: FaDumbbell,
    color: 'bg-brand-pink',
    borderColor: 'border-brand-pink',
  },
};

// PostgreSQL to_char with 'OF' produces '+00' but JS Date needs '+00:00'
function parseTimestamp(isoString) {
  if (!isoString) return null;
  const normalized = isoString
    .replace(/(\.\d{3})\d+/, '$1')
    .replace(/([+-]\d{2})$/, '$1:00');
  const d = new Date(normalized);
  return Number.isFinite(d.getTime()) ? d : null;
}

function timeAgo(isoString) {
  const d = parseTimestamp(isoString);
  if (!d) return 'unknown';
  const ms = Date.now() - d.getTime();
  if (ms < 0) return 'just now';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function getDaysOld(isoString) {
  const d = parseTimestamp(isoString);
  if (!d) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** Build the phase sequence for a given quiz mode / set type */
function getPhaseSequence(sessionType, quizMode) {
  if (sessionType === 'srs_learn_new')
    return ['review', 'multiple-choice', 'translation'];
  if (sessionType !== 'quiz') return [];
  switch (quizMode) {
    case 'completely-new':
      return ['review', 'multiple-choice', 'translation'];
    case 'new':
      return ['multiple-choice', 'translation'];
    case 'practice':
      return ['translation'];
    case 'with-review':
      return ['review', 'multiple-choice'];
    case 'mc-only':
      return ['multiple-choice'];
    default:
      return [];
  }
}

/**
 * Mini phase indicator row for quiz and learn-new sessions.
 * Shows completed phases with checkmarks, current phase highlighted.
 */
function PhaseIndicator({ phases, currentPhase, completedPhases }) {
  if (phases.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {phases.map((phaseId, index) => {
        const config = PHASE_CONFIG[phaseId];
        if (!config) return null;
        const Icon = config.icon;
        const isCompleted = completedPhases.includes(phaseId);
        const isCurrent = phaseId === currentPhase;

        return (
          <div key={phaseId} className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                isCompleted
                  ? `${config.color} text-white`
                  : isCurrent
                    ? `${config.borderColor} border bg-white dark:bg-white/10 text-gray-900 dark:text-white`
                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40'
              }`}
            >
              {isCompleted ? (
                <FaCheckCircle className="text-[10px]" />
              ) : (
                <Icon className="text-[10px]" />
              )}
              <span className="whitespace-nowrap">{config.name}</span>
            </div>
            {index < phases.length - 1 && (
              <svg
                className="w-2.5 h-2.5 text-gray-300 dark:text-white/20"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ResumeSessionModal({
  isOpen,
  sessionState,
  loadingAction = null,
  onResume,
  onStartFresh,
  onCancel,
}) {
  if (!sessionState) return null;

  const sessionType = sessionState.session_type;
  const sessionTypeLabel = SESSION_TYPE_LABELS[sessionType] || sessionType;
  const isChunked = sessionState.is_chunked === 'true';
  const currentChunk = (parseInt(sessionState.current_chunk_index) || 0) + 1;
  const totalChunks = parseInt(sessionState.total_chunks) || 1;
  const chunkSize = parseInt(sessionState.chunk_size) || 25;
  const totalItems = parseInt(sessionState.total_items) || 0;
  const quizMode = sessionState.quiz_mode || null;
  const quizModeLabel = quizMode
    ? QUIZ_MODE_LABELS[quizMode] || quizMode
    : null;
  const currentPhase = sessionState.current_phase || null;
  const statsCorrect = parseInt(sessionState.stats_correct) || 0;
  const statsIncorrect = parseInt(sessionState.stats_incorrect) || 0;
  const statsAttempts = statsCorrect + statsIncorrect;
  const currentIndex = parseInt(sessionState.current_index) || 0;
  const lastActivity = timeAgo(sessionState.updated_at);
  const daysOld = getDaysOld(sessionState.updated_at);
  const isAnyLoading = loadingAction !== null;

  // Build completed phases from DB properties
  const completedPhases = Object.keys(sessionState)
    .filter(
      (k) => k.startsWith('completed_phase.') && sessionState[k] === 'true'
    )
    .map((k) => k.replace('completed_phase.', ''));

  // Phase sequence for quiz / learn-new
  const hasPhases = sessionType === 'quiz' || sessionType === 'srs_learn_new';
  const phaseSequence = getPhaseSequence(sessionType, quizMode);

  // Flashcards: card position is just currentIndex
  const isFlashcards = sessionType === 'flashcards';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      size="md"
      closeOnBackdrop={false}
      closeOnEscape={false}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isAnyLoading}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <button
              onClick={onStartFresh}
              disabled={isAnyLoading}
              className="group flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-brand-pink text-brand-pink hover:bg-brand-pink/10 dark:hover:bg-brand-pink/15 transition-colors disabled:opacity-50"
            >
              {loadingAction === 'startFresh' ? (
                <TbLoader3 className="w-4 h-4 animate-spin" />
              ) : (
                <TbRotateClockwise className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
              )}
              Start Fresh
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={onResume}
              disabled={isAnyLoading}
            >
              {loadingAction === 'resume' && (
                <TbLoader3 className="w-4 h-4 animate-spin mr-1.5" />
              )}
              Resume Session
            </Button>
          </div>
        </div>
      }
    >
      <div className="px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Resume Session?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          You have an unfinished session.
        </p>

        <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 border border-gray-200 dark:border-white/10 space-y-2.5">
          {/* Type row */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">
              Type
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {sessionTypeLabel}
            </span>
          </div>

          {/* Quiz mode */}
          {quizModeLabel && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">
                Mode
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {quizModeLabel}
              </span>
            </div>
          )}

          {/* Phase indicator for quiz / learn-new */}
          {hasPhases && phaseSequence.length > 0 && currentPhase && (
            <div className="pt-1 pb-0.5">
              <span className="text-[10px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400 block mb-1.5">
                Phase
              </span>
              <PhaseIndicator
                phases={phaseSequence}
                currentPhase={currentPhase}
                completedPhases={completedPhases}
              />
            </div>
          )}

          {/* Stats for quiz / learn-new (only if any attempts were made) */}
          {hasPhases && statsAttempts > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">
                Stats
              </span>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <FaCheckCircle className="text-[10px]" />
                  {statsCorrect}
                </span>
                <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                  <FaTimesCircle className="text-[10px]" />
                  {statsIncorrect}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {Math.round((statsCorrect / statsAttempts) * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Flashcards: card position */}
          {isFlashcards && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">
                Progress
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Card {currentIndex} of {isChunked ? chunkSize : totalItems}
              </span>
            </div>
          )}

          {/* Learn new: item count */}
          {sessionType === 'srs_learn_new' && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">
                Items
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {totalItems} word{totalItems !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Chunk info (quiz + flashcards) */}
          {isChunked && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">
                Chunk
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {currentChunk} of {totalChunks}
              </span>
            </div>
          )}

          {/* Last activity */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400">
              Last Activity
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {lastActivity}
            </span>
          </div>
        </div>

        {daysOld > 14 && (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
            This session is {daysOld} days old. Consider starting fresh if the
            content has changed.
          </div>
        )}
      </div>
    </BaseModal>
  );
}
