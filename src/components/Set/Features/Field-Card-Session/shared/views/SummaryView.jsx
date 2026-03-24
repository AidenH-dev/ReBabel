import { useState, useEffect, useRef } from 'react';
import { FaCheckCircle, FaTimesCircle, FaRedo } from 'react-icons/fa';
import { FiCheckCircle } from 'react-icons/fi';
import {
  TbTrendingUp,
  TbTrendingDown,
  TbArrowBigUpFilled,
  TbArrowBigDownFilled,
} from 'react-icons/tb';

// ── Animated count-up hook ──────────────────────────────────────────────────

function useCountUp(target, duration = 1200, delay = 300, animate = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setValue(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!animate || target === 0) return;

    let start = null;
    timeoutRef.current = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        }
      };
      rafRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay, animate]);

  return value;
}

// ── Mastery stage colors ────────────────────────────────────────────────────

const MASTERY_STAGES = [
  { bg: 'bg-gray-400', label: 'Not Started' },
  { bg: 'bg-blue-500', label: 'Fresh' },
  { bg: 'bg-yellow-500', label: 'Practiced' },
  { bg: 'bg-red-500', label: 'Intermediate' },
  { bg: 'bg-green-500', label: 'Expert' },
  { bg: 'bg-purple-500', label: 'Mastered' },
];

/**
 * SummaryView - Session completion summary
 *
 * @param {Object} sessionStats - { correct, incorrect, accuracy }
 * @param {Array} answeredItems - Answered question objects
 * @param {boolean} [animateAccuracy=false] - Animate stats
 * @param {function} [onRetry] - Retry callback
 * @param {function} onBackToSet - Back navigation callback
 * @param {string} completionTitle - Session type label
 * @param {Object} [masteryBefore] - Mastery stages before session
 * @param {Object} [masteryAfter] - Mastery stages after session
 * @param {Object} [srsLevelChanges] - { levelsUp, levelsDown } for SRS sessions
 */

