import { TbLoader } from 'react-icons/tb';
import BaseModal from '@/components/ui/BaseModal';

export default function EditSetDetailsModal({
  isOpen,
  formData,
  onFieldChange,
  isSaving,
  isDeletingSet,
  error,
  success,
  onSave,
  onShowDeleteConfirm,
  onClose,
  setId,
}) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      maxHeight="85vh"
      scrollable
      title="Edit Set Details"
      subtitle={`ID: ${setId}`}
      footer={
        <div className="flex items-center justify-between">
          <button
            onClick={onShowDeleteConfirm}
            disabled={isSaving || isDeletingSet}
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
              onClick={onClose}
              disabled={isSaving || isDeletingSet}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving || isDeletingSet}
              className="pl-3 pr-4 py-2 text-sm font-medium text-white bg-brand-pink hover:bg-[#c00950] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <TbLoader
                    className="w-5 h-5 animate-spin"
                    strokeWidth={2.5}
                  />
                  Saving
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      }
    >
      {(success || error) && (
        <div className="px-6 pt-4 flex-shrink-0">
          {success && (
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
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
              <strong>Error:</strong> {error}
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
              value={formData.title || ''}
              onChange={(e) => onFieldChange('title', e.target.value)}
              className="w-full px-3 py-2 bg-surface-deep border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-pink"
              placeholder="Enter set title"
            />
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
