import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  FiGrid,
  FiList,
  FiEdit2,
  FiSearch,
  FiPlus,
  FiTag,
} from 'react-icons/fi';
import { MdDragHandle } from 'react-icons/md';
import CustomSelect from '@/components/ui/CustomSelect';
import { toKana } from 'wanakana';
import { clientLog } from '@/lib/clientLogger';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import SortableItem from '@/components/SetViewer/ItemsManagement/SortableItem';
import AddItemModal from '@/components/SetViewer/ItemsManagement/modals/AddItemModal';
import EditItemModal from '@/components/SetViewer/ItemsManagement/modals/EditItemModal';
import DeleteItemConfirmModal from '@/components/SetViewer/ItemsManagement/modals/DeleteItemConfirmModal';
import ViewItemModal from '@/components/SetViewer/ItemsManagement/modals/ViewItemModal';

export default function MasterItemsManagement({
  items,
  setItems,
  setData,
  setSetData,
  set_type,
  userProfile,
  onOpenAutoCategorizeModal,
}) {
  const router = useRouter();

  // ----- State -----
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [selectedItems, setSelectedItems] = useState([]);

  // Edit item modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Add item modal state
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // View item modal state
  const [viewingItem, setViewingItem] = useState(null);
  const [addItemType, setAddItemType] = useState('vocabulary');
  const [grammarTitleInputType, setGrammarTitleInputType] = useState('english');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [addItemError, setAddItemError] = useState(null);
  const [addItemSuccess, setAddItemSuccess] = useState(false);

  // Auto-categorize state
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  const [autoCategorizeResult, setAutoCategorizeResult] = useState(null);
  const [autoCategorizeDismissed, setAutoCategorizeDismissed] = useState(false);

  // Drag-to-reorder state
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showSrsWarn, setShowSrsWarn] = useState(false);
  const [srsWarnDismissed, setSrsWarnDismissed] = useState(false);

  // Add item form state
  const [vocabForm, setVocabForm] = useState({
    english: '',
    kana: '',
    kanji: '',
    lexical_category: '',
    example_sentences: '',
    tags: '',
  });

  const [grammarForm, setGrammarForm] = useState({
    title: '',
    description: '',
    topic: '',
    notes: '',
    example_sentences: '',
    tags: '',
  });

  // ----- Filters and Search -----
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.english?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kana?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || item.type === filterType;

    return matchesSearch && matchesType;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'alpha') {
      return (a.english || a.title || '').localeCompare(
        b.english || b.title || ''
      );
    }
    if (sortBy === 'status') {
      const statusOrder = { known: 0, learning: 1, unknown: 2 };
      return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
    }
    return 0;
  });

  // ----- Drag-to-reorder -----
  const canReorder =
    viewMode === 'list' &&
    sortBy === 'default' &&
    searchQuery === '' &&
    filterType === 'all';

  const dragEnabled = isReorderMode && canReorder;

  // Exit reorder mode if conditions that allow it change
  useEffect(() => {
    if (!canReorder) setIsReorderMode(false);
  }, [canReorder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedItems.findIndex((i) => i.id === active.id);
    const newIndex = sortedItems.findIndex((i) => i.id === over.id);
    const previousOrder = [...items];
    const newOrder = arrayMove(sortedItems, oldIndex, newIndex);

    setItems(newOrder);

    if (setData?.srsEnabled && !srsWarnDismissed) {
      setShowSrsWarn(true);
    }

    fetch('/api/database/v2/sets/reorder-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setId: setData.id,
        itemIds: newOrder.map((i) => i.id),
      }),
    })
      .then((res) => {
        if (!res.ok) setItems(previousOrder);
      })
      .catch(() => {
        setItems(previousOrder);
      });
  };

  // ----- Handlers -----
  const handleEditItem = (itemId, itemType) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      setEditingItem(item);
      setEditFormData({ ...item });
      setSaveError(null);
      setSaveSuccess(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updates = {};

      if (editFormData.status !== undefined) {
        updates.known_status = editFormData.status;
      }
      if (editFormData.srs_level !== undefined) {
        updates.srs_level = editFormData.srs_level.toString();
      }
      if (editFormData.tags !== undefined) {
        updates.tags = JSON.stringify(editFormData.tags);
      }
      if (editFormData.example_sentences !== undefined) {
        updates.example_sentences = JSON.stringify(
          editFormData.example_sentences
        );
      }

      if (editingItem.type === 'vocabulary') {
        if (editFormData.english !== undefined)
          updates.english = editFormData.english;
        if (editFormData.kana !== undefined) updates.kana = editFormData.kana;
        if (editFormData.kanji !== undefined)
          updates.kanji = editFormData.kanji;
        if (editFormData.lexical_category !== undefined) {
          updates.lexical_category = editFormData.lexical_category;
        }
      } else if (editingItem.type === 'grammar') {
        if (editFormData.title !== undefined)
          updates.title = editFormData.title;
        if (editFormData.description !== undefined)
          updates.description = editFormData.description;
        if (editFormData.topic !== undefined)
          updates.topic = editFormData.topic;
        if (editFormData.notes !== undefined)
          updates.notes = editFormData.notes;
      }

      const entityType =
        editingItem.type === 'vocabulary' ? 'vocab' : 'grammar';

      const response = await fetch(
        '/api/database/v2/sets/update-from-full-set',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entityType,
            entityId: editingItem.id,
            updates,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update item');
      }

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === editingItem.id ? { ...editFormData } : item
        )
      );

      setSaveSuccess(true);

      setTimeout(() => {
        setEditingItem(null);
        setEditFormData({});
        setSaveSuccess(false);
      }, 1000);
    } catch (err) {
      clientLog.error('set.item_operation_failed', {
        operation: 'save',
        error: err?.message || String(err),
      });
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditFormData({});
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleFieldChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleShowDeleteConfirm = () => {
    setShowDeleteConfirm(true);
    setDeleteError(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteError(null);
  };

  const handleDeleteItem = async () => {
    if (!editingItem || !setData.id) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(
        '/api/database/v2/sets/remove-item-from-set',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            set_id: setData.id,
            item_id: editingItem.id,
            also_delete_item: true,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to remove item from set');
      }

      setItems((prevItems) =>
        prevItems.filter((item) => item.id !== editingItem.id)
      );

      setEditingItem(null);
      setEditFormData({});
      setShowDeleteConfirm(false);
      setSaveSuccess(false);
      setSaveError(null);
    } catch (err) {
      clientLog.error('set.item_operation_failed', {
        operation: 'delete',
        error: err?.message || String(err),
      });
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAddItemModal = () => {
    // Pre-set item type based on set_type
    if (set_type === 'vocab') {
      setAddItemType('vocabulary');
    } else if (set_type === 'grammar') {
      setAddItemType('grammar');
    } else {
      // Legacy set (null) - default to vocabulary
      setAddItemType('vocabulary');
    }
    setShowAddItemModal(true);
    setAddItemError(null);
    setAddItemSuccess(false);
  };

  const handleCloseAddItemModal = () => {
    setShowAddItemModal(false);
    setVocabForm({
      english: '',
      kana: '',
      kanji: '',
      lexical_category: '',
      example_sentences: '',
      tags: '',
    });
    setGrammarForm({
      title: '',
      description: '',
      topic: '',
      notes: '',
      example_sentences: '',
      tags: '',
    });
    setAddItemError(null);
    setAddItemSuccess(false);
  };

  const handleVocabFormChange = (field, value) => {
    if (field === 'kana' || field === 'kanji') {
      setVocabForm((prev) => ({
        ...prev,
        [field]: toKana(value, { IMEMode: true }),
      }));
    } else {
      setVocabForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleGrammarFormChange = (field, value) => {
    if (field === 'title' && grammarTitleInputType === 'kana') {
      setGrammarForm((prev) => ({
        ...prev,
        [field]: toKana(value, { IMEMode: true }),
      }));
    } else {
      setGrammarForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleGrammarTitleTypeSwitch = (type) => {
    setGrammarTitleInputType(type);
    setGrammarForm((prev) => ({ ...prev, title: '' }));
  };

  const handleAddItemSubmit = async (e) => {
    e.preventDefault();

    if (!userProfile) {
      setAddItemError('User profile not loaded');
      return;
    }

    // Validate that item type matches set type
    if (set_type === 'vocab' && addItemType !== 'vocabulary') {
      setAddItemError('Cannot add grammar items to a vocabulary-only set');
      return;
    }
    if (set_type === 'grammar' && addItemType !== 'grammar') {
      setAddItemError('Cannot add vocabulary items to a grammar-only set');
      return;
    }

    setIsAddingItem(true);
    setAddItemError(null);
    setAddItemSuccess(false);

    try {
      let item_data;
      let item_type;

      if (addItemType === 'vocabulary') {
        if (!vocabForm.english.trim() && !vocabForm.kana.trim()) {
          setAddItemError('Please provide at least English or Kana');
          setIsAddingItem(false);
          return;
        }

        item_type = 'vocab';
        item_data = {
          owner: userProfile.sub,
          english: vocabForm.english.trim(),
          kana: vocabForm.kana.trim(),
          kanji: vocabForm.kanji.trim(),
          lexical_category: vocabForm.lexical_category.trim(),
          example_sentences: vocabForm.example_sentences.trim(),
          tags: vocabForm.tags.trim()
            ? vocabForm.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
          known_status: 'unknown',
          srs_level: 0,
          audio: '',
        };
      } else {
        if (!grammarForm.title.trim()) {
          setAddItemError('Please provide a title for the grammar item');
          setIsAddingItem(false);
          return;
        }

        item_type = 'grammar';
        const exampleSentences = grammarForm.example_sentences.trim()
          ? grammarForm.example_sentences
              .split('\n')
              .filter((s) => s.trim())
              .map((s) => ({
                japanese: s.trim(),
                english: '',
              }))
          : [];

        item_data = {
          owner: userProfile.sub,
          title: grammarForm.title.trim(),
          description: grammarForm.description.trim(),
          topic: grammarForm.topic.trim(),
          notes: grammarForm.notes.trim(),
          example_sentences: exampleSentences,
          tags: grammarForm.tags.trim()
            ? grammarForm.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
          known_status: 'unknown',
          srs_level: 0,
        };
      }

      const response = await fetch('/api/database/v2/sets/add-item-to-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          set_id: setData.id,
          item_type: item_type,
          item_data: item_data,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add item to set');
      }

      setAddItemSuccess(true);

      // Refresh the page data
      setTimeout(() => {
        router.reload();
      }, 1000);
    } catch (err) {
      clientLog.error('set.item_operation_failed', {
        operation: 'add',
        error: err?.message || String(err),
      });
      setAddItemError(err.message);
    } finally {
      setIsAddingItem(false);
    }
  };

  // Auto-categorize
  const hasUncategorizedVocab = items.some(
    (item) =>
      item.type === 'vocabulary' &&
      (!item.lexical_category || item.lexical_category.trim() === '')
  );

  const handleAutoCategorize = async () => {
    if (!setData?.id) return;

    setIsAutoCategorizing(true);
    setAutoCategorizeResult(null);

    try {
      const response = await fetch('/api/database/v2/sets/auto-categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ set_id: setData.id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to auto-categorize');
      }

      // Update local items state with returned categories
      if (result.results && result.results.length > 0) {
        const categoryMap = {};
        for (const r of result.results) {
          categoryMap[r.entity_id] = r.lexical_category;
        }

        setItems((prevItems) =>
          prevItems.map((item) =>
            categoryMap[item.id]
              ? { ...item, lexical_category: categoryMap[item.id] }
              : item
          )
        );
      }

      // Build result message with optional kanji warning
      let resultMsg = `Categorized ${result.categorized_count} item${result.categorized_count !== 1 ? 's' : ''}`;
      const hasKanjiWarning = result.missing_kanji_count > 0;
      if (hasKanjiWarning) {
        resultMsg += `. ${result.missing_kanji_count} item${result.missing_kanji_count !== 1 ? 's' : ''} missing kanji -- adding kanji improves accuracy for conjugation practice.`;
      }
      setAutoCategorizeResult(resultMsg);

      // Persist auto_categorized flag on the set and update local state
      fetch('/api/database/v2/sets/update-from-full-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'set',
          entityId: setData.id,
          updates: { auto_categorized: 'true' },
        }),
      }).catch(() => {});

      // Update local setData so banner condition re-evaluates
      if (setSetData) {
        setSetData((prev) => ({ ...prev, auto_categorized: true }));
      }

      // Keep the banner visible longer when there's a kanji warning
      setTimeout(
        () => setAutoCategorizeDismissed(true),
        hasKanjiWarning ? 6000 : 2500
      );
    } catch (err) {
      clientLog.error('set.item_operation_failed', {
        operation: 'categorize',
        error: err?.message || String(err),
      });
      setAutoCategorizeResult(`Error: ${err.message}`);
      setTimeout(() => setAutoCategorizeResult(null), 5000);
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'known':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'learning':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'unknown':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <>
      {/* Content Area */}
      <div
        className="bg-surface-card rounded-lg shadow-sm border border-border-default
                      flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        {/* Toolbar */}
        <div className="border-b border-border-default px-4 py-3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 dark:text-white bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
              />
            </div>

            {/* Combined row for filters and buttons - stays horizontal on mobile */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <CustomSelect
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                options={[
                  { value: 'default', label: 'Default Order' },
                  { value: 'alpha', label: 'Alphabetical' },
                ]}
              />

              {/* Hide grid/list toggle on mobile */}
              <div className="hidden sm:flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-surface-deep p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-surface-elevated text-brand-pink'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <FiList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-surface-elevated text-brand-pink'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <FiGrid className="w-4 h-4" />
                </button>
              </div>

              {canReorder && (
                <button
                  onClick={() => setIsReorderMode((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isReorderMode
                      ? 'bg-brand-pink text-white hover:bg-[#c00950]'
                      : 'bg-gray-100 dark:bg-surface-deep text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title={isReorderMode ? 'Exit reorder mode' : 'Reorder items'}
                >
                  <MdDragHandle className="w-4 h-4" />
                  {isReorderMode ? 'Done' : 'Reorder'}
                </button>
              )}

              <button
                onClick={handleOpenAddItemModal}
                className="p-2 rounded-lg bg-brand-pink text-white hover:bg-[#c00950] transition-colors"
                title="Add new item"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {(set_type === 'vocab' || !set_type) &&
          items.length > 0 &&
          !autoCategorizeDismissed &&
          !setData?.auto_categorized && (
            <div className="mx-2 sm:mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-pink/10 dark:bg-brand-pink/15 border border-brand-pink/20">
              <FiTag className="w-4 h-4 text-brand-pink flex-shrink-0" />
              <p className="flex-1 min-w-0 text-xs text-gray-700 dark:text-gray-300">
                <span className="sm:hidden">
                  Items need categorization for practice.
                </span>
                <span className="hidden sm:inline">
                  {isAutoCategorizing
                    ? 'Categorizing items...'
                    : autoCategorizeResult ||
                      'Some items are missing categories. Items with kanji are categorized more accurately.'}
                </span>
              </p>
              {!isAutoCategorizing && !autoCategorizeResult && (
                <button
                  onClick={onOpenAutoCategorizeModal}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-brand-pink hover:bg-[#c00950] rounded-md transition-colors flex-shrink-0 whitespace-nowrap"
                >
                  Auto-categorize
                </button>
              )}
              <button
                onClick={() => setAutoCategorizeDismissed(true)}
                disabled={isAutoCategorizing}
                className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 disabled:opacity-50"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

        {/* Items List */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4">
          {sortedItems.length > 0 ? (
            viewMode === 'list' ? (
              <>
                {showSrsWarn && (
                  <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-200 text-xs flex items-start justify-between gap-2">
                    <span>
                      Reordering changes which new items you&apos;ll study next.
                      Items already in your review cycle are unaffected.
                    </span>
                    <button
                      onClick={() => {
                        setShowSrsWarn(false);
                        setSrsWarnDismissed(true);
                      }}
                      className="flex-shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 leading-none"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {dragEnabled ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={sortedItems.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1.5">
                        {sortedItems.map((item, idx) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            idx={idx}
                            onView={setViewingItem}
                            onEdit={handleEditItem}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="space-y-1.5">
                    {sortedItems.map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => setViewingItem(item)}
                        className="group bg-gray-50 dark:bg-surface-elevated rounded-lg p-2 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer"
                      >
                        <div className="flex items-start gap-2 w-full">
                          <div className="flex-shrink-0 w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-400">
                            {idx + 1}
                          </div>

                          <div className="flex-1 min-w-0 overflow-hidden">
                            {item.type === 'vocabulary' ? (
                              <div className="w-full">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {item.english}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 font-japanese">
                                      {item.kana}{' '}
                                      {item.kanji && `(${item.kanji})`}
                                    </div>
                                  </div>
                                  {item.lexical_category && (
                                    <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                      {item.lexical_category}
                                    </span>
                                  )}
                                </div>
                                {item.example_sentences?.length > 0 && (
                                  <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-500 italic truncate">
                                    {item.example_sentences[0]}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {item.title}
                                    </div>
                                    {item.description && (
                                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                        {item.description}
                                      </div>
                                    )}
                                  </div>
                                  {item.topic && (
                                    <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                      {item.topic}
                                    </span>
                                  )}
                                </div>
                                {item.example_sentences?.length > 0 && (
                                  <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-500 italic truncate">
                                    {item.example_sentences[0]}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 transition-opacity flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditItem(item.id, item.type);
                              }}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                              title={`Edit (ID: ${item.id})`}
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {sortedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => setViewingItem(item)}
                    className="group bg-gray-50 dark:bg-surface-elevated rounded-lg p-3 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-[10px] text-gray-500 dark:text-gray-500">
                        #{idx + 1}
                      </span>
                    </div>

                    {item.type === 'vocabulary' ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-0.5 truncate">
                          {item.english}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-japanese truncate">
                          {item.kana}
                        </div>
                        {item.kanji && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 font-japanese truncate">
                            {item.kanji}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-0.5 truncate">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2">
                            {item.description}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      {item.type === 'vocabulary' && item.lexical_category && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-500 truncate">
                          {item.lexical_category}
                        </span>
                      )}
                      {item.type === 'grammar' && item.topic && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-500 truncate">
                          {item.topic}
                        </span>
                      )}
                      <div className="flex gap-0.5 transition-opacity ml-auto flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditItem(item.id, item.type);
                          }}
                          className="p-0.5 rounded hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
                          title={`Edit (ID: ${item.id})`}
                        >
                          <FiEdit2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FiSearch className="mx-auto text-3xl mb-3 opacity-50" />
              <p>No items found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try adjusting your search</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={showAddItemModal}
        addItemType={addItemType}
        set_type={set_type}
        vocabForm={vocabForm}
        grammarForm={grammarForm}
        grammarTitleInputType={grammarTitleInputType}
        isAdding={isAddingItem}
        error={addItemError}
        success={addItemSuccess}
        onTypeChange={setAddItemType}
        onVocabFormChange={handleVocabFormChange}
        onGrammarFormChange={handleGrammarFormChange}
        onGrammarTitleTypeSwitch={handleGrammarTitleTypeSwitch}
        onSubmit={handleAddItemSubmit}
        onClose={handleCloseAddItemModal}
      />

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          isOpen={!!editingItem}
          editingItem={editingItem}
          editFormData={editFormData}
          onFieldChange={handleFieldChange}
          onSave={handleSaveEdit}
          onShowDeleteConfirm={handleShowDeleteConfirm}
          onClose={handleCancelEdit}
          isSaving={isSaving}
          isDeleting={isDeleting}
          saveError={saveError}
          saveSuccess={saveSuccess}
          deleteError={deleteError}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteItemConfirmModal
          isOpen={!!showDeleteConfirm}
          isDeleting={isDeleting}
          error={deleteError}
          editingItem={editingItem}
          onConfirm={handleDeleteItem}
          onClose={handleCancelDelete}
        />
      )}

      {/* View Item Modal */}
      {viewingItem && (
        <ViewItemModal
          isOpen={!!viewingItem}
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={handleEditItem}
        />
      )}
    </>
  );
}