export default function SummaryView({
  sessionStats,
  answeredItems,
  animateAccuracy = false,
  onRetry,
  onBackToSet,
  completionTitle,
  masteryBefore,
  masteryAfter,
  srsLevelChanges,
}) {
  const totalQuestions = answeredItems.length;
  const isSrsSession = Boolean(srsLevelChanges);

  // Animated stats
  const animCorrect = useCountUp(
    sessionStats.correct,
    800,
    200,
    animateAccuracy
  );
  const animIncorrect = useCountUp(
    sessionStats.incorrect,
    800,
    350,
    animateAccuracy
  );
  const animAccuracy = useCountUp(
    sessionStats.accuracy,
    1200,
    500,
    animateAccuracy
  );
  const animLevelsUp = useCountUp(
    srsLevelChanges?.levelsUp || 0,
    800,
    300,
    animateAccuracy
  );
  const animLevelsDown = useCountUp(
    srsLevelChanges?.levelsDown || 0,
    800,
    500,
    animateAccuracy
  );

  // Accuracy bar
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    if (!animateAccuracy) {
      setBarWidth(0);
      return;
    }
    const t = setTimeout(() => setBarWidth(sessionStats.accuracy), 600);
    return () => clearTimeout(t);
  }, [animateAccuracy, sessionStats.accuracy]);

  // Mastery bar
  const [masteryVisible, setMasteryVisible] = useState(false);
  useEffect(() => {
    if (!animateAccuracy) {
      setMasteryVisible(false);
      return;
    }
    const t = setTimeout(() => setMasteryVisible(true), 800);
    return () => clearTimeout(t);
  }, [animateAccuracy]);

  // Derived
  const accuracy = sessionStats.accuracy;
  const isGoodSession = accuracy >= 80;
  const isPerfect = accuracy === 100;
  const uniqueItemCount = new Set(
    answeredItems.map((a) => a.originalId).filter(Boolean)
  ).size;

  // Mastery delta for the +X% animation
  const masteryDelta =
    masteryBefore && masteryAfter
      ? (() => {
          const beforePct =
            masteryBefore.totalItems > 0
              ? (masteryBefore.stages.reduce(
                  (s, st, i) => (i > 0 ? s + st.count : s),
                  0
                ) /
                  masteryBefore.totalItems) *
                100
              : 0;
          const afterPct =
            masteryAfter.totalItems > 0
              ? (masteryAfter.stages.reduce(
                  (s, st, i) => (i > 0 ? s + st.count : s),
                  0
                ) /
                  masteryAfter.totalItems) *
                100
              : 0;
          return Math.round(afterPct - beforePct);
        })()
      : 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center lg:flex-row lg:items-stretch lg:justify-start gap-3 lg:mr-10">
      {/* Left Side - Session Summary */}
      <div className="w-full lg:flex-1 flex items-start justify-center lg:items-center lg:justify-end lg:pr-3">
        <div className="w-full max-w-xl">
          <div className="bg-surface-card rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-6">
            <div className="flex flex-col">
              {/* Completion Header */}
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <FiCheckCircle className="w-9 h-9 sm:w-11 sm:h-11 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    {completionTitle}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {totalQuestions} questions
                    {uniqueItemCount > 0 &&
                      uniqueItemCount !== totalQuestions &&
                      ` across ${uniqueItemCount} items`}
                  </p>
                </div>
                {isPerfect && (
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-semibold uppercase tracking-wide">
                    Perfect
                  </span>
                )}
              </div>

              {/* ── SRS Hero: Level Changes ── */}
              {isSrsSession ? (
                <div className="flex items-center justify-center gap-6 sm:gap-10 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <TbArrowBigUpFilled className="text-green-500 text-xl sm:text-2xl" />
                      <span className="text-4xl sm:text-5xl font-bold text-green-500 tabular-nums">
                        {animLevelsUp}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mt-1">
                      Leveled Up
                    </div>
                  </div>
                  {(srsLevelChanges?.levelsDown || 0) > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <TbArrowBigDownFilled className="text-red-400 text-xl sm:text-2xl" />
                        <span className="text-4xl sm:text-5xl font-bold text-red-400 tabular-nums">
                          {animLevelsDown}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mt-1">
                        Leveled Down
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Non-SRS Hero: Accuracy ── */
                <div className="text-center mb-4">
                  <div className="text-4xl sm:text-5xl font-bold text-brand-pink tabular-nums">
                    {animAccuracy}%
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mt-1">
                    Accuracy
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-pink to-[#c1084d] transition-all duration-[1200ms] ease-out"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div
                className={`grid gap-2 mb-4 ${isSrsSession ? 'grid-cols-3' : 'grid-cols-2'}`}
              >
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      Correct
                    </span>
                    <FaCheckCircle
                      className="text-green-500"
                      style={{ fontSize: 10 }}
                    />
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums mt-0.5">
                    {animCorrect}
                    <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">
                      / {totalQuestions}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      Incorrect
                    </span>
                    <FaTimesCircle
                      className="text-red-400"
                      style={{ fontSize: 10 }}
                    />
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums mt-0.5">
                    {animIncorrect}
                    {sessionStats.incorrect === 0 && (
                      <span className="text-xs font-normal text-green-500 ml-1.5">
                        None!
                      </span>
                    )}
                  </div>
                </div>
                {/* SRS: show accuracy as a third stat instead of hero */}
                {isSrsSession && (
                  <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                        Accuracy
                      </span>
                    </div>
                    <div className="text-xl font-bold text-brand-pink tabular-nums mt-0.5">
                      {animAccuracy}%
                    </div>
                  </div>
                )}
              </div>

              {/* SRS: accuracy bar below stats grid */}
              {isSrsSession && (
                <div className="mb-4">
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-pink to-[#c1084d] transition-all duration-[1200ms] ease-out"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Session Performance Indicator */}
              {accuracy > 0 && (
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs font-medium ${
                    isGoodSession
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                  }`}
                >
                  {isGoodSession ? (
                    <TbTrendingUp className="text-base flex-shrink-0" />
                  ) : (
                    <TbTrendingDown className="text-base flex-shrink-0" />
                  )}
                  {isSrsSession
                    ? isPerfect
                      ? `Flawless! All ${srsLevelChanges.levelsUp} items leveled up.`
                      : isGoodSession
                        ? `${srsLevelChanges.levelsUp} items leveled up this session.`
                        : `${srsLevelChanges.levelsDown} items need more practice.`
                    : isPerfect
                      ? 'Flawless session! Every answer was correct.'
                      : isGoodSession
                        ? `Strong session. ${sessionStats.correct} out of ${totalQuestions} correct.`
                        : `${sessionStats.incorrect} incorrect answers to review. Keep practicing!`}
                </div>
              )}

              {/* Mastery Bar (SRS sessions only) */}
              {masteryBefore && (
                <MasteryBarAnimated
                  data={masteryAfter || masteryBefore}
                  animate={masteryVisible}
                  delta={masteryDelta}
                />
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-2">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all active:scale-95 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <FaRedo className="inline mr-2 text-xs" />
                    Retry
                  </button>
                )}
                <button
                  onClick={onBackToSet}
                  className={`${
                    onRetry ? 'flex-1' : 'w-full'
                  } px-4 py-2.5 rounded-lg font-medium text-sm text-white transition-all active:scale-95 bg-gradient-to-r from-brand-pink to-[#c1084d] hover:brightness-110`}
                >
                  Back to Study Set
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Question Breakdown */}
      <div className="w-full lg:w-1/4 flex items-start lg:items-center">
        <div className="bg-surface-card rounded-xl border border-gray-200 dark:border-white/10 p-3 sm:p-4 flex flex-col w-full h-auto max-h-[300px] lg:h-auto lg:max-h-[500px]">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
            Question Breakdown
          </h3>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {answeredItems.map((item, index) => (
              <div
                key={index}
                className={`rounded-md border px-2.5 py-2 text-xs transition-colors ${
                  item.isCorrect
                    ? 'border-green-300/70 dark:border-green-500/20 bg-green-50/60 dark:bg-green-500/5'
                    : 'border-red-300/70 dark:border-red-400/20 bg-red-50/60 dark:bg-red-400/5'
                }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  {item.isCorrect ? (
                    <FaCheckCircle
                      className="text-green-500 flex-shrink-0"
                      style={{ fontSize: 9 }}
                    />
                  ) : (
                    <FaTimesCircle
                      className="text-red-400 flex-shrink-0"
                      style={{ fontSize: 9 }}
                    />
                  )}
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {item.questionType} → {item.answerType}
                  </span>
                </div>
                <div className="mb-0.5">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    Q:{' '}
                  </span>
                  <span className="font-semibold text-[11px] text-gray-900 dark:text-white">
                    {item.question}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {!item.isCorrect && (
                    <div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        You:{' '}
                      </span>
                      <span className="text-[11px] text-red-500 dark:text-red-400 line-through">
                        {item.userAnswer}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {item.isCorrect ? 'You: ' : 'Answer: '}
                    </span>
                    <span
                      className={`font-medium text-[11px] ${
                        item.isCorrect
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {item.isCorrect ? item.userAnswer : item.correctAnswer}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mastery bar with grow-from-zero + delta badge ───────────────────────────

function MasteryBarAnimated({ data, animate, delta }) {
  const total = data.totalItems;
  const studyingCount = data.stages.reduce(
    (sum, s, i) => (i > 0 ? sum + s.count : sum),
    0
  );
  const masteryPercent =
    total > 0 ? Math.round((studyingCount / total) * 100) : 0;

  const animPercent = useCountUp(masteryPercent, 1200, 0, animate);

  // Delta badge: shows "+X%" then fades out after merging
  const [showDelta, setShowDelta] = useState(false);
  const [deltaFaded, setDeltaFaded] = useState(false);
  useEffect(() => {
    if (!animate || !delta || delta === 0) {
      setShowDelta(false);
      setDeltaFaded(false);
      return;
    }
    // Show the delta badge shortly after the bar starts growing
    const t1 = setTimeout(() => setShowDelta(true), 400);
    // Fade it out as the number finishes counting up
    const t2 = setTimeout(() => setDeltaFaded(true), 1400);
    // Remove from DOM
    const t3 = setTimeout(() => setShowDelta(false), 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [animate, delta]);

  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Set Mastery
        </span>
        <div className="flex items-baseline gap-1.5">
          {/* Delta badge */}
          {showDelta && delta !== 0 && (
            <span
              className={`text-[11px] font-bold tabular-nums transition-all duration-500 ${
                deltaFaded
                  ? 'opacity-0 translate-x-2'
                  : 'opacity-100 translate-x-0'
              } ${delta > 0 ? 'text-green-500' : 'text-red-400'}`}
            >
              {delta > 0 ? '+' : ''}
              {delta}%
            </span>
          )}
          <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">
            {animPercent}%
          </span>
        </div>
      </div>
      <div className="relative h-[14px] rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center">
        <div className="flex h-2 w-full gap-px px-0.5">
          {MASTERY_STAGES.map((stage, i) => {
            if (i === 0) return null;
            const pct = animate
              ? total > 0
                ? (data.stages[i].count / total) * 100
                : 0
              : 0;
            return (
              <div
                key={stage.label}
                className={`${stage.bg} rounded-full transition-all duration-[1200ms] ease-out`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
        {data.stages.map((stage, i) => {
          if (i === 0 || stage.count === 0) return null;
          return (
            <div key={stage.label} className="flex items-center gap-1">
              <div
                className={`w-1.5 h-1.5 rounded-full ${MASTERY_STAGES[i]?.bg || 'bg-gray-400'}`}
              />
              <span className="text-[9px] text-gray-500 dark:text-gray-400">
                {stage.label}{' '}
                <span className="font-semibold">{stage.count}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
