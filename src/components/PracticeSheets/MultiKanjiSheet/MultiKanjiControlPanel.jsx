import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import GuideStyleSelector from '@/components/PracticeSheets/shared/GuideStyleSelector';
import SheetActions from '@/components/PracticeSheets/shared/SheetActions';

export default function MultiKanjiControlPanel({
  kanjiList,
  onKanjiListChange,
  layoutMode,
  onLayoutModeChange,
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
  const [draft, setDraft] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const chars = draft.trim().split('').filter(Boolean);
      if (chars.length === 0) return;
      const newItems = chars.map((ch) => ({
        kanji: ch,
        meaning: '',
        onyomi: '',
        kunyomi: '',
      }));
      onKanjiListChange([...kanjiList, ...newItems]);
      setDraft('');
    }
  };

  const removeKanji = (index) => {
    onKanjiListChange(kanjiList.filter((_, i) => i !== index));
  };

  const updateKanjiField = (index, field, value) => {
    onKanjiListChange(
      kanjiList.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <div className="mt-3 space-y-3">
      {/* Kanji input */}
      <div>
        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Kanji
        </span>
        <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition focus-within:border-brand-pink focus-within:bg-white focus-within:ring-1 focus-within:ring-brand-pink/20 dark:border-gray-700 dark:bg-surface-deep dark:text-white dark:focus-within:bg-surface-card">
          {kanjiList.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {kanjiList.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => removeKanji(i)}
                  className="inline-flex items-center gap-1 rounded-full border border-brand-pink/25 bg-brand-pink/10 px-2.5 py-0.5 text-sm text-brand-pink transition hover:bg-brand-pink/20"
                >
                  {item.kanji}
                  <FaTimes className="text-[10px]" />
                </button>
              ))}
            </div>
          )}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type kanji and press Enter"
            className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
          />
        </div>
      </div>

      {/* Per-kanji readings — hidden in grid-only mode */}
      {layoutMode !== 'grid-only' && kanjiList.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Readings
          </p>
          {kanjiList.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-6 font-bold text-gray-900 dark:text-white">
                {item.kanji}
              </span>
              <input
                placeholder="meaning"
                value={item.meaning}
                onChange={(e) => updateKanjiField(i, 'meaning', e.target.value)}
                className="min-w-0 flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none dark:border-gray-700 dark:bg-surface-deep dark:text-white"
              />
              <input
                placeholder="on"
                value={item.onyomi}
                onChange={(e) => updateKanjiField(i, 'onyomi', e.target.value)}
                className="w-16 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none dark:border-gray-700 dark:bg-surface-deep dark:text-white"
              />
              <input
                placeholder="kun"
                value={item.kunyomi}
                onChange={(e) => updateKanjiField(i, 'kunyomi', e.target.value)}
                className="w-16 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none dark:border-gray-700 dark:bg-surface-deep dark:text-white"
              />
            </div>
          ))}
        </div>
      )}

      {/* Layout mode toggle */}
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Layout
        </p>
        <div className="grid grid-cols-3 rounded-lg bg-black/[0.04] p-1 dark:bg-white/[0.06]">
          {['compact', 'full', 'grid-only'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onLayoutModeChange(mode)}
              className={`rounded-md px-3 py-2 text-xs font-medium transition ${
                layoutMode === mode
                  ? 'bg-white text-brand-pink shadow-sm dark:bg-surface-deep'
                  : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'
              }`}
            >
              {mode === 'compact'
                ? 'Compact'
                : mode === 'full'
                  ? 'Full Page'
                  : 'Grid Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-700 dark:bg-surface-deep">
        <div className="space-y-3">
          {/* Practice rows slider */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Practice rows
              </p>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {practiceRows}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              value={practiceRows}
              onChange={(e) => onPracticeRowsChange(Number(e.target.value))}
              className="w-full accent-brand-pink"
            />
          </div>

          {/* Background color */}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={noBackgroundColor}
              onChange={(e) => onNoBackgroundColorChange(e.target.checked)}
              className="accent-brand-pink"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              White background (print-friendly)
            </span>
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
