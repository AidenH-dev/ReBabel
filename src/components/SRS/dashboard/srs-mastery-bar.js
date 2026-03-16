import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const STAGES = [
  { bg: 'bg-gray-400', dot: '#9ca3af' },
  { bg: 'bg-blue-500', dot: '#3b82f6' },
  { bg: 'bg-yellow-500', dot: '#eab308' },
  { bg: 'bg-red-500', dot: '#ef4444' },
  { bg: 'bg-green-500', dot: '#22c55e' },
  { bg: 'bg-purple-500', dot: '#a855f7' },
];

export default function SrsMasteryBar({ stages, totalItems }) {
  const [tooltip, setTooltip] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
  const tooltipRef = useRef(null);
  const studyingCount = stages.reduce(
    (sum, s, i) => (i > 0 ? sum + s.count : sum),
    0
  );
  const studyingPercent =
    totalItems > 0 ? Math.round((studyingCount / totalItems) * 100) : 0;

  const showTooltip = useCallback((e, stage, percent, i) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label: stage.label,
      count: stage.count,
      percent: Math.round(percent),
      color: STAGES[i]?.dot,
      anchorX: rect.left + rect.width / 2,
      anchorY: rect.top - 6,
    });
  }, []);

  const hideTooltip = useCallback(() => setTooltip(null), []);

  // Clamp tooltip position after render so we can measure its width
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

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Overall Mastery
        </h3>
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {studyingPercent}%
        </span>
      </div>
      {tooltip &&
        createPortal(
          <div
            ref={tooltipRef}
            className="fixed z-50 px-2 py-1 rounded-md bg-gray-900 dark:bg-gray-700 text-white text-[10px] leading-tight whitespace-nowrap pointer-events-none"
            style={{ left: tooltipPos.left, top: tooltipPos.top }}
          >
            <div className="font-medium" style={{ color: tooltip.color }}>
              {tooltip.label}
            </div>
            <div className="text-gray-300">
              {tooltip.count} {tooltip.count === 1 ? 'item' : 'items'} ·{' '}
              {tooltip.percent}%
            </div>
          </div>,
          document.body
        )}
      <div className="relative h-[14px] rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center">
        <div className="flex h-2 w-full gap-px px-0.5">
          {stages.map((stage, i) => {
            if (i === 0) return null;
            const percent =
              totalItems > 0 ? (stage.count / totalItems) * 100 : 0;
            if (percent === 0) return null;
            return (
              <div
                key={stage.label}
                className={`${STAGES[i].bg} rounded-full transition-all duration-500 ease-out cursor-pointer hover:opacity-80`}
                style={{ width: `${percent}%` }}
                onMouseEnter={(e) => showTooltip(e, stage, percent, i)}
                onMouseLeave={hideTooltip}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  showTooltip(e, stage, percent, i);
                }}
              />
            );
          })}
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
        {studyingCount} of {totalItems} items in progress
      </p>
    </div>
  );
}
