import { useState, useEffect, useMemo } from 'react';
import {
  TbSortAscending,
  TbSortDescending,
  TbSearch,
  TbClock,
  TbSortAZ,
  TbFlame,
} from 'react-icons/tb';
import SrsItemHistoryChart from './srs-item-history-chart';
import { calculateNextReviewDate } from '@/components/SRS/visuals/SrsTimeGrid/models/srsDataModel';

const LEECH_THRESHOLD = 8;

const LEVEL_BADGE_COLORS = {
  1: 'bg-blue-400/20 text-blue-400',
  2: 'bg-blue-500/20 text-blue-500',
  3: 'bg-blue-500/20 text-blue-500',
  4: 'bg-blue-600/20 text-blue-400',
  5: 'bg-yellow-400/20 text-yellow-400',
  6: 'bg-yellow-500/20 text-yellow-500',
  7: 'bg-red-500/20 text-red-400',
  8: 'bg-green-500/20 text-green-400',
  9: 'bg-purple-500/20 text-purple-400',
};

function getItemDisplayName(item) {
  return item.kanji || item.kana || item.english || 'Unknown';
}

function formatLocalDateTime(dateStr) {
  const date = new Date(dateStr);
  const datepart = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const timepart = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return { datepart, timepart };
}

function getLevelColor(level) {
  return LEVEL_BADGE_COLORS[level] || 'bg-gray-400/20 text-gray-400';
}

