export default function GridSizeControls({
  columns,
  rows,
  noBackgroundColor,
  onColumnsChange,
  onRowsChange,
  onNoBackgroundColorChange,
  minCols = 4,
  maxCols = 14,
  minRows = 3,
  maxRows = 12,
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
            Columns{' '}
            <span className="text-xs tabular-nums text-gray-400">
              {columns}
            </span>
          </span>
          <input
            type="range"
            min={minCols}
            max={maxCols}
            value={columns}
            onChange={(e) => onColumnsChange(Number(e.target.value))}
            className="w-full"
          />
        </label>
        <label className="block">
          <span className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
            Rows{' '}
            <span className="text-xs tabular-nums text-gray-400">{rows}</span>
          </span>
          <input
            type="range"
            min={minRows}
            max={maxRows}
            value={rows}
            onChange={(e) => onRowsChange(Number(e.target.value))}
            className="w-full"
          />
        </label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={noBackgroundColor}
          onChange={(e) => onNoBackgroundColorChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-brand-pink focus:ring-brand-pink dark:border-gray-600"
        />
        No background color
      </label>
    </>
  );
}
