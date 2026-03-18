import Link from 'next/link';
import { useMemo } from 'react';

// Same stage grouping as the SRS dashboard
const STAGE_DEFS = [
  { label: 'Not Started', bg: 'bg-gray-400', dot: '#9ca3af' },
  { label: 'Fresh', bg: 'bg-blue-500', dot: '#3b82f6' },
  { label: 'Practiced', bg: 'bg-yellow-500', dot: '#eab308' },
  { label: 'Intermediate', bg: 'bg-red-500', dot: '#ef4444' },
  { label: 'Expert', bg: 'bg-green-500', dot: '#22c55e' },
  { label: 'Mastered', bg: 'bg-purple-500', dot: '#a855f7' },
];

const TYPE_STYLES = {
  vocabulary: {
    label: 'Vocab',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  grammar: {
    label: 'Grammar',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
};

function computeStages(levelCounts) {
  return [
    { label: 'Not Started', count: levelCounts[0] || 0 },
    {
      label: 'Fresh',
      count:
        (levelCounts[1] || 0) +
        (levelCounts[2] || 0) +
        (levelCounts[3] || 0) +
        (levelCounts[4] || 0),
    },
    {
      label: 'Practiced',
      count: (levelCounts[5] || 0) + (levelCounts[6] || 0),
    },
    { label: 'Intermediate', count: levelCounts[7] || 0 },
    { label: 'Expert', count: levelCounts[8] || 0 },
    { label: 'Mastered', count: levelCounts[9] || 0 },
  ];
}

export default function SrsSetHealthCard({ set }) {
  const { setId, setTitle, setType, totalItems, levelCounts, dueCount } = set;
  const typeStyle = TYPE_STYLES[setType] || null;

  const stages = useMemo(() => computeStages(levelCounts), [levelCounts]);
  const studyingCount = stages.reduce(
    (sum, s, i) => (i > 0 ? sum + s.count : sum),
    0
  );
  const studyingPercent =
    totalItems > 0 ? Math.round((studyingCount / totalItems) * 100) : 0;

  return (
    <Link
      href={`/learn/academy/sets/study/${setId}`}
      className="block bg-white dark:bg-[#1d2a32] border border-black/5 dark:border-white/10 rounded-xl p-4 hover:shadow-md hover:border-black/10 dark:hover:border-white/15 transition-all group"
    >
      {/* Row 1: Title + type badge + due badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-[#e30a5f] transition-colors">
              {setTitle}
            </h4>
            {typeStyle && (
              <span
                className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${typeStyle.bg} ${typeStyle.text}`}
              >
                {typeStyle.label}
              </span>
            )}
          </div>
        </div>
        {dueCount > 0 && (
          <span className="flex-shrink-0 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-semibold rounded-full">
            {dueCount} due
          </span>
        )}
      </div>

      {/* Row 2: Mastery bar (same style as SrsMasteryBar) */}
      <div className="mb-2">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {studyingCount} of {totalItems} in progress
          </span>
          <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
            {studyingPercent}%
          </span>
        </div>
        <div className="relative h-[10px] rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center">
          <div className="flex h-[6px] w-full gap-px px-0.5">
            {stages.map((stage, i) => {
              if (i === 0) return null;
              const percent =
                totalItems > 0 ? (stage.count / totalItems) * 100 : 0;
              if (percent === 0) return null;
              return (
                <div
                  key={stage.label}
                  className={`${STAGE_DEFS[i].bg} rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${percent}%` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Stage legend (compact) */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {stages.map((stage, i) => {
          if (stage.count === 0) return null;
          return (
            <span
              key={stage.label}
              className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${STAGE_DEFS[i].bg}`}
              />
              {stage.count}
            </span>
          );
        })}
      </div>
    </Link>
  );
}
