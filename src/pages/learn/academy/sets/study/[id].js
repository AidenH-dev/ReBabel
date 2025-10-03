// pages/learn/academy/sets/study/[id].js
import Head from "next/head";
import MainSidebar from "../../../../../components/Sidebars/AcademySidebar";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FaPlay
} from "react-icons/fa";
import {
  FiGrid, FiList, FiEdit2, FiSearch, FiMoreVertical
} from "react-icons/fi";
import { MdQuiz } from "react-icons/md";
import { TbCards } from "react-icons/tb";
import { HiOutlineDownload } from "react-icons/hi";

// ---------- CSV utils ----------
function escapeCSVCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const needsQuotes = /[",\n]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function toSlug(s) {
  return (s || "set")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
}

function buildCSV(items) {
  const headers = [
    "id",
    "type",
    "english",
    "kana",
    "kanji",
    "lexical_category",
    "title",
    "description",
    "topic",
    "status",
    "srs_level",
    "example_sentences",
    "tags"
  ];

  const rows = items.map((it) => {
    const ex = Array.isArray(it.example_sentences) ? it.example_sentences : [];
    const exJoined = ex.join(" || ");
    const tagsJoined = Array.isArray(it.tags) ? it.tags.join(" | ") : "";

    return [
      it.id ?? "",
      it.type ?? "",
      it.english ?? "",
      it.kana ?? "",
      it.kanji ?? "",
      it.lexical_category ?? "",
      it.title ?? "",
      it.description ?? "",
      it.topic ?? "",
      it.status ?? "",
      it.srs_level ?? "",
      exJoined,
      tagsJoined
    ];
  });

  const lines = [
    headers.map(escapeCSVCell).join(","),
    ...rows.map((r) => r.map(escapeCSVCell).join(","))
  ];

  return "\uFEFF" + lines.join("\r\n");
}

