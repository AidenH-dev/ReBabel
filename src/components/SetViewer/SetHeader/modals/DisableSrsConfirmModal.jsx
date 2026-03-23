import BaseModal from '@/components/ui/BaseModal';

export default function DisableSrsConfirmModal({ isOpen, onConfirm, onClose }) {
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
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Keep SRS Enabled
          </button>
          <button
            onClick={onConfirm}
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
          Any items already adopted into the SRS cycle that only exists in this
          set won&apos;t be reviewed. This can lead to untracked items. Consider
          keeping SRS enabled to maintain consistent progress.
        </p>
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <strong>Recommendation:</strong> Keep SRS enabled to maintain
            consistent progress and ensure long-term retention.
          </p>
        </div>
      </div>
    </BaseModal>
  );
}
