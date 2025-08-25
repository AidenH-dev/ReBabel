// /src/components/create-set/Learning_materialInfoForm.js

import React from "react";

export default function Learning_materialInfoForm({ learning_materialInfo, onChange, onNext }) {
  // Updated validation - only requires title now
  const canProceed = Boolean(learning_materialInfo.title);

  return (
    <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Learning Material Information
      </h2>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learning_material Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Learning Material Title *
            </label>
            <input
              type="text"
              value={learning_materialInfo.title}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="e.g., Japanese 102 - Spring 2025"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent"
            />
          </div>

          {/* Institution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Institution
            </label>
            <select
              value={learning_materialInfo.institution}
              onChange={(e) => onChange("institution", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent"
            >
              <option value="Self-Study">Self-Study</option>
              <option value="University">University</option>
              <option value="Language School">Language School</option>
              <option value="Online Learning_material">Online Learning_material</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Study Goal */}

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={learning_materialInfo.startDate}
              onChange={(e) => onChange("startDate", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target End Date
            </label>
            <input
              type="date"
              value={learning_materialInfo.endDate}
              onChange={(e) => onChange("endDate", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Study Goal
          </label>
          <input
            type="text"
            value={learning_materialInfo.studyGoal}
            onChange={(e) => onChange("studyGoal", e.target.value)}
            placeholder="e.g., Complete by semester end"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={learning_materialInfo.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Add any notes about this learning material..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end mt-8">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${canProceed
              ? "bg-gradient-to-r from-[#e30a5f] to-[#f41567] text-white hover:shadow-lg"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
        >
          Next: Add Sections
        </button>
      </div>
    </div>
  );
}