export default function ViewSet() {
  const router = useRouter();
  const { id } = router.query;

  // ----- State -----
  const [activeTab, setActiveTab] = useState("items");
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [showOptions, setShowOptions] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit item modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit set modal state
  const [editingSet, setEditingSet] = useState(false);
  const [setFormData, setSetFormData] = useState({});
  const [isSavingSet, setIsSavingSet] = useState(false);
  const [saveSetError, setSaveSetError] = useState(null);
  const [saveSetSuccess, setSaveSetSuccess] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [showDeleteSetConfirm, setShowDeleteSetConfirm] = useState(false);
  const [isDeletingSet, setIsDeletingSet] = useState(false);
  const [deleteSetError, setDeleteSetError] = useState(null);

  const [setData, setSetData] = useState({
    id: id,
    title: "",
    description: "",
    owner: "",
    dateCreated: "",
    lastStudied: "",
    tags: [],
    itemCount: 0,
    studyStats: {
      known: 0,
      learning: 0,
      unknown: 0,
      lastScore: 0
    }
  });

  const [items, setItems] = useState([]);

  // ----- Fetch Data from API -----
  useEffect(() => {
    if (!id) return;

    const fetchSetData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/database/v2/sets/retrieve-set/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch set: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load set data');
        }

        console.log("Set Result: ", result)

        const apiData = result.data;
        const setInfo = apiData.data?.set;
        const setItemsAPI = apiData.data?.items || [];
        const metadata = apiData.metadata;

        if (!setInfo) {
          throw new Error('Invalid set data structure received from API');
        }

        setSetData({
          id: apiData.set_id,
          title: setInfo.title || "Untitled Set",
          description: setInfo.description?.toString() || "",
          owner: setInfo.owner || "",
          dateCreated: setInfo.date_created || "",
          lastStudied: setInfo.last_studied || "",
          tags: Array.isArray(setInfo.tags) ? setInfo.tags : [],
          itemCount: metadata?.total_items || 0,
          studyStats: {
            known: 0,
            learning: 0,
            unknown: 0,
            lastScore: 0
          }
        });

        const transformedItems = Array.isArray(setItemsAPI) ? setItemsAPI.map((item, index) => {
          if (item.type === 'vocab' || item.type === 'vocabulary') {
            return {
              id: item.id || `temp-vocab-${index}`,
              type: 'vocabulary',
              english: item.english || "",
              kana: item.kana || "",
              kanji: item.kanji || "",
              lexical_category: item.lexical_category || "",
              status: item.known_status || "unknown",
              srs_level: item.srs_level || 0,
              example_sentences: Array.isArray(item.example_sentences)
                ? item.example_sentences
                : [item.example_sentences].filter(Boolean),
              tags: Array.isArray(item.tags) ? item.tags : []
            };
          } else if (item.type === 'grammar') {
            return {
              id: item.id || `temp-grammar-${index}`,
              type: 'grammar',
              title: item.title || "",
              description: item.description || "",
              topic: item.topic || "",
              status: item.known_status || "unknown",
              srs_level: item.srs_level || 0,
              notes: item.notes || "",
              example_sentences: Array.isArray(item.example_sentences)
                ? item.example_sentences.map(ex =>
                  typeof ex === 'string' ? ex : `${ex.japanese || ''} (${ex.english || ''})`
                )
                : [],
              tags: Array.isArray(item.tags) ? item.tags : []
            };
          }
          return null;
        }).filter(Boolean) : [];

        setItems(transformedItems);

      } catch (err) {
        console.error('Error fetching set:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetData();
  }, [id]);

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
  const handleStartQuiz = () => {
    router.push(`/learn/academy/sets/study/${id}/quiz`);
  };

  const handleStartFlashcards = () => {
    router.push(`/learn/academy/sets/study/${id}/flashcards`);
  };

  const handleEditItem = (itemId, itemType) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setEditingItem(item);
      setEditFormData({ ...item });
      setSaveError(null);
      setSaveSuccess(false);
    }
  };

  const handleEditSetDetails = () => {
    setEditingSet(true);
    setSetFormData({
      title: setData.title,
      description: setData.description,
      tags: setData.tags
    });
    setSaveSetError(null);
    setSaveSetSuccess(false);
    setShowOptions(false);
  };

  const handleSaveSetDetails = async () => {
    if (!setData.id) return;

    setIsSavingSet(true);
    setSaveSetError(null);
    setSaveSetSuccess(false);

    try {
      const updates = {};

      if (setFormData.title !== undefined) {
        updates.title = setFormData.title;
      }
      if (setFormData.description !== undefined) {
        updates.description = setFormData.description;
      }
      if (setFormData.tags !== undefined) {
        updates.tags = JSON.stringify(setFormData.tags);
      }

      const response = await fetch('/api/database/v2/sets/update-from-full-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType: 'set',
          entityId: setData.id,
          updates
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update set');
      }

      setSetData(prev => ({
        ...prev,
        title: setFormData.title,
        description: setFormData.description,
        tags: setFormData.tags
      }));

      setSaveSetSuccess(true);

      setTimeout(() => {
        setEditingSet(false);
        setSetFormData({});
        setSaveSetSuccess(false);
      }, 1000);

    } catch (err) {
      console.error('Error saving set:', err);
      setSaveSetError(err.message);
    } finally {
      setIsSavingSet(false);
    }
  };

  const handleCancelSetEdit = () => {
    setEditingSet(false);
    setSetFormData({});
    setSaveSetError(null);
    setSaveSetSuccess(false);
  };

  const handleSetFieldChange = (field, value) => {
    setSetFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  const handleShowDeleteSetConfirm = () => {
    setShowDeleteSetConfirm(true);
    setDeleteSetError(null);
  };

  const handleCancelDeleteSet = () => {
    setShowDeleteSetConfirm(false);
    setDeleteSetError(null);
  };

  const handleDeleteSet = async () => {
    if (!setData.id) return;

    setIsDeletingSet(true);
    setDeleteSetError(null);

    try {
      const response = await fetch('/api/database/v2/sets/delete-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          set_id: setData.id,
          also_delete_items: false, // Keep items in library by default
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete set');
      }

      // Redirect to sets list after successful deletion
      router.push('/learn/academy/sets');

    } catch (err) {
      console.error('Error deleting set:', err);
      setDeleteSetError(err.message);
    } finally {
      setIsDeletingSet(false);
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

      setSetData(prev => ({
        ...prev,
        itemCount: Math.max(0, prev.itemCount - 1)
      }));

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

  const handleExportCSV = () => {
    try {
      if (!items.length) {
        alert("No items to export.");
        return;
      }
      const csv = buildCSV(items);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = toSlug(setData.title) || "set";
      a.href = url;
      a.download = `${base}-${setData.id || "id"}-items.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowOptions(false);
    } catch (e) {
      console.error("CSV export failed:", e);
      alert("Failed to export CSV.");
    }
  };

  if (error) {
    return (
      <div className="flex h-screen min-h-0 bg-gray-50 dark:bg-[#141f25]">
        <MainSidebar />
        <main className="ml-auto flex-1 px-4 sm:px-6 py-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
              Error Loading Set
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => router.push('/learn/academy/sets')}
              className="px-4 py-2 bg-[#e30a5f] text-white rounded-lg hover:bg-[#c00950] transition-colors"
            >
              Back to Sets
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen min-h-0 bg-gray-50 dark:bg-[#141f25]">
      <MainSidebar />

      <main className="ml-auto flex-1 px-4 sm:px-6 py-4 flex flex-col min-h-0 overflow-hidden">
        <Head>
          <title>{setData.title} - View Set</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="w-full max-w-6xl mx-auto flex-1 min-h-0 flex flex-col">
          {/* Header */}
          <div className="mb-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <Link href="/learn/academy/sets" className="hover:text-[#e30a5f] transition-colors">
                Sets
              </Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white truncate max-w-xs">
                {setData.title}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {setData.title}
                </h1>
                {setData.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {setData.description}
                  </p>
                )}

                {setData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {setData.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleEditSetDetails}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Edit Set"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="More"
                  >
                    <FiMoreVertical className="w-4 h-4" />
                  </button>
                  {showOptions && (
                    <div className="absolute right-0 dark:text-white mt-1 w-56 bg-white dark:bg-[#1c2b35] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                      <button
                        onClick={handleExportCSV}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#1d2a32] flex items-center gap-2"
                      >
                        <HiOutlineDownload className="inline" />
                        Export Set (CSV)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Study Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 flex-shrink-0">
            <button
              onClick={handleStartQuiz}
              className="group relative flex items-center gap-4 p-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg text-white hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <div className="p-2 bg-white/20 rounded-lg">
                <MdQuiz className="text-2xl" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">Quiz Mode</div>
                <div className="text-xs opacity-90">Test your knowledge with multiple choice</div>
              </div>
              <FaPlay className="opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={handleStartFlashcards}
              className="group relative flex items-center gap-4 p-4 bg-gradient-to-r from-[#f093fb] to-[#f5576c] rounded-lg text-white hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <div className="p-2 bg-white/20 rounded-lg">
                <TbCards className="text-2xl" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">Flashcards</div>
                <div className="text-xs opacity-90">Review with flippable cards</div>
              </div>
              <FaPlay className="opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

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

                <div className="flex items-center gap-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:text-white dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                  >
                    <option value="all">All Types</option>
                    <option value="vocabulary">Vocabulary</option>
                    <option value="grammar">Grammar</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:text-white dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                  >
                    <option value="default">Default Order</option>
                    <option value="alpha">Alphabetical</option>
                    <option value="status">By Status</option>
                  </select>

                  <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-[#0f1a1f] p-1">
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
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 h-20 rounded-lg" />
                  ))}
                </div>
              ) : sortedItems.length > 0 ? (
                viewMode === "list" ? (
                  <div className="space-y-1.5">
                    {sortedItems.map((item, idx) => (
                      <div key={item.id} className="group bg-gray-50 dark:bg-[#1d2a32] rounded-lg p-2 hover:shadow-sm transition-all">
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
        </div>

        {/* Edit Set Details Modal */}
        {editingSet && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[85vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Edit Set Details
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                    ID: {setData.id}
                  </p>
                </div>
                <button
                  onClick={handleCancelSetEdit}
                  disabled={isSavingSet}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {(saveSetSuccess || saveSetError) && (
                <div className="px-6 pt-4 flex-shrink-0">
                  {saveSetSuccess && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 text-sm flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Set details saved successfully!
                    </div>
                  )}
                  {saveSetError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
                      <strong>Error:</strong> {saveSetError}
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={setFormData.title || ''}
                      onChange={(e) => handleSetFieldChange('title', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                      placeholder="Enter set title"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                {/* Delete Set button on the left */}
                <button
                  onClick={handleShowDeleteSetConfirm}
                  disabled={isSavingSet || isDeletingSet}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Set
                </button>

                {/* Save/Cancel buttons on the right */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancelSetEdit}
                    disabled={isSavingSet || isDeletingSet}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSetDetails}
                    disabled={isSavingSet || isDeletingSet}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#e30a5f] hover:bg-[#c00950] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSavingSet ? (
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

        {/* Delete Set Confirmation Modal */}
        {showDeleteSetConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Confirm Set Deletion
                </h3>
              </div>

              <div className="px-6 py-4">
                <p className="text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                  Are you sure you want to permanently delete this set?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  This will remove the set and all item associations. The items themselves will remain in your library and can be added to other sets.
                </p>

                {setData && (
                  <div className="p-3 bg-gray-50 dark:bg-[#0f1a1f] rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {setData.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {setData.itemCount} {setData.itemCount === 1 ? 'item' : 'items'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                      ID: {setData.id}
                    </p>
                  </div>
                )}

                {deleteSetError && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
                    <strong>Error:</strong> {deleteSetError}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                <button
                  onClick={handleCancelDeleteSet}
                  disabled={isDeletingSet}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSet}
                  disabled={isDeletingSet}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeletingSet ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting Set...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Yes, Delete Set
                    </>
                  )}
                </button>
              </div>
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
                {/*<p className="text-sm text-gray-500 dark:text-gray-400">
                  This will only remove it from this set. The item will still exist in your vocabulary/grammar library.
        </p>*/}
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
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();