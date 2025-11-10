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
  showSRS = true
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

  // SRS settings modal state
  const [showSRSModal, setShowSRSModal] = useState(false);
  const [isSrsEnabled, setIsSrsEnabled] = useState(srsEnabled);
  const [showDisableSRSConfirm, setShowDisableSRSConfirm] = useState(false);
  const [isSavingSRS, setIsSavingSRS] = useState(false);
  const [saveSRSError, setSaveSRSError] = useState(null);
  const [saveSRSSuccess, setSaveSRSSuccess] = useState(false);

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

  const handleOpenSRSModal = () => {
    setShowSRSModal(true);
    setIsSrsEnabled(srsEnabled);
    setSaveSRSError(null);
    setSaveSRSSuccess(false);
  };

  const handleCloseSRSModal = () => {
    setShowSRSModal(false);
  };

  const handleToggleSRS = (enabled) => {
    // If trying to disable, show confirmation first
    if (!enabled && srsEnabled) {
      setShowDisableSRSConfirm(true);
      return;
    }
    setIsSrsEnabled(enabled);
  };

  const handleConfirmDisableSRS = () => {
    setIsSrsEnabled(false);
    setShowDisableSRSConfirm(false);
  };

  const handleCancelDisableSRS = () => {
    setShowDisableSRSConfirm(false);
    // Reset toggle back to enabled state
    setIsSrsEnabled(srsEnabled);
  };

  const handleSaveSRSSettings = async () => {
    if (!setData.id) return;

    // If SRS status hasn't changed, just close the modal
    if (isSrsEnabled === srsEnabled) {
      handleCloseSRSModal();
      return;
    }

    setIsSavingSRS(true);
    setSaveSRSError(null);
    setSaveSRSSuccess(false);

    try {
      const response = await fetch('/api/database/v2/sets/toggle-srs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setId: setData.id,
          srsEnabled: isSrsEnabled
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update SRS settings');
      }

      // Update parent component if needed (trigger re-fetch or update state)
      if (onSetDataUpdate) {
        onSetDataUpdate({
          srsEnabled: isSrsEnabled
        });
      }

      setSaveSRSSuccess(true);

      // Close modal after short delay to show success message
      setTimeout(() => {
        handleCloseSRSModal();
        setSaveSRSSuccess(false);
      }, 1000);

    } catch (err) {
      console.error('Error saving SRS settings:', err);
      setSaveSRSError(err.message);
    } finally {
      setIsSavingSRS(false);
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

              {/* SRS Status Badge - Clickable */}
              {showSRS &&
              <button
                onClick={handleOpenSRSModal}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border-1 relative overflow-hidden transition-all  hover:scale-105 cursor-pointer ${srsEnabled
                    ? 'bg-green-300/20 border-green-400 dark:border-green-400 hover:bg-green-300/30'
                    : 'bg-gray-100/60 dark:bg-gray-800/60 border-gray-300 dark:border-gray-600 hover:bg-gray-200/60 dark:hover:bg-gray-700/60'
                  }`}
                title="Click to configure SRS settings"
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
              </button>}

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

      {/* SRS Settings Modal */}
      {showSRSModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TbRepeat className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                  Spaced Repetition Settings
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Configure how you want to study with spaced repetition
                </p>
              </div>
              <button
                onClick={handleCloseSRSModal}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Success/Error Messages */}
            {(saveSRSSuccess || saveSRSError) && (
              <div className="px-6 pt-4 flex-shrink-0">
                {saveSRSSuccess && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    SRS settings saved successfully!
                  </div>
                )}
                {saveSRSError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
                    <strong>Error:</strong> {saveSRSError}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* What is SRS Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    What is Spaced Repetition?
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                    Spaced Repetition is a learning technique that optimizes memory retention by reviewing items at scientifically-determined intervals. Instead of cramming, you study items right before you&apos;re about to forget them.
                  </p>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Proven Effective:</strong> Backed by decades of cognitive science research</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Time-Efficient:</strong> Study smarter, not harder with optimized intervals</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Long-Term Retention:</strong> Remember what you learn for the long term</span>
                    </div>
                  </div>
                </div>

                {/* Why Use SRS Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Why Use SRS for Japanese?
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Learning Japanese requires memorizing thousands of kanji, vocabulary words, and grammar patterns. Spaced repetition automatically schedules your reviews at the perfect time to maximize retention while minimizing the time you need to spend studying.
                  </p>
                </div>

                {/* Status Toggle Section */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0f1a1f] dark:to-[#1c2b35] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Spaced Repetition
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {isSrsEnabled
                          ? '✓ Enabled - Optimized learning with SRS review intervals'
                          : '◯ Disabled - Quiz and Flashcard study modes only'
                        }
                      </p>
                    </div>

                    {/* Premium Toggle Switch */}
                    <button
                      onClick={() => handleToggleSRS(!isSrsEnabled)}
                      className={`relative flex-shrink-0 h-10 w-20 rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e30a5f] dark:focus:ring-offset-[#1c2b35] ${
                        isSrsEnabled
                          ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-500/40'
                          : 'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 shadow-md'
                      }`}
                      title={isSrsEnabled ? 'Click to disable SRS' : 'Click to enable SRS'}
                    >
                      {/* Toggle Circle */}
                      <div
                        className={`absolute top-1 h-8 w-8 rounded-full bg-white shadow-lg transition-all duration-300 ease-out flex items-center justify-center ${
                          isSrsEnabled ? 'translate-x-10' : 'translate-x-1'
                        }`}
                      >
                        {isSrsEnabled ? (
                          <TbRepeat className="w-4 h-4 text-green-500" />
                        ) : (
                          <TbRepeatOff className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Caution Message when User Disables SRS that was Previously Enabled */}
                  {srsEnabled && !isSrsEnabled && (
                    <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex gap-3">
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm mb-1">
                            Disabling SRS can interrupt your learning flow
                          </h4>
                          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                            Any items already adopted into the SRS cycle that only exists in this set won&apos;t be reviewed. This can lead to untracked items. Consider keeping SRS enabled to maintain consistent progress.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isSrsEnabled !== srsEnabled
                  ? 'Click Save to confirm'
                  : 'No changes to save'
                }
              </p>
              <button
                onClick={handleSaveSRSSettings}
                disabled={isSavingSRS}
                className="px-6 py-2 text-sm font-medium text-white bg-[#e30a5f] hover:bg-[#c00950] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingSRS ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable SRS Confirmation Modal */}
      {showDisableSRSConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Disable SRS?
              </h3>
            </div>

            <div className="px-6 py-4">
              <p className="text-gray-700 dark:text-gray-300 mb-3 font-semibold">
                Are you sure you want to disable Spaced Repetition for this set?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                Any items already adopted into the SRS cycle that only exists in this set won&apos;t be reviewed. This can lead to untracked items. Consider keeping SRS enabled to maintain consistent progress.
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>Recommendation:</strong> Keep SRS enabled to maintain consistent progress and ensure long-term retention.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelDisableSRS}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Keep SRS Enabled
              </button>
              <button
                onClick={handleConfirmDisableSRS}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Yes, Disable SRS
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}