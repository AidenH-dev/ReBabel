// /components/pages/academy/sets/ViewSet/ItemsManagement/MasterItemsManagement.jsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FiGrid, FiList, FiEdit2, FiSearch, FiPlus
} from "react-icons/fi";
import { toKana } from "wanakana";

export default function MasterItemsManagement({
  items,
  setItems,
  setData,
  set_type,
  userProfile
}) {
  const router = useRouter();

  // ----- State -----
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("default");
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
  const [addItemType, setAddItemType] = useState("vocabulary");
  const [grammarTitleInputType, setGrammarTitleInputType] = useState("english");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [addItemError, setAddItemError] = useState(null);
  const [addItemSuccess, setAddItemSuccess] = useState(false);

  // Add item form state
  const [vocabForm, setVocabForm] = useState({
    english: "",
    kana: "",
    kanji: "",
    lexical_category: "",
    example_sentences: "",
    tags: ""
  });

  const [grammarForm, setGrammarForm] = useState({
    title: "",
    description: "",
    topic: "",
    notes: "",
    example_sentences: "",
    tags: ""
  });

  // ----- Filters and Search -----
  const filteredItems = items.filter(item => {
    const matchesSearch =
      searchQuery === "" ||
      item.english?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kana?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || item.type === filterType;

    return matchesSearch && matchesType;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "alpha") {
      return (a.english || a.title || "").localeCompare(b.english || b.title || "");
    }
    if (sortBy === "status") {
      const statusOrder = { known: 0, learning: 1, unknown: 2 };
      return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
    }
    return 0;
  });

  // ----- Handlers -----
  const handleEditItem = (itemId, itemType) => {
    const item = items.find(i => i.id === itemId);
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
        updates.example_sentences = JSON.stringify(editFormData.example_sentences);
      }

      if (editingItem.type === 'vocabulary') {
        if (editFormData.english !== undefined) updates.english = editFormData.english;
        if (editFormData.kana !== undefined) updates.kana = editFormData.kana;
        if (editFormData.kanji !== undefined) updates.kanji = editFormData.kanji;
        if (editFormData.lexical_category !== undefined) {
          updates.lexical_category = editFormData.lexical_category;
        }
      } else if (editingItem.type === 'grammar') {
        if (editFormData.title !== undefined) updates.title = editFormData.title;
        if (editFormData.description !== undefined) updates.description = editFormData.description;
        if (editFormData.topic !== undefined) updates.topic = editFormData.topic;
        if (editFormData.notes !== undefined) updates.notes = editFormData.notes;
      }

      const entityType = editingItem.type === 'vocabulary' ? 'vocab' : 'grammar';

      const response = await fetch('/api/database/v2/sets/update-from-full-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          entityId: editingItem.id,
          updates
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update item');
      }

      setItems(prevItems =>
        prevItems.map(item =>
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
      console.error('Error saving item:', err);
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
    setEditFormData(prev => ({
      ...prev,
      [field]: value
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
      const response = await fetch('/api/database/v2/sets/remove-item-from-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          set_id: setData.id,
          item_id: editingItem.id,
          also_delete_item: true
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to remove item from set');
      }

      setItems(prevItems => prevItems.filter(item => item.id !== editingItem.id));

      setEditingItem(null);
      setEditFormData({});
      setShowDeleteConfirm(false);
      setSaveSuccess(false);
      setSaveError(null);

    } catch (err) {
      console.error('Error deleting item:', err);
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAddItemModal = () => {
    // Pre-set item type based on set_type
    if (set_type === 'vocab') {
      setAddItemType("vocabulary");
    } else if (set_type === 'grammar') {
      setAddItemType("grammar");
    } else {
      // Legacy set (null) - default to vocabulary
      setAddItemType("vocabulary");
    }
    setShowAddItemModal(true);
    setAddItemError(null);
    setAddItemSuccess(false);
  };

  const handleCloseAddItemModal = () => {
    setShowAddItemModal(false);
    setVocabForm({
      english: "",
      kana: "",
      kanji: "",
      lexical_category: "",
      example_sentences: "",
      tags: ""
    });
    setGrammarForm({
      title: "",
      description: "",
      topic: "",
      notes: "",
      example_sentences: "",
      tags: ""
    });
    setAddItemError(null);
    setAddItemSuccess(false);
  };

  const handleVocabFormChange = (field, value) => {
    if (field === "kana" || field === "kanji") {
      setVocabForm(prev => ({ ...prev, [field]: toKana(value, { IMEMode: true }) }));
    } else {
      setVocabForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleGrammarFormChange = (field, value) => {
    if (field === "title" && grammarTitleInputType === "kana") {
      setGrammarForm(prev => ({ ...prev, [field]: toKana(value, { IMEMode: true }) }));
    } else {
      setGrammarForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleGrammarTitleTypeSwitch = (type) => {
    setGrammarTitleInputType(type);
    setGrammarForm(prev => ({ ...prev, title: "" }));
  };

  const handleAddItemSubmit = async (e) => {
    e.preventDefault();

    if (!userProfile) {
      setAddItemError("User profile not loaded");
      return;
    }

    // Validate that item type matches set type
    if (set_type === 'vocab' && addItemType !== 'vocabulary') {
      setAddItemError("Cannot add grammar items to a vocabulary-only set");
      return;
    }
    if (set_type === 'grammar' && addItemType !== 'grammar') {
      setAddItemError("Cannot add vocabulary items to a grammar-only set");
      return;
    }

    setIsAddingItem(true);
    setAddItemError(null);
    setAddItemSuccess(false);

    try {
      let item_data;
      let item_type;

      if (addItemType === "vocabulary") {
        if (!vocabForm.english.trim() && !vocabForm.kana.trim()) {
          setAddItemError("Please provide at least English or Kana");
          setIsAddingItem(false);
          return;
        }

        item_type = "vocab";
        item_data = {
          owner: userProfile.sub,
          english: vocabForm.english.trim(),
          kana: vocabForm.kana.trim(),
          kanji: vocabForm.kanji.trim(),
          lexical_category: vocabForm.lexical_category.trim(),
          example_sentences: vocabForm.example_sentences.trim(),
          tags: vocabForm.tags.trim() ? vocabForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          known_status: 'unknown',
          srs_level: 0,
          audio: ""
        };
      } else {
        if (!grammarForm.title.trim()) {
          setAddItemError("Please provide a title for the grammar item");
          setIsAddingItem(false);
          return;
        }

        item_type = "grammar";
        const exampleSentences = grammarForm.example_sentences.trim()
          ? grammarForm.example_sentences.split('\n').filter(s => s.trim()).map(s => ({
            japanese: s.trim(),
            english: ""
          }))
          : [];

        item_data = {
          owner: userProfile.sub,
          title: grammarForm.title.trim(),
          description: grammarForm.description.trim(),
          topic: grammarForm.topic.trim(),
          notes: grammarForm.notes.trim(),
          example_sentences: exampleSentences,
          tags: grammarForm.tags.trim() ? grammarForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          known_status: 'unknown',
          srs_level: 0
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
          item_data: item_data
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
      console.error('Error adding item:', err);
      setAddItemError(err.message);
    } finally {
      setIsAddingItem(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "known":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "learning":
        return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20";
      case "unknown":
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <>
      {/* Content Area */}
      <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-sm border border-black/5 dark:border-white/10
                      flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-black/5 dark:border-white/10 px-4 py-3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 dark:text-white bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
              />
            </div>

            {/* Combined row for filters and buttons - stays horizontal on mobile */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:text-white dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
              >
                <option value="default">Default Order</option>
                <option value="alpha">Alphabetical</option>
              </select>

              {/* Hide grid/list toggle on mobile */}
              <div className="hidden sm:flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-[#0f1a1f] p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded transition-colors ${viewMode === "list"
                    ? "bg-white dark:bg-[#1d2a32] text-[#e30a5f]"
                    : "text-gray-600 dark:text-gray-400"
                    }`}
                >
                  <FiList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition-colors ${viewMode === "grid"
                    ? "bg-white dark:bg-[#1d2a32] text-[#e30a5f]"
                    : "text-gray-600 dark:text-gray-400"
                    }`}
                >
                  <FiGrid className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={handleOpenAddItemModal}
                className="p-2 rounded-lg bg-[#e30a5f] text-white hover:bg-[#c00950] transition-colors"
                title="Add new item"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4">
          {sortedItems.length > 0 ? (
            viewMode === "list" ? (
              <div className="space-y-1.5">
                {sortedItems.map((item, idx) => (
                  <div key={item.id} className="group bg-gray-50 dark:bg-[#1d2a32] rounded-lg p-2 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        {item.type === "vocabulary" ? (
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {item.english}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 font-japanese">
                                  {item.kana} {item.kanji && `(${item.kanji})`}
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
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
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
                          onClick={() => handleEditItem(item.id, item.type)}
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {sortedItems.map((item, idx) => (
                  <div key={item.id} className="group bg-gray-50 dark:bg-[#1d2a32] rounded-lg p-3 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-[10px] text-gray-500 dark:text-gray-500">#{idx + 1}</span>
                    </div>

                    {item.type === "vocabulary" ? (
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
                      {item.type === "vocabulary" && item.lexical_category && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-500 truncate">
                          {item.lexical_category}
                        </span>
                      )}
                      {item.type === "grammar" && item.topic && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-500 truncate">
                          {item.topic}
                        </span>
                      )}
                      <div className="flex gap-0.5 transition-opacity ml-auto flex-shrink-0">
                        <button
                          onClick={() => handleEditItem(item.id, item.type)}
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
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Add New Item
                </h2>
                <div className="flex bg-gray-100 dark:bg-[#0f1a1f] rounded-md p-0.5">
                  {(!set_type || set_type === 'vocab') && (
                    <button
                      onClick={() => setAddItemType("vocabulary")}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${addItemType === "vocabulary"
                        ? "bg-[#e30a5f] text-white"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                    >
                      Vocabulary
                    </button>
                  )}
                  {(!set_type || set_type === 'grammar') && (
                    <button
                      onClick={() => setAddItemType("grammar")}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${addItemType === "grammar"
                        ? "bg-[#e30a5f] text-white"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                    >
                      Grammar
                    </button>
                  )}
                </div>
                {set_type && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {set_type === 'vocab' && "This set contains only vocabulary items"}
                    {set_type === 'grammar' && "This set contains only grammar items"}
                  </div>
                )}
              </div>
              <button
                onClick={handleCloseAddItemModal}
                disabled={isAddingItem}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {(addItemSuccess || addItemError) && (
              <div className="px-6 pt-4 flex-shrink-0">
                {addItemSuccess && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Item added successfully! Refreshing...
                  </div>
                )}
                {addItemError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
                    <strong>Error:</strong> {addItemError}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleAddItemSubmit} className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {addItemType === "vocabulary" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          English
                        </label>
                        <input
                          type="text"
                          value={vocabForm.english}
                          onChange={(e) => handleVocabFormChange("english", e.target.value)}
                          placeholder="English term"
                          className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Kana <span className="text-gray-500 dark:text-gray-400">(type in romaji)</span>
                        </label>
                        <input
                          type="text"
                          value={vocabForm.kana}
                          onChange={(e) => handleVocabFormChange("kana", e.target.value)}
                          placeholder="ka → か, shi → し"
                          className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] font-japanese"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Kanji <span className="text-gray-500 dark:text-gray-400">(paste)</span>
                        </label>
                        <input
                          type="text"
                          value={vocabForm.kanji}
                          onChange={(e) => handleVocabFormChange("kanji", e.target.value)}
                          placeholder="漢字"
                          className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] font-japanese"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Category
                        </label>
                        <select
                          value={vocabForm.lexical_category}
                          onChange={(e) => handleVocabFormChange("lexical_category", e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                        >
                          <option value="">Select category</option>
                          <option value="noun">Noun</option>
                          <option value="verb">Verb</option>
                          <option value="adjective">Adjective</option>
                          <option value="adverb">Adverb</option>
                          <option value="particle">Particle</option>
                          <option value="expression">Expression</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Example Sentences <span className="text-gray-500">(one per line)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={vocabForm.example_sentences}
                        onChange={(e) => handleVocabFormChange("example_sentences", e.target.value)}
                        placeholder="Example sentences"
                        className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tags <span className="text-gray-500">(comma-separated)</span>
                      </label>
                      <input
                        type="text"
                        value={vocabForm.tags}
                        onChange={(e) => handleVocabFormChange("tags", e.target.value)}
                        placeholder="tag1, tag2, tag3"
                        className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                          <span>Title *</span>
                          <div className="flex gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleGrammarTitleTypeSwitch("english")}
                              className={`px-1 py-0.5 text-[10px] rounded transition-colors ${grammarTitleInputType === "english"
                                  ? "bg-[#e30a5f] text-white"
                                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                                }`}
                            >
                              En
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGrammarTitleTypeSwitch("kana")}
                              className={`px-1 py-0.5 text-[10px] rounded transition-colors ${grammarTitleInputType === "kana"
                                  ? "bg-[#e30a5f] text-white"
                                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                                }`}
                            >
                              あ
                            </button>
                          </div>
                        </label>
                        <input
                          type="text"
                          value={grammarForm.title}
                          onChange={(e) => handleGrammarFormChange("title", e.target.value)}
                          placeholder={grammarTitleInputType === "kana"
                            ? "Type in romaji"
                            : "Grammar pattern name"}
                          className={`w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] ${grammarTitleInputType === "kana" ? "font-japanese" : ""
                            }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Topic
                        </label>
                        <input
                          type="text"
                          value={grammarForm.topic}
                          onChange={(e) => handleGrammarFormChange("topic", e.target.value)}
                          placeholder="e.g., N5, JLPT"
                          className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={grammarForm.description}
                        onChange={(e) => handleGrammarFormChange("description", e.target.value)}
                        placeholder="Brief explanation"
                        className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={grammarForm.notes}
                        onChange={(e) => handleGrammarFormChange("notes", e.target.value)}
                        placeholder="Additional notes"
                        className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Example Sentences <span className="text-gray-500">(one per line)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={grammarForm.example_sentences}
                        onChange={(e) => handleGrammarFormChange("example_sentences", e.target.value)}
                        placeholder="Example sentences"
                        className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tags <span className="text-gray-500">(comma-separated)</span>
                      </label>
                      <input
                        type="text"
                        value={grammarForm.tags}
                        onChange={(e) => handleGrammarFormChange("tags", e.target.value)}
                        placeholder="tag1, tag2, tag3"
                        className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseAddItemModal}
                  disabled={isAddingItem}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingItem}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#e30a5f] hover:bg-[#c00950] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAddingItem ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    <>
                      <FiPlus className="w-4 h-4" /> Add to Set
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit {editingItem.type === 'vocabulary' ? 'Vocabulary' : 'Grammar'} Item
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                  ID: {editingItem.id}
                </p>
              </div>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving || isDeleting}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {(saveSuccess || saveError || deleteError) && (
              <div className="px-6 pt-4 flex-shrink-0">
                {saveSuccess && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Changes saved successfully!
                  </div>
                )}
                {saveError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
                    <strong>Error:</strong> {saveError}
                  </div>
                )}
                {deleteError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
                    <strong>Delete Error:</strong> {deleteError}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {editingItem.type === 'vocabulary' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        English
                      </label>
                      <input
                        type="text"
                        value={editFormData.english || ''}
                        onChange={(e) => handleFieldChange('english', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Kana
                        </label>
                        <input
                          type="text"
                          value={editFormData.kana || ''}
                          onChange={(e) => handleFieldChange('kana', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-japanese focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Kanji
                        </label>
                        <input
                          type="text"
                          value={editFormData.kanji || ''}
                          onChange={(e) => handleFieldChange('kanji', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-japanese focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Lexical Category
                      </label>
                      <input
                        type="text"
                        value={editFormData.lexical_category || ''}
                        onChange={(e) => handleFieldChange('lexical_category', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                        placeholder="e.g., noun, verb, adjective"
                      />
                    </div>
                  </>
                )}

                {editingItem.type === 'grammar' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editFormData.title || ''}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editFormData.description || ''}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f] resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Topic
                      </label>
                      <input
                        type="text"
                        value={editFormData.topic || ''}
                        onChange={(e) => handleFieldChange('topic', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={editFormData.notes || ''}
                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f] resize-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Example Sentences
                    <span className="text-xs text-gray-500 ml-2">(one per line)</span>
                  </label>
                  <textarea
                    value={Array.isArray(editFormData.example_sentences)
                      ? editFormData.example_sentences.join('\n')
                      : ''}
                    onChange={(e) => handleFieldChange('example_sentences', e.target.value.split('\n').filter(s => s.trim()))}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-japanese focus:outline-none focus:ring-2 focus:ring-[#e30a5f] resize-none"
                    placeholder="Enter example sentences, one per line"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags
                    <span className="text-xs text-gray-500 ml-2">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(editFormData.tags) ? editFormData.tags.join(', ') : ''}
                    onChange={(e) => handleFieldChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <button
                onClick={handleShowDeleteConfirm}
                disabled={isSaving || isDeleting}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove from Set
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving || isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#e30a5f] hover:bg-[#c00950] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Confirm Deletion
              </h3>
            </div>

            <div className="px-6 py-4">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Are you sure you want to remove this item from the set?
              </p>
              {editingItem && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-[#0f1a1f] rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {editingItem.type === 'vocabulary' ? editingItem.english : editingItem.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                    ID: {editingItem.id}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Removing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Yes, Remove Item
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}