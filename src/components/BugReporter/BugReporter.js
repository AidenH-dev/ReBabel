// Implements SPEC-LLM-UI-001 through SPEC-LLM-UI-010
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaBug } from 'react-icons/fa';
import { useConsoleErrorCapture } from '@/hooks/useConsoleErrorCapture';
import { useFetchLogger } from '@/hooks/useFetchLogger';
import { useActionTrail } from '@/hooks/useActionTrail';
import { useBugReporterContext } from '@/contexts/BugReporterContext';
import { usePremium } from '@/contexts/PremiumContext';
import { useTheme } from '@/contexts/ThemeContext';

// Route-to-source-file mapping utility
function pathnameToSourceFile(pathname) {
  if (!pathname) return null;
  const normalized = pathname
    .replace(/\/[0-9a-f]{8,}/gi, '/[id]') // UUIDs
    .replace(/\/\d+/g, '/[id]'); // numeric IDs
  return `src/pages${normalized === '/' ? '/index' : normalized}.js`;
}

// Implements SPEC-LLM-UI-003: gather auto-context from the browser environment
function gatherContext({
  consoleErrors,
  networkRequests,
  actionTrail,
  appState,
  errorBoundary,
}) {
  const pathname =
    typeof window !== 'undefined' ? window.location.pathname : '';
  return {
    url: typeof window !== 'undefined' ? window.location.href : '',
    route: pathname,
    sourceFile: pathnameToSourceFile(pathname),
    viewport:
      typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : {},
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    consoleErrors: consoleErrors || [],
    timestamp: new Date().toISOString(),
    networkRequests: networkRequests || [],
    actionTrail: actionTrail || [],
    appState: appState || null,
    errorBoundary: errorBoundary || null,
  };
}

