import { TbLoader } from 'react-icons/tb';
import CustomSelect from '@/components/ui/CustomSelect';
import BaseModal from '@/components/ui/BaseModal';
import ExampleSentenceList from '@/components/ui/ExampleSentenceList';

export default function EditItemModal({
  isOpen,
  editingItem,
  editFormData,
  onFieldChange,
  onSave,
  onShowDeleteConfirm,
  onClose,
  isSaving,
  isDeleting,
  saveError,
  saveSuccess,
  deleteError,
}) {
  if (!editingItem) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      maxHeight="85vh"
      scrollable
      title={
        editingItem
          ? `Edit ${editingItem.type === 'vocabulary' ? 'Vocabulary' : 'Grammar'} Item`
          : ''
      }
      subtitle={
        editingItem ? (
          <span className="font-mono">ID: {editingItem.id}</span>
        ) : (
          ''
        )
      }
      footer={
        <div className="flex items-center justify-between">
          <button
            onClick={onShowDeleteConfirm}
            disabled={isSaving || isDeleting}
            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Remove from Set
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving || isDeleting}
              className="pl-3 pr-4 py-2 text-sm font-medium text-white bg-brand-pink hover:bg-[#c00950] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <TbLoader
                    className="w-5 h-5 animate-spin"
                    strokeWidth={2.5}
                  />
                  Saving
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      }
    >
      {(saveSuccess || saveError || deleteError) && (
        <div className="px-6 pt-4 flex-shrink-0">
          {saveSuccess && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 text-sm flex items-center gap-2">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Changes saved successfully!
            </div>
          )}
          {saveError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
              <strong>Error:</strong> {saveError}
            </div>
          )}
          {deleteError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
              <strong>Delete Error:</strong> {deleteError}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-4">
          {editingItem.type === 'vocabulary' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  English
                </label>
                <input
                  type="text"
                  value={editFormData.english || ''}
                  onChange={(e) => onFieldChange('english', e.target.value)}
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
                    value={editFormData.kana || ''}
                    onChange={(e) => onFieldChange('kana', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-japanese focus:outline-none focus:ring-2 focus:ring-brand-pink"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kanji
                  </label>
                  <input
                    type="text"
                    value={editFormData.kanji || ''}
                    onChange={(e) => onFieldChange('kanji', e.target.value)}
                    className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-japanese focus:outline-none focus:ring-2 focus:ring-brand-pink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lexical Category
                </label>
                <CustomSelect
                  value={editFormData.lexical_category || ''}
                  onChange={(val) => onFieldChange('lexical_category', val)}
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
          )}

          {editingItem.type === 'grammar' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editFormData.title || ''}
                  onChange={(e) => onFieldChange('title', e.target.value)}
                  className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => onFieldChange('description', e.target.value)}
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
                  value={editFormData.topic || ''}
                  onChange={(e) => onFieldChange('topic', e.target.value)}
                  className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={editFormData.notes || ''}
                  onChange={(e) => onFieldChange('notes', e.target.value)}
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
                Array.isArray(editFormData.example_sentences)
                  ? editFormData.example_sentences
                  : []
              }
              onChange={(arr) => onFieldChange('example_sentences', arr)}
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
                Array.isArray(editFormData.tags)
                  ? editFormData.tags.join(', ')
                  : ''
              }
              onChange={(e) =>
                onFieldChange(
                  'tags',
                  e.target.value
                    .split(',')
                    .map((t) => t.trim())
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
