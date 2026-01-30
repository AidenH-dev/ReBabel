// Set Selection Modal View
// Allows users to select entire sets to add to their pool

import { FaTimes } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { useState } from "react";

export default function SetSelectionModalView({
  isOpen,
  category,
  availableSets,
  isLoading,
  onConfirm,
  onClose
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSetIds, setSelectedSetIds] = useState([]);

  if (!isOpen) return null;

  const categoryLabel = category === 'grammar' ? 'Grammar' : 'Vocabulary';

  const filteredSets = availableSets.filter(set =>
    set.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleSet = (setId) => {
    setSelectedSetIds(prev =>
      prev.includes(setId)
        ? prev.filter(id => id !== setId)
        : [...prev, setId]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedSetIds);
    setSearchQuery("");
    setSelectedSetIds([]);
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedSetIds([]);
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const d = new Date(dateString);
    return isNaN(d)
      ? "Unknown date"
      : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(d);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
          <h2 className="text-lg font-semibold text-black dark:text-white">
            Select {categoryLabel} Sets
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
              placeholder={`Search ${categoryLabel.toLowerCase()} sets...`}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#0f1a1f] rounded-lg border border-black/10 dark:border-white/10 text-sm text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8 text-black/60 dark:text-white/60">
              Loading sets...
            </div>
          ) : filteredSets.length === 0 ? (
            <div className="text-center py-8 text-black/60 dark:text-white/60">
              {availableSets.length === 0
                ? `No ${categoryLabel.toLowerCase()} sets available`
                : `No sets found matching "${searchQuery}"`
              }
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSets.map(set => (
                <label
                  key={set.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSetIds.includes(set.id)
                      ? 'border-[#e30a5f] bg-[#e30a5f]/5'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSetIds.includes(set.id)}
                    onChange={() => handleToggleSet(set.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#e30a5f] focus:ring-[#e30a5f] cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-black dark:text-white truncate">
                      {set.name}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-black/60 dark:text-white/60">
                      <span>{set.item_num} items</span>
                      <span>•</span>
                      <span>{formatDate(set.date)}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-black/5 dark:border-white/5">
          <span className="text-sm text-black/60 dark:text-white/60">
            {selectedSetIds.length} set{selectedSetIds.length !== 1 ? 's' : ''} selected
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
              disabled={selectedSetIds.length === 0}
              className="px-4 py-2 text-sm rounded-lg bg-[#e30a5f] text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Sets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
