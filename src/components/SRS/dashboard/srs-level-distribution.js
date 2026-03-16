const INTERVAL_LABELS = {
  1: '10 min',
  2: '1 day',
  3: '3 days',
  4: '1 week',
  5: '2 weeks',
  6: '1 month',
  7: '2 months',
  8: '4 months',
  9: '6 months',
};

const LEVEL_COLORS = {
  1: 'bg-blue-400/60',
  2: 'bg-blue-500/60',
  3: 'bg-blue-500/60',
  4: 'bg-blue-600/60',
  5: 'bg-yellow-400/60',
  6: 'bg-yellow-500/60',
  7: 'bg-red-500/60',
  8: 'bg-green-500/60',
  9: 'bg-purple-500/60',
};

export default function SrsLevelDistribution({ levelCounts }) {
  const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const maxCount = Math.max(...levels.map((l) => levelCounts[l] || 0), 1);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Level Distribution
      </h3>
      <div className="space-y-2">
        {levels.map((level) => {
          const count = levelCounts[level] || 0;
          const widthPercent = (count / maxCount) * 100;

          return (
            <div key={level} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 w-20 sm:w-24 flex-shrink-0">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-5">
                  L{level}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                  {INTERVAL_LABELS[level]}
                </span>
              </div>
              <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                {count > 0 && (
                  <div
                    className={`h-full ${LEVEL_COLORS[level]} rounded transition-all duration-500 ease-out`}
                    style={{ width: `${widthPercent}%` }}
                  />
                )}
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-6 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
