import { useRef, useState } from 'react';
import { FiEdit2 } from 'react-icons/fi';

export default function ExampleSentenceList({
  sentences = [],
  onChange,
  compact = false,
  placeholder = 'Example sentence...',
}) {
  const scrollRef = useRef(null);
  const addInputRef = useRef(null);
  const editInputRef = useRef(null);
  const [isAdding, setIsAdding] = useState(false);
  const [addValue, setAddValue] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 0);
  };

  const openAdd = () => {
    setIsAdding(true);
    scrollToBottom();
    setTimeout(() => addInputRef.current?.focus(), 0);
  };

  const commitAdd = () => {
    const trimmed = addValue.trim();
    if (trimmed) {
      onChange([...sentences, trimmed]);
    }
    setAddValue('');
    setIsAdding(false);
  };

  const cancelAdd = () => {
    setAddValue('');
    setIsAdding(false);
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditValue(sentences[index]);
    setTimeout(() => {
      const el = editInputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }, 0);
  };

  const commitEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editValue.trim();
    if (trimmed) {
      onChange(sentences.map((s, i) => (i === editingIndex ? trimmed : s)));
    } else {
      onChange(sentences.filter((_, i) => i !== editingIndex));
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleRemove = (index) => {
    onChange(sentences.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const handleAddKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitAdd();
    }
    if (e.key === 'Escape') {
      e.stopPropagation();
      cancelAdd();
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === 'Escape') {
      e.stopPropagation();
      cancelEdit();
    }
  };

  const inputClass = compact
    ? 'flex-1 min-w-0 px-2 py-1 rounded text-sm font-japanese bg-surface-deep text-gray-900 dark:text-white border border-border-default focus:outline-none focus:ring-1 focus:ring-brand-pink'
    : 'flex-1 min-w-0 px-3 py-1.5 rounded-lg text-sm font-japanese bg-surface-deep text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-pink';

  return (
    <div>
      {(sentences.length > 0 || isAdding) && (
        <div
          ref={scrollRef}
          className={`${compact ? 'max-h-[104px]' : 'max-h-[152px]'} overflow-y-auto py-0.5 px-0.5 pr-1 space-y-0.5`}
        >
          {sentences.map((sentence, i) => (
            <div key={i}>
              {editingIndex === i ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 w-4 text-right shrink-0 tabular-nums">
                    {i + 1}.
                  </span>
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={commitEdit}
                    className={inputClass}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 py-0.5 group/row">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 w-4 text-right shrink-0 tabular-nums">
                    {i + 1}.
                  </span>
                  <span className="flex-1 min-w-0 text-sm font-japanese text-gray-800 dark:text-gray-200 truncate">
                    {sentence}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    className="shrink-0 w-4 h-4 flex items-center justify-center rounded text-gray-400 dark:text-gray-500 hover:text-brand-pink transition-colors"
                    tabIndex={-1}
                    aria-label={`Edit sentence ${i + 1}`}
                  >
                    <FiEdit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(i)}
                    className="shrink-0 w-4 h-4 flex items-center justify-center rounded text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    tabIndex={-1}
                    aria-label={`Remove sentence ${i + 1}`}
                  >
                    <svg
                      className="w-3 h-3"
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
              )}
            </div>
          ))}

          {isAdding && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 w-4 text-right shrink-0 tabular-nums">
                {sentences.length + 1}.
              </span>
              <input
                ref={addInputRef}
                type="text"
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                onKeyDown={handleAddKeyDown}
                onBlur={commitAdd}
                placeholder={placeholder}
                className={inputClass}
              />
            </div>
          )}
        </div>
      )}

      {!isAdding && (
        <button
          type="button"
          onClick={openAdd}
          className={`${sentences.length > 0 ? 'mt-1.5' : ''} text-xs text-gray-500 dark:text-gray-400 hover:text-brand-pink dark:hover:text-brand-pink transition-colors flex items-center gap-1`}
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add sentence
        </button>
      )}
    </div>
  );
}
