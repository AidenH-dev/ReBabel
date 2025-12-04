import { FaArrowLeft } from "react-icons/fa6";
import { parseFormJson } from '../models/bugReportDataModel';
import { formatDate } from '../models/bugReportFormatters';

export const BugReportDetails = ({ report, onClose }) => {
  if (!report) return null;

  const formData = parseFormJson(report.properties?.form_json);

  return (
    <div className="bg-white dark:bg-[#1c2b35] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-gray-50 to-white dark:from-[#0f1619] dark:to-[#172229] border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">


        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 flex-1 ml-1">
          <div className="inline-flex items-center gap-1.5 mr-2">
            <button onClick={onClose} className="inline-flex items-center gap-1 py-0.5 px-1.5  border-2 border-[#e30a5f] text-[#e30a5f] hover:bg-[#e30a5f]/10 dark:hover:bg-[#e30a5f]/20 rounded-lg transition-colors" title="Back to table">
              <FaArrowLeft className="text-base" />
              Back
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">ID</span>
            <span className="text-xs text-gray-700 dark:text-gray-300 font-mono bg-gray-100 dark:bg-[#1c2b35] px-2 py-1 rounded max-w-fit">{report.entity_id}</span>
          </div>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Submitted</span>
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {formatDate(report.properties?.time_submitted)}
            </span>
          </div>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Email</span>
            <span className="text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#1c2b35] px-2 py-1 rounded">{report.properties?.user_email || 'N/A'}</span>
          </div>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Browser</span>
            <span className="text-xs text-[#e30a5f] bg-[#e30a5f]/10 dark:bg-[#e30a5f]/20 px-2 py-1 rounded font-medium">{report.properties?.browser_type || 'Unknown'}</span>
          </div>
        </div>
      </div>

      {/* Report Details */}
      <div className="px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bug Report Details</h3>
        <div className="space-y-4">
          {formData.bug_location && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Bug Location
              </label>
              <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-[#0f1619] px-4 py-2 rounded border border-gray-200 dark:border-gray-700">
                {formData.bug_location}
              </p>
            </div>
          )}

          {formData.bugged_feature && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Affected Feature
              </label>
              <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-[#0f1619] px-4 py-2 rounded border border-gray-200 dark:border-gray-700">
                {formData.bugged_feature}
              </p>
            </div>
          )}

          {formData.user_details && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-[#0f1619] px-4 py-2 rounded border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">
                {formData.user_details}
              </p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};
