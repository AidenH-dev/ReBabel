import { useEffect, useMemo, useState } from 'react';
import CustomSelect from '@/components/ui/CustomSelect';
import BaseModal from '@/components/ui/BaseModal';
import ExampleSentenceList from '@/components/ui/ExampleSentenceList';

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

  if (!formData) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const footerContent = (
    <div className="flex items-center justify-end gap-3 w-full">
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
        className="px-4 py-2 text-sm font-medium text-white bg-brand-pink hover:bg-[#c00950] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={`Edit ${isVocabulary ? 'Vocabulary' : 'Grammar'} Item`}
      subtitle={`ID: ${formData.uuid}`}
      blur
      scrollable
      maxHeight="85vh"
      footer={footerContent}
    >
      {error && (
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      <div className="px-6 py-4">
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
                  className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink"
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
                    className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-japanese focus:outline-none focus:ring-2 focus:ring-brand-pink"
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
                    className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-japanese focus:outline-none focus:ring-2 focus:ring-brand-pink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lexical Category
                </label>
                <CustomSelect
                  value={formData.lexical_category || ''}
                  onChange={(val) => handleChange('lexical_category', val)}
                  options={[
                    { value: '', label: 'Uncategorized' },
                    { value: 'noun', label: 'Noun' },
                    { value: 'verb', label: 'Verb' },
                    { value: 'i-adjective', label: 'I-Adjective' },
                    { value: 'na-adjective', label: 'Na-Adjective' },
                    { value: 'adverb', label: 'Adverb' },
                    { value: 'particle', label: 'Particle' },
                    { value: 'counter', label: 'Counter' },
                    { value: 'conjunction', label: 'Conjunction' },
                    { value: 'pronoun', label: 'Pronoun' },
                    { value: 'expression', label: 'Expression' },
                    { value: 'interjection', label: 'Interjection' },
                  ]}
                />
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
                  className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink resize-none"
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
                  className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink"
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
                  className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink resize-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Example Sentences
            </label>
            <ExampleSentenceList
              sentences={
                Array.isArray(formData.example_sentences)
                  ? formData.example_sentences
                  : []
              }
              onChange={(arr) => handleChange('example_sentences', arr)}
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
              className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink"
              placeholder="tag1, tag2, tag3"
            />
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
