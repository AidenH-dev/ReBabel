const STAGES = [
  { label: 'Not Started', color: 'bg-gray-400', textColor: 'text-gray-400' },
  { label: 'Fresh', color: 'bg-blue-500', textColor: 'text-blue-500' },
  { label: 'Practiced', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
  { label: 'Intermediate', color: 'bg-red-500', textColor: 'text-red-500' },
  { label: 'Expert', color: 'bg-green-500', textColor: 'text-green-500' },
  { label: 'Mastered', color: 'bg-purple-500', textColor: 'text-purple-500' },
];

export default function SrsProgressPipeline({ stages }) {
  return (
    <div className="relative w-full">
      {/* Connector line running behind circles, vertically centered on circles */}
      <div className="absolute left-0 right-0 top-[7px] sm:top-[9px] mx-3 sm:mx-4">
        <div className="h-[10px] rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Circles row */}
      <div className="relative flex items-start justify-between">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex flex-col items-center z-10">
            <div
              className={`${STAGES[i]?.color || 'bg-gray-400'} w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-medium ring-2 ring-white dark:ring-surface-page`}
            >
              {stage.count}
            </div>
            <span
              className={`text-[9px] sm:text-[11px] ${STAGES[i]?.textColor || 'text-gray-400'} mt-1 text-center leading-tight whitespace-nowrap font-medium`}
            >
              {stage.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
