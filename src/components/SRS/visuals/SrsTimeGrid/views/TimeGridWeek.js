/**
 * TimeGridWeek Component (View)
 *
 * Displays SRS items in a minimal weekly time grid view.
 * Shows 7 days (today + 6 days) with 24 hourly time slots.
 *
 * This is a presentational component - it only handles rendering
 * and receives all data via props.
 */

import { formatDayHeader } from '../models/srsFormatters';

export default function TimeGridWeek({
  items = [],
  currentTime = new Date(),
  weekDays = [],
}) {
  /**
   * Get items that fall into a specific day and hour
   */
  const getItemsForDayAndHour = (dayDate, hour) => {
    return items.filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.toDateString() === dayDate.toDateString() &&
        itemDate.getHours() === hour
      );
    });
  };

  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentDayStr = currentTime.toDateString();

  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden flex flex-col h-full bg-white dark:bg-[#141f25]">
      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="inline-block min-w-full">
          {/* Header row with day labels */}
          <div className="flex border-b border-gray-300 dark:border-gray-600 sticky top-0 z-10 bg-white dark:bg-[#1a2834]">
            <div className="w-20 flex-shrink-0 border-r border-gray-300 dark:border-gray-600"></div>
            {weekDays.map((day) => {
              const isToday = day.toDateString() === currentDayStr;
              return (
                <div
                  key={day.toDateString()}
                  className={`flex-1 px-4 py-2 border-r border-gray-300 dark:border-gray-600 text-center text-sm font-semibold ${
                    isToday
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                      : 'bg-gray-50 dark:bg-[#0f1419] text-gray-900 dark:text-white'
                  }`}
                >
                  {formatDayHeader(day)}
                </div>
              );
            })}
          </div>

          {/* Time slots */}
          {Array.from({ length: 24 }, (_, i) => {
            const hour = i;
            const time = String(hour).padStart(2, '0') + ':00';
            const isCurrentHour = hour === currentHour;

            return (
              <div
                key={hour}
                data-hour={hour}
                className={`flex border-b ${
                  isCurrentHour
                    ? 'border-[#e30a5f] bg-red-50 dark:bg-red-950/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Time label */}
                <div
                  className={`w-20 flex-shrink-0 border-r border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-mono ${
                    isCurrentHour
                      ? 'bg-[#e30a5f] text-white font-bold'
                      : 'bg-gray-50 dark:bg-[#0f1419] text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {time}
                </div>

                {/* Day cells */}
                {weekDays.map((day) => {
                  const cellItems = getItemsForDayAndHour(day, hour);
                  const itemCount = cellItems.length;
                  const isTodayAndCurrentHour =
                    day.toDateString() === currentDayStr && isCurrentHour;

                  return (
                    <div
                      key={`${day.toDateString()}-${hour}`}
                      className={`flex-1 min-h-16 border-r border-gray-200 dark:border-gray-700 p-1 relative flex items-center justify-center ${
                        isTodayAndCurrentHour
                          ? 'bg-red-50 dark:bg-red-950/20'
                          : 'bg-white dark:bg-[#141f25]'
                      }`}
                    >
                      {/* Current time indicator */}
                      {isTodayAndCurrentHour && (
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-[#e30a5f] z-10 pointer-events-none"
                          style={{
                            top: `${(currentMinutes / 60) * 100}%`,
                          }}
                        />
                      )}

                      {/* Show count badge if items exist */}
                      {itemCount > 0 && (
                        <div className="bg-[#e30a5f] text-white rounded-lg px-1 w-fit h-8 flex items-center justify-center text-xs sm:text-sm font-semibold transition-colors cursor-pointer">
                          {itemCount} Items
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
