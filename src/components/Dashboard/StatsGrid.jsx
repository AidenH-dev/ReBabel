import { FaFire, FaClock, FaCheck } from 'react-icons/fa';
import { TbCards } from 'react-icons/tb';

export default function StatsGrid({
  currentStreak,
  longestStreak,
  totalStudyTime,
  accuracyRate,
  cardsReviewed,
}) {
  return (
    <>
      {/* Compact Stats Row - Desktop only */}
      <div className="hidden md:grid md:grid-cols-4 gap-3">
        {/* Streak Card */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-3 text-white shadow">
          <div className="flex items-center justify-between mb-1">
            <FaFire className="text-lg" />
            <div className="text-right">
              <div className="text-[10px] opacity-75">Longest</div>
              <div className="text-sm font-bold">
                {longestStreak ?? '\u2014'}
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold">{currentStreak ?? '\u2014'}</div>
          <p className="text-[10px] opacity-90">day streak</p>
        </div>

        {/* Study Time */}
        <div className="bg-white dark:bg-surface-card rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FaClock className="text-xs text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {totalStudyTime ?? '\u2014'}
          </div>
          <p className="text-[10px] text-gray-600 dark:text-gray-400">
            Total Study Time
          </p>
        </div>

        {/* Accuracy */}
        <div className="bg-white dark:bg-surface-card rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <FaCheck className="text-xs text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {accuracyRate != null ? `${accuracyRate}%` : '\u2014'}
          </div>
          <p className="text-[10px] text-gray-600 dark:text-gray-400">
            Accuracy Rate
          </p>
        </div>

        {/* Items Reviewed */}
        <div className="bg-white dark:bg-surface-card rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <TbCards className="text-xs text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {cardsReviewed ?? '\u2014'}
          </div>
          <p className="text-[10px] text-gray-600 dark:text-gray-400">
            Items Reviewed
          </p>
        </div>
      </div>

      {/* Compact Stats - Mobile only */}
      <div className="md:hidden bg-white dark:bg-surface-card rounded-lg p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-3 text-white">
            <div className="flex items-center gap-2">
              <FaFire className="text-base" />
              <div>
                <div className="text-lg font-bold leading-tight">
                  {currentStreak ?? '\u2014'}
                </div>
                <p className="text-[10px] opacity-80">Day Streak</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <FaClock className="text-base text-blue-500" />
              <div>
                <div className="text-lg font-bold leading-tight text-gray-900 dark:text-white">
                  {totalStudyTime ?? '\u2014'}
                </div>
                <p className="text-[10px] text-gray-500">Study Time</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <FaCheck className="text-base text-green-500" />
              <div>
                <div className="text-lg font-bold leading-tight text-gray-900 dark:text-white">
                  {accuracyRate != null ? `${accuracyRate}%` : '\u2014'}
                </div>
                <p className="text-[10px] text-gray-500">Accuracy</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TbCards className="text-base text-purple-500" />
              <div>
                <div className="text-lg font-bold leading-tight text-gray-900 dark:text-white">
                  {cardsReviewed ?? '\u2014'}
                </div>
                <p className="text-[10px] text-gray-500">Reviewed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
