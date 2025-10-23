// components/pages/academy/sets/ViewSet/SetHeader/MasterSetHeader.jsx
import Link from "next/link";
import { useState } from "react";
import { FiEdit2, FiMoreVertical } from "react-icons/fi";
import { HiOutlineDownload } from "react-icons/hi";
import { TbRepeat, TbRepeatOff } from "react-icons/tb";
import { buildCSV, toSlug, downloadCSV } from "@/components/pages/academy/sets/ViewSet/utils/csvUtils.js";

export default function MasterSetHeader({
  setData,
  items,
  onSetDataUpdate,
  onDeleteSet,
  srsEnabled = true,
  showSRS = false
}) {
  const [showOptions, setShowOptions] = useState(false);

  // Edit set modal state
  const [editingSet, setEditingSet] = useState(false);
  const [setFormData, setSetFormData] = useState({});
  const [isSavingSet, setIsSavingSet] = useState(false);
  const [saveSetError, setSaveSetError] = useState(null);
  const [saveSetSuccess, setSaveSetSuccess] = useState(false);

  // Delete set confirmation state
  const [showDeleteSetConfirm, setShowDeleteSetConfirm] = useState(false);
  const [isDeletingSet, setIsDeletingSet] = useState(false);
  const [deleteSetError, setDeleteSetError] = useState(null);

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

      // Update parent component's setData
      onSetDataUpdate({
        title: setFormData.title,
        description: setFormData.description,
        tags: setFormData.tags
      });

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
          also_delete_items: false,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete set');
      }

      // Call parent's delete handler (which will redirect)
      onDeleteSet();

    } catch (err) {
      console.error('Error deleting set:', err);
      setDeleteSetError(err.message);
    } finally {
      setIsDeletingSet(false);
    }
  };

  const handleExportCSV = () => {
    try {
      if (!items.length) {
        alert("No items to export.");
        return;
      }
      const csv = buildCSV(items);
      const base = toSlug(setData.title) || "set";
      const filename = `${base}-${setData.id || "id"}-items.csv`;
      downloadCSV(csv, filename);
      setShowOptions(false);
    } catch (e) {
      console.error("CSV export failed:", e);
      alert("Failed to export CSV.");
    }
  };

  return (
    <>
      <div className=" sm:mb-3 flex-shrink-0 pt-11 sm:pt-0">
        {/* Breadcrumbs - Hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Link href="/learn/academy/sets" className="hover:text-[#e30a5f] transition-colors">
            Sets
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white truncate max-w-xs">
            {setData.title}
          </span>
        </div>

        {/* Set Title and Actions - Always horizontal on all screen sizes */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {setData.title}
              </h1>

              {/* SRS Status Badge */}
              {showSRS && 
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 relative overflow-hidden ${srsEnabled
                    ? 'bg-green-300/20 border-green-400 dark:border-green-400 shadow-lg '
                    : 'bg-gray-100/60 dark:bg-gray-800/60 border-gray-300 dark:border-gray-600'
                  }`}
              >

                <div className="relative flex items-center gap-1.5">
                  {srsEnabled ? (
                    <>
                      <TbRepeat className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                      <span className="text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                        <span className="md:hidden">SRS</span>
                        <span className="hidden md:inline">SRS Enabled</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <TbRepeatOff className="w-4 h-4 text-gray-500 dark:text-gray-500" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-500">
                        <span className="md:hidden">SRS</span>
                        <span className="hidden md:inline">SRS Disabled</span>
                      </span>
                    </>
                  )}
                </div>
              </div>}

              <style jsx>{`
                @keyframes shimmer {
                  0%, 100% {
                    transform: translateX(-100%);
                  }
                  50% {
                    transform: translateX(100%);
                  }
                }
              `}</style>
            </div>

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

          {/* Action Buttons */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
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
    </>
  );
}