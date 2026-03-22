// Manual Entry Modal View
// Pure presentational component for manually adding temporary vocab/grammar items

import { useState } from 'react';
import BaseModal from '@/components/ui/BaseModal';

export default function ManualEntryModalView({
  isOpen,
  missingType, // 'grammar' | 'vocabulary'
  onClose,
  onConfirm,
}) {
  const [entries, setEntries] = useState('');

  const handleConfirm = () => {
    // Parse entries (one per line)
    const items = entries
      .split('\n')
      .filter((line) => line.trim())
      .map((line, idx) => {
        if (missingType === 'grammar') {
          return {
            id: `temp-grammar-${idx}`,
            type: 'grammar',
            title: line.trim(),
            description: line.trim(),
          };
        } else {
          // Parse format: "english, kana, kanji" or "english, kana"
          const parts = line.split(',').map((p) => p.trim());
          return {
            id: `temp-vocab-${idx}`,
            type: 'vocabulary',
            english: parts[0] || '',
            kana: parts[1] || '',
            kanji: parts[2] || '',
          };
        }
      });
    onConfirm(items);
    setEntries(''); // Clear after confirm
  };

  const handleClose = () => {
    setEntries(''); // Clear on cancel
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      blur={false}
      title={`Add Temporary ${missingType === 'grammar' ? 'Grammar' : 'Vocabulary'}`}
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-3 py-2 text-sm rounded-lg border border-border-default hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!entries.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-brand-pink text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Items
          </button>
        </div>
      }
    >
      <div className="p-4">
        <p className="text-sm text-black/60 dark:text-white/60 mb-3">
          {missingType === 'grammar'
            ? 'Enter grammar patterns (one per line)'
            : 'Enter vocabulary in format: english, kana, kanji (one per line)'}
        </p>
        <textarea
          value={entries}
          onChange={(e) => setEntries(e.target.value)}
          placeholder={
            missingType === 'grammar'
              ? 'です\nました\nている'
              : 'hello, こんにちは, 今日は\nthank you, ありがとう, 有難う'
          }
          className="w-full h-48 p-3 bg-surface-deep rounded-lg border border-border-default text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink"
        />
      </div>
    </BaseModal>
  );
}