// Implements SPEC-LLM-UI-001: BugReporter component
export default function BugReporter() {
  // Implements SPEC-LLM-UI-002: start hidden, fetch permission on mount
  const [allowed, setAllowed] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('cosmetic');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Implements SPEC-LLM-UI-010: capture console errors
  const consoleErrorsRef = useConsoleErrorCapture();
  const fetchLogsRef = useFetchLogger();
  const actionTrailRef = useActionTrail();

  // Bug reporter context for error boundary communication
  const { errorData, setErrorData, openReporterRef } = useBugReporterContext();

  // Get app state from contexts
  const premiumState = usePremium();
  const themeState = useTheme();

  const openModal = useCallback(() => {
    setModalOpen(true);
    setSuccessData(null);
    setTitle('');
    setDescription('');
    setSeverity(errorData ? 'crash' : 'cosmetic');
    setIncludeScreenshot(true);
  }, [errorData]);

  // Register openModal with context so error boundary can trigger it
  useEffect(() => {
    openReporterRef.current = openModal;
    return () => {
      openReporterRef.current = null;
    };
  }, [openModal, openReporterRef]);

  // Implements SPEC-LLM-UI-002: fetch permission on mount
  useEffect(() => {
    fetch('/api/bug-reporter/permission')
      .then((r) => r.json())
      .then((data) => setAllowed(Boolean(data.allowed)))
      .catch(() => setAllowed(false));
  }, []);

  // Implements SPEC-LLM-UI-002: render nothing if not allowed or still loading
  if (!allowed) return null;

  const canSubmit = title.trim().length > 0 && description.trim().length > 0;

  function closeModal() {
    setModalOpen(false);
    setSuccessData(null);
    setTitle('');
    setDescription('');
    setSeverity('cosmetic');
    setIncludeScreenshot(true);
    // Clear error data when closing
    if (errorData) setErrorData(null);
  }

  // Implements SPEC-LLM-UI-007: submit report
  async function handleSubmit() {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);

    try {
      let screenshot = null;

      // Implements SPEC-LLM-UI-007: capture screenshot if enabled
      if (includeScreenshot) {
        try {
          const html2canvas = (await import('html2canvas')).default;
          const canvas = await html2canvas(document.body);
          const dataUrl = canvas.toDataURL('image/png');
          screenshot = dataUrl.replace(/^data:image\/png;base64,/, '');
        } catch {
          screenshot = null;
        }
      }

      const appState = {};
      if (themeState) appState.theme = themeState.theme;
      if (premiumState) {
        appState.isPremium = premiumState.isPremium;
        appState.sessionsUsedToday = premiumState.sessionsUsedToday;
        appState.canStartSession = premiumState.canStartSession;
        appState.dailyLimit = premiumState.dailyLimit;
      }

      const context = gatherContext({
        consoleErrors: consoleErrorsRef.current,
        networkRequests: fetchLogsRef.current,
        actionTrail: actionTrailRef.current,
        appState: Object.keys(appState).length > 0 ? appState : null,
        errorBoundary: errorData,
      });

      const res = await fetch('/api/bug-reporter/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          severity,
          screenshot,
          context,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      // Implements SPEC-LLM-UI-008: show success message
      setSuccessData(data);

      // Auto-close after 3 seconds
      setTimeout(() => {
        closeModal();
      }, 3000);
    } catch {
      // Keep modal open on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Implements SPEC-LLM-UI-003: floating bug button */}
      <button
        data-testid="bug-reporter-button"
        onClick={openModal}
        aria-label="Report a bug"
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 9999,
        }}
        className="
          flex items-center justify-center
          w-10 h-10 rounded-full
          bg-black/20 backdrop-blur-sm
          border border-white/20
          text-white text-lg
          hover:bg-black/30
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-white/50
        "
      >
        <FaBug />
      </button>

      {/* Implements SPEC-LLM-UI-004: modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bug report form"
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-lg rounded-xl bg-surface-card shadow-2xl border border-border-default max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-surface-card border-b border-border-default px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Report a Bug
              </h2>
              <button
                data-testid="bug-close-button"
                onClick={closeModal}
                aria-label="Close"
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Implements SPEC-LLM-UI-008: success state */}
              {successData ? (
                <div
                  data-testid="bug-success-message"
                  className="text-center py-6 space-y-3"
                >
                  <div className="text-4xl">✓</div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    Bug report submitted!
                  </p>
                  <a
                    href={successData.issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm text-blue-600 dark:text-blue-400 underline"
                  >
                    View issue #{successData.issueNumber}
                  </a>
                </div>
              ) : (
                <>
                  {/* Implements SPEC-LLM-UI-005: Title field */}
                  <div>
                    <label
                      htmlFor="bug-title"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="bug-title"
                      data-testid="bug-title-input"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Short summary of the bug"
                      className="w-full bg-surface-deep text-gray-900 dark:text-white px-3 py-2 rounded-lg text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-brand-pink"
                    />
                  </div>

                  {/* Implements SPEC-LLM-UI-005: Description field */}
                  <div>
                    <label
                      htmlFor="bug-description"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="bug-description"
                      data-testid="bug-description-input"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What happened? What did you expect?"
                      rows={4}
                      className="w-full bg-surface-deep text-gray-900 dark:text-white px-3 py-2 rounded-lg text-sm border border-border-default focus:outline-none focus:ring-2 focus:ring-brand-pink resize-none"
                    />
                  </div>

                  {/* Implements SPEC-LLM-UI-005: Severity radio buttons */}
                  <div>
                    <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Severity
                    </p>
                    <div className="flex gap-4">
                      {['cosmetic', 'broken', 'crash'].map((s) => (
                        <label
                          key={s}
                          className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300 capitalize"
                        >
                          <input
                            type="radio"
                            name="severity"
                            value={s}
                            checked={severity === s}
                            onChange={() => setSeverity(s)}
                            className="accent-brand-pink"
                          />
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Implements SPEC-LLM-UI-005: Screenshot checkbox */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        data-testid="screenshot-checkbox"
                        checked={includeScreenshot}
                        onChange={(e) => setIncludeScreenshot(e.target.checked)}
                        className="accent-brand-pink"
                      />
                      Include screenshot
                    </label>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      data-testid="bug-cancel-button"
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-border-default text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      data-testid="bug-submit-button"
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canSubmit || isSubmitting}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-brand-pink text-white hover:bg-brand-pink transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-pink"
                    >
                      {isSubmitting ? 'Submitting…' : 'Submit Report'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