export default function SrsTabbedPanel({ setId, rawItems }) {
  const [activeTab, setActiveTab] = useState('log');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [itemSort, setItemSort] = useState('level-desc');
  const [levelFilter, setLevelFilter] = useState(null); // null = all levels

  // Fetch history data
  useEffect(() => {
    if (!setId) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/database/v2/srs/set/history/${setId}`);
        const result = await res.json();
        if (result.success) {
          setHistoryData(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch SRS history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [setId]);

  // Derive activity log with old_level
  const activityLog = useMemo(() => {
    if (!historyData) return [];

    // Group by item_id, sort each group chronologically
    const byItem = {};
    historyData.forEach((entry) => {
      if (!byItem[entry.item_id]) byItem[entry.item_id] = [];
      byItem[entry.item_id].push(entry);
    });

    // Sort each item's entries chronologically
    Object.values(byItem).forEach((entries) =>
      entries.sort(
        (a, b) => new Date(a.time_created) - new Date(b.time_created)
      )
    );

    // Build log entries with old_level
    const logEntries = historyData.map((entry) => {
      const itemEntries = byItem[entry.item_id];
      const idx = itemEntries.findIndex(
        (e) =>
          e.time_created === entry.time_created &&
          e.srs_level === entry.srs_level
      );
      const oldLevel = idx > 0 ? itemEntries[idx - 1].srs_level : 0;

      return {
        ...entry,
        old_level: oldLevel,
        displayName: getItemDisplayName(entry),
      };
    });

    // Already sorted DESC from API
    return logEntries;
  }, [historyData]);

  // Items with SRS > 0
  const activeItems = useMemo(() => {
    return rawItems.filter((item) => item.srs?.srs_level > 0);
  }, [rawItems]);

  // Available levels for filter chips
  const availableLevels = useMemo(() => {
    const levels = new Set();
    activeItems.forEach((item) => levels.add(item.srs?.srs_level || 0));
    return [...levels].sort((a, b) => a - b);
  }, [activeItems]);

  // Compute lapse counts per item from history (level downs = lapses)
  const lapseCounts = useMemo(() => {
    if (!historyData) return {};

    const byItem = {};
    historyData.forEach((entry) => {
      if (!byItem[entry.item_id]) byItem[entry.item_id] = [];
      byItem[entry.item_id].push(entry);
    });

    const counts = {};
    Object.entries(byItem).forEach(([itemId, entries]) => {
      const sorted = [...entries].sort(
        (a, b) => new Date(a.time_created) - new Date(b.time_created)
      );
      let lapses = 0;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].srs_level < sorted[i - 1].srs_level) lapses++;
      }
      counts[itemId] = lapses;
    });

    return counts;
  }, [historyData]);

  // Items flagged as leeches (>= LEECH_THRESHOLD lapses), sorted by worst first
  const leechItems = useMemo(() => {
    return rawItems
      .filter((item) => (lapseCounts[item.id] || 0) >= LEECH_THRESHOLD)
      .map((item) => ({
        ...item,
        lapseCount: lapseCounts[item.id] || 0,
      }))
      .sort((a, b) => b.lapseCount - a.lapseCount);
  }, [rawItems, lapseCounts]);

  // Filtered + sorted items for the Items tab
  const filteredItems = useMemo(() => {
    let items = activeItems;

    if (levelFilter !== null) {
      items = items.filter(
        (item) => (item.srs?.srs_level || 0) === levelFilter
      );
    }

    if (itemSearch.trim()) {
      const q = itemSearch.trim().toLowerCase();
      items = items.filter(
        (item) =>
          (item.kanji || '').toLowerCase().includes(q) ||
          (item.kana || '').toLowerCase().includes(q) ||
          (item.english || '').toLowerCase().includes(q)
      );
    }

    const sorted = [...items];
    switch (itemSort) {
      case 'level-desc':
        sorted.sort(
          (a, b) => (b.srs?.srs_level || 0) - (a.srs?.srs_level || 0)
        );
        break;
      case 'level-asc':
        sorted.sort(
          (a, b) => (a.srs?.srs_level || 0) - (b.srs?.srs_level || 0)
        );
        break;
      case 'name-asc':
        sorted.sort((a, b) =>
          (a.kana || a.kanji || '').localeCompare(b.kana || b.kanji || '')
        );
        break;
      case 'due-first': {
        sorted.sort((a, b) => {
          const aNext = a.srs?.time_created
            ? calculateNextReviewDate(a.srs.time_created, a.srs.srs_level)
            : new Date(9999, 0);
          const bNext = b.srs?.time_created
            ? calculateNextReviewDate(b.srs.time_created, b.srs.srs_level)
            : new Date(9999, 0);
          return aNext - bNext;
        });
        break;
      }
    }

    return sorted;
  }, [activeItems, itemSearch, itemSort, levelFilter]);

  // History for selected item
  const selectedHistory = useMemo(() => {
    if (!selectedItemId || !historyData) return [];
    return historyData.filter((h) => h.item_id === selectedItemId);
  }, [selectedItemId, historyData]);

  const selectedItemFull = useMemo(() => {
    if (!selectedItemId) return null;
    return rawItems.find((i) => i.id === selectedItemId) || null;
  }, [selectedItemId, rawItems]);

  const selectedItemName = useMemo(() => {
    if (!selectedItemId) return '';
    if (selectedItemFull)
      return (
        selectedItemFull.kanji ||
        selectedItemFull.kana ||
        selectedItemFull.english ||
        ''
      );
    const fromHistory = historyData?.find((h) => h.item_id === selectedItemId);
    if (fromHistory) return getItemDisplayName(fromHistory);
    return '';
  }, [selectedItemId, selectedItemFull, historyData]);

  // Compute stats for selected item
  const selectedItemStats = useMemo(() => {
    if (!selectedItemId || !selectedHistory.length) return null;

    const sorted = [...selectedHistory].sort(
      (a, b) => new Date(a.time_created) - new Date(b.time_created)
    );

    let levelUps = 0;
    let levelDowns = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].srs_level > sorted[i - 1].srs_level) levelUps++;
      else if (sorted[i].srs_level < sorted[i - 1].srs_level) levelDowns++;
    }

    const currentLevel = sorted[sorted.length - 1].srs_level;
    const firstStudied = new Date(sorted[0].time_created);
    const lastStudied = new Date(sorted[sorted.length - 1].time_created);
    const timesStudied = sorted.length;
    const accuracy =
      timesStudied > 1
        ? Math.round((levelUps / (timesStudied - 1)) * 100)
        : 100;

    const nextReview = calculateNextReviewDate(
      lastStudied.toISOString(),
      currentLevel
    );
    const now = new Date();
    const isDue = nextReview <= now;

    let dueIn = '';
    if (isDue) {
      dueIn = 'Due now';
    } else {
      const diffMs = nextReview - now;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHr = Math.floor(diffMs / 3600000);
      const diffDay = Math.floor(diffMs / 86400000);
      const remainHr = Math.floor((diffMs % 86400000) / 3600000);
      const remainMin = Math.floor((diffMs % 3600000) / 60000);

      if (diffDay > 0) {
        dueIn = remainHr > 0 ? `${diffDay}d ${remainHr}h` : `${diffDay}d`;
      } else if (diffHr > 0) {
        dueIn = remainMin > 0 ? `${diffHr}h ${remainMin}m` : `${diffHr}h`;
      } else {
        dueIn = `${diffMin}m`;
      }
    }

    const nextReviewFormatted = nextReview.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    return {
      currentLevel,
      timesStudied,
      levelUps,
      levelDowns,
      accuracy,
      firstStudied,
      lastStudied,
      nextReview,
      nextReviewFormatted,
      isDue,
      dueIn,
    };
  }, [selectedItemId, selectedHistory]);

  const handleItemClick = (itemId) => {
    setSelectedItemId(itemId);
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setSelectedItemId(null);
  };

  const tabClass = (tab) =>
    `pb-2 pt-1 px-1 text-sm font-medium focus:outline-none border-b-2 transition-colors ${
      activeTab === tab
        ? 'text-[#e30a5f] border-[#e30a5f]'
        : 'text-black/70 dark:text-white/80 border-transparent hover:text-black dark:hover:text-white hover:border-[#e30a5f]'
    }`;

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-black/5 dark:border-white/10">
        <div className="flex items-end gap-6 -mb-px h-10">
          <button
            onClick={() => handleTabSwitch('log')}
            className={tabClass('log')}
          >
            Activity Log
          </button>
          <button
            onClick={() => handleTabSwitch('items')}
            className={tabClass('items')}
          >
            Active Items ({activeItems.length})
          </button>
          <button
            onClick={() => handleTabSwitch('leeches')}
            className={tabClass('leeches')}
          >
            <span className="flex items-center gap-1">
              <TbFlame
                className={`text-sm ${leechItems.length > 0 ? 'text-orange-500' : ''}`}
              />
              Leeches{leechItems.length > 0 ? ` (${leechItems.length})` : ''}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a2834] rounded-xl border border-gray-200 dark:border-white/10 p-3 sm:p-4 mt-3">
        {selectedItemId && selectedHistory.length > 0 && selectedItemStats ? (
          /* ===== ITEM DETAIL VIEW ===== */
          <div>
            {/* Back button + item info */}
            <div className="flex items-start gap-2 mb-3">
              <button
                onClick={() => setSelectedItemId(null)}
                className="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-white/20 dark:hover:text-gray-200 p-1.5 rounded-md transition-colors flex-shrink-0 mt-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {selectedItemFull?.kanji && (
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedItemFull.kanji}
                    </p>
                  )}
                  {selectedItemFull?.kana && (
                    <p
                      className={`${selectedItemFull?.kanji ? 'text-sm text-gray-500 dark:text-gray-400' : 'text-lg font-bold text-gray-900 dark:text-white'}`}
                    >
                      {selectedItemFull.kana}
                    </p>
                  )}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getLevelColor(selectedItemStats.currentLevel)}`}
                  >
                    L{selectedItemStats.currentLevel}
                  </span>
                </div>
                {selectedItemFull?.english && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {selectedItemFull.english}
                  </p>
                )}
                {selectedItemFull?.lexical_category && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 italic">
                    {selectedItemFull.lexical_category}
                  </p>
                )}
              </div>
            </div>

            {/* Leech warning */}
            {(lapseCounts[selectedItemId] || 0) >= LEECH_THRESHOLD && (
              <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <TbFlame className="text-orange-500 text-lg flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-orange-500">
                    Leech — {lapseCounts[selectedItemId]} lapses
                  </p>
                  <p className="text-[10px] text-orange-400/80">
                    This item keeps dropping levels. Consider reviewing the card
                    or studying it differently.
                  </p>
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Times Studied
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedItemStats.timesStudied}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Accuracy
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedItemStats.accuracy}%
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Level Ups
                </p>
                <p className="text-lg font-bold text-green-500">
                  {selectedItemStats.levelUps}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Level Downs
                </p>
                <p className="text-lg font-bold text-red-400">
                  {selectedItemStats.levelDowns}
                </p>
              </div>
            </div>

            {/* Next review */}
            <div
              className={`rounded-lg px-3 py-2 mb-3 ${selectedItemStats.isDue ? 'bg-[#e30a5f]/10' : 'bg-gray-50 dark:bg-white/5'}`}
            >
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Next Review
              </p>
              <p
                className={`text-sm font-bold ${selectedItemStats.isDue ? 'text-[#e30a5f]' : 'text-gray-900 dark:text-white'}`}
              >
                {selectedItemStats.dueIn}
              </p>
              {!selectedItemStats.isDue && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {selectedItemStats.nextReviewFormatted}
                </p>
              )}
            </div>

            {/* Date range */}
            <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 mb-3 px-1">
              <span>
                First:{' '}
                {selectedItemStats.firstStudied.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>
                Last:{' '}
                {selectedItemStats.lastStudied.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Chart */}
            <SrsItemHistoryChart
              history={selectedHistory}
              itemName={selectedItemName}
            />
          </div>
        ) : (
          /* ===== LIST VIEW ===== */
          <div className="flex flex-col h-[500px]">
            {/* Items tab: search/sort/filter (always visible) */}
            {activeTab === 'items' && (
              <div className="mb-2">
                {/* Search + Sort bar */}
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex-1 min-w-0 relative">
                    <TbSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs" />
                    <input
                      type="text"
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full text-xs pl-6 pr-2 py-1 rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#e30a5f] focus:ring-1 focus:ring-[#e30a5f]/30"
                    />
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {[
                      {
                        value: 'level-desc',
                        icon: <TbSortDescending />,
                        title: 'Level high to low',
                      },
                      {
                        value: 'level-asc',
                        icon: <TbSortAscending />,
                        title: 'Level low to high',
                      },
                      {
                        value: 'due-first',
                        icon: <TbClock />,
                        title: 'Due soonest',
                      },
                      {
                        value: 'name-asc',
                        icon: <TbSortAZ />,
                        title: 'Name A-Z',
                      },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setItemSort(opt.value)}
                        title={opt.title}
                        className={`p-1.5 rounded-md text-sm transition-colors ${
                          itemSort === opt.value
                            ? 'bg-[#e30a5f]/10 text-[#e30a5f]'
                            : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                      >
                        {opt.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level filter chips */}
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={() => setLevelFilter(null)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                      levelFilter === null
                        ? 'bg-[#e30a5f] text-white'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15'
                    }`}
                  >
                    All
                  </button>
                  {availableLevels.map((level) => (
                    <button
                      key={level}
                      onClick={() =>
                        setLevelFilter(levelFilter === level ? null : level)
                      }
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        levelFilter === level
                          ? getLevelColor(level).replace('/20', '/40') +
                            ' ring-1 ring-current'
                          : getLevelColor(level) + ' hover:opacity-80'
                      }`}
                    >
                      L{level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scrollable list */}
            <div className="overflow-y-auto scrollbar-thin flex-1 min-h-0">
              {isLoading ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
                  Loading history...
                </p>
              ) : activeTab === 'log' ? (
                activityLog.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
                    No SRS activity yet
                  </p>
                ) : (
                  <div className="relative pl-6">
                    <div
                      className="absolute left-[7px] top-0 bottom-0 w-[2px] rounded-full bg-gray-200 dark:bg-white/10"
                      style={{
                        maskImage:
                          'linear-gradient(to bottom, transparent, black 24px)',
                        WebkitMaskImage:
                          'linear-gradient(to bottom, transparent, black 24px)',
                      }}
                    />
                    <div className="space-y-1.5">
                      {activityLog.map((entry, i) => {
                        const { datepart, timepart } = formatLocalDateTime(
                          entry.time_created
                        );
                        const levelUp = entry.srs_level > entry.old_level;

                        return (
                          <button
                            key={`${entry.item_id}-${entry.time_created}-${i}`}
                            onClick={() => handleItemClick(entry.item_id)}
                            className={`group relative w-full text-left px-2.5 py-2 text-xs rounded-md border bg-gray-50/50 dark:bg-white/[0.02] transition-colors ${
                              levelUp
                                ? 'border-green-300/70 dark:border-green-500/20 hover:bg-green-50/60 dark:hover:bg-green-500/5'
                                : 'border-red-300/70 dark:border-red-400/20 hover:bg-red-50/60 dark:hover:bg-red-400/5'
                            }`}
                          >
                            <div
                              className={`absolute -left-[23.5px] top-1/2 -translate-y-1/2 flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-transform duration-200 group-hover:scale-125 ${
                                levelUp
                                  ? 'border-green-400 dark:border-green-500'
                                  : 'border-red-300 dark:border-red-400'
                              } bg-white dark:bg-[#1a2834]`}
                            >
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${
                                  levelUp ? 'bg-green-500' : 'bg-red-400'
                                }`}
                              />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {entry.displayName}
                              </span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getLevelColor(entry.old_level)}`}
                                >
                                  L{entry.old_level}
                                </span>
                                <span
                                  className={
                                    levelUp ? 'text-green-500' : 'text-red-400'
                                  }
                                >
                                  &rarr;
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getLevelColor(entry.srs_level)}`}
                                >
                                  L{entry.srs_level}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                              <span>{datepart}</span>
                              <span>&middot;</span>
                              <span>{timepart}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              ) : activeTab === 'leeches' ? (
                leechItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <TbFlame className="mx-auto text-2xl text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No leeches detected
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      Items with {LEECH_THRESHOLD}+ lapses will appear here
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {leechItems.map((item) => {
                      const level = item.srs?.srs_level || 0;
                      const displayName =
                        item.kanji || item.kana || item.english || 'Unknown';

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          className="w-full text-left px-2.5 py-2 transition-colors text-xs hover:bg-gray-100 dark:hover:bg-white/5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <TbFlame className="text-orange-500 text-sm flex-shrink-0" />
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {displayName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-500">
                                {item.lapseCount} lapses
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  LEVEL_BADGE_COLORS[level] ||
                                  'bg-gray-400/20 text-gray-400'
                                }`}
                              >
                                L{level}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : filteredItems.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
                  {activeItems.length === 0
                    ? 'No active SRS items'
                    : 'No matching items'}
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {filteredItems.map((item) => {
                    const level = item.srs?.srs_level || 0;
                    const nextReview = item.srs?.time_created
                      ? calculateNextReviewDate(item.srs.time_created, level)
                      : null;
                    const isDue = nextReview && nextReview <= new Date();
                    const displayName =
                      item.kanji || item.kana || item.english || 'Unknown';
                    const isLeech =
                      (lapseCounts[item.id] || 0) >= LEECH_THRESHOLD;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className="w-full text-left px-2.5 py-2 transition-colors text-xs hover:bg-gray-100 dark:hover:bg-white/5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isLeech && (
                              <TbFlame
                                className="text-orange-500 text-sm flex-shrink-0"
                                title="Leech"
                              />
                            )}
                            <span className="font-medium text-gray-900 dark:text-white truncate">
                              {displayName}
                            </span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                              LEVEL_BADGE_COLORS[level] ||
                              'bg-gray-400/20 text-gray-400'
                            }`}
                          >
                            L{level}
                          </span>
                        </div>
                        {nextReview && (
                          <p className="text-gray-400 dark:text-gray-500 mt-0.5">
                            {isDue
                              ? 'Due now'
                              : `Next: ${nextReview.toLocaleDateString(
                                  undefined,
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  }
                                )}`}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
