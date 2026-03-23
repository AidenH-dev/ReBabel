import { FiEdit2 } from 'react-icons/fi';
import BaseModal from '@/components/ui/BaseModal';

export default function ViewItemModal({ isOpen, item, onClose, onEdit }) {
  if (!item) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      maxHeight="85vh"
      scrollable
      title={
        item ? (item.type === 'vocabulary' ? item.english : item.title) : ''
      }
      subtitle={
        item ? (item.type === 'vocabulary' ? 'Vocabulary' : 'Grammar') : ''
      }
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              if (item) {
                onEdit(item.id, item.type);
                onClose();
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-pink hover:bg-[#c00950] rounded-lg transition-colors flex items-center gap-2"
          >
            <FiEdit2 className="w-4 h-4" />
            Edit
          </button>
        </div>
      }
    >
      <div className="px-6 py-4">
        <div className="space-y-4">
          {item.type === 'vocabulary' ? (
            <>
              <div className="text-center py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-japanese text-gray-900 dark:text-white mb-1">
                  {item.kanji || item.kana}
                </div>
                {item.kanji && (
                  <div className="text-lg text-gray-600 dark:text-gray-400 font-japanese">
                    {item.kana}
                  </div>
                )}
                <div className="text-lg text-gray-700 dark:text-gray-300 mt-2">
                  {item.english}
                </div>
                {item.lexical_category && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    {item.lexical_category}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              {item.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Description
                  </h3>
                  <p className="text-gray-900 dark:text-white">
                    {item.description}
                  </p>
                </div>
              )}
              {item.topic && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Topic
                  </h3>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                    {item.topic}
                  </span>
                </div>
              )}
              {item.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Notes
                  </h3>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {item.notes}
                  </p>
                </div>
              )}
            </>
          )}

          {item.example_sentences?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Example Sentences
              </h3>
              <div className="space-y-2">
                {item.example_sentences.map((sentence, i) => (
                  <div
                    key={i}
                    className="p-3 bg-surface-deep rounded-lg text-gray-900 dark:text-white font-japanese"
                  >
                    {sentence}
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.tags?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
