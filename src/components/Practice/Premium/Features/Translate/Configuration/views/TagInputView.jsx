// Tag Input View
// Input field with autocomplete for selecting focal points from pool

import { FaTimes } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";

export default function TagInputView({
  label,
  placeholder,
  poolItems,
  selectedTags,
  onAddTag,
  onRemoveTag,
  maxTags,
  category
}) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filter suggestions based on input
  const suggestions = poolItems.filter(item => {
    // Check if item already selected (compare by content for custom items)
    const isSelected = selectedTags.some(tag =>
      (tag.id && item.id && tag.id === item.id) ||
      (category === 'grammar' && tag.title === item.title) ||
      (category === 'vocabulary' && tag.english === item.english && tag.kana === item.kana)
    );
    if (isSelected) return false;

    // Filter by search query
    if (!inputValue.trim()) return true;

    const query = inputValue.toLowerCase();
    if (category === 'grammar') {
      return (
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    } else {
      return (
        item.english?.toLowerCase().includes(query) ||
        item.kana?.toLowerCase().includes(query) ||
        item.kanji?.toLowerCase().includes(query)
      );
    }
  });

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (item) => {
    if (maxTags && selectedTags.length >= maxTags) return;
    onAddTag(item);
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[0]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const getItemDisplay = (item) => {
    if (category === 'grammar') {
      return item.title || 'Untitled';
    } else {
      return item.english || item.kana || item.kanji || 'Untitled';
    }
  };

  const getItemSecondary = (item) => {
    if (category === 'grammar') {
      return item.description ? item.description.substring(0, 40) + '...' : '';
    } else {
      return [item.kana, item.kanji].filter(Boolean).join(' • ');
    }
  };

  // selectedTags already contains full objects (after Phase 1 changes)
  const selectedTagItems = selectedTags;

  const isAtMaxTags = maxTags && selectedTags.length >= maxTags;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>

      <div className="relative">
        <div className="min-h-[40px] bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus-within:ring-1 focus-within:ring-[#e30a5f]">
          {/* Selected Tags */}
          <div className="flex flex-wrap gap-1 mb-1">
            {selectedTagItems.map(item => (
              <div
                key={item.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#e30a5f]/10 text-[#e30a5f] border border-[#e30a5f]/20"
              >
                <span>{getItemDisplay(item)}</span>
                <button
                  onClick={() => onRemoveTag(item.id || item.title || item.english)}
                  className="hover:opacity-70"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            ))}
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={isAtMaxTags ? `Max ${maxTags} items selected` : placeholder}
            disabled={isAtMaxTags}
            className="w-full bg-transparent border-none outline-none text-base placeholder:text-black/40 dark:placeholder:text-white/40 disabled:cursor-not-allowed"
          />
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && !isAtMaxTags && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-white dark:bg-[#1c2b35] border border-black/10 dark:border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map(item => (
              <button
                key={item.id}
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#22333e] transition-colors border-b border-black/5 dark:border-white/5 last:border-b-0"
              >
                <div className="text-sm font-medium text-black dark:text-white">
                  {getItemDisplay(item)}
                </div>
                {getItemSecondary(item) && (
                  <div className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                    {getItemSecondary(item)}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Count Indicator */}
      {maxTags && (
        <div className="text-xs text-black/60 dark:text-white/60 mt-1 ml-1">
          {selectedTags.length}/{maxTags} selected
        </div>
      )}
    </div>
  );
}
