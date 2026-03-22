import { useState, useRef, useEffect } from 'react';
import { FaTimes, FaPlay, FaExclamationTriangle } from 'react-icons/fa';
import { FaArrowsUpDown, FaShuffle } from 'react-icons/fa6';
import { FaBook } from 'react-icons/fa';
import { GiSpellBook } from 'react-icons/gi';
import {
  VERB_FORMS,
  ADJECTIVE_FORMS,
  CONJUGATABLE_CATEGORIES,
} from '../models/conjugationConfig';

export default function ConjugationConfigPanel({
  availableSets,
  selectedSets,
  onSelectSet,
  onRemoveSet,
  verbOptions,
  adjectiveOptions,
  isSelectAll,
  isRandomMode,
  onToggleVerb,
  onToggleAdjective,
  onToggleSelectAll,
  onToggleRandomMode,
  poolItems,
  onStartPractice,
  questionCount,
  onQuestionCountChange,
  focalItems,
  onAddFocalItem,
  onRemoveFocalItem,
}) {
  // Filter to only auto-categorized vocab sets not already selected
  const eligibleSets = (availableSets || []).filter(
    (set) =>
      set.set_type === 'vocab' &&
      set.auto_categorized === true &&
      !selectedSets.some((s) => s.id === set.id)
  );

  const hasEligibleSets = (availableSets || []).some(
    (set) => set.set_type === 'vocab' && set.auto_categorized === true
  );

  // Count conjugatable items by category
  const verbCount = poolItems.filter(
    (item) => item.lexical_category === 'verb'
  ).length;
  const iAdjCount = poolItems.filter(
    (item) => item.lexical_category === 'i-adjective'
  ).length;
  const naAdjCount = poolItems.filter(
    (item) => item.lexical_category === 'na-adjective'
  ).length;

  const selectedVerbCount = Object.values(verbOptions).filter(Boolean).length;
  const selectedAdjCount =
    Object.values(adjectiveOptions).filter(Boolean).length;
  const totalFormCount = selectedVerbCount + selectedAdjCount;

  const hasFocalItems = focalItems && focalItems.length > 0;
  const [specificItemsMode, setSpecificItemsMode] = useState(false);

  // Set search/select state
  const [setSearchValue, setSetSearchValue] = useState('');
  const [showSetSuggestions, setShowSetSuggestions] = useState(false);
  const setInputRef = useRef(null);
  const setDropdownRef = useRef(null);

  // Focal item search state
  const [itemSearchValue, setItemSearchValue] = useState('');
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const itemInputRef = useRef(null);
  const itemDropdownRef = useRef(null);

  // Filter set suggestions
  const setSearchResults = eligibleSets.filter((set) => {
    if (!setSearchValue.trim()) return true;
    return set.name.toLowerCase().includes(setSearchValue.toLowerCase());
  });

  // Filter item suggestions from pool (exclude already-selected focal items)
  const itemSearchResults = poolItems.filter((item) => {
    if (focalItems?.some((f) => f.id === item.id)) return false;
    if (!itemSearchValue.trim()) return true;
    const q = itemSearchValue.toLowerCase();
    return (
      item.kana?.toLowerCase().includes(q) ||
      item.kanji?.toLowerCase().includes(q) ||
      item.english?.toLowerCase().includes(q)
    );
  });

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        setDropdownRef.current &&
        !setDropdownRef.current.contains(event.target) &&
        setInputRef.current &&
        !setInputRef.current.contains(event.target)
      ) {
        setShowSetSuggestions(false);
      }
      if (
        itemDropdownRef.current &&
        !itemDropdownRef.current.contains(event.target) &&
        itemInputRef.current &&
        !itemInputRef.current.contains(event.target)
      ) {
        setShowItemSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSet = (set) => {
    onSelectSet(set.id);
    setSetSearchValue('');
    setShowSetSuggestions(false);
  };

  const handleSelectFocalItem = (item) => {
    onAddFocalItem(item);
    setItemSearchValue('');
    setShowItemSuggestions(false);
  };

  return (
    <div>
      {/* A. Set Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Vocabulary Sets
        </label>

        <div className="relative">
          <div
            ref={setInputRef}
            className="min-h-[42px] bg-surface-deep text-gray-900 dark:text-white px-2 py-1.5 rounded-lg text-sm border border-border-default focus-within:ring-1 focus-within:ring-brand-pink flex flex-wrap items-center gap-1.5"
          >
            {selectedSets.map((set) => (
              <div
                key={set.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/30"
              >
                <span className="truncate max-w-[150px] sm:max-w-none">
                  {set.name}
                </span>
                <button
                  onClick={() => onRemoveSet(set.id)}
                  className="hover:opacity-70 flex-shrink-0"
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </div>
            ))}

            {hasEligibleSets ? (
              <input
                type="text"
                value={setSearchValue}
                onChange={(e) => {
                  setSetSearchValue(e.target.value);
                  setShowSetSuggestions(true);
                }}
                onFocus={() => setShowSetSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && setSearchResults.length > 0) {
                    e.preventDefault();
                    handleSelectSet(setSearchResults[0]);
                  } else if (e.key === 'Escape') {
                    setShowSetSuggestions(false);
                  }
                }}
                placeholder={
                  eligibleSets.length === 0
                    ? 'All eligible sets added'
                    : 'Search and add sets...'
                }
                disabled={eligibleSets.length === 0}
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder:text-black/40 dark:placeholder:text-white/40 disabled:cursor-not-allowed"
              />
            ) : (
              <p className="text-xs text-amber-700 dark:text-amber-300/80 py-1">
                No auto-categorized vocabulary sets found. Visit your sets to
                auto-categorize them first.
              </p>
            )}
          </div>

          {showSetSuggestions &&
            hasEligibleSets &&
            setSearchResults.length > 0 && (
              <div
                ref={setDropdownRef}
                className="absolute z-10 w-full mt-1 bg-surface-card border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {setSearchResults.map((set) => (
                  <button
                    key={set.id}
                    onClick={() => handleSelectSet(set)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#22333e] transition-colors border-b border-border-subtle last:border-b-0"
                  >
                    <div className="text-sm font-medium text-black dark:text-white">
                      {set.name}
                    </div>
                    <div className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                      {set.item_num} items
                    </div>
                  </button>
                ))}
              </div>
            )}
        </div>

        {selectedSets.length > 0 && poolItems.length === 0 && (
          <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
            No verbs or adjectives found in the selected sets.
          </p>
        )}

        {/* Specific items toggle + selector */}
        {poolItems.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => {
                const next = !specificItemsMode;
                setSpecificItemsMode(next);
                if (!next && focalItems?.length > 0) {
                  focalItems.forEach((item) => onRemoveFocalItem(item.id));
                }
              }}
              className={`flex items-center gap-1.5 text-sm cursor-pointer mb-2 ${
                specificItemsMode
                  ? 'text-brand-pink font-medium'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <input
                type="checkbox"
                checked={specificItemsMode}
                readOnly
                className="accent-brand-pink"
              />
              Study specific items only
            </button>

            {specificItemsMode && (
              <div className="relative">
                <div
                  ref={itemInputRef}
                  className="min-h-[42px] bg-surface-deep text-gray-900 dark:text-white px-2 py-1.5 rounded-lg text-sm border border-border-default focus-within:ring-1 focus-within:ring-brand-pink flex flex-wrap items-center gap-1.5"
                >
                  {focalItems?.map((item) => (
                    <div
                      key={item.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm bg-brand-pink/10 text-brand-pink border border-brand-pink/20"
                    >
                      <span className="truncate max-w-[120px] sm:max-w-none">
                        {item.kanji || item.kana}
                      </span>
                      <button
                        onClick={() => onRemoveFocalItem(item.id)}
                        className="hover:opacity-70 flex-shrink-0"
                      >
                        <FaTimes className="text-[10px]" />
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    value={itemSearchValue}
                    onChange={(e) => {
                      setItemSearchValue(e.target.value);
                      setShowItemSuggestions(true);
                    }}
                    onFocus={() => setShowItemSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && itemSearchResults.length > 0) {
                        e.preventDefault();
                        handleSelectFocalItem(itemSearchResults[0]);
                      } else if (e.key === 'Escape') {
                        setShowItemSuggestions(false);
                      }
                    }}
                    placeholder="Search items to focus on..."
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder:text-black/40 dark:placeholder:text-white/40"
                  />
                </div>

                {showItemSuggestions && itemSearchResults.length > 0 && (
                  <div
                    ref={itemDropdownRef}
                    className="absolute z-10 w-full mt-1 bg-surface-card border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto overscroll-contain"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    {itemSearchResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectFocalItem(item)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#22333e] transition-colors border-b border-border-subtle last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-black dark:text-white">
                            {item.kanji || item.kana}
                          </span>
                          {item.kanji && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {item.kana}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-black/50 dark:text-white/50">
                          {item.english} · {item.lexical_category}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Warning banner */}
        {selectedSets.length > 0 && poolItems.length > 0 && (
          <div className="flex items-start gap-2 mt-3 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200/50 dark:border-amber-700/30">
            <FaExclamationTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed">
              Conjugation practice relies on accurate word labeling. Items with
              kanji are auto-categorized more reliably. If results seem off, try
              adding kanji to your vocabulary items.
            </p>
          </div>
        )}
      </div>

      {/* B. Conjugation Forms */}
      <div className="mb-4">
        {/* Controls row */}
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={onToggleSelectAll}
            className="flex items-center gap-1.5 text-sm cursor-pointer"
          >
            <FaArrowsUpDown
              className={
                isSelectAll
                  ? 'text-brand-pink'
                  : 'text-gray-500 dark:text-gray-400'
              }
              size={14}
            />
            <span
              className={
                isSelectAll
                  ? 'text-brand-pink font-medium'
                  : 'text-gray-700 dark:text-gray-300'
              }
            >
              Select All
            </span>
          </button>

          <button
            onClick={onToggleRandomMode}
            className="flex items-center gap-1.5 text-sm cursor-pointer"
          >
            <FaShuffle
              className={
                isRandomMode
                  ? 'text-brand-pink'
                  : 'text-gray-500 dark:text-gray-400'
              }
              size={14}
            />
            <span
              className={
                isRandomMode
                  ? 'text-brand-pink font-medium'
                  : 'text-gray-700 dark:text-gray-300'
              }
            >
              Random Mode
            </span>
          </button>
        </div>

        {/* Two-column grid -- single column on mobile for verbs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Verbs */}
          <div className="bg-surface-deep rounded-xl p-4 border border-border-subtle">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
              <FaBook size={12} /> Verbs
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {VERB_FORMS.map(({ key, label, japanese }) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 text-sm ${
                    isRandomMode
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={verbOptions[key]}
                    disabled={isRandomMode}
                    onChange={() => onToggleVerb(key)}
                    className="accent-brand-pink flex-shrink-0"
                  />
                  <span className="text-gray-900 dark:text-white whitespace-nowrap">
                    {label}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
                    ({japanese})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Adjectives */}
          <div className="bg-surface-deep rounded-xl p-4 border border-border-subtle">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
              <GiSpellBook size={12} /> Adjectives
            </h4>
            <div className="space-y-1.5">
              {ADJECTIVE_FORMS.map(({ key, label, japanese }) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 text-sm ${
                    isRandomMode
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={adjectiveOptions[key]}
                    disabled={isRandomMode}
                    onChange={() => onToggleAdjective(key)}
                    className="accent-brand-pink flex-shrink-0"
                  />
                  <span className="text-gray-900 dark:text-white">{label}</span>
                  <span className="text-gray-400 dark:text-gray-500 text-xs">
                    ({japanese})
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* C. Bottom bar */}
      <div className="p-3 bg-gray-100 dark:bg-surface-deep rounded-lg space-y-2 sm:space-y-0">
        {/* Mobile: stats row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:hidden">
          <div>
            <span className="text-black/60 dark:text-white/60">Items: </span>
            <span className="font-medium">
              {specificItemsMode && hasFocalItems
                ? focalItems.length
                : poolItems.length}
            </span>
          </div>
          <div>
            <span className="text-black/60 dark:text-white/60">Forms: </span>
            <span className="font-medium">
              {isRandomMode ? 'Random' : totalFormCount}
            </span>
          </div>
          {poolItems.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {verbCount}v · {iAdjCount}i · {naAdjCount}na
            </div>
          )}
        </div>

        {/* Mobile: question count row */}
        {!specificItemsMode && (
          <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
            <span className="text-xs text-black/50 dark:text-white/50">
              Number of questions:
            </span>
            {[10, 25, 50]
              .filter((n) => n <= poolItems.length)
              .map((n) => (
                <button
                  key={n}
                  onClick={() => onQuestionCountChange(n)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    questionCount === n
                      ? 'bg-brand-pink text-white font-medium'
                      : 'bg-surface-card text-gray-600 dark:text-gray-300 border border-border-default'
                  }`}
                >
                  {n}
                </button>
              ))}
            <button
              onClick={() => onQuestionCountChange('all')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                questionCount === 'all'
                  ? 'bg-brand-pink text-white font-medium'
                  : 'bg-surface-card text-gray-600 dark:text-gray-300 border border-border-default'
              }`}
            >
              All
            </button>
          </div>
        )}

        {/* Mobile: action buttons */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            onClick={() => onToggleSelectAll()}
            className="px-3 py-2 text-sm rounded-lg border border-border-default hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
          >
            Clear All
          </button>
          <button
            onClick={onStartPractice}
            disabled={
              poolItems.length === 0 || (!isRandomMode && totalFormCount === 0)
            }
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              poolItems.length > 0 && (isRandomMode || totalFormCount > 0)
                ? 'bg-brand-pink hover:bg-brand-pink-hover text-white cursor-pointer active:scale-95'
                : 'bg-brand-pink text-white opacity-50 cursor-not-allowed'
            }`}
          >
            <FaPlay size={12} />
            Begin Practice
          </button>
        </div>

        {/* Desktop: single row */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Left: Stats */}
          <div className="flex items-center gap-3 text-sm">
            <div>
              <span className="text-black/60 dark:text-white/60">Items: </span>
              <span className="font-medium">
                {specificItemsMode && hasFocalItems
                  ? focalItems.length
                  : poolItems.length}
              </span>
            </div>
            <div>
              <span className="text-black/60 dark:text-white/60">Forms: </span>
              <span className="font-medium">
                {isRandomMode ? 'Random' : totalFormCount}
              </span>
            </div>
            {poolItems.length > 0 && (
              <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap border-l border-border-default pl-3">
                <span>{verbCount} verbs</span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span>{iAdjCount} i-adj</span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span>{naAdjCount} na-adj</span>
              </div>
            )}
          </div>

          {/* Right: Questions + Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {!specificItemsMode && (
              <div className="flex items-center gap-1 mr-1">
                <span className="text-xs text-black/50 dark:text-white/50 mr-0.5">
                  Number of questions:
                </span>
                {[10, 25, 50]
                  .filter((n) => n <= poolItems.length)
                  .map((n) => (
                    <button
                      key={n}
                      onClick={() => onQuestionCountChange(n)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        questionCount === n
                          ? 'bg-brand-pink text-white font-medium'
                          : 'bg-surface-card text-gray-600 dark:text-gray-300 border border-border-default hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                <button
                  onClick={() => onQuestionCountChange('all')}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    questionCount === 'all'
                      ? 'bg-brand-pink text-white font-medium'
                      : 'bg-surface-card text-gray-600 dark:text-gray-300 border border-border-default hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  All
                </button>
              </div>
            )}
            <button
              onClick={() => onToggleSelectAll()}
              className="px-3 py-2 text-sm rounded-lg border border-border-default hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
            >
              Clear All
            </button>
            <button
              onClick={onStartPractice}
              disabled={
                poolItems.length === 0 ||
                (!isRandomMode && totalFormCount === 0)
              }
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                poolItems.length > 0 && (isRandomMode || totalFormCount > 0)
                  ? 'bg-brand-pink hover:bg-brand-pink-hover text-white cursor-pointer active:scale-95'
                  : 'bg-brand-pink text-white opacity-50 cursor-not-allowed'
              }`}
            >
              <FaPlay size={12} />
              Begin Practice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
