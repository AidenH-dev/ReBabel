import { FiEdit2 } from 'react-icons/fi';
import { MdDragHandle } from 'react-icons/md';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableItem({ item, onView, onEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-gray-50 dark:bg-surface-elevated rounded-lg p-2 shadow-sm overflow-hidden ${
        isDragging ? 'shadow-lg scale-[1.01]' : 'hover:shadow-md transition-all'
      }`}
    >
      <div className="flex items-start gap-2 w-full">
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing rounded touch-none"
          aria-label="Drag to reorder"
        >
          <MdDragHandle className="w-4 h-4" />
        </button>

        <div
          className="flex-1 min-w-0 overflow-hidden cursor-pointer"
          onClick={() => onView(item)}
        >
          {item.type === 'vocabulary' ? (
            <div className="w-full">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.english}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-japanese">
                    {item.kana} {item.kanji && `(${item.kanji})`}
                  </div>
                </div>
                {item.lexical_category && (
                  <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    {item.lexical_category}
                  </span>
                )}
              </div>
              {item.example_sentences?.length > 0 && (
                <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-500 italic truncate">
                  {item.example_sentences[0]}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.title}
                  </div>
                  {item.description && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {item.description}
                    </div>
                  )}
                </div>
                {item.topic && (
                  <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                    {item.topic}
                  </span>
                )}
              </div>
              {item.example_sentences?.length > 0 && (
                <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-500 italic truncate">
                  {item.example_sentences[0]}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item.id, item.type);
            }}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title={`Edit (ID: ${item.id})`}
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
