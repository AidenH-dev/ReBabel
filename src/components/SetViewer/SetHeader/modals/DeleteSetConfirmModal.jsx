import { TbLoader } from 'react-icons/tb';
import BaseModal from '@/components/ui/BaseModal';

export default function DeleteSetConfirmModal({
  isOpen,
  isDeleting,
  error,
  setData,
  onConfirm,
  onClose,
}) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      zIndex={60}
      backdropOpacity={60}
      closeOnBackdrop={false}
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="pl-3 pr-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <TbLoader className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                Deleting Set
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
          themselves will remain in your library and can be added to other sets.
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

        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
