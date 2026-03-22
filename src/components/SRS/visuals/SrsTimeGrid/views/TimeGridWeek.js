/**
 * TimeGridWeek Component (View)
 *
 * Displays SRS items in a minimal weekly time grid view.
 * Shows today only on mobile, full 7-day week on desktop.
 * Auto-scrolls to the current hour on mount.
 *
 * This is a presentational component - it only handles rendering
 * and receives all data via props.
 */

import { useRef, useEffect, useState } from 'react';
import { formatDayHeader } from '../models/srsFormatters';

export default function TimeGridWeek({
  items = [],
  currentTime = new Date(),
  weekDays = [],
}) {
  const scrollRef = useRef(null);
  const currentHourRef = useRef(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Auto-scroll to current hour on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentHourRef.current && scrollRef.current) {
        const container = scrollRef.current;
        const element = currentHourRef.current;
        const containerHeight = container.clientHeight;
        const elementTop = element.offsetTop;
        // Center the current hour in the viewport
        container.scrollTop = elementTop - containerHeight / 3;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [items]);

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

  /** Get total items for a given day */
  const getItemsForDay = (dayDate) => {
    return items.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate.toDateString() === dayDate.toDateString();
    });
  };

  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentDayStr = currentTime.toDateString();

  // Mobile: show only the selected day; Desktop: show all week days
  const mobileDay = weekDays[selectedDayIndex] || weekDays[0];

  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden flex flex-col h-full bg-white dark:bg-surface-page">
      {/* Time grid */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="inline-block min-w-full">
          {/* Header row with day labels */}
          <div className="flex border-b border-gray-300 dark:border-gray-600 sticky top-0 z-10 bg-white dark:bg-surface-elevated">
            <div className="w-8 sm:w-14 flex-shrink-0 border-r border-gray-300 dark:border-gray-600"></div>
            {weekDays.map((day) => {
              const isToday = day.toDateString() === currentDayStr;
              return (
                <div
                  key={day.toDateString()}
                  className={`flex-1 px-0.5 sm:px-1 py-1 border-r border-gray-300 dark:border-gray-600 text-center text-[8px] sm:text-xs font-semibold ${
                    isToday
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                      : 'bg-surface-deep text-gray-900 dark:text-white'
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
                ref={isCurrentHour ? currentHourRef : undefined}
                className={`flex border-b ${
                  isCurrentHour
                    ? 'border-brand-pink bg-red-50 dark:bg-red-950/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Time label */}
                <div
                  className={`w-8 sm:w-14 flex-shrink-0 border-r border-gray-300 dark:border-gray-600 px-0.5 sm:px-1 py-0.5 sm:py-1 text-[8px] sm:text-xs font-mono ${
                    isCurrentHour
                      ? 'bg-brand-pink text-white font-bold'
                      : 'bg-surface-deep text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {time}
                </div>

                {/* All day cells */}
                <div className="flex flex-1">
                  {weekDays.map((day) => {
                    const cellItems = getItemsForDayAndHour(day, hour);
                    const itemCount = cellItems.length;
                    const isTodayAndCurrentHour =
                      day.toDateString() === currentDayStr && isCurrentHour;

                    return (
                      <div
                        key={`${day.toDateString()}-${hour}`}
                        className={`flex-1 min-h-6 border-r border-gray-200 dark:border-gray-700 px-1 py-0.5 relative flex items-center justify-center ${
                          isTodayAndCurrentHour
                            ? 'bg-red-50 dark:bg-red-950/20'
                            : 'bg-white dark:bg-surface-page'
                        }`}
                      >
                        {isTodayAndCurrentHour && (
                          <div
                            className="absolute left-0 right-0 h-0.5 bg-brand-pink z-10 pointer-events-none"
                            style={{ top: `${(currentMinutes / 60) * 100}%` }}
                          />
                        )}
                        {itemCount > 0 && (
                          <div className="bg-brand-pink text-white rounded px-1 h-4 sm:h-5 flex items-center justify-center text-[8px] sm:text-[10px] font-semibold">
                            {itemCount}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
