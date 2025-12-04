export const TimeRangeFilter = ({
  timeRangePreset,
  customDateRange,
  onTimeRangeChange,
  onCustomDateChange,
  onApplyCustomRange
}) => {
  const showCustomRange = timeRangePreset === 'custom';

  return (
    <div className="space-y-4">
      {/* Custom Range Inputs */}
      {showCustomRange && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={customDateRange?.startDate || ''}
              onChange={(e) => onCustomDateChange('startDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#172229] text-[#4e4a4a] dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={customDateRange?.endDate || ''}
              onChange={(e) => onCustomDateChange('endDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#172229] text-[#4e4a4a] dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={onApplyCustomRange}
              disabled={!customDateRange?.startDate || !customDateRange?.endDate}
              className="px-6 py-2 bg-[#e30a5f] text-white rounded-lg hover:bg-[#c40850] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Time Range Selector */}
      <div className="flex items-center gap-1">
        <label className="text-sm text-gray-600 dark:text-gray-400">
          Time Range:
        </label>
        <select
          value={timeRangePreset}
          onChange={(e) => onTimeRangeChange(e.target.value)}
          className="ml-2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#172229] text-[#4e4a4a] dark:text-white"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>
    </div>
  );
};
