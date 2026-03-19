import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function SrsLoadChart({ loadChart }) {
  const [tooltip, setTooltip] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
  const tooltipRef = useRef(null);

  const { bars, maxVal, todayIdx, avgPast } = useMemo(() => {
    if (!loadChart || loadChart.length === 0) {
      return { bars: [], maxVal: 1, todayIdx: -1, avgPast: 0 };
    }

    const today = new Date().toLocaleDateString('en-CA');
    const tIdx = loadChart.findIndex((d) => d.date === today);

    const processed = loadChart.map((d, i) => {
      const isPast = i < tIdx;
      const isToday = i === tIdx;
      const isFuture = i > tIdx;
      return {
        date: d.date,
        value: isPast ? d.reviewed : d.due,
        reviewed: d.reviewed,
        due: d.due,
        isPast,
        isToday,
        isFuture,
      };
    });

    const max = Math.max(...processed.map((d) => d.value), 1);

    const pastDays = processed.filter((d) => d.isPast && d.value > 0);
    const avgP =
      pastDays.length > 0
        ? Math.round(
            pastDays.reduce((s, d) => s + d.value, 0) / pastDays.length
          )
        : 0;

    return { bars: processed, maxVal: max, todayIdx: tIdx, avgPast: avgP };
  }, [loadChart]);

  const showTooltip = useCallback((e, bar) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      date: bar.date,
      reviewed: bar.reviewed,
      due: bar.due,
      isPast: bar.isPast,
      isToday: bar.isToday,
      isFuture: bar.isFuture,
      anchorX: rect.left + rect.width / 2,
      anchorY: rect.top - 6,
    });
  }, []);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  // Clamp tooltip position
  useEffect(() => {
    if (!tooltip || !tooltipRef.current) return;
    const el = tooltipRef.current;
    const w = el.offsetWidth;
    const pad = 8;
    let left = tooltip.anchorX - w / 2;
    if (left < pad) left = pad;
    if (left + w > window.innerWidth - pad) left = window.innerWidth - pad - w;
    setTooltipPos({ left, top: tooltip.anchorY - el.offsetHeight });
  }, [tooltip]);

  // Dismiss on outside touch
  useEffect(() => {
    if (!tooltip) return;
    const handler = () => setTooltip(null);
    document.addEventListener('touchstart', handler);
    return () => document.removeEventListener('touchstart', handler);
  }, [tooltip]);

  if (!loadChart || loadChart.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Overall Review Load
        </h3>
        <div className="flex items-center justify-center h-[120px] text-xs text-gray-400 dark:text-gray-500">
          No review data yet
        </div>
      </div>
    );
  }

  // SVG layout
  const w = 280;
  const h = 140;
  const padL = 22;
  const padR = 4;
  const padT = 16;
  const padB = 22;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const barW = plotW / bars.length;

  const avgLineY =
    avgPast > 0 ? padT + plotH - (avgPast / maxVal) * plotH : null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
        Overall Review Load
      </h3>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 rounded-sm bg-[#e30a5f]" />
          Reviewed
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 rounded-sm bg-[#e30a5f]/30 border border-[#e30a5f]/40" />
          Upcoming
        </div>
        {avgPast > 0 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            ~{avgPast}/day avg
          </span>
        )}
      </div>

      {/* Tooltip */}
      {tooltip &&
        createPortal(
          <div
            ref={tooltipRef}
            className="fixed z-50 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-[10px] leading-snug whitespace-nowrap pointer-events-none shadow-lg"
            style={{ left: tooltipPos.left, top: tooltipPos.top }}
          >
            <div className="font-semibold text-[11px] mb-0.5">
              {formatDate(tooltip.date)}
              {tooltip.isToday && (
                <span className="ml-1 text-[#e30a5f]">(today)</span>
              )}
            </div>
            {(tooltip.isPast || tooltip.isToday) && tooltip.reviewed > 0 && (
              <div className="text-gray-300">
                <span className="text-[#e30a5f] font-medium">
                  {tooltip.reviewed}
                </span>{' '}
                reviewed
              </div>
            )}
            {tooltip.due > 0 && (
              <div className="text-gray-300">
                <span
                  className="font-medium"
                  style={{
                    color: tooltip.isFuture ? 'rgba(227,10,95,0.7)' : undefined,
                  }}
                >
                  {tooltip.due}
                </span>{' '}
                {tooltip.isFuture ? 'projected due' : 'due'}
              </div>
            )}
            {tooltip.reviewed === 0 && tooltip.due === 0 && (
              <div className="text-gray-400">No activity</div>
            )}
          </div>,
          document.body
        )}

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padT + plotH - frac * plotH;
          return (
            <line
              key={frac}
              x1={padL}
              y1={y}
              x2={w - padR}
              y2={y}
              stroke="currentColor"
              className="text-gray-100 dark:text-gray-800"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((frac) => {
          const y = padT + plotH - frac * plotH;
          const val = Math.round(maxVal * frac);
          return (
            <text
              key={`y-${frac}`}
              x={padL - 3}
              y={y + 3}
              textAnchor="end"
              className="fill-gray-400 dark:fill-gray-500"
              fontSize="7"
            >
              {val}
            </text>
          );
        })}

        {/* Bars + invisible hit areas for tooltip */}
        {bars.map((bar, i) => {
          const barH = (bar.value / maxVal) * plotH;
          const x = padL + i * barW;
          const y = padT + plotH - barH;

          return (
            <g
              key={bar.date}
              onMouseEnter={(e) => showTooltip(e, bar)}
              onMouseLeave={hideTooltip}
              onTouchStart={(e) => {
                e.stopPropagation();
                showTooltip(e, bar);
              }}
              className="cursor-pointer"
            >
              {/* Invisible full-height hit area */}
              <rect
                x={x}
                y={padT}
                width={barW}
                height={plotH}
                fill="transparent"
              />
              {/* Visible bar */}
              <rect
                x={x + barW * 0.1}
                y={barH > 0 ? y : padT + plotH - 1}
                width={barW * 0.8}
                height={Math.max(barH, barH > 0 ? 1 : 0)}
                rx="1"
                fill={
                  bar.isToday
                    ? '#e30a5f'
                    : bar.isPast
                      ? '#e30a5f'
                      : 'rgba(227, 10, 95, 0.25)'
                }
                stroke={
                  bar.isFuture && barH > 0 ? 'rgba(227, 10, 95, 0.4)' : 'none'
                }
                strokeWidth="0.5"
                opacity={bar.isPast ? (bar.value > 0 ? 1 : 0.15) : 1}
                className="pointer-events-none"
              />
            </g>
          );
        })}

        {/* Today marker line */}
        {todayIdx >= 0 && (
          <>
            <line
              x1={padL + todayIdx * barW + barW / 2}
              y1={padT - 2}
              x2={padL + todayIdx * barW + barW / 2}
              y2={padT + plotH + 2}
              stroke="#e30a5f"
              strokeWidth="0.75"
              strokeDasharray="2 2"
              className="pointer-events-none"
            />
            <text
              x={padL + todayIdx * barW + barW / 2}
              y={padT - 4}
              textAnchor="middle"
              fill="#e30a5f"
              fontSize="6"
              fontWeight="600"
              className="pointer-events-none"
            >
              today
            </text>
          </>
        )}

        {/* Average line */}
        {avgLineY !== null && (
          <>
            <line
              x1={padL}
              y1={avgLineY}
              x2={w - padR}
              y2={avgLineY}
              stroke="#e30a5f"
              strokeWidth="0.75"
              strokeDasharray="4 3"
              opacity="0.4"
              className="pointer-events-none"
            />
            <text
              x={w - padR}
              y={avgLineY - 3}
              textAnchor="end"
              fill="#e30a5f"
              fontSize="6"
              opacity="0.6"
              className="pointer-events-none"
            >
              Average
            </text>
          </>
        )}

        {/* X-axis date labels */}
        {bars
          .filter((_, i) => i % 10 === 0 || i === bars.length - 1)
          .map((bar) => {
            const i = bars.indexOf(bar);
            const d = new Date(bar.date + 'T00:00:00');
            return (
              <text
                key={bar.date}
                x={padL + i * barW + barW / 2}
                y={h - 4}
                textAnchor="middle"
                className="fill-gray-400 dark:fill-gray-500 pointer-events-none"
                fontSize="6.5"
              >
                {d.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </text>
            );
          })}
      </svg>
    </div>
  );
}
