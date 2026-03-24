import { useState } from 'react';
import { useRouter } from 'next/router';
import { FiSearch, FiCheckCircle } from 'react-icons/fi';
import { TbStack2, TbDownload, TbLoader3, TbEye } from 'react-icons/tb';
import ImportProgressOverlay from '@/components/SetImport/ImportProgressOverlay';
import {
  STARTER_SETS,
  buildStarterSetPayload,
  getStarterSetItems,
} from '@/components/SetImport/starterPacks';
import { clientLog } from '@/lib/clientLogger';
import BaseModal from '@/components/ui/BaseModal';

const CODE_PATTERN = /^[a-z0-9]{7}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ImportByCodeModal({ isOpen, onClose, userProfile }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('code');

  // Share code state
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStage, setImportStage] = useState('set');
  const [importError, setImportError] = useState(null);

  // Starter pack state
  const [importingSet, setImportingSet] = useState(null);
  const [importedSets, setImportedSets] = useState(new Set());
  const [expandedSet, setExpandedSet] = useState(null);

  const isValidCode = (val) => CODE_PATTERN.test(val) || UUID_PATTERN.test(val);

  const handleLookup = async () => {
    const trimmed = code.trim().toLowerCase();
    if (!isValidCode(trimmed)) {
      setError('Enter a 7-character share code (letters and numbers only).');
      setPreview(null);
      return;
    }

    setIsLoading(true);
    setError('');
    setImportError(null);
    setPreview(null);

    try {
      const res = await fetch(`/api/shared/sets/${trimmed}`);
      if (res.status === 404) {
        setError(
          'No set found with that code. It may have expired or been revoked.'
        );
        return;
      }
      if (!res.ok) {
        setError('Something went wrong. Please try again.');
        return;
      }
      const json = await res.json();
      const payload = json.data || json;
      if (!payload.set) {
        setError('No set found with that code.');
        return;
      }
      setPreview(payload);
    } catch {
      setError(
        'Failed to look up the code. Check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    const trimmed = code.trim().toLowerCase();
    setIsImporting(true);
    setImportError(null);
    setImportStage('set');
    setImportProgress(15);

    try {
      const progressTimer1 = setTimeout(() => setImportProgress(30), 300);

      const response = await fetch('/api/shared/sets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareToken: trimmed }),
      });

      clearTimeout(progressTimer1);

      setImportStage('items');
      setImportProgress(50);
      await new Promise((r) => setTimeout(r, 400));
      setImportProgress(70);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to import set');
      }

      setImportStage('linking');
      setImportProgress(85);
      await new Promise((r) => setTimeout(r, 400));
      setImportProgress(95);
      await new Promise((r) => setTimeout(r, 300));

      setImportStage('done');
      setImportProgress(100);
      await new Promise((r) => setTimeout(r, 800));

      router.push(`/learn/academy/sets/study/${result.setEntityId}`);
      onClose();
    } catch (err) {
      clientLog.error('set.import_by_code_failed', {
        error: err?.message || String(err),
      });
      setImportError(err.message);
      setIsImporting(false);
      setImportProgress(0);
      setImportStage('set');
    }
  };

  const handleViewSet = () => {
    const trimmed = code.trim().toLowerCase();
    router.push(`/learn/academy/sets/import/${trimmed}`);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading && !isImporting) {
      if (preview) {
        handleImport();
      } else {
        handleLookup();
      }
    }
  };

  const handleStarterImport = async (setKey) => {
    if (!userProfile?.sub || importingSet) return;

    setImportingSet(setKey);
    try {
      const payload = buildStarterSetPayload(setKey, userProfile.sub);
      const response = await fetch('/api/database/v2/sets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create set');
      }
      setImportedSets((prev) => new Set([...prev, setKey]));
    } catch (err) {
      clientLog.error('starter_pack.import_single_failed', {
        setKey,
        error: err?.message || String(err),
      });
      setError(err.message);
    } finally {
      setImportingSet(null);
    }
  };

  const handleClose = () => {
    if (isImporting || importingSet) return;
    setCode('');
    setPreview(null);
    setError('');
    setImportError(null);
    if (importedSets.size > 0) {
      window.location.reload();
    }
    onClose();
  };

  const itemCount = preview?.items?.length || preview?.item_count || 0;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      title="Import Sets"
      blur
    >
      <div className="px-5 pt-2 pb-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-white/5 rounded-lg">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'code'
                ? 'bg-white dark:bg-surface-elevated text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Share Code
          </button>
          <button
            onClick={() => setActiveTab('starter')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'starter'
                ? 'bg-white dark:bg-surface-elevated text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Starter Packs
          </button>
        </div>

        {/* Share Code Tab */}
        {activeTab === 'code' && (
          <div className="space-y-4 relative">
            {isImporting && (
              <div className="absolute inset-0 z-10 bg-white/80 dark:bg-surface-card/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <ImportProgressOverlay
                  importStage={importStage}
                  importProgress={importProgress}
                  itemCount={itemCount}
                  variant="inline"
                />
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the share code from a shared set link to preview and import
              it.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError('');
                  setImportError(null);
                  setPreview(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. a7f3b2k"
                maxLength={36}
                autoFocus
                disabled={isImporting}
                className="flex-1 px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-pink/30 focus:border-brand-pink font-mono tracking-wider disabled:opacity-50"
              />
              <button
                onClick={handleLookup}
                disabled={isLoading || isImporting || !code.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                <FiSearch className="w-4 h-4" />
                {isLoading ? 'Looking up...' : 'Look Up'}
              </button>
            </div>

            {(error || importError) && (
              <div className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error || importError}
                </p>
              </div>
            )}

            {preview && preview.set && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {preview.set.title}
                    </h3>
                    {preview.set.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {preview.set.description}
                      </p>
                    )}
                  </div>
                  {preview.set.set_type && (
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full font-medium ${
                        preview.set.set_type === 'vocab'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}
                    >
                      {preview.set.set_type === 'vocab'
                        ? 'Vocabulary'
                        : 'Grammar'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <TbStack2 className="w-3.5 h-3.5" />
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-brand-pink to-[#c1084d] text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImporting ? (
                      <TbLoader3 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TbDownload className="w-4 h-4" />
                    )}
                    {isImporting ? 'Importing...' : 'Import'}
                  </button>
                  <button
                    onClick={handleViewSet}
                    disabled={isImporting}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TbEye className="w-4 h-4" />
                    View Set
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Starter Packs Tab */}
        {activeTab === 'starter' && (
          <div className="space-y-2.5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pre-made sets to help you get started learning Japanese.
            </p>
            {STARTER_SETS.map((set) => {
              const isImported = importedSets.has(set.key);
              const isCurrentlyImporting = importingSet === set.key;
              const isExpanded = expandedSet === set.key;
              const items = isExpanded ? getStarterSetItems(set.key) : [];

              return (
                <div
                  key={set.key}
                  className={`rounded-xl border ${set.borderColor} ${set.bgColor} transition-colors overflow-hidden`}
                >
                  <div className="p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                          {set.title}
                        </h3>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {set.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[11px] font-medium ${set.color}`}
                        >
                          {set.count} items
                        </span>
                        {isImported ? (
                          <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            Added
                          </span>
                        ) : (
                          <button
                            onClick={() => handleStarterImport(set.key)}
                            disabled={!!importingSet}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-brand-pink to-[#c1084d] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isCurrentlyImporting ? (
                              <TbLoader3 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <TbDownload className="w-3.5 h-3.5" />
                            )}
                            {isCurrentlyImporting ? 'Adding...' : 'Add'}
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedSet(isExpanded ? null : set.key)
                      }
                      className="mt-2 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      {isExpanded ? 'Hide contents' : 'View contents'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200/50 dark:border-white/5 max-h-[200px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-gray-200/40 dark:divide-white/5">
                          {items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-3.5 py-1.5 font-japanese text-gray-900 dark:text-white whitespace-nowrap">
                                {item.primary}
                              </td>
                              {item.secondary && (
                                <td className="px-2 py-1.5 font-japanese text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  {item.secondary}
                                </td>
                              )}
                              <td
                                className={`px-3.5 py-1.5 text-gray-500 dark:text-gray-400 text-right ${
                                  !item.secondary ? '' : ''
                                }`}
                                colSpan={item.secondary ? 1 : 2}
                              >
                                {item.english}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            {error && (
              <div className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
