// Choice Modal View
// Presents three options: Add Set, Add Items, or Manual Entry

import { FaLayerGroup, FaListUl, FaKeyboard } from 'react-icons/fa';
import BaseModal from '@/components/ui/BaseModal';

export default function ChoiceModalView({
  isOpen,
  category,
  onChooseSet,
  onChooseItems,
  onChooseManual,
  onClose,
}) {
  const categoryLabel = category === 'grammar' ? 'Grammar' : 'Vocabulary';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      blur={false}
      title={`Add ${categoryLabel}`}
    >
      <div className="p-6 space-y-3">
        <p className="text-sm text-black/60 dark:text-white/60 mb-4">
          Choose how you want to add {categoryLabel.toLowerCase()} to your
          practice pool:
        </p>

        <button
          onClick={onChooseSet}
          className="w-full flex items-center gap-4 p-4 rounded-lg border border-border-default hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center">
            <FaLayerGroup className="text-brand-pink" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-black dark:text-white">
              Add Entire Set
            </div>
            <div className="text-xs text-black/60 dark:text-white/60">
              Select complete {categoryLabel.toLowerCase()} sets from your
              library
            </div>
          </div>
        </button>

        <button
          onClick={onChooseItems}
          className="w-full flex items-center gap-4 p-4 rounded-lg border border-border-default hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center">
            <FaListUl className="text-brand-pink" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-black dark:text-white">
              Add Individual Items
            </div>
            <div className="text-xs text-black/60 dark:text-white/60">
              Search and select specific {categoryLabel.toLowerCase()} items
              from any set
            </div>
          </div>
        </button>

        <button
          onClick={onChooseManual}
          className="w-full flex items-center gap-4 p-4 rounded-lg border border-border-default hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center">
            <FaKeyboard className="text-brand-pink" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-black dark:text-white">
              Manual Entry
            </div>
            <div className="text-xs text-black/60 dark:text-white/60">
              Type in temporary {categoryLabel.toLowerCase()} items for this
              session
            </div>
          </div>
        </button>
      </div>
    </BaseModal>
  );
}
