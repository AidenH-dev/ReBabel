export default function ModelRowToggle({ includeTraceRow, onChange }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Model row
      </p>
      <div className="grid grid-cols-2 rounded-lg bg-black/[0.04] p-1 dark:bg-white/[0.06]">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`rounded-md px-3 py-2 text-xs font-medium transition ${
            includeTraceRow
              ? 'bg-white text-brand-pink shadow-sm dark:bg-surface-deep'
              : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'
          }`}
        >
          Show
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`rounded-md px-3 py-2 text-xs font-medium transition ${
            !includeTraceRow
              ? 'bg-white text-brand-pink shadow-sm dark:bg-surface-deep'
              : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'
          }`}
        >
          Hide
        </button>
      </div>
    </div>
  );
}
