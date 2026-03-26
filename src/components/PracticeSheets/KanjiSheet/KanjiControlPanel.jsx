import BubbleListField from '@/components/PracticeSheets/shared/BubbleListField';
import GridSizeControls from '@/components/PracticeSheets/shared/GridSizeControls';
import GuideStyleSelector from '@/components/PracticeSheets/shared/GuideStyleSelector';
import ModelRowToggle from '@/components/PracticeSheets/shared/ModelRowToggle';
import SheetActions from '@/components/PracticeSheets/shared/SheetActions';

export default function KanjiControlPanel({
  kanji,
  onKanjiChange,
  meaningList,
  onyomiList,
  kunyomiList,
  onAddMeaning,
  onChangeMeaning,
  onRemoveMeaning,
  onReorderMeaning,
  onAddOnyomi,
  onChangeOnyomi,
  onRemoveOnyomi,
  onReorderOnyomi,
  onAddKunyomi,
  onChangeKunyomi,
  onRemoveKunyomi,
  onReorderKunyomi,
  practiceColumns,
  practiceRows,
  onColumnsChange,
  onRowsChange,
  noBackgroundColor,
  onNoBackgroundColorChange,
  showGuides,
  guideStyle,
  onShowGuidesChange,
  onGuideStyleChange,
  includeTraceRow,
  onIncludeTraceRowChange,
  downloading,
  onDownload,
  onReset,
}) {
  return (
    <div className="mt-3 space-y-2">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Kanji
        </span>
        <input
          value={kanji}
          onChange={(e) => onKanjiChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-lg text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white dark:border-gray-700 dark:bg-surface-deep dark:text-white dark:focus:border-gray-500 dark:focus:bg-surface-card"
        />
      </label>

      <BubbleListField
        label="Meaning"
        items={meaningList}
        onAdd={onAddMeaning}
        onChange={onChangeMeaning}
        onRemove={onRemoveMeaning}
        onReorder={onReorderMeaning}
        placeholder="Add meaning"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <BubbleListField
          label="On'yomi"
          items={onyomiList}
          onAdd={onAddOnyomi}
          onChange={onChangeOnyomi}
          onRemove={onRemoveOnyomi}
          onReorder={onReorderOnyomi}
          placeholder="Add on'yomi"
        />
        <BubbleListField
          label="Kun'yomi"
          items={kunyomiList}
          onAdd={onAddKunyomi}
          onChange={onChangeKunyomi}
          onRemove={onRemoveKunyomi}
          onReorder={onReorderKunyomi}
          placeholder="Add kun'yomi"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-700 dark:bg-surface-deep">
        <GridSizeControls
          columns={practiceColumns}
          rows={practiceRows}
          noBackgroundColor={noBackgroundColor}
          onColumnsChange={onColumnsChange}
          onRowsChange={onRowsChange}
          onNoBackgroundColorChange={onNoBackgroundColorChange}
        />
        <div className="mt-3 space-y-3">
          <GuideStyleSelector
            showGuides={showGuides}
            guideStyle={guideStyle}
            onShowGuidesChange={onShowGuidesChange}
            onGuideStyleChange={onGuideStyleChange}
          />
          <ModelRowToggle
            includeTraceRow={includeTraceRow}
            onChange={onIncludeTraceRowChange}
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
