import { useState } from 'react';

export default function CategorySidebar({ categories, selectedCategories, onCategoryChange }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!categories || categories.length === 0) {
    return null;
  }

  const sortedCategories = [...categories].sort();

  const handleSelectAll = () => {
    if (selectedCategories.length === categories.length) {
      onCategoryChange([]);
    } else {
      onCategoryChange(sortedCategories);
    }
  };

  return (
    <aside className="dark:bg-gray-800 bg-white rounded-md dark:border dark:border-gray-700 border border-gray-300 overflow-hidden h-fit sticky top-8"
      style={{ fontFamily: 'IBM Plex Serif' }}>
      {/* Header */}
      <div className="p-4 dark:bg-gray-900 bg-gray-50 dark:border-b dark:border-gray-700 border-b border-gray-300">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="font-semibold dark:text-white text-gray-900 text-sm tracking-wider">
            CATEGORIES
          </h3>
          <svg
            className={`w-4 h-4 dark:text-gray-400 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      </div>

      {/* Categories List */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Select All */}
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedCategories.length === categories.length}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded dark:bg-gray-700 bg-white dark:border-gray-600 border-gray-300 text-[#e30a5f] focus:ring-[#e30a5f] cursor-pointer"
            />
            <span className="ml-3 text-sm font-medium dark:text-gray-300 text-gray-700 group-hover:dark:text-white group-hover:text-gray-900 transition-colors">
              All Categories
            </span>
          </label>

          <div className="dark:border-t dark:border-gray-700 border-t border-gray-300 pt-3">
            {sortedCategories.map((category) => (
              <label
                key={category}
                className="flex items-center cursor-pointer group py-1.5"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onCategoryChange([...selectedCategories, category]);
                    } else {
                      onCategoryChange(
                        selectedCategories.filter((c) => c !== category)
                      );
                    }
                  }}
                  className="w-4 h-4 rounded dark:bg-gray-700 bg-white dark:border-gray-600 border-gray-300 text-[#e30a5f] focus:ring-[#e30a5f] cursor-pointer"
                />
                <span className="ml-3 text-sm dark:text-gray-400 text-gray-600 group-hover:dark:text-gray-300 group-hover:text-gray-900 transition-colors">
                  {category}
                </span>
              </label>
            ))}
          </div>

          {/* Clear Filters */}
          {selectedCategories.length > 0 && (
            <div className="pt-3 dark:border-t dark:border-gray-700 border-t border-gray-300">
              <button
                onClick={() => onCategoryChange([])}
                className="w-full text-xs font-medium text-[#e30a5f] hover:text-[#ff1f75] transition-colors py-2 text-center"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      {selectedCategories.length > 0 && (
        <div className="px-4 py-3 dark:bg-gray-900 bg-gray-50 dark:border-t dark:border-gray-700 border-t border-gray-300 text-xs dark:text-gray-400 text-gray-600">
          {selectedCategories.length} of {categories.length} selected
        </div>
      )}
    </aside>
  );
}
