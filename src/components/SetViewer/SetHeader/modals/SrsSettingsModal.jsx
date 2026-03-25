import { TbRepeat, TbRepeatOff, TbLoader } from 'react-icons/tb';
import BaseModal from '@/components/ui/BaseModal';

export default function SrsSettingsModal({
  isOpen,
  isSrsEnabled,
  srsEnabledOriginal,
  isSaving,
  error,
  success,
  onToggle,
  onSave,
  onClose,
}) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
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
            {isSrsEnabled !== srsEnabledOriginal
              ? 'Click Save to confirm'
              : 'No changes to save'}
          </p>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="pl-3 pr-4 py-2 text-sm font-medium text-white bg-brand-pink hover:bg-[#c00950] rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <TbLoader className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                Saving
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
              SRS settings saved successfully!
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
              <strong>Error:</strong> {error}
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
                  <strong>Long-Term Retention:</strong> Remember what you learn
                  for the long term
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
                    ? '\u2713 Enabled - Optimized learning with SRS review intervals'
                    : '\u25CB Disabled - Quiz and Flashcard study modes only'}
                </p>
              </div>

              {/* Premium Toggle Switch */}
              <button
                onClick={() => onToggle(!isSrsEnabled)}
                className={`relative flex-shrink-0 h-10 w-20 rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-pink dark:focus:ring-offset-surface-card ${
                  isSrsEnabled
                    ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-lg shadow-green-500/40'
                    : 'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 shadow-md'
                }`}
                title={
                  isSrsEnabled ? 'Click to disable SRS' : 'Click to enable SRS'
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
            {srsEnabledOriginal && !isSrsEnabled && (
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
  );
}
