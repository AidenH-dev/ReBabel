import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { TbBell, TbLoader3, TbClock, TbFlame } from 'react-icons/tb';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      <div className="relative w-full sm:max-w-[400px] sm:mx-4">
        <div className="bg-surface-card sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4">
            {/* Faint bell watermark */}
            <div
              className="absolute top-3 right-5 select-none pointer-events-none"
              aria-hidden="true"
            >
              <TbBell className="w-20 h-20 text-gray-100 dark:text-white/[0.03]" />
            </div>

            {!isLoading && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                aria-label="Close"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            )}

            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-brand-pink/10 dark:bg-brand-pink/15 flex items-center justify-center mb-3">
                <TbBell className="w-5.5 h-5.5 text-brand-pink" />
              </div>
              <h2 className="text-[20px] font-bold text-gray-900 dark:text-white leading-tight mb-1">
                Never miss a review
              </h2>
              <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed">
                You have{' '}
                <span className="font-semibold text-brand-pink">
                  {srsSetCount} {srsSetCount === 1 ? 'set' : 'sets'}
                </span>{' '}
                using spaced repetition. Get a nudge when items are ready for
                review.
              </p>
            </div>
          </div>

          {/* Feature cards */}
          <div className="px-6 space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-pink/5 dark:bg-brand-pink/8 border border-brand-pink/10 dark:border-brand-pink/15">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-pink/10 dark:bg-brand-pink/15 flex items-center justify-center">
                <TbClock className="w-4 h-4 text-brand-pink" />
              </div>
              <p className="text-[13px] text-gray-600 dark:text-gray-400">
                Reminders when your reviews are due
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 dark:bg-orange-500/8 border border-orange-500/10 dark:border-orange-500/15">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center">
                <TbFlame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              </div>
              <p className="text-[13px] text-gray-600 dark:text-gray-400">
                Keep your streak alive with timely nudges
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pt-5 pb-6 space-y-2.5">
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold text-white bg-gradient-to-r from-brand-pink to-[#d10950] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-brand-pink/20"
            >
              {isLoading ? (
                <TbLoader3 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <TbBell className="w-4.5 h-4.5" />
              )}
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </button>

            {!isLoading && (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Not now
              </button>
            )}
          </div>

          {/* Bottom safe area for mobile */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </div>
  );
}
