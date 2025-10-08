import React, { useState, useEffect } from "react";
import posthog from "posthog-js";
import { FiAlertTriangle, FiX, FiUpload } from "react-icons/fi";

function ReportIssueButton() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    location: "",
    feature: "",
    description: "",
  });
  const [screenshot, setScreenshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Fetch Auth0 user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const profile = await response.json();
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    fetchUserProfile();
  }, []);

  const handleOpen = () => setOpen(true);
  
  const handleClose = () => {
    setOpen(false);
    setFormData({
      location: "",
      feature: "",
      description: "",
    });
    setScreenshot(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 10 * 1024 * 1024) { // 10MB limit
      setScreenshot(file);
    } else if (file) {
      alert("File size must be less than 10MB");
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.location || !formData.feature ) {
      alert("Please fill in all required fields and upload a screenshot");
      return;
    }

    if (!userProfile?.email) {
      alert("Unable to retrieve user information. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert screenshot to base64 if present
      let screenshotData = null;
      if (screenshot) {
        const reader = new FileReader();
        screenshotData = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(screenshot);
        });
      }

      posthog.capture("bug_report", {
        name: userProfile.name || userProfile.email || "Unknown User",
        email: userProfile.email,
        location: formData.location,
        feature: formData.feature,
        description: formData.description || "(no additional description)",
        has_screenshot: !!screenshot,
        screenshot_name: screenshot?.name,
        url: typeof window !== "undefined" ? window.location.href : "",
        session_id: posthog.get_session_id?.(),
        viewport: typeof window !== "undefined"
          ? { w: window.innerWidth, h: window.innerHeight }
          : null,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      handleClose();
      alert("Thank you! Your issue report has been submitted.");
    } catch (err) {
      console.error("Failed to send bug_report", err);
      alert("Couldn't send your report right now. Please try again.");
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
          group fixed bottom-4 right-4 sm:right-6 z-50 flex items-center rounded-full
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
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-[#1c2b35] shadow-2xl border border-black/5 dark:border-white/10 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-[#1c2b35] border-b border-black/5 dark:border-white/10 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Report an Issue
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Help us improve by reporting bugs and issues!
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="px-6 py-5 space-y-2">
              {/* User Info Display (if available) */}
              {userProfile && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    <strong>Reporting as:</strong> {userProfile.name || userProfile.email}
                  </p>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Where did you encounter this issue? <span className="text-[#e30a5f]">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Flashcards, Quiz, Sets..."
                  className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2.5 rounded-lg text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f] placeholder-gray-400 dark:placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5">
                  Be specific about where on the page
                </p>
              </div>

              {/* Feature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What feature seems to be broken? <span className="text-[#e30a5f]">*</span>
                </label>
                <input
                  type="text"
                  name="feature"
                  value={formData.feature}
                  onChange={handleInputChange}
                  placeholder="e.g., Card flip, Answer submission..."
                  className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2.5 rounded-lg text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f] placeholder-gray-400 dark:placeholder-gray-500"
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
                  className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2.5 rounded-lg text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f] resize-none placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Screenshot Upload 
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Screenshot
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  <label
                    htmlFor="screenshot-upload"
                    className="flex items-center justify-center gap-2 w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-3 rounded-lg text-xs sm:text-sm border-2 border-dashed border-black/10 dark:border-white/10 hover:border-[#e30a5f] dark:hover:border-[#e30a5f] cursor-pointer transition-colors"
                  >
                    <FiUpload className="text-base sm:text-lg flex-shrink-0" />
                    <span className="truncate">{screenshot ? screenshot.name : "Click to upload screenshot"}</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5">
                    Max 10MB. PNG, JPG, GIF
                  </p>
                </div>
              </div>*/}

              {/* Action Buttons */}
              <div className="flex flex-row sm:flex-row items-center gap-2 sm:gap-3 pt-4 border-t border-black/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#e30a5f] text-white hover:bg-[#f41567] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#e30a5f] focus:ring-offset-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Submitting...
                    </span>
                  ) : (
                    "Submit Report"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ReportIssueButton;