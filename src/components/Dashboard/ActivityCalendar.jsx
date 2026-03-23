import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ActivityCalendar({ activityData }) {
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);
  const [maxWeeks, setMaxWeeks] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      // cell = 10px (w-2.5), gap = 2px (gap-0.5), plus 1px padding each side
      setMaxWeeks(Math.floor((w + 2) / 12));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getColorClass = (level) => {
    if (level === 0) return 'bg-gray-100 dark:bg-white/[0.07]';
    if (level === 1) return 'bg-green-200 dark:bg-green-900';
    if (level === 2) return 'bg-green-400 dark:bg-green-700';
    if (level === 3) return 'bg-green-600 dark:bg-green-500';
    return 'bg-green-700 dark:bg-green-400';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const showTooltip = (e, day) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      date: day.date,
      minutes: day.minutes,
      x: rect.left + rect.width / 2,
      y: rect.top - 4,
    });
  };

  const hideTooltip = () => setTooltip(null);

  // Group by week
  const weeks = [];
  for (let i = 0; i < activityData.length; i += 7) {
    weeks.push(activityData.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto" ref={containerRef}>
      {tooltip &&
        createPortal(
          <div
            className="fixed z-50 px-2 py-1 rounded-md bg-gray-900 dark:bg-gray-700 text-white text-[10px] leading-tight whitespace-nowrap pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-medium">{formatDate(tooltip.date)}</div>
            <div className="text-gray-300">
              {tooltip.minutes > 0
                ? `${tooltip.minutes} min studied`
                : 'No activity'}
            </div>
          </div>,
          document.body
        )}
      <div className="inline-flex gap-0.5 p-px">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-0.5">
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-2.5 h-2.5 rounded-sm ${getColorClass(day.level)} transition-all hover:ring-1 hover:ring-brand-pink cursor-pointer`}
                onMouseEnter={(e) => showTooltip(e, day)}
                onMouseLeave={hideTooltip}
                onClick={(e) => showTooltip(e, day)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
