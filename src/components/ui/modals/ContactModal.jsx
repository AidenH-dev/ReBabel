import { useState } from 'react';
import BaseModal from '@/components/ui/BaseModal';
import { FiMail, FiAlertCircle } from 'react-icons/fi';

export default function ContactModal({ isOpen, onClose }) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const copyEmail = async () => {
    await navigator.clipboard.writeText('rebabel.development@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      zIndex={60}
      title="Contact Us"
      className="dusk:bg-[#2a3444] dusk:border-[#3a4556]"
      headerClassName="dusk:border-[#3a4556]"
    >
      <div className="p-4 space-y-4 text-sm text-gray-700 dark:text-gray-300 dusk:text-[#a8b2c1]">
        <p>Need help or have feedback? We&apos;d love to hear from you.</p>
        <div className="space-y-2">
          <button
            onClick={copyEmail}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 dusk:border-[#3a4556] hover:bg-gray-50 dark:hover:bg-gray-800 dusk:hover:bg-[#171c26] transition-colors text-left"
          >
            <FiMail className="text-brand-pink" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white dusk:text-[#e8e0d8] text-sm">
                Email
              </p>
              <p className="text-xs text-gray-500 truncate">
                {copiedEmail
                  ? 'Copied to clipboard!'
                  : 'rebabel.development@gmail.com'}
              </p>
            </div>
          </button>
          <button
            onClick={() => {
              onClose();
              window.dispatchEvent(new Event('open-report-issue'));
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 dusk:border-[#3a4556] hover:bg-gray-50 dark:hover:bg-gray-800 dusk:hover:bg-[#171c26] transition-colors text-left"
          >
            <FiAlertCircle className="text-brand-pink" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white dusk:text-[#e8e0d8] text-sm">
                Report an Issue
              </p>
              <p className="text-xs text-gray-500">Found a bug? Let us know</p>
            </div>
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
