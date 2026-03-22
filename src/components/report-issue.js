import React, { useState, useEffect } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { clientLog } from '@/lib/clientLogger';
import BaseModal from '@/components/ui/BaseModal';

function ReportIssueButton() {
  const [open, setOpen] = useState(false);

  // Allow opening the report modal from anywhere via custom event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-report-issue', handler);
    return () => window.removeEventListener('open-report-issue', handler);
  }, []);
  const [formData, setFormData] = useState({
    location: '',
    feature: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setFormData({
      location: '',
      feature: '',
      description: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.location || !formData.feature) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the request payload matching the API endpoint requirements
      const now = new Date();
      const timestamp = now.toISOString().replace('T', ' ').replace('Z', '+00');

      const payload = {
        time_submitted: timestamp,
        browser_type: navigator.userAgent || null,
        form_json: {
          bug_location: formData.location,
          bugged_feature: formData.feature,
          user_details: formData.description || '',
        },
      };

      // Submit to the API endpoint
      const response = await fetch(
        '/api/database/v2/report/submit-bug-report',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit bug report');
      }

      handleClose();
      alert('Thank you! Your issue report has been submitted.');
    } catch (err) {
      clientLog.error('report_issue.submit_failed', {
        error: err?.message || String(err),
      });
      alert(
        err instanceof Error
          ? err.message
          : "Couldn't send your report right now. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpen}
        className="
          hidden lg:flex group fixed bottom-4 right-4 sm:right-6 z-50 items-center rounded-full
          bg-red-600/20 backdrop-blur-sm border-2 border-red-600/60 px-3 py-2
          text-red-600 dark:text-red-400 shadow-lg transition-all duration-200
          hover:bg-red-600/30 hover:border-red-500 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2
        "
        aria-label="Report Issue"
      >
        <FiAlertTriangle className="text-lg" />
        <span
          className="
            ml-0 max-w-0 overflow-hidden whitespace-nowrap transition-all duration-200
            group-hover:ml-2 group-hover:max-w-xs font-medium text-sm
          "
        >
          Report Issue
        </span>
      </button>

      {/* Modal */}
      <BaseModal
        isOpen={open}
        onClose={handleClose}
        size="2xl"
        title="Report an Issue"
        subtitle="Help us improve by reporting bugs and issues!"
        zIndex={60}
        blur
        stickyHeader
        maxHeight="90vh"
      >
        {/* Form Content */}
        <div className="px-6 py-5 space-y-2">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Where did you encounter this issue?{' '}
              <span className="text-brand-pink">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Flashcards, Quiz, Sets..."
              className="w-full bg-surface-deep text-gray-900 dark:text-white px-3 py-2.5 rounded-lg text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-brand-pink placeholder-gray-400 dark:placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5">
              Be specific about where on the page
            </p>
          </div>

          {/* Feature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What feature seems to be broken?{' '}
              <span className="text-brand-pink">*</span>
            </label>
            <input
              type="text"
              name="feature"
              value={formData.feature}
              onChange={handleInputChange}
              placeholder="e.g., Card flip, Answer submission..."
              className="w-full bg-surface-deep text-gray-900 dark:text-white px-3 py-2.5 rounded-lg text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-brand-pink placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Additional Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Details
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="What happened? Steps to reproduce..."
              rows={2}
              className="w-full bg-surface-deep text-gray-900 dark:text-white px-3 py-2.5 rounded-lg text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-brand-pink resize-none placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row sm:flex-row items-center gap-2 sm:gap-3 pt-4 border-t border-border-default">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-border-default text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-brand-pink text-white hover:bg-brand-pink-hover transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-pink focus:ring-offset-2"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Submitting...
                </span>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}

export default ReportIssueButton;
