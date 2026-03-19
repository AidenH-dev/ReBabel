import { useState } from 'react';
import { useRouter } from 'next/router';
import { FiX, FiSearch } from 'react-icons/fi';
import { TbStack2, TbDownload } from 'react-icons/tb';

const CODE_PATTERN = /^[a-z0-9]{7}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ImportByCodeModal({ isOpen, onClose }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

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
      const data = await res.json();
      if (!data.set) {
        setError('No set found with that code.');
        return;
      }
      setPreview(data);
    } catch {
      setError(
        'Failed to look up the code. Check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    const trimmed = code.trim().toLowerCase();
    router.push(`/learn/academy/sets/import/${trimmed}`);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      if (preview) {
        handleImport();
      } else {
        handleLookup();
      }
    }
  };

  const handleClose = () => {
    setCode('');
    setPreview(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Import by Share Code
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter the share code from a shared set link to preview and import
            it.
          </p>

          {/* Input + button */}
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
                setPreview(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. a7f3b2k"
              maxLength={36}
              autoFocus
              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]/30 focus:border-[#e30a5f] font-mono tracking-wider"
            />
            <button
              onClick={handleLookup}
              disabled={isLoading || !code.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              <FiSearch className="w-4 h-4" />
              {isLoading ? 'Looking up...' : 'Look Up'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Preview card */}
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
                  {preview.items?.length || 0} items
                </span>
              </div>
              <button
                onClick={handleImport}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#e30a5f] to-[#c1084d] text-white hover:brightness-110 transition-all"
              >
                <TbDownload className="w-4 h-4" />
                Import This Set
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
