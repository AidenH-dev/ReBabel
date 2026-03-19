import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Select...',
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

  return (
    <div ref={ref} className={`relative block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-white dark:bg-[#0f1a1f] border border-black/10 dark:border-white/10 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white text-left whitespace-nowrap"
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
        <div className="absolute z-50 mt-1 left-0 min-w-full bg-white dark:bg-[#1a2834] border border-black/10 dark:border-white/10 rounded-md shadow-lg overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                value === option.value
                  ? 'bg-[#e30a5f]/10 text-[#e30a5f] dark:text-[#ff4d8d] font-medium'
                  : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5'
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
