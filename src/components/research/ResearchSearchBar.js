import { useState, useCallback } from 'react';

export default function ResearchSearchBar({ onSearch, placeholder = "Search research articles..." }) {
  const [query, setQuery] = useState('');

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className="relative" style={{ fontFamily: 'IBM Plex Serif' }}>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 dark:text-gray-500 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 dark:bg-gray-800 bg-white dark:text-white text-gray-900 dark:placeholder-gray-500 placeholder-gray-400 rounded-lg border dark:border-gray-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent transition-all"
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 dark:text-gray-400 text-gray-500 hover:dark:text-gray-300 hover:text-gray-700 transition-colors"
            aria-label="Clear search"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
