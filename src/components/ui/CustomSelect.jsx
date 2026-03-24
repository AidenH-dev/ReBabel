import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Select...',
  size = 'md',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  const isSmall = size === 'sm';

  return (
    <div ref={ref} className={`relative block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-white dark:bg-surface-deep border border-border-default rounded-md text-left whitespace-nowrap ${
          isSmall
            ? 'px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300'
            : 'px-3 py-2 text-sm text-gray-900 dark:text-white'
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} ${isSmall ? 'w-3 h-3' : 'w-4 h-4'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 left-0 min-w-full bg-white dark:bg-surface-elevated border border-border-default rounded-md shadow-lg overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left whitespace-nowrap transition-colors ${
                isSmall ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'
              } ${
                value === option.value
                  ? 'bg-brand-pink/10 text-brand-pink dark:text-[#ff4d8d]'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
