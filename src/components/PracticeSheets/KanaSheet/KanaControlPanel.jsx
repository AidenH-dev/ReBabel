import {
  HIRAGANA_ROWS,
  KATAKANA_ROWS,
  PRESETS,
} from '@/lib/practiceSheets/kanaData';
import GuideStyleSelector from '@/components/PracticeSheets/shared/GuideStyleSelector';
import SheetActions from '@/components/PracticeSheets/shared/SheetActions';

export default function KanaControlPanel({
  characterType,
  selectedRowIds,
  onSelectedRowIdsChange,
  practiceRows,
  onPracticeRowsChange,
  noBackgroundColor,
  onNoBackgroundColorChange,
  showGuides,
  guideStyle,
  onShowGuidesChange,
  onGuideStyleChange,
  downloading,
  onDownload,
  onReset,
}) {
  const kanaRows = characterType === 'katakana' ? KATAKANA_ROWS : HIRAGANA_ROWS;

  return (
    <div className="mt-3 space-y-3">
      {/* Presets */}
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Presets
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([key, preset]) => {
            const isActive =
              preset.rowIds.length === selectedRowIds.size &&
              preset.rowIds.every((id) => selectedRowIds.has(id));
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectedRowIdsChange(new Set(preset.rowIds))}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? 'bg-brand-pink text-white'
                    : 'bg-black/[0.04] text-black/60 hover:text-black dark:bg-white/[0.06] dark:text-white/60 dark:hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row checkboxes */}
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Rows
        </p>
        <div className="space-y-1.5">
          {kanaRows.map((row) => (
            <label
              key={row.id}
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <input
                type="checkbox"
                checked={selectedRowIds.has(row.id)}
                onChange={(e) => {
                  const next = new Set(selectedRowIds);
                  if (e.target.checked) {
                    next.add(row.id);
                  } else {
                    next.delete(row.id);
                  }
                  onSelectedRowIdsChange(next);
                }}
                className="h-4 w-4 rounded border-gray-300 text-brand-pink focus:ring-brand-pink dark:border-gray-600"
              />
              <span className="font-medium">{row.chars[0]}</span>
              <span className="text-gray-400 dark:text-gray-500">
                {row.chars.join(' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-700 dark:bg-surface-deep">
        <label className="block">
          <span className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
            Rows per character{' '}
            <span className="text-xs tabular-nums text-gray-400">
              {practiceRows}
            </span>
          </span>
          <input
            type="range"
            min="1"
            max="6"
            value={practiceRows}
            onChange={(e) => onPracticeRowsChange(Number(e.target.value))}
            className="w-full"
          />
        </label>

        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={noBackgroundColor}
              onChange={(e) => onNoBackgroundColorChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-pink focus:ring-brand-pink dark:border-gray-600"
            />
            No background color
          </label>

          <GuideStyleSelector
            showGuides={showGuides}
            guideStyle={guideStyle}
            onShowGuidesChange={onShowGuidesChange}
            onGuideStyleChange={onGuideStyleChange}
          />
        </div>
      </div>

      <SheetActions
        downloading={downloading}
        onDownload={onDownload}
        onReset={onReset}
      />
    </div>
  );
}
