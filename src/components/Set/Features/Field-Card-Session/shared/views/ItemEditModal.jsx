import { useEffect, useMemo, useState } from 'react';

export default function ItemEditModal({
  item,
  isOpen,
  isSaving,
  error,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (isOpen && item) {
      setFormData({ ...item });
    }
  }, [isOpen, item]);

  const isVocabulary = useMemo(
    () => formData?.type === 'vocabulary',
    [formData]
  );

  if (!isOpen || !formData) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit {isVocabulary ? 'Vocabulary' : 'Grammar'} Item
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
              ID: {formData.uuid}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="px-6 pt-4 flex-shrink-0">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {isVocabulary ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    English
                  </label>
                  <input
                    type="text"
                    value={formData.english || ''}
                    onChange={(e) => handleChange('english', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kana
                    </label>
                    <input
                      type="text"
                      value={formData.kana || ''}
                      onChange={(e) => handleChange('kana', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-japanese focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kanji
                    </label>
                    <input
                      type="text"
                      value={formData.kanji || ''}
                      onChange={(e) => handleChange('kanji', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-japanese focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lexical Category
                  </label>
                  <select
                    value={formData.lexical_category || ''}
                    onChange={(e) =>
                      handleChange('lexical_category', e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                  >
                    <option value="">Uncategorized</option>
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="i-adjective">I-Adjective</option>
                    <option value="na-adjective">Na-Adjective</option>
                    <option value="adverb">Adverb</option>
                    <option value="particle">Particle</option>
                    <option value="counter">Counter</option>
                    <option value="conjunction">Conjunction</option>
                    <option value="pronoun">Pronoun</option>
                    <option value="expression">Expression</option>
                    <option value="interjection">Interjection</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) =>
                      handleChange('description', e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={formData.topic || ''}
                    onChange={(e) => handleChange('topic', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f] resize-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Example Sentences
                <span className="text-xs text-gray-500 ml-2">
                  (one per line)
                </span>
              </label>
              <textarea
                value={
                  Array.isArray(formData.example_sentences)
                    ? formData.example_sentences.join('\n')
                    : ''
                }
                onChange={(e) =>
                  handleChange(
                    'example_sentences',
                    e.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                  )
                }
                rows={4}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-japanese focus:outline-none focus:ring-2 focus:ring-[#e30a5f] resize-none"
                placeholder="Enter example sentences, one per line"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags
                <span className="text-xs text-gray-500 ml-2">
                  (comma-separated)
                </span>
              </label>
              <input
                type="text"
                value={
                  Array.isArray(formData.tags) ? formData.tags.join(', ') : ''
                }
                onChange={(e) =>
                  handleChange(
                    'tags',
                    e.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                  )
                }
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#e30a5f] hover:bg-[#c00950] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
