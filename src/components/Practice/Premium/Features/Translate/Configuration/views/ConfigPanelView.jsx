// Configuration Panel View
// Pure presentational component for unified focus configuration

import { FaTimes, FaPlay, FaPlus, FaRandom } from "react-icons/fa";
import TagInputView from "./TagInputView";
import Select from "react-select";

export default function ConfigPanelView({
  grammarPool,
  vocabPool,
  grammarFocalPoints,
  vocabFocalPoints,
  poolItems,
  canStart,
  validationMessage,
  onOpenAddModal,
  onRemoveSet,
  onRemoveItem,
  onAddFocalPoint,
  onRemoveFocalPoint,
  onShuffle,
  onClearAll,
  onStartPractice,
  availableSets = [],
  onSelectSet
}) {
  // Prepare options for react-select
  const vocabSetOptions = (availableSets || [])
    .filter(set => set.set_type === 'vocab' && !vocabPool.sets.some(s => s.id === set.id))
    .map(set => ({
      value: set.id,
      label: `${set.name} (${set.item_num} items)`
    }));

  const grammarSetOptions = (availableSets || [])
    .filter(set => set.set_type === 'grammar' && !grammarPool.sets.some(s => s.id === set.id))
    .map(set => ({
      value: set.id,
      label: `${set.name} (${set.item_num} items)`
    }));

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "transparent",
      color: "#000",
      minHeight: 32,
      height: 32,
      borderColor: state.isFocused ? "#e30a5f" : "rgba(0,0,0,0.1)",
      boxShadow: state.isFocused ? "0 0 0 1px #e30a5f" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#e30a5f" : "rgba(0,0,0,0.1)",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 8px",
    }),
    input: (base) => ({ ...base, margin: 0, padding: 0 }),
    indicatorsContainer: (base) => ({
      ...base,
      height: 32,
    }),
    singleValue: (base) => ({ ...base, color: "#000" }),
    menu: (base) => ({ ...base, backgroundColor: "#fff", zIndex: 50 }),
    option: (base, state) => ({
      ...base,
      fontSize: "0.875rem",
      backgroundColor: state.isFocused ? "#f0f0f0" : "#fff",
      color: "#000",
    }),
    placeholder: (base) => ({ ...base, color: "#999", fontSize: "0.875rem" }),
  };

  const customSelectStylesDark = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "transparent",
      color: "#fff",
      minHeight: 32,
      height: 32,
      borderColor: state.isFocused ? "#e30a5f" : "rgba(255,255,255,0.1)",
      boxShadow: state.isFocused ? "0 0 0 1px #e30a5f" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#e30a5f" : "rgba(255,255,255,0.1)",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 8px",
    }),
    input: (base) => ({ ...base, margin: 0, padding: 0, color: "#fff" }),
    indicatorsContainer: (base) => ({
      ...base,
      height: 32,
    }),
    singleValue: (base) => ({ ...base, color: "#fff" }),
    menu: (base) => ({ ...base, backgroundColor: "#1c2b35", zIndex: 50 }),
    option: (base, state) => ({
      ...base,
      fontSize: "0.875rem",
      backgroundColor: state.isFocused ? "#22333e" : "#1c2b35",
      color: "#fff",
    }),
    placeholder: (base) => ({ ...base, color: "#999", fontSize: "0.875rem" }),
  };

  return (
    <div className="sticky top-0 z-10"> {/** bg-white dark:bg-[#1c2b35] border border-black/5 dark:border-white/5 rounded-xl p-4 mb-4 shadow-sm */}
      {/* Pool Headers */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col gap-2 bg-white dark:bg-[#22333e] border border-black/5 dark:border-white/5 rounded-xl p-4 inset-shadow-xs dark:inset-shadow-[#1c2b35]">
          <div className="flex items-center justify-between">
            <span className="font-medium text-black dark:text-white">Vocabulary</span>

          </div>
          <div className="flex gap-2">
            <Select
              options={vocabSetOptions}
              onChange={(option) => option && onSelectSet(option.value, 'vocabulary')}
              placeholder="Select a set to add..."
              isClearable
              isSearchable
              maxMenuHeight={400}
              className="block dark:hidden w-full"
              styles={customSelectStyles}
              value={null}
            />
            <Select
              options={vocabSetOptions}
              onChange={(option) => option && onSelectSet(option.value, 'vocabulary')}
              placeholder="Select a set to add..."
              isClearable
              isSearchable
              maxMenuHeight={400}
              className="hidden dark:block w-full"
              styles={customSelectStylesDark}
              value={null}
            />
            <button
              onClick={() => onOpenAddModal('vocabulary')}
              className="h-min text-[#e30a5f] inline-flex items-center p-1 rounded text-sm font-medium border border-[#e30a5f] hover:bg-[#e30a5f]/10 transition-colors"
            >
              Custom
              <FaPlus className="ml-1 text-[#e30a5f]" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Vocab Sets */}
            {vocabPool.sets.map(set => (
              <div
                key={set.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              >
                <span>{set.name}</span>
                <button onClick={() => onRemoveSet(set.id, 'vocabulary')} className="hover:opacity-70">
                  <FaTimes className="text-xs" />
                </button>
              </div>
            ))}

            {/* Vocab Items */}
            {vocabPool.items.map(item => (
              <div
                key={item.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-blue-200 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700"
              >
                <span>{item.english || item.kana || 'Item'}</span>
                <button onClick={() => onRemoveItem(item.id, 'vocabulary')} className="hover:opacity-70">
                  <FaTimes className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 bg-white dark:bg-[#22333e] border border-black/5 dark:border-white/5 rounded-xl p-4 inset-shadow-xs dark:inset-shadow-[#1c2b35]">
          <div className="flex items-center justify-between">
            <span className="font-medium text-black dark:text-white">Grammar</span>

          </div>
          <div className="flex gap-2">
            <Select
              options={grammarSetOptions}
              onChange={(option) => option && onSelectSet(option.value, 'grammar')}
              placeholder="Select a set to add..."
              isClearable
              isSearchable
              maxMenuHeight={400}
              className="block dark:hidden w-full"
              styles={customSelectStyles}
              value={null}
            />
            <Select
              options={grammarSetOptions}
              onChange={(option) => option && onSelectSet(option.value, 'grammar')}
              placeholder="Select a set to add..."
              isClearable
              isSearchable
              maxMenuHeight={400}
              className="hidden dark:block w-full"
              styles={customSelectStylesDark}
              value={null}
            />
            <button
              onClick={() => onOpenAddModal('grammar')}
              className="h-min text-[#e30a5f] inline-flex items-center p-1 rounded text-sm font-medium border border-[#e30a5f] hover:bg-[#e30a5f]/10 transition-colors"
            >
              Custom
              <FaPlus className="ml-1 text-[#e30a5f]" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">

            {/* Grammar Sets */}
            {grammarPool.sets.map(set => (
              <div
                key={set.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              >
                <span>{set.name}</span>
                <button onClick={() => onRemoveSet(set.id, 'grammar')} className="hover:opacity-70">
                  <FaTimes className="text-xs" />
                </button>
              </div>
            ))}

            {/* Grammar Items */}
            {grammarPool.items.map(item => (
              <div
                key={item.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-green-200 dark:bg-green-800/30 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700"
              >
                <span>{item.title || 'Item'}</span>
                <button onClick={() => onRemoveItem(item.id, 'grammar')} className="hover:opacity-70">
                  <FaTimes className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Focus Configuration Summary */}
      <div className="mb-3 p-3 bg-gray-100 dark:bg-[#0f1a1f] rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase text-black/60 dark:text-white/60">Focus Configuration</h4>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <TagInputView
            label="Vocabulary"
            placeholder="Add vocabulary focal points..."
            poolItems={poolItems.vocab}
            selectedTags={vocabFocalPoints}
            onAddTag={(item) => onAddFocalPoint(item, 'vocabulary')}
            onRemoveTag={(itemId) => onRemoveFocalPoint(itemId, 'vocabulary')}
            maxTags={10}
            category="vocabulary"
          />

          <TagInputView
            label="Grammar"
            placeholder="Add grammar focal points..."
            poolItems={poolItems.grammar}
            selectedTags={grammarFocalPoints}
            onAddTag={(item) => onAddFocalPoint(item, 'grammar')}
            onRemoveTag={(itemId) => onRemoveFocalPoint(itemId, 'grammar')}
            maxTags={2}
            category="grammar"
          />
        </div>

        <div className="flex gap-2 text-xs justify-between items-center">
          <div className="flex gap-3">
            <div>
              <span className="text-black/60 dark:text-white/60">Total Grammar: </span>
              <span className="font-medium">{poolItems.grammar.length} items</span>
            </div>
            <div>
              <span className="text-black/60 dark:text-white/60">Total Vocabulary: </span>
              <span className="font-medium">{poolItems.vocab.length} items</span>
            </div>
          </div>

          {/* Validation & Actions */}
          <div className="flex items-center gap-2">
            {validationMessage && (
              <p className="text-xs text-orange-600 dark:text-orange-400">{validationMessage}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={onShuffle}
                disabled={poolItems.grammar.length === 0 && poolItems.vocab.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaRandom className="text-xs" />
              </button>
              <button
                onClick={onClearAll}
                className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Clear All
              </button>
              <button
                onClick={onStartPractice}
                disabled={!canStart}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#e30a5f] text-white rounded-lg hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPlay /> Start Practice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
