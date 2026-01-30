// Item Selection Modal View
// Allows users to search and select individual items from all sets

import { FaTimes, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { useState, useMemo } from "react";

export default function ItemSelectionModalView({
  isOpen,
  category,
  allItems,
  isLoading,
  onConfirm,
  onClose
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [expandedSets, setExpandedSets] = useState(new Set());

  const categoryLabel = category === 'grammar' ? 'Grammar' : 'Vocabulary';

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems || [];

    const query = searchQuery.toLowerCase();
    return (allItems || []).filter(item => {
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
  }, [allItems, searchQuery, category]);

  // Group items by set
  const itemsBySet = useMemo(() => {
    const grouped = {};
    filteredItems.forEach(item => {
      const setName = item.setName || 'Unknown Set';
      if (!grouped[setName]) {
        grouped[setName] = [];
      }
      grouped[setName].push(item);
    });
    return grouped;
  }, [filteredItems]);

  if (!isOpen) return null;

  const handleToggleItem = (itemId) => {
    setSelectedItemIds(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleToggleSet = (setName) => {
    setExpandedSets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(setName)) {
        newSet.delete(setName);
      } else {
        newSet.add(setName);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    const selectedItems = allItems.filter(item => selectedItemIds.includes(item.id));
    onConfirm(selectedItems);
    setSearchQuery("");
    setSelectedItemIds([]);
    setExpandedSets(new Set());
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedItemIds([]);
    setExpandedSets(new Set());
    onClose();
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
      return item.description ? item.description.substring(0, 60) + (item.description.length > 60 ? '...' : '') : '';
    } else {
      return [item.kana, item.kanji].filter(Boolean).join(' • ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
          <h2 className="text-lg font-semibold text-black dark:text-white">
            Select {categoryLabel} Items
          </h2>
          <button onClick={handleClose} className="text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white">
            <FaTimes />
          </button>
        </div>

        <div className="p-4 border-b border-black/5 dark:border-white/5">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${categoryLabel.toLowerCase()} items...`}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#0f1a1f] rounded-lg border border-black/10 dark:border-white/10 text-sm text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8 text-black/60 dark:text-white/60">
              Loading items...
            </div>
          ) : Object.keys(itemsBySet).length === 0 ? (
            <div className="text-center py-8 text-black/60 dark:text-white/60">
              {allItems.length === 0
                ? `No ${categoryLabel.toLowerCase()} items available`
                : `No items found matching "${searchQuery}"`
              }
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(itemsBySet).map(([setName, items]) => {
                const isExpanded = expandedSets.has(setName);
                return (
                  <div key={setName} className="border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleToggleSet(setName)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0f1a1f] hover:bg-gray-100 dark:hover:bg-[#1d2a32] transition-colors"
                    >
                      <span className="font-medium text-black dark:text-white text-sm">
                        {setName} ({items.length} item{items.length !== 1 ? 's' : ''})
                      </span>
                      {isExpanded ? (
                        <FaChevronDown className="text-black/40 dark:text-white/40 text-sm" />
                      ) : (
                        <FaChevronRight className="text-black/40 dark:text-white/40 text-sm" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-2 space-y-1">
                        {items.map(item => (
                          <label
                            key={item.id}
                            className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-all ${
                              selectedItemIds.includes(item.id)
                                ? 'bg-[#e30a5f]/10'
                                : 'hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedItemIds.includes(item.id)}
                              onChange={() => handleToggleItem(item.id)}
                              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#e30a5f] focus:ring-[#e30a5f] cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-black dark:text-white">
                                {getItemDisplay(item)}
                              </div>
                              {getItemSecondary(item) && (
                                <div className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                                  {getItemSecondary(item)}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-black/5 dark:border-white/5">
          <span className="text-sm text-black/60 dark:text-white/60">
            {selectedItemIds.length} item{selectedItemIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedItemIds.length === 0}
              className="px-4 py-2 text-sm rounded-lg bg-[#e30a5f] text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Items
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
