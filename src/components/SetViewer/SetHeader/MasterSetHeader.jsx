import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiEdit2, FiMoreVertical } from 'react-icons/fi';
import { HiOutlineDownload } from 'react-icons/hi';
import { TbRepeat, TbRepeatOff, TbShare2, TbTrash } from 'react-icons/tb';
import {
  buildCSV,
  toSlug,
  downloadCSV,
} from '@/components/SetViewer/utils/csvUtils.js';
import { clientLog } from '@/lib/clientLogger';
import EditSetDetailsModal from '@/components/SetViewer/SetHeader/modals/EditSetDetailsModal';
import DeleteSetConfirmModal from '@/components/SetViewer/SetHeader/modals/DeleteSetConfirmModal';
import SrsSettingsModal from '@/components/SetViewer/SetHeader/modals/SrsSettingsModal';
import ShareSetModal from '@/components/SetViewer/SetHeader/modals/ShareSetModal';
import DisableSrsConfirmModal from '@/components/SetViewer/SetHeader/modals/DisableSrsConfirmModal';

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

  const handleCopyCode = async () => {
    if (!shareToken) return;
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
        <EditSetDetailsModal
          isOpen={!!editingSet}
          formData={setFormData}
          onFieldChange={handleSetFieldChange}
          isSaving={isSavingSet}
          isDeletingSet={isDeletingSet}
          error={saveSetError}
          success={saveSetSuccess}
          onSave={handleSaveSetDetails}
          onShowDeleteConfirm={handleShowDeleteSetConfirm}
          onClose={handleCancelSetEdit}
          setId={setData.id}
        />
      )}

      {/* Delete Set Confirmation Modal */}
      <DeleteSetConfirmModal
        isOpen={showDeleteSetConfirm}
        isDeleting={isDeletingSet}
        error={deleteSetError}
        setData={setData}
        onConfirm={handleDeleteSet}
        onClose={handleCancelDeleteSet}
      />

      {/* SRS Settings Modal */}
      <SrsSettingsModal
        isOpen={showSRSModal}
        isSrsEnabled={isSrsEnabled}
        srsEnabledOriginal={srsEnabled}
        isSaving={isSavingSRS}
        error={saveSRSError}
        success={saveSRSSuccess}
        onToggle={handleToggleSRS}
        onSave={handleSaveSRSSettings}
        onClose={handleCloseSRSModal}
      />

      {/* Share Set Modal */}
      <ShareSetModal
        isOpen={showShareModal}
        shareUrl={shareUrl}
        shareToken={shareToken}
        shareExpiresAt={shareExpiresAt}
        shareExpiry={shareExpiry}
        shareError={shareError}
        isGeneratingShare={isGeneratingShare}
        showShareResult={showShareResult}
        copied={copied}
        codeCopied={codeCopied}
        isRevokingShare={isRevokingShare}
        onCopyShareUrl={handleCopyShareUrl}
        onCopyCode={handleCopyCode}
        onRegenerateWithExpiry={handleRegenerateWithExpiry}
        onRevokeShare={handleRevokeShare}
        onClose={handleCloseShareModal}
      />

      {/* Disable SRS Confirmation Modal */}
      <DisableSrsConfirmModal
        isOpen={showDisableSRSConfirm}
        onConfirm={handleConfirmDisableSRS}
        onClose={handleCancelDisableSRS}
      />
    </>
  );
}
