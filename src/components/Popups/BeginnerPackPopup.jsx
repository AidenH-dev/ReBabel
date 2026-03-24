import { useState, useRef, useEffect, useCallback } from 'react';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';
import { TbDownload, TbLoader3 } from 'react-icons/tb';
import { clientLog } from '@/lib/clientLogger';
import BaseModal from '@/components/ui/BaseModal';
import {
  STARTER_SETS,
  buildStarterSetPayload,
} from '@/components/SetImport/starterPacks';

const ITEM_SIZE = 32; // w-8 = 32px
const GAP = 6; // gap-1.5 = 6px

function PreviewStrip({ preview, totalCount }) {
  const containerRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(preview.length);

  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.offsetWidth;
    const available = width - ITEM_SIZE;
    const fitCount = Math.max(
      1,
      Math.floor((available + GAP) / (ITEM_SIZE + GAP))
    );
    setVisibleCount(Math.min(fitCount, preview.length));
  }, [preview.length]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const shown = preview.slice(0, visibleCount);
  const remaining = totalCount - shown.length;

  return (
    <div ref={containerRef} className="flex gap-1.5">
      {shown.map((char, j) => (
        <span
          key={j}
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/60 dark:bg-white/5 flex items-center justify-center text-[14px] font-japanese text-gray-700 dark:text-gray-300"
        >
          {char}
        </span>
      ))}
      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/40 dark:bg-white/[0.03] flex items-center justify-center text-[11px] text-gray-400 dark:text-gray-500">
        +{remaining}
      </span>
    </div>
  );
}

export function BeginnerPackPopup({ isOpen, onClose, onImport, userProfile }) {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState({
    success: 0,
    total: 3,
    error: null,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const createSet = async (setData) => {
    const response = await fetch('/api/database/v2/sets/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setData),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to create set');
    }
    return result;
  };

  const handleImport = async () => {
    if (!userProfile?.sub) {
      setImportStatus({
        success: 0,
        total: 3,
        error: 'Please contact support',
      });
      return;
    }

    setIsImporting(true);
    setImportStatus({ success: 0, total: 3, error: null });

    try {
      const userId = userProfile.sub;
      const keys = ['common_words', 'hiragana', 'katakana'];

      for (let i = 0; i < keys.length; i++) {
        const payload = buildStarterSetPayload(keys[i], userId);
        await createSet(payload);
        setImportStatus((prev) => ({ ...prev, success: i + 1 }));
      }

      setShowSuccess(true);
      setTimeout(() => {
        onImport();
      }, 2000);
    } catch (error) {
      clientLog.error('starter_pack.create_failed', {
        error: error?.message || String(error),
      });
      setImportStatus((prev) => ({ ...prev, error: error.message }));
      setIsImporting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={isImporting ? () => {} : onClose}
      variant="centered"
      backdropOpacity={60}
      blur={true}
      closeOnBackdrop={!isImporting && !showSuccess}
      footer={
        !showSuccess ? (
          <div className="space-y-2.5">
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold text-white bg-gradient-to-r from-brand-pink to-[#d10950] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-brand-pink/20"
            >
              {isImporting ? (
                <TbLoader3 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <TbDownload className="w-4.5 h-4.5" />
              )}
              {isImporting ? 'Creating Sets...' : 'Add All to My Library'}
            </button>

            {!isImporting && (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
        ) : null
      }
      footerClassName="border-t-0"
    >
      {showSuccess ? (
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 mb-5 rounded-2xl bg-green-500/10 dark:bg-green-500/15 flex items-center justify-center">
            <FaCheckCircle className="text-2xl text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1.5">
            You&apos;re all set
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            3 starter sets added to your library
          </p>
        </div>
      ) : (
        <>
          {/* Header with decorative kana background */}
          <div className="relative overflow-hidden px-6 pt-6 pb-5">
            <div
              className="absolute inset-0 overflow-hidden select-none pointer-events-none"
              aria-hidden="true"
            >
              <span className="absolute top-3 right-6 text-[72px] font-japanese text-gray-100 dark:text-white/[0.03] leading-none">
                あ
              </span>
              <span className="absolute -bottom-2 right-24 text-[56px] font-japanese text-gray-100 dark:text-white/[0.03] leading-none">
                カ
              </span>
              <span className="absolute top-8 right-28 text-[40px] font-japanese text-gray-100 dark:text-white/[0.025] leading-none">
                水
              </span>
            </div>

            {!isImporting && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                aria-label="Close"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            )}

            <div className="relative">
              <p className="text-[11px] font-medium text-brand-pink uppercase tracking-wider mb-1.5">
                Starter Pack
              </p>
              <h2 className="text-[22px] font-bold text-gray-900 dark:text-white leading-tight mb-1">
                Start with the basics
              </h2>
              <p className="text-[14px] text-gray-500 dark:text-gray-400">
                Three foundational sets to begin learning Japanese
              </p>
            </div>
          </div>

          {/* Set cards */}
          <div className="px-6 space-y-2.5">
            {STARTER_SETS.map((set) => (
              <div
                key={set.key}
                className={`rounded-xl p-3.5 border ${set.borderColor} ${set.bgColor} transition-colors`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                      {set.title}
                    </h3>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {set.description}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-medium ${set.color} flex-shrink-0 mt-0.5`}
                  >
                    {set.count} items
                  </span>
                </div>
                <PreviewStrip preview={set.preview} totalCount={set.count} />
              </div>
            ))}
          </div>

          {/* Error */}
          {importStatus.error && (
            <div className="mx-6 mt-3 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40">
              <p className="text-[13px] text-red-600 dark:text-red-400">
                {importStatus.error}
              </p>
            </div>
          )}

          {/* Import progress */}
          {isImporting && (
            <div className="mx-6 mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-gray-600 dark:text-gray-300">
                  Creating sets...
                </span>
                <span className="text-[12px] text-gray-400 dark:text-gray-500">
                  {importStatus.success}/{importStatus.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-pink h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(importStatus.success / importStatus.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="h-[env(safe-area-inset-bottom)]" />
        </>
      )}
    </BaseModal>
  );
}
