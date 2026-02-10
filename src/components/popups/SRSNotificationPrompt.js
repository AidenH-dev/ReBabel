import { useState } from 'react';
import { FaBell, FaTimes, FaClock } from 'react-icons/fa';
import { TbSparkles } from 'react-icons/tb';

export function SRSNotificationPrompt({
  isOpen,
  onClose,
  onEnableNotifications,
  srsSetCount = 0,
}) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      await onEnableNotifications();
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      <div className="relative w-full max-w-sm animate-slideUp">
        <div className="relative bg-white dark:bg-[#1c2b35] rounded-2xl shadow-2xl overflow-hidden border border-black/5 dark:border-white/10">
          {/* Decorative background */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-[#667eea] to-[#764ba2] rounded-full blur-3xl" />
          </div>

          {/* Close button */}
          {!isLoading && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <FaTimes className="text-gray-600 dark:text-gray-400 w-4 h-4" />
            </button>
          )}

          <div className="relative p-6">
            {/* Icon */}
            <div className="relative mx-auto w-16 h-16 mb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full blur-xl opacity-40" />
              <div className="relative bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full w-full h-full flex items-center justify-center shadow-lg">
                <FaBell className="text-2xl text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <TbSparkles className="text-yellow-400 text-lg" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Stay on Track with SRS
            </h2>

            {/* Description */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
              You have{' '}
              <span className="font-semibold text-[#667eea]">
                {srsSetCount} {srsSetCount === 1 ? 'set' : 'sets'}
              </span>{' '}
              with spaced repetition enabled. Get notified when items are due
              for review so you never miss a study session.
            </p>

            {/* Feature highlight */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#667eea]/10 border border-[#667eea]/20 mb-5">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#667eea]/20 flex items-center justify-center">
                <FaClock className="text-[#667eea] text-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  We&apos;ll send a gentle reminder when your reviews are ready
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="relative w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enabling...
                    </>
                  ) : (
                    <>
                      <FaBell className="text-lg" />
                      Enable Notifications
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#764ba2] to-[#667eea] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {!isLoading && (
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  Maybe Later
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
