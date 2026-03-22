// components/pages/academy/sets/ViewSet/SetHeader/MasterSetHeader.jsx
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiEdit2, FiMoreVertical, FiCopy, FiCheck } from 'react-icons/fi';
import { HiOutlineDownload } from 'react-icons/hi';
import {
  TbRepeat,
  TbRepeatOff,
  TbShare2,
  TbLoader3,
  TbTrash,
} from 'react-icons/tb';
import dynamic from 'next/dynamic';
const QRCode = dynamic(
  () => import('react-qrcode-logo').then((mod) => mod.QRCode),
  { ssr: false }
);
import {
  buildCSV,
  toSlug,
  downloadCSV,
} from '@/components/pages/academy/sets/ViewSet/utils/csvUtils.js';
import { clientLog } from '@/lib/clientLogger';
import BaseModal from '@/components/ui/BaseModal';

export default function MasterSetHeader({
  setData,
  items,
  onSetDataUpdate,
  onDeleteSet,
  srsEnabled = true,
  showSRS = true,
  actionsRef,
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

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [showShareResult, setShowShareResult] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [shareToken, setShareToken] = useState(null);
  const [shareExpiresAt, setShareExpiresAt] = useState(null);
  const [shareExpiry, setShareExpiry] = useState('7d');
  const [shareError, setShareError] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRevokingShare, setIsRevokingShare] = useState(false);

  // SRS settings modal state
  const [showSRSModal, setShowSRSModal] = useState(false);
  const [isSrsEnabled, setIsSrsEnabled] = useState(srsEnabled);
  const [showDisableSRSConfirm, setShowDisableSRSConfirm] = useState(false);
  const [isSavingSRS, setIsSavingSRS] = useState(false);
  const [saveSRSError, setSaveSRSError] = useState(null);
  const [saveSRSSuccess, setSaveSRSSuccess] = useState(false);

  const handleOpenShareModal = async () => {
    setShowShareModal(true);
    setShareError(null);
    setCopied(false);
    setIsGeneratingShare(true);
    setShowShareResult(false);

    try {
      const startTime = Date.now();
      const response = await fetch('/api/database/v2/sets/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setId: setData.id,
          action: 'generate',
          expiresIn: shareExpiry,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate share link');
      }

      setShareUrl(result.shareUrl);
      setShareToken(result.shareToken);
      setShareExpiresAt(result.expiresAt);

      // Ensure animation plays for at least 2s
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 2000 - elapsed);
      await new Promise((r) => setTimeout(r, remaining));
    } catch (err) {
      clientLog.error('set.share_generate_failed', {
        error: err?.message || String(err),
      });
      setShareError(err.message);
    } finally {
      setIsGeneratingShare(false);
      setShowShareResult(true);
    }
  };

  const handleRegenerateWithExpiry = async (newExpiry) => {
    setShareExpiry(newExpiry);
    setShareError(null);
    setIsGeneratingShare(true);
    setShowShareResult(false);

    try {
      const startTime = Date.now();

      // Revoke existing token first
      await fetch('/api/database/v2/sets/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: setData.id, action: 'revoke' }),
      });

      // Generate new one with the new expiry
      const response = await fetch('/api/database/v2/sets/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setId: setData.id,
          action: 'generate',
          expiresIn: newExpiry,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to regenerate share link');
      }

      setShareUrl(result.shareUrl);
      setShareToken(result.shareToken);
      setShareExpiresAt(result.expiresAt);
      setCopied(false);

      // Ensure animation plays for at least 2s
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 2000 - elapsed);
      await new Promise((r) => setTimeout(r, remaining));
    } catch (err) {
      clientLog.error('set.share_regenerate_failed', {
        error: err?.message || String(err),
      });
      setShareError(err.message);
    } finally {
      setIsGeneratingShare(false);
      setShowShareResult(true);
    }
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevokeShare = async () => {
    setIsRevokingShare(true);
    setShareError(null);

    try {
      const response = await fetch('/api/database/v2/sets/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: setData.id, action: 'revoke' }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to revoke share link');
      }

      setShareUrl(null);
      setShareToken(null);
      setShowShareModal(false);
    } catch (err) {
      clientLog.error('set.share_revoke_failed', {
        error: err?.message || String(err),
      });
      setShareError(err.message);
    } finally {
      setIsRevokingShare(false);
    }
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setShareError(null);
    setCopied(false);
    setShareExpiresAt(null);
  };

  const handleEditSetDetails = () => {
    setEditingSet(true);
    setSetFormData({
      title: setData.title,
      description: setData.description,
      tags: setData.tags,
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

      const response = await fetch(
        '/api/database/v2/sets/update-from-full-set',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entityType: 'set',
            entityId: setData.id,
            updates,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update set');
      }

      // Update parent component's setData
      onSetDataUpdate({
        title: setFormData.title,
        description: setFormData.description,
        tags: setFormData.tags,
      });

      setSaveSetSuccess(true);

      setTimeout(() => {
        setEditingSet(false);
        setSetFormData({});
        setSaveSetSuccess(false);
      }, 1000);
    } catch (err) {
      clientLog.error('set.save_failed', {
        error: err?.message || String(err),
      });
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
    setSetFormData((prev) => ({
      ...prev,
      [field]: value,
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
      clientLog.error('set.delete_failed', {
        error: err?.message || String(err),
      });
      setDeleteSetError(err.message);
    } finally {
      setIsDeletingSet(false);
    }
  };

  const handleExportCSV = () => {
    try {
      if (!items.length) {
        alert('No items to export.');
        return;
      }
      const csv = buildCSV(items);
      const base = toSlug(setData.title) || 'set';
      const filename = `${base}-${setData.id || 'id'}-items.csv`;
      downloadCSV(csv, filename);
      setShowOptions(false);
    } catch (e) {
      clientLog.error('set.csv_export_failed', {
        error: e?.message || String(e),
      });
      alert('Failed to export CSV.');
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
          srsEnabled: isSrsEnabled,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update SRS settings');
      }

      // Update parent component if needed (trigger re-fetch or update state)
      if (onSetDataUpdate) {
        onSetDataUpdate({
          srsEnabled: isSrsEnabled,
        });
      }

      setSaveSRSSuccess(true);

      // Close modal after short delay to show success message
      setTimeout(() => {
        handleCloseSRSModal();
        setSaveSRSSuccess(false);
      }, 1000);
    } catch (err) {
      clientLog.error('set.srs_settings_save_failed', {
        error: err?.message || String(err),
      });
      setSaveSRSError(err.message);
    } finally {
      setIsSavingSRS(false);
    }
  };

  // Expose actions to parent for desktop PageHeader
  useEffect(() => {
    if (actionsRef) {
      actionsRef.current = {
        openEdit: handleEditSetDetails,
        openSRSModal: handleOpenSRSModal,
        openShareModal: handleOpenShareModal,
        openDelete: () => setShowDeleteSetConfirm(true),
        toggleOptions: () => setShowOptions((v) => !v),
        exportCSV: handleExportCSV,
      };
    }
  });

  return (
    <>
      <div className="sm:mb-3 flex-shrink-0 pt-11 sm:pt-5 lg:hidden">
        {/* Set Title and Actions - mobile only (desktop uses PageHeader) */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 ">
            <div className="flex items-center gap-2 mb-1 flex-wrap ">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {setData.title}
              </h1>

              {/* SRS Status Badge - Clickable */}
              {showSRS && (
                <button
                  onClick={handleOpenSRSModal}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border-1 relative overflow-hidden transition-all  hover:scale-105 cursor-pointer ${
                    srsEnabled
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
                </button>
              )}

              <style jsx>{`
                @keyframes shimmer {
                  0%,
                  100% {
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
              onClick={handleOpenShareModal}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Share Set"
            >
              <TbShare2 className="w-4 h-4" />
            </button>
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
                <div className="absolute right-0 dark:text-white mt-1 w-56 bg-surface-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                  <button
                    onClick={() => {
                      handleOpenSRSModal();
                      setShowOptions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-elevated flex items-center gap-2"
                  >
                    <TbRepeat className="inline w-4 h-4" />
                    SRS Settings
                  </button>
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => {
                      setShowDeleteSetConfirm(true);
                      setShowOptions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                  >
                    <TbTrash className="inline w-4 h-4" />
                    Delete Set
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Set Details Modal */}
      {editingSet && (
        <BaseModal
          isOpen={!!editingSet}
          onClose={handleCancelSetEdit}
          size="2xl"
          maxHeight="85vh"
          scrollable
          title="Edit Set Details"
          subtitle={`ID: ${setData.id}`}
          footer={
            <div className="flex items-center justify-between">
              <button
                onClick={handleShowDeleteSetConfirm}
                disabled={isSavingSet || isDeletingSet}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
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
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-pink hover:bg-[#c00950] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSavingSet ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          }
        >
          {(saveSetSuccess || saveSetError) && (
            <div className="px-6 pt-4 flex-shrink-0">
              {saveSetSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 text-sm flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
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
                  onChange={(e) =>
                    handleSetFieldChange('title', e.target.value)
                  }
                  className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink"
                  placeholder="Enter set title"
                />
              </div>
            </div>
          </div>
        </BaseModal>
      )}

      {/* Delete Set Confirmation Modal */}
      <BaseModal
        isOpen={showDeleteSetConfirm}
        onClose={handleCancelDeleteSet}
        size="md"
        zIndex={60}
        backdropOpacity={60}
        closeOnBackdrop={false}
        footer={
          <div className="flex items-center justify-end gap-3">
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
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Deleting Set...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Yes, Delete Set
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Confirm Set Deletion
          </h3>
        </div>

        <div className="px-6 py-4">
          <p className="text-gray-700 dark:text-gray-300 mb-2 font-semibold">
            Are you sure you want to permanently delete this set?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            This will remove the set and all item associations. The items
            themselves will remain in your library and can be added to other
            sets.
          </p>

          {setData && (
            <div className="p-3 bg-surface-deep rounded-lg border border-gray-200 dark:border-gray-700">
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
      </BaseModal>

      {/* SRS Settings Modal */}
      <BaseModal
        isOpen={showSRSModal}
        onClose={handleCloseSRSModal}
        size="2xl"
        maxHeight="85vh"
        scrollable
        title={
          <>
            <TbRepeat className="w-5 h-5 text-purple-600 dark:text-purple-300 inline mr-2" />
            Spaced Repetition Settings
          </>
        }
        subtitle="Configure how you want to study with spaced repetition"
        footer={
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isSrsEnabled !== srsEnabled
                ? 'Click Save to confirm'
                : 'No changes to save'}
            </p>
            <button
              onClick={handleSaveSRSSettings}
              disabled={isSavingSRS}
              className="px-6 py-2 text-sm font-medium text-white bg-brand-pink hover:bg-[#c00950] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingSRS ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        }
      >
        {/* Success/Error Messages */}
        {(saveSRSSuccess || saveSRSError) && (
          <div className="px-6 pt-4 flex-shrink-0">
            {saveSRSSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 text-sm flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
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
                Spaced Repetition is a learning technique that optimizes memory
                retention by reviewing items at scientifically-determined
                intervals. Instead of cramming, you study items right before
                you&apos;re about to forget them.
              </p>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    <strong>Proven Effective:</strong> Backed by decades of
                    cognitive science research
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    <strong>Time-Efficient:</strong> Study smarter, not harder
                    with optimized intervals
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    <strong>Long-Term Retention:</strong> Remember what you
                    learn for the long term
                  </span>
                </div>
              </div>
            </div>

            {/* Why Use SRS Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Why Use SRS for Japanese?
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Learning Japanese requires memorizing thousands of kanji,
                vocabulary words, and grammar patterns. Spaced repetition
                automatically schedules your reviews at the perfect time to
                maximize retention while minimizing the time you need to spend
                studying.
              </p>
            </div>

            {/* Status Toggle Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-surface-deep dark:to-surface-card rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Spaced Repetition
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {isSrsEnabled
                      ? '✓ Enabled - Optimized learning with SRS review intervals'
                      : '◯ Disabled - Quiz and Flashcard study modes only'}
                  </p>
                </div>

                {/* Premium Toggle Switch */}
                <button
                  onClick={() => handleToggleSRS(!isSrsEnabled)}
                  className={`relative flex-shrink-0 h-10 w-20 rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink dark:focus:ring-offset-surface-card ${
                    isSrsEnabled
                      ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-500/40'
                      : 'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 shadow-md'
                  }`}
                  title={
                    isSrsEnabled
                      ? 'Click to disable SRS'
                      : 'Click to enable SRS'
                  }
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
                    <svg
                      className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm mb-1">
                        Disabling SRS can interrupt your learning flow
                      </h4>
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        Any items already adopted into the SRS cycle that only
                        exists in this set won&apos;t be reviewed. This can lead
                        to untracked items. Consider keeping SRS enabled to
                        maintain consistent progress.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </BaseModal>

      {/* Share Set Modal */}
      <BaseModal
        isOpen={showShareModal}
        onClose={handleCloseShareModal}
        size="md"
        title={
          <>
            <TbShare2 className="w-5 h-5 text-brand-pink inline mr-2" />
            Share Set
          </>
        }
        subtitle="Anyone with the link can preview and import this set"
      >
        <div className="px-6 py-5">
          {!shareUrl && !isGeneratingShare && shareError ? (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
              <strong>Error:</strong> {shareError}
            </div>
          ) : shareUrl || isGeneratingShare ? (
            <div className="space-y-5">
              {/* QR Code / generating animation */}
              <div className="flex flex-col items-center">
                <div className="w-[176px] h-[176px] rounded-2xl overflow-hidden relative flex items-center justify-center">
                  {isGeneratingShare ? (
                    <>
                      <style
                        dangerouslySetInnerHTML={{
                          __html: `
                            @keyframes dotFlux {
                              0% { transform: scale(0.4); opacity: 0.25; }
                              30% { transform: scale(1); opacity: 0.9; }
                              55% { transform: scale(0.5); opacity: 0.3; }
                              80% { transform: scale(0.9); opacity: 0.8; }
                              100% { transform: scale(0.4); opacity: 0.25; }
                            }
                            @keyframes shimmerSlide {
                              0% { transform: translateX(-100%); }
                              100% { transform: translateX(100%); }
                            }
                            @keyframes finderPulse {
                              0%, 100% { opacity: 0.4; }
                              50% { opacity: 0.8; }
                            }
                          `,
                        }}
                      />
                      <div className="absolute inset-0">
                        {/* Corner finder patterns */}
                        {(() => {
                          const isDark =
                            document.documentElement.classList.contains('dark');
                          const finderColor = isDark
                            ? 'rgba(255,255,255,0.25)'
                            : 'rgba(0,0,0,0.18)';
                          const finderStyle = {
                            position: 'absolute',
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            border: `3px solid ${finderColor}`,
                            animation: 'finderPulse 2s ease-in-out infinite',
                          };
                          const innerStyle = {
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 13,
                            height: 13,
                            borderRadius: 3,
                            backgroundColor: finderColor,
                          };
                          return (
                            <>
                              <div style={{ ...finderStyle, top: 4, left: 4 }}>
                                <div style={innerStyle} />
                              </div>
                              <div
                                style={{
                                  ...finderStyle,
                                  top: 4,
                                  right: 4,
                                  animationDelay: '0.3s',
                                }}
                              >
                                <div style={innerStyle} />
                              </div>
                              <div
                                style={{
                                  ...finderStyle,
                                  bottom: 4,
                                  left: 4,
                                  animationDelay: '0.6s',
                                }}
                              >
                                <div style={innerStyle} />
                              </div>
                            </>
                          );
                        })()}
                        {/* Center logo */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 42,
                            height: 42,
                            borderRadius: '50%',
                            backgroundColor: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                          }}
                        >
                          <img
                            src="/ReBabelIcon.png"
                            alt=""
                            style={{
                              width: 30,
                              height: 25,
                              objectFit: 'contain',
                            }}
                          />
                        </div>
                        {/* Dot grid */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(23, 1fr)',
                            gap: 1,
                            width: '100%',
                            height: '100%',
                            padding: 4,
                          }}
                        >
                          {Array.from({ length: 529 }).map((_, i) => {
                            const row = Math.floor(i / 23);
                            const col = i % 23;
                            const inTopLeft = row < 5 && col < 5;
                            const inTopRight = row < 5 && col > 17;
                            const inBottomLeft = row > 17 && col < 5;
                            // Skip dots behind center logo
                            const inCenter =
                              row >= 9 && row <= 13 && col >= 9 && col <= 13;
                            if (
                              inTopLeft ||
                              inTopRight ||
                              inBottomLeft ||
                              inCenter
                            )
                              return <div key={i} />;
                            const isDark =
                              document.documentElement.classList.contains(
                                'dark'
                              );
                            // Loosely grouped — nearby dots nudged toward similar timing but with heavy randomness
                            const groupRow = Math.floor(row / 4);
                            const groupCol = Math.floor(col / 4);
                            const groupNudge =
                              ((groupRow * 3 + groupCol) * 0.17) % 1;
                            const duration = 1.8 + Math.random() * 1.4; // 1.8-3.2s, mostly random
                            // Negative delay = start mid-animation, so dots are already in random states on mount
                            const delay = -(
                              Math.random() * duration * 0.7 +
                              groupNudge * 0.6
                            );
                            return (
                              <div
                                key={i}
                                style={{
                                  width: '100%',
                                  aspectRatio: '1',
                                  borderRadius: '50%',
                                  backgroundColor: isDark
                                    ? 'rgba(255,255,255,0.12)'
                                    : 'rgba(0,0,0,0.08)',
                                  animation: `dotFlux ${duration}s ease-in-out infinite`,
                                  animationDelay: `${delay}s`,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : showShareResult && shareUrl ? (
                    <QRCode
                      value={shareUrl}
                      size={160}
                      bgColor="transparent"
                      fgColor={
                        document.documentElement.classList.contains('dark')
                          ? '#e5e7eb'
                          : '#1f2937'
                      }
                      qrStyle="dots"
                      eyeRadius={8}
                      logoImage="/ReBabelIcon.png"
                      logoWidth={34}
                      logoHeight={29}
                      logoPaddingStyle="circle"
                      logoPadding={4}
                      removeQrCodeBehindLogo
                      quietZone={8}
                    />
                  ) : null}
                </div>
                <p className="mt-2 text-xs font-fredoka h-4">
                  {isGeneratingShare ? (
                    <span className="text-brand-pink dark:text-brand-pink-hover">
                      Generating link...
                    </span>
                  ) : showShareResult ? (
                    <span className="text-gray-400 dark:text-gray-500">
                      Scan to preview this set
                    </span>
                  ) : null}
                </p>
              </div>

              {/* Link + copy */}
              <div className="flex gap-2 items-center h-9">
                {isGeneratingShare ? (
                  <div
                    className="flex-1 h-full rounded-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden relative"
                    style={{
                      backgroundColor:
                        document.documentElement.classList.contains('dark')
                          ? 'rgba(255,255,255,0.02)'
                          : 'rgba(0,0,0,0.02)',
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background: document.documentElement.classList.contains(
                          'dark'
                        )
                          ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)'
                          : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.04), transparent)',
                        animation: 'shimmerSlide 1.5s ease-in-out infinite',
                      }}
                    />
                  </div>
                ) : showShareResult ? (
                  <>
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 h-full px-2 py-1.5 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-[7px] leading-tight text-gray-900 dark:text-white font-mono break-all"
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      onClick={handleCopyShareUrl}
                      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                        copied
                          ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      title={copied ? 'Copied!' : 'Copy link'}
                    >
                      {copied ? (
                        <FiCheck className="w-4.5 h-4.5" />
                      ) : (
                        <FiCopy className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </>
                ) : null}
              </div>

              {/* Import code */}
              {showShareResult && shareToken && (
                <div className="bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Import code
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-center text-2xl font-bold font-mono tracking-[0.3em] text-gray-900 dark:text-white select-all">
                      {shareToken}
                    </code>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(shareToken);
                        } catch {
                          const textarea = document.createElement('textarea');
                          textarea.value = shareToken;
                          document.body.appendChild(textarea);
                          textarea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textarea);
                        }
                        setCodeCopied(true);
                        setTimeout(() => setCodeCopied(false), 2000);
                      }}
                      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                        codeCopied
                          ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      title={codeCopied ? 'Copied!' : 'Copy code'}
                    >
                      {codeCopied ? (
                        <FiCheck className="w-4 h-4" />
                      ) : (
                        <FiCopy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
                    Share this code for quick import
                  </p>
                </div>
              )}

              {/* Expiration — always visible */}
              <div>
                <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Link expires
                  {shareExpiresAt && !isGeneratingShare && (
                    <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">
                      —{' '}
                      {new Date(shareExpiresAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                  {!shareExpiresAt &&
                    shareExpiry === 'never' &&
                    !isGeneratingShare && (
                      <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">
                        — never
                      </span>
                    )}
                </label>
                <div className="flex gap-1.5">
                  {[
                    { value: '1d', label: '1 day' },
                    { value: '7d', label: '7 days' },
                    { value: '30d', label: '30 days' },
                    { value: 'never', label: 'Never' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        if (opt.value !== shareExpiry) {
                          handleRegenerateWithExpiry(opt.value);
                        }
                      }}
                      disabled={isGeneratingShare}
                      className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors disabled:opacity-50 ${
                        shareExpiry === opt.value
                          ? 'bg-brand-pink text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleRevokeShare}
                  disabled={isRevokingShare || isGeneratingShare}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isRevokingShare ? (
                    <>
                      <TbLoader3 className="w-3.5 h-3.5 animate-spin" />
                      Revoking...
                    </>
                  ) : (
                    'Stop Sharing'
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </BaseModal>

      {/* Disable SRS Confirmation Modal */}
      <BaseModal
        isOpen={showDisableSRSConfirm}
        onClose={handleCancelDisableSRS}
        size="md"
        zIndex={60}
        backdropOpacity={60}
        closeOnBackdrop={false}
        footer={
          <div className="flex items-center justify-end gap-3">
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
              <svg
                className="w-4 h-4"
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
              Yes, Disable SRS
            </button>
          </div>
        }
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg
              className="w-5 h-5 text-amber-600 dark:text-amber-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Disable SRS?
          </h3>
        </div>

        <div className="px-6 py-4">
          <p className="text-gray-700 dark:text-gray-300 mb-3 font-semibold">
            Are you sure you want to disable Spaced Repetition for this set?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            Any items already adopted into the SRS cycle that only exists in
            this set won&apos;t be reviewed. This can lead to untracked items.
            Consider keeping SRS enabled to maintain consistent progress.
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <strong>Recommendation:</strong> Keep SRS enabled to maintain
              consistent progress and ensure long-term retention.
            </p>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
