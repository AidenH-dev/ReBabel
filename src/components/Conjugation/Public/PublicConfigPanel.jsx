import { useState, useRef, useEffect } from 'react';
import { FaPlay, FaTimes } from 'react-icons/fa';
import { FaArrowsUpDown, FaShuffle } from 'react-icons/fa6';
import { FaBook } from 'react-icons/fa';
import { GiSpellBook } from 'react-icons/gi';
import {
  VERB_FORMS,
  ADJECTIVE_FORMS,
  createInitialVerbOptions,
  createInitialAdjectiveOptions,
} from '@/components/Conjugation/shared/models/conjugationConfig';

export default function PublicConfigPanel({
  levelStats,
  level,
  levelKey,
  onStart,
}) {
  const [verbOptions, setVerbOptions] = useState(createInitialVerbOptions());
  const [adjectiveOptions, setAdjectiveOptions] = useState(
    createInitialAdjectiveOptions()
  );
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);

  // Specific items state
  const [specificItemsMode, setSpecificItemsMode] = useState(false);
  const [focalItems, setFocalItems] = useState([]);
  const [allItems, setAllItems] = useState(null); // loaded on demand
  const [itemSearchValue, setItemSearchValue] = useState('');
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const itemInputRef = useRef(null);
  const itemDropdownRef = useRef(null);

  const selectedVerbCount = Object.values(verbOptions).filter(Boolean).length;
  const selectedAdjCount =
    Object.values(adjectiveOptions).filter(Boolean).length;
  const totalFormCount = selectedVerbCount + selectedAdjCount;
  const hasFocalItems = focalItems.length > 0;

  // Load items when specific items mode is toggled on
  useEffect(() => {
    if (specificItemsMode && !allItems) {
      fetch(`/data/conjugation/${levelKey}.json`)
        .then((r) => r.json())
        .then((data) => setAllItems(data))
        .catch(() => {});
    }
  }, [specificItemsMode, allItems, levelKey]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        itemDropdownRef.current &&
        !itemDropdownRef.current.contains(e.target) &&
        itemInputRef.current &&
        !itemInputRef.current.contains(e.target)
      ) {
        setShowItemSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter item suggestions
  const itemSearchResults = (allItems || []).filter((item) => {
    if (focalItems.some((f) => f.k === item.k && f.j === item.j)) return false;
    if (!itemSearchValue.trim()) return true;
    const q = itemSearchValue.toLowerCase();
    return (
      item.k?.toLowerCase().includes(q) ||
      item.j?.toLowerCase().includes(q) ||
      item.e?.toLowerCase().includes(q)
    );
  });

  const handleToggleVerb = (key) => {
    if (isRandomMode) return;
    setVerbOptions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const allVerbs = Object.values(next).every(Boolean);
      const allAdj = Object.values(adjectiveOptions).every(Boolean);
      setIsSelectAll(allVerbs && allAdj);
      return next;
    });
  };

  const handleToggleAdjective = (key) => {
    if (isRandomMode) return;
    setAdjectiveOptions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const allVerbs = Object.values(verbOptions).every(Boolean);
      const allAdj = Object.values(next).every(Boolean);
      setIsSelectAll(allVerbs && allAdj);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (isSelectAll) {
      setVerbOptions(createInitialVerbOptions());
      setAdjectiveOptions(createInitialAdjectiveOptions());
      setIsSelectAll(false);
    } else {
      setVerbOptions(
        Object.keys(verbOptions).reduce((a, k) => ({ ...a, [k]: true }), {})
      );
      setAdjectiveOptions(
        Object.keys(adjectiveOptions).reduce(
          (a, k) => ({ ...a, [k]: true }),
          {}
        )
      );
      setIsSelectAll(true);
      setIsRandomMode(false);
    }
  };

  const handleToggleRandomMode = () => {
    if (isRandomMode) {
      setIsRandomMode(false);
    } else {
      setIsRandomMode(true);
      setIsSelectAll(false);
      setVerbOptions(createInitialVerbOptions());
      setAdjectiveOptions(createInitialAdjectiveOptions());
    }
  };

  const handleStart = () => {
    const selectedVerbForms = isRandomMode
      ? null
      : Object.entries(verbOptions)
          .filter(([, v]) => v)
          .map(([k]) => k);
    const selectedAdjForms = isRandomMode
      ? null
      : Object.entries(adjectiveOptions)
          .filter(([, v]) => v)
          .map(([k]) => k);

    onStart({
      selectedVerbForms,
      selectedAdjForms,
      randomMode: isRandomMode,
      count: specificItemsMode && hasFocalItems ? 9999 : questionCount,
      focalItems: specificItemsMode && hasFocalItems ? focalItems : null,
    });
  };

  return (
    <div>
      {/* Level info */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-600 dark:text-gray-400">
        <span className="px-3 py-1 rounded-full bg-brand-pink/10 text-brand-pink font-semibold">
          JLPT N{level}
        </span>
        <span>{levelStats.verbs} verbs</span>
        <span>{levelStats.iAdj} i-adjectives</span>
        <span>{levelStats.naAdj} na-adjectives</span>
      </div>

      {/* Specific items toggle + selector */}
      <div className="mb-4">
        <button
          onClick={() => {
            const next = !specificItemsMode;
            setSpecificItemsMode(next);
            if (!next) setFocalItems([]);
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
              {focalItems.map((item, i) => (
                <div
                  key={`${item.k}-${i}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm bg-brand-pink/10 text-brand-pink border border-brand-pink/20"
                >
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {item.j || item.k}
                  </span>
                  <button
                    onClick={() =>
                      setFocalItems((prev) =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
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
                    setFocalItems((prev) => [...prev, itemSearchResults[0]]);
                    setItemSearchValue('');
                    setShowItemSuggestions(false);
                  } else if (e.key === 'Escape') {
                    setShowItemSuggestions(false);
                  }
                }}
                placeholder={
                  allItems ? 'Search items to focus on...' : 'Loading items...'
                }
                disabled={!allItems}
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder:text-black/40 dark:placeholder:text-white/40 disabled:cursor-not-allowed"
              />
            </div>

            {showItemSuggestions && itemSearchResults.length > 0 && (
              <div
                ref={itemDropdownRef}
                className="absolute z-10 w-full mt-1 bg-surface-card border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {itemSearchResults.map((item, i) => (
                  <button
                    key={`${item.k}-${i}`}
                    onClick={() => {
                      setFocalItems((prev) => [...prev, item]);
                      setItemSearchValue('');
                      setShowItemSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#22333e] transition-colors border-b border-border-subtle last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-black dark:text-white">
                        {item.j || item.k}
                      </span>
                      {item.j && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.k}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-black/50 dark:text-white/50">
                      {item.e} · {item.c}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-3">
        <button
          onClick={handleToggleSelectAll}
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
          onClick={handleToggleRandomMode}
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

      {/* Form grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-surface-deep rounded-xl p-4 border border-border-subtle">
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
            <FaBook size={12} /> Verbs
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {VERB_FORMS.map(({ key, label, japanese }) => (
              <label
                key={key}
                className={`flex items-center gap-2 text-sm ${isRandomMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <input
                  type="checkbox"
                  checked={verbOptions[key]}
                  disabled={isRandomMode}
                  onChange={() => handleToggleVerb(key)}
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

        <div className="bg-surface-deep rounded-xl p-4 border border-border-subtle">
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
            <GiSpellBook size={12} /> Adjectives
          </h4>
          <div className="space-y-1.5">
            {ADJECTIVE_FORMS.map(({ key, label, japanese }) => (
              <label
                key={key}
                className={`flex items-center gap-2 text-sm ${isRandomMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <input
                  type="checkbox"
                  checked={adjectiveOptions[key]}
                  disabled={isRandomMode}
                  onChange={() => handleToggleAdjective(key)}
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

      {/* Bottom bar */}
      <div className="p-3 bg-gray-100 dark:bg-surface-deep rounded-lg space-y-2 sm:space-y-0">
        {/* Mobile */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:hidden">
          <div>
            <span className="text-black/60 dark:text-white/60">Items: </span>
            <span className="font-medium">
              {specificItemsMode && hasFocalItems
                ? focalItems.length
                : levelStats.total}
            </span>
          </div>
          <div>
            <span className="text-black/60 dark:text-white/60">Forms: </span>
            <span className="font-medium">
              {isRandomMode ? 'Random' : totalFormCount}
            </span>
          </div>
        </div>

        {!specificItemsMode && (
          <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
            <span className="text-xs text-black/50 dark:text-white/50">
              Questions:
            </span>
            {[10, 25, 50]
              .filter((n) => n <= levelStats.total)
              .map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${questionCount === n ? 'bg-brand-pink text-white font-medium' : 'bg-surface-card text-gray-600 dark:text-gray-300 border border-border-default'}`}
                >
                  {n}
                </button>
              ))}
            <button
              onClick={() => setQuestionCount('all')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${questionCount === 'all' ? 'bg-brand-pink text-white font-medium' : 'bg-surface-card text-gray-600 dark:text-gray-300 border border-border-default'}`}
            >
              All
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 sm:hidden">
          <button
            onClick={handleStart}
            disabled={!isRandomMode && totalFormCount === 0}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${isRandomMode || totalFormCount > 0 ? 'bg-brand-pink hover:bg-brand-pink-hover text-white cursor-pointer active:scale-95' : 'bg-brand-pink text-white opacity-50 cursor-not-allowed'}`}
          >
            <FaPlay size={12} /> Begin Practice
          </button>
        </div>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-3 text-sm">
            <div>
              <span className="text-black/60 dark:text-white/60">Items: </span>
              <span className="font-medium">
                {specificItemsMode && hasFocalItems
                  ? focalItems.length
                  : levelStats.total}
              </span>
            </div>
            <div>
              <span className="text-black/60 dark:text-white/60">Forms: </span>
              <span className="font-medium">
                {isRandomMode ? 'Random' : totalFormCount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {!specificItemsMode && (
              <div className="flex items-center gap-1 mr-1">
                <span className="text-xs text-black/50 dark:text-white/50 mr-0.5">
                  Questions:
                </span>
                {[10, 25, 50]
                  .filter((n) => n <= levelStats.total)
                  .map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${questionCount === n ? 'bg-brand-pink text-white font-medium' : 'bg-surface-card text-gray-600 dark:text-gray-300 border border-border-default hover:bg-gray-50 dark:hover:bg-white/5'}`}
                    >
                      {n}
                    </button>
                  ))}
                <button
                  onClick={() => setQuestionCount('all')}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${questionCount === 'all' ? 'bg-brand-pink text-white font-medium' : 'bg-surface-card text-gray-600 dark:text-gray-300 border border-border-default hover:bg-gray-50 dark:hover:bg-white/5'}`}
                >
                  All
                </button>
              </div>
            )}
            <button
              onClick={handleStart}
              disabled={!isRandomMode && totalFormCount === 0}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${isRandomMode || totalFormCount > 0 ? 'bg-brand-pink hover:bg-brand-pink-hover text-white cursor-pointer active:scale-95' : 'bg-brand-pink text-white opacity-50 cursor-not-allowed'}`}
            >
              <FaPlay size={12} /> Begin Practice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
