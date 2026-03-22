import { useState } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';
import { TbLoader3 } from 'react-icons/tb';

const CATEGORY_OPTIONS = [
  { value: 'verb', label: 'Verb' },
  { value: 'i-adjective', label: 'I-Adjective' },
  { value: 'na-adjective', label: 'Na-Adjective' },
  { value: 'noun', label: 'Noun' },
  { value: 'adverb', label: 'Adverb' },
];

const VERB_GROUP_OPTIONS = [
  { value: 'godan', label: 'Godan (Group 1)' },
  { value: 'ichidan', label: 'Ichidan (Group 2)' },
  { value: 'irregular', label: 'Irregular (する/くる)' },
];

export default function ConjugationEditModal({
  question,
  skipMode,
  onSave,
  onSkipConfirm,
  onClose,
}) {
  const [category, setCategory] = useState(
    question?.word?.lexical_category || ''
  );
  const [verbGroup, setVerbGroup] = useState(question?.word?.verb_group || '');
  const [kanji, setKanji] = useState(question?.word?.kanji || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  // Skip mode: 'remove' clears category, 'recategorize' lets user pick
  const [skipChoice, setSkipChoice] = useState('remove');

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        lexical_category: category,
        verb_group: category === 'verb' ? verbGroup : null,
        kanji: kanji || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipConfirm = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (skipChoice === 'remove') {
        await onSave({ lexical_category: '' });
      } else {
        if (!category) return;
        await onSave({ lexical_category: category });
      }
      onSkipConfirm();
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  if (!question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface-card rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/10">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {skipMode ? 'Not a Valid Card' : 'Edit Word Label'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
              {question.word.kana}
              {question.word.kanji ? ` (${question.word.kanji})` : ''}
              {' -- '}
              {question.word.english}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          {skipMode ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                This card will be removed from the current session. What should
                happen to its category?
              </p>

              {/* Option 1: Remove category */}
              <button
                onClick={() => setSkipChoice('remove')}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  skipChoice === 'remove'
                    ? 'border-brand-pink bg-brand-pink/5 dark:bg-brand-pink/10'
                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Remove category
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Clears the label so it can be re-auto-categorized later
                </div>
              </button>

              {/* Option 2: Recategorize */}
              <button
                onClick={() => setSkipChoice('recategorize')}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  skipChoice === 'recategorize'
                    ? 'border-brand-pink bg-brand-pink/5 dark:bg-brand-pink/10'
                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Change category
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Set the correct category for this word
                </div>
              </button>

              {/* Category selector -- only when recategorize is chosen */}
              {skipChoice === 'recategorize' && (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink"
                >
                  <option value="">-- Select category --</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value !== 'verb') setVerbGroup('');
                  }}
                  className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink"
                >
                  <option value="">-- Select --</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {category === 'verb' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Verb Group
                  </label>
                  <select
                    value={verbGroup}
                    onChange={(e) => setVerbGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink"
                  >
                    <option value="">-- Select --</option>
                    {VERB_GROUP_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kanji
                </label>
                <input
                  type="text"
                  value={kanji}
                  onChange={(e) => setKanji(e.target.value)}
                  placeholder="Add kanji for better categorization"
                  className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white font-japanese focus:outline-none focus:ring-2 focus:ring-brand-pink"
                />
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Correct the word&apos;s category and verb group so conjugation
                questions generate accurately. Adding kanji improves
                auto-categorization for future sessions.
              </p>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          {skipMode ? (
            <button
              onClick={handleSkipConfirm}
              disabled={
                isSaving || (skipChoice === 'recategorize' && !category)
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-pink hover:bg-[#c00950] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving && <TbLoader3 className="w-4 h-4 animate-spin" />}
              {skipChoice === 'remove' ? 'Remove and skip' : 'Save and skip'}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaving || !category}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-pink hover:bg-[#c00950] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <TbLoader3 className="w-4 h-4 animate-spin" />
              ) : (
                <FaSave size={12} />
              )}
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
