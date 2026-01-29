// Manual Entry Modal View
// Pure presentational component for manually adding temporary vocab/grammar items

import { FaTimes } from "react-icons/fa";
import { useState } from "react";

export default function ManualEntryModalView({
  isOpen,
  missingType, // 'grammar' | 'vocabulary'
  onClose,
  onConfirm
}) {
  const [entries, setEntries] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    // Parse entries (one per line)
    const items = entries.split('\n').filter(line => line.trim()).map((line, idx) => {
      if (missingType === 'grammar') {
        return {
          id: `temp-grammar-${idx}`,
          type: 'grammar',
          title: line.trim(),
          description: line.trim()
        };
      } else {
        // Parse format: "english, kana, kanji" or "english, kana"
        const parts = line.split(',').map(p => p.trim());
        return {
          id: `temp-vocab-${idx}`,
          type: 'vocabulary',
          english: parts[0] || '',
          kana: parts[1] || '',
          kanji: parts[2] || ''
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
          <h2 className="text-lg font-semibold text-black dark:text-white">
            Add Temporary {missingType === 'grammar' ? 'Grammar' : 'Vocabulary'}
          </h2>
          <button onClick={handleClose} className="text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white">
            <FaTimes />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-black/60 dark:text-white/60 mb-3">
            {missingType === 'grammar'
              ? 'Enter grammar patterns (one per line)'
              : 'Enter vocabulary in format: english, kana, kanji (one per line)'}
          </p>
          <textarea
            value={entries}
            onChange={(e) => setEntries(e.target.value)}
            placeholder={missingType === 'grammar'
              ? 'です\nました\nている'
              : 'hello, こんにちは, 今日は\nthank you, ありがとう, 有難う'}
            className="w-full h-48 p-3 bg-gray-50 dark:bg-[#0f1a1f] rounded-lg border border-black/10 dark:border-white/10 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
          />
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-black/5 dark:border-white/5">
          <button
            onClick={handleClose}
            className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!entries.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-[#e30a5f] text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Items
          </button>
        </div>
      </div>
    </div>
  );
}
