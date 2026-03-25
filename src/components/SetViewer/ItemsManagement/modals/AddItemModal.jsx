import { FiPlus } from 'react-icons/fi';
import BaseModal from '@/components/ui/BaseModal';
import ExampleSentenceList from '@/components/ui/ExampleSentenceList';

export default function AddItemModal({
  isOpen,
  addItemType,
  set_type,
  vocabForm,
  grammarForm,
  grammarTitleInputType,
  isAdding,
  error,
  success,
  onTypeChange,
  onVocabFormChange,
  onGrammarFormChange,
  onGrammarTitleTypeSwitch,
  onSubmit,
  onClose,
}) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      maxHeight="85vh"
      scrollable
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isAdding}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              const form = document.getElementById('add-item-form');
              if (form) form.requestSubmit();
            }}
            disabled={isAdding}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-pink hover:bg-[#c00950] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAdding ? (
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
                Adding...
              </>
            ) : (
              <>
                <FiPlus className="w-4 h-4" /> Add to Set
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3 flex-shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
              Add New Item
            </h2>
            <div className="flex bg-gray-100 dark:bg-surface-deep rounded-md p-0.5">
              {(!set_type || set_type === 'vocab') && (
                <button
                  onClick={() => onTypeChange('vocabulary')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    addItemType === 'vocabulary'
                      ? 'bg-brand-pink text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Vocabulary
                </button>
              )}
              {(!set_type || set_type === 'grammar') && (
                <button
                  onClick={() => onTypeChange('grammar')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    addItemType === 'grammar'
                      ? 'bg-brand-pink text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Grammar
                </button>
              )}
            </div>
          </div>
          {set_type && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">
              {set_type === 'vocab' &&
                'This set contains only vocabulary items'}
              {set_type === 'grammar' && 'This set contains only grammar items'}
            </p>
          )}
        </div>
      </div>

      {(success || error) && (
        <div className="px-6 pt-4 flex-shrink-0">
          {success && (
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
              Item added successfully! Refreshing...
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      )}

      <form id="add-item-form" onSubmit={onSubmit} className="px-6 py-4">
        <div className="space-y-4">
          {addItemType === 'vocabulary' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    English
                  </label>
                  <input
                    type="text"
                    value={vocabForm.english}
                    onChange={(e) =>
                      onVocabFormChange('english', e.target.value)
                    }
                    placeholder="English term"
                    className="w-full bg-surface-deep text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-pink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kana{' '}
                    <span className="text-gray-500 dark:text-gray-400">
                      (type in romaji)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={vocabForm.kana}
                    onChange={(e) => onVocabFormChange('kana', e.target.value)}
                    placeholder="ka → か, shi → し"
                    className="w-full bg-surface-deep text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-pink font-japanese"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kanji{' '}
                    <span className="text-gray-500 dark:text-gray-400">
                      (paste)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={vocabForm.kanji}
                    onChange={(e) => onVocabFormChange('kanji', e.target.value)}
                    placeholder="漢字"
                    className="w-full bg-surface-deep text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-pink font-japanese"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Example Sentences
                </label>
                <ExampleSentenceList
                  sentences={vocabForm.example_sentences}
                  onChange={(arr) =>
                    onVocabFormChange('example_sentences', arr)
                  }
                  compact
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags <span className="text-gray-500">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={vocabForm.tags}
                  onChange={(e) => onVocabFormChange('tags', e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="w-full bg-surface-deep text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-pink"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                    <span>Title *</span>
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        onClick={() => onGrammarTitleTypeSwitch('english')}
                        className={`px-1 py-0.5 text-[10px] rounded transition-colors ${
                          grammarTitleInputType === 'english'
                            ? 'bg-brand-pink text-white'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                        }`}
                      >
                        En
                      </button>
                      <button
                        type="button"
                        onClick={() => onGrammarTitleTypeSwitch('kana')}
                        className={`px-1 py-0.5 text-[10px] rounded transition-colors ${
                          grammarTitleInputType === 'kana'
                            ? 'bg-brand-pink text-white'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                        }`}
                      >
                        あ
                      </button>
                    </div>
                  </label>
                  <input
                    type="text"
                    value={grammarForm.title}
                    onChange={(e) =>
                      onGrammarFormChange('title', e.target.value)
                    }
                    placeholder={
                      grammarTitleInputType === 'kana'
                        ? 'Type in romaji'
                        : 'Grammar pattern name'
                    }
                    className={`w-full bg-surface-deep text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-pink ${
                      grammarTitleInputType === 'kana' ? 'font-japanese' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={grammarForm.topic}
                    onChange={(e) =>
                      onGrammarFormChange('topic', e.target.value)
                    }
                    placeholder="e.g., N5, JLPT"
                    className="w-full bg-surface-deep text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-pink"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={grammarForm.description}
                  onChange={(e) =>
                    onGrammarFormChange('description', e.target.value)
                  }
                  placeholder="Brief explanation"
                  className="w-full bg-surface-deep text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-pink resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={grammarForm.notes}
                  onChange={(e) => onGrammarFormChange('notes', e.target.value)}
                  placeholder="Additional notes"
                  className="w-full bg-surface-deep text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-pink"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Example Sentences
                </label>
                <ExampleSentenceList
                  sentences={grammarForm.example_sentences}
                  onChange={(arr) =>
                    onGrammarFormChange('example_sentences', arr)
                  }
                  compact
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags <span className="text-gray-500">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={grammarForm.tags}
                  onChange={(e) => onGrammarFormChange('tags', e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="w-full bg-surface-deep text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-pink"
                />
              </div>
            </>
          )}
        </div>
      </form>
    </BaseModal>
  );
}
