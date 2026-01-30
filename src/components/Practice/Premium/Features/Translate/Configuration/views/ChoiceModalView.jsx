// Choice Modal View
// Presents three options: Add Set, Add Items, or Manual Entry

import { FaTimes, FaLayerGroup, FaListUl, FaKeyboard } from "react-icons/fa";

export default function ChoiceModalView({
  isOpen,
  category,
  onChooseSet,
  onChooseItems,
  onChooseManual,
  onClose
}) {
  if (!isOpen) return null;

  const categoryLabel = category === 'grammar' ? 'Grammar' : 'Vocabulary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
          <h2 className="text-lg font-semibold text-black dark:text-white">
            Add {categoryLabel}
          </h2>
          <button onClick={onClose} className="text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white">
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-sm text-black/60 dark:text-white/60 mb-4">
            Choose how you want to add {categoryLabel.toLowerCase()} to your practice pool:
          </p>

          <button
            onClick={onChooseSet}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#e30a5f]/10 flex items-center justify-center">
              <FaLayerGroup className="text-[#e30a5f]" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-black dark:text-white">Add Entire Set</div>
              <div className="text-xs text-black/60 dark:text-white/60">
                Select complete {categoryLabel.toLowerCase()} sets from your library
              </div>
            </div>
          </button>

          <button
            onClick={onChooseItems}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#e30a5f]/10 flex items-center justify-center">
              <FaListUl className="text-[#e30a5f]" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-black dark:text-white">Add Individual Items</div>
              <div className="text-xs text-black/60 dark:text-white/60">
                Search and select specific {categoryLabel.toLowerCase()} items from any set
              </div>
            </div>
          </button>

          <button
            onClick={onChooseManual}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#e30a5f]/10 flex items-center justify-center">
              <FaKeyboard className="text-[#e30a5f]" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-black dark:text-white">Manual Entry</div>
              <div className="text-xs text-black/60 dark:text-white/60">
                Type in temporary {categoryLabel.toLowerCase()} items for this session
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